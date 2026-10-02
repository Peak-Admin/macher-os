/**
 * Verhaltenstest der Website-Navigation im echten Browser (Playwright, echte Zeiger- und Tastatureingaben).
 * Prüft sichtbares Verhalten statt nur DOM-Präsenz: Fläche, Überdeckung, Fokus, Scroll-Sperre, Routing, Breakpoints.
 * Aufruf (Server läuft, z. B. `npm run dev`): npm run test:ux  ·  optional: node scripts/ux/menue-test.mjs <basis-url> <screenshot-ordner>
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const basis = process.argv[2] ?? 'http://localhost:3000';
const bilder = process.argv[3];
if (bilder) mkdirSync(bilder, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => pw.chromium.launch());
let fehler = 0;
const pruefe = (ok, text) => {
  console.log(`${ok ? '✓' : '✗'} ${text}`);
  if (!ok) fehler++;
};
const fokus = (page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const ueberlauf = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// ---------------------------------------------------------------- Handy
for (const breite of [390, 320]) {
  const page = await browser.newPage({ viewport: { width: breite, height: breite === 320 ? 740 : 844 } });
  await page.goto(`${basis}/`, { waitUntil: 'networkidle' });
  pruefe((await ueberlauf(page)) <= 0, `${breite} px: kein waagerechter Seitenüberlauf`);
  const knopf = page.getByRole('button', { name: 'Menü' });
  const kb = await knopf.boundingBox();
  pruefe(kb && kb.height >= 48 && kb.x + kb.width <= breite, `${breite} px: Menü-Knopf beschriftet, ≥ 48 px hoch, ganz sichtbar`);

  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  const scrollVorher = await page.evaluate(() => window.scrollY);
  await knopf.click();
  const dialog = page.locator('#mobiles-menue');
  const box = await dialog.boundingBox();
  pruefe(box && box.width >= breite - 1 && box.height >= (breite === 320 ? 739 : 843), `${breite} px: Menü deckt den ganzen Bildschirm (${box?.width}×${box?.height})`);
  const oben = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return !!el?.closest('#mobiles-menue');
  });
  pruefe(oben, `${breite} px: Menü liegt über dem Seiteninhalt (nichts verdeckt es)`);
  if (bilder && breite === 390) await page.screenshot({ path: `${bilder}/08a-mobiles-menue.png` });
  pruefe((await fokus(page)) === 'Funktionen', `${breite} px: Fokus beim Öffnen auf dem ersten Eintrag`);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  pruefe((await page.evaluate(() => window.scrollY)) === scrollVorher, `${breite} px: Hintergrund scrollt nicht`);

  // Unteransicht und Zurück
  await page.getByRole('button', { name: 'Funktionen' }).click();
  pruefe((await fokus(page)) === 'Funktionen' && (await page.locator('#mobiles-menue h3').textContent()) === 'Funktionen', `${breite} px: Unteransicht zeigt Titel, Fokus auf dem Titel`);
  pruefe(await page.getByRole('button', { name: 'Zurück zum Menü' }).isVisible(), `${breite} px: sichtbarer Zurückweg`);
  if (bilder && breite === 390) await page.screenshot({ path: `${bilder}/08b-mobiles-menue-funktionen.png` });
  const fussLink = page.locator('#mobiles-menue').getByRole('link', { name: 'Kostenlos testen' });
  pruefe(await fussLink.isVisible(), `${breite} px: „Kostenlos testen“ im Menü erreichbar`);
  await page.getByRole('button', { name: 'Zurück zum Menü' }).click();
  pruefe((await fokus(page)) === 'Funktionen', `${breite} px: nach Zurück Fokus auf dem Gruppenknopf`);
  await page.getByRole('button', { name: 'Gewerke' }).click();
  pruefe((await page.locator('#mobiles-menue img').count()) === 8, `${breite} px: Gewerke als acht Bildzeilen`);
  if (bilder && breite === 390) await page.screenshot({ path: `${bilder}/08c-mobiles-menue-gewerke.png` });
  await page.getByRole('button', { name: 'Zurück zum Menü' }).click();

  // Link wählen → Navigation, Dialog zu, Seite wieder scrollbar
  await page.locator('#mobiles-menue').getByRole('link', { name: 'Preise' }).click();
  await page.waitForURL(/\/preise$/);
  pruefe(!(await dialog.evaluate((d) => d.open)), `${breite} px: Link schließt das Menü und navigiert (${new URL(page.url()).pathname})`);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  pruefe((await page.evaluate(() => window.scrollY)) > 0 && (await page.evaluate(() => document.documentElement.style.overflow)) === '', `${breite} px: danach ist die Seite wieder scrollbar`);

  // Escape → zu, Fokus zurück auf den Menü-Knopf
  await knopf.click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  pruefe(!(await dialog.evaluate((d) => d.open)) && (await fokus(page)) === 'Menü', `${breite} px: Escape schließt, Fokus zurück auf „Menü“`);

  // Schließen-Knopf
  await knopf.click();
  await page.getByRole('button', { name: 'Schließen' }).click();
  await page.waitForTimeout(100);
  pruefe(!(await dialog.evaluate((d) => d.open)) && (await page.evaluate(() => document.documentElement.style.overflow)) === '', `${breite} px: „Schließen“ schließt und löst die Scroll-Sperre`);

  // Breakpoint-Wechsel
  await knopf.click();
  await page.setViewportSize({ width: 1300, height: 900 });
  await page.waitForTimeout(200);
  pruefe(!(await dialog.evaluate((d) => d.open)) && (await page.evaluate(() => document.documentElement.style.overflow)) === '', `${breite} px → 1300 px: Menü schließt, Scroll-Sperre gelöst`);
  await page.close();
}

// ---------------------------------------------------------------- Desktop
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${basis}/`, { waitUntil: 'networkidle' });
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  pruefe((await page.locator('[id^="mega-"]').count()) === 0, 'Desktop: geschlossene Menüs haben keine versteckten Links');
  for (const label of ['Funktionen', 'Gewerke', 'Wissen']) {
    await nav.getByRole('button', { name: label }).click();
    await page.waitForTimeout(250);
    const panel = page.locator(`#mega-${label.toLowerCase()}`);
    pruefe(await panel.isVisible(), `Desktop: ${label} öffnet per Klick`);
    pruefe((await page.locator('[id^="mega-"][aria-labelledby]').count()) === 1, `Desktop: nur ein Panel offen (${label})`);
    const ersterLink = panel.getByRole('link').first();
    const lb = await ersterLink.boundingBox();
    const sichtbar = await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[id^="mega-"]'), { x: lb.x + lb.width / 2, y: lb.y + lb.height / 2 });
    pruefe(sichtbar, `Desktop: ${label}-Links liegen sichtbar über dem Hero`);
    if (bilder) await page.screenshot({ path: `${bilder}/07${{ Funktionen: 'a', Gewerke: 'b', Wissen: 'c' }[label]}-menue-${label.toLowerCase()}-desktop.png` });
  }
  // erneuter Klick schließt
  await nav.getByRole('button', { name: 'Wissen' }).click();
  pruefe((await page.locator('[id^="mega-"]').count()) === 0, 'Desktop: erneuter Klick auf denselben Punkt schließt');

  // Tastatur: Enter öffnet, Tab ins Panel, Escape → Fokus zurück
  await nav.getByRole('button', { name: 'Funktionen' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  pruefe((await fokus(page)) === 'Anfragen', 'Desktop: Tab führt vom Auslöser direkt ins Panel');
  await page.keyboard.press('Escape');
  pruefe((await page.locator('[id^="mega-"]').count()) === 0 && (await fokus(page)) === 'Funktionen', 'Desktop: Escape schließt, Fokus zurück auf den Auslöser');
  // Leertaste öffnet, Tab durch alle Links hinaus → Panel schließt
  await page.keyboard.press(' ');
  const links = await page.locator('#mega-funktionen a').count();
  for (let i = 0; i <= links; i++) await page.keyboard.press('Tab');
  pruefe((await page.locator('[id^="mega-"]').count()) === 0 && (await fokus(page)).startsWith('Gewerke'), 'Desktop: Fokus verlässt das Menü → Panel schließt, weiter zum nächsten Punkt');

  // Klick außerhalb schließt
  await nav.getByRole('button', { name: 'Gewerke' }).click();
  await page.mouse.click(700, 850);
  pruefe((await page.locator('[id^="mega-"]').count()) === 0, 'Desktop: Klick außerhalb schließt');

  // Link im Panel: ein Klick genügt
  await nav.getByRole('button', { name: 'Gewerke' }).click();
  await page.locator('#mega-gewerke').getByRole('link', { name: 'Dachdecker' }).click();
  await page.waitForURL(/\/gewerke\/dachdecker$/);
  pruefe((await page.locator('[id^="mega-"]').count()) === 0, 'Desktop: Link führt mit einem Klick zum Ziel, Panel schließt');

  // Geringe Höhe: alle Links erreichbar
  await page.setViewportSize({ width: 1280, height: 560 });
  await nav.getByRole('button', { name: 'Funktionen' }).click();
  const letzter = page.locator('#mega-funktionen').getByRole('link').last();
  await letzter.scrollIntoViewIfNeeded();
  const b = await letzter.boundingBox();
  pruefe(b && b.y + b.height <= 560, 'Desktop, 560 px hoch: letzter Link im Panel erreichbar');
  await page.close();
}

await browser.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
