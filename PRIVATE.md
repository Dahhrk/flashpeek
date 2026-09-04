# Private

This file lists information that must NOT appear in source control.

## Never commit

- FACEIT API keys or client secrets
- Steam Web API keys
- Any user credentials or session tokens
- Database connection strings
- Third-party service credentials

## Where secrets go

- Local development: `.env.local` (git-ignored)
- CI: repository secrets / environment variables
- Production: secrets manager (TBD)

## Related

See `.cursor/rules/guardrails.mdc` for enforcement rules.
