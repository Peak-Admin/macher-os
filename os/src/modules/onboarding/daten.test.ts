import { afterEach, describe, expect, it } from 'vitest';
import { LOKALE_CLOUD, setzeCloud, type Cloud } from '@core/cloud';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { messpunkte } from '@core/messung';
import {
  briefkopfErkennen,
  briefkopfLuecken,
  briefkopfPruefen,
  bundeslandAusPlz,
  csvZeilen,
  dublettenZusammenfuehren,
  entwurfAusErkannt,
  ibanGueltig,
  kiAufruf,
  kundenAusCsv,
  kundenAusDatei,
  kundenAusKontakten,
  LEERER_BRIEFKOPF,
  nameTeilen,
  preislisteErkennen,
  rolleVorschlag,
  setupEinrichten,
  setupFertig,
  setupGestartet,
  setupSchritt,
  teamEinladen,
  vorbereitet,
  type BriefkopfErkannt,
} from './daten';
import { blattZeilen, xlsxZeilen } from './xlsx';

const antwort = (status: number, body: unknown, typ = 'application/json') =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': typ } });

describe('Kunden aus Excel/CSV', () => {
  it('liest Excel-CSV mit Semikolon, Anführungszeichen und Umlauten und führt Dubletten zusammen', () => {
    const csv = '﻿Kundennummer;Name;Straße;PLZ;Ort;Telefon;E-Mail\n1001;"Müller, Anna";Lindenweg 1;34117;Kassel;0561 1234;anna@example.de\n1002;Bäckerei Sommer;Hauptstr. 4;34246;Vellmar;;\n;;;;;;\n1003;Müller, Anna;x;34117;Kassel;0171 999999;';
    const r = kundenAusCsv(csv);
    expect(r.fehler).toBeUndefined();
    expect(r.kunden).toHaveLength(2);
    expect(r.zusammengefuehrt).toBe(1);
    expect(r.kunden[0]).toMatchObject({ name: 'Müller, Anna', nummer: '1001', email: 'anna@example.de', adresse: { strasse: 'Lindenweg 1', plz: '34117', ort: 'Kassel' } });
    // die zweite Nummer geht nicht verloren
    expect(r.kunden[0].ansprechpartner.some((a) => a.telefon === '0171 999999')).toBe(true);
    expect(r.kunden[1].telefon).toBeUndefined();
  });

  it('setzt Vor- und Nachname zusammen und erkennt Firmen', () => {
    const r = kundenAusCsv('Vorname,Nachname,Firma,Tel\nPetra,Schulz,,0160 111\nKarl,Neumann,Hausverwaltung Nord,0561 222');
    expect(r.kunden.map((k) => [k.name, k.art])).toEqual([
      ['Petra Schulz', 'privat'],
      ['Hausverwaltung Nord', 'firma'],
    ]);
    expect(r.kunden[1].ansprechpartner[0].name).toBe('Karl Neumann');
  });

  it('erkennt den sevDesk-Export (Organisation, Mobil, Kunden-Nr.)', () => {
    const csv = 'Kunden-Nr.;Anrede;Vorname;Nachname;Organisation;Kategorie;Straße;PLZ;Ort;Telefon;Mobil;E-Mail\n1000;;;;Dachdecker Roth GmbH;Kunde;Ringstr. 2;80331;München;;0151 2223334;info@roth.example\n1001;Frau;Ina;Wolf;;Kunde;Weg 1;60311;Frankfurt;069 123456;;';
    const r = kundenAusCsv(csv);
    expect(r.vorlage).toBe('sevDesk');
    expect(r.kunden[0]).toMatchObject({ name: 'Dachdecker Roth GmbH', art: 'firma', nummer: '1000', telefon: '0151 2223334', email: 'info@roth.example' });
    expect(r.kunden[1]).toMatchObject({ name: 'Ina Wolf', art: 'privat', telefon: '069 123456' });
  });

  it('erkennt den Lexware-Export (Firmenname, Rechnungsadresse, Telefon geschäftlich)', () => {
    const csv = '"Kundennummer";"Firmenname";"Vorname";"Nachname";"Straße (Rechnungsadresse)";"PLZ (Rechnungsadresse)";"Ort (Rechnungsadresse)";"Telefon (geschäftlich)";"E-Mail (geschäftlich)"\n"10001";"";"Jan";"Koch";"Am Markt 3";"34117";"Kassel";"0561 77788";"jan@koch.example"';
    const r = kundenAusCsv(csv);
    expect(r.vorlage).toBe('Lexware');
    expect(r.kunden[0]).toMatchObject({ name: 'Jan Koch', nummer: '10001', telefon: '0561 77788', email: 'jan@koch.example', adresse: { strasse: 'Am Markt 3', plz: '34117', ort: 'Kassel' } });
  });

  it('fügt Straße und Hausnummer zusammen und erlaubt Zeilenumbrüche im Feld', () => {
    const r = kundenAusCsv('Name;Straße;Hausnummer;Notiz\nOtto;Bahnhofstr.;5a;"Hund\nim Garten"');
    expect(r.kunden[0].adresse?.strasse).toBe('Bahnhofstr. 5a');
    expect(r.kunden[0].notiz).toBe('Hund\nim Garten');
    expect(csvZeilen('a,b\n1,"x,y"')).toEqual([['a', 'b'], ['1', 'x,y']]);
  });

  it('erklärt, wenn die Namensspalte fehlt oder die Datei leer ist', () => {
    expect(kundenAusCsv('a;b\n1;2').fehler).toMatch(/Namen/);
    expect(kundenAusCsv('Name').fehler).toMatch(/keine Kunden/);
  });

  it('liest Windows-1252-Dateien (ältere Exporte) mit Umlauten', async () => {
    const bytes = new Uint8Array([...'Name;Ort\nJ'].map((c) => c.charCodeAt(0)).concat([0xfc], [...'rgen;K'].map((c) => c.charCodeAt(0)), [0xf6], [...'ln'].map((c) => c.charCodeAt(0))));
    const r = await kundenAusDatei(new Blob([bytes]));
    expect(r.kunden[0]).toMatchObject({ name: 'Jürgen', adresse: { ort: 'Köln' } });
  });

  it('lehnt alte .xls-Dateien verständlich ab', async () => {
    const f = new File([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])], 'kunden.xls');
    expect((await kundenAusDatei(f)).fehler).toMatch(/\.xlsx oder CSV/);
  });
});

// ---- minimale .xlsx im Test bauen (ZIP, Einträge ungepackt)
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

describe('Excel (.xlsx)', () => {
  const blatt =
    '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="inlineStr"><is><t>Telefon</t></is></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="C2" t="str"><v>0561 4711</v></c></row>' +
    '<row r="3"><c r="A3" t="inlineStr"><is><t>Bauer &amp; Söhne</t></is></c><c r="B3"><v>34117</v></c></row></sheetData></worksheet>';
  const gemeinsam = '<sst><si><t>Name</t></si><si><r><t>P</t></r><r><t>LZ</t></r></si><si><t>Müller</t></si></sst>';

  it('zerlegt Tabellenblatt-XML mit gemeinsamen Texten, Rich Text und Lücken', () => {
    expect(blattZeilen(blatt, ['Name', 'PLZ', 'Müller'])).toEqual([
      ['Name', 'PLZ', 'Telefon'],
      ['Müller', '', '0561 4711'],
      ['Bauer & Söhne', '34117'],
    ]);
  });

  it('liest das erste Blatt einer .xlsx-Datei und übernimmt Kunden', async () => {
    const datei = zip({ 'xl/sharedStrings.xml': gemeinsam, 'xl/worksheets/sheet1.xml': blatt, 'xl/worksheets/sheet2.xml': '<worksheet/>' });
    expect((await xlsxZeilen(datei.buffer as ArrayBuffer))[1]).toEqual(['Müller', '', '0561 4711']);
    const r = await kundenAusDatei(new File([datei as BlobPart], 'kunden.xlsx'));
    expect(r.kunden.map((k) => k.name)).toEqual(['Müller', 'Bauer & Söhne']);
    expect(r.vorlage).toBe('Excel-Liste');
  });
});

describe('Handy-Kontakte und Dubletten', () => {
  it('macht aus Kontakten Kunden und führt sie mit importierten zusammen', () => {
    const k = kundenAusKontakten([{ name: ['Petra Schulz'], tel: ['+49 160 1112233'], email: ['p@x.de'], address: [{ addressLine: ['Am Hang 4'], postalCode: '34128', city: 'Kassel' }] }, { name: [] }]);
    expect(k).toHaveLength(1);
    const csv = kundenAusCsv('Name;Telefon\nSchulz, Petra;0160 1112233').kunden;
    const r = dublettenZusammenfuehren([...csv, ...k]);
    expect(r.zusammengefuehrt).toBe(1);
    expect(r.kunden[0]).toMatchObject({ name: 'Schulz, Petra', email: 'p@x.de', adresse: { plz: '34128' } });
  });
});

describe('Briefkopf', () => {
  const erkannt: BriefkopfErkannt = {
    name: 'Elektro Meier GmbH', inhaber: 'Dipl.-Ing. Max Meier', strasse: 'Hauptstr. 1', plz: '34117', ort: 'Kassel', telefon: '0561 1', email: 'info@meier.de',
    steuernummer: '026 123 45678', ustId: '', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', zahlungszielTage: 10, stundensatz: 72.5,
    logo: { gefunden: false, x: 0, y: 0, breite: 0, hoehe: 0 },
  };

  it('übernimmt nur Erkanntes in den Entwurf und teilt den Namen', () => {
    const e = entwurfAusErkannt({ ...erkannt, telefon: '' }, { ...LEERER_BRIEFKOPF, telefon: '0170 5' });
    expect(e).toMatchObject({ name: 'Elektro Meier GmbH', inhaber: 'Dipl.-Ing. Max Meier', telefon: '0170 5', zahlungszielTage: 10 });
    expect(nameTeilen(e.inhaber)).toEqual({ vorname: 'Max', nachname: 'Meier' });
    expect(briefkopfLuecken(e)).toEqual(['Logo']);
    expect(briefkopfPruefen(e)).toBeUndefined();
    expect(briefkopfPruefen({ ...e, iban: 'DE00 1234' })).toMatch(/IBAN/);
    expect(briefkopfPruefen({ ...e, inhaber: '' })).toMatch(/Namen/);
  });

  it('prüft IBANs und leitet das Bundesland aus der PLZ ab', () => {
    expect(ibanGueltig('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(ibanGueltig('DE89370400440532013001')).toBe(false);
    expect(bundeslandAusPlz('34117')).toBe('HE');
    expect(bundeslandAusPlz('80331')).toBe('BY');
    expect(bundeslandAusPlz('89073')).toBe('BW'); // Ulm
    expect(bundeslandAusPlz('89231')).toBe('BY'); // Neu-Ulm
    expect(bundeslandAusPlz('10115')).toBe('BE');
    expect(bundeslandAusPlz('27568')).toBe('HB'); // Bremerhaven
    expect(bundeslandAusPlz('1234')).toBeUndefined();
  });
});

describe('KI-Erkennung im Browser (gemockter fetch)', () => {
  it('liefert den Briefkopf, wenn die Server-Funktion antwortet', async () => {
    let gesendet: unknown;
    const f = (async (_u: string, init: RequestInit) => ((gesendet = JSON.parse(String(init.body))), antwort(200, { briefkopf: { name: 'X' } }))) as unknown as typeof fetch;
    const r = await briefkopfErkennen({ website: 'meier.de' }, f);
    expect(r).toEqual({ ok: true, wert: { name: 'X' } });
    expect(gesendet).toEqual({ website: 'meier.de' });
  });

  it('meldet „nicht verbunden“ bei 501, 404 und HTML (lokale Entwicklung) – dann gilt der Rückfall', async () => {
    for (const a of [antwort(501, { fehler: 'nicht verbunden' }), antwort(404, 'Not found', 'text/plain'), antwort(200, '<!doctype html>', 'text/html')]) {
      const r = await kiAufruf('/api/ki/briefkopf', {}, (async () => a) as unknown as typeof fetch);
      expect(r).toMatchObject({ ok: false, art: 'nicht-verbunden' });
    }
  });

  it('gibt verständliche Fehler weiter und übersteht Netzwerkfehler', async () => {
    const r = await preislisteErkennen({ daten: 'x', mime: 'image/png' }, (async () => antwort(422, { fehler: 'In der Datei wurden keine Preise gefunden.' })) as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, art: 'fehler', fehler: 'In der Datei wurden keine Preise gefunden.' });
    const n = await kiAufruf('/x', {}, (async () => {
      throw new TypeError('offline');
    }) as unknown as typeof fetch);
    expect(n).toMatchObject({ ok: false, art: 'fehler' });
  });
});

describe('Einrichten mit eigenen Daten', () => {
  afterEach(() => setzeCloud(LOKALE_CLOUD));

  const briefkopf = { ...LEERER_BRIEFKOPF, name: ' Heizung Meier ', inhaber: 'Eva Meier', strasse: 'Ring 2', plz: '80331', ort: 'München', steuernummer: '143/123/45678', iban: 'de89 3704 0044 0532 0130 00', bic: 'cobadeffxxx', zahlungszielTage: 10, logo: 'data:image/png;base64,AAAA' };

  it('legt Betrieb, Briefkopf, Kunden, Team und angepasste Vorlagenpreise an – ohne Beispieldaten', () => {
    const e = setupEinrichten({
      gewerk: 'shk',
      briefkopf,
      kunden: kundenAusCsv('Name;Ort\nA;Kassel\nB;Baunatal').kunden,
      preise: { art: 'vorlage', prozent: 10 },
      team: [{ id: 'm-jonas', name: 'Jonas Becker', telefon: '0170 1234567', rolle: 'monteur' }],
    });
    expect(db.betrieb.get('betrieb')).toMatchObject({ name: 'Heizung Meier', gewerk: 'shk', teamgroesse: 2, adresse: { strasse: 'Ring 2', plz: '80331', ort: 'München' }, steuernummer: '143/123/45678', iban: 'DE89370400440532013000', zahlungszielTage: 10, onboardingFertig: true });
    expect(db.mitarbeiter.get('m-jonas')).toMatchObject({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', telefon: '0170 1234567' });
    expect(db.mitarbeiter.all().find((m) => m.rolle === 'chef')).toMatchObject({ vorname: 'Eva', nachname: 'Meier' });
    expect(db.kunden.all().map((k) => k.nummer)).toEqual(['K-1001', 'K-1002']);
    expect(db.auftraege.all()).toHaveLength(0);
    expect(db.kunden.all().some((k) => k.beispiel)).toBe(false);
    expect(einstellung('plan.bundesland', '')).toBe('BY');
    expect(einstellung<{ logo?: string; zusatz?: string }>('vorlagen.briefkopf', {})).toMatchObject({ logo: briefkopf.logo, zusatz: 'BIC COBADEFFXXX' });
    // +10 %, auf 50 Cent gerundet: Richtpreis Geselle SHK
    const geselle = db.leistungen.all().find((l) => l.name === 'Arbeitsstunde Geselle');
    expect(geselle && geselle.preis % 50).toBe(0);
    expect(db.leistungen.all().every((l) => l.preis % 10 === 0)).toBe(true);
    expect(e).toMatchObject({ kunden: 2, team: 1, bundesland: 'BY', briefkopfVollstaendig: true });
    expect(vorbereitet().every((x) => x.anzahl > 0)).toBe(true);
  });

  it('übernimmt eine bestätigte eigene Preisliste statt der Vorlage', () => {
    setupEinrichten({
      gewerk: 'elektro',
      briefkopf,
      kunden: [],
      preise: { art: 'eigen', liste: [{ name: 'Stunde Meister', einheit: 'h', preis: 85, kategorie: 'Lohn', an: true }, { name: 'Abgewählt', einheit: 'Stk', preis: 1, kategorie: 'X', an: false }] },
      team: [],
    });
    expect(db.leistungen.all().map((l) => [l.name, l.preis])).toEqual([['Stunde Meister', 8500]]);
  });

  it('lädt ohne Konto per Link ein (ehrlich gemessen) und mit Konto über cloud().einladen', async () => {
    const team = [{ id: 'm1', name: 'Jonas', telefon: '0170 1234567', rolle: 'monteur' as const }];
    expect(await teamEinladen(team)).toMatchObject({ kanal: 'link', gesendet: 0 });
    expect(messpunkte().at(-1)).toMatchObject({ ereignis: 'team.eingeladen', daten: { anzahl: 1, kanal: 'link' } });

    const eingeladen: unknown[] = [];
    setzeCloud({ ...LOKALE_CLOUD, aktiv: () => true, konto: () => ({ nutzerId: 'u1' }), einladen: async (id, ziel) => (eingeladen.push([id, ziel]), { status: 'gesendet' }) } as Cloud);
    expect(await teamEinladen(team)).toMatchObject({ kanal: 'sms', gesendet: 1 });
    expect(eingeladen).toEqual([['m1', { telefon: '0170 1234567' }]]);
  });

  it('schlägt Rollen aus der Teamgröße vor', () => {
    expect(rolleVorschlag([])).toBe('monteur');
    expect(rolleVorschlag(['monteur', 'monteur', 'monteur'])).toBe('buero');
    expect(rolleVorschlag(['buero', 'monteur', 'monteur'])).toBe('monteur');
  });
});

describe('Messung', () => {
  it('misst Start, Schritte und Ende mit Dauer', () => {
    sessionStorage.clear();
    const start = setupGestartet('direkt');
    expect(setupGestartet('direkt')).toBe(start); // Neuladen startet nicht neu
    setupSchritt(start, 1);
    setupFertig(start, { kunden: 3, leistungen: 12, team: 1, briefkopfVollstaendig: false, konto: 'lokal', briefkopfQuelle: 'foto', preise: 'vorlage' });
    const p = messpunkte().slice(-3);
    expect(p.map((x) => x.ereignis)).toEqual(['setup.gestartet', 'setup.schritt', 'setup.fertig']);
    expect(p[1].daten).toMatchObject({ schritt: 2, id: 'betrieb' });
    expect(p[2].daten).toMatchObject({ kunden: 3, team: 1, briefkopfQuelle: 'foto' });
    expect(typeof p[2].daten?.sekunden).toBe('number');
    expect(sessionStorage.getItem('macher-os:setup-start')).toBeNull();
  });
});
