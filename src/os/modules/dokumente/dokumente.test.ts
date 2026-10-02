import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute } from '@core/format';
import { setzeEinstellung } from '@core/einstellungen';
import { testBetrieb, vorTagen } from '@modules/rechnungen/testdaten';
import { festschreiben, rechnungErstellen } from '@modules/rechnungen/logik';
import { rechnungAendern } from '@modules/rechnungen/typen';
import { berichtErstellen } from '@modules/berichte/daten';
import { vorlagen } from '@modules/vorlagen/daten';
import { mahnungen, vorbereiten } from '@modules/mahnungen/daten';
import modul from './index';
import { artVon, dokumentArt, dokumenteZumAuftrag, erstellbareArten } from './arten';
import { empfangBestaetigen, geschaeftsdokumente, positionenVon } from './daten';
import { dokumentversionen, historie, versionenVon, versionMerken } from './historie';
import { kuerzelSetzen, naechsteDokumentNummer, NUMMERN_KEY } from './nummern';
import { fehlendeVariablen, geschaeftsdokumentMitTexten, ohneLuecken, textbaustein, textFuer, variablenFuer } from './variablen';
import { versandAusfuehren, versandVorbereiten } from './versand';

let t: ReturnType<typeof testBetrieb>;
/** Geldbeträge enthalten ein geschütztes Leerzeichen */
const n = (x: unknown) => String(x).replace(/\u00a0/g, ' ');

function angebot(status: 'angenommen' | 'versendet' = 'angenommen') {
  return db.angebote.create({
    nummer: 'AN-2026-0007',
    auftragId: t.auftrag.id,
    kundeId: t.kunde.id,
    titel: 'Bad',
    positionen: [
      { id: 'a', art: 'leistung', text: 'Bad komplett', menge: 1, einheit: 'Psch', einzelpreis: 1_000_000 },
      { id: 'o', art: 'leistung', text: 'Option Handtuchheizkörper', menge: 1, einheit: 'Stk', einzelpreis: 50_000, optional: true },
    ],
    status,
    datum: vorTagen(10),
    gueltigBis: heute(),
    version: 1,
  });
}

beforeAll(() => {
  modul.init?.();
});

beforeEach(() => {
  t = testBetrieb();
  globalThis.open = vi.fn() as unknown as typeof globalThis.open;
});

describe('Variablen', () => {
  it('setzt Punkt-Namen und alte Namen aus dem Dokument ein', () => {
    const r = rechnungErstellen(t.auftrag.id, 'rechnung')!;
    rechnungAendern(r.id, { positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 2, einheit: 'h', einzelpreis: 5000 }] });
    const bezug = { typ: 'rechnungen', id: r.id };
    expect(n(textFuer('{kunde.anrede}, {kunde.name}: {auftrag.titel} ({auftrag.nummer}) – {summe}, netto {summe.netto}. {betrieb.name}', bezug))).toBe(
      'Guten Tag Familie Hoffmann, Familie Hoffmann: Bad sanieren (A-2026-0001) – 119,00 €, netto 100,00 €. Elektro Muster GmbH',
    );
    expect(n(textFuer('{anrede} {kunde} {betrag} {dokument.art}', bezug))).toBe('Guten Tag Familie Hoffmann Familie Hoffmann 119,00 € Rechnung');
  });

  it('lässt unbekannte oder leere Variablen stehen und meldet sie', () => {
    const bezug = { typ: 'auftraege', id: t.auftrag.id };
    expect(textFuer('Hallo {kunde.name}, {gibtsnicht} {dokument.nummer}', bezug)).toBe('Hallo Familie Hoffmann, {gibtsnicht} {dokument.nummer}');
    expect(fehlendeVariablen('{kunde.name} {gibtsnicht} {dokument.nummer}', bezug)).toEqual(['gibtsnicht', 'dokument.nummer']);
  });

  it('{summe} der Schlussrechnung ist der Zahlbetrag nach gezahlten Abschlägen', () => {
    angebot();
    const ab = rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 30 })!;
    expect(festschreiben(ab.id).ok).toBe(true);
    db.zahlungen.create({ rechnungId: ab.id, betrag: 357_000, datum: heute(), art: 'ueberweisung' });
    const s = rechnungErstellen(t.auftrag.id, 'schluss')!;
    const v = variablenFuer({ typ: 'rechnungen', id: s.id });
    expect(n(v.summe)).toBe('8.330,00 €');
    expect(n(v['summe.brutto'])).toBe('11.900,00 €');
    expect(v['dokument.art']).toBe('Schlussrechnung');
  });

  it('Mahnung: Summe mit Gebühr, Frist als {faellig}', () => {
    const r = rechnungErstellen(t.auftrag.id, 'rechnung')!;
    rechnungAendern(r.id, { leistungszeitraum: 'Sept.', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'h', einzelpreis: 10_000 }] });
    festschreiben(r.id);
    rechnungAendern(r.id, { faelligAm: vorTagen(40) });
    const m = vorbereiten(db.rechnungen.get(r.id) as never, 2);
    const v = variablenFuer({ typ: 'mahnungen', id: m.id });
    expect(v['dokument.art']).toBe('1. Mahnung');
    expect(n(v.offen)).toBe('119,00 €');
    expect(n(v.summe)).toMatch(/^1\d\d,\d\d €$/); // 119 € + 5 € Gebühr + Zinsen
  });

  it('Versand: Zeilen mit Variablen ohne Wert fallen weg, Artikel passt zur Dokumentart', () => {
    expect(ohneLuecken('Hallo,\n\nruf an: {betrieb.telefon}\n\nGruß')).toEqual({ text: 'Hallo,\n\nGruß', fehlend: ['betrieb.telefon'] });
    const ls = geschaeftsdokumentMitTexten(t.auftrag.id, 'lieferschein')!;
    expect(textFuer('anbei {dokument.bezeichnung}', { typ: 'geschaeftsdokumente', id: ls.id })).toBe(`anbei unseren Lieferschein ${ls.nummer}`);
  });

  it('Textbaustein aus den Vorlagen gewinnt, sonst gilt der Standard', () => {
    const bezug = { typ: 'auftraege', id: t.auftrag.id };
    expect(textbaustein('auftragsbestaetigung.text', 'Standard für {kunde.name}', bezug).text).toBe('Standard für Familie Hoffmann');
    vorlagen.create({ schluessel: 'auftragsbestaetigung.text', art: 'dokument', titel: 'AB', text: 'Eigener Text für {auftrag.titel}' });
    expect(textbaustein('auftragsbestaetigung.text', 'Standard', bezug).text).toBe('Eigener Text für Bad sanieren');
  });
});

describe('Registry', () => {
  it('kennt alle 16 Arten und ordnet Objekte richtig zu', () => {
    expect(new Set(DOKUMENT_ARTEN_IDS())).toEqual(
      new Set(['angebot', 'auftragsbestaetigung', 'lieferschein', 'rapport', 'arbeitsbericht', 'baustellenbericht', 'pruefprotokoll', 'abnahme', 'rechnung', 'abschlagsrechnung', 'teilrechnung', 'schlussrechnung', 'gutschrift', 'storno', 'zahlungserinnerung', 'mahnung']),
    );
    const b = berichtErstellen({ auftragId: t.auftrag.id, art: 'regiebericht' });
    expect(artVon({ typ: 'berichte', id: b.id })?.id).toBe('arbeitsbericht');
    expect(dokumentArt('arbeitsbericht').label).toBe('Arbeitsbericht');
  });

  it('listet alle Dokumente eines Auftrags – ohne Geld-Recht ohne Preise', () => {
    angebot();
    rechnungErstellen(t.auftrag.id, 'rechnung');
    berichtErstellen({ auftragId: t.auftrag.id, art: 'pruefprotokoll' });
    geschaeftsdokumentMitTexten(t.auftrag.id, 'lieferschein');
    const alle = dokumenteZumAuftrag(t.auftrag.id).map((d) => d.art.id);
    expect(alle).toEqual(expect.arrayContaining(['angebot', 'rechnung', 'pruefprotokoll', 'lieferschein']));
    const monteur = dokumenteZumAuftrag(t.auftrag.id, false).map((d) => d.art.id);
    expect(monteur).toEqual(expect.arrayContaining(['pruefprotokoll', 'lieferschein']));
    expect(monteur).not.toContain('angebot');
    expect(monteur).not.toContain('rechnung');
  });

  it('schlägt passend zur Phase vor', () => {
    db.auftraege.update(t.auftrag.id, { phase: 'beauftragt' });
    const arten = erstellbareArten(db.auftraege.get(t.auftrag.id)!);
    expect(arten[0].vorschlag).toBe(true);
    expect(arten.filter((a) => a.vorschlag).map((a) => a.art.id)).toEqual(expect.arrayContaining(['auftragsbestaetigung', 'abschlagsrechnung']));
    expect(arten.map((a) => a.art.id)).not.toContain('storno');
  });

  it('erzeugt über die Registry-Aktion am Auftrag', () => {
    const pfad = modul.aktionen!['dokument.erstellen']({ auftragId: t.auftrag.id, art: 'baustellenbericht' });
    expect(pfad).toMatch(/^\/auftraege\/berichte\//);
  });
});

describe('Auftragsbestätigung und Lieferschein', () => {
  it('Auftragsbestätigung verweist aufs angenommene Angebot (ohne Bedarfspositionen) und hat einen eigenen Nummernkreis', () => {
    const an = angebot();
    let erstellt = 0;
    const aus = on('dokument.erstellt', () => erstellt++);
    const d = geschaeftsdokumentMitTexten(t.auftrag.id, 'auftragsbestaetigung')!;
    aus();
    expect(erstellt).toBe(1);
    expect(d.nummer).toMatch(/^AB-\d{4}-0001$/);
    expect(d.angebotId).toBe(an.id);
    expect(d.positionen).toBeUndefined(); // keine Kopie
    expect(positionenVon(d).map((p) => p.text)).toEqual(['Bad komplett']);
    expect(d.text).toContain('Bad sanieren');
    // zweiter Aufruf: derselbe Entwurf
    expect(geschaeftsdokumentMitTexten(t.auftrag.id, 'auftragsbestaetigung')!.id).toBe(d.id);
  });

  it('Lieferschein zeigt das Material des Auftrags und wird unterschrieben', () => {
    db.material.create({ auftragId: t.auftrag.id, text: 'Kabel NYM 3x1,5', menge: 50, einheit: 'm', ek: 80, status: 'verbraucht' });
    db.material.create({ auftragId: t.auftrag.id, text: 'Noch bestellt', menge: 1, einheit: 'Stk', ek: 80, status: 'bestellt' });
    const d = geschaeftsdokumentMitTexten(t.auftrag.id, 'lieferschein')!;
    expect(positionenVon(d).map((p) => `${p.menge} ${p.einheit} ${p.text}`)).toEqual(['50 m Kabel NYM 3x1,5']);
    const typen: string[] = [];
    const aus = on('lieferschein.*', (e) => typen.push(e.typ));
    empfangBestaetigen(d.id, { bild: 'data:image/png;base64,AAAA', name: 'Herr Hoffmann' });
    aus();
    expect(geschaeftsdokumente.get(d.id)?.status).toBe('unterschrieben');
    expect(typen).toEqual(['lieferschein.unterschrieben']);
    expect(versionenVon({ typ: 'geschaeftsdokumente', id: d.id }).map((v) => v.anlass)).toEqual(['unterschrieben']);
  });

  it('Nummernkreis-Kürzel ist einstellbar', () => {
    kuerzelSetzen('lieferschein', 'LF');
    expect(naechsteDokumentNummer('lieferschein', [])).toMatch(/^LF-\d{4}-0001$/);
    kuerzelSetzen('lieferschein', 'kaputt!');
    expect(naechsteDokumentNummer('lieferschein', [])).toMatch(/^LF-/);
    setzeEinstellung(NUMMERN_KEY, {});
    expect(naechsteDokumentNummer('lieferschein', ['LS-2020-0004'])).toMatch(/^LS-\d{4}-0001$/);
  });
});

describe('Versand: Vorbereiten → Vorschau → Bestätigen', () => {
  it('Rechnungsentwurf: Vorschau nennt die künftige Nummer, fehlende Pflichtangaben verhindern den Versand', async () => {
    db.betrieb.update('betrieb', { steuernummer: undefined, ustId: undefined });
    const r = rechnungErstellen(t.auftrag.id, 'rechnung')!;
    const e = versandVorbereiten({ typ: 'rechnungen', id: r.id });
    expect(e.an).toBe('hoffmann@example.de');
    expect(e.kanal).toBe('email');
    expect(e.nummer).toMatch(/^R-\d{4}-0001$/);
    expect(e.fehler.join(' ')).toMatch(/Steuernummer/);
    const x = await versandAusfuehren(e);
    expect(x.ergebnis.status).toBe('fehler');
    expect(db.rechnungen.get(r.id)?.status).toBe('entwurf');
    expect(globalThis.open).not.toHaveBeenCalled();
  });

  it('Rechnung senden: festgeschrieben, Version mit Empfänger, Events', async () => {
    const r = rechnungErstellen(t.auftrag.id, 'rechnung')!;
    rechnungAendern(r.id, { leistungszeitraum: 'September 2026', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'h', einzelpreis: 10_000 }] });
    const typen: string[] = [];
    const aus = on('*', (e) => typen.push(e.typ));
    const x = await versandAusfuehren(versandVorbereiten({ typ: 'rechnungen', id: r.id }));
    aus();
    expect(x.ergebnis.status).toBe('geoeffnet');
    expect(db.rechnungen.get(r.id)?.status).toBe('versendet');
    expect(typen).toEqual(expect.arrayContaining(['rechnung.versendet', 'dokument.versendet']));
    const v = versionenVon({ typ: 'rechnungen', id: r.id });
    expect(v.map((x) => x.anlass)).toEqual(['festgeschrieben', 'versendet']);
    expect(v[1]).toMatchObject({ an: 'hoffmann@example.de', kanal: 'email', betrag: 11_900, versandStatus: 'geoeffnet' });
    expect(historie({ typ: 'rechnungen', id: r.id })[0].text).toMatch(/Version 2: Versendet/);
  });

  it('Auftragsbestätigung senden: Status, fachliches Event, eine Version', async () => {
    angebot();
    const d = geschaeftsdokumentMitTexten(t.auftrag.id, 'auftragsbestaetigung')!;
    const e = versandVorbereiten({ typ: 'geschaeftsdokumente', id: d.id });
    expect(e.betreff).toBe(`Auftragsbestätigung ${d.nummer}: Bad sanieren`);
    expect(e.text).toContain('Guten Tag Familie Hoffmann');
    expect(e.betrag).toBe(1_190_000);
    const typen: string[] = [];
    const aus = on('*', (x) => typen.push(x.typ));
    await versandAusfuehren(e);
    aus();
    expect(geschaeftsdokumente.get(d.id)?.status).toBe('versendet');
    expect(typen).toEqual(expect.arrayContaining(['auftragsbestaetigung.versendet', 'dokument.versendet']));
    expect(versionenVon({ typ: 'geschaeftsdokumente', id: d.id })).toHaveLength(1);
  });

  it('ungültiger Empfänger wird gemeldet', () => {
    const d = geschaeftsdokumentMitTexten(t.auftrag.id, 'lieferschein')!;
    expect(versandVorbereiten({ typ: 'geschaeftsdokumente', id: d.id }, 'kein kontakt').fehler[0]).toMatch(/keine E-Mail-Adresse/);
  });
});

describe('Versionen', () => {
  it('führt Meldungen zum selben Vorgang zusammen, neue Vorgänge zählen hoch', () => {
    const b = { typ: 'angebote', id: 'x' };
    const jetzt = Date.now();
    versionMerken(b, 'angebot', 'versendet', { nummer: 'AN-1' }, jetzt);
    versionMerken(b, 'angebot', 'versendet', { an: 'a@b.de' }, jetzt + 1000);
    expect(versionenVon(b)).toHaveLength(1);
    expect(versionenVon(b)[0]).toMatchObject({ nummer: 'AN-1', an: 'a@b.de', version: 1 });
    const spaeter = dokumentversionen.all()[0];
    dokumentversionen.update(spaeter.id, { zeitpunkt: new Date(jetzt - 60_000).toISOString() });
    versionMerken(b, 'angebot', 'versendet', {}, jetzt + 2000);
    expect(versionenVon(b).map((v) => v.version)).toEqual([1, 2]);
  });
});

/** alle Art-IDs (Hilfsfunktion, damit der Test die Liste nicht dupliziert) */
function DOKUMENT_ARTEN_IDS() {
  return ['angebot', 'auftragsbestaetigung', 'lieferschein', 'rapport', 'arbeitsbericht', 'baustellenbericht', 'pruefprotokoll', 'abnahme', 'rechnung', 'abschlagsrechnung', 'teilrechnung', 'schlussrechnung', 'gutschrift', 'storno', 'zahlungserinnerung', 'mahnung'].map((id) => dokumentArt(id as never).id);
}

void mahnungen;
