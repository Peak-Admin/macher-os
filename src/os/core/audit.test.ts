import { beforeEach, describe, expect, it } from 'vitest';
import { db, setAktuellerNutzer, vermerken, zeitstrahl, zuruecksetzen } from './db';
import { alsAkteur, mitschneiden } from './akteur';
import { allesRueckgaengig, letzteAenderungen, rueckgaengig, rueckgaengigGrund, verlaufAufraeumen } from './audit';
import { felderText, verlaufText } from './audit-text';
import { on } from './events';
import { registriereModule, defineModul } from './modul';
import { setzeAutomation, starteAutomationen } from './macher';

const kunde = () => db.kunden.create({ art: 'privat', name: 'Müller', ansprechpartner: [] });

beforeEach(() => {
  zuruecksetzen();
  setAktuellerNutzer('anna');
});

describe('Audit', () => {
  it('protokolliert Akteur, Quelle und nur geänderte Felder mit vorher/nachher', () => {
    const k = kunde();
    db.kunden.update(k.id, { name: 'Müller-Lüdenscheidt', telefon: '0171' });
    const [e] = zeitstrahl({ typ: 'kunden', id: k.id });
    expect(e.aenderung).toBe('updated');
    expect(e.quelle).toBe('user');
    expect(e.vonMitarbeiterId).toBe('anna');
    expect(e.felder).toEqual({ name: { vorher: 'Müller', nachher: 'Müller-Lüdenscheidt' }, telefon: { vorher: undefined, nachher: '0171' } });
    expect(e.text).toBe('Geändert: Name, Telefon');
  });

  it('schreibt Klartext mit Status und Quelle', () => {
    expect(verlaufText('updated', { felder: { status: { vorher: 'entwurf', nachher: 'versendet' } } })).toBe('Geändert: Status (Entwurf → Versendet)');
    expect(verlaufText('created', { akteur: { quelle: 'automation', id: 'x' } })).toBe('Angelegt – durch Lotte');
    expect(verlaufText('created', { akteur: { quelle: 'import' } })).toBe('Angelegt – durch Import');
    expect(felderText({ a: {}, b: {} })).toBe('weitere Angaben');
    expect(felderText({ titel: {}, notiz: {}, datum: {}, ende: {}, xyz: {} })).toBe('Titel, Notiz, Datum und 1 weitere');
  });

  it('ordnet Änderungen einer Automation zu – auch über Event-Handler', () => {
    registriereModule([
      defineModul({
        id: 'test',
        titel: 'Test',
        bereich: 'betrieb',
        beschreibung: '',
        automationen: [
          {
            id: 'test.notiz',
            titel: 'Notiz setzen',
            beschreibung: '',
            standardAn: true,
            start: () => on('kunden.created', (e) => db.kunden.update(e.objekt!.id, { notiz: 'automatisch' })),
          },
        ],
      }),
    ]);
    starteAutomationen();
    const k = kunde();
    const liste = zeitstrahl({ typ: 'kunden', id: k.id });
    const angelegt = liste.find((e) => e.aenderung === 'created')!;
    const geaendert = liste.find((e) => e.aenderung === 'updated')!;
    expect(angelegt.quelle).toBe('user');
    expect(geaendert.quelle).toBe('automation');
    expect(geaendert.akteurId).toBe('test.notiz');
    expect(geaendert.vonMitarbeiterId).toBeUndefined();
    expect(geaendert.text).toBe('Geändert: Notiz – durch Lotte');
    setzeAutomation('test.notiz', false);
    registriereModule([]);
  });

  it('fasst stille Änderungen (Tippen im Editor) zu einem Eintrag zusammen', () => {
    const k = kunde();
    db.kunden.update(k.id, { notiz: 'a' }, { leise: true });
    db.kunden.update(k.id, { notiz: 'ab' }, { leise: true });
    db.kunden.update(k.id, { notiz: 'abc' }, { leise: true });
    const still = zeitstrahl({ typ: 'kunden', id: k.id }).filter((e) => e.zusammengefasst);
    expect(still).toHaveLength(1);
    expect(still[0].felder).toEqual({ notiz: { vorher: undefined, nachher: 'abc' } });
    expect(still[0].text).toBe('Bearbeitet: Notiz');
    // zurück auf den Ausgangswert → kein Eintrag mehr
    db.kunden.update(k.id, { notiz: undefined }, { leise: true });
    expect(zeitstrahl({ typ: 'kunden', id: k.id }).filter((e) => e.zusammengefasst)).toHaveLength(0);
  });

  it('schreibt Geld- und Lohnwerte nicht in den Verlauf (Status bleibt lesbar)', () => {
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId: 'k', titel: 'x', positionen: [], status: 'entwurf', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    db.rechnungen.update(r.id, { status: 'versendet', positionen: [{ id: 'p', art: 'pauschal', text: 'x', menge: 1, einheit: 'Psch', einzelpreis: 99_00 }] });
    const [e] = zeitstrahl({ typ: 'rechnungen', id: r.id });
    expect(e.felder?.positionen).toEqual({ geschuetzt: true });
    expect(e.felder?.status).toEqual({ vorher: 'entwurf', nachher: 'versendet' });
    const m = db.mitarbeiter.create({ vorname: 'A', nachname: 'B', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 3000, aktiv: true });
    db.mitarbeiter.update(m.id, { kostensatz: 3500 });
    expect(zeitstrahl({ typ: 'mitarbeiter', id: m.id })[0].felder).toEqual({ kostensatz: { geschuetzt: true } });
    expect(JSON.stringify(db.ereignisse.all())).not.toContain('3500');
  });

  it('kürzt große Werte und verbietet dann Rückgängig', () => {
    const d = db.dokumente.create({ art: 'foto', titel: 'Foto', url: 'data:' + 'x'.repeat(10_000) });
    db.dokumente.update(d.id, { url: 'data:' + 'y'.repeat(10_000) });
    const [e] = zeitstrahl({ typ: 'dokumente', id: d.id });
    expect(e.felder?.url).toEqual({ gekuerzt: true });
    expect(rueckgaengigGrund(e)).toMatch(/zu groß/);
  });
});

describe('Rückgängig', () => {
  it('stellt den vorher-Stand wieder her und vermerkt es', () => {
    const k = kunde();
    db.kunden.update(k.id, { name: 'Meier' });
    const [e] = zeitstrahl({ typ: 'kunden', id: k.id });
    rueckgaengig(e.id);
    expect(db.kunden.get(k.id)?.name).toBe('Müller');
    expect(db.ereignisse.get(e.id)?.rueckgaengigAm).toBeTruthy();
    expect(rueckgaengigGrund(db.ereignisse.get(e.id))).toMatch(/Schon/);
  });

  it('lehnt ab, wenn das Feld inzwischen weiter geändert wurde', () => {
    const k = kunde();
    db.kunden.update(k.id, { name: 'Meier' });
    const [e] = zeitstrahl({ typ: 'kunden', id: k.id });
    db.kunden.update(k.id, { name: 'Schulz' });
    expect(() => rueckgaengig(e.id)).toThrow(/weiter geändert/);
  });

  it('legt Angelegtes in den Papierkorb und holt Gelöschtes zurück', () => {
    const k = kunde();
    const angelegt = zeitstrahl({ typ: 'kunden', id: k.id })[0];
    rueckgaengig(angelegt.id);
    expect(db.kunden.get(k.id)?.geloeschtAm).toBeTruthy();
    const weg = zeitstrahl({ typ: 'kunden', id: k.id }).find((e) => e.aenderung === 'removed')!;
    rueckgaengig(weg.id);
    expect(db.kunden.get(k.id)?.geloeschtAm).toBeUndefined();
  });

  it('schützt festgeschriebene Rechnungen', () => {
    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId: 'k', titel: 'x', positionen: [], status: 'entwurf', datum: '2026-10-01', faelligAm: '2026-10-15', mahnstufe: 0 });
    db.rechnungen.update(r.id, { status: 'versendet' });
    const [e] = zeitstrahl({ typ: 'rechnungen', id: r.id });
    expect(rueckgaengigGrund(e)).toMatch(/Storno/);
  });

  it('nimmt alles zurück, was eine Aktion getan hat', () => {
    const k = kunde();
    const { eintraege } = mitschneiden(() =>
      alsAkteur({ quelle: 'ai', id: 'macher', mitarbeiterId: 'anna' }, () => {
        db.kunden.update(k.id, { telefon: '123' });
        const a = db.aufgaben.create({ titel: 'Anrufen', erledigt: false, prioritaet: 'normal' });
        db.aufgaben.update(a.id, { notiz: 'gleich' });
        vermerken({ typ: 'kunden', id: k.id }, 'macher.notiz', 'Notiz');
        return a;
      }),
    );
    expect(eintraege.length).toBe(4);
    const r = allesRueckgaengig(eintraege);
    expect(r.fehler).toEqual([]);
    expect(db.kunden.get(k.id)?.telefon).toBeUndefined();
    expect(db.aufgaben.all()).toHaveLength(0);
    expect(letzteAenderungen({ quelle: 'ai' }).length).toBeGreaterThan(0);
  });
});

describe('Rotation', () => {
  it('entfernt alte automatische Einträge, eigene Vermerke bleiben länger', () => {
    const k = kunde();
    for (let i = 0; i < 5; i++) db.kunden.update(k.id, { notiz: String(i) });
    vermerken({ typ: 'kunden', id: k.id }, 'angebot.versendet', 'Angebot versendet');
    expect(verlaufAufraeumen({ maxEintraege: 3 })).toBe(3);
    const rest = zeitstrahl({ typ: 'kunden', id: k.id });
    expect(rest.filter((e) => e.aenderung)).toHaveLength(3);
    expect(rest.some((e) => e.typ === 'angebot.versendet')).toBe(true);
    const spaeter = new Date(Date.now() + 400 * 86_400_000);
    verlaufAufraeumen({ jetzt: spaeter });
    expect(zeitstrahl({ typ: 'kunden', id: k.id }).filter((e) => e.aenderung)).toHaveLength(0);
  });
});
