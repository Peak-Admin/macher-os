/**
 * Verhaltenstest „Auftrag anlegen“ im echten Browser (Spielwiese mit Beispieldaten):
 * bekannter Einsatzort als Zusammenfassung, Auswahlpflicht bei mehreren Orten, „Einsatzort noch offen“,
 * Werte bleiben beim Zu- und Aufklappen erhalten, Fehler führt zum Feld, Anlegen klappt.
 * Aufruf (Server läuft): npm run test:ux  ·  optional: node scripts/ux/formular-test.mjs <basis-url>
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const basis = process.argv[2] ?? 'http://localhost:3000';
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => pw.chromium.launch());
let fehler = 0;
const pruefe = (ok, text) => {
  console.log(`${ok ? '✓' : '✗'} ${text}`);
  if (!ok) fehler++;
};

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
const page = await ctx.newPage();
await page.goto(`${basis}/os/willkommen`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Spielwiese öffnen' }).first().click();
await page.waitForURL(/\/os\/heute/);
await page.waitForTimeout(2500);

// Kunden mit mehreren, einem und keinem Einsatzort aus den Beispieldaten suchen
await page.goto(`${basis}/os/auftraege/auftraege/neu`, { waitUntil: 'networkidle' });
const kundeFeld = page.getByLabel('Für welchen Kunden?');
const kunden = await kundeFeld.locator('option').evaluateAll((os) => os.map((o) => ({ wert: o.value, text: o.textContent })).filter((o) => o.wert));
const einsatzortArt = async () => {
  if (await page.getByRole('button', { name: 'Adresse ändern' }).isVisible().catch(() => false)) return 'zusammenfassung';
  const ort = page.getByLabel('Einsatzort', { exact: true });
  if (!(await ort.count())) return 'keins';
  return (await ort.inputValue()) === '' ? 'auswahl-leer' : 'auswahl';
};
const arten = {};
for (const k of kunden) {
  await kundeFeld.selectOption(k.wert);
  arten[await einsatzortArt()] ??= k;
}
pruefe(!!arten.zusammenfassung, `Ein bekannter Ort erscheint als lesbare Zusammenfassung mit „Adresse ändern“ (${arten.zusammenfassung?.text ?? '–'})`);

// Mehrere Orte: Kunde mit zwei Einsatzorten über das Formular selbst anlegen (neuer Kunde, dann „Adresse ändern“)
const neu = () => page.goto(`${basis}/os/auftraege/auftraege/neu`, { waitUntil: 'networkidle' });
const anlegen = async () => {
  await page.getByRole('button', { name: 'Auftrag anlegen' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/neu'), { timeout: 10000 });
  // Die lokale Datenbank speichert verzögert – erst danach neu laden
  await page.waitForTimeout(2500);
};
await neu();
await page.getByRole('radio', { name: 'Neuer Kunde' }).click();
await page.getByLabel('Name des Kunden').fill('Familie Mehrort');
await page.getByLabel('Was ist zu tun?').fill('Zählerschrank prüfen');
await page.getByLabel('Straße und Hausnummer').fill('Am Markt 1');
await page.getByLabel('PLZ').fill('34117');
await page.getByLabel('Ort', { exact: true }).fill('Kassel');
await anlegen();
await neu();
const kundeId = await kundeFeld.locator('option', { hasText: 'Familie Mehrort' }).getAttribute('value');
await kundeFeld.selectOption(kundeId);
pruefe(await page.getByText('Am Markt 1, 34117 Kassel').isVisible(), 'Neuer Kunde mit einem Ort: Adresse steht als Zusammenfassung da');
await page.getByRole('button', { name: 'Adresse ändern' }).click();
await page.getByLabel('Einsatzort', { exact: true }).selectOption({ label: 'Andere Adresse eingeben' });
await page.getByLabel('Straße und Hausnummer').fill('Bahnhofstraße 5');
await page.getByLabel('Ort', { exact: true }).fill('Kassel');
await page.getByLabel('Was ist zu tun?').fill('Außenbeleuchtung');
await anlegen();
await neu();
await kundeFeld.selectOption(kundeId);
pruefe((await einsatzortArt()) === 'auswahl-leer', 'Mehrere Orte: keine stille Vorauswahl, Auswahl nötig');
await page.getByLabel('Was ist zu tun?').fill('Steckdosen im Bad erneuern');
await page.getByRole('button', { name: 'Auftrag anlegen' }).click();
const fokus = await page.evaluate(() => document.querySelector(`label[for="${document.activeElement?.id}"]`)?.textContent);
pruefe(fokus === 'Einsatzort' && /\/neu$/.test(page.url()), `Fehlender Einsatzort: kein Anlegen, Fokus springt zum Feld (${fokus})`);
const offen = page.getByLabel('Einsatzort', { exact: true }).locator('option', { hasText: 'Einsatzort noch offen' });
pruefe((await offen.count()) === 1, '„Einsatzort noch offen“ ist wählbar');

// Weitere Angaben: Werte bleiben beim Zuklappen erhalten
await page.goto(`${basis}/os/auftraege/auftraege/neu`, { waitUntil: 'networkidle' });
await page.getByRole('radio', { name: 'Neuer Kunde' }).click();
const weitere = page.locator('details.ak-weitere');
await weitere.locator('summary').click();
await page.getByLabel(/Was weißt du schon/).fill('Kunde wünscht Termin am Vormittag');
await page.getByLabel(/Zugang/).fill('Schlüssel beim Nachbarn');
await weitere.locator('summary').click();
pruefe(!(await weitere.evaluate((d) => d.open)), '„Weitere Angaben“ lässt sich zuklappen');
await weitere.locator('summary').click();
pruefe(
  (await page.getByLabel(/Was weißt du schon/).inputValue()) === 'Kunde wünscht Termin am Vormittag' && (await page.getByLabel(/Zugang/).inputValue()) === 'Schlüssel beim Nachbarn',
  'Werte bleiben nach Zu- und Aufklappen erhalten',
);

// Fehler bei leerem Namen: Fokus aufs Feld, Eingaben bleiben stehen
await page.getByRole('button', { name: 'Auftrag anlegen' }).click();
const fokusFeld = await page.evaluate(() => document.querySelector(`label[for="${document.activeElement?.id}"]`)?.textContent);
pruefe(fokusFeld === 'Name des Kunden', `Fehler: Fokus auf dem ersten fehlerhaften Feld (${fokusFeld})`);
pruefe((await page.getByLabel(/Zugang/).inputValue()) === 'Schlüssel beim Nachbarn', 'Nach dem Fehler bleiben alle Eingaben erhalten');
const beschrieben = await page.getByLabel('Name des Kunden').getAttribute('aria-describedby');
pruefe(!!beschrieben && !!(await page.locator(`[id="${beschrieben}"]`).textContent()), 'Fehlertext hängt per aria-describedby am Feld');

// Ohne Adresse anlegen (Einsatzort offen) klappt
await page.getByLabel('Name des Kunden').fill('Familie Test');
await page.getByLabel('Was ist zu tun?').fill('Wallbox prüfen');
await page.getByRole('button', { name: 'Auftrag anlegen' }).click();
await page.waitForURL(/\/os\/auftraege\/auftraege\/[^/]+$/, { timeout: 10000 }).catch(() => {});
pruefe(!/\/neu$/.test(page.url()), `Auftrag ohne Adresse angelegt (${new URL(page.url()).pathname})`);

await browser.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
