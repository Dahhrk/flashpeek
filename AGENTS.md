# Agents

Guidelines for AI agents working on Flashpeek.

## Setup

```bash
npm ci
npx playwright install chromium
```

## Key commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 5174) |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Feature boundaries | `npm run boundaries` |
| Anti-AI-UI check | `npm run anti-ai-ui` |
| Smoke test | `npm run verify:smoke` |

## Architecture

- `src/features/<name>/` — each feature is self-contained.
- `src/shared/` — shared utilities, types, and components.
- Features may import from themselves or from `src/shared/`. Cross-feature imports are forbidden (enforced by `check-boundaries`).

## Rules

- Read `.cursor/rules/` before making changes — they are always-apply.
- No secrets in source. No VAC-risky code. No Control-Glass branding.
- Visual direction is pending — do not invent a look. See DESIGN.md.
- Premier companion is PHASE 2 — do not build. See PHASE2.md.

## Verification

Run the verify-flashpeek skill before marking work complete:
`node .cursor/skills/verify-flashpeek/control-flashpeek.mjs doctor`

## Ports

- App: 5174
- Drive daemon: 9336
