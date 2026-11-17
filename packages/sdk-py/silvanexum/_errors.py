"""Typed error hierarchy. Catch ``SilvanexumError`` for any API failure."""
from __future__ import annotations

from typing import Any, Optional


class SilvanexumError(Exception):
    """Base error for all SDK failures."""

    def __init__(
        self,
        message: str,
        *,
        status: Optional[int] = None,
        code: Optional[str] = None,
        body: Optional[dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.body = body
        self.request_id = request_id


class APIConnectionError(SilvanexumError):
    """The request never reached the API (network/DNS/abort)."""


class APITimeoutError(APIConnectionError):
    """The request exceeded the configured timeout."""


class AuthenticationError(SilvanexumError):
    """401 — missing or invalid API key."""


class PermissionError(SilvanexumError):  # noqa: A001 - intentional API name
    """403 — the key lacks the required scope."""


class NotFoundError(SilvanexumError):
    """404."""


class ValidationError(SilvanexumError):
    """400 / 422 — the request body or params failed validation."""


class RateLimitError(SilvanexumError):
    """429 — too many requests."""


class InsufficientCreditsError(SilvanexumError):
    """402 — not enough credits to settle the operation."""


class InternalServerError(SilvanexumError):
    """5xx."""


def error_from_response(
    status: int, body: Optional[dict[str, Any]], request_id: Optional[str]
) -> SilvanexumError:
    """Map an HTTP status + body to the most specific error class."""
    message = ""
    if body:
        message = body.get("message") or body.get("error") or ""
    if not message:
        message = f"Silvanexum API error (HTTP {status})"
    kwargs = {
        "status": status,
        "code": (body or {}).get("code"),
        "body": body,
        "request_id": request_id,
    }
    if status in (400, 422):
        return ValidationError(message, **kwargs)
    if status == 401:
        return AuthenticationError(message, **kwargs)
    if status == 402:
        return InsufficientCreditsError(message, **kwargs)
    if status == 403:
        return PermissionError(message, **kwargs)
    if status == 404:
        return NotFoundError(message, **kwargs)
    if status == 429:
        return RateLimitError(message, **kwargs)
    if status >= 500:
        return InternalServerError(message, **kwargs)
    return SilvanexumError(message, **kwargs)
