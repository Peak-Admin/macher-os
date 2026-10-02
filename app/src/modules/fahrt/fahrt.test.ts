import { describe, expect, it } from 'vitest';
import { fahrminuten, haversineKm, mapsRoute, naechsterNachbar, plzNaeherungKm, pruefeUebergang, strecke, tagesroute } from './daten';
import { auftrag, ctx, ma, MO, ort, termin } from '../autoplanung/testhilfe';

describe('Entfernung', () => {
  it('rechnet Haversine richtig (Kassel–Göttingen ≈ 38 km Luftlinie)', () => {
    const km = haversineKm(51.3127, 9.4797, 51.5413, 9.9158);
    expect(km).toBeGreaterThan(36);
    expect(km).toBeLessThan(40);
  });

  it('nähert über PLZ und kennzeichnet das als Schätzung', () => {
    expect(plzNaeherungKm('34117', '34117')).toBe(2);
    expect(plzNaeherungKm('34117', '34119')).toBe(6);
    expect(plzNaeherungKm('34117', '34246')).toBe(15);
    const weit = plzNaeherungKm('34117', '80331')!;
    expect(weit).toBeGreaterThan(300);
    expect(plzNaeherungKm('3411', '34117')).toBeUndefined();
    const s = strecke({ label: 'a', adresse: { strasse: 'x', plz: '34117', ort: '' } }, { label: 'b', adresse: { strasse: 'y', plz: '34246', ort: '' } });
    expect(s.genauigkeit).toBe('plz');
  });

  it('nutzt Koordinaten, wenn vorhanden', () => {
    const s = strecke({ label: 'a', lat: 51.3127, lng: 9.4797 }, { label: 'b', lat: 51.5413, lng: 9.9158 });
    expect(s.genauigkeit).toBe('genau');
    expect(s.km).toBeGreaterThan(45);
    expect(s.minuten).toBeGreaterThan(40);
  });

  it('unbekannt ohne Adresse, 0 bei gleicher Adresse', () => {
    expect(strecke(undefined, { label: 'x' }).genauigkeit).toBe('unbekannt');
    const p = { label: 'a', adresse: { strasse: 'Weg 1', plz: '34117', ort: '' } };
    expect(strecke(p, { ...p }).km).toBe(0);
    expect(fahrminuten(0)).toBe(0);
    expect(fahrminuten(10)).toBeGreaterThan(fahrminuten(5));
  });
});

describe('Fahrzeit-Puffer', () => {
  const c = () =>
    ctx({
      mitarbeiter: [ma('jonas')],
      orte: [ort('o1', '34117'), ort('o2', '34246')],
      auftraege: [auftrag('a1', { ortId: 'o1' }), auftrag('a2', { ortId: 'o2' })],
    });

  it('meldet zu wenig Zeit zwischen zwei Einsätzen mit Lösungsvorschlag', () => {
    const x = c();
    const a = termin('t1', MO, '08:00', '10:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] });
    const b = termin('t2', MO, '10:05', '12:00', { auftragId: 'a2', mitarbeiterIds: ['jonas'] });
    const u = pruefeUebergang(x, a, b, 10);
    expect(u.pruefung.ergebnis).toBe('problem');
    expect(u.pruefung.loesung).toMatch(/\d\d:\d\d Uhr/);
  });

  it('warnt bei knappem Puffer, ok bei genug Zeit, Problem bei Überschneidung', () => {
    const x = c();
    const a = termin('t1', MO, '08:00', '10:00', { auftragId: 'a1' });
    const fahrt = pruefeUebergang(x, a, termin('t2', MO, '13:00', '14:00', { auftragId: 'a2' })).strecke.minuten;
    const knapp = termin('t3', MO, '10:00', '11:00', { auftragId: 'a2' });
    knapp.start = new Date(new Date(a.ende).getTime() + (fahrt + 3) * 60_000).toISOString();
    expect(pruefeUebergang(x, a, knapp, 10).pruefung.ergebnis).toBe('warnung');
    expect(pruefeUebergang(x, a, termin('t4', MO, '13:00', '14:00', { auftragId: 'a2' })).pruefung.ergebnis).toBe('ok');
    expect(pruefeUebergang(x, a, termin('t5', MO, '09:30', '11:00', { auftragId: 'a2' })).pruefung.ergebnis).toBe('problem');
  });
});

describe('Tagesroute', () => {
  it('baut Stopps in Zeitreihenfolge mit Google-Maps-Link inkl. Wegpunkten', () => {
    const x = ctx({
      mitarbeiter: [ma('jonas')],
      orte: [ort('o1', '34117'), ort('o2', '34246'), ort('o3', '34225')],
      auftraege: [auftrag('a1', { ortId: 'o1' }), auftrag('a2', { ortId: 'o2' }), auftrag('a3', { ortId: 'o3' })],
      termine: [
        termin('t3', MO, '14:00', '15:00', { auftragId: 'a3', mitarbeiterIds: ['jonas'] }),
        termin('t1', MO, '07:00', '09:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] }),
        termin('t2', MO, '10:00', '12:00', { auftragId: 'a2', mitarbeiterIds: ['jonas'] }),
        termin('intern', MO, '06:30', '06:45', { art: 'intern', mitarbeiterIds: ['jonas'] }),
        termin('fremd', MO, '10:00', '12:00', { auftragId: 'a2', mitarbeiterIds: ['mehmet'] }),
      ],
    });
    const r = tagesroute(x, 'jonas', MO);
    expect(r.stopps.map((s) => s.termin.id)).toEqual(['t1', 't2', 't3']);
    expect(r.start?.label).toContain('Betrieb');
    expect(r.geschaetzt).toBe(true);
    expect(r.kmGesamt).toBeGreaterThan(0);
    const url = new URL(r.mapsLink!);
    expect(url.hostname).toBe('www.google.com');
    expect(url.searchParams.get('origin')).toContain('34117');
    expect(url.searchParams.get('destination')).toContain('34225');
    expect(url.searchParams.get('waypoints')!.split('|')).toHaveLength(2);
    expect(r.uebergaenge).toHaveLength(2);
  });

  it('Maps-Link ohne Stopps gibt es nicht; mit Koordinaten werden diese genutzt', () => {
    expect(mapsRoute(undefined, [])).toBeUndefined();
    const url = mapsRoute(undefined, [{ label: 'x', lat: 51.1, lng: 9.2 }])!;
    expect(new URL(url).searchParams.get('destination')).toBe('51.1,9.2');
  });

  it('schlägt per nächstem Nachbarn eine kürzere Reihenfolge vor', () => {
    const P = (lat: number, lng: number) => ({ punkt: { label: `${lat}`, lat, lng } });
    const start = { label: 'start', lat: 51.0, lng: 9.0 };
    const stopps = [P(51.3, 9.0), P(51.1, 9.0), P(51.2, 9.0)];
    const r = naechsterNachbar(start, stopps);
    expect(r.reihenfolge.map((s) => s.punkt.lat)).toEqual([51.1, 51.2, 51.3]);
    expect(r.km).toBeLessThan(r.kmBisher);
  });
});

describe('Fahrt-Prüfung je Termin', () => {
  it('liefert nur die Übergänge, an denen der Termin beteiligt ist', async () => {
    const { pruefeFahrtFuerTermin } = await import('./daten');
    const x = ctx({
      mitarbeiter: [ma('jonas')],
      orte: [ort('o1', '34117'), ort('o2', '34246')],
      auftraege: [auftrag('a1', { ortId: 'o1' }), auftrag('a2', { ortId: 'o2' })],
    });
    const t1 = termin('t1', MO, '07:00', '09:00', { auftragId: 'a1', mitarbeiterIds: ['jonas'] });
    const t2 = termin('t2', MO, '09:05', '10:00', { auftragId: 'a2', mitarbeiterIds: ['jonas'] });
    const t3 = termin('t3', MO, '15:00', '16:00', { auftragId: 'a2', mitarbeiterIds: ['jonas'] });
    x.termine.push(t1, t2, t3);
    expect(pruefeFahrtFuerTermin(x, t1).map((p) => p.ergebnis)).toEqual(['problem']);
    expect(pruefeFahrtFuerTermin(x, t3).map((p) => p.ergebnis)).toEqual(['ok']);
  });
});
