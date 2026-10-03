import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from './db';
import { alsAkteur } from './akteur';
import { emit, on, type DbEvent } from './events';
import {
  EREIGNISSE,
  ableiten,
  apiName,
  auslieferungErgebnis,
  ereignisArt,
  ereignisGruppe,
  ereignisprotokoll,
  ereignisseAbarbeiten,
  ereignisseSeit,
  protokollAufraeumen,
  pruefeFristen,
  setzeWebhookVersender,
  starteEreignisse,
  webhookAnlegen,
  webhookAuslieferungen,
  webhookNutzlast,
  webhooksZustellen,
  webhookUrlPruefen,
} from './ereignisse';

let stopp: () => void;
beforeAll(() => (stopp = starteEreignisse()));
afterAll(() => stopp());
beforeEach(() => zuruecksetzen());

const gehoert: DbEvent[] = [];
on('*', (e) => {
  if (!e.sammlung || e.abgeleitet || !/\.(created|updated|removed|restored)$/.test(e.typ)) gehoert.push(e);
});

const rechnung = (status: 'entwurf' | 'versendet' = 'entwurf', faelligAm = '2026-10-15') =>
  db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', kundeId: 'k', titel: 'Bad', positionen: [], status, datum: '2026-10-01', faelligAm, mahnstufe: 0 });

describe('Katalog', () => {
  it('hat eindeutige deutsche Typen und API-Namen im Schema', () => {
    expect(new Set(EREIGNISSE.map((a) => a.typ)).size).toBe(EREIGNISSE.length);
    expect(new Set(EREIGNISSE.map((a) => a.api)).size).toBe(EREIGNISSE.length);
    for (const a of EREIGNISSE) {
      expect(a.typ).toMatch(/^[a-z]+\.[a-z_]+$/);
      expect(a.api).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
    for (const api of ['customer.created', 'request.created', 'quote.sent', 'quote.accepted', 'job.created', 'job.scheduled', 'job.started', 'job.completed', 'invoice.created', 'invoice.sent', 'invoice.paid', 'employee.absent', 'material.low_stock'])
      expect(ereignisArt(api), api).toBeDefined();
    // fachliche Events, die Module heute selbst senden (emit), stehen alle im Katalog
    for (const typ of ['zeit.freigegeben', 'import.abgeschlossen', 'import.rueckgaengig', 'formular.ausgefuellt', 'mahnung.versendet', 'bericht.unterschrieben', 'einsatz.gestartet', 'einsatz.beendet', 'einsatz.problem_gemeldet', 'abnahme.unterschrieben', 'dokument.versendet', 'dokument.erstellt', 'auftragsbestaetigung.versendet', 'lieferschein.versendet', 'lieferschein.unterschrieben', 'rechnung.storniert', 'kunde.zusammengefuehrt', 'portal.geoeffnet', 'team.eingeladen', 'team.beigetreten', 'macher.aktion_ausgefuehrt'])
      expect(ereignisArt(typ), typ).toBeDefined();
    expect(ereignisGruppe('rechnung.bezahlt')).toBe('Geld');
    expect(ereignisGruppe('macher.aktion_ausgefuehrt')).toBe('Daten und Lotte');
    expect(apiName('rechnung.bezahlt')).toBe('invoice.paid');
    expect(apiName('unbekannt.passiert')).toBe('unbekannt.passiert');
  });
});

describe('Ableitung', () => {
  it('leitet fachliche Ereignisse aus Datenereignissen ab', () => {
    const r = { id: 'r', status: 'bezahlt' } as never;
    expect(ableiten({ typ: 'rechnungen.updated', sammlung: 'rechnungen', objekt: r, vorher: { id: 'r', status: 'versendet' } as never }).map((e) => e.typ)).toEqual(['rechnung.bezahlt']);
    expect(ableiten({ typ: 'auftraege.created', sammlung: 'auftraege', objekt: { id: 'a', phase: 'anfrage' } as never }).map((e) => e.typ)).toEqual(['auftrag.angelegt', 'anfrage.eingegangen']);
    const phase = ableiten({ typ: 'auftraege.updated', sammlung: 'auftraege', objekt: { id: 'a', phase: 'erledigt' } as never, vorher: { id: 'a', phase: 'abnahme' } as never });
    expect(phase.map((e) => e.typ)).toEqual(['auftrag.schritt_gewechselt', 'auftrag.abgeschlossen']);
    expect(phase[0].daten).toEqual({ von: 'abnahme', nach: 'erledigt' });
    expect(ableiten({ typ: 'artikel.updated', sammlung: 'artikel', objekt: { id: 'x', bestand: 2, mindestbestand: 5 } as never, vorher: { id: 'x', bestand: 6, mindestbestand: 5 } as never }).map((e) => e.typ)).toEqual(['material.knapp']);
    expect(ableiten({ typ: 'artikel.updated', sammlung: 'artikel', objekt: { id: 'x', bestand: 1, mindestbestand: 5 } as never, vorher: { id: 'x', bestand: 2, mindestbestand: 5 } as never })).toEqual([]);
  });

  it('sendet abgeleitete Ereignisse nach der Änderung und protokolliert sie mit Akteur', async () => {
    gehoert.length = 0;
    const k = alsAkteur({ quelle: 'import', id: 'csv' }, () => db.kunden.create({ art: 'privat', name: 'Neu', ansprechpartner: [] }));
    await Promise.resolve();
    expect(gehoert.map((e) => e.typ)).toContain('kunde.angelegt');
    const [p] = ereignisseSeit(undefined, { typ: 'customer.created' });
    expect(p).toMatchObject({ typ: 'kunde.angelegt', api: 'customer.created', quelle: 'import', akteurId: 'csv', bezug: { typ: 'kunden', id: k.id }, abgeleitet: true });
  });

  it('sendet nichts doppelt, wenn das Modul das Ereignis selbst sendet', () => {
    gehoert.length = 0;
    const r = rechnung();
    const neu = db.rechnungen.update(r.id, { status: 'versendet' })!;
    emit({ typ: 'rechnung.versendet', sammlung: 'rechnungen', objekt: neu, daten: { weg: 'email' } });
    ereignisseAbarbeiten();
    expect(gehoert.filter((e) => e.typ === 'rechnung.versendet')).toHaveLength(1);
    expect(ereignisprotokoll.where((p) => p.typ === 'rechnung.versendet')).toHaveLength(1);
  });

  it('sendet ein Storno nur einmal, wenn das Modul es zur stornierten Rechnung meldet', () => {
    gehoert.length = 0;
    const r = rechnung('versendet');
    const neu = db.rechnungen.update(r.id, { status: 'storniert' })!;
    emit({ typ: 'rechnung.storniert', sammlung: 'rechnungen', objekt: neu, daten: { rechnungId: r.id, stornoId: 'st' } });
    ereignisseAbarbeiten();
    expect(gehoert.filter((e) => e.typ === 'rechnung.storniert')).toHaveLength(1);
  });

  it('meldet überfällige Rechnungen genau einmal je Fälligkeit', () => {
    const r = rechnung('versendet', '2026-09-20');
    expect(pruefeFristen('2026-10-02')).toBe(1);
    expect(pruefeFristen('2026-10-03')).toBe(0);
    db.rechnungen.update(r.id, { faelligAm: '2026-09-25' }, { leise: true });
    expect(pruefeFristen('2026-10-03')).toBe(1);
  });
});

describe('Webhooks', () => {
  it('prüft Adressen', () => {
    expect(webhookUrlPruefen('https://example.com/hook')).toBeUndefined();
    expect(webhookUrlPruefen('http://localhost:3000/x')).toBeUndefined();
    expect(webhookUrlPruefen('http://example.com')).toMatch(/https/);
    expect(webhookUrlPruefen('kaputt')).toMatch(/gültige/);
  });

  it('merkt passende Ereignisse vor, stellt zu und wiederholt bei Fehlern', async () => {
    const w = webhookAnlegen({ name: 'Buchhaltung', url: 'https://example.com/hook', ereignisse: ['invoice.paid'] });
    const r = rechnung('versendet');
    db.rechnungen.update(r.id, { status: 'bezahlt' });
    ereignisseAbarbeiten();
    db.kunden.create({ art: 'privat', name: 'X', ansprechpartner: [] });
    ereignisseAbarbeiten();
    const liste = webhookAuslieferungen.all();
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ webhookId: w.id, api: 'invoice.paid', status: 'wartend', versuche: 0 });

    // ohne Versender bleibt die Warteschlange für den Server liegen
    expect(await webhooksZustellen()).toBe(0);

    const gesendet: unknown[] = [];
    setzeWebhookVersender(async ({ nutzlast }) => (gesendet.push(nutzlast), { ok: false, code: 500 }));
    expect(await webhooksZustellen()).toBe(1);
    expect(webhookAuslieferungen.get(liste[0].id)).toMatchObject({ status: 'fehler', versuche: 1, antwortCode: 500 });
    // nächster Versuch erst nach der Wartezeit
    expect(await webhooksZustellen()).toBe(0);
    auslieferungErgebnis(liste[0].id, { ok: true, code: 200 });
    expect(webhookAuslieferungen.get(liste[0].id)?.status).toBe('zugestellt');
    setzeWebhookVersender(undefined);

    const n = gesendet[0] as ReturnType<typeof webhookNutzlast>;
    expect(n.type).toBe('invoice.paid');
    expect(n.object).toMatchObject({ type: 'rechnungen', id: r.id });
    expect(n.object?.data).toMatchObject({ status: 'bezahlt' });
  });

  it('gibt nach allen Versuchen auf', () => {
    webhookAnlegen({ name: 'Alles', url: 'https://example.com/a', ereignisse: [] });
    db.kunden.create({ art: 'privat', name: 'Y', ansprechpartner: [] });
    ereignisseAbarbeiten();
    const [a] = webhookAuslieferungen.all();
    for (let i = 0; i < 6; i++) auslieferungErgebnis(a.id, { ok: false });
    expect(webhookAuslieferungen.get(a.id)?.status).toBe('aufgegeben');
  });

  it('Beispieldaten lösen keine Webhooks aus', () => {
    webhookAnlegen({ name: 'Alles', url: 'https://example.com/a', ereignisse: ['*'] });
    db.kunden.create({ art: 'privat', name: 'Bsp', ansprechpartner: [], beispiel: true });
    ereignisseAbarbeiten();
    expect(webhookAuslieferungen.all()).toHaveLength(0);
    expect(ereignisprotokoll.all()[0]?.beispiel).toBe(true);
  });
});

describe('Rotation', () => {
  it('begrenzt das Protokoll, offene Auslieferungen bleiben', () => {
    for (let i = 0; i < 6; i++) emit({ typ: 'test.passiert', daten: { i } });
    expect(ereignisprotokoll.all()).toHaveLength(6);
    expect(protokollAufraeumen({ maxEintraege: 4 })).toBe(2);
    expect(ereignisprotokoll.all()).toHaveLength(4);
    expect(protokollAufraeumen({ jetzt: new Date(Date.now() + 100 * 86_400_000) })).toBe(4);
  });
});
