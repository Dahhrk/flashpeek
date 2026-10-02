# verify-flashpeek

Verify Flashpeek web app health: boot the dev server, take a screenshot, run accessibility snapshot, confirm core test-IDs render, and pass the visual-parity gate.

## When to use

- After any UI change lands.
- Before marking a PR ready for review.
- As a daily verify / full health check.

## Steps

### Harness checks (control-flashpeek)

1. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs doctor` to confirm prerequisites (Node, npm, Playwright chromium).
2. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs launch` to start the dev server on port 5174.
3. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs wait-settle` to wait for the page to stabilize.
4. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs screenshot <path>` to capture the current viewport. Use this for artifact-only proof screenshots (e.g. `/opt/cursor/artifacts/home.png`).
5. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs snapshot` to capture an accessibility tree snapshot.
6. Verify the snapshot includes `home-root`, `home-brand`, `home-search`.
7. Run `node .cursor/skills/verify-flashpeek/control-flashpeek.mjs cleanup` to tear down the dev server.

### Visual-parity gate (required for full verify / daily verify)

The visual-parity gate compares `tests/visual/baselines/*.png` (committed) against `tests/visual/current/*.png` (generated at runtime). Both directories must contain matching PNGs for the gate to pass.

**Artifact-only screenshots (e.g. to `/opt/cursor/artifacts/`) do NOT satisfy visual-parity.** The gate reads only from `tests/visual/current/`.

8. Run `npm run verify:smoke` — this boots the app, checks test-IDs, and writes `tests/visual/current/home.png`.
9. Run `npm run visual-parity` — this compares current screenshots against baselines. It must exit 0.

If step 8 already ran the full smoke test (dev server + screenshot + test-IDs), you can skip the manual harness checks in steps 1-7 — `verify:smoke` covers them. The harness steps remain useful for interactive debugging or when you need artifact screenshots for PR evidence.

## Return

Report VERIFIED if all test-IDs render, the screenshot is non-empty, and `npm run visual-parity` exits 0. Otherwise report NOT VERIFIED with the failing step.
