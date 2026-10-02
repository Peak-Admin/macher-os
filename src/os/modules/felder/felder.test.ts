import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { on } from '@core/events';
import {
  definitionPruefen,
  eigeneFelder,
  eigeneFormulare,
  feldAnlegen,
  feldEntfernen,
  feldVerschieben,
  feldvorlagenAnwenden,
  felderFuer,
  feldwerte,
  feldwertTreffer,
  hatEigeneAngaben,
  objektAus,
  sindFeldvorlagen,
  typAus,
  wertPruefen,
  wertText,
  wertVon,
  werteSpeichern,
  type FeldDefinition,
  type FeldTyp,
} from './daten';

const f = (typ: FeldTyp, x: Partial<FeldDefinition> = {}) => ({ typ, label: 'Testfeld', ...x });
const ok = (p: ReturnType<typeof wertPruefen>) => (p.ok ? p.wert : `FEHLER: ${p.fehler}`);

beforeEach(() => zuruecksetzen());

describe('Eigene Felder: Validierung je Feldtyp', () => {
  it('Text: trimmt, leer = kein Wert, Pflicht meldet sich', () => {
    expect(ok(wertPruefen(f('text'), '  Zähler 4711 '))).toBe('Zähler 4711');
    expect(ok(wertPruefen(f('text'), '  '))).toBeUndefined();
    expect(wertPruefen(f('text', { pflicht: true }), '')).toEqual({ ok: false, fehler: 'Trag „Testfeld“ ein.' });
    expect(wertPruefen(f('text'), 'x'.repeat(2001)).ok).toBe(false);
  });

  it('Zahl: deutsches Komma, Tausenderpunkt, keine Buchstaben', () => {
    expect(ok(wertPruefen(f('zahl'), '12,5'))).toBe(12.5);
    expect(ok(wertPruefen(f('zahl'), '1.234,5'))).toBe(1234.5);
    expect(ok(wertPruefen(f('zahl'), '7'))).toBe(7);
    expect(ok(wertPruefen(f('zahl'), -3))).toBe(-3);
    expect(wertPruefen(f('zahl'), 'zwölf')).toEqual({ ok: false, fehler: '„Testfeld“ muss eine Zahl sein, z. B. 12,5.' });
  });

  it('Maßeinheit: Zahl, Anzeige mit Einheit', () => {
    expect(ok(wertPruefen(f('masseinheit', { einheit: 'm²' }), '24,75'))).toBe(24.75);
    expect(wertText({ typ: 'masseinheit', einheit: 'm²' }, 24.75)).toBe('24,75 m²');
    expect(wertPruefen(f('masseinheit'), '12 qm').ok).toBe(false);
  });

  it('Auswahl: nur erlaubte Möglichkeiten', () => {
    const feld = f('auswahl', { optionen: ['Gas', 'Öl', 'Wärmepumpe'] });
    expect(ok(wertPruefen(feld, 'Öl'))).toBe('Öl');
    expect(wertPruefen(feld, 'Holz')).toEqual({ ok: false, fehler: 'Wähl bei „Testfeld“ eine der Möglichkeiten.' });
  });

  it('Ja/Nein: Häkchen und Texte, Pflicht greift nicht bei Nein', () => {
    expect(ok(wertPruefen(f('janein'), true))).toBe(true);
    expect(ok(wertPruefen(f('janein'), 'ja'))).toBe(true);
    expect(ok(wertPruefen(f('janein'), 'Nein'))).toBe(false);
    expect(ok(wertPruefen(f('janein', { pflicht: true }), ''))).toBeUndefined();
    expect(wertPruefen(f('janein'), 'vielleicht').ok).toBe(false);
    expect(wertText({ typ: 'janein' }, false)).toBe('Nein');
  });

  it('Datum: ISO und deutsch, keine unmöglichen Tage', () => {
    expect(ok(wertPruefen(f('datum'), '2026-03-14'))).toBe('2026-03-14');
    expect(ok(wertPruefen(f('datum'), '14.3.2026'))).toBe('2026-03-14');
    expect(wertPruefen(f('datum'), '30.02.2026')).toEqual({ ok: false, fehler: '„30.02.2026“ ist kein gültiges Datum.' });
    expect(wertText({ typ: 'datum' }, '2026-03-14')).toBe('14.03.2026');
  });

  it('Foto, Datei, Unterschrift: Wert ist ein vorhandenes Dokument', () => {
    const d = db.dokumente.create({ art: 'foto', titel: 'Typenschild', url: 'data:image/png;base64,AA' });
    for (const typ of ['foto', 'datei', 'unterschrift'] as FeldTyp[]) {
      expect(ok(wertPruefen(f(typ), d.id))).toBe(d.id);
      expect(wertPruefen(f(typ), 'gibt-es-nicht').ok).toBe(false);
    }
    db.dokumente.remove(d.id);
    expect(wertPruefen(f('foto'), d.id).ok).toBe(false);
    expect(wertPruefen(f('unterschrift', { pflicht: true }), '')).toMatchObject({ ok: false });
  });

  it('prüft Definitionen verständlich', () => {
    expect(definitionPruefen({ label: ' ', typ: 'text', objekt: 'kunde' })).toBe('Gib dem Feld einen Namen.');
    expect(definitionPruefen({ label: 'Brennstoff', typ: 'auswahl', objekt: 'anlage', optionen: ['Gas', ''] })).toMatch(/zwei Möglichkeiten/);
    expect(definitionPruefen({ label: 'Fläche', typ: 'masseinheit', objekt: 'aufmass' })).toMatch(/Einheit/);
    expect(definitionPruefen({ label: 'Druck', typ: 'zahl', objekt: 'formular' })).toMatch(/Formular/);
    expect(definitionPruefen({ label: 'Fläche', typ: 'masseinheit', objekt: 'aufmass', einheit: 'm²' })).toBeUndefined();
  });
});

describe('Eigene Felder: Werte am Objekt', () => {
  it('speichert Werte mit Bezug, ändert und entfernt sie – ohne das Objekt zu ändern', () => {
    const o = db.orte.create({ kundeId: 'k', bezeichnung: 'Wohnhaus', art: 'haus', adresse: { strasse: 'A 1', plz: '34117', ort: 'Kassel' } });
    const zaehler = feldAnlegen({ objekt: 'ort', label: 'Zählernummer', typ: 'text' });
    const etagen = feldAnlegen({ objekt: 'ort', label: 'Etagen', typ: 'zahl' });
    const vorher = JSON.stringify(db.orte.get(o.id));
    const bezug = { typ: 'orte', id: o.id };

    expect(werteSpeichern(bezug, { [zaehler.id]: '1ESY4711', [etagen.id]: 'drei' })).toEqual({ [etagen.id]: '„Etagen“ muss eine Zahl sein, z. B. 12,5.' });
    expect(feldwerte.all()).toHaveLength(0); // alle oder keiner

    expect(werteSpeichern(bezug, { [zaehler.id]: '1ESY4711', [etagen.id]: '3' })).toEqual({});
    expect(wertVon(etagen.id, bezug)?.wert).toBe(3);
    werteSpeichern(bezug, { [etagen.id]: '' });
    expect(wertVon(etagen.id, bezug)).toBeUndefined();
    expect(JSON.stringify(db.orte.get(o.id))).toBe(vorher);
  });

  it('zeigt Angaben nur, wenn es Felder gibt – Aufmaß- und Wartungsfelder nur an passenden Aufträgen', () => {
    const wartung = db.auftraege.create({ nummer: 'A-1', titel: 'Wartung', art: 'wartung', phase: 'beauftragt', kundeId: 'k' });
    const bad = db.auftraege.create({ nummer: 'A-2', titel: 'Bad', art: 'projekt', phase: 'in_arbeit', kundeId: 'k' });
    expect(hatEigeneAngaben('auftraege', wartung.id)).toBe(false);
    feldAnlegen({ objekt: 'wartung', label: 'Abgasverlust', typ: 'masseinheit', einheit: '%' });
    expect(hatEigeneAngaben('auftraege', wartung.id)).toBe(true);
    expect(hatEigeneAngaben('auftraege', bad.id)).toBe(false);
    expect(hatEigeneAngaben('kunden', 'x')).toBe(false);
    eigeneFormulare.create({ name: 'Übergabe', objekt: 'auftrag' });
    expect(hatEigeneAngaben('auftraege', bad.id)).toBe(true);
  });

  it('vermerkt ausgefüllte Formulare im Verlauf und meldet formular.ausgefuellt', () => {
    const a = db.auftraege.create({ nummer: 'A-1', titel: 'Heizung', art: 'wartung', phase: 'beauftragt', kundeId: 'k' });
    const formular = eigeneFormulare.create({ name: 'Prüfprotokoll', objekt: 'wartung' });
    const druck = feldAnlegen({ objekt: 'formular', formularId: formular.id, label: 'Druck', typ: 'masseinheit', einheit: 'bar' });
    const ereignisse: unknown[] = [];
    const aus = on('formular.ausgefuellt', (e) => ereignisse.push(e.daten));
    werteSpeichern({ typ: 'auftraege', id: a.id }, { [druck.id]: '1,5' }, { formular });
    aus();
    expect(ereignisse).toEqual([{ formularId: formular.id, bezug: { typ: 'auftraege', id: a.id } }]);
    expect(db.ereignisse.all().some((e) => e.bezug.id === a.id && e.text === 'Formular „Prüfprotokoll“ ausgefüllt')).toBe(true);
  });

  it('sortiert, verschiebt und entfernt Felder samt Werten (Papierkorb)', () => {
    const a = feldAnlegen({ objekt: 'kunde', label: 'A', typ: 'text' });
    const b = feldAnlegen({ objekt: 'kunde', label: 'B', typ: 'text' });
    expect(felderFuer('kunde').map((x) => x.label)).toEqual(['A', 'B']);
    feldVerschieben(b.id, -1);
    expect(felderFuer('kunde').map((x) => x.label)).toEqual(['B', 'A']);
    werteSpeichern({ typ: 'kunden', id: 'k' }, { [a.id]: 'x' });
    feldEntfernen(a.id);
    expect(felderFuer('kunde').map((x) => x.label)).toEqual(['B']);
    expect(feldwerte.all()).toHaveLength(0);
    expect(feldwerte.allMitGeloeschten()).toHaveLength(1);
  });

  it('vergibt eindeutige Schlüssel', () => {
    expect(feldAnlegen({ objekt: 'anlage', label: 'Kältemittel (Typ)', typ: 'text' }).schluessel).toBe('anlage.kaeltemittel_typ');
    expect(feldAnlegen({ objekt: 'anlage', label: 'Kältemittel (Typ)', typ: 'text' }).schluessel).toBe('anlage.kaeltemittel_typ_2');
  });
});

describe('Eigene Felder: Gewerk-Vorlagen', () => {
  const vorlagen = [
    { objekt: 'anlagen', schluessel: 'shk.brennstoff', label: 'Brennstoff', typ: 'auswahl', optionen: ['Gas', 'Öl'] },
    { objekt: 'wartung', schluessel: 'shk.abgasverlust', label: 'Abgasverlust', typ: 'masseinheit', einheit: '%' },
    { objekt: 'Aufmaß', schluessel: 'shk.raumhoehe', label: 'Raumhöhe', typ: 'Maßeinheit', einheit: 'm' },
    { objekt: 'ort', schluessel: 'shk.zugang', label: 'Zugang', typ: 'text' },
    { objekt: 'raumschiff', schluessel: 'x.unbekannt', label: 'Unbekannt', typ: 'text' },
  ];

  it('legt Felder an und ist idempotent über den Schlüssel', () => {
    const r1 = feldvorlagenAnwenden(vorlagen);
    expect(r1.angelegt.map((x) => [x.objekt, x.typ, x.schluessel])).toEqual([
      ['anlage', 'auswahl', 'shk.brennstoff'],
      ['wartung', 'masseinheit', 'shk.abgasverlust'],
      ['aufmass', 'masseinheit', 'shk.raumhoehe'],
      ['ort', 'text', 'shk.zugang'],
    ]);
    expect(r1.uebersprungen).toEqual(['x.unbekannt']);
    expect(r1.angelegt.every((x) => x.vorlage)).toBe(true);
    const r2 = feldvorlagenAnwenden(vorlagen);
    expect(r2.angelegt).toHaveLength(0);
    expect(eigeneFelder.all()).toHaveLength(4);
  });

  it('legt bewusst entfernte Vorlagenfelder nicht wieder an', () => {
    const [brennstoff] = feldvorlagenAnwenden(vorlagen.slice(0, 1)).angelegt;
    feldEntfernen(brennstoff.id);
    expect(feldvorlagenAnwenden(vorlagen.slice(0, 1)).angelegt).toHaveLength(0);
  });

  it('versteht Objekt- und Typ-Schreibweisen und prüft das Vorlagenformat', () => {
    expect(objektAus('Kunden')).toBe('kunde');
    expect(objektAus('besichtigung')).toBe('termin');
    expect(typAus('ja_nein')).toBe('janein');
    expect(typAus('Datum')).toBe('datum');
    expect(sindFeldvorlagen(vorlagen)).toBe(true);
    expect(sindFeldvorlagen([{ name: 'x' }])).toBe(false);
    expect(sindFeldvorlagen([])).toBe(false);
  });
});

describe('Eigene Felder: Suche', () => {
  it('findet eigene Feldwerte, aber keine Ja/Nein- und Dateiwerte', () => {
    const zaehler = feldAnlegen({ objekt: 'ort', label: 'Zählernummer', typ: 'text' });
    const geruest = feldAnlegen({ objekt: 'auftrag', label: 'Gerüst nötig', typ: 'janein' });
    werteSpeichern({ typ: 'orte', id: 'o1' }, { [zaehler.id]: '1ESY4711' });
    werteSpeichern({ typ: 'auftraege', id: 'a1' }, { [geruest.id]: true });
    expect(feldwertTreffer('esy4711').map((t) => t.text)).toEqual(['1ESY4711']);
    expect(feldwertTreffer('zählernummer 4711')).toHaveLength(1);
    expect(feldwertTreffer('zählernummer')).toHaveLength(0);
    expect(feldwertTreffer('ja')).toHaveLength(0);
  });
});
