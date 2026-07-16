# Cloudflare Platform Reference Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and publish EdgeOps Dashboard as a clean-room Cloudflare platform engineering reference with a public operational dashboard, an Access-protected admin path, D1, Terraform, CI/CD, monitoring, and runbooks.

**Architecture:** A Next.js App Router application runs on Cloudflare Workers through OpenNext. D1 stores synthetic service, deployment, and incident data; Terraform owns D1 and Access, while Wrangler owns Worker deployment and migrations. GitHub Actions verifies pull requests, deploys main, performs smoke checks, and monitors production every 30 minutes.

**Tech Stack:** TypeScript, Next.js, React, OpenNext for Cloudflare, Cloudflare Workers, D1, Access, Wrangler, Terraform, Zod, Vitest, Playwright, GitHub Actions, npm.

---

## Execution Gates

- **Gate A — documentation:** This plan, the design, acceptance criteria,
  provenance declaration, publication checklist, and runbook must be reviewed
  before Task 1 begins.
- **Gate B — local implementation:** Tasks 1–10 may run locally after Gate A.
  They must not create a remote repository or cloud resources.
- **Gate C — private integration:** Creating a private GitHub repository,
  configuring secrets, and applying Terraform require explicit confirmation.
- **Gate D — publication:** Public visibility, repository topics, live URL, and
  profile pinning require a final clean-room/security review and explicit
  confirmation.

## Task 1: Scaffold the Official Cloudflare Next.js Project

**Files:**

- Create/replace generated application files in the repository root.
- Preserve: `docs/**`, `.git/`, `.gitignore`, and this documentation README.
- Create: `LICENSE`, `.env.example`, `.dev.vars.example`.

**Steps:**

1. Check the current Cloudflare generator help and official Next.js guide.
2. Generate a temporary Next.js Workers project with `create-cloudflare`, npm,
   TypeScript, no deployment, and no new Git repository.
3. Copy only generated application/configuration files into this repository;
   do not copy the temporary README or `.git` directory.
4. Replace generated branding with `EdgeOps Dashboard` and set package name to
   `cloudflare-platform-reference`, version `0.1.0`, and `private: true`.
5. Pin generated compatible dependencies in `package-lock.json`; do not copy
   dependency versions from any unrelated project.
6. Configure scripts for `dev`, `build`, `preview`, `deploy`, `cf-typegen`,
   `typecheck`, `lint`, `test`, `test:integration`, `test:e2e`, `verify`, local
   D1 migration, and remote D1 migration.
7. Add MIT license and example environment files containing names/placeholders
   only.
8. Run `npm ci`, `npm run typecheck`, `npm run lint`, and the generated build.
   Expected: all commands exit 0 before custom behavior is added.
9. Run the forbidden-term and secret checks from `docs/publication-checklist.md`.
10. Commit as `chore: scaffold Cloudflare Next.js reference`.

## Task 2: Add D1 Schema, Seed, and Repository Tests

**Files:**

- Create: `migrations/0001_schema.sql`.
- Create: `migrations/0002_seed.sql`.
- Create: `src/lib/db/types.ts` and `src/lib/db/repository.ts`.
- Create: `tests/integration/d1-repository.test.ts`.
- Modify: `wrangler.jsonc` with a local-safe placeholder D1 binding named `DB`.

**Steps:**

1. Write failing integration tests for an empty migrated database, dashboard
   queries, deployment idempotency, incident creation, incident resolution,
   invalid service references, and duplicate resolution.
2. Run the integration test and confirm it fails because migrations/repository
   do not exist.
3. Create the three-table schema and indexes exactly as defined in the design.
   Enable foreign keys in migration/test setup.
4. Add deterministic `edge-api`, `edge-web`, and `edge-worker` synthetic
   services plus synthetic deployment and incident records with
   `INSERT OR IGNORE`.
5. Implement a typed D1 repository with no ORM. Keep SQL in the repository
   module and map database rows to domain types at the boundary.
6. Use `D1Database.batch()` for multi-statement writes and map uniqueness,
   missing-record, and state-transition failures to typed repository errors.
7. Run migrations twice against a fresh local D1 database. Expected: second
   run reports no pending migrations and preserves record counts.
8. Run `npm run test:integration`. Expected: all repository tests pass.
9. Commit as `feat: add D1 operational data model`.

## Task 3: Implement the Health Endpoint and Structured Logging

**Files:**

- Create: `src/app/api/health/route.ts`.
- Create: `src/lib/observability/logger.ts`.
- Create: `tests/unit/health-route.test.ts`.
- Modify: `wrangler.jsonc` to enable Workers observability.

**Steps:**

1. Write failing tests for a healthy D1 response, failed D1 query, unexpected
   D1 result, no-store caching, and redaction of thrown error details.
2. Implement the stable JSON contract from the design using a `SELECT 1` D1
   check and injected repository/context dependencies for tests.
3. Implement one-line structured JSON logging with an allowlist of fields:
   timestamp, level, event, request ID, route category, duration, and result.
4. Verify that tokens, JWTs, emails, request bodies, bindings, account IDs, and
   database IDs cannot be passed to the logger type.
5. Set Workers Logs enabled with full sampling for this low-traffic demo.
6. Run unit tests and `npm run build`. Expected: pass and OpenNext can bundle the
   route.
7. Commit as `feat: add D1 health and structured logging`.

## Task 4: Implement Cloudflare Access Verification

**Files:**

- Create: `src/lib/auth/access.ts`.
- Create: `src/app/admin/layout.tsx`.
- Create: `tests/unit/access-auth.test.ts`.
- Modify: environment examples with `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and
  `LOCAL_ACCESS_BYPASS=false` placeholders.

**Steps:**

1. Write failing tests for missing JWT, wrong issuer, wrong audience, expired
   JWT, invalid signature, valid JWT, and local bypass behavior.
2. Validate `CF-Access-Jwt-Assertion` with a JWKS client and Web Crypto-compatible
   JWT library. Restrict issuer and audience to configured values.
3. Return a minimal identity object containing only authentication success and
   token subject. Do not return or store the email claim.
4. Allow bypass only when both `NODE_ENV !== 'production'` and
   `LOCAL_ACCESS_BYPASS === 'true'`; fail closed for missing production config.
5. Enforce authentication in the admin layout and expose a reusable guard for
   API routes.
6. Run access tests and OpenNext build. Expected: all pass in the Workers target.
7. Commit as `feat: enforce Access on admin routes`.

## Task 5: Implement and Test Admin APIs

**Files:**

- Create API route handlers for deployments and incidents under
  `src/app/api/admin/`.
- Create: `src/lib/validation/admin.ts`.
- Create: `tests/integration/admin-api.test.ts`.

**Steps:**

1. Write failing tests covering every status code and validation rule from the
   design, including unauthorized requests and idempotent deployments.
2. Add strict Zod schemas that reject unknown fields and normalize whitespace.
3. Implement route handlers using the shared Access guard and D1 repository.
4. Map validation/repository errors to stable JSON problem responses without
   SQL or stack traces.
5. Log only route category, result, duration, request ID, and record type.
6. Run integration tests. Expected: no partial writes after every rejected case.
7. Commit as `feat: add protected operational APIs`.

## Task 6: Build the EdgeOps Dashboard and Admin UI

**Files:**

- Modify: `src/app/page.tsx`, global styles, metadata, and root layout.
- Create components under `src/components/dashboard/` and
  `src/components/admin/`.
- Create: `src/app/admin/page.tsx`.
- Create: `tests/e2e/dashboard.spec.ts` and `tests/e2e/admin.spec.ts`.

**Steps:**

1. Write Playwright tests for public rendering, synthetic-data disclosure,
   service status semantics, empty state, failed-read state, protected admin,
   deployment submission, incident opening, and incident resolution.
2. Implement a responsive, accessible dashboard with status cards, deployment
   table, incident list, architecture summary, and prominent synthetic-data
   label.
3. Implement minimal admin forms with pending, success, validation-error, and
   conflict states. Refresh dashboard data after successful writes.
4. Use semantic HTML, keyboard-accessible controls, visible focus, and status
   text in addition to color.
5. Add custom 404 and error boundaries without diagnostic leakage.
6. Run Playwright against the local OpenNext/Workers preview runtime.
7. Capture desktop and mobile screenshots containing only synthetic data.
8. Commit as `feat: add EdgeOps operational dashboard`.

## Task 7: Add Terraform for D1 and Access

**Files:**

- Create Terraform configuration under `infra/terraform/`.
- Create: `infra/terraform/terraform.tfvars.example`.
- Create: `tests/static/terraform-config.test.ts`.

**Steps:**

1. Confirm current Cloudflare provider resource names/schema from official
   provider documentation before writing resources.
2. Write static tests asserting D1 `prevent_destroy`, no token/account/email
   literals, exact `/admin*` scope, and `enable_access` bootstrap behavior.
3. Add pinned Terraform/provider constraints, variables, resources, outputs,
   and descriptive validation.
4. Set `enable_access=false` by default. D1 is always managed; Access resources
   use conditional creation and become active only when explicitly enabled.
5. Supply account ID, worker hostname, and allowed email only through untracked
   variables. Output the D1 UUID, Access audience, and admin URL as sensitive
   where appropriate.
6. Run `terraform fmt -check -recursive`, `terraform init -backend=false`, and
   `terraform validate`. Expected: exit 0 with no credentials.
7. Run static tests and secret scan.
8. Commit as `feat: add Cloudflare infrastructure as code`.

## Task 8: Add CI, Deployment, and Scheduled Monitoring

**Files:**

- Create: `.github/workflows/ci.yml`.
- Create: `.github/workflows/deploy.yml`.
- Create: `.github/workflows/production-health.yml`.
- Create: `.gitleaks.toml` only if a narrowly documented false-positive rule is
  required; otherwise use default rules.

**Steps:**

1. Add PR/push CI jobs for secret/provenance scan, npm verification, D1
   integration tests, OpenNext build, Playwright smoke, and Terraform checks.
2. Grant workflows minimum permissions: read contents by default; deployment
   job receives only the permissions required by its official actions.
3. Pin third-party actions to reviewed major versions or commit SHAs. Use the
   official Wrangler action for deployment.
4. Add deployment concurrency with no overlapping production deployments.
5. On main, apply remote migrations, deploy, then smoke `/api/health` and `/`
   with bounded retries and timeouts. Upload redacted Wrangler logs on failure.
6. Add a 30-minute cron and manual trigger for health monitoring; retry three
   times and fail clearly.
7. Validate workflow YAML and run local commands equivalent to every CI job.
8. Commit as `ci: add verified Cloudflare delivery pipeline`.

## Task 9: Complete Portfolio Documentation

**Files:**

- Replace the documentation-gate `README.md` with the public project README.
- Create: `docs/architecture.md`, `docs/security-model.md`, and
  `docs/testing-strategy.md`.
- Update: this runbook and publication checklist with verified commands.
- Add synthetic screenshots under `docs/images/`.

**Steps:**

1. Add a 30-second summary, live-demo placeholder, architecture diagram,
   deployment sequence, technology choices, local setup, testing, CI/CD,
   security, migration policy, failure handling, and explicit synthetic-data
   statement.
2. Document why Terraform owns resources while Wrangler owns deployments.
3. Document limitations honestly: personal demo, local Terraform state,
   workers.dev, no SLA, and no real alert delivery.
4. Confirm every command by running it; remove aspirational or unverified claims.
5. Run Markdown link and forbidden-term checks.
6. Commit as `docs: complete platform reference documentation`.

## Task 10: Pass the Local Acceptance Gate

**Steps:**

1. Start from a clean clone-equivalent state with no untracked environment or
   state files required for non-cloud tests.
2. Run npm install reproducibility, all test suites, OpenNext build, local D1
   migrations twice, Playwright, Terraform checks, secret scan, forbidden-term
   scan, and `git status --short`.
3. Verify tracked files do not include environment files, Terraform state,
   tfvars, IDs other than the allowed D1 UUID, screenshots with personal data,
   or generated runtime state.
4. Review commit messages and repository objects for clean-room provenance.
5. Record results in `docs/acceptance-criteria.md` without pasting credentials,
   identifiers, or private paths.
6. Stop for approval before any remote or cloud action.

## Task 11: Create the Private GitHub Integration

**Precondition:** explicit approval after Task 10.

**Steps:**

1. Create `allensux01/cloudflare-platform-reference` as a private repository.
2. Push main and verify all CI jobs.
3. Configure repository secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`; configure `PRODUCTION_URL` only after deployment.
4. Configure branch protection/rules to require CI before main merges.
5. Confirm the repository is still private.

## Task 12: Bootstrap and Deploy Cloudflare Resources

**Precondition:** show Terraform plan and receive explicit approval.

**Steps:**

1. Apply Terraform with `enable_access=false`; verify the plan contains only the
   named D1 resource and outputs.
2. Insert the non-secret D1 UUID into `wrangler.jsonc`, commit, and let private
   CI pass.
3. Apply D1 migrations remotely and deploy the public Worker.
4. Configure `PRODUCTION_URL`, run public smoke tests, and inspect structured
   Workers logs.
5. Set `enable_access=true`, review the plan, then create Access application and
   allow policy.
6. Configure Access audience and team domain as Worker secrets and redeploy.
7. Verify `/` and `/api/health` anonymously; verify `/admin` redirects to Access,
   succeeds for the allowed identity, and fails for unauthorized identities.
8. Verify the scheduled health workflow manually before relying on cron.

## Task 13: Pass the Publication Gate

**Precondition:** explicit approval after all acceptance evidence is reviewed.

**Steps:**

1. Run every item in `docs/publication-checklist.md` against tracked files, Git
   history, Actions logs, screenshots, live pages, and Cloudflare configuration.
2. Add the verified live URL, CI badge, architecture image, and MIT license link
   to README.
3. Change repository visibility to public.
4. Add topics: `cloudflare`, `workers`, `d1`, `opennext`, `terraform`,
   `github-actions`, `devops`, `platform-engineering`, and `nextjs`.
5. Pin the repository to the GitHub profile.
6. Perform an anonymous-browser review of the repo, live dashboard, health
   endpoint, and protected admin route.
