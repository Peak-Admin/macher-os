/**
 * Erzeugt die Vorschaubilder der Mega-Menüs aus echten, vorhandenen Seiten (keine erfundenen Motive):
 * - public/bilder/vorschau/vorlage-baustellenabnahme.webp – Dokumentvorschau der Vorlage
 * - public/bilder/vorschau/einsatz.webp – „Dein nächster Einsatz“ aus Heute (Spielwiese, Beispieldaten)
 * Aufruf (Server läuft): node scripts/ux/vorschaubilder.mjs [basis-url]
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const basis = process.argv[2] ?? 'http://localhost:3000';
const ziel = 'public/bilder/vorschau';
mkdirSync(ziel, { recursive: true });
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => pw.chromium.launch());

/** Oberen Ausschnitt im Format 16:10 als WebP (720 × 450) speichern */
async function speichern(png, datei) {
  const { width, height } = await sharp(png).metadata();
  const h = Math.min(height, Math.round(width * 0.625));
  await sharp(png).extract({ left: 0, top: 0, width, height: h }).resize(720, 450, { fit: 'cover', position: 'top' }).webp({ quality: 82 }).toFile(`${ziel}/${datei}`);
  console.log('✓', datei);
}

// Vorlage: obere Hälfte des Dokuments
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(`${basis}/wissen/vorlagen/checkliste-baustellenabnahme`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'body > header { display: none !important; }' });
  const png = await page.locator('#druckbereich').screenshot();
  await speichern(png, 'vorlage-baustellenabnahme.webp');
  await page.close();
}

// Einsatz: „Nächster Einsatz“ eines Monteurs aus Heute – schmal aufgenommen, damit die Schrift in der Vorschau lesbar bleibt
{
  const ctx = await browser.newContext({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  await page.goto(`${basis}/os/willkommen`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Spielwiese öffnen' }).first().click();
  await page.waitForURL(/\/os\/heute/);
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Profil von/ }).first().click();
  const wahl = page.getByLabel('Arbeiten als').first();
  await wahl.click();
  await page.getByRole('listbox').getByRole('option').filter({ hasText: 'Jonas' }).first().click();
  await page.waitForTimeout(800);
  const png = await page.locator('.mm-einsatz').first().screenshot({ timeout: 10000 });
  await speichern(png, 'einsatz.webp');
  await ctx.close();
}
await browser.close();
