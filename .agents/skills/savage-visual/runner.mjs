#!/usr/bin/env node
/**
 * Evidence runner for savage-visual and flow-autopsy.
 *
 *   node runner.mjs shots <route> [route ...]   — 320/390/768 full-page + fold captures
 *   node runner.mjs flow <name> <startUrl>      — video-recorded interactive session;
 *                                                 add --steps steps.json for scripted taps
 *
 * steps.json: [{ "action": "click"|"fill"|"goto"|"wait", "selector"?, "value"?, "shot"? }]
 * Env: BASE_URL (default http://localhost:3000), PW (playwright module path override)
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = process.env.PW ?? "playwright";
let chromium;
try {
  ({ chromium } = await import(PW));
} catch {
  // fall back to a global install
  const { execSync } = await import("node:child_process");
  const root = execSync("npm root -g").toString().trim();
  ({ chromium } = await import(join(root, "playwright/index.mjs")));
}

const VIEWPORTS = [
  { name: "320", width: 320, height: 690 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = join(process.cwd(), ".agents/skills/_evidence", stamp);
mkdirSync(outDir, { recursive: true });

const exePath = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";
const launch = () => chromium.launch({ executablePath: exePath });

const [mode, ...args] = process.argv.slice(2);

if (mode === "shots") {
  const routes = args.length ? args : ["/"];
  const browser = await launch();
  let n = 0;
  for (const route of routes) {
    const slug = route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.width < 500,
        colorScheme: "dark",
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
      } catch (e) {
        console.log(`nav warn ${route}@${vp.name}: ${e.message.split("\n")[0]}`);
      }
      // G8 loading-truth capture happens naturally on slow routes; settle then shoot
      await page.waitForTimeout(1500);
      const id = String(++n).padStart(2, "0");
      await page.screenshot({ path: join(outDir, `${id}-${slug}-${vp.name}-fold.png`) });
      await page.screenshot({ path: join(outDir, `${id}-${slug}-${vp.name}-full.png`), fullPage: true });
      // G6: horizontal scroll check
      const hScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      console.log(
        `${route} @${vp.name}px — hscroll:${hScroll ? "FAIL" : "ok"}` +
          (errors.length ? ` — pageerrors:${errors.length} (${errors[0].slice(0, 80)})` : "")
      );
      await ctx.close();
    }
  }
  await browser.close();
  console.log("evidence:", outDir);
} else if (mode === "flow") {
  const [name, startUrl] = args;
  const stepsIdx = args.indexOf("--steps");
  let steps = [];
  if (stepsIdx !== -1) {
    const { readFileSync } = await import("node:fs");
    steps = JSON.parse(readFileSync(args[stepsIdx + 1], "utf8"));
  }
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    colorScheme: "dark",
    recordVideo: { dir: outDir, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  let taps = 0;
  const log = (msg) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s | ${taps} taps] ${msg}`);
  await page.goto(BASE + (startUrl ?? "/"), { waitUntil: "networkidle", timeout: 45000 }).catch((e) => log(`nav warn: ${e.message.split("\n")[0]}`));
  await page.screenshot({ path: join(outDir, `${name}-00-start.png`) });
  let i = 0;
  for (const s of steps) {
    i++;
    try {
      if (s.action === "click") { await page.click(s.selector, { timeout: 8000 }); taps++; }
      else if (s.action === "fill") { await page.fill(s.selector, s.value, { timeout: 8000 }); }
      else if (s.action === "goto") { await page.goto(BASE + s.value, { waitUntil: "networkidle", timeout: 45000 }); }
      else if (s.action === "wait") { await page.waitForTimeout(Number(s.value) || 1000); }
      log(`step ${i} ${s.action} ${s.selector ?? s.value ?? ""} ok`);
    } catch (e) {
      log(`step ${i} ${s.action} FAILED: ${e.message.split("\n")[0]}`);
      await page.screenshot({ path: join(outDir, `${name}-${String(i).padStart(2, "0")}-DEADEND.png`) });
      break; // a failed step is a dead end — stop like a real user would
    }
    if (s.shot) await page.screenshot({ path: join(outDir, `${name}-${String(i).padStart(2, "0")}-${s.shot}.png`) });
  }
  await page.screenshot({ path: join(outDir, `${name}-99-end.png`) });
  await ctx.close(); // flushes video
  await browser.close();
  log(`done — journey "${name}"`);
  console.log("evidence:", outDir);
} else {
  console.log("usage: runner.mjs shots <route...> | flow <name> <startUrl> [--steps steps.json]");
  process.exit(1);
}
