"""Silvanexum cost-metering plugin for NVIDIA NeMo Agent Toolkit (NAT).

Registers a ``silvanexum`` telemetry exporter that reports each LLM call's token
usage to Silvanexum — the spend-control plane for AI agents — for server-side
pricing, per-agent / per-customer attribution and budget pre-flight.

Enable it from a NAT workflow's YAML::

    general:
      telemetry:
        tracing:
          silvanexum:
            _type: silvanexum
            enforce_budget: true

See the package README for the full config reference.
"""
from __future__ import annotations

__version__ = "0.1.0"

__all__ = ["__version__"]
