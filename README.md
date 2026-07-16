# Cloudflare Platform Reference

EdgeOps Dashboard is a clean-room portfolio reference for operating a small
platform on Cloudflare Workers, D1, Access, OpenNext, Terraform, and GitHub
Actions.

The documentation gate is approved and local implementation is underway. The
application is scaffolded from Cloudflare's official Next.js/OpenNext template.
No cloud resources or remote GitHub repository have been created yet.

## Review Documents

- [Architecture and design](docs/plans/2026-07-16-cloudflare-platform-reference-design.md)
- [Implementation plan](docs/plans/2026-07-16-cloudflare-platform-reference-implementation.md)
- [Acceptance criteria](docs/acceptance-criteria.md)
- [Clean-room provenance](docs/provenance.md)
- [Publication checklist](docs/publication-checklist.md)
- [Deploy and rollback runbook](docs/runbooks/deploy-and-rollback.md)

## Local foundation

```bash
npm ci
npm run dev
```

Run `npm run verify` before committing. Cloud creation and deployment remain
separate approval-gated stages.
