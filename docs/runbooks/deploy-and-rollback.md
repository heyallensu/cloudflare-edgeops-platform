# Deploy and Rollback Runbook

This runbook describes the intended v1 process. Commands must be verified and
updated during implementation before they are treated as operational evidence.

## Ownership Model

- Terraform creates and protects D1 and configures Access.
- Wrangler/OpenNext builds and deploys the Worker and assets.
- Wrangler applies D1 migrations.
- GitHub Actions orchestrates verification, migration, deployment, and smoke
  checks.
- Database migrations are forward-only; Worker versions provide application
  rollback.

## Initial Bootstrap

1. Confirm the repository is private and local acceptance is complete.
2. Export private Terraform inputs without writing them to tracked files:

   ```bash
   export TF_VAR_cloudflare_account_id='...'
   export TF_VAR_worker_hostname='...'
   export TF_VAR_access_allowed_email='...'
   ```

3. Initialize and review the D1-only plan:

   ```bash
   terraform -chdir=infra/terraform init
   terraform -chdir=infra/terraform plan -var='enable_access=false'
   ```

4. Confirm the plan creates exactly one D1 database and no Access resource.
5. After explicit approval, apply and capture only the non-secret D1 UUID:

   ```bash
   terraform -chdir=infra/terraform apply -var='enable_access=false'
   terraform -chdir=infra/terraform output -raw d1_database_id
   ```

6. Put the D1 UUID into `wrangler.jsonc`; do not add account ID or private
   values.
7. Apply remote migrations and deploy the public application.
8. Set `enable_access=true`, review the full plan, and apply only after approval.
9. Configure Access audience and team domain as Worker secrets, then redeploy.
10. Verify public and protected paths from an anonymous browser.

## Normal Deployment

The deployment workflow performs these steps in order:

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
   migration, deployment, health, root smoke, or Access verification.
2. Inspect GitHub Actions output and redacted Wrangler logs.
3. Check Workers Logs by request ID and event name. Do not paste JWTs, email
   addresses, bindings, or account/resource identifiers into issues.
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
3. Verify `/admin` is still protected and the previous application can read the
   current schema.
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
2. Check whether the failure is D1 degradation, Worker execution error, Access
   misconfiguration, or general route availability.
3. Confirm `/api/health` is not covered by the `/admin*` Access application.
4. Inspect recent deployments and Cloudflare status information.
5. Roll back only when evidence links the failure to the current application
   version; otherwise retain the version and investigate the dependency.

## Access Failure

- If `/admin` is public, treat it as a security incident: disable admin write
  routes in the Worker, correct Access scope/policy, and verify anonymously.
- If public routes redirect to Access, correct the application path so only
  `/admin*` is protected.
- If valid users cannot enter, verify policy, identity method, Access audience,
  team domain, and Worker secret values without printing those values.
- Application-side JWT validation must fail closed while configuration is
  missing or invalid.
