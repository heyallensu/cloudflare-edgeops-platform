# Acceptance Criteria

Status values are `Not run`, `Pass`, `Fail`, or `Blocked`. Evidence must contain
commands and result summaries, never credentials, private identifiers, email
addresses, or absolute personal paths.

## Documentation Gate

| Criterion | Status | Evidence |
| --- | --- | --- |
| Design defines public/admin boundaries, APIs, D1 schema, IaC ownership, CI/CD, and rollback. | Pass | Design document reviewed locally. |
| Implementation plan uses staged gates and exact verification commands. | Pass | Implementation plan reviewed locally. |
| Provenance document prohibits employer code, data, history, configuration, and screenshots. | Pass | Provenance document present. |
| No app scaffold, cloud resource, GitHub remote, or deployment exists. | Pass | Empty application surface; local Git only. |

## Clean-Room and Security

| Criterion | Status | Evidence |
| --- | --- | --- |
| Git history begins in this repository and has no copied objects/remotes. | Not run | |
| Forbidden employer/product names, internal domains, and personal emails return zero tracked-file matches. | Not run | |
| Secret scan returns zero findings. | Not run | |
| `.env`, `.dev.vars`, tfvars, Terraform state, runtime state, and credentials are untracked. | Not run | |
| Public screenshots and seed data are synthetic. | Not run | |
| GitHub Actions logs contain no credentials or unredacted tokens. | Not run | |

## Application and Data

| Criterion | Status | Evidence |
| --- | --- | --- |
| Fresh local D1 applies schema and seed migrations successfully. | Not run | |
| Re-running migrations is safe and preserves expected row counts. | Not run | |
| Public dashboard renders synthetic services, deployments, and incidents. | Not run | |
| Empty and failed-read states are readable and leak no diagnostics. | Not run | |
| Deployment idempotency prevents duplicate records. | Not run | |
| Incident state allows only open-to-resolved transition. | Not run | |
| Invalid admin requests produce documented 4xx responses with no partial writes. | Not run | |

## Access and Health

| Criterion | Status | Evidence |
| --- | --- | --- |
| Anonymous `/` and `/api/health` remain public. | Not run | |
| Anonymous `/admin*` is intercepted by Access. | Not run | |
| Application rejects missing, expired, wrong-audience, wrong-issuer, and invalid-signature JWTs. | Not run | |
| Valid Access identity can use admin actions without persisting an email. | Not run | |
| Healthy D1 returns HTTP 200 and the stable health contract. | Not run | |
| Failed D1 returns HTTP 503 without SQL, binding, ID, or stack-trace disclosure. | Not run | |

## Terraform and Delivery

| Criterion | Status | Evidence |
| --- | --- | --- |
| Terraform format, init without backend, and validate pass. | Not run | |
| Initial plan with Access disabled creates only D1. | Not run | |
| D1 has `prevent_destroy`; full plan adds only the expected Access resources. | Not run | |
| PR CI runs secret scan, app tests/build, Playwright, and Terraform checks. | Not run | |
| Main deployment applies migrations, deploys, and passes health/root smoke. | Not run | |
| Scheduled health workflow succeeds when manually dispatched and has a 30-minute cron. | Not run | |
| Application rollback procedure is tested without destructive database rollback. | Not run | |

## Portfolio Publication

| Criterion | Status | Evidence |
| --- | --- | --- |
| README gives a truthful 30-second summary, architecture, verified commands, live URL, and limitations. | Not run | |
| MIT license, CI badge, synthetic screenshots, and architecture diagram are present. | Not run | |
| Anonymous browser review passes for repository, dashboard, health, and protected admin. | Not run | |
| Final publication checklist is complete before repository visibility changes. | Not run | |
