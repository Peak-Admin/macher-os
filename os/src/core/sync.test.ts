import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { db, importieren, zeitstrahl, zuruecksetzen } from './db';
import { on } from './events';
import type { Basis } from './objects';
import { starteSync, syncStatus, zusammenfuehren, type ObjektZeile, type SyncAdapter, type SyncSteuerung } from './sync';

/** Server-Attrappe: Tabelle `objekte` mit „letzte Änderung gewinnt“ und Realtime an alle Abonnenten */
function server() {
  const zeilen = new Map<string, ObjektZeile>();
  const hoerer = new Set<(z: ObjektZeile) => void>();
  let uhr = 0;
  let erreichbar = true;
  const hochgeladen: ObjektZeile[][] = [];
  const schreiben = (z: ObjektZeile) => {
    const k = `${z.sammlung}/${z.id}`;
    const alt = zeilen.get(k);
    if (alt?.daten && z.daten && (z.daten.geaendertAm ?? '') < (alt.daten.geaendertAm ?? '')) return;
    const neu = { ...z, geaendert_am: `2026-10-02T00:00:${String(++uhr).padStart(2, '0')}.000Z` };
    zeilen.set(k, neu);
    hoerer.forEach((h) => h(neu));
  };
  const adapter: SyncAdapter = {
    async hochladen(liste) {
      if (!erreichbar) throw new Error('offline');
      hochgeladen.push(liste);
      liste.forEach(schreiben);
    },
    async laden(seit) {
      if (!erreichbar) throw new Error('offline');
      return [...zeilen.values()].filter((z) => !seit || z.geaendert_am! > seit).sort((a, b) => a.geaendert_am!.localeCompare(b.geaendert_am!));
    },
    abonnieren(fn) {
      hoerer.add(fn);
      return () => hoerer.delete(fn);
    },
  };
  return {
    adapter,
    zeilen,
    hochgeladen,
    /** Änderung von einem anderen Gerät */
    fremd: (z: ObjektZeile) => schreiben(z),
    setzeErreichbar: (ja: boolean) => (erreichbar = ja),
  };
}

function speicher() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}

const kurz = () => new Promise((r) => setTimeout(r, 5));

let s: SyncSteuerung | undefined;
beforeEach(() => zuruecksetzen());
afterEach(() => s?.stoppen());

describe('Zusammenführen', () => {
  const basis = { id: 'k', erstelltAm: 'a', geaendertAm: '2026-10-02T10:00:00.000Z', name: 'Meier', telefon: '1', ort: 'Ulm' } as Basis;
  test('verschiedene Felder werden zusammengeführt, ohne Konflikt', () => {
    const hier = { ...basis, geaendertAm: '2026-10-02T10:05:00.000Z', telefon: '2' };
    const dort = { ...basis, geaendertAm: '2026-10-02T10:06:00.000Z', ort: 'Bonn' };
    const r = zusammenfuehren(basis, hier, dort);
    expect(r.konflikte).toEqual([]);
    expect(r.objekt).toMatchObject({ telefon: '2', ort: 'Bonn', name: 'Meier' });
    expect(r.objekt!.geaendertAm > dort.geaendertAm).toBe(true);
  });
  test('dasselbe Feld: letzte Änderung gewinnt, Konflikt wird gemeldet', () => {
    const hier = { ...basis, geaendertAm: '2026-10-02T10:07:00.000Z', name: 'Meier GmbH' };
    const dort = { ...basis, geaendertAm: '2026-10-02T10:06:00.000Z', name: 'Meyer' };
    const r = zusammenfuehren(basis, hier, dort);
    expect((r.objekt as unknown as { name: string }).name).toBe('Meier GmbH');
    expect(r.konflikte).toEqual([{ feld: 'name', hier: 'Meier GmbH', dort: 'Meyer', gewonnen: 'hier' }]);
  });
  test('ohne Basis gilt das neuere Objekt', () => {
    const hier = { ...basis, geaendertAm: '2026-10-02T10:05:00.000Z', name: 'A' };
    const dort = { ...basis, geaendertAm: '2026-10-02T10:06:00.000Z', name: 'B' };
    const r = zusammenfuehren(undefined, hier, dort);
    expect(r.objekt).toEqual(dort);
    expect(r.konflikte.map((k) => k.feld)).toEqual(['name']);
  });
  test('kein Datenverlust: entfernt auf einer Seite, geändert auf der anderen', () => {
    expect(zusammenfuehren(basis, basis, null).objekt).toBe(basis);
    expect(zusammenfuehren(basis, undefined, basis).objekt).toBe(basis);
  });
});

describe('Abgleich', () => {
  test('eigene Änderungen werden hochgeladen, Beispieldaten nicht', async () => {
    const srv = server();
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    await s.abgleichen();
    const k = db.kunden.create({ name: 'Meier' } as never);
    db.kunden.create({ name: 'Beispiel', beispiel: true } as never);
    await kurz();
    await s.abgleichen();
    expect(srv.zeilen.get(`kunden/${k.id}`)?.daten).toMatchObject({ name: 'Meier' });
    expect([...srv.zeilen.values()].some((z) => (z.daten as { name?: string })?.name === 'Beispiel')).toBe(false);
    // Zeitstrahl-Eintrag „Angelegt“ reist mit
    expect([...srv.zeilen.values()].some((z) => z.sammlung === 'ereignisse')).toBe(true);
    expect(syncStatus()).toMatchObject({ zustand: 'bereit', wartend: 0 });
  });

  test('Änderungen anderer Geräte kommen an – ohne Echo-Upload', async () => {
    const srv = server();
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    await s.abgleichen();
    srv.fremd({ sammlung: 'kunden', id: 'k9', daten: { id: 'k9', erstelltAm: 'x', geaendertAm: '2026-10-02T09:00:00.000Z', name: 'Vom Handy' } as Basis });
    expect(db.kunden.get('k9')).toMatchObject({ name: 'Vom Handy' });
    await kurz();
    await s.abgleichen();
    expect(srv.hochgeladen.flat().some((z) => z.id === 'k9')).toBe(false);
  });

  test('offline: Warteschlange bleibt (auch über Neustart) und wird später hochgeladen', async () => {
    const srv = server();
    const sp = speicher();
    let online = false;
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: sp, verzoegerung: 0, online: () => online });
    const k = db.kunden.create({ name: 'Offline erfasst' } as never);
    await kurz();
    expect(syncStatus().zustand).toBe('offline');
    expect(syncStatus().wartend).toBeGreaterThan(0);
    s.stoppen();
    // neuer Start (z. B. App neu geöffnet), jetzt online
    online = true;
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: sp, verzoegerung: 0, online: () => online });
    await s.abgleichen();
    expect(srv.zeilen.get(`kunden/${k.id}`)?.daten).toMatchObject({ name: 'Offline erfasst' });
    expect(syncStatus().wartend).toBe(0);
  });

  test('Server nicht erreichbar → Fehlerzustand, danach erneuter Versuch', async () => {
    const srv = server();
    srv.setzeErreichbar(false);
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    db.kunden.create({ name: 'X' } as never);
    await kurz();
    expect(syncStatus().zustand).toBe('fehler');
    srv.setzeErreichbar(true);
    await s.abgleichen();
    expect(syncStatus()).toMatchObject({ zustand: 'bereit', wartend: 0 });
  });

  test('Konflikt: letzte Änderung gewinnt, Zeitstrahl zeigt beide Werte', async () => {
    const srv = server();
    let online = true;
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0, online: () => online });
    const k = db.kunden.create({ name: 'Meier', telefon: '1' } as never);
    await kurz();
    await s.abgleichen();
    online = false;
    const lokal = db.kunden.update(k.id, { name: 'Meier GmbH', telefon: '2' } as never)!;
    await kurz();
    // anderes Gerät ändert gleichzeitig den Namen – etwas später
    const spaeter = new Date(new Date(lokal.geaendertAm).getTime() + 1000).toISOString();
    srv.fremd({ sammlung: 'kunden', id: k.id, daten: { ...srv.zeilen.get(`kunden/${k.id}`)!.daten!, name: 'Meyer', geaendertAm: spaeter } as Basis });
    online = true;
    await s.abgleichen();
    // Name: das andere Gerät war später dran; Telefon hat nur dieses Gerät geändert → bleibt
    expect(db.kunden.get(k.id)).toMatchObject({ name: 'Meyer', telefon: '2' });
    expect(srv.zeilen.get(`kunden/${k.id}`)?.daten).toMatchObject({ name: 'Meyer', telefon: '2' });
    expect(db.kunden.get(k.id)!.geaendertAm > spaeter).toBe(true);
    const eintrag = zeitstrahl({ typ: 'kunden', id: k.id }).find((e) => e.typ === 'sync.konflikt');
    expect(eintrag?.text).toContain('name');
    expect(eintrag?.daten).toMatchObject({ konflikte: [{ feld: 'name', hier: 'Meier GmbH', dort: 'Meyer', gewonnen: 'dort' }] });
    expect(syncStatus().wartend).toBe(0);
  });

  test('Zurücksetzen/Import wird nicht hochgeladen', async () => {
    const srv = server();
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    await s.abgleichen();
    importieren({ kunden: { s1: { id: 's1', erstelltAm: 'x', geaendertAm: 'x', name: 'Spielwiese' } as Basis } });
    await kurz();
    await s.abgleichen();
    expect(srv.zeilen.has('kunden/s1')).toBe(false);
  });

  test('Übernahme lädt alle vorhandenen Daten einmalig hoch', async () => {
    db.kunden.create({ name: 'A' } as never);
    db.kunden.create({ name: 'B' } as never);
    db.kunden.create({ name: 'Beispiel', beispiel: true } as never);
    const srv = server();
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    const n = await s.allesHochladen();
    const kunden = [...srv.zeilen.values()].filter((z) => z.sammlung === 'kunden');
    expect(kunden.map((z) => (z.daten as unknown as { name: string }).name).sort()).toEqual(['A', 'B']);
    expect(n).toBeGreaterThanOrEqual(2);
  });

  test('vom Server geschriebene Ereignisse kommen als fachliches Event an', async () => {
    const srv = server();
    s = starteSync(srv.adapter, { betriebId: 'b1', speicher: speicher(), verzoegerung: 0 });
    await s.abgleichen();
    const gesehen: unknown[] = [];
    const weg = on('portal.geoeffnet', (e) => gesehen.push(e.daten));
    srv.fremd({
      sammlung: 'ereignisse',
      id: 'e_x',
      daten: { id: 'e_x', erstelltAm: 'x', geaendertAm: 'x', typ: 'portal.geoeffnet', bezug: { typ: 'angebote', id: 'a1' }, text: 'Geöffnet', daten: { kundeId: 'k1', bezug: { typ: 'angebote', id: 'a1' } } } as Basis,
    });
    weg();
    expect(gesehen).toEqual([{ kundeId: 'k1', bezug: { typ: 'angebote', id: 'a1' } }]);
  });
});
