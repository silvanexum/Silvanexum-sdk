# Silvanexum REST API (for raw HTTP / non-SDK languages)

Base URL: `https://api.silvanexum.com` · Auth: `Authorization: Bearer $SILVANEXUM_API_KEY`
· JSON in/out. Full machine-readable contract: `GET https://api.silvanexum.com/openapi.json`
(OpenAPI 3.1, generated from the same Zod contracts as the SDKs; unauthenticated).

## Scopes

A key carries a subset of `read`, `run`, `manage`, `pay`. A call needing a scope
the key lacks returns `403 insufficient_scope`. Default rule: `GET`→`read`,
mutations→`manage`, executions→`run`, money→`pay`.

## Common endpoints

| Method | Path | Scope | Purpose |
| --- | --- | --- | --- |
| POST | `/playground/run` | run | Run an agent (body `{agentId, prompt}`) → signed run |
| GET | `/executions/{id}` | read | A run's full signed trace |
| GET | `/executions/public/{id}` | — | Public scrubbed run (no auth) |
| GET / POST | `/agents` · `/agents/{id}` | read / manage | List / get / create / update |
| POST | `/agents/{id}/publish` · `/fork` | manage | Publish / fork |
| GET / POST | `/agents/{id}/versions` | read / manage | List / publish signed versions |
| POST | `/agents/{id}/versions/{semver}/promote` | manage | Promote to a channel |
| GET | `/marketplace/search?sort=proof&q=…` | read | Proof-ranked search |
| POST | `/listings/{id}/purchase` | pay | Purchase (send `idempotency-key` header) |
| GET / POST | `/templates` · `/templates/{id}/deploy` | read / manage | M11 templates (may be planned) |
| GET / POST | `/suites` · `/suites/{id}/run` | read / run | Eval suites (pass/fail gate) |
| GET | `/wallet` · POST `/wallet/credits/purchase` | read / pay | Credits |
| GET / POST | `/api-keys` | (session only) | Manage keys — dashboard only, not via a key |

## Idempotency

`POST /listings/{id}/purchase`, `POST /payouts`, and `POST /templates/{id}/deploy`
accept an `idempotency-key` header (required for purchases/payouts) so a retry is
exactly-once.

## Errors

`{ "message", "code" }` body + `x-request-id` header. Statuses: 400/422 validation,
401 auth, 402 insufficient credits, 403 scope, 404, 429 rate limit, 5xx.

## Example

```bash
curl -s https://api.silvanexum.com/playground/run \
  -H "Authorization: Bearer $SILVANEXUM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agt_123","prompt":"Summarize this ticket."}'
```
