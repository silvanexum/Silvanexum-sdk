"""The Silvanexum client."""
from __future__ import annotations

from typing import Optional

import httpx

from ._http import HttpClient
from ._meter import Meter
from .resources import (
    Agents,
    Billing,
    Bounties,
    Budgets,
    Certification,
    Connectors,
    Enterprise,
    Fleet,
    Gateway,
    Insurance,
    Keys,
    Marketplace,
    Mesh,
    Models,
    Overview,
    Proving,
    Routing,
    Runs,
    Security,
    Spending,
    Studio,
    Suites,
    Team,
    Templates,
    Wallet,
    Workforce,
)


class Silvanexum:
    """Entry point for the Silvanexum API.

    Example
    -------
    >>> from silvanexum import Silvanexum
    >>> sx = Silvanexum(api_key="sx_live_...")
    >>> run = sx.runs.create(agent_id=agent_id, prompt="Summarize this ticket.")
    >>> print(run.output, sx.runs.share_url(run.id))
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        *,
        base_url: Optional[str] = None,
        timeout: float = 60.0,
        max_retries: int = 2,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._http = HttpClient(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
            http_client=http_client,
        )
        self.agents = Agents(self._http)
        self.runs = Runs(self._http)
        self.templates = Templates(self._http)
        self.connectors = Connectors(self._http)
        self.marketplace = Marketplace(self._http)
        self.wallet = Wallet(self._http)
        self.suites = Suites(self._http)
        self.keys = Keys(self._http)
        self.models = Models(self._http)
        self.team = Team(self._http)
        self.overview = Overview(self._http)
        self.security = Security(self._http)
        self.proving = Proving(self._http)
        self.fleet = Fleet(self._http)
        self.routing = Routing(self._http)
        self.studio = Studio(self._http)
        self.workforce = Workforce(self._http)
        self.certification = Certification(self._http)
        self.enterprise = Enterprise(self._http)
        self.insurance = Insurance(self._http)
        self.bounties = Bounties(self._http)
        self.budgets = Budgets(self._http)
        self.spending = Spending(self._http)
        self.gateway = Gateway(self._http)
        #: SDK-only metering: report usage + budget pre-flight, no proxy in the path.
        self.meter = Meter(self._http)
        self.mesh = Mesh(self._http)
        self.billing = Billing(self._http)

    @property
    def base_url(self) -> str:
        return self._http.base_url

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "Silvanexum":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()
