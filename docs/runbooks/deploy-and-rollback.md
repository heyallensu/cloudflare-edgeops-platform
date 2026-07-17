# Deploy and Rollback Runbook

This runbook describes the live v1 delivery process.

## Ownership Model

- Terraform creates and protects D1.
- Wrangler/OpenNext builds and deploys the Worker and assets.
- Wrangler applies D1 migrations.
- GitHub Actions orchestrates verification, migration, deployment, and smoke
  checks.
- Database migrations are forward-only; Worker versions provide application
  rollback.

## Initial Bootstrap

1. Confirm the repository is private and local acceptance is complete.
2. Export the private Terraform input without writing it to tracked files:

   ```bash
   export TF_VAR_cloudflare_account_id='...'
   ```

3. Initialize and review the D1 plan:

   ```bash
   terraform -chdir=infra/terraform init
   terraform -chdir=infra/terraform plan
   ```

4. Confirm the plan creates exactly one D1 database.
5. After explicit approval, apply and capture only the non-secret D1 UUID:

   ```bash
   terraform -chdir=infra/terraform apply
   terraform -chdir=infra/terraform output -raw d1_database_id
   ```

6. Put the D1 UUID into `wrangler.jsonc`; do not add account ID or private
   values.
7. Apply remote migrations and deploy the public application.
8. Add `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and
   `PRODUCTION_URL` to GitHub's encrypted repository settings.
9. Verify the public dashboard and health endpoint from an anonymous browser.

## Normal Deployment

The CI workflow runs first for every push to `main`. Only a successful CI run
triggers the deployment workflow, which performs these steps in order:

1. Check out an immutable commit.
2. Install with `npm ci`.
3. Run typecheck, lint, tests, OpenNext build, and Terraform validation.
4. Apply pending remote D1 migrations.
5. Deploy the Worker with the official Wrangler action.
6. Poll `/api/health` with bounded retries until it returns 200.
7. Send a HEAD/GET request to `/` and require a successful response.
8. Mark the workflow failed and retain redacted diagnostics if either smoke
   check does not recover within the configured window.

Every schema migration deployed before an application version must be
compatible with both the new application and the immediately previous version.
Destructive renames/drops require an expand-migrate-contract sequence across
multiple releases and are out of scope for v1.

## Failed Deployment Triage

1. Do not rerun blindly. Identify whether failure occurred in verification,
   migration, deployment, health, or root smoke.
2. Inspect GitHub Actions output and redacted Wrangler logs.
3. Check Workers Logs by request ID and event name. Do not paste credentials,
   bindings, or account/resource identifiers into issues.
4. Query `/api/health` directly and record only status, timestamps, duration,
   and generic check result.
5. Determine whether the previous Worker version is still serving traffic.
6. If D1 migration succeeded, confirm it remains backward-compatible before
   rolling back the application.

## Application Rollback

Preferred order:

1. Use Cloudflare's Worker version rollback capability to restore the last
   known-good version, or redeploy the last known-good commit through the
   controlled workflow.
2. Poll `/api/health` and `/` with the same production smoke checks.
3. Verify the previous application can read the current schema.
4. Record the failed version, restored version, timestamps, symptom, and next
   action using synthetic/non-sensitive identifiers.

Never delete/recreate D1 or run a reverse SQL script as an automatic response
to an application failure.

## Database Forward Fix

If a migration introduced a schema/data defect:

1. Preserve the database and stop additional production deployments.
2. Reproduce the issue against an exported or synthetic local database without
   copying personal data into the repository.
3. Write a new numbered forward migration that restores compatibility.
4. Test migration from a clean database and from the immediately previous
   migrated state.
5. Confirm the migration is safe to rerun through Wrangler's migration ledger.
6. Review SQL and plan recovery impact before remote application.
7. Apply through the normal controlled workflow and verify health/data reads.

## Scheduled Health Failure

1. Confirm all three scheduled attempts failed rather than a single transient
   timeout.
2. Check whether the failure is D1 degradation, Worker execution error, or
   general route availability.
3. Confirm both public production routes independently.
4. Inspect recent deployments and Cloudflare status information.
5. Roll back only when evidence links the failure to the current application
   version; otherwise retain the version and investigate the dependency.

## Inactive Admin Reference

The live v1 product does not provision Cloudflare Access or advertise an admin
console. The retained JWT guard must continue to fail closed when configuration
is missing; do not replace it with a public bypass. Any future activation is a
new security design decision and requires its own threat review and acceptance
tests.
