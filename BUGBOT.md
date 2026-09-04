# Bugbot

Configuration for automated bug detection on Flashpeek.

## Scope

- `src/` — all application source code.
- `scripts/` — CI and check scripts.

## Ignore

- `node_modules/`
- `dist/`
- `tests/visual/baselines/` — binary screenshot files.
- `tests/visual/current/` — transient CI screenshots.

## Checks to run

1. `npm run typecheck`
2. `npm run lint`
3. `npm run boundaries`
4. `npm run anti-ai-ui`
