#!/usr/bin/env node

/**
 * ci-drive-smoke — headless smoke test: boot app, check test IDs, screenshot.
 *
 * Exit 0 if all expected test-IDs are present; exit 1 otherwise.
 *
 * Uses control-flashpeek for launch/settle/doctor to stay Windows-safe
 * (no npx spawn).
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const APP_PORT = 5174;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const SCREENSHOT_DIR = resolve("tests/visual/current");
const ROOT = resolve(fileURLToPath(import.meta.url), "../..");

const REQUIRED_TEST_IDS = ["home-root", "home-brand", "home-search"];

function viteBin() {
  return resolve(ROOT, "node_modules/vite/bin/vite.js");
}

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log("Starting dev server…");
  const server = spawn(
    process.execPath,
    [viteBin(), "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"],
    {
      cwd: ROOT,
      stdio: "pipe",
      detached: true,
      windowsHide: true,
    },
  );

  const serverReady = new Promise((res, rej) => {
    const timeout = setTimeout(() => rej(new Error("Server start timeout")), 30_000);
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Local:")) {
        clearTimeout(timeout);
        res(undefined);
      }
    });
    server.on("error", (err) => {
      clearTimeout(timeout);
      rej(err);
    });
  });

  try {
    await serverReady;
  } catch (err) {
    console.error("Failed to start dev server:", err);
    process.exit(1);
  }

  console.log("Dev server is up. Running doctor…");
  const doctorResult = await runDoctor();
  if (!doctorResult.driveable) {
    console.error("Doctor reports app is not driveable:", doctorResult);
    process.exit(1);
  }
  console.log("Doctor: driveable ✓");

  console.log("Launching browser…");
  const pw = await import("playwright");
  const playwright = pw.default ?? pw;
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(APP_URL, { waitUntil: "networkidle", timeout: 15_000 });

    let failures = 0;
    for (const tid of REQUIRED_TEST_IDS) {
      const el = await page.$(`[data-testid="${tid}"]`);
      if (el) {
        console.log(`  ✓ ${tid}`);
      } else {
        console.error(`  ✗ ${tid} — MISSING`);
        failures++;
      }
    }

    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, "home.png"),
      fullPage: true,
    });
    console.log("Screenshot saved.");

    if (failures > 0) {
      console.error(`\n${failures} missing test ID(s).`);
      process.exit(1);
    }

    console.log("\nSmoke test passed.");
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
    await sleep(500);
  }
}

async function runDoctor() {
  const controlPath = resolve(
    ROOT,
    ".cursor/skills/verify-flashpeek/control-flashpeek.mjs",
  );
  return new Promise((res, rej) => {
    const proc = spawn(process.execPath, [controlPath, "doctor"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    proc.stdout.on("data", (d) => { stdout += d; });
    proc.on("close", (code) => {
      try {
        res(JSON.parse(stdout.trim()));
      } catch {
        rej(new Error(`doctor exited ${code}, non-JSON stdout: ${stdout}`));
      }
    });
    proc.on("error", rej);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
