"""Silvanexum plugin for NVIDIA NeMo Relay.

A Relay ``grpc-v1`` worker plugin (component kind ``silvanexum``) that meters
every LLM call to Silvanexum — the spend-control plane for AI agents — for
server-side pricing and per-agent / per-customer attribution, and can **reject
an LLM call before it runs** when a budget is exhausted (an LLM
conditional-execution guardrail).

Enable it in ``plugins.toml``::

    [[components]]
    kind = "silvanexum"
    [components.config]
    enforce_budget = true

See the package README for the config reference and the pricing catalog.
"""
from __future__ import annotations

__version__ = "0.1.0"

__all__ = ["__version__"]
