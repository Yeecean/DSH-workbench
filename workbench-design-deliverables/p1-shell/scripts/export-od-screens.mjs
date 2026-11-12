import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'file:///E:/GH%20projects/DSH%20workbench/workbench/upstream-baseline-2026-11-12/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs';

const odProjectDir = 'C:/Users/Haoyang/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/dsh-workbench-p1-shell';
const odExportsDir = resolve(odProjectDir, 'exports');
const repoExportsDir = 'E:/GH projects/DSH workbench/workbench/upstream-baseline-2026-11-12/docs/workbench/design/p1-shell/exports';

mkdirSync(odExportsDir, { recursive: true });
mkdirSync(repoExportsDir, { recursive: true });

const baseUrl = pathToFileURL(resolve(odProjectDir, 'index.html')).href;

const shots = [
  { name: 'od-a-home-context.png', query: '?preset=home-no-session&dir=native&vp=1440', width: 1440, height: 900 },
  { name: 'od-b-home-context.png', query: '?preset=home-no-session&dir=product&vp=1440', width: 1440, height: 900 },
  { name: 'od-a-conv-session.png', query: '?preset=conv-session&dir=native&vp=1440', width: 1440, height: 900 },
  { name: 'od-b-conv-session.png', query: '?preset=conv-session&dir=product&vp=1440', width: 1440, height: 900 },
  { name: 'od-a-conv-context.png', query: '?preset=conv-context&dir=native&vp=1440', width: 1440, height: 900 },
  { name: 'od-b-conv-context.png', query: '?preset=conv-context&dir=product&vp=1440', width: 1440, height: 900 },
  { name: 'od-b-narrow-767.png', query: '?preset=narrow-767&dir=product&vp=767', width: 1440, height: 900 },
  { name: 'od-b-appearance-glass-vs-solid.png', query: '?preset=appearance&dir=product&theme=dark&vp=1440', width: 1440, height: 900 },
  { name: 'od-b-theme-import-flow.png', query: '?preset=theme-import&dir=product&vp=1440', width: 1440, height: 900 },
  { name: 'od-ab-comparison-matrix.png', query: '?preset=home-no-session&dir=product&view=compare&vp=1440', width: 1440, height: 960 },
];

const referenceWidths = [
  { label: '1440x900', vp: 1440, w: 1440, h: 900 },
  { label: '1280x800', vp: 1280, w: 1280, h: 800 },
  { label: '1024px', vp: 1024, w: 1280, h: 800 },
  { label: '768px', vp: 768, w: 1280, h: 800 },
  { label: '767px', vp: 767, w: 1280, h: 800 },
];

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();

  for (const shot of shots) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.goto(baseUrl + shot.query, { waitUntil: 'networkidle' });
    const odPath = resolve(odExportsDir, shot.name);
    const repoPath = resolve(repoExportsDir, shot.name);
    await page.screenshot({ path: odPath, fullPage: false });
    copyFileSync(odPath, repoPath);
    console.log('Exported:', shot.name);
  }

  console.log('\n--- Reference Viewport Geometry Verification ---');
  for (const ref of referenceWidths) {
    await page.setViewportSize({ width: ref.w, height: ref.h });
    await page.goto(`${baseUrl}?preset=conv-context&dir=product&vp=${ref.vp}`, { waitUntil: 'networkidle' });
    const telemetry = await page.locator('#telGeometry').textContent();
    const owner = await page.locator('#telOwner').textContent();
    const logical = await page.locator('#telSessionLogical').textContent();
    console.log(`[${ref.label}] Owner=${owner} | Logical=${logical} | Geometry=${telemetry}`);
  }
} finally {
  await browser.close();
}
