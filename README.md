<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="EdgeOps — a Cloudflare platform operations reference with public and protected request paths">
</p>

<p align="center">
  <strong>A production-minded Cloudflare platform reference for service health, release operations, and incident state.</strong>
</p>

<p align="center">
  Next.js App Router · OpenNext · Workers · D1 · Access · Zod · jose · Playwright
</p>

EdgeOps is an independently developed portfolio project that makes the operational path visible: public health and dashboard reads, Access-protected writes, application-level JWT verification, typed D1 persistence, safe failure states, and browser-tested admin workflows. Every service, release, and incident shown here is synthetic.

> **Current scope:** the local reference implementation is complete. Cloud resources, Terraform apply, CI/CD deployment, and the live demo remain intentionally approval-gated.

## See it working

<p align="center">
  <img src="./docs/images/edgeops-dashboard.png" width="100%" alt="EdgeOps dashboard showing synthetic service health, releases, incidents, and the Workers-to-D1 reference path">
</p>

The dashboard is not a static mock. It reads D1 through a typed repository, renders explicit empty and unavailable states, and keeps the public surface free of database, binding, customer, and identity details. The responsive layout is also captured in the [mobile view](./docs/images/edgeops-dashboard-mobile.png).

## What this proves

- **Platform operations:** service posture, deployment history, incident creation, and explicit open-to-resolved transitions.
- **Security boundaries:** Cloudflare Access at the edge plus RS256, issuer, audience, expiry, and signature verification inside the application.
- **Safe delivery behavior:** idempotent deployment writes, strict Zod schemas, same-origin browser controls, generic errors, and server-generated timestamps.
- **Production readiness:** forward-only migrations, no-store health responses, structured allowlisted logs, rollback guidance, and redacted degraded states.
- **Verification:** Workers-targeted unit and integration tests, real Chromium workflows, anonymous admin rejection, type checking, linting, and OpenNext builds.

## Request and trust boundaries

<p align="center">
  <img src="./assets/readme/architecture.svg" width="100%" alt="Architecture diagram of public and Cloudflare Access-protected requests reaching an OpenNext Worker and D1">
</p>

Cloudflare Access is deliberately scoped to `/admin*`; `/` and `/api/health` stay public. Administrative APIs validate the `Cf-Access-Jwt-Assertion` header again, accept only an exact Cloudflare Access issuer and configured audience, and return only a minimal subject identity. Email claims are neither returned nor persisted.

## Operational contract

| Concern | Implementation | Failure behavior |
| --- | --- | --- |
| Service health | Public `GET /api/health` with a timed D1 probe | `503` with a redacted D1 status |
| Deployment writes | Strict schema + idempotency key + D1 foreign key | Clear `4xx`; no partial write |
| Incident lifecycle | `open → resolved` conditional transition | Missing `404`; repeat transition `409` |
| Admin access | Access gateway + application JWT verification | Fail closed with generic `401` |
| Database change | Forward-only, additive-first migrations | Forward-fix migration; no destructive auto-rollback |
| Observability | JSON logs with an allowlisted field type | No tokens, claims, bodies, emails, or resource IDs |

## Run it locally

Requirements: a current Node.js LTS release and npm.

```bash
npm ci
npm run d1:migrate:local
npm run dev
```

Then open `http://localhost:3000`.

For deliberate local admin UI development only:

```bash
LOCAL_ACCESS_BYPASS=true npm run dev
```

The guard ignores this bypass in production. Start from [`.env.example`](./.env.example) or [`.dev.vars.example`](./.dev.vars.example); local copies, credentials, Terraform state, and Cloudflare identifiers are excluded from Git.

## Verify the same paths

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:e2e:protected
npm run build:worker
```

Vitest covers migration replay, repository behavior, D1 failure health, Access verification, validation, idempotency, and incident transitions. Playwright drives the public dashboard, a deployment-and-incident lifecycle, and an anonymous `/admin` rejection in Chromium.

## Repository map

```text
src/app/             Next.js routes, public dashboard, admin surface
src/lib/auth/        Access JWT verification and fail-closed configuration
src/lib/api/         Protected API orchestration and safe error contracts
src/lib/db/          Typed D1 repository and state transitions
migrations/          Separate schema and synthetic seed migrations
test/                Workers tests and Playwright browser workflows
docs/                Design, acceptance, provenance, and runbooks
```

## Deliberate limits

The first public version stays small enough to audit. It does not implement multi-tenancy, complex RBAC, notifications, queues, email, Kanban, or destructive database rollback. Terraform, GitHub Actions deployment, scheduled production health checks, and a live `workers.dev` environment are the next approval-gated stage—not unverified claims in this README.

## Engineering record

- [Architecture and design](./docs/plans/2026-07-16-cloudflare-platform-reference-design.md)
- [Implementation plan](./docs/plans/2026-07-16-cloudflare-platform-reference-implementation.md)
- [Acceptance criteria](./docs/acceptance-criteria.md)
- [Clean-room provenance](./docs/provenance.md)
- [Publication checklist](./docs/publication-checklist.md)
- [Deploy and rollback runbook](./docs/runbooks/deploy-and-rollback.md)

## License

[MIT](./LICENSE) — built as a clean-room reference with synthetic data and no employer source code, production configuration, or customer information.
