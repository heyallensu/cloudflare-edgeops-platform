# Publication Checklist

Run this checklist before the first remote push and again immediately before
changing repository visibility to public.

## Repository Provenance

- [ ] Repository was initialized locally with a new Git history.
- [ ] No remote points to an employer or third-party private repository.
- [ ] No copied branch, tag, reflog, bundle, patch, or commit object exists.
- [ ] Commit authorship and messages describe only this reference project.
- [ ] `docs/provenance.md` remains accurate.

## Tracked-File Audit

- [ ] `git status --short` is clean.
- [ ] `git ls-files` contains no `.env`, `.dev.vars`, tfvars, tfstate, Wrangler
  runtime state, test traces, browser profiles, or operating-system files.
- [ ] Secret scanning reports zero findings.
- [ ] Search for employer/product names, internal domains, private repository
  names, real user emails, and source-tree paths returns zero matches.
- [ ] Search for generic credential patterns finds placeholders only:
  `token`, `secret`, `password`, `private_key`, `authorization`, `account_id`.
- [ ] Only the explicitly approved non-secret D1 UUID may appear in
  `wrangler.jsonc`.

Suggested local commands, adjusted only to add new known forbidden terms:

```bash
git ls-files -z | xargs -0 rg -n -i \
  'employer-name|internal-product-name|internal-domain|personal-email'

git ls-files -z | xargs -0 rg -n -i \
  '(api[_-]?token|client[_-]?secret|private[_-]?key|authorization:|password\s*=)'

gitleaks git --redact
```

Expected: forbidden-term search has no matches; credential-pattern matches are
reviewed placeholders/documentation only; Gitleaks exits 0.

## Data and Images

- [ ] Service, deployment, incident, version, SHA, and timestamp data is
  synthetic.
- [ ] Screenshots contain no browser profile, account menu, email, local path,
  notifications, unrelated tabs, or production identifiers.
- [ ] Architecture diagrams contain generic Cloudflare resource names only.
- [ ] Live D1 contains no manually entered personal or employer information.

## Cloudflare and GitHub

- [ ] Repository is private while secrets, Terraform, and deployment are tested.
- [ ] Cloudflare token is least-privilege and limited to the intended account.
- [ ] GitHub secrets are not duplicated as repository variables or plaintext.
- [ ] Actions permissions are minimal and logs redact authorization values.
- [ ] Terraform state and tfvars exist only outside Git.
- [ ] Terraform owns only D1; no Access identity or configuration is required.
- [ ] The live contract advertises only `/` and `/api/health`; inactive admin
  reference routes fail closed without configuration.
- [ ] Production health workflow succeeds when manually dispatched.

## Recruiter Review

- [ ] Repository description is one clear sentence.
- [ ] README explains the problem, architecture, controls, results, and limits
  in under two minutes of reading.
- [ ] CI badge is green and links to the correct workflow.
- [ ] Live URL loads without login and visibly labels data as synthetic.
- [ ] Health endpoint returns no resource identifiers.
- [ ] README does not claim that the inactive admin reference is a live feature.
- [ ] Topics accurately match implemented technology.
- [ ] Visibility changes only after explicit owner confirmation.
