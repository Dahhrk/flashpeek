#!/usr/bin/env node

/**
 * control-flashpeek — drive daemon for Flashpeek verification.
 *
 * Commands:
 *   doctor          Check prerequisites
 *   launch          Start Vite dev server (port 5174)
 *   wait-settle     Wait for the page to respond on port 5174
 *   session-start   Open a Playwright browser page
 *   goto <path>     Navigate to a path (e.g. /player/s1mple)
 *   wait-for <sel>  Wait for a CSS selector to appear
 *   screenshot <p>  Save a screenshot to <p>
 *   snapshot        Print an accessibility-tree snapshot
 *   click <sel>     Click a CSS selector
 *   text <sel> <t>  Type text into a CSS selector
 *   cleanup         Kill dev server and close browser
 *
 * Chain commands in one invocation with --then:
 *   control-flashpeek.mjs session-start --then text '[data-testid="home-search"]' s1mple --then click 'button[type="submit"]' --then screenshot proof/profile.png
 */

import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const APP_PORT = 5174;
const APP_URL = `http://localhost:${APP_PORT}`;
const STATE_DIR = resolve("/tmp/flashpeek-control");

let devServerProc = null;
let browser = null;
let page = null;

async function getPlaywright() {
  const pw = await import("playwright");
  return pw.default ?? pw;
}

// ── Commands ──────────────────────────────────────────────────────

async function doctor() {
  console.log("Checking prerequisites…");
  try {
    execSync("node --version", { stdio: "pipe" });
    console.log("  node: OK");
  } catch {
    console.error("  node: MISSING");
    process.exit(1);
  }
  try {
    execSync("npx playwright --version", { stdio: "pipe" });
    console.log("  playwright: OK");
  } catch {
    console.error("  playwright: MISSING — run npx playwright install chromium");
    process.exit(1);
  }
  console.log("Doctor OK");
}

async function launch() {
  mkdirSync(STATE_DIR, { recursive: true });
  console.log(`Launching Vite dev server on port ${APP_PORT}…`);
  devServerProc = spawn("npx", ["vite", "--port", String(APP_PORT)], {
    cwd: resolve(import.meta.dirname, "../../.."),
    stdio: "ignore",
    detached: true,
  });
  writeFileSync(`${STATE_DIR}/dev.pid`, String(devServerProc.pid));
  devServerProc.unref();
  console.log(`Dev server PID: ${devServerProc.pid}`);
}

async function waitSettle() {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const resp = await fetch(APP_URL);
      if (resp.ok) {
        console.log("Page is up.");
        return;
      }
    } catch {
      // not up yet
    }
    await sleep(1000);
  }
  console.error("Timed out waiting for dev server.");
  process.exit(1);
}

async function sessionStart() {
  const pw = await getPlaywright();
  browser = await pw.chromium.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  console.log("Session started.");
  return page;
}

async function gotoPath(urlPath) {
  if (!page) await sessionStart();
  const url = urlPath.startsWith("/") ? `${APP_URL}${urlPath}` : urlPath;
  await page.goto(url, { waitUntil: "networkidle" });
  console.log(`Navigated to: ${url}`);
}

async function waitFor(selector) {
  if (!page) await sessionStart();
  await page.waitForSelector(selector, { timeout: 15000 });
  console.log(`Found: ${selector}`);
}

async function screenshot(outPath) {
  if (!page) await sessionStart();
  const target = resolve(outPath);
  mkdirSync(dirname(target), { recursive: true });
  await page.screenshot({ path: target, fullPage: true });
  console.log(`Screenshot saved: ${target}`);
}

async function snapshot() {
  if (!page) await sessionStart();
  const tree = await page.locator(":root").ariaSnapshot();
  console.log(tree);
}

async function click(selector) {
  if (!page) await sessionStart();
  await page.click(selector);
  console.log(`Clicked: ${selector}`);
}

async function text(selector, value) {
  if (!page) await sessionStart();
  await page.fill(selector, value);
  console.log(`Typed into ${selector}: ${value}`);
}

async function cleanup() {
  if (page) {
    await page.close().catch(() => {});
    page = null;
  }
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
  const pidFile = `${STATE_DIR}/dev.pid`;
  if (existsSync(pidFile)) {
    try {
      const { readFileSync } = await import("node:fs");
      const pid = Number(readFileSync(pidFile, "utf-8").trim());
      process.kill(-pid, "SIGTERM");
    } catch {
      // already dead
    }
  }
  console.log("Cleanup done.");
}

// ── CLI dispatch ──────────────────────────────────────────────────

async function runCommand(cmd, args) {
  switch (cmd) {
    case "doctor":
      await doctor();
      break;
    case "launch":
      await launch();
      break;
    case "wait-settle":
      await waitSettle();
      break;
    case "session-start":
      await sessionStart();
      break;
    case "goto":
      if (!args[0]) {
        console.error("Usage: control-flashpeek.mjs goto <path>");
        process.exit(1);
      }
      await gotoPath(args[0]);
      break;
    case "wait-for":
      if (!args[0]) {
        console.error("Usage: control-flashpeek.mjs wait-for <selector>");
        process.exit(1);
      }
      await waitFor(args[0]);
      break;
    case "screenshot":
      if (!args[0]) {
        console.error("Usage: control-flashpeek.mjs screenshot <path>");
        process.exit(1);
      }
      await screenshot(args[0]);
      break;
    case "snapshot":
      await snapshot();
      break;
    case "click":
      if (!args[0]) {
        console.error("Usage: control-flashpeek.mjs click <selector>");
        process.exit(1);
      }
      await click(args[0]);
      break;
    case "text":
      if (!args[0] || !args[1]) {
        console.error("Usage: control-flashpeek.mjs text <selector> <text>");
        process.exit(1);
      }
      await text(args[0], args[1]);
      break;
    case "cleanup":
      await cleanup();
      break;
    default: {
      const _exhaustive = cmd;
      console.error(`Unknown command: ${_exhaustive}`);
      console.error(
        "Commands: doctor, launch, wait-settle, session-start, goto, wait-for, screenshot, snapshot, click, text, cleanup",
      );
      process.exit(1);
    }
  }
}

const allArgs = process.argv.slice(2);
const commands = [];
let currentCmd = [];

for (const arg of allArgs) {
  if (arg === "--then") {
    if (currentCmd.length > 0) commands.push(currentCmd);
    currentCmd = [];
  } else {
    currentCmd.push(arg);
  }
}
if (currentCmd.length > 0) commands.push(currentCmd);

if (commands.length === 0) {
  console.error("No command specified.");
  console.error(
    "Commands: doctor, launch, wait-settle, session-start, goto, wait-for, screenshot, snapshot, click, text, cleanup",
  );
  process.exit(1);
}

for (const [cmd, ...args] of commands) {
  await runCommand(cmd, args);
}

const lastCmd = commands[commands.length - 1]?.[0];
if (lastCmd !== "cleanup" && browser) {
  await browser.close().catch(() => {});
}
