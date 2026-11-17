"""NAT registration for the Silvanexum telemetry exporter.

Importing this module (NAT does so via the ``nat.plugins`` entry point declared
in ``pyproject.toml``) registers a ``silvanexum`` telemetry exporter that any
workflow can enable from YAML::

    general:
      telemetry:
        tracing:
          silvanexum:
            _type: silvanexum
            enforce_budget: true

Heavy imports (the exporter class, which pulls in ``nat`` observability and the
Silvanexum client) are deferred into the registration function so merely
importing this module at startup stays cheap, per NAT's plugin guidance.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from nat.plugin_api import Builder, TelemetryExporterBaseConfig, register_telemetry_exporter
from pydantic import Field

logger = logging.getLogger("silvanexum_nat")

#: Env var the Silvanexum SDK itself reads; we surface it as the config default
#: so a workflow can omit ``api_key`` and rely on the environment.
_API_KEY_ENV = "SILVANEXUM_API_KEY"
_BASE_URL_ENV = "SILVANEXUM_BASE_URL"


# `name=` is NAT's registration kwarg, consumed by the config base's
# __init_subclass__; mypy can't see that through the (untyped) NAT metaclass.
class SilvanexumTelemetryExporter(TelemetryExporterBaseConfig, name="silvanexum"):  # type: ignore[call-arg]
    """Config for the ``silvanexum`` exporter (``_type: silvanexum``).

    Per-agent and per-customer cost tracking plus optional budget pre-flight,
    priced server-side from Silvanexum's model table (Nemotron included).
    """

    api_key: Optional[str] = Field(
        default=None,
        description=f"Silvanexum API key. Defaults to the {_API_KEY_ENV} environment variable.",
    )
    base_url: Optional[str] = Field(
        default=None,
        description=f"Silvanexum API base URL. Defaults to {_BASE_URL_ENV} or https://api.silvanexum.com.",
    )
    agent: Optional[str] = Field(
        default=None,
        description="Agent name to attribute spend to. Defaults to the workflow name.",
    )
    customer: Optional[str] = Field(
        default=None,
        description="Customer/tenant to attribute spend to (static value).",
    )
    provider: Optional[str] = Field(
        default=None,
        description=(
            "Force the Silvanexum provider for every call "
            "(openai|anthropic|google|nvidia|nim|other). "
            "If unset, the provider is inferred from the model name."
        ),
    )
    enforce_budget: bool = Field(
        default=False,
        description=(
            "Pre-flight each LLM call against Silvanexum budgets. NOTE: a NAT "
            "telemetry exporter observes calls and cannot abort one, so a breach "
            "is flagged and logged, not hard-blocked. See the README."
        ),
    )
    batch_size: int = Field(default=50, ge=1, description="Flush after this many events.")
    flush_interval_s: float = Field(
        default=5.0,
        ge=0.0,
        description="Also flush when this many seconds have elapsed since the last flush.",
    )
    timeout_s: float = Field(
        default=5.0,
        gt=0.0,
        description=(
            "Per-request timeout for Silvanexum calls, in seconds. Kept short so a "
            "slow/unreachable Silvanexum can't stall the agent (calls run off the loop)."
        ),
    )
    max_retries: int = Field(
        default=0,
        ge=0,
        description="Silvanexum client retry count. 0 keeps telemetry fast-fail.",
    )


@register_telemetry_exporter(config_type=SilvanexumTelemetryExporter)
async def silvanexum_telemetry_exporter(config: SilvanexumTelemetryExporter, builder: Builder):
    """Build the Silvanexum exporter from its YAML config.

    Must never raise: a misconfigured exporter (no API key, a bad base URL) has
    to degrade to a disabled no-op, not crash the workflow at startup.
    """
    # Lazy, per NAT plugin guidance: keep startup cheap when this exporter is off.
    from silvanexum import Silvanexum, SilvanexumError

    from .exporter import SilvanexumExporter

    agent = config.agent or _workflow_name(builder) or "nat-workflow"

    # Build the client defensively. A missing key makes Silvanexum(...) raise
    # right here (HttpClient requires a key), so catch it and run disabled rather
    # than letting the whole NAT workflow fail to start.
    client: Optional[Silvanexum] = None
    api_key = config.api_key or os.environ.get(_API_KEY_ENV)
    if not api_key:
        logger.warning(
            "silvanexum_nat: no API key (set %s or the exporter's api_key); "
            "the exporter is DISABLED and will drop events (the workflow runs normally).",
            _API_KEY_ENV,
        )
    else:
        try:
            client = Silvanexum(
                api_key=api_key,
                base_url=config.base_url,
                timeout=config.timeout_s,
                max_retries=config.max_retries,
            )
        except SilvanexumError as ex:
            logger.warning(
                "silvanexum_nat: could not build the Silvanexum client (%s); "
                "the exporter is DISABLED and will drop events.",
                ex,
            )

    exporter = SilvanexumExporter(
        client=client,
        agent=agent,
        customer=config.customer,
        provider_override=config.provider,
        enforce_budget=config.enforce_budget,
        batch_size=config.batch_size,
        flush_interval_s=config.flush_interval_s,
    )
    try:
        yield exporter
    finally:
        if client is not None:
            client.close()


def _workflow_name(builder: Builder) -> Optional[str]:
    """Best-effort workflow name for the default ``agent`` attribution.

    The exact attribute isn't part of the stable ``Builder`` facade, so probe a
    couple of likely names and fall back to ``None`` (the caller then uses a
    generic default). Never raises.
    """
    for attr in ("workflow_name", "name"):
        try:
            value = getattr(builder, attr, None)
        except Exception:  # noqa: BLE001
            value = None
        if isinstance(value, str) and value:
            return value
    return None
