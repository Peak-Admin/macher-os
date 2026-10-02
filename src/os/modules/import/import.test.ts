import { beforeEach, describe, expect, it } from 'vitest';
import { db, zeitstrahl, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import { csvZeilen } from '@modules/onboarding/daten';
import { artErkennen, datumAus, geldAus, ibanGueltig, musterVon, spaltenMuster, tabelleAus, zuordnungAus, zuordnungVorschlagen, type ImportArt, type Tabelle } from './erkennen';
import { dateiLesen, fehlerTexte, importAusfuehren, importRueckgaengig, importe, nettoAus, phaseAus, pruefen, rolleAus, zusammenfassung } from './daten';

const tab = (csv: string): Tabelle => tabelleAus(csvZeilen(csv))!;
const feldVon = (art: ImportArt, t: Tabelle) => Object.fromEntries(zuordnungVorschlagen(art, t).map((s) => [s.kopf, s.feld]));
const vorschau = (art: ImportArt, csv: string) => {
  const t = tab(csv);
  return pruefen(art, t, zuordnungAus(zuordnungVorschlagen(art, t)));
};

beforeEach(() => {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', ustSatz: 19, zahlungszielTage: 14 } as never);
});

// ------------------------------------------------------------------ Werte

describe('Import: Werte lesen', () => {
  it('liest Geld deutsch, mit Euro-Zeichen und aus Excel', () => {
    expect(geldAus('1.234,56 €')).toBe(123456);
    expect(geldAus('1234,5')).toBe(123450);
    expect(geldAus('EUR 99')).toBe(9900);
    expect(geldAus('1234.56')).toBe(123456);
    expect(geldAus('1.234')).toBe(123400);
    expect(geldAus('-12,00')).toBe(-1200);
    expect(geldAus('12,00-')).toBe(-1200);
    expect(geldAus(19.99)).toBe(1999);
    expect(geldAus('abc')).toBeUndefined();
    expect(geldAus('1,2,3')).toBeUndefined();
    expect(geldAus('')).toBeUndefined();
  });

  it('liest Datumsangaben und Excel-Seriennummern', () => {
    expect(datumAus('14.03.2026')).toBe('2026-03-14');
    expect(datumAus('1.3.26')).toBe('2026-03-01');
    expect(datumAus('2026-03-14')).toBe('2026-03-14');
    expect(datumAus('14/03/2026')).toBe('2026-03-14');
    expect(datumAus('45730')).toBe('2025-03-14');
    expect(datumAus('31.02.2026')).toBeUndefined();
    expect(datumAus('32.13.2024')).toBeUndefined();
    expect(datumAus('morgen')).toBeUndefined();
  });

  it('prüft IBANs mit Prüfsumme', () => {
    expect(ibanGueltig('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(ibanGueltig('DE89370400440532013001')).toBe(false);
    expect(ibanGueltig('DE8937040044053201300')).toBe(false);
  });

  it('erkennt Wertemuster', () => {
    expect(musterVon('info@mueller.de')).toBe('email');
    expect(musterVon('DE89 3704 0044 0532 0130 00')).toBe('iban');
    expect(musterVon('34117')).toBe('plz');
    expect(musterVon('0561 / 47 11')).toBe('telefon');
    expect(musterVon('+49 171 2345678')).toBe('telefon');
    expect(musterVon('12.05.2026')).toBe('datum');
    expect(musterVon('1.234,56 €')).toBe('geld');
    expect(musterVon('99,90')).toBe('geld');
    expect(musterVon('RE-2025-0042')).toBe('rechnungsnummer');
    expect(musterVon('R2025001')).toBe('rechnungsnummer');
    expect(musterVon('42')).toBe('zahl');
    expect(musterVon('Heizung tauschen')).toBe('text');
  });

  it('bestimmt das Muster einer Spalte erst ab 70 % Übereinstimmung', () => {
    expect(spaltenMuster(['a@b.de', 'c@d.de', 'x@y.com', ''])).toBe('email');
    expect(spaltenMuster(['a@b.de', 'kein', 'nichts'])).toBeUndefined();
    expect(spaltenMuster(['a@b.de', 'c.d.de', 'x@y.com'])).toBe('email');
    expect(spaltenMuster(['12', '13', 'x'])).toBeUndefined();
    expect(spaltenMuster(['12,50', '7', '1.200,00'])).toBe('geld');
  });
});

// ------------------------------------------------------------------ Parser

describe('Import: Datei lesen', () => {
  it('findet die Kopfzeile auch unter einer Titelzeile und lässt leere Zeilen weg', () => {
    const t = tab('Kundenliste Stand 2026\n\nName;Telefon;Ort\nMüller;0561 1;Kassel\n;;\nSchulz;0561 2;Baunatal\n');
    expect(t.kopf).toEqual(['Name', 'Telefon', 'Ort']);
    expect(t.zeilen).toHaveLength(2);
    expect(t.zeilenNr).toEqual([4, 6]);
  });

  it('liest CSV mit Komma, Anführungszeichen und Windows-Umlauten', async () => {
    const bytes = new Uint8Array([...new TextEncoder().encode('Name,Ort\n"M'), 0xfc, ...new TextEncoder().encode('ller, Hans",Kassel\n')]);
    const r = await dateiLesen(new File([bytes], 'kunden.csv'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tabelle.zeilen[0]).toEqual(['Müller, Hans', 'Kassel']);
  });

  it('meldet leere Dateien und alte Excel-Formate verständlich', async () => {
    const leer = await dateiLesen(new File([''], 'leer.csv'));
    expect(leer.ok).toBe(false);
    const nurKopf = await dateiLesen(new File(['Name;Ort\n'], 'kopf.csv'));
    expect(!nurKopf.ok && nurKopf.fehler).toMatch(/nur Überschriften/);
    const xls = await dateiLesen(new File(['xyz'], 'alt.xls'));
    expect(!xls.ok && xls.fehler).toMatch(/\.xlsx/);
  });
});

// ------------------------------------------------------------------ Erkennung

describe('Import: Inhalt erkennen', () => {
  it('erkennt Kunden über Spaltennamen', () => {
    const t = tab('Kd-Nr.;Name;Straße;PLZ;Ort;Telefon;E-Mail\nK-1;Müller;Lindenweg 1;34117;Kassel;0561 1;m@x.de');
    expect(artErkennen(t, 'export.csv')[0].art).toBe('kunden');
    expect(feldVon('kunden', t)).toMatchObject({ 'Kd-Nr.': 'nummer', Name: 'name', Straße: 'strasse', PLZ: 'plz', Ort: 'ort', Telefon: 'telefon', 'E-Mail': 'email' });
  });

  it('ordnet Spalten mit unbekannten Namen über den Inhalt zu', () => {
    const t = tab('Name;Kontakt 1;Kontakt 2;Feld 3\nMüller;mueller@web.de;0561 123456;34117\nSchulz;schulz@web.de;0171 2223334;34119');
    const v = zuordnungVorschlagen('kunden', t);
    expect(v.find((s) => s.kopf === 'Kontakt 1')).toMatchObject({ feld: 'email', grund: 'werte', satz: expect.stringContaining('E-Mail-Adressen') });
    expect(v.find((s) => s.kopf === 'Kontakt 2')).toMatchObject({ feld: 'telefon', grund: 'werte' });
    expect(v.find((s) => s.kopf === 'Feld 3')).toMatchObject({ feld: 'plz', grund: 'werte' });
    expect(v.find((s) => s.kopf === 'Name')?.satz).toBe('Diese Spalte sieht nach Name aus');
  });

  it('erkennt offene Rechnungen an Rechnungsnummer und Fälligkeit', () => {
    const t = tab('Rechnungsnr.;Kunde;Datum;Fällig am;Betrag\nRE-2025-0101;Müller;01.03.2026;15.03.2026;1.190,00 €');
    expect(artErkennen(t)[0].art).toBe('rechnungen');
    expect(feldVon('rechnungen', t)).toMatchObject({ 'Rechnungsnr.': 'nummer', Kunde: 'kundeName', Datum: 'datum', 'Fällig am': 'faelligAm', Betrag: 'brutto' });
  });

  it('erkennt Rechnungsnummern auch ohne passenden Spaltennamen', () => {
    const t = tab('Beleg;Empfänger;Summe\nRE-2025-01;Müller;100,00\nRE-2025-02;Schulz;50,00');
    expect(artErkennen(t)[0].art).toBe('rechnungen');
  });

  it('erkennt Angebote, Aufträge, Artikel, Leistungen, Mitarbeiter, Ansprechpartner und Preise', () => {
    expect(artErkennen(tab('Angebotsnr.;Kunde;Gültig bis;Netto\nAN-1;Müller;01.04.2026;500,00'))[0].art).toBe('angebote');
    expect(artErkennen(tab('Auftragsnummer;Kunde;Bauvorhaben;Status\nA-1;Müller;Bad sanieren;in Arbeit'))[0].art).toBe('auftraege');
    expect(artErkennen(tab('Art.-Nr.;Bezeichnung;EK;VK;Einheit\n4711;Kabel NYM 3x1,5;0,45;0,90;m'))[0].art).toBe('artikel');
    expect(artErkennen(tab('Leistung;Einheit;Preis;Minuten\nSteckdose setzen;Stk;45,00;30'))[0].art).toBe('leistungen');
    expect(artErkennen(tab('Vorname;Nachname;Rolle;Wochenstunden;Urlaub\nMax;Muster;Geselle;40;30'))[0].art).toBe('mitarbeiter');
    expect(artErkennen(tab('Firma;Ansprechpartner;Funktion;Telefon\nHV Nord;Frau Kurz;Hausverwalterin;0561 9'))[0].art).toBe('ansprechpartner');
    expect(artErkennen(tab('Bezeichnung;Neuer Preis\nSteckdose setzen;49,00'))[0].art).toBe('preise');
  });

  it('nutzt den Dateinamen als Hinweis', () => {
    const t = tab('Name;Nummer\nA;1');
    expect(artErkennen(t, 'Mitarbeiterliste.xlsx')[0].art).toBe('mitarbeiter');
    expect(artErkennen(t, 'Kunden 2026.csv')[0].art).toBe('kunden');
  });

  it('nimmt keine E-Mail-Spalte als Nummer, nur weil sie „Nr“ heißt', () => {
    const t = tab('Nr;Name\na@b.de;Müller\nc@d.de;Schulz');
    const v = zuordnungVorschlagen('kunden', t);
    expect(v.find((s) => s.kopf === 'Nr')?.feld).toBe('email');
  });
});

// ------------------------------------------------------------------ Prüfen & Dubletten

describe('Import: Vorschau und Dubletten', () => {
  it('zählt neue, doppelte und fehlerhafte Kunden und erklärt Fehler je Zeile', () => {
    db.kunden.create({ art: 'privat', name: 'Petra Schulz', telefon: '0160 1112233', ansprechpartner: [] });
    const v = vorschau(
      'kunden',
      'Name;Telefon;E-Mail;PLZ\nMüller;0561 1;mueller@web.de;34117\nP. Schulz;+49 160 111 22 33;;\nMüller;0561 1;;\n;0561 9;;\nBauer;;bauer.web.de;34117\nKoch;;;341\n',
    );
    expect(v.neu).toBe(1);
    expect(v.doppelt).toBe(2);
    expect(v.fehler).toBe(3);
    expect(zusammenfassung(v)).toBe('1 Kunde, 2 doppelt, 3 mit Fehler');
    expect(fehlerTexte(v)).toEqual(['Zeile 5: Name fehlt', 'Zeile 6: E-Mail fehlt das @', 'Zeile 7: PLZ „341“ hat nicht 5 Ziffern']);
    expect(v.zeilen.find((z) => z.zeile === 3)?.hinweis).toMatch(/gibt es schon: Petra Schulz/);
    expect(v.zeilen.find((z) => z.zeile === 4)?.hinweis).toBe('steht schon in Zeile 2');
  });

  it('erkennt doppelte Artikel über Nummer und EAN', () => {
    db.artikel.create({ name: 'Kabel', nummer: '4711', einheit: 'm', ek: 40, vk: 90, aktiv: true });
    const v = vorschau('artikel', 'Art.-Nr.;Bezeichnung;VK\n4711;Kabel NYM;0,95\n4712;Dose;1,20\n4712;Dose;1,20');
    expect(v.zeilen.map((z) => z.status)).toEqual(['doppelt', 'neu', 'doppelt']);
  });

  it('meldet Rechnungen mit vorhandener Nummer als doppelt und neue Kunden als Hinweis', () => {
    db.rechnungen.create({ nummer: 'RE-1', art: 'rechnung', kundeId: 'x', titel: 'x', positionen: [], status: 'versendet', datum: '2026-01-01', faelligAm: '2026-01-15', mahnstufe: 0 });
    const v = vorschau('rechnungen', 'Rechnungsnr.;Kunde;Betrag\nRE-1;Müller;100,00\nRE-2;Neukunde GmbH;200,00\nRE-3;;50,00\nRE-4;Müller;');
    expect(v.zeilen.map((z) => z.status)).toEqual(['doppelt', 'neu', 'fehler', 'fehler']);
    expect(v.neueKunden).toBe(1);
    expect(v.zeilen[1].hinweis).toMatch(/neuer Kunde „Neukunde GmbH“/);
    expect(fehlerTexte(v)).toEqual(['Zeile 4: Kunde fehlt', 'Zeile 5: Betrag fehlt']);
  });

  it('meldet Preise für Unbekanntes als Fehler', () => {
    db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, aktiv: true });
    const v = vorschau('preise', 'Bezeichnung;Neuer Preis\nSteckdose setzen;49,00\nFliesen legen;60,00');
    expect(v.zeilen.map((z) => z.status)).toEqual(['aktualisieren', 'fehler']);
    expect(v.zeilen[0].hinweis).toMatch(/bisher 45,00 €/);
  });

  it('übersetzt Rollen und Stände', () => {
    expect(rolleAus('Geselle')).toBe('monteur');
    expect(rolleAus('Bürokauffrau')).toBe('buero');
    expect(rolleAus('Auszubildender')).toBe('azubi');
    expect(rolleAus('Inhaber')).toBe('chef');
    expect(phaseAus('in Arbeit')).toBe('in_arbeit');
    expect(phaseAus('Angebot raus')).toBe('angebot');
    expect(phaseAus('')).toBe('beauftragt');
  });
});

// ------------------------------------------------------------------ Übernehmen & Rückgängig

describe('Import: übernehmen und rückgängig machen', () => {
  it('ergänzt die von Excel verschluckte führende Null der PLZ', () => {
    importAusfuehren(vorschau('kunden', 'Name;PLZ;Ort\nSchmidt;1067;Dresden'));
    expect(db.kunden.all()[0].adresse?.plz).toBe('01067');
  });

  it('legt Kunden an, setzt kein Beispiel-Kennzeichen und meldet import.abgeschlossen', () => {
    const ereignisse: unknown[] = [];
    const aus = on('import.abgeschlossen', (e) => ereignisse.push(e.daten));
    const v = vorschau('kunden', 'Name;Straße;PLZ;Ort;Telefon\nMüller;Lindenweg 1;34117;Kassel;0561 1\nSchulz;;;;0561 2');
    const lauf = importAusfuehren(v, { dateiname: 'kunden.csv' });
    aus();
    const k = db.kunden.all();
    expect(k.map((x) => x.name).sort()).toEqual(['Müller', 'Schulz']);
    expect(k.every((x) => !x.beispiel)).toBe(true);
    expect(k.find((x) => x.name === 'Müller')?.adresse).toEqual({ strasse: 'Lindenweg 1', plz: '34117', ort: 'Kassel' });
    expect(lauf.angelegt).toHaveLength(2);
    expect(ereignisse).toEqual([{ art: 'kunden', angelegt: 2, geaendert: 0, fehler: 0, doppelt: 0 }]);
  });

  it('läuft als Akteur „Import“: der Verlauf zeigt die Herkunft, auch beim Rückgängig', () => {
    const lauf = importAusfuehren(vorschau('kunden', 'Name;Ort\nMüller;Kassel'));
    const k = db.kunden.all()[0];
    expect(zeitstrahl({ typ: 'kunden', id: k.id }).find((e) => e.aenderung === 'created')).toMatchObject({ quelle: 'import', akteurId: 'import.kunden' });
    importRueckgaengig(lauf.id);
    expect(zeitstrahl({ typ: 'kunden', id: k.id }).find((e) => e.aenderung === 'removed')).toMatchObject({ quelle: 'import', akteurId: 'import.rueckgaengig' });
  });

  it('verknüpft Rechnungen per ID mit vorhandenen oder neu angelegten Kunden – Geld in Cent', () => {
    const m = db.kunden.create({ art: 'privat', name: 'Müller', nummer: 'K-1001', ansprechpartner: [] });
    const v = vorschau('rechnungen', 'Rechnungsnr.;Kd-Nr.;Kunde;Datum;Fällig am;Betrag\nR-1;K-1001;Müller;01.03.2026;15.03.2026;1.190,00 €\nR-2;;Neu GmbH;02.03.2026;;119,00\nR-3;;Neu GmbH;03.03.2026;;238,00');
    importAusfuehren(v);
    const r1 = db.rechnungen.all().find((r) => r.nummer === 'R-1')!;
    expect(r1.kundeId).toBe(m.id);
    expect(r1.positionen[0].einzelpreis).toBe(100000);
    expect(r1.status).toBe('versendet');
    expect(r1.faelligAm).toBe('2026-03-15');
    const neu = db.kunden.all().filter((k) => k.name === 'Neu GmbH');
    expect(neu).toHaveLength(1);
    expect(db.rechnungen.all().filter((r) => r.kundeId === neu[0].id)).toHaveLength(2);
    expect(db.rechnungen.all().find((r) => r.nummer === 'R-2')?.faelligAm).toBe('2026-03-16');
  });

  it('legt zu offenen Angeboten den Auftrag an, in dem das Angebot liegt', () => {
    db.kunden.create({ art: 'privat', name: 'Müller', ansprechpartner: [] });
    importAusfuehren(vorschau('angebote', 'Angebotsnr.;Kunde;Betreff;Netto\nAN-7;Müller;Bad sanieren;5.000,00'));
    const a = db.angebote.all()[0];
    const auftrag = db.auftraege.get(a.auftragId)!;
    expect(a.nummer).toBe('AN-7');
    expect(a.positionen[0].einzelpreis).toBe(500000);
    expect(auftrag.phase).toBe('angebot');
    expect(auftrag.kundeId).toBe(a.kundeId);
  });

  it('rechnet Brutto mit dem USt-Satz in Netto um', () => {
    expect(nettoAus({ brutto: '119,00' }, 19)).toBe(10000);
    expect(nettoAus({ netto: '50,00', brutto: '119,00' }, 19)).toBe(5000);
    expect(nettoAus({ brutto: '100,00' }, 0)).toBe(10000);
  });

  it('macht den ganzen Import rückgängig – Angelegtes in den Papierkorb, Preise zurück', () => {
    const l = db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, aktiv: true });
    const preise = importAusfuehren(vorschau('preise', 'Bezeichnung;Neuer Preis\nSteckdose setzen;49,00'));
    expect(db.leistungen.get(l.id)?.preis).toBe(4900);
    const kunden = importAusfuehren(vorschau('kunden', 'Name\nMüller\nSchulz'));
    expect(db.kunden.all()).toHaveLength(2);

    expect(importRueckgaengig(kunden.id)).toEqual({ entfernt: 2, zurueck: 0 });
    expect(db.kunden.all()).toHaveLength(0);
    expect(db.kunden.allMitGeloeschten()).toHaveLength(2);
    expect(importe.get(kunden.id)?.rueckgaengigAm).toBeTruthy();
    expect(importRueckgaengig(kunden.id)).toEqual({ entfernt: 0, zurueck: 0 });

    importRueckgaengig(preise.id);
    expect(db.leistungen.get(l.id)?.preis).toBe(4500);
  });

  it('ergänzt Ansprechpartner am Kunden und nimmt sie beim Rückgängig wieder heraus', () => {
    const k = db.kunden.create({ art: 'hausverwaltung', name: 'HV Nord', ansprechpartner: [{ id: 'a', name: 'Herr Alt' }] });
    const lauf = importAusfuehren(vorschau('ansprechpartner', 'Firma;Ansprechpartner;Funktion;Telefon\nHV Nord;Frau Kurz;Hausmeisterin;0561 9\nHV Nord;Herr Alt;;\nGibtsNicht;Frau X;;'));
    expect(db.kunden.get(k.id)?.ansprechpartner.map((a) => a.name)).toEqual(['Herr Alt', 'Frau Kurz']);
    expect(lauf.doppelt).toBe(1);
    expect(lauf.fehler).toBe(1);
    expect(lauf.meldungen[0]).toMatch(/Zeile 4: Kunde „GibtsNicht“ gibt es noch nicht/);
    importRueckgaengig(lauf.id);
    expect(db.kunden.get(k.id)?.ansprechpartner.map((a) => a.name)).toEqual(['Herr Alt']);
  });

  it('legt Mitarbeiter mit Rolle und Vertragswerten an', () => {
    importAusfuehren(vorschau('mitarbeiter', 'Name;Rolle;Wochenstunden;Urlaub;Eintritt\nMax Muster;Geselle;38,5;28;01.04.2024'));
    const m = db.mitarbeiter.all()[0];
    expect(m).toMatchObject({ vorname: 'Max', nachname: 'Muster', rolle: 'monteur', wochenstunden: 38.5, urlaubstageJahr: 28, eintritt: '2024-04-01', aktiv: true });
  });

  it('legt Artikel und Leistungen mit Einheit und Preisen in Cent an', () => {
    importAusfuehren(vorschau('artikel', 'Art.-Nr.;Bezeichnung;Einheit;EK;VK\n4711;Kabel;Meter;0,45;0,90'));
    expect(db.artikel.all()[0]).toMatchObject({ nummer: '4711', einheit: 'm', ek: 45, vk: 90 });
    importAusfuehren(vorschau('leistungen', 'Leistung;Einheit;Preis;Minuten\nSteckdose setzen;Stk;45,00;30'));
    expect(db.leistungen.all()[0]).toMatchObject({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, minuten: 30 });
  });
});

// ------------------------------------------------------------------ Excel

/** minimale .xlsx (ZIP, Einträge ungepackt) */
function zip(dateien: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const teile: number[] = [];
  const zentral: number[] = [];
  const le = (n: number, b: number) => Array.from({ length: b }, (_, i) => (n >>> (8 * i)) & 0xff);
  let anzahl = 0;
  for (const [name, inhalt] of Object.entries(dateien)) {
    const n = enc.encode(name);
    const d = enc.encode(inhalt);
    const offset = teile.length;
    teile.push(...le(0x04034b50, 4), ...le(20, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(d.length, 4), ...le(d.length, 4), ...le(n.length, 2), 0, 0, ...n, ...d);
    zentral.push(...le(0x02014b50, 4), ...le(20, 2), ...le(20, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(d.length, 4), ...le(d.length, 4), ...le(n.length, 2), 0, 0, 0, 0, 0, 0, 0, 0, ...le(0, 4), ...le(offset, 4), ...n);
    anzahl++;
  }
  const start = teile.length;
  return new Uint8Array([...teile, ...zentral, ...le(0x06054b50, 4), 0, 0, 0, 0, ...le(anzahl, 2), ...le(anzahl, 2), ...le(zentral.length, 4), ...le(start, 4), 0, 0]);
}

describe('Import: Excel', () => {
  it('liest offene Rechnungen aus .xlsx mit Excel-Zahlen und Excel-Datum', async () => {
    const zelle = (r: string, t: string) => `<c r="${r}" t="inlineStr"><is><t>${t}</t></is></c>`;
    const blatt =
      '<worksheet><sheetData>' +
      `<row r="1">${zelle('A1', 'Rechnungsnummer')}${zelle('B1', 'Kunde')}${zelle('C1', 'Rechnungsdatum')}${zelle('D1', 'Brutto')}</row>` +
      `<row r="2">${zelle('A2', 'RE-2026-007')}${zelle('B2', 'Müller')}<c r="C2"><v>46082</v></c><c r="D2"><v>1190.5</v></c></row>` +
      '</sheetData></worksheet>';
    const r = await dateiLesen(new File([zip({ 'xl/worksheets/sheet1.xml': blatt }) as BlobPart], 'OP-Liste.xlsx'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(artErkennen(r.tabelle, 'OP-Liste.xlsx')[0].art).toBe('rechnungen');
    importAusfuehren(pruefen('rechnungen', r.tabelle, zuordnungAus(zuordnungVorschlagen('rechnungen', r.tabelle))));
    const re = db.rechnungen.all()[0];
    expect(re).toMatchObject({ nummer: 'RE-2026-007', datum: '2026-03-01' });
    expect(re.positionen[0].einzelpreis).toBe(Math.round(119050 / 1.19));
  });
});
