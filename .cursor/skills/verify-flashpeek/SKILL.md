# verify-flashpeek

Verify Flashpeek web app health: boot the dev server, take a screenshot, run accessibility snapshot, confirm core test-IDs render.

## When to use

- After any UI change lands.
- Before marking a PR ready for review.
- As part of `npm run verify:smoke`.

## Steps

1. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs doctor` to confirm prerequisites (Node, npm, Playwright chromium).
2. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs launch` to start the dev server on port 5174.
3. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs wait-settle` to wait for the page to stabilize.
4. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs screenshot <path>` to capture the current viewport.
5. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs snapshot` to capture an accessibility tree snapshot.
6. Verify the snapshot includes `home-root`, `home-brand`, `home-search`.
7. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs cleanup` to tear down the dev server.

## Return

Report VERIFIED if all test-IDs render and the screenshot is non-empty, otherwise NOT VERIFIED with the failing step.
