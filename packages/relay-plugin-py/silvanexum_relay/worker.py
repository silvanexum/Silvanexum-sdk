"""NeMo Relay worker entrypoint for the Silvanexum plugin.

Relay starts this worker as an out-of-process ``grpc-v1`` plugin (see the
package's ``relay-plugin.toml``). ``main`` is the async entrypoint the manifest
imports; it hands a :class:`SilvanexumPlugin` to ``serve_plugin``, which runs an
AsyncIO gRPC server until Relay shuts it down, then drains any buffered events.

The plugin registers, per activated ``silvanexum`` component:

* a subscriber (metering), and
* when ``enforce_budget`` is set, an LLM conditional-execution guardrail
  (the hard budget block).
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Union

from nemo_relay_plugin import (
    ConfigDiagnostic,
    DiagnosticLevel,
    PluginContext,
    WorkerPlugin,
    serve_plugin,
)

from ._mapping import SILVANEXUM_PROVIDERS
from .plugin import PLUGIN_KIND, SilvanexumConfig, SilvanexumMeter

logger = logging.getLogger("silvanexum_relay")


class SilvanexumPlugin(WorkerPlugin):
    """Worker plugin that installs Silvanexum metering + optional budget block."""

    #: Must match ``plugin.id`` in ``relay-plugin.toml``.
    plugin_id = PLUGIN_KIND
    #: A deployment may enable several ``silvanexum`` components (e.g. per tenant).
    allows_multiple_components = True

    def __init__(self) -> None:
        #: Meters created during register(), drained on worker shutdown.
        self.meters: List[SilvanexumMeter] = []

    def validate(self, config: Any) -> List[Union[ConfigDiagnostic, Dict[str, Any]]]:
        """Validate one component's JSON config; returns Relay diagnostics."""
        diagnostics: List[Union[ConfigDiagnostic, Dict[str, Any]]] = []
        raw = config if isinstance(config, dict) else {}
        provider = raw.get("provider")
        if provider is not None and (
            not isinstance(provider, str) or provider.strip().lower() not in SILVANEXUM_PROVIDERS
        ):
            diagnostics.append(
                ConfigDiagnostic(
                    DiagnosticLevel.ERROR,
                    "silvanexum.provider.invalid",
                    f"provider must be one of {', '.join(SILVANEXUM_PROVIDERS)} if set; got {provider!r}",
                    component=PLUGIN_KIND,
                    field="provider",
                )
            )
        for num_field in ("batch_size", "flush_interval_s", "timeout_s", "budget_cache_ttl_s"):
            if num_field in raw and not _is_number(raw[num_field]):
                diagnostics.append(
                    ConfigDiagnostic(
                        DiagnosticLevel.ERROR,
                        "silvanexum.config.type",
                        f"{num_field} must be a number",
                        component=PLUGIN_KIND,
                        field=num_field,
                    )
                )
        return diagnostics

    def register(self, ctx: PluginContext, config: Any) -> None:
        """Install the subscriber and (optionally) the budget guardrail.

        Must never raise for a misconfiguration: a missing API key yields a
        disabled meter that drops events and never blocks.
        """
        cfg = SilvanexumConfig(config if isinstance(config, dict) else {})
        meter = SilvanexumMeter(cfg)
        self.meters.append(meter)

        ctx.register_subscriber("silvanexum-meter", meter.on_event)

        if cfg.enforce_budget:
            # Return None to allow, or a string reason to reject the LLM call
            # before it runs. This is the hard budget block.
            ctx.register_llm_conditional_execution_guardrail("silvanexum-budget", meter.check_allowed)
            if not meter.enabled:
                logger.warning(
                    "silvanexum_relay: enforce_budget is on but the plugin is disabled "
                    "(no API key); calls will NOT be blocked."
                )

    async def aclose(self) -> None:
        """Drain every meter's buffer; called after the worker server stops."""
        for meter in self.meters:
            try:
                await meter.aclose()
            except Exception as ex:  # noqa: BLE001
                logger.debug("silvanexum_relay: meter close raised (%s)", ex)


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


async def main() -> None:
    """Async entrypoint Relay imports from the manifest."""
    plugin = SilvanexumPlugin()
    try:
        await serve_plugin(plugin)
    finally:
        # Relay has no worker teardown callback on PluginContext, so drain here
        # once the server returns (graceful shutdown / cancellation).
        await plugin.aclose()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
