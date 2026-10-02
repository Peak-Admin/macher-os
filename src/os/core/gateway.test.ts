import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from './db';
import { on } from './events';
import {
  brauchtBestaetigung,
  frage,
  fuehreAus,
  hoechsteLane,
  kiProtokoll,
  kostenStufe,
  nimmZurueck,
  registriereGateway,
  registriereModell,
  risikoVon,
  waehleLane,
  type AbsichtDef,
  type AktionDef,
  type GatewayKontext,
} from './gateway';
import type { Recht } from './session';

const kontext = (rechte: Recht[] = ['lesen', 'schreiben', 'geld'], extra: Partial<GatewayKontext> = {}): GatewayKontext => ({
  heute: '2026-10-02',
  jetzt: new Date('2026-10-02T10:00:00'),
  darf: (r) => rechte.includes(r),
  ...extra,
});

const ABSICHTEN: AbsichtDef<string>[] = [
  { id: 'invoice.list', titel: 'Offene Rechnungen', risiko: 'lesen', rechte: ['geld'], erkenne: (t) => /rechnung/i.test(t), beantworte: () => 'liste' },
  { id: 'message.draft', titel: 'Nachricht entwerfen', risiko: 'schreiben', lane: 2, kontext: () => ({ kunde: 'Schneider' }), beantworte: (_t, _e, _k, h) => h.modellText ?? '' },
  { id: 'search', titel: 'Suchen', risiko: 'lesen', auffang: true, beantworte: (t) => `suche:${t}` },
];

const AKTIONEN: AktionDef<{ titel: string }>[] = [
  {
    id: 'task.create',
    titel: 'Aufgabe angelegt',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (d) => (d.titel ? undefined : 'Titel fehlt'),
    fuehreAus: (d) => ({ bezug: { typ: 'aufgaben', id: db.aufgaben.create({ titel: d.titel, erledigt: false, prioritaet: 'normal' }).id } }),
  },
  { id: 'invoice.send', titel: 'Rechnung versendet', risiko: 'schreiben', rechte: ['veroeffentlichen'], fuehreAus: () => undefined },
];

let aus: (() => void)[] = [];
beforeEach(() => {
  zuruecksetzen();
  aus = [registriereGateway({ absichten: ABSICHTEN, aktionen: AKTIONEN })];
});
afterEach(() => aus.forEach((f) => f()));

describe('Gateway: Regeln, Rechte, Lanes', () => {
  it('erkennt per Regel (Lane 0) und protokolliert', async () => {
    const g = await frage<string>('Welche Rechnungen sind offen?', kontext());
    expect(g).toMatchObject({ lane: 0, ergebnis: 'liste', erkennung: { absicht: 'invoice.list', sicherheit: 1 } });
    expect(kiProtokoll.get(g.protokollId)).toMatchObject({ absicht: 'invoice.list', ergebnis: 'beantwortet', kanal: 'text', eingabe: 'Welche Rechnungen sind offen?' });
  });

  it('umgeht nie die Rechte', async () => {
    const g = await frage('Welche Rechnungen sind offen?', kontext(['lesen']));
    expect(g).toMatchObject({ verweigert: 'rechte', fehlendeRechte: ['geld'] });
    expect(g.ergebnis).toBeUndefined();
    expect(kiProtokoll.get(g.protokollId)?.ergebnis).toBe('verweigert');
  });

  it('fällt ohne Treffer auf die Auffang-Absicht zurück', async () => {
    expect((await frage('Kabel 3x1,5', kontext())).ergebnis).toBe('suche:Kabel 3x1,5');
  });

  it('direkte Absichten nur gezielt – nie aus freien Sätzen', async () => {
    aus.push(registriereGateway({ absichten: [{ id: 'offer.positions.suggest', titel: 'Positionen', risiko: 'schreiben', rechte: ['geld'], direkt: true, erkenne: () => true, beantworte: (t) => `vorschlag:${t}` }] }));
    expect((await frage('Bad fliesen', kontext())).ergebnis).toBe('suche:Bad fliesen');
    const g = await frage<string>('Bad fliesen', kontext(), { absicht: 'offer.positions.suggest' });
    expect(g).toMatchObject({ lane: 0, ergebnis: 'vorschlag:Bad fliesen', erkennung: { absicht: 'offer.positions.suggest', sicherheit: 1 } });
    expect(kiProtokoll.get(g.protokollId)?.ergebnis).toBe('vorgeschlagen');
    expect((await frage('Bad fliesen', kontext(['lesen']), { absicht: 'offer.positions.suggest' })).verweigert).toBe('rechte');
    expect((await frage('x', kontext(), { absicht: 'gibt.es.nicht' })).verweigert).toBe('unbekannt');
  });

  it('nutzt Jev nur, wenn keine Regel greift und es sicher genug ist', async () => {
    let aufrufe = 0;
    aus.push(
      registriereModell({
        lane: 1,
        name: 'Jev',
        verfuegbar: () => true,
        async erkenne(text) {
          aufrufe++;
          return text.includes('Müller') ? { absicht: 'invoice.list', sicherheit: 0.9 } : { absicht: 'invoice.list', sicherheit: 0.4 };
        },
      }),
    );
    await frage('Rechnung offen?', kontext());
    expect(aufrufe).toBe(0);
    expect((await frage('Was schuldet uns Müller?', kontext())).erkennung).toMatchObject({ absicht: 'invoice.list', lane: 1 });
    expect((await frage('Wetter?', kontext())).erkennung?.absicht).toBe('search');
  });

  it('lehnt ab, wenn die nötige Lane nicht angeschlossen ist', async () => {
    aus.push(registriereModell({ lane: 1, name: 'Jev', verfuegbar: () => true, erkenne: async () => ({ absicht: 'message.draft', sicherheit: 0.95 }) }));
    expect((await frage('Schreib Schneider, dass wir später kommen', kontext())).verweigert).toBe('modell-fehlt');
  });

  it('gibt Luna nur den minimalen Kontext und respektiert den Kostenrahmen', async () => {
    let gesehen: unknown;
    aus.push(registriereModell({ lane: 1, name: 'Jev', verfuegbar: () => true, erkenne: async () => ({ absicht: 'message.draft', sicherheit: 0.95 }) }));
    aus.push(registriereModell({ lane: 2, name: 'Luna', verfuegbar: () => true, schreibe: async (_t, k) => ((gesehen = k), 'Hallo Herr Schneider') }));
    const g = await frage('Schreib Schneider, dass wir später kommen', kontext());
    expect(g).toMatchObject({ lane: 2, modell: 'Luna', ergebnis: 'Hallo Herr Schneider' });
    expect(gesehen).toEqual({ kunde: 'Schneider' });
    // An der Kostengrenze bleibt nur Regeln + Jev
    expect((await frage('Schreib Schneider …', kontext(undefined, { kostenAnteil: 0.21 }))).verweigert).toBe('modell-fehlt');
  });

  it('wählt die günstigste ausreichende Lane', () => {
    expect(waehleLane(0, kontext())).toBe(0);
    expect(waehleLane(2, kontext())).toBeUndefined();
    aus.push(registriereModell({ lane: 3, name: 'Stark', verfuegbar: () => true }));
    expect(waehleLane(2, kontext())).toBe(3);
    expect(waehleLane(2, kontext(undefined, { kostenAnteil: 0.16 }))).toBeUndefined();
  });

  it('bewertet Kosten nach Ziel, Warnung und Grenze', () => {
    expect(kostenStufe(0.08)).toBe('ok');
    expect(kostenStufe(0.15)).toBe('warnung');
    expect(kostenStufe(0.2)).toBe('grenze');
    expect([hoechsteLane('ok'), hoechsteLane('warnung'), hoechsteLane('grenze')]).toEqual([3, 2, 1]);
  });
});

describe('Gateway: Aktionen und Bestätigung', () => {
  it('stuft Senden, Löschen und Personaldaten immer als kritisch ein', () => {
    expect(risikoVon('lesen')).toBe('lesen');
    expect(risikoVon('lesen', ['schreiben'])).toBe('schreiben');
    expect(risikoVon('schreiben', ['veroeffentlichen'])).toBe('kritisch');
    expect(brauchtBestaetigung('lesen')).toBe(false);
    expect(brauchtBestaetigung('schreiben', true)).toBe(false);
    expect(brauchtBestaetigung('schreiben', false)).toBe(true);
    expect(brauchtBestaetigung('kritisch', true)).toBe(true);
  });

  it('führt erst nach Bestätigung aus, prüft vorher und vermerkt im Zeitstrahl', async () => {
    const k = kontext();
    expect(await fuehreAus({ aktion: 'task.create', daten: { titel: 'Leiter prüfen' } }, k)).toMatchObject({ ok: false, grund: 'bestaetigung' });
    expect(await fuehreAus({ aktion: 'task.create', daten: { titel: '' } }, k, { bestaetigt: true })).toMatchObject({ ok: false, grund: 'ungueltig', text: 'Titel fehlt' });
    expect(db.aufgaben.all()).toHaveLength(0);
    const r = await fuehreAus({ aktion: 'task.create', daten: { titel: 'Leiter prüfen' } }, k, { bestaetigt: true });
    if (!r.ok) throw new Error(r.text);
    expect(db.aufgaben.get(r.bezug!.id)?.titel).toBe('Leiter prüfen');
    expect(kiProtokoll.get(r.protokollId)).toMatchObject({ aktion: 'task.create', ergebnis: 'ausgefuehrt', bestaetigt: true });
    expect(db.ereignisse.where((e) => e.bezug.id === r.bezug!.id && e.typ === 'ki.aktion')).toHaveLength(1);
  });

  it('lehnt fehlende Rechte und unbekannte Aktionen ab', async () => {
    expect(await fuehreAus({ aktion: 'invoice.send', daten: {} }, kontext(), { bestaetigt: true })).toMatchObject({ ok: false, grund: 'rechte' });
    expect(await fuehreAus({ aktion: 'gibt.es.nicht', daten: {} }, kontext(), { bestaetigt: true })).toMatchObject({ ok: false, grund: 'unbekannt' });
    expect(kiProtokoll.all().every((p) => p.ergebnis === 'verweigert')).toBe(true);
  });

  it('führt als Macher aus, schneidet die Änderungen mit und nimmt sie über das Audit zurück', async () => {
    const gesendet: string[] = [];
    const weg = on('*', (e) => void (e.typ.startsWith('ki.') || e.typ === 'macher.aktion_ausgefuehrt' ? gesendet.push(e.typ) : undefined));
    const r = await fuehreAus({ aktion: 'task.create', daten: { titel: 'Leiter prüfen' } }, kontext(), { bestaetigt: true });
    weg();
    if (!r.ok) throw new Error(r.text);
    const angelegt = db.ereignisse.where((e) => e.bezug.id === r.bezug!.id && e.aenderung === 'created')[0];
    expect(angelegt).toMatchObject({ quelle: 'ai', akteurId: 'macher' });
    expect(r.eintraege).toContain(angelegt.id);
    // genau ein fachliches Ereignis – Fragen und Vorschläge bleiben im KI-Protokoll
    expect(gesendet).toEqual(['macher.aktion_ausgefuehrt']);
    expect(nimmZurueck(r.eintraege, kontext()).ok).toBeGreaterThan(0);
    expect(db.aufgaben.all()).toHaveLength(0);
    expect(kiProtokoll.all().at(-1)).toMatchObject({ ergebnis: 'zurueckgenommen' });
  });
});
