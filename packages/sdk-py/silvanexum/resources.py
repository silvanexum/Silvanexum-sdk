"""Ergonomic, typed resource namespaces over the HTTP core.

Each method validates the API's JSON into the generated pydantic models
(``silvanexum._generated.models``), unwrapping the response envelope so callers
get the inner object(s) directly.
"""
from __future__ import annotations

from typing import Any, List, Optional

from pydantic import TypeAdapter

from . import _generated as m
from ._http import HttpClient

# Reusable list adapters (validate JSON arrays → typed lists).
_AgentList = TypeAdapter(List[m.AgentView])
_VersionList = TypeAdapter(List[m.AgentVersionView])
_ExecList = TypeAdapter(List[m.ExecutionView])
_RecentList = TypeAdapter(List[m.RecentExecution])
_ConnectorList = TypeAdapter(List[m.ConnectorView])
_ListingList = TypeAdapter(List[m.ListingCard])
_InstallList = TypeAdapter(List[m.InstallView])
_PayoutList = TypeAdapter(List[m.PayoutView])
_SuiteList = TypeAdapter(List[m.SuiteView])
_KeyList = TypeAdapter(List[m.ProviderKeyView])
_ModelList = TypeAdapter(List[m.ModelInfo])
_ProjectList = TypeAdapter(List[m.ProjectView])
_TemplateList = TypeAdapter(List[m.TemplateCard])
_MemberList = TypeAdapter(List[m.MemberView])
_AuditEntryList = TypeAdapter(List[m.AuditEntryView])
_ScanList = TypeAdapter(List[m.ScanResultView])
_LeaderboardList = TypeAdapter(List[m.LeaderboardEntryView])
_FleetSeriesList = TypeAdapter(List[m.FleetSeries])
_FleetAgentList = TypeAdapter(List[m.FleetAgentRow])
_FleetCostList = TypeAdapter(List[m.FleetCostRow])
_DriftList = TypeAdapter(List[m.DriftFlag])
_AlertList = TypeAdapter(List[m.AlertRuleView])
_AlertEventList = TypeAdapter(List[m.AlertEventView])
_DecisionList = TypeAdapter(List[m.RoutingDecisionView])
_BranchList = TypeAdapter(List[m.BranchView])
_RoleList = TypeAdapter(List[m.RoleView])
_AssignmentList = TypeAdapter(List[m.AssignmentView])
_EscalationList = TypeAdapter(List[m.EscalationView])
_CertificationList = TypeAdapter(List[m.CertificationView])
_SsoConnectionList = TypeAdapter(List[m.SsoConnectionView])
_ScimUserList = TypeAdapter(List[m.ScimUserView])
_RbacRoleList = TypeAdapter(List[m.RbacRoleView])
_PolicyList = TypeAdapter(List[m.PolicyView])
_SlaStandingList = TypeAdapter(List[m.SlaStanding])
_ClaimList = TypeAdapter(List[m.ClaimView])
_BountyList = TypeAdapter(List[m.BountyView])
_BountyLeaderboardList = TypeAdapter(List[m.BountyLeaderboardRow])
_BudgetStatusList = TypeAdapter(List[m.BudgetStatusView])
_SpendingRowList = TypeAdapter(List[m.SpendingRow])
_SpendingTrendList = TypeAdapter(List[m.SpendingTrendPoint])
_MeshGrantList = TypeAdapter(List[m.MeshGrantView])
_MeshCallList = TypeAdapter(List[m.MeshCallView])
_MeshDiscoverList = TypeAdapter(List[m.MeshDiscoverHit])


class _Base:
    def __init__(self, http: HttpClient) -> None:
        self._http = http


class _Versions(_Base):
    """Signed, content-addressed agent versions (M01)."""

    def list(self, agent_id: str) -> List[m.AgentVersionView]:
        data = self._http.request("GET", f"/agents/{agent_id}/versions")
        return _VersionList.validate_python(data["versions"])

    def publish(self, agent_id: str, *, semver: str, changelog: str = "") -> m.AgentVersionView:
        data = self._http.request(
            "POST", f"/agents/{agent_id}/versions", json={"semver": semver, "changelog": changelog}
        )
        return m.AgentVersionView.model_validate(data["version"])

    def promote(self, agent_id: str, semver: str) -> dict:
        return self._http.request("POST", f"/agents/{agent_id}/versions/{semver}/promote")

    def verify(self, agent_id: str, semver: str) -> dict:
        return self._http.request("GET", f"/agents/{agent_id}/versions/{semver}/verify")


class Agents(_Base):
    """Manage agents — ``sx.agents``."""

    def __init__(self, http: HttpClient) -> None:
        super().__init__(http)
        self.versions = _Versions(http)

    def list(self) -> List[m.AgentView]:
        data = self._http.request("GET", "/agents")
        return _AgentList.validate_python(data["agents"])

    def list_public(self) -> List[m.AgentView]:
        data = self._http.request("GET", "/agents/public")
        return _AgentList.validate_python(data["agents"])

    def get(self, agent_id: str) -> m.AgentView:
        data = self._http.request("GET", f"/agents/{agent_id}")
        return m.AgentView.model_validate(data["agent"])

    def create(self, **input: Any) -> m.AgentView:
        data = self._http.request("POST", "/agents", json=input)
        return m.AgentView.model_validate(data["agent"])

    def update(self, agent_id: str, **input: Any) -> m.AgentView:
        data = self._http.request("PATCH", f"/agents/{agent_id}", json=input)
        return m.AgentView.model_validate(data["agent"])

    def delete(self, agent_id: str) -> None:
        self._http.request("DELETE", f"/agents/{agent_id}")

    def publish(self, agent_id: str) -> m.AgentView:
        data = self._http.request("POST", f"/agents/{agent_id}/publish")
        return m.AgentView.model_validate(data["agent"])

    def fork(self, agent_id: str) -> m.AgentView:
        data = self._http.request("POST", f"/agents/{agent_id}/fork")
        return m.AgentView.model_validate(data["agent"])

    def rate(self, agent_id: str, rating: int) -> dict:
        return self._http.request("POST", f"/agents/{agent_id}/rate", json={"rating": rating})

    def lineage(self, agent_id: str) -> m.AgentLineage:
        data = self._http.request("GET", f"/agents/{agent_id}/lineage")
        return m.AgentLineage.model_validate(data)


class Runs(_Base):
    """Execute agents and read signed, replayable traces — ``sx.runs``."""

    def create(self, *, agent_id: str, prompt: str) -> m.ExecutionView:
        data = self._http.request("POST", "/playground/run", json={"agentId": agent_id, "prompt": prompt})
        return m.ExecutionView.model_validate(data["execution"])

    def rerun(self, *, execution_id: str, agent_id: Optional[str] = None, prompt: Optional[str] = None) -> m.ExecutionView:
        body: dict[str, Any] = {"executionId": execution_id}
        if agent_id is not None:
            body["agentId"] = agent_id
        if prompt is not None:
            body["prompt"] = prompt
        data = self._http.request("POST", "/playground/rerun", json=body)
        return m.ExecutionView.model_validate(data["execution"])

    def list(self, agent_id: str) -> List[m.ExecutionView]:
        data = self._http.request("GET", "/executions", params={"agentId": agent_id})
        return _ExecList.validate_python(data["executions"])

    def recent(self, limit: int = 15) -> List[m.RecentExecution]:
        data = self._http.request("GET", "/executions/recent", params={"limit": limit})
        return _RecentList.validate_python(data["executions"])

    def get(self, execution_id: str) -> m.ExecutionView:
        data = self._http.request("GET", f"/executions/{execution_id}")
        return m.ExecutionView.model_validate(data["execution"])

    def set_visibility(self, execution_id: str, visibility: str) -> m.ExecutionView:
        data = self._http.request(
            "POST", f"/executions/{execution_id}/visibility", json={"visibility": visibility}
        )
        return m.ExecutionView.model_validate(data["execution"])

    def get_public(self, execution_id: str) -> m.PublicRunResponse:
        data = self._http.request("GET", f"/executions/public/{execution_id}")
        return m.PublicRunResponse.model_validate(data)

    @staticmethod
    def share_url(execution_id: str, web_base_url: str = "https://silvanexum.com") -> str:
        return f"{web_base_url.rstrip('/')}/runs/{execution_id}"


class Templates(_Base):
    """1-click vertical agent templates (M11) — ``sx.templates``.

    These endpoints are part of the M11 P0 spec and may be ``planned`` (not yet
    live) on your deployment — see the API reference ``x-status``.
    """

    def list(self, *, vertical: Optional[str] = None, connector: Optional[str] = None, sort: Optional[str] = None) -> List[m.TemplateCard]:
        data = self._http.request(
            "GET", "/templates", params={"vertical": vertical, "connector": connector, "sort": sort}
        )
        return _TemplateList.validate_python(data["templates"])

    def get(self, template_id: str) -> m.TemplateDetail:
        data = self._http.request("GET", f"/templates/{template_id}")
        return m.TemplateDetail.model_validate(data["template"])

    def deploy(self, template_id: str, *, params: dict, name: Optional[str] = None, project_id: Optional[str] = None, idempotency_key: Optional[str] = None) -> m.AgentView:
        body: dict[str, Any] = {"params": params}
        if name is not None:
            body["name"] = name
        if project_id is not None:
            body["projectId"] = project_id
        data = self._http.request(
            "POST", f"/templates/{template_id}/deploy", json=body, idempotency_key=idempotency_key
        )
        return m.AgentView.model_validate(data["agent"])

    def create(self, **input: Any) -> m.TemplateDetail:
        """Publish a template from one of your agents (pass camelCase fields, e.g. sourceAgentId)."""
        data = self._http.request("POST", "/templates", json=input)
        return m.TemplateDetail.model_validate(data["template"])


class Connectors(_Base):
    """Authenticated third-party tools (via Nango) — ``sx.connectors``."""

    def list(self) -> List[m.ConnectorView]:
        data = self._http.request("GET", "/connectors")
        return _ConnectorList.validate_python(data["connectors"])

    def available(self) -> m.AvailableIntegrations:
        return m.AvailableIntegrations.model_validate(self._http.request("GET", "/connectors/available"))

    def create(self, *, provider_config_key: str, display_name: str) -> m.ConnectorView:
        data = self._http.request(
            "POST", "/connectors", json={"providerConfigKey": provider_config_key, "displayName": display_name}
        )
        return m.ConnectorView.model_validate(data["connector"])

    def session(self, connector_id: str) -> dict:
        return self._http.request("POST", f"/connectors/{connector_id}/session")

    def confirm(self, connector_id: str, connection_id: str) -> m.ConnectorView:
        data = self._http.request(
            "POST", f"/connectors/{connector_id}/confirm", json={"connectionId": connection_id}
        )
        return m.ConnectorView.model_validate(data["connector"])

    def delete(self, connector_id: str) -> None:
        self._http.request("DELETE", f"/connectors/{connector_id}")


class Marketplace(_Base):
    """Proof-ranked agent marketplace (M02) — ``sx.marketplace``."""

    def search(self, *, q: Optional[str] = None, sort: str = "proof", category: Optional[str] = None) -> List[m.ListingCard]:
        data = self._http.request(
            "GET", "/marketplace/search", params={"q": q, "sort": sort, "category": category}
        )
        return _ListingList.validate_python(data["results"])

    def get_listing(self, listing_id: str) -> m.ListingCard:
        data = self._http.request("GET", f"/listings/{listing_id}")
        return m.ListingCard.model_validate(data["listing"])

    def try_listing(self, listing_id: str, input: str) -> dict:
        return self._http.request("POST", f"/listings/{listing_id}/try", json={"input": input})

    def purchase(self, listing_id: str, idempotency_key: str) -> m.PurchaseResult:
        data = self._http.request(
            "POST", f"/listings/{listing_id}/purchase", json={}, idempotency_key=idempotency_key
        )
        return m.PurchaseResult.model_validate(data)

    def my_installs(self) -> List[m.InstallView]:
        data = self._http.request("GET", "/me/installs")
        return _InstallList.validate_python(data["installs"])


class Wallet(_Base):
    """Credits, ledger, and payouts (M10) — ``sx.wallet``."""

    def get(self) -> m.WalletView:
        return m.WalletView.model_validate(self._http.request("GET", "/wallet"))

    def ledger(self, *, limit: int = 50, cursor: Optional[str] = None) -> m.LedgerPage:
        data = self._http.request("GET", "/wallet/ledger", params={"limit": limit, "cursor": cursor})
        return m.LedgerPage.model_validate(data)

    def buy_credits(self, credits: int) -> m.BuyCreditsResult:
        data = self._http.request("POST", "/wallet/credits/purchase", json={"credits": credits})
        return m.BuyCreditsResult.model_validate(data)

    def get_payout_account(self) -> Optional[m.PayoutAccountView]:
        data = self._http.request("GET", "/payout-accounts")
        account = data.get("account")
        return m.PayoutAccountView.model_validate(account) if account else None

    def start_payout_onboarding(self) -> m.PayoutAccountView:
        data = self._http.request("POST", "/payout-accounts")
        return m.PayoutAccountView.model_validate(data["account"])

    def list_payouts(self) -> List[m.PayoutView]:
        data = self._http.request("GET", "/payouts")
        return _PayoutList.validate_python(data["payouts"])

    def create_payout(self, amount_credits: int, idempotency_key: str) -> m.PayoutView:
        data = self._http.request(
            "POST", "/payouts", json={"amountCredits": amount_credits}, idempotency_key=idempotency_key
        )
        return m.PayoutView.model_validate(data["payout"])


class Suites(_Base):
    """Regression eval suites — the CI gate (M04) — ``sx.suites``."""

    def list(self) -> List[m.SuiteView]:
        return _SuiteList.validate_python(self._http.request("GET", "/suites")["suites"])

    def get(self, suite_id: str) -> m.SuiteDetail:
        return m.SuiteDetail.model_validate(self._http.request("GET", f"/suites/{suite_id}")["suite"])

    def create(self, *, agent_id: str, name: str, description: Optional[str] = None, similarity_threshold: Optional[int] = None) -> m.SuiteView:
        body: dict[str, Any] = {"agentId": agent_id, "name": name}
        if description is not None:
            body["description"] = description
        if similarity_threshold is not None:
            body["similarityThreshold"] = similarity_threshold
        return m.SuiteView.model_validate(self._http.request("POST", "/suites", json=body)["suite"])

    def add_case(self, suite_id: str, *, from_execution_id: Optional[str] = None, prompt: Optional[str] = None) -> m.SuiteCaseView:
        body: dict[str, Any] = {}
        if from_execution_id is not None:
            body["fromExecutionId"] = from_execution_id
        if prompt is not None:
            body["prompt"] = prompt
        data = self._http.request("POST", f"/suites/{suite_id}/cases", json=body)
        return m.SuiteCaseView.model_validate(data["case"])

    def delete_case(self, suite_id: str, case_id: str) -> None:
        self._http.request("DELETE", f"/suites/{suite_id}/cases/{case_id}")

    def run(self, suite_id: str) -> m.SuiteRunView:
        return m.SuiteRunView.model_validate(self._http.request("POST", f"/suites/{suite_id}/run")["run"])

    def delete(self, suite_id: str) -> None:
        self._http.request("DELETE", f"/suites/{suite_id}")


class Keys(_Base):
    """BYO provider API keys — ``sx.keys``."""

    def list(self) -> List[m.ProviderKeyView]:
        return _KeyList.validate_python(self._http.request("GET", "/keys")["keys"])

    def validate(self, provider: str, api_key: str) -> m.KeyValidationResult:
        data = self._http.request("POST", "/keys/validate", json={"provider": provider, "apiKey": api_key})
        return m.KeyValidationResult.model_validate(data)

    def save(self, provider: str, api_key: str, label: Optional[str] = None) -> dict:
        return self._http.request("POST", "/keys", json={"provider": provider, "apiKey": api_key, "label": label})

    def delete(self, key_id: str) -> None:
        self._http.request("DELETE", f"/keys/{key_id}")


class Models(_Base):
    """Model catalog — ``sx.models``."""

    def list(self) -> List[m.ModelInfo]:
        return _ModelList.validate_python(self._http.request("GET", "/models")["models"])

    def live(self, provider: str) -> m.LiveModelsResponse:
        return m.LiveModelsResponse.model_validate(self._http.request("GET", f"/models/{provider}/live"))


class Team(_Base):
    """Org members and projects — ``sx.team``."""

    def list_members(self) -> dict:
        return self._http.request("GET", "/team/members")

    def invite_member(self, email: str, role: str = "member") -> dict:
        return self._http.request("POST", "/team/members/invite", json={"email": email, "role": role})

    def update_member_role(self, user_id: str, role: str) -> dict:
        return self._http.request("PATCH", f"/team/members/{user_id}", json={"role": role})

    def remove_member(self, user_id: str) -> None:
        self._http.request("DELETE", f"/team/members/{user_id}")

    def list_projects(self) -> List[m.ProjectView]:
        return _ProjectList.validate_python(self._http.request("GET", "/team/projects")["projects"])

    def create_project(self, name: str, description: str = "") -> m.ProjectView:
        data = self._http.request("POST", "/team/projects", json={"name": name, "description": description})
        return m.ProjectView.model_validate(data["project"])

    def delete_project(self, project_id: str) -> None:
        self._http.request("DELETE", f"/team/projects/{project_id}")


class Overview(_Base):
    """Org dashboard stats — ``sx.overview``."""

    def get(self) -> m.OverviewStats:
        return m.OverviewStats.model_validate(self._http.request("GET", "/overview"))


class Security(_Base):
    """Hash-chained audit log, scan verdicts & guardrails (M06) — ``sx.security``."""

    def audit_log(
        self,
        *,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        action: Optional[str] = None,
        from_: Optional[str] = None,
        to: Optional[str] = None,
        limit: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> dict:
        params = {
            "agentId": agent_id,
            "runId": run_id,
            "action": action,
            "from": from_,
            "to": to,
            "limit": limit,
            "cursor": cursor,
        }
        data = self._http.request("GET", "/audit/log", params=params)
        return {
            "entries": _AuditEntryList.validate_python(data["entries"]),
            "next_cursor": data.get("nextCursor"),
        }

    def verify_audit_chain(
        self,
        *,
        agent_id: Optional[str] = None,
        run_id: Optional[str] = None,
        action: Optional[str] = None,
        from_: Optional[str] = None,
        to: Optional[str] = None,
    ) -> m.AuditChainVerify:
        params = {
            "verify": "true",
            "agentId": agent_id,
            "runId": run_id,
            "action": action,
            "from": from_,
            "to": to,
        }
        return m.AuditChainVerify.model_validate(self._http.request("GET", "/audit/log", params=params))

    def create_policy(self, **input: Any) -> m.GuardrailPolicyView:
        data = self._http.request("POST", "/guardrails/policies", json=input)
        return m.GuardrailPolicyView.model_validate(data["policy"])

    def get_policy(self, policy_id: str) -> m.GuardrailPolicyView:
        data = self._http.request("GET", f"/guardrails/policies/{policy_id}")
        return m.GuardrailPolicyView.model_validate(data["policy"])

    def attach_guardrail(self, agent_id: str, policy_id: str) -> m.GuardrailAttachmentView:
        data = self._http.request("POST", f"/agents/{agent_id}/guardrail", json={"policyId": policy_id})
        return m.GuardrailAttachmentView.model_validate(data["attachment"])

    def get_guardrail(self, agent_id: str) -> Optional[m.GuardrailAttachmentView]:
        data = self._http.request("GET", f"/agents/{agent_id}/guardrail")
        attachment = data.get("attachment")
        return m.GuardrailAttachmentView.model_validate(attachment) if attachment else None

    def enforce(self, agent_id: str, **input: Any) -> m.EnforceResult:
        data = self._http.request("POST", f"/agents/{agent_id}/guardrail/enforce", json=input)
        return m.EnforceResult.model_validate(data)

    def list_scans(self, run_id: str) -> List[m.ScanResultView]:
        data = self._http.request("GET", "/scans", params={"runId": run_id})
        return _ScanList.validate_python(data["scans"])

    def compliance_export(
        self, *, agent_id: Optional[str] = None, from_: Optional[str] = None, to: Optional[str] = None
    ) -> m.ComplianceBundle:
        params = {"agentId": agent_id, "from": from_, "to": to}
        return m.ComplianceBundle.model_validate(self._http.request("GET", "/compliance/export", params=params))


class Proving(_Base):
    """Public, cross-vendor eval benchmarks & leaderboards (M05) — ``sx.proving``."""

    def create_dataset(self, **input: Any) -> m.EvalDatasetView:
        data = self._http.request("POST", "/eval-datasets", json=input)
        return m.EvalDatasetView.model_validate(data["dataset"])

    def create_benchmark(self, **input: Any) -> m.BenchmarkView:
        data = self._http.request("POST", "/benchmarks", json=input)
        return m.BenchmarkView.model_validate(data["benchmark"])

    def get_benchmark(self, benchmark_id: str) -> m.BenchmarkDetail:
        data = self._http.request("GET", f"/benchmarks/{benchmark_id}")
        return m.BenchmarkDetail.model_validate(data["benchmark"])

    def submit(self, benchmark_id: str, *, agent_id: str, agent_version: str) -> m.BenchmarkRunView:
        data = self._http.request(
            "POST", f"/benchmarks/{benchmark_id}/submit", json={"agentId": agent_id, "agentVersion": agent_version}
        )
        return m.BenchmarkRunView.model_validate(data["run"])

    def get_run(self, run_id: str) -> m.BenchmarkRunView:
        data = self._http.request("GET", f"/benchmark-runs/{run_id}")
        return m.BenchmarkRunView.model_validate(data["run"])

    def leaderboard(self, category: str, *, limit: int = 50) -> List[m.LeaderboardEntryView]:
        data = self._http.request("GET", f"/leaderboards/{category}", params={"limit": limit})
        return _LeaderboardList.validate_python(data["entries"])


class Fleet(_Base):
    """Fleet observability, cost, drift, alerts & OTel export (M08) — ``sx.fleet``."""

    def metrics(
        self,
        *,
        from_: Optional[str] = None,
        to: Optional[str] = None,
        bucket: Optional[str] = None,
        agent_id: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        group_by: Optional[str] = None,
    ) -> List[m.FleetSeries]:
        params = {
            "from": from_,
            "to": to,
            "bucket": bucket,
            "agentId": agent_id,
            "provider": provider,
            "model": model,
            "groupBy": group_by,
        }
        data = self._http.request("GET", "/fleet/metrics", params=params)
        return _FleetSeriesList.validate_python(data["series"])

    def agents(self) -> List[m.FleetAgentRow]:
        data = self._http.request("GET", "/fleet/agents")
        return _FleetAgentList.validate_python(data["agents"])

    def cost(
        self, *, from_: Optional[str] = None, to: Optional[str] = None, group_by: Optional[str] = None
    ) -> List[m.FleetCostRow]:
        params = {"from": from_, "to": to, "groupBy": group_by}
        data = self._http.request("GET", "/fleet/cost", params=params)
        return _FleetCostList.validate_python(data["rows"])

    def drift(self) -> List[m.DriftFlag]:
        data = self._http.request("GET", "/fleet/drift")
        return _DriftList.validate_python(data["flags"])

    def otel(self, execution_id: str) -> m.OtelTraceExport:
        return m.OtelTraceExport.model_validate(self._http.request("GET", f"/executions/{execution_id}/otel"))

    def list_alerts(self) -> List[m.AlertRuleView]:
        data = self._http.request("GET", "/alerts")
        return _AlertList.validate_python(data["alerts"])

    def create_alert(self, **input: Any) -> m.AlertRuleView:
        data = self._http.request("POST", "/alerts", json=input)
        return m.AlertRuleView.model_validate(data["alert"])

    def update_alert(self, alert_id: str, **input: Any) -> m.AlertRuleView:
        data = self._http.request("PATCH", f"/alerts/{alert_id}", json=input)
        return m.AlertRuleView.model_validate(data["alert"])

    def delete_alert(self, alert_id: str) -> None:
        self._http.request("DELETE", f"/alerts/{alert_id}")

    def alert_events(self, alert_id: str) -> List[m.AlertEventView]:
        data = self._http.request("GET", f"/alerts/{alert_id}/events")
        return _AlertEventList.validate_python(data["events"])


class Routing(_Base):
    """Per-agent model routing policies, previews & decision log (M15) — ``sx.routing``."""

    def upsert_policy(self, agent_id: str, **input: Any) -> m.RoutingPolicyView:
        data = self._http.request("POST", f"/agents/{agent_id}/routing-policy", json=input)
        return m.RoutingPolicyView.model_validate(data["policy"])

    def get_policy(self, agent_id: str) -> Optional[m.RoutingPolicyView]:
        data = self._http.request("GET", f"/agents/{agent_id}/routing-policy")
        policy = data.get("policy")
        return m.RoutingPolicyView.model_validate(policy) if policy else None

    def delete_policy(self, agent_id: str) -> None:
        self._http.request("DELETE", f"/agents/{agent_id}/routing-policy")

    def preview(self, agent_id: str, *, objective: Optional[str] = None) -> m.RoutingPreview:
        body: dict[str, Any] = {}
        if objective is not None:
            body["objective"] = objective
        return m.RoutingPreview.model_validate(self._http.request("POST", f"/agents/{agent_id}/routing/preview", json=body))

    def decisions(
        self,
        *,
        agent_id: Optional[str] = None,
        objective: Optional[str] = None,
        limit: int = 50,
        cursor: Optional[str] = None,
    ) -> dict:
        params = {"agentId": agent_id, "objective": objective, "limit": limit, "cursor": cursor}
        data = self._http.request("GET", "/routing/decisions", params=params)
        return {
            "decisions": _DecisionList.validate_python(data["decisions"]),
            "next_cursor": data.get("nextCursor"),
        }

    def get_decision(self, decision_id: str) -> m.RoutingDecisionView:
        data = self._http.request("GET", f"/routing/decisions/{decision_id}")
        return m.RoutingDecisionView.model_validate(data["decision"])


class Studio(_Base):
    """Multiplayer agent studio — branches, run-diffs & pull requests (M07) — ``sx.studio``."""

    def list_branches(self, agent_id: str) -> List[m.BranchView]:
        data = self._http.request("GET", f"/agents/{agent_id}/branches")
        return _BranchList.validate_python(data["branches"])

    def create_branch(self, agent_id: str, **input: Any) -> m.BranchView:
        data = self._http.request("POST", f"/agents/{agent_id}/branches", json=input)
        return m.BranchView.model_validate(data["branch"])

    def get_branch(self, branch_id: str) -> m.BranchDetail:
        data = self._http.request("GET", f"/branches/{branch_id}")
        return m.BranchDetail.model_validate(data["branch"])

    def update_branch(self, branch_id: str, **input: Any) -> m.BranchView:
        data = self._http.request("PATCH", f"/branches/{branch_id}", json=input)
        return m.BranchView.model_validate(data["branch"])

    def rerun_branch(self, branch_id: str, *, input: Optional[str] = None) -> m.ExecutionView:
        body: dict[str, Any] = {}
        if input is not None:
            body["input"] = input
        data = self._http.request("POST", f"/branches/{branch_id}/rerun", json=body)
        return m.ExecutionView.model_validate(data["execution"])

    def open_pr(self, branch_id: str, **input: Any) -> m.PrView:
        data = self._http.request("POST", f"/branches/{branch_id}/pr", json=input)
        return m.PrView.model_validate(data["pull"])

    def get_pr(self, pr_id: str) -> m.PrDetail:
        data = self._http.request("GET", f"/pulls/{pr_id}")
        return m.PrDetail.model_validate(data["pull"])

    def review_pr(self, pr_id: str, **input: Any) -> m.PrReviewView:
        data = self._http.request("POST", f"/pulls/{pr_id}/reviews", json=input)
        return m.PrReviewView.model_validate(data["review"])

    def comment_pr(self, pr_id: str, **input: Any) -> m.CommentView:
        data = self._http.request("POST", f"/pulls/{pr_id}/comments", json=input)
        return m.CommentView.model_validate(data["comment"])

    def merge_pr(self, pr_id: str) -> m.PrView:
        data = self._http.request("POST", f"/pulls/{pr_id}/merge")
        return m.PrView.model_validate(data["pull"])

    def create_run_diff(self, *, run_a_id: str, run_b_id: str, persist: bool = True) -> m.RunDiffView:
        data = self._http.request(
            "POST", "/runs/diff", json={"runAId": run_a_id, "runBId": run_b_id, "persist": persist}
        )
        return m.RunDiffView.model_validate(data["runDiff"])

    def get_run_diff(self, run_diff_id: str) -> m.RunDiffView:
        data = self._http.request("GET", f"/runs/diff/{run_diff_id}")
        return m.RunDiffView.model_validate(data["runDiff"])

    def set_run_diff_visibility(self, run_diff_id: str, visibility: str) -> m.RunDiffView:
        data = self._http.request(
            "POST", f"/runs/diff/{run_diff_id}/visibility", json={"visibility": visibility}
        )
        return m.RunDiffView.model_validate(data["runDiff"])


class Workforce(_Base):
    """Agent workforce / org chart, HITL escalations & reviews (M09) — ``sx.workforce``."""

    def list_roles(self) -> List[m.RoleView]:
        return _RoleList.validate_python(self._http.request("GET", "/workforce/roles")["roles"])

    def create_role(self, **input: Any) -> m.RoleView:
        data = self._http.request("POST", "/workforce/roles", json=input)
        return m.RoleView.model_validate(data["role"])

    def list_assignments(self) -> List[m.AssignmentView]:
        data = self._http.request("GET", "/workforce/assignments")
        return _AssignmentList.validate_python(data["assignments"])

    def create_assignment(self, **input: Any) -> m.AssignmentView:
        data = self._http.request("POST", "/workforce/assignments", json=input)
        return m.AssignmentView.model_validate(data["assignment"])

    def org_chart(self) -> m.OrgChartView:
        return m.OrgChartView.model_validate(self._http.request("GET", "/workforce/org-chart"))

    def list_escalations(
        self, *, status: Optional[str] = None, pool: Optional[str] = None, limit: Optional[int] = None
    ) -> List[m.EscalationView]:
        params = {"status": status, "pool": pool, "limit": limit}
        data = self._http.request("GET", "/workforce/escalations", params=params)
        return _EscalationList.validate_python(data["escalations"])

    def get_escalation(self, escalation_id: str) -> m.EscalationView:
        data = self._http.request("GET", f"/workforce/escalations/{escalation_id}")
        return m.EscalationView.model_validate(data["escalation"])

    def resolve_escalation(self, escalation_id: str, **input: Any) -> dict:
        data = self._http.request("POST", f"/escalations/{escalation_id}/resolve", json=input)
        return {
            "review": m.HitlReviewView.model_validate(data["review"]),
            "escalation": m.EscalationView.model_validate(data["escalation"]),
        }

    def agent_review(self, agent_id: str, *, window: Optional[str] = None) -> m.PerformanceReview:
        data = self._http.request("GET", f"/workforce/agents/{agent_id}/review", params={"window": window})
        return m.PerformanceReview.model_validate(data)


class Certification(_Base):
    """Certification seals & verified reviews (M16) — ``sx.certification``."""

    def write_review(self, agent_id: str, *, rating: int, body: str = "", agent_version: Optional[str] = None) -> m.VerifiedReviewView:
        payload: dict[str, Any] = {"rating": rating, "body": body}
        if agent_version is not None:
            payload["agentVersion"] = agent_version
        data = self._http.request("POST", f"/agents/{agent_id}/reviews", json=payload)
        return m.VerifiedReviewView.model_validate(data["review"])

    def review_eligibility(self, agent_id: str) -> m.ReviewEligibilityView:
        data = self._http.request("GET", f"/agents/{agent_id}/reviews/eligibility")
        return m.ReviewEligibilityView.model_validate(data)

    def apply(self, **input: Any) -> m.CertificationView:
        """Apply for a seal (pass camelCase fields, e.g. agentId, agentVersion, seal, category)."""
        data = self._http.request("POST", "/certifications/apply", json=input)
        return m.CertificationView.model_validate(data["certification"])

    def get(self, certification_id: str) -> m.CertificationDetail:
        data = self._http.request("GET", f"/certifications/{certification_id}")
        return m.CertificationDetail.model_validate(data["certification"])

    def list_for_agent(self, agent_id: str) -> List[m.CertificationView]:
        data = self._http.request("GET", f"/agents/{agent_id}/certifications")
        return _CertificationList.validate_python(data["certifications"])

    def verify(self, certification_id: str) -> m.CertVerifyView:
        data = self._http.request("GET", f"/certifications/{certification_id}/verify")
        return m.CertVerifyView.model_validate(data)

    def revoke(self, certification_id: str, reason: str) -> m.CertificationView:
        data = self._http.request("POST", f"/certifications/{certification_id}/revoke", json={"reason": reason})
        return m.CertificationView.model_validate(data["certification"])


class Enterprise(_Base):
    """Enterprise private hub — SSO / SCIM / RBAC / deployment (M12) — ``sx.enterprise``."""

    def list_sso_connections(self) -> List[m.SsoConnectionView]:
        data = self._http.request("GET", "/admin/sso/connections")
        return _SsoConnectionList.validate_python(data["connections"])

    def create_sso_connection(self, *, provider: str, domain: str) -> m.SsoConnectionView:
        data = self._http.request(
            "POST", "/admin/sso/connections", json={"provider": provider, "domain": domain}
        )
        return m.SsoConnectionView.model_validate(data["connection"])

    def scim_webhook(self, *, id: str, event: str, data: dict) -> dict:
        return self._http.request(
            "POST", "/admin/scim/webhook", json={"id": id, "event": event, "data": data}
        )

    def list_scim_users(self) -> List[m.ScimUserView]:
        data = self._http.request("GET", "/admin/scim/users")
        return _ScimUserList.validate_python(data["users"])

    def list_rbac_roles(self) -> List[m.RbacRoleView]:
        data = self._http.request("GET", "/admin/rbac/roles")
        return _RbacRoleList.validate_python(data["roles"])

    def create_rbac_role(self, *, name: str, permissions: List[str]) -> m.RbacRoleView:
        data = self._http.request(
            "POST", "/admin/rbac/roles", json={"name": name, "permissions": permissions}
        )
        return m.RbacRoleView.model_validate(data["role"])

    def create_rbac_binding(self, **input: Any) -> m.RbacBindingView:
        """Bind a role to a principal (pass camelCase fields, e.g. roleId, principalType, principalId)."""
        data = self._http.request("POST", "/admin/rbac/bindings", json=input)
        return m.RbacBindingView.model_validate(data["binding"])

    def delete_rbac_binding(self, binding_id: str) -> None:
        self._http.request("DELETE", f"/admin/rbac/bindings/{binding_id}")

    def deployment(self) -> m.DeploymentInfoView:
        return m.DeploymentInfoView.model_validate(self._http.request("GET", "/admin/deployment"))


class Insurance(_Base):
    """Agent insurance, SLAs & claims from signed runs (M13) — ``sx.insurance``."""

    def list_policies(
        self, *, status: Optional[str] = None, limit: int = 50, cursor: Optional[str] = None
    ) -> List[m.PolicyView]:
        params = {"status": status, "limit": limit, "cursor": cursor}
        data = self._http.request("GET", "/policies", params=params)
        return _PolicyList.validate_python(data["policies"])

    def quote(self, **input: Any) -> m.PolicyQuoteView:
        """Quote a policy (pass camelCase fields, e.g. agentId, slaTerms, coverageCapCredits)."""
        data = self._http.request("POST", "/policies", json=input)
        return m.PolicyQuoteView.model_validate(data["quote"])

    def bind(self, **input: Any) -> m.PolicyView:
        """Bind a quoted policy (pass camelCase fields, e.g. riskScoreId, agentId, premiumCredits)."""
        data = self._http.request("POST", "/policies", json=input)
        return m.PolicyView.model_validate(data["policy"])

    def get_policy(self, policy_id: str) -> m.PolicyView:
        data = self._http.request("GET", f"/policies/{policy_id}")
        return m.PolicyView.model_validate(data["policy"])

    def get_policy_sla(self, policy_id: str) -> List[m.SlaStanding]:
        data = self._http.request("GET", f"/policies/{policy_id}/sla")
        return _SlaStandingList.validate_python(data["slaTerms"])

    def file_claim(self, *, policy_id: str, sla_term_id: str) -> m.ClaimView:
        data = self._http.request(
            "POST", "/claims", json={"policyId": policy_id, "slaTermId": sla_term_id}
        )
        return m.ClaimView.model_validate(data["claim"])

    def list_claims(
        self, *, policy_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50
    ) -> List[m.ClaimView]:
        params = {"policyId": policy_id, "status": status, "limit": limit}
        data = self._http.request("GET", "/claims", params=params)
        return _ClaimList.validate_python(data["claims"])

    def get_claim(self, claim_id: str) -> m.ClaimView:
        data = self._http.request("GET", f"/claims/{claim_id}")
        return m.ClaimView.model_validate(data["claim"])

    def get_agent_risk(self, agent_id: str) -> m.RiskScoreView:
        data = self._http.request("GET", f"/agents/{agent_id}/risk")
        return m.RiskScoreView.model_validate(data["riskScore"])


class Bounties(_Base):
    """Bounties & gig marketplace — eval-judged agent contests (M14) — ``sx.bounties``."""

    def list(
        self,
        *,
        category: Optional[str] = None,
        status: Optional[str] = None,
        sort: str = "recent",
        limit: int = 50,
        cursor: Optional[str] = None,
    ) -> List[m.BountyView]:
        params = {"category": category, "status": status, "sort": sort, "limit": limit, "cursor": cursor}
        data = self._http.request("GET", "/bounties", params=params)
        return _BountyList.validate_python(data["bounties"])

    def post(self, **input: Any) -> m.BountyView:
        """Post a bounty (pass camelCase fields, e.g. title, spec, budgetCredits, evalRubric, deadline)."""
        data = self._http.request("POST", "/bounties", json=input)
        return m.BountyView.model_validate(data["bounty"])

    def get(self, bounty_id: str) -> dict:
        """Bounty detail + (for the requester) the leaderboard."""
        data = self._http.request("GET", f"/bounties/{bounty_id}")
        result: dict[str, Any] = {"bounty": m.BountyView.model_validate(data["bounty"])}
        if data.get("leaderboard") is not None:
            result["leaderboard"] = _BountyLeaderboardList.validate_python(data["leaderboard"])
        return result

    def submit(self, bounty_id: str, *, agent_id: str, agent_version: str) -> m.SubmissionView:
        data = self._http.request(
            "POST",
            f"/bounties/{bounty_id}/submit",
            json={"agentId": agent_id, "agentVersion": agent_version},
        )
        return m.SubmissionView.model_validate(data["submission"])

    def get_submission(self, submission_id: str) -> m.SubmissionView:
        data = self._http.request("GET", f"/submissions/{submission_id}")
        return m.SubmissionView.model_validate(data["submission"])

    def award(self, bounty_id: str, *, auto_list: bool = False) -> m.BountyAwardView:
        data = self._http.request("POST", f"/bounties/{bounty_id}/award", json={"autoList": auto_list})
        return m.BountyAwardView.model_validate(data["award"])

    def leaderboard(self, bounty_id: str) -> List[m.BountyLeaderboardRow]:
        data = self._http.request("GET", f"/bounties/{bounty_id}/leaderboard")
        return _BountyLeaderboardList.validate_python(data["leaderboard"])


class Budgets(_Base):
    """Agent FinOps — budgets & spend governance — ``sx.budgets``.

    A budget is a spend cap over a scope (org / project / agent) for a period.
    With ``enforcement="block"`` a run or mesh hop that would breach it is rejected
    server-side (HTTP 402). "Spent" is computed from real run telemetry.
    """

    def list(self, *, scope_type: Optional[str] = None) -> List[m.BudgetStatusView]:
        data = self._http.request("GET", "/budgets", params={"scopeType": scope_type})
        return _BudgetStatusList.validate_python(data["budgets"])

    def create(
        self,
        *,
        name: str,
        scope_type: str,
        period_type: str,
        limit_credits: float,
        scope_id: Optional[str] = None,
        enforcement: Optional[str] = None,
        alert_threshold_pct: Optional[int] = None,
        period_start_at: Optional[str] = None,
        period_end_at: Optional[str] = None,
    ) -> m.BudgetView:
        """Create a spend cap. ``scope_id`` is required for project/agent scopes;
        ``period_start_at``/``period_end_at`` only for ``period_type="custom"``.
        With ``enforcement="block"`` a breaching run or mesh hop is rejected (402).
        """
        body: dict[str, Any] = {
            "name": name,
            "scopeType": scope_type,
            "periodType": period_type,
            "limitCredits": limit_credits,
        }
        if scope_id is not None:
            body["scopeId"] = scope_id
        if enforcement is not None:
            body["enforcement"] = enforcement
        if alert_threshold_pct is not None:
            body["alertThresholdPct"] = alert_threshold_pct
        if period_start_at is not None:
            body["periodStartAt"] = period_start_at
        if period_end_at is not None:
            body["periodEndAt"] = period_end_at
        data = self._http.request("POST", "/budgets", json=body)
        return m.BudgetView.model_validate(data["budget"])

    def get(self, budget_id: str) -> m.BudgetStatusView:
        data = self._http.request("GET", f"/budgets/{budget_id}")
        return m.BudgetStatusView.model_validate(data["status"])

    def update(self, budget_id: str, **input: Any) -> m.BudgetView:
        data = self._http.request("PATCH", f"/budgets/{budget_id}", json=input)
        return m.BudgetView.model_validate(data["budget"])

    def delete(self, budget_id: str) -> None:
        self._http.request("DELETE", f"/budgets/{budget_id}")

    def status(self, budget_id: str) -> m.BudgetStatusView:
        data = self._http.request("GET", f"/budgets/{budget_id}/status")
        return m.BudgetStatusView.model_validate(data["status"])


class Spending(_Base):
    """Agent FinOps — cost attribution (spend visibility) — ``sx.spending``.

    Read-only rollups over real run telemetry + the multi-hop mesh ledger.
    ``from_``/``to`` accept relative ("-7d", "-24h") or absolute ISO; default 30 days.
    """

    def summary(
        self, *, from_: Optional[str] = None, to: Optional[str] = None, group_by: Optional[str] = None
    ) -> List[m.SpendingRow]:
        params = {"from": from_, "to": to, "groupBy": group_by}
        data = self._http.request("GET", "/spending/summary", params=params)
        return _SpendingRowList.validate_python(data["rows"])

    def trends(
        self, *, from_: Optional[str] = None, to: Optional[str] = None, bucket: Optional[str] = None
    ) -> List[m.SpendingTrendPoint]:
        params = {"from": from_, "to": to, "bucket": bucket}
        data = self._http.request("GET", "/spending/trends", params=params)
        return _SpendingTrendList.validate_python(data["points"])

    def mesh_trace(self, root_run_id: str) -> m.MeshTraceView:
        data = self._http.request("GET", f"/spending/mesh-trace/{root_run_id}")
        return m.MeshTraceView.model_validate(data["trace"])


class Gateway(_Base):
    """Agent FinOps — zero-code spend capture via the gateway — ``sx.gateway``.

    Point your provider SDK's base URL at the matching method below and use your
    Silvanexum API key as the provider key; every call (streaming or not) is
    metered on your BYO provider key and counts toward org budgets. Optional
    headers attribute a call: ``x-silvanexum-customer``, ``x-silvanexum-agent``,
    ``x-silvanexum-trace``::

        from anthropic import Anthropic
        claude = Anthropic(
            base_url=sx.gateway.anthropic_base_url(),
            api_key=os.environ["SILVANEXUM_API_KEY"],
            default_headers={"x-silvanexum-customer": customer_id},
        )

    Requires the gateway enabled on the deployment (GATEWAY_ENABLED). Rather not
    proxy? Use :attr:`Silvanexum.meter` (SDK-only mode) instead.
    """

    def openai_base_url(self) -> str:
        """Base URL for the OpenAI SDK's ``base_url`` (chat completions)."""
        return f"{self._http.base_url}/gateway/openai/v1"

    def anthropic_base_url(self) -> str:
        """Base URL for the Anthropic SDK's ``base_url`` (Messages API)."""
        return f"{self._http.base_url}/gateway/anthropic"

    def google_base_url(self) -> str:
        """Base URL for Gemini (``generateContent`` / ``streamGenerateContent``)."""
        return f"{self._http.base_url}/gateway/google"

    def nvidia_base_url(self) -> str:
        """Base URL for NVIDIA NIM on the hosted API catalog (OpenAI SDK ``base_url``)."""
        return f"{self._http.base_url}/gateway/nvidia/v1"

    def nim_base_url(self) -> str:
        """Base URL for the deployment's self-hosted NIM (OpenAI SDK ``base_url``)."""
        return f"{self._http.base_url}/gateway/nim/v1"

    def usage(self) -> dict:
        """30-day totals, per-model/agent/customer breakdowns and recent calls."""
        return self._http.request("GET", "/gateway/usage")


class Mesh(_Base):
    """M03 A2A gateway — agents hiring agents — ``sx.mesh``.

    Suppliers publish a grant (who may hire an agent, at what rate, under what
    quota); callers discover and hire, each hop grant-checked, reputation-gated,
    escrowed, signed, and settled with multi-hop attribution.
    """

    # ── Grants (supplier side) ──
    def list_grants(self) -> dict:
        """Grants issued by my org + grants targeting my org/agents."""
        data = self._http.request("GET", "/mesh/grants")
        return {
            "issued": _MeshGrantList.validate_python(data.get("issued", [])),
            "targetingMe": _MeshGrantList.validate_python(data.get("targetingMe", [])),
        }

    def create_grant(
        self,
        *,
        grantor_agent: str,
        grantee_scope: str,
        rate: dict,
        grantee_agent: Optional[str] = None,
        grantee_org: Optional[str] = None,
        quota: Optional[dict] = None,
        min_trust_score: Optional[float] = None,
        allowed: bool = True,
    ) -> m.MeshGrantView:
        """Publish a hire grant for one of my agents (scope: agent / org / public)."""
        body: dict[str, Any] = {
            "grantorAgent": grantor_agent,
            "granteeScope": grantee_scope,
            "rate": rate,
            "allowed": allowed,
        }
        if grantee_agent is not None:
            body["granteeAgent"] = grantee_agent
        if grantee_org is not None:
            body["granteeOrg"] = grantee_org
        if quota is not None:
            body["quota"] = quota
        if min_trust_score is not None:
            body["minTrustScore"] = min_trust_score
        data = self._http.request("POST", "/mesh/grants", json=body)
        return m.MeshGrantView.model_validate(data["grant"])

    def revoke_grant(self, grant_id: str) -> None:
        """Revoke (soft-delete) a grant. Settled hops are unaffected."""
        self._http.request("DELETE", f"/mesh/grants/{grant_id}")

    # ── Discovery + hire (caller side) ──
    def discover(
        self,
        *,
        q: Optional[str] = None,
        min_trust_score: Optional[float] = None,
        min_success_rate: Optional[float] = None,
        min_total_runs: Optional[int] = None,
        max_rate_credits: Optional[float] = None,
        limit: Optional[int] = None,
    ) -> List[m.MeshDiscoverHit]:
        """Proof-ranked discovery of hireable callees."""
        params = {
            "q": q,
            "minTrustScore": min_trust_score,
            "minSuccessRate": min_success_rate,
            "minTotalRuns": min_total_runs,
            "maxRateCredits": max_rate_credits,
            "limit": limit,
        }
        data = self._http.request("GET", "/mesh/discover", params=params)
        return _MeshDiscoverList.validate_python(data["results"])

    def call(
        self,
        *,
        caller_agent: str,
        callee_agent: str,
        input: str,
        idempotency_key: Optional[str] = None,
        parent_call_id: Optional[str] = None,
    ) -> m.MeshCallView:
        """Hire a callee agent through the gateway (one billed hop). Pass an
        ``idempotency_key`` so a retry can't create a duplicate hop."""
        body: dict[str, Any] = {"callerAgent": caller_agent, "calleeAgent": callee_agent, "input": input}
        if parent_call_id is not None:
            body["parentCallId"] = parent_call_id
        headers = {"idempotency-key": idempotency_key} if idempotency_key else None
        data = self._http.request("POST", "/mesh/call", json=body, headers=headers)
        return m.MeshCallView.model_validate(data["hop"])

    # ── The hop ledger ──
    def list_calls(
        self, *, direction: Optional[str] = None, limit: Optional[int] = None, cursor: Optional[str] = None
    ) -> dict:
        """List my org's hops (``direction`` = "outgoing" | "incoming")."""
        params = {"direction": direction, "limit": limit, "cursor": cursor}
        data = self._http.request("GET", "/mesh/calls", params=params)
        return {"calls": _MeshCallList.validate_python(data["calls"]), "nextCursor": data.get("nextCursor")}

    def get_call(self, call_id: str) -> dict:
        """One hop + its signed callee run."""
        return self._http.request("GET", f"/mesh/calls/{call_id}")


class Billing(_Base):
    """R4 — plan & subscription — ``sx.billing``.

    The plan gates the Team/Enterprise features (block-mode budgets, mesh
    delegation, chargeback exports, unlimited connectors). ``maxConnectors == -1``
    means unlimited.
    """

    def get(self) -> m.BillingView:
        """The org's current plan + resolved entitlements."""
        return m.BillingView.model_validate(self._http.request("GET", "/billing"))

    def subscribe(self, *, plan: str = "team") -> dict:
        """Start a Stripe Checkout for a paid tier ("team" | "scale" — flat
        monthly, priced on governed agent spend, not seats); returns the hosted
        checkout URL. The plan flips only after Stripe confirms (verified
        webhook). Raises on 501 if Stripe isn't configured."""
        return self._http.request("POST", "/billing/subscribe", json={"plan": plan})
