#!/usr/bin/env node

/**
 * check-anti-ai-ui — detect banned AI-generated UI patterns.
 *
 * Scans src/ for:
 *   - Inter font references
 *   - Purple accent hex codes (#7c3aed, #8b5cf6, etc.)
 *   - Nightglass palette (dark + grain + neon mint #4ade80)
 *   - "Get Started" / "Learn More" button copy
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(process.cwd(), "src");

const RULES = [
  {
    name: "Inter font",
    pattern: /\bInter\b/i,
    extensions: [".css", ".tsx", ".ts", ".jsx", ".js", ".html"],
    message: "Do not use Inter font — Lobby Plate specifies IBM Plex Sans / Archivo Narrow.",
  },
  {
    name: "Purple accent",
    pattern: /#(?:7c3aed|8b5cf6|6d28d9|a78bfa|9333ea|7e22ce)/i,
    extensions: [".css", ".tsx", ".ts", ".jsx", ".js"],
    message: "Purple accent hex detected — banned as generic AI palette.",
  },
  {
    name: "Neon mint (nightglass)",
    pattern: /#4ade80/i,
    extensions: [".css", ".tsx", ".ts", ".jsx", ".js"],
    message: "Neon mint #4ade80 detected — nightglass pattern is banned.",
  },
  {
    name: "Get Started + Learn More",
    pattern: /["'>](?:Get Started|Learn More)["'<]/,
    extensions: [".tsx", ".jsx", ".html"],
    message: '"Get Started" / "Learn More" copy is banned — use domain-specific text.',
  },
];

function walk(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        results.push(...walk(full));
      } else {
        results.push(full);
      }
    }
  } catch {
    // dir doesn't exist
  }
  return results;
}

let violations = 0;
const files = walk(SRC);

for (const file of files) {
  const ext = file.slice(file.lastIndexOf("."));
  const content = readFileSync(file, "utf-8");
  const relPath = relative(process.cwd(), file);

  for (const rule of RULES) {
    if (!rule.extensions.includes(ext)) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        console.error(`ANTI-AI-UI [${rule.name}]: ${relPath}:${i + 1} — ${rule.message}`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} anti-AI-UI violation(s) found.`);
  process.exit(1);
} else {
  console.log("Anti-AI-UI check passed.");
}
