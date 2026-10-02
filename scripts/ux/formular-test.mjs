/**
 * Verhaltenstest „Auftrag anlegen“ (Dialog über der Auftragsliste) im echten Browser (Spielwiese mit Beispieldaten):
 * Projektnummer vorbelegt (YYMM-XXX) und Doppel abgefangen, bekannte Adresse als Zusammenfassung,
 * Auswahlpflicht bei mehreren Orten, „Adresse noch offen“, Werte bleiben beim Zu- und Aufklappen erhalten,
 * Fehler führt zum Feld, Anlegen klappt.
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
const dialog = page.getByRole('dialog');
pruefe(await dialog.isVisible(), 'Alte Adresse …/neu öffnet den Dialog „Neuer Auftrag“');
const nummer = await dialog.getByLabel('Projektnummer').inputValue();
pruefe(/^\d{4}-\d{3}$/.test(nummer), `Projektnummer ist vorbelegt (${nummer})`);
const kundeFeld = page.getByLabel('Für welchen Kunden?');
// Auswahlfelder sind eigene Dropdowns (role=combobox + listbox), kein <select>
const optionenVon = async (feld) => {
  await feld.click();
  const texte = await page.getByRole('listbox').getByRole('option').allTextContents();
  await page.keyboard.press('Escape');
  return texte;
};
const waehle = async (feld, text) => {
  await feld.click();
  await page.getByRole('listbox').getByRole('option', { name: text, exact: true }).click();
};
const leerText = (await kundeFeld.locator('.mm-auswahl-wert--leer').textContent().catch(() => null)) ?? '';
const kunden = (await optionenVon(kundeFeld)).filter((t) => t && t !== leerText).map((text) => ({ wert: text, text }));
const einsatzortArt = async () => {
  if (await page.getByRole('button', { name: 'Adresse ändern' }).isVisible().catch(() => false)) return 'zusammenfassung';
  const ort = page.getByLabel('Leistungsort', { exact: true });
  if (!(await ort.count())) return 'keins';
  return (await ort.locator('.mm-auswahl-wert--leer').count()) ? 'auswahl-leer' : 'auswahl';
};
const arten = {};
for (const k of kunden) {
  await waehle(kundeFeld, k.wert);
  arten[await einsatzortArt()] ??= k;
}
pruefe(!!arten.zusammenfassung, `Ein bekannter Ort erscheint als lesbare Zusammenfassung mit „Adresse ändern“ (${arten.zusammenfassung?.text ?? '–'})`);

// Mehrere Orte: Kunde mit zwei Einsatzorten über das Formular selbst anlegen (neuer Kunde, dann „Adresse ändern“)
const neu = () => page.goto(`${basis}/os/auftraege/auftraege/neu`, { waitUntil: 'networkidle' });
const knopf = () => page.getByRole('dialog').getByRole('button', { name: 'Auftrag anlegen' });
const anlegen = async () => {
  await knopf().click();
  await page.waitForURL((u) => u.pathname.includes('/auftrag/'), { timeout: 10000 });
  // Die lokale Datenbank speichert verzögert – erst danach neu laden
  await page.waitForTimeout(2500);
};
await neu();
await page.getByRole('radio', { name: 'Neuer Kunde' }).click();
await page.getByLabel('Name des Kunden').fill('Familie Mehrort');
await page.getByLabel('Projektname').fill('Zählerschrank prüfen');
await page.getByLabel('Straße und Hausnummer').fill('Am Markt 1');
await page.getByLabel('PLZ').fill('34117');
await page.getByLabel('Stadt', { exact: true }).fill('Kassel');
await anlegen();
pruefe(await page.getByText(`#${nummer}`).first().isVisible(), `Akte zeigt die Nummer dezent unter dem Titel (#${nummer})`);
await neu();
const kundeId = (await optionenVon(kundeFeld)).find((t) => t.includes('Familie Mehrort'));
await waehle(kundeFeld, kundeId);
pruefe(await page.getByText('Am Markt 1, 34117 Kassel').isVisible(), 'Neuer Kunde mit einem Ort: Adresse steht als Zusammenfassung da');
await page.getByRole('button', { name: 'Adresse ändern' }).click();
await waehle(page.getByLabel('Leistungsort', { exact: true }), 'Andere Adresse eingeben');
await page.getByLabel('Straße und Hausnummer').fill('Bahnhofstraße 5');
await page.getByLabel('Stadt', { exact: true }).fill('Kassel');
await page.getByLabel('Projektname').fill('Außenbeleuchtung');
await page.getByLabel('Projektnummer').fill(nummer);
await knopf().click();
pruefe(/gibt es schon/.test((await page.getByRole('dialog').textContent()) ?? ''), 'Doppelte Projektnummer: klare Fehlermeldung, nichts angelegt');
await page.getByLabel('Projektnummer').fill(`${nummer}-B`);
await anlegen();
await neu();
await waehle(kundeFeld, kundeId);
pruefe((await einsatzortArt()) === 'auswahl-leer', 'Mehrere Orte: keine stille Vorauswahl, Auswahl nötig');
await page.getByLabel('Projektname').fill('Steckdosen im Bad erneuern');
await knopf().click();
const fokus = await page.evaluate(() => document.querySelector(`label[for="${document.activeElement?.id}"]`)?.textContent);
pruefe(fokus === 'Leistungsort' && /\/neu$/.test(page.url()), `Fehlender Leistungsort: kein Anlegen, Fokus springt zum Feld (${fokus})`);
const ortOptionen = await optionenVon(page.getByLabel('Leistungsort', { exact: true }));
pruefe(ortOptionen.filter((t) => t.includes('Adresse noch offen')).length === 1, '„Adresse noch offen“ ist wählbar');

// Weitere Angaben: Werte bleiben beim Zuklappen erhalten
await page.goto(`${basis}/os/auftraege/auftraege/neu`, { waitUntil: 'networkidle' });
await page.getByRole('radio', { name: 'Neuer Kunde' }).click();
const weitere = page.locator('details.ak-weitere');
await weitere.locator('summary').click();
await page.getByLabel(/Beschreibung/).fill('Kunde wünscht Termin am Vormittag');
await page.getByLabel(/Zugang/).fill('Schlüssel beim Nachbarn');
await weitere.locator('summary').click();
pruefe(!(await weitere.evaluate((d) => d.open)), '„Weitere Angaben“ lässt sich zuklappen');
await weitere.locator('summary').click();
pruefe(
  (await page.getByLabel(/Beschreibung/).inputValue()) === 'Kunde wünscht Termin am Vormittag' && (await page.getByLabel(/Zugang/).inputValue()) === 'Schlüssel beim Nachbarn',
  'Werte bleiben nach Zu- und Aufklappen erhalten',
);

// Fehler bei leerem Namen: Fokus aufs Feld, Eingaben bleiben stehen
await page.getByLabel('Projektname').fill('Wallbox prüfen');
await knopf().click();
const fokusFeld = await page.evaluate(() => document.querySelector(`label[for="${document.activeElement?.id}"]`)?.textContent);
pruefe(fokusFeld === 'Name des Kunden', `Fehler: Fokus auf dem ersten fehlerhaften Feld (${fokusFeld})`);
pruefe((await page.getByLabel(/Zugang/).inputValue()) === 'Schlüssel beim Nachbarn', 'Nach dem Fehler bleiben alle Eingaben erhalten');
const beschrieben = await page.getByLabel('Name des Kunden').getAttribute('aria-describedby');
pruefe(!!beschrieben && !!(await page.locator(`[id="${beschrieben}"]`).textContent()), 'Fehlertext hängt per aria-describedby am Feld');

// Ohne Adresse anlegen (Einsatzort offen) klappt
await page.getByLabel('Name des Kunden').fill('Familie Test');
await knopf().click();
await page.waitForURL((u) => u.pathname.includes('/auftrag/'), { timeout: 10000 }).catch(() => {});
pruefe(page.url().includes('/auftrag/'), `Auftrag ohne Adresse angelegt (${new URL(page.url()).pathname})`);

// Liste: Knopf öffnet den Dialog ohne Seitenwechsel, Filter stehen in der URL
await page.goto(`${basis}/os/auftraege/auftraege`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Auftrag anlegen' }).first().click();
pruefe(await page.getByRole('dialog').isVisible(), '„Auftrag anlegen“ in der Liste öffnet den Dialog');
await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();
await page.getByLabel('Sortierung').selectOption('nummer');
await page.waitForURL(/sort=nummer/, { timeout: 5000 }).catch(() => {});
await page.getByLabel('Phase').selectOption('anfrage');
await page.waitForURL(/phase=anfrage/, { timeout: 5000 }).catch(() => {});
pruefe(/sort=nummer/.test(page.url()) && /phase=anfrage/.test(page.url()), `Filter und Sortierung stehen in der URL (${page.url()})`);
await page.getByRole('button', { name: 'Filter zurücksetzen' }).first().click();
pruefe(!/phase=|sort=/.test(page.url()), '„Filter zurücksetzen“ leert die Filter');
const breite = await page.evaluate(() => document.documentElement.scrollWidth);
await page.setViewportSize({ width: 320, height: 800 });
await page.waitForTimeout(300);
const ueberlauf = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
pruefe(!ueberlauf && breite > 0, '320 px: kein waagerechter Überlauf');
pruefe(await page.getByRole('button', { name: /^Filter/ }).isVisible(), 'Handy: Zusatzfilter hinter „Filter“');

await browser.close();
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
