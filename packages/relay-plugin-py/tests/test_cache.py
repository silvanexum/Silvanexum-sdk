"""TTL cache tests with a controllable clock."""
from __future__ import annotations

from silvanexum_relay._cache import TTLCache


class FakeClock:
    def __init__(self) -> None:
        self.t = 0.0

    def __call__(self) -> float:
        return self.t


def test_hit_within_ttl_then_expiry():
    clock = FakeClock()
    cache = TTLCache(2.0, clock=clock)
    cache.set(("a", "c", "gpt-4o"), "blocked message")
    assert cache.get(("a", "c", "gpt-4o")) == "blocked message"
    clock.t = 1.9
    assert cache.get(("a", "c", "gpt-4o")) == "blocked message"  # still fresh
    clock.t = 2.0
    assert cache.get(("a", "c", "gpt-4o")) is None  # expired at ttl boundary


def test_empty_string_value_is_cacheable_and_distinct_from_miss():
    cache = TTLCache(5.0, clock=FakeClock())
    cache.set(("a", None, "m"), "")  # "" encodes an allowed verdict
    assert cache.get(("a", None, "m")) == ""  # a hit, not a miss
    assert cache.get(("other",)) is None  # a real miss


def test_zero_ttl_disables_caching():
    cache = TTLCache(0.0, clock=FakeClock())
    cache.set(("k",), "v")
    assert cache.get(("k",)) is None


def test_clear():
    cache = TTLCache(5.0, clock=FakeClock())
    cache.set(("k",), "v")
    cache.clear()
    assert cache.get(("k",)) is None
