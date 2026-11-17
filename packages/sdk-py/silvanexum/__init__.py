"""Official Python SDK for Silvanexum — the proof-ranked agent platform.

All request/response models are GENERATED from the API's Zod contracts (see
packages/codegen) and exposed under ``silvanexum.models``, so they can never
drift from the live API.
"""
from __future__ import annotations

from . import _generated as models
from ._client import Silvanexum
from ._errors import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    InsufficientCreditsError,
    InternalServerError,
    NotFoundError,
    PermissionError,
    RateLimitError,
    SilvanexumError,
    ValidationError,
)
from ._meter import BudgetExceededError, usage_from_response

__version__ = "0.3.0"

__all__ = [
    "APIConnectionError",
    "APITimeoutError",
    "AuthenticationError",
    "BudgetExceededError",
    "InsufficientCreditsError",
    "InternalServerError",
    "NotFoundError",
    "PermissionError",
    "RateLimitError",
    "Silvanexum",
    "SilvanexumError",
    "ValidationError",
    "__version__",
    "models",
    "usage_from_response",
]
