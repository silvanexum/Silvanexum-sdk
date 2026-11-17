"""A tiny monotonic TTL cache for budget-check verdicts.

The conditional-execution guardrail runs before every LLM call; without a cache
each call would pay a Silvanexum round trip. We cache the verdict per
(agent, customer, model) for a short TTL (default 2s) so a burst of calls shares
one check. Verdicts are cheap and short-lived, so a plain dict with lazy expiry
is enough — no background eviction.
"""
from __future__ import annotations

import time
from typing import Any, Callable, Dict, Hashable, Optional, Tuple


class TTLCache:
    """Minimal TTL cache keyed by a hashable tuple. Not thread-safe by design:
    it's touched only from the single asyncio loop the guardrail runs on."""

    def __init__(self, ttl_s: float, *, clock: Callable[[], float] = time.monotonic) -> None:
        self._ttl = max(0.0, float(ttl_s))
        self._clock = clock
        self._store: Dict[Hashable, Tuple[float, Any]] = {}

    def get(self, key: Hashable) -> Optional[Any]:
        """Return the cached value if present and unexpired, else ``None``."""
        if self._ttl <= 0:
            return None
        hit = self._store.get(key)
        if hit is None:
            return None
        expires_at, value = hit
        if self._clock() >= expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: Hashable, value: Any) -> None:
        if self._ttl <= 0:
            return
        self._store[key] = (self._clock() + self._ttl, value)

    def clear(self) -> None:
        self._store.clear()
