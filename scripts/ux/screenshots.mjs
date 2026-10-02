/**
 * Visuelle Belege (Vorher/Nachher) für die UX-Überarbeitung: gleiche Viewports, gleicher Beispielzustand (Spielwiese).
 * Aufruf: node scripts/ux/screenshots.mjs <zielordner> [basis-url]
 * Braucht Playwright (im Container global vorhanden) und einen laufenden Server (`npm run dev`).
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;

const ziel = process.argv[2] ?? 'ux-belege';
const basis = process.argv[3] ?? 'http://localhost:3000';
mkdirSync(ziel, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const groessen = { desktop: { width: 1440, height: 900 }, mobil: { width: 390, height: 844 } };

async function bild(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(ziel, `${name}.png`) });
  console.log('✓', name);
}

// ---------- Marketing
for (const [g, viewport] of Object.entries(groessen)) {
  const ctx = await browser.newContext({ viewport, locale: 'de-DE' });
  const page = await ctx.newPage();
  await page.goto(`${basis}/`, { waitUntil: 'networkidle' });
  await bild(page, `06-marketing-hero-${g}`);
  if (g === 'desktop') {
    for (const [i, label] of [['a', 'Funktionen'], ['b', 'Gewerke'], ['c', 'Wissen']]) {
      await page.goto(`${basis}/`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: label, exact: true }).first().click();
      await bild(page, `07${i}-menue-${label.toLowerCase()}-desktop`);
    }
  } else {
    await page.getByRole('button', { name: /Menü/ }).first().click();
    await bild(page, '08a-mobiles-menue');
    const funktionen = page.getByRole('button', { name: /^Funktionen/ }).last();
    if (await funktionen.isVisible().catch(() => false)) {
      await funktionen.click().catch(() => {});
      await bild(page, '08b-mobiles-menue-funktionen');
    }
  }
  await ctx.close();
}

// ---------- App (Spielwiese mit Beispielbetrieb)
const app = [
  ['01-heute', '/os/heute'],
  ['02-auftragsliste', '/os/auftraege/auftraege'],
  ['03-auftrag-anlegen', '/os/auftraege/auftraege/neu'],
  ['04-betrieb', '/os/betrieb'],
  ['05-kalender', '/os/plan/kalender'],
];
for (const [g, viewport] of Object.entries(groessen)) {
  const ctx = await browser.newContext({ viewport, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  await page.goto(`${basis}/os/willkommen`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Spielwiese öffnen' }).first().click();
  await page.waitForURL(/\/os\/heute/, { timeout: 30000 });
  // Die lokale Datenbank speichert verzögert – erst danach neu laden
  await page.waitForTimeout(2500);
  for (const [name, pfad] of app) {
    await page.goto(`${basis}${pfad}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await bild(page, `${name}-${g}`);
  }
  await ctx.close();
}
await browser.close();
