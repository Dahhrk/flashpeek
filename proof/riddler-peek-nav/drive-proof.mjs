#!/usr/bin/env node
/**
 * Riddler Peek-nav proof drive — captures screenshots, ARIA trees, URL checks.
 * Requires dev server already running on port 5174.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const APP = "http://localhost:5174";
const OUT = resolve(import.meta.dirname);

mkdirSync(OUT, { recursive: true });

function save(name, content) {
  const p = resolve(OUT, name);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf-8");
  console.log(`  saved: ${name}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const results = {};

  // ── 1. Idle Home ──
  console.log("\n=== 1. Idle Home ===");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.screenshot({ path: resolve(OUT, "01-idle-home.png"), fullPage: true });
  console.log("  screenshot: 01-idle-home.png");

  const homeAria = await page.locator(":root").ariaSnapshot();
  save("01-idle-home-aria.txt", homeAria);

  for (const tid of ["home-root", "home-brand", "home-search"]) {
    const el = page.locator(`[data-testid="${tid}"]`);
    const count = await el.count();
    results[`home:${tid}`] = count > 0 ? "FOUND" : "MISSING";
    console.log(`  testid ${tid}: ${results[`home:${tid}`]}`);
  }
  results["home:url"] = page.url();
  console.log(`  URL: ${results["home:url"]}`);

  // ── 2. Empty Peek ──
  console.log("\n=== 2. Empty Peek (submit empty) ===");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, "02-empty-peek.png"), fullPage: true });
  console.log("  screenshot: 02-empty-peek.png");
  results["empty-peek:url"] = page.url();
  console.log(`  URL after empty submit: ${results["empty-peek:url"]}`);
  results["empty-peek:stayed"] = page.url().endsWith(":5174/") || page.url() === APP ? "YES" : "NO";

  // ── 3. s1mple Peek ──
  console.log("\n=== 3. s1mple Peek ===");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.fill('[data-testid="home-search"]', "s1mple");
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-testid="profile-root"]', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(OUT, "03-s1mple-profile.png"), fullPage: true });
  console.log("  screenshot: 03-s1mple-profile.png");

  results["s1mple:url"] = page.url();
  console.log(`  URL: ${results["s1mple:url"]}`);
  results["s1mple:url-correct"] = page.url().includes("/player/s1mple") ? "YES" : "NO";

  const profileAria = await page.locator(":root").ariaSnapshot();
  save("03-s1mple-profile-aria.txt", profileAria);

  const profileTestIds = [
    "profile-root",
    "profile-identity",
    "profile-faceit",
    "profile-premier",
    "profile-recent",
    "profile-form",
  ];
  for (const tid of profileTestIds) {
    const el = page.locator(`[data-testid="${tid}"]`);
    const count = await el.count();
    results[`s1mple:${tid}`] = count > 0 ? "FOUND" : "MISSING";
    console.log(`  testid ${tid}: ${results[`s1mple:${tid}`]}`);
  }

  const sectionLabels = ["FACEIT", "Premier", "Recent games", "Form"];
  for (const label of sectionLabels) {
    const el = page.locator(`.profile__section-label:text-is("${label}")`);
    const count = await el.count();
    results[`s1mple:label-${label}`] = count > 0 ? "FOUND" : "MISSING";
    console.log(`  section label "${label}": ${results[`s1mple:label-${label}`]}`);
  }

  // ── 4. Edge: weird input ──
  console.log("\n=== 4. Edge: weird input ===");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.fill('[data-testid="home-search"]', "xX_n00b-slayer_Xx!!!");
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-testid="profile-root"]', { timeout: 15000 });
  await page.waitForTimeout(500);
  results["weird:url"] = page.url();
  results["weird:navigated"] = page.url().includes("/player/") ? "YES" : "NO";
  console.log(`  URL: ${results["weird:url"]}`);
  console.log(`  Navigated to /player/: ${results["weird:navigated"]}`);
  await page.screenshot({ path: resolve(OUT, "04-weird-input.png"), fullPage: true });
  console.log("  screenshot: 04-weird-input.png");

  // ── 5. Edge: whitespace-only ──
  console.log("\n=== 5. Edge: whitespace-only stays on / ===");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.fill('[data-testid="home-search"]', "   ");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  results["whitespace:url"] = page.url();
  results["whitespace:stayed"] = page.url().endsWith(":5174/") || page.url() === APP ? "YES" : "NO";
  console.log(`  URL after whitespace submit: ${results["whitespace:url"]}`);
  console.log(`  Stayed on /: ${results["whitespace:stayed"]}`);
  await page.screenshot({ path: resolve(OUT, "05-whitespace-peek.png"), fullPage: true });

  // ── 6. Edge: rapid empty clicks ──
  console.log("\n=== 6. Edge: rapid empty clicks ===");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.fill('[data-testid="home-search"]', "");
  for (let i = 0; i < 5; i++) {
    await page.click('button[type="submit"]');
  }
  await page.waitForTimeout(500);
  results["rapid-empty:url"] = page.url();
  results["rapid-empty:stayed"] = page.url().endsWith(":5174/") || page.url() === APP ? "YES" : "NO";
  console.log(`  URL after 5 rapid empty clicks: ${results["rapid-empty:url"]}`);
  console.log(`  Stayed on /: ${results["rapid-empty:stayed"]}`);
  await page.screenshot({ path: resolve(OUT, "06-rapid-empty.png"), fullPage: true });

  // ── Summary ──
  console.log("\n=== RESULTS ===");
  const summary = JSON.stringify(results, null, 2);
  save("results.json", summary);
  console.log(summary);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
