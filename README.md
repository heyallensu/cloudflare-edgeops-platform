# Cloudflare Platform Reference

EdgeOps Dashboard is a clean-room platform engineering reference built around a
public operational read path and a Cloudflare Access-protected write path. It
uses Next.js App Router, OpenNext, Workers, D1, Zod, `jose`, and structured
Workers logs. Every displayed service, deployment, and incident is synthetic.

![EdgeOps Dashboard desktop view](docs/images/edgeops-dashboard.png)

## What this demonstrates

- D1 migrations, typed repositories, idempotent release writes, and explicit
  incident state transitions.
- Cloudflare Access JWT validation using remote JWKS, exact issuer/audience
  checks, RS256 allowlisting, and a fail-closed production configuration.
- Protected management APIs with strict schemas, same-origin browser controls,
  generic error contracts, and server-generated timestamps.
- Public health and dashboard read paths with no-store responses, safe degraded
  states, structured logs, and no customer or identity data.
- Responsive, keyboard-accessible public and admin interfaces verified with
  Playwright in Chromium.

## Request path

```text
Public browser ──> Next.js / OpenNext ──> Cloudflare Worker ──> D1
                                           │
Admin browser ──> Cloudflare Access ────────┘
                  (JWT checked again in the application)
```

Cloudflare Access is intentionally scoped to `/admin*`. The public `/` and
`/api/health` routes do not require authentication. Administrative APIs also
validate the `Cf-Access-Jwt-Assertion` header in application code and never
return or persist the email claim.

## Run locally

Requirements: a current Node.js LTS release and npm.

```bash
npm ci
npm run d1:migrate:local
npm run dev
```

For deliberate local admin UI development only, set
`LOCAL_ACCESS_BYPASS=true`. The guard ignores this flag whenever
`NODE_ENV=production`. Copy `.env.example` or `.dev.vars.example` only as a
starting point; local copies are ignored by Git.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:e2e:protected
npm run build:worker
```

The Vitest suite covers schema replay, repository behavior, D1 failure health,
Access verification, input rejection, idempotency, and incident transitions.
Playwright covers the public dashboard, browser-driven management lifecycle,
and anonymous `/admin` rejection.

## Operational decisions

- Migrations are forward-only and additive-first. Schema and synthetic seed
  data are separate migrations.
- A failed application release is recovered by redeploying or rolling back the
  Worker; database recovery uses a forward-fix migration.
- Logs accept only an allowlisted field set. Tokens, JWT claims, request bodies,
  email addresses, account IDs, and database IDs are excluded.
- Terraform and CI/CD are deliberately deferred to later approval-gated stages.
  This local implementation creates no Cloudflare resources and has no remote
  GitHub repository or live demo yet.

## Project documents

- [Architecture and design](docs/plans/2026-07-16-cloudflare-platform-reference-design.md)
- [Implementation plan](docs/plans/2026-07-16-cloudflare-platform-reference-implementation.md)
- [Acceptance criteria](docs/acceptance-criteria.md)
- [Clean-room provenance](docs/provenance.md)
- [Publication checklist](docs/publication-checklist.md)
- [Deploy and rollback runbook](docs/runbooks/deploy-and-rollback.md)

Licensed under the [MIT License](LICENSE).
