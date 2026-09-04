#!/usr/bin/env node

/**
 * check-boundaries — enforce feature-folder import boundaries.
 *
 * Rules:
 *   - src/features/<name>/ may import from itself or from src/shared/.
 *   - src/features/<name>/ must NOT import from another feature folder.
 *   - src/shared/ must NOT import from any feature folder.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SRC = join(process.cwd(), "src");
const FEATURES = join(SRC, "features");

const IMPORT_RE = /(?:from\s+['"])([^'"]+)(?:['"])|(?:import\s*\(['"])([^'"]+)(?:['"]\))/g;

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (/\.[tj]sx?$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function featureName(filePath) {
  const rel = relative(FEATURES, filePath);
  if (rel.startsWith("..")) return null;
  return rel.split(sep)[0] ?? null;
}

let violations = 0;

function check() {
  let files;
  try {
    files = walk(SRC);
  } catch {
    console.log("No src/ directory found — skipping.");
    return;
  }

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const fromFeature = featureName(file);
    const relFile = relative(process.cwd(), file);

    let match;
    IMPORT_RE.lastIndex = 0;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      const specifier = match[1] ?? match[2];
      if (!specifier) continue;
      if (!specifier.includes("features/")) continue;

      const featureMatch = specifier.match(/features\/([^/]+)/);
      if (!featureMatch) continue;
      const targetFeature = featureMatch[1];

      const isShared = relative(SRC, file).startsWith("shared");
      if (isShared) {
        console.error(`BOUNDARY: ${relFile} (shared) imports from features/${targetFeature}`);
        violations++;
        continue;
      }

      if (fromFeature && targetFeature !== fromFeature) {
        console.error(
          `BOUNDARY: ${relFile} (features/${fromFeature}) imports from features/${targetFeature}`,
        );
        violations++;
      }
    }
  }
}

check();

if (violations > 0) {
  console.error(`\n${violations} boundary violation(s) found.`);
  process.exit(1);
} else {
  console.log("Boundary check passed.");
}
