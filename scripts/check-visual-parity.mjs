#!/usr/bin/env node

/**
 * check-visual-parity — compare current screenshots against baselines.
 *
 * Usage:
 *   node scripts/check-visual-parity.mjs [--update]
 *
 * Baselines live in tests/visual/baselines/.
 * Current screenshots are taken by the control harness and placed in
 * tests/visual/current/.
 *
 * With --update, copies current screenshots over baselines.
 * Without --update, does a byte-level comparison.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASELINES = join(process.cwd(), "tests/visual/baselines");
const CURRENT = join(process.cwd(), "tests/visual/current");
const UPDATE = process.argv.includes("--update");

mkdirSync(BASELINES, { recursive: true });
mkdirSync(CURRENT, { recursive: true });

if (UPDATE) {
  let count = 0;
  if (existsSync(CURRENT)) {
    for (const file of readdirSync(CURRENT)) {
      copyFileSync(join(CURRENT, file), join(BASELINES, file));
      count++;
    }
  }
  console.log(`Updated ${count} baseline(s).`);
  process.exit(0);
}

const baselineFiles = existsSync(BASELINES) ? readdirSync(BASELINES) : [];

if (baselineFiles.length === 0) {
  console.log("No baselines found — run with --update after taking screenshots.");
  process.exit(0);
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
  process.exit(1);
} else {
  console.log(`Visual parity OK (${baselineFiles.length} baseline(s)).`);
}
