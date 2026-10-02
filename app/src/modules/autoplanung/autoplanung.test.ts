import { describe, expect, it } from 'vitest';
import {
  allesVorplanen,
  einzuplanen,
  eingeplanteStunden,
  offeneStunden,
  vorschlaege,
  vorschlagAlsTermine,
  wunschAuslegen,
} from './daten';
import { arbeitstage, freieFenster, hhmm, istVerfuegbar, minutenVon } from './basis';
import { auftrag, ctx, ma, MO, nachweis, ort, termin } from './testhilfe';

const DI = '2026-10-06';
const MI = '2026-10-07';

const team = () =>
  ctx({
    mitarbeiter: [ma('jonas'), ma('mehmet'), ma('lukas', { rolle: 'azubi' }), ma('sandra', { rolle: 'buero' })],
    orte: [ort('nah', '34117'), ort('fern', '80331')],
  });

describe('Verfügbarkeit (minimal)', () => {
  it('rechnet freie Fenster aus Arbeitszeit, Terminen und Abwesenheiten', () => {
    const c = team();
    c.termine.push(termin('t', MO, '09:00', '11:00', { mitarbeiterIds: ['jonas'] }));
    expect(freieFenster(c, 'jonas', MO).map((f) => `${hhmm(f.von)}-${hhmm(f.bis)}`)).toEqual(['07:00-09:00', '11:00-16:00']);
    c.abwesenheiten.push({ id: 'u', mitarbeiterId: 'jonas', art: 'urlaub', von: MO, bis: MO, status: 'beantragt', erstelltAm: '', geaendertAm: '' });
    expect(freieFenster(c, 'jonas', MO)).toEqual([]);
    expect(istVerfuegbar(c, 'mehmet', termin('x', MO, '09:00', '10:00').start, termin('x', MO, '09:00', '10:00').ende)).toBe(true);
  });

  it('kennt nur Arbeitstage', () => {
    expect(arbeitstage('2026-10-09', 3)).toEqual(['2026-10-09', '2026-10-12', '2026-10-13']);
  });
});

describe('Was ist einzuplanen?', () => {
  it('zieht bereits eingeplante Personenstunden ab', () => {
    const c = team();
    const a = auftrag('a', { geplanteStunden: 20 });
    c.auftraege.push(a);
    c.termine.push(termin('t', MO, '07:00', '12:00', { auftragId: 'a', mitarbeiterIds: ['jonas', 'mehmet'] }));
    c.termine.push(termin('weg', MO, '13:00', '15:00', { auftragId: 'a', mitarbeiterIds: ['jonas'], status: 'abgesagt' }));
    c.termine.push(termin('besicht', MO, '15:00', '16:00', { auftragId: 'a', art: 'besichtigung', mitarbeiterIds: ['jonas'] }));
    expect(eingeplanteStunden(c, 'a')).toBe(10);
    expect(offeneStunden(c, a)).toBe(10);
  });

  it('plant beauftragte/laufende Aufträge und dringende Störungen, sonst nicht', () => {
    const c = team();
    expect(einzuplanen(c, auftrag('a', { phase: 'beauftragt', geplanteStunden: 2 }))).toBe(true);
    expect(einzuplanen(c, auftrag('a', { phase: 'angebot', geplanteStunden: 2 }))).toBe(false);
    expect(einzuplanen(c, auftrag('a', { phase: 'anfrage', geplanteStunden: 2 }))).toBe(false);
    expect(einzuplanen(c, auftrag('a', { phase: 'anfrage', dringend: true, geplanteStunden: 2 }))).toBe(true);
    expect(einzuplanen(c, auftrag('a', { phase: 'beauftragt' }))).toBe(true); // ohne Schätzung: Standard
  });
});

describe('Wunschtermin auslegen', () => {
  it('versteht gängige Formulierungen', () => {
    expect(wunschAuslegen('diese Woche nachmittags', MO)).toMatchObject({ von: MO, bis: '2026-10-09', abMinuten: 720, erkannt: true });
    expect(wunschAuslegen('nächste Woche', MO)).toMatchObject({ von: '2026-10-12', bis: '2026-10-16' });
    expect(wunschAuslegen('morgen vormittag', MO)).toMatchObject({ von: DI, bis: DI, bisMinuten: 720 });
    expect(wunschAuslegen('am liebsten Dienstag ab 14 Uhr', MO)).toMatchObject({ wochentage: [2], abMinuten: 840 });
    expect(wunschAuslegen('14.10.', MO)).toMatchObject({ von: '2026-10-14', bis: '2026-10-14' });
    expect(wunschAuslegen('ab 20.10.', MO)).toMatchObject({ von: '2026-10-20' });
    expect(wunschAuslegen('irgendwann', MO).erkannt).toBe(false);
    expect(wunschAuslegen(undefined, MO).erkannt).toBe(false);
  });
});

describe('Automatische Planung', () => {
  it('schlägt nur qualifizierte Leute vor, nie Büro oder Azubi als Leitung', () => {
    const c = team();
    c.auftraege.push(auftrag('a', { geplanteStunden: 3, ortId: 'nah', qualifikationIds: ['q1'] }));
    c.nachweise.push(nachweis('mehmet', 'q1'), nachweis('sandra', 'q1'), nachweis('lukas', 'q1'));
    const r = vorschlaege(c, 'a', { ab: MO });
    expect(r.vorschlaege.length).toBeGreaterThan(0);
    expect(r.vorschlaege.every((v) => v.mitarbeiterIds[0] === 'mehmet')).toBe(true);
    expect(r.vorschlaege[0].gruende.join(' ')).toContain('Elektrofachkraft');
  });

  it('erklärt, warum es keinen Vorschlag gibt', () => {
    const c = team();
    c.auftraege.push(auftrag('a', { geplanteStunden: 3, qualifikationIds: ['q1'] }));
    const r = vorschlaege(c, 'a', { ab: MO });
    expect(r.vorschlaege).toEqual([]);
    expect(r.hinweise.join(' ')).toContain('Elektrofachkraft');
    expect(vorschlaege(c, 'gibtsnicht').hinweise[0]).toContain('gibt es nicht');
  });

  it('meidet belegte Zeiten, Abwesenheiten und hält Fahrzeit zum Vortermin ein', () => {
    const c = team();
    c.mitarbeiter = [ma('jonas')];
    c.auftraege.push(auftrag('a', { geplanteStunden: 4, ortId: 'nah' }), auftrag('vor', { ortId: 'fern' }));
    c.termine.push(termin('t', MO, '07:00', '11:00', { auftragId: 'vor', mitarbeiterIds: ['jonas'] }));
    c.abwesenheiten.push({ id: 'u', mitarbeiterId: 'jonas', art: 'krank', von: DI, bis: DI, status: 'genehmigt', erstelltAm: '', geaendertAm: '' });
    const r = vorschlaege(c, 'a', { ab: MO, anzahl: 5 });
    const mo = r.vorschlaege.find((v) => v.bloecke[0].datum === MO);
    // München → Kassel passt nicht mehr in den Montag (11 Uhr + Fahrt > 12 Uhr)
    expect(mo).toBeUndefined();
    expect(r.vorschlaege.some((v) => v.bloecke[0].datum === DI)).toBe(false);
    expect(r.vorschlaege[0].bloecke[0].datum).toBe(MI);
  });

  it('plant am selben Tag nach dem Vortermin mit Fahrzeit + Puffer', () => {
    const c = team();
    c.mitarbeiter = [ma('jonas')];
    c.orte.push(ort('nachbar', '34119'));
    c.auftraege.push(auftrag('a', { geplanteStunden: 3, ortId: 'nah' }), auftrag('vor', { ortId: 'nachbar' }));
    c.termine.push(termin('t', MO, '07:00', '10:00', { auftragId: 'vor', mitarbeiterIds: ['jonas'] }));
    const r = vorschlaege(c, 'a', { ab: MO });
    const v = r.vorschlaege.find((x) => x.bloecke[0].datum === MO)!;
    expect(v).toBeDefined();
    expect(v.bloecke[0].von).toBeGreaterThan(10 * 60 + 10);
    expect(v.gruende.join(' ')).toContain('Vortermin');
  });

  it('teilt große Aufträge auf mehrere Tage und zwei Personen auf', () => {
    const c = team();
    c.auftraege.push(auftrag('gross', { geplanteStunden: 40, ortId: 'nah' }));
    const r = vorschlaege(c, 'gross', { ab: MO });
    const v = r.vorschlaege[0];
    expect(v.mitarbeiterIds).toHaveLength(2);
    expect(v.bloecke.length).toBeGreaterThan(1);
    expect(v.stunden).toBeCloseTo(40, 5);
    const termine = vorschlagAlsTermine(c.auftraege[0], v);
    expect(termine).toHaveLength(v.bloecke.length);
    expect(termine[0].titel).toContain('Tag 1/');
    expect(termine.every((t) => t.mitarbeiterIds.length === 2 && t.auftragId === 'gross')).toBe(true);
  });

  it('fällt auf eine Person zurück, wenn niemand zweites frei ist', () => {
    const c = team();
    c.mitarbeiter = [ma('jonas')];
    c.auftraege.push(auftrag('gross', { geplanteStunden: 20, ortId: 'nah' }));
    const r = vorschlaege(c, 'gross', { ab: MO });
    expect(r.vorschlaege[0].mitarbeiterIds).toEqual(['jonas']);
    expect(r.vorschlaege[0].bloecke.reduce((s, b) => s + b.bis - b.von, 0)).toBe(20 * 60);
    expect(r.hinweise.join(' ')).toContain('eine Person');
  });

  it('berücksichtigt Wunschtermin und Uhrzeit des Kunden', () => {
    const c = team();
    c.auftraege.push(auftrag('a', { geplanteStunden: 2, ortId: 'nah', wunschtermin: 'Mittwoch nachmittags' }));
    const r = vorschlaege(c, 'a', { ab: MO });
    const v = r.vorschlaege[0];
    expect(v.bloecke[0].datum).toBe(MI);
    expect(v.bloecke[0].von).toBeGreaterThanOrEqual(12 * 60);
    expect(v.gruende.join(' ')).toContain('Kundenwunsch');
  });

  it('bevorzugt die weniger ausgelastete Person und begründet es', () => {
    const c = team();
    c.auftraege.push(auftrag('a', { geplanteStunden: 2, ortId: 'nah' }));
    for (const d of [MO, DI, MI, '2026-10-08', '2026-10-09']) c.termine.push(termin(`j${d}`, d, '07:00', '13:00', { mitarbeiterIds: ['jonas'] }));
    const r = vorschlaege(c, 'a', { ab: MO });
    expect(r.vorschlaege[0].mitarbeiterIds[0]).toBe('mehmet');
    expect(r.vorschlaege[0].gruende.some((g) => g.includes('% verplant'))).toBe(true);
    expect(r.vorschlaege[0].score).toBeGreaterThan(r.vorschlaege.find((v) => v.mitarbeiterIds[0] === 'jonas')!.score);
  });

  it('dringend: plant heute, aber erst ab jetzt + 30 min', () => {
    const c = team();
    c.auftraege.push(auftrag('s', { geplanteStunden: 1.5, ortId: 'nah', dringend: true, phase: 'anfrage' }));
    const r = vorschlaege(c, 's', { jetzt: 10 * 60 + 5 });
    const v = r.vorschlaege[0];
    expect(v.bloecke[0].datum).toBe(MO);
    expect(v.bloecke[0].von).toBeGreaterThanOrEqual(10 * 60 + 35);
    expect(v.gruende).toContain('Dringend – frühester freier Termin');
    expect(v.score).toBeLessThanOrEqual(100);
  });

  it('liefert verschiedene Personen als Alternativen, sortiert nach Score', () => {
    const c = team();
    c.auftraege.push(auftrag('a', { geplanteStunden: 2, ortId: 'nah' }));
    const r = vorschlaege(c, 'a', { ab: MO, anzahl: 3 });
    expect(r.vorschlaege).toHaveLength(3);
    expect(new Set(r.vorschlaege.slice(0, 2).map((v) => v.mitarbeiterIds[0])).size).toBe(2);
    const scores = r.vorschlaege.map((v) => v.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('plant alle offenen Aufträge ohne Überschneidungen vor', () => {
    const c = team();
    c.mitarbeiter = [ma('jonas')];
    c.auftraege.push(
      auftrag('a1', { geplanteStunden: 6, ortId: 'nah', erstelltAm: '2026-01-01' }),
      auftrag('a2', { geplanteStunden: 6, ortId: 'nah', erstelltAm: '2026-01-02' }),
      auftrag('dringend', { geplanteStunden: 2, ortId: 'nah', dringend: true, erstelltAm: '2026-01-03' }),
      auftrag('fertig', { phase: 'erledigt', geplanteStunden: 2 }),
    );
    const plan = allesVorplanen(c, { ab: MO, jetzt: 7 * 60 });
    expect(plan.map((p) => p.auftrag.id)).toEqual(['dringend', 'a1', 'a2']);
    const bloecke = plan.flatMap((p) => p.vorschlag!.bloecke);
    for (let i = 0; i < bloecke.length; i++)
      for (let j = i + 1; j < bloecke.length; j++) {
        const a = bloecke[i];
        const b = bloecke[j];
        const ueber = a.datum === b.datum && a.von < b.bis && b.von < a.bis;
        expect(ueber).toBe(false);
      }
    // Originaldaten bleiben unverändert
    expect(c.termine).toHaveLength(0);
  });

  it('wandelt Blöcke in Termine mit richtiger Uhrzeit um', () => {
    const a = auftrag('w', { art: 'wartung', ortId: 'nah' });
    const [t] = vorschlagAlsTermine(a, { auftragId: 'w', mitarbeiterIds: ['jonas'], bloecke: [{ datum: MO, von: 450, bis: 540 }], stunden: 1.5, score: 50, gruende: ['x'], warnungen: [] });
    expect(t.art).toBe('wartung');
    expect(minutenVon(t.start)).toBe(450);
    expect(minutenVon(t.ende)).toBe(540);
    expect(t.titel).toBe(a.titel);
  });
});

describe('Uhrzeiten', () => {
  it('schlägt nur Viertelstunden vor', () => {
    const c = team();
    c.mitarbeiter = [ma('jonas')];
    c.orte.push(ort('nachbar', '34119'));
    c.auftraege.push(auftrag('a', { geplanteStunden: 2, ortId: 'nah' }), auftrag('vor', { ortId: 'nachbar' }));
    c.termine.push(termin('t', MO, '07:00', '10:00', { auftragId: 'vor', mitarbeiterIds: ['jonas'] }));
    for (const v of vorschlaege(c, 'a', { ab: MO, anzahl: 5 }).vorschlaege) expect(v.bloecke[0].von % 15).toBe(0);
  });
});
