# Clean-Room Provenance

## Declaration

Cloudflare Platform Reference is an independent portfolio implementation built
from public documentation and newly authored synthetic requirements.

The project does not contain employer source code, customer data, internal
documents, production screenshots, private architecture diagrams, proprietary
configuration, copied commit history, or real operational records.

## Permitted Sources

- Cloudflare public product documentation.
- OpenNext public documentation and generated scaffold output.
- Next.js, Terraform, GitHub Actions, and other dependency documentation.
- Newly written code, tests, diagrams, synthetic data, and explanatory text.

## Prohibited Inputs

- Copying or transforming files from an internal application.
- Retaining another repository's `.git` directory or commit messages.
- Reusing real domains, account identifiers, D1 identifiers, Access audiences,
  team domains, email addresses, tokens, secrets, names, or screenshots.
- Publishing text generated from private requirements, incident reports, or
  production logs.
- Describing this repository as an open-source release of an employer system.

## Implementation Controls

1. Scaffold the application only with the official Cloudflare generator.
2. Keep this repository in a separate parent directory from employer code.
3. Use synthetic `edge-*` service names and deterministic demo records.
4. Review every manually written migration, workflow, configuration, and image.
5. Run forbidden-term, secret, email, domain, and Git-history checks before the
   first remote push and before changing repository visibility.
6. Treat any uncertain provenance as a publication blocker until manually
   reviewed.

## Public Description

Use this wording in the final README and repository description:

> An independently developed Cloudflare platform engineering reference using
> synthetic data. It demonstrates Workers, D1, Access, OpenNext, Terraform,
> GitHub Actions, health checks, and operational runbooks.
