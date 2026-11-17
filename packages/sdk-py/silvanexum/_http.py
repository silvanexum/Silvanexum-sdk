"""Transport core: config, request building, retries, timeouts, error mapping."""
from __future__ import annotations

import math
import os
import time
from typing import Any, Mapping, Optional

import httpx

from ._errors import (
    APIConnectionError,
    APITimeoutError,
    RateLimitError,
    SilvanexumError,
    error_from_response,
)

DEFAULT_BASE_URL = "https://api.silvanexum.com"
_RETRYABLE = {408, 409, 429, 500, 502, 503, 504}
# HTTP-idempotent methods; a bare POST/PATCH is retried only when it carries an
# idempotency-key (else a transient failure could duplicate a run/hop/charge).
_IDEMPOTENT_METHODS = {"GET", "HEAD", "DELETE", "PUT"}
_VERSION = "0.3.0"


class HttpClient:
    """Thin, retrying HTTP client. One per ``Silvanexum`` instance."""

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 60.0,
        max_retries: int = 2,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        key = api_key or os.environ.get("SILVANEXUM_API_KEY")
        if not key:
            raise SilvanexumError(
                "Missing API key. Pass api_key=... or set the SILVANEXUM_API_KEY environment variable. Get a free key (read+run scopes) at https://silvanexum.com/signup"
            )
        self._api_key = key
        self.base_url = (base_url or os.environ.get("SILVANEXUM_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._client = http_client or httpx.Client(timeout=timeout)
        self._owns_client = http_client is None

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> "HttpClient":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Mapping[str, Any]] = None,
        json: Any = None,
        idempotency_key: Optional[str] = None,
        headers: Optional[Mapping[str, str]] = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        hdrs = {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "application/json",
            "User-Agent": f"silvanexum-sdk-python/{_VERSION}",
        }
        if headers:
            hdrs.update(headers)
        if idempotency_key:
            hdrs["idempotency-key"] = idempotency_key
        # Drop None-valued query params.
        clean_params = {k: v for k, v in (params or {}).items() if v is not None}

        # Only retry when a retry cannot duplicate a side effect.
        retriable = method.upper() in _IDEMPOTENT_METHODS or idempotency_key is not None
        max_retries = self._max_retries if retriable else 0

        last_err: Optional[SilvanexumError] = None
        for attempt in range(max_retries + 1):
            try:
                resp = self._client.request(
                    method, url, params=clean_params, json=json, headers=hdrs
                )
            except httpx.TimeoutException:
                last_err = APITimeoutError(f"Request timed out after {self._timeout}s.")
            except httpx.HTTPError as exc:
                last_err = APIConnectionError(f"Could not reach {self.base_url}. {exc}")
            else:
                request_id = resp.headers.get("x-request-id")
                if resp.is_success:
                    if resp.status_code == 204 or not resp.content:
                        return None
                    return resp.json()
                body = _safe_json(resp)
                err = error_from_response(resp.status_code, body, request_id)
                if resp.status_code in _RETRYABLE and attempt < max_retries:
                    last_err = err
                    time.sleep(_backoff(attempt, err))
                    continue
                raise err

            # Connection/timeout path:
            if attempt < max_retries:
                time.sleep(_backoff(attempt))
                continue
            raise last_err

        assert last_err is not None
        raise last_err


def _safe_json(resp: httpx.Response) -> Optional[dict[str, Any]]:
    try:
        data = resp.json()
        return data if isinstance(data, dict) else {"message": str(data)}
    except Exception:
        return None


def _backoff(attempt: int, err: Optional[SilvanexumError] = None) -> float:
    if isinstance(err, RateLimitError) and err.body:
        retry_after = err.body.get("retryAfter")
        try:
            if retry_after and float(retry_after) > 0:
                return float(retry_after)
        except (TypeError, ValueError):
            pass
    base = 0.5 * (2 ** attempt)
    jitter = base * 0.25 * (math.sin(attempt + 1) * 10000 % 1)
    return base + abs(jitter)
