import { describe, expect, it } from 'vitest';
import { darfMelden, einstellungenAus, faelligeTakte, inRuhezeit, STANDARD_EINSTELLUNGEN, takteFuer, taktInRuhezeit } from './regeln';
import { minutenVonText, textVonMinuten, uhrVon } from './zeit';

const uhr = (datum: string, zeit: string, wochentag: number) => ({ datum, minuten: minutenVonText(zeit)!, wochentag });
const std = einstellungenAus(undefined);

describe('Uhr des Betriebs', () => {
  it('rechnet in deutscher Zeit, egal wo der Code läuft (Sommer- und Winterzeit)', () => {
    expect(uhrVon('2026-10-02T04:30:00Z')).toEqual({ datum: '2026-10-02', minuten: 6 * 60 + 30, wochentag: 5 });
    expect(uhrVon('2026-12-01T05:30:00Z')).toEqual({ datum: '2026-12-01', minuten: 6 * 60 + 30, wochentag: 2 });
    expect(uhrVon('2026-10-03T22:30:00Z')).toMatchObject({ datum: '2026-10-04', wochentag: 7 });
  });
  it('liest und schreibt Uhrzeiten', () => {
    expect(minutenVonText('06:30')).toBe(390);
    expect(minutenVonText('24:00')).toBeUndefined();
    expect(minutenVonText('')).toBeUndefined();
    expect(textVonMinuten(390)).toBe('06:30');
  });
});

describe('Ruhezeiten', () => {
  it('Standard: nach 18 Uhr, vor 6 Uhr und am Wochenende ist Ruhe', () => {
    expect(STANDARD_EINSTELLUNGEN.ruhe).toEqual({ ab: '18:00', bis: '06:00', wochenende: true });
    expect(inRuhezeit(std, uhr('2026-10-01', '17:59', 4))).toBe(false);
    expect(inRuhezeit(std, uhr('2026-10-01', '18:00', 4))).toBe(true);
    expect(inRuhezeit(std, uhr('2026-10-01', '23:30', 4))).toBe(true);
    expect(inRuhezeit(std, uhr('2026-10-02', '05:59', 5))).toBe(true);
    expect(inRuhezeit(std, uhr('2026-10-02', '06:00', 5))).toBe(false);
    expect(inRuhezeit(std, uhr('2026-10-03', '10:00', 6))).toBe(true);
    expect(inRuhezeit(std, uhr('2026-10-04', '10:00', 7))).toBe(true);
  });
  it('lässt sich je Nutzer ändern (auch Fenster am selben Tag und ohne Wochenende)', () => {
    const e = einstellungenAus({ ruhe: { ab: '12:00', bis: '13:00', wochenende: false } });
    expect(inRuhezeit(e, uhr('2026-10-03', '10:00', 6))).toBe(false);
    expect(inRuhezeit(e, uhr('2026-10-02', '12:30', 5))).toBe(true);
    expect(inRuhezeit(e, uhr('2026-10-02', '19:00', 5))).toBe(false);
  });
  it('in der Ruhezeit kommt nur Dringendes – und nur bei Notdienst', () => {
    const nacht = uhr('2026-10-02', '22:00', 5);
    expect(darfMelden(std, nacht)).toBe(false);
    expect(darfMelden(std, nacht, { dringend: true })).toBe(false);
    expect(darfMelden({ ...std, notdienst: true }, nacht, { dringend: true })).toBe(true);
    expect(darfMelden({ ...std, notdienst: true }, nacht)).toBe(false);
    expect(darfMelden(std, uhr('2026-10-02', '10:00', 5))).toBe(true);
  });
  it('erkennt, wenn ein Takt in die eigene Ruhezeit gelegt wurde', () => {
    expect(taktInRuhezeit(std, 'dein-tag')).toBe(false);
    expect(taktInRuhezeit({ ...std, takte: { 'dein-tag': { uhr: '05:30' } } }, 'dein-tag')).toBe(true);
  });
  it('füllt alte oder kaputte Werte mit Standards auf', () => {
    expect(einstellungenAus({ kanal: 'fax', ruhe: { ab: '19:00' } })).toEqual({ takte: {}, kanal: 'push', ruhe: { ab: '19:00', bis: '06:00', wochenende: true }, notdienst: false });
  });
});

describe('Planer', () => {
  const plan = (rolle: 'chef' | 'buero' | 'monteur', u: ReturnType<typeof uhr>, extra: Partial<Parameters<typeof faelligeTakte>[0]> = {}) =>
    faelligeTakte({ rolle, einstellungen: std, uhr: u, zuletzt: {}, ...extra });

  it('ordnet die Takte den Rollen zu', () => {
    expect(takteFuer('monteur').map((t) => t.id)).toEqual(['dein-tag', 'zeiten']);
    expect(takteFuer('buero').map((t) => t.id)).toEqual(['tagesbrief']);
    expect(takteFuer('chef').map((t) => t.id)).toEqual(['tagesbrief', 'wochenbilanz']);
  });
  it('Monteur: 6:30 Dein Tag, 16:30 Zeiten; Chef: 7:00 Tagesbrief, freitags 15:00 Wochenbilanz', () => {
    expect(plan('monteur', uhr('2026-10-01', '06:29', 4))).toEqual([]);
    expect(plan('monteur', uhr('2026-10-01', '06:30', 4))).toEqual(['dein-tag']);
    expect(plan('monteur', uhr('2026-10-01', '16:45', 4))).toEqual(['zeiten']);
    expect(plan('chef', uhr('2026-10-01', '07:05', 4))).toEqual(['tagesbrief']);
    expect(plan('chef', uhr('2026-10-01', '15:00', 4))).toEqual([]);
    expect(plan('chef', uhr('2026-10-02', '15:00', 5))).toEqual(['wochenbilanz']);
    expect(plan('buero', uhr('2026-10-02', '15:00', 5))).toEqual([]);
  });
  it('höchstens einmal am Tag, verpasste Takte nur kurz nachholen', () => {
    expect(plan('chef', uhr('2026-10-01', '07:05', 4), { zuletzt: { tagesbrief: '2026-10-01' } })).toEqual([]);
    expect(plan('chef', uhr('2026-10-01', '07:05', 4), { zuletzt: { tagesbrief: '2026-09-30' } })).toEqual(['tagesbrief']);
    expect(plan('chef', uhr('2026-10-01', '08:59', 4))).toEqual(['tagesbrief']);
    expect(plan('chef', uhr('2026-10-01', '09:00', 4))).toEqual([]);
  });
  it('nichts am Wochenende, an Feiertagen oder wenn abgeschaltet', () => {
    expect(plan('chef', uhr('2026-10-03', '07:00', 6))).toEqual([]);
    expect(plan('chef', uhr('2026-10-01', '07:00', 4), { arbeitstag: false })).toEqual([]);
    expect(plan('chef', uhr('2026-10-01', '07:00', 4), { einstellungen: { ...std, takte: { tagesbrief: { an: false } } } })).toEqual([]);
  });
  it('eigene Uhrzeit gilt – in der Ruhezeit kommt der Takt nicht, auch nicht bei Notdienst', () => {
    const frueh = { ...std, takte: { 'dein-tag': { uhr: '05:30' } } };
    expect(plan('monteur', uhr('2026-10-01', '05:30', 4), { einstellungen: frueh })).toEqual([]);
    expect(plan('monteur', uhr('2026-10-01', '05:30', 4), { einstellungen: { ...frueh, notdienst: true } })).toEqual([]);
    const spaet = { ...std, takte: { zeiten: { uhr: '17:00' } } };
    expect(plan('monteur', uhr('2026-10-01', '16:30', 4), { einstellungen: spaet })).toEqual([]);
    expect(plan('monteur', uhr('2026-10-01', '17:10', 4), { einstellungen: spaet })).toEqual(['zeiten']);
    // Ruhe ab 17 Uhr: Zeiten um 17:10 fallen in die Ruhezeit
    expect(plan('monteur', uhr('2026-10-01', '17:10', 4), { einstellungen: { ...spaet, ruhe: { ...std.ruhe, ab: '17:00' } } })).toEqual([]);
  });
});
