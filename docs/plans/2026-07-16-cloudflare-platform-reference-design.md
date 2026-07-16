# Cloudflare Platform Reference Design

## Purpose

EdgeOps Dashboard is a public, independently developed reference application
that demonstrates practical platform engineering on Cloudflare. It is designed
for technical recruiters and engineering interviewers evaluating DevOps,
Cloud, and Platform Engineering capability.

The first public release must prove five things without relying on claims:

1. A Next.js application can run in the Cloudflare Workers runtime through
   OpenNext.
2. D1 schema changes and synthetic data can be managed with repeatable,
   forward-only migrations.
3. Cloudflare Access can protect an administrative path while leaving the
   portfolio dashboard and health endpoint public.
4. Terraform and Wrangler can own separate infrastructure concerns without
   overlapping or fighting over the same resource.
5. GitHub Actions can verify, deploy, smoke-test, monitor, and support rollback
   of the service.

## Clean-Room Boundary

This project starts from the official Cloudflare Next.js scaffold with a new
Git history. It must not copy files, source code, screenshots, schemas,
business requirements, names, configuration values, commit messages, or Git
objects from any current or former employer project.

Only general engineering patterns may be reused: health endpoints, migration
gates, deployment checks, least-privilege access, structured logs, and
runbooks. All product names, service names, data, timestamps, commit hashes,
incidents, and screenshots are synthetic.

## User Experience

### Public dashboard

`GET /` renders a responsive operational summary sourced from D1:

- service counts by `healthy`, `degraded`, and `down`;
- cards for three synthetic services across production and staging;
- the five most recent deployments;
- currently open incidents and recently resolved incidents;
- a visible “synthetic portfolio data” label.

The page is read-only, requires no login, and contains no analytics or tracking
in v1. Empty and database-error states must remain readable and must not expose
stack traces.

### Protected administration

`/admin` is protected by a Cloudflare Access self-hosted application scoped to
`/admin*`. The page supports only three operational actions:

- record a deployment outcome;
- open an incident;
- resolve an open incident.

Cloudflare Access is the outer authorization boundary. The application also
validates the Access JWT on every admin page and API request. Local tests use a
test-only signing key and issuer; production bypass is impossible unless an
explicit local-development flag is set outside Git.

No authenticated email address is persisted in D1 or written to application
logs. Audit messages use a constant actor category such as `access-user`.

## Application Interfaces

### Public health endpoint

`GET /api/health` returns JSON with this stable shape:

```json
{
  "status": "ok",
  "service": "edgeops-dashboard",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-07-16T00:00:00.000Z",
  "durationMs": 12,
  "checks": {
    "d1": {
      "status": "ok",
      "latencyMs": 4
    }
  }
}
```

`status` is `ok` with HTTP 200 when `SELECT 1` succeeds. It is `degraded`
with HTTP 503 when D1 is unavailable or returns an unexpected result. Error
responses use a generic message and never expose SQL, binding names, resource
IDs, account IDs, or stack traces. Responses include `Cache-Control: no-store`.

### Protected admin APIs

The following JSON APIs require a valid Access identity:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/deployments` | Record a synthetic deployment result. |
| `POST` | `/api/admin/incidents` | Open a synthetic incident. |
| `PATCH` | `/api/admin/incidents/:id` | Resolve an open incident. |

Validation rules:

- service IDs must reference an existing service;
- versions contain 1–32 printable characters;
- commit SHAs contain 7–12 lowercase hexadecimal characters;
- deployment results are `succeeded`, `failed`, or `rolled_back`;
- incident titles contain 3–120 printable characters;
- only an `open` incident can transition to `resolved`;
- unknown records return 404, invalid payloads return 400, missing/invalid
  Access identity returns 401, and invalid state transitions return 409.

Requests either complete fully or write nothing. Duplicate deployment requests
use a client-provided idempotency key; the same key returns the existing record
instead of creating a duplicate.

## D1 Data Model

All timestamps are UTC ISO-8601 strings generated server-side.

### `services`

- `id TEXT PRIMARY KEY`: stable synthetic slug.
- `name TEXT NOT NULL`.
- `environment TEXT NOT NULL CHECK(environment IN ('production','staging'))`.
- `status TEXT NOT NULL CHECK(status IN ('healthy','degraded','down'))`.
- `updated_at TEXT NOT NULL`.

### `deployments`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`.
- `idempotency_key TEXT NOT NULL UNIQUE`.
- `service_id TEXT NOT NULL` with a foreign key to `services`.
- `version TEXT NOT NULL`.
- `commit_sha TEXT NOT NULL`.
- `result TEXT NOT NULL CHECK(result IN ('succeeded','failed','rolled_back'))`.
- `deployed_at TEXT NOT NULL`.

### `incidents`

- `id INTEGER PRIMARY KEY AUTOINCREMENT`.
- `service_id TEXT NOT NULL` with a foreign key to `services`.
- `title TEXT NOT NULL`.
- `status TEXT NOT NULL CHECK(status IN ('open','resolved'))`.
- `started_at TEXT NOT NULL`.
- `resolved_at TEXT NULL`.

Migration `0001_schema.sql` creates the schema and indexes. Migration
`0002_seed.sql` inserts deterministic synthetic services, deployments, and
incidents with `INSERT OR IGNORE`, making the seed safe to re-run. Future
migrations are additive-first and forward-only.

## Cloudflare and Terraform Ownership

Terraform owns:

- one D1 database;
- one Access self-hosted application scoped to `/admin*`;
- one allow policy whose email value is supplied through an untracked
  `TF_VAR_access_allowed_email`;
- lifecycle protection preventing D1 destruction;
- outputs for D1 ID, Access audience, and admin URL.

Wrangler/OpenNext owns:

- Worker code and static asset deployment;
- D1 binding configuration;
- remote migration execution;
- runtime variables, observability, and deployment versions.

Terraform state remains local in v1 and is excluded from Git. The committed
`wrangler.jsonc` may contain the non-secret D1 database UUID after bootstrap,
but it must not contain an account ID, Access audience, team domain, email, or
token.

Bootstrap is intentionally staged:

1. Apply Terraform with `enable_access=false` to create only D1.
2. Copy the non-secret D1 ID into `wrangler.jsonc` and deploy the public app.
3. Apply Terraform with `enable_access=true` to create `/admin*` protection.
4. Configure Access audience and team domain as Worker secrets, then redeploy.
5. Verify public and protected paths independently.

## CI/CD and Operations

Pull requests run secret/provenance scanning, Terraform format and validation,
type checking, linting, unit tests, D1 integration tests, OpenNext build, and
Playwright smoke tests against the local Workers runtime.

Main-branch deployment runs only after verification. It applies remote D1
migrations, deploys through the official Wrangler GitHub Action, checks
`/api/health`, checks `/`, and preserves diagnostic output on failure.

A scheduled workflow checks `/api/health` every 30 minutes with three attempts
and bounded timeouts. Workers Logs are enabled with structured JSON events.
Logs include event name, severity, request ID, route category, duration, and
result; they exclude bodies, tokens, JWTs, emails, and Cloudflare identifiers.

Database rollback is not automatic. Application rollback uses a previous
Worker version or a redeployment of the last known-good commit. Database
recovery uses a reviewed forward-fix migration, so every production migration
must remain compatible with the currently deployed application and its
immediate predecessor.

## Explicit Non-Goals

The first release does not include multi-tenancy, complex RBAC, notifications,
queues, email ingestion, a Kanban board, document editing, custom domains,
remote Terraform state, analytics, or production customer data.
