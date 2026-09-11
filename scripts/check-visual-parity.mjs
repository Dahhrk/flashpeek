#!/usr/bin/env node

/**
 * check-visual-parity — compare current screenshots against baselines.
 *
 * Usage:
 *   npm run visual-parity
 *   UPDATE_VISUAL_BASELINES=1 npm run visual-parity
 *
 * Baselines live in tests/visual/baselines/ (committed PNGs).
 * Current screenshots are taken by the control harness and placed in
 * tests/visual/current/.
 *
 * Encode (visual-parity-no-baselines):
 *   - Empty / missing PNG baselines FAIL the gate (no silent pass on .gitkeep).
 *   - Never rewrite baselines to silence a fail inside a feature PR.
 *   - Deliberate refresh only with UPDATE_VISUAL_BASELINES=1, then open a PR
 *     whose title contains UPDATE_VISUAL_BASELINES.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASELINES = join(process.cwd(), "tests/visual/baselines");
const CURRENT = join(process.cwd(), "tests/visual/current");
const UPDATE = process.env.UPDATE_VISUAL_BASELINES === "1";
const LEGACY_UPDATE_FLAG = process.argv.includes("--update");

if (LEGACY_UPDATE_FLAG && !UPDATE) {
  console.error(
    "visual-parity: --update alone is refused. Use UPDATE_VISUAL_BASELINES=1 npm run visual-parity in a PR titled UPDATE_VISUAL_BASELINES.",
  );
  process.exit(1);
}

mkdirSync(BASELINES, { recursive: true });
mkdirSync(CURRENT, { recursive: true });

function pngFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png")).sort();
}

if (UPDATE) {
  let count = 0;
  for (const file of pngFiles(CURRENT)) {
    copyFileSync(join(CURRENT, file), join(BASELINES, file));
    count++;
  }
  if (count === 0) {
    console.error(
      "visual-parity: UPDATE_VISUAL_BASELINES=1 but tests/visual/current/ has no PNGs. Capture screenshots first.",
    );
    process.exit(1);
  }
  console.log(
    `Updated ${count} baseline(s). Commit only via a PR titled UPDATE_VISUAL_BASELINES.`,
  );
  process.exit(0);
}

const baselineFiles = pngFiles(BASELINES);

if (baselineFiles.length === 0) {
  console.error(
    "visual-parity FAIL: no PNG baselines in tests/visual/baselines/.",
  );
  console.error(
    "Capture screenshots into tests/visual/current/, then run UPDATE_VISUAL_BASELINES=1 npm run visual-parity and open a PR titled UPDATE_VISUAL_BASELINES.",
  );
  console.error("Never edit baseline PNGs to cheat a fail inside a feature PR.");
  process.exit(1);
}

let failures = 0;

for (const file of baselineFiles) {
  const baselinePath = join(BASELINES, file);
  const currentPath = join(CURRENT, file);

  if (!existsSync(currentPath)) {
    console.error(`MISSING: ${file} — no current screenshot found.`);
    failures++;
    continue;
  }

  const baseline = readFileSync(baselinePath);
  const current = readFileSync(currentPath);

  if (!baseline.equals(current)) {
    console.error(`DIFF: ${file} — visual parity mismatch.`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} visual parity failure(s).`);
  console.error(
    "Do not edit baselines to cheat. Fix the UI or open a deliberate UPDATE_VISUAL_BASELINES PR.",
  );
  process.exit(1);
}

console.log(`Visual parity OK (${baselineFiles.length} baseline(s)).`);
