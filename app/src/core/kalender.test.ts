import { afterEach, describe, expect, it } from 'vitest';
import { setzeEinstellung } from './einstellungen';
import {
  arbeitstageZwischen,
  betriebsArbeitstage,
  betriebsBundesland,
  feiertage,
  feiertagName,
  istArbeitstag,
  istFeiertag,
  naechsteArbeitstage,
  ostersonntag,
} from './kalender';
import {
  kalenderwoche,
  lokal,
  minutenAus,
  minutenAusStreng,
  minutenVon,
  plusMonate,
  tage,
  uhrAus,
  wochenStart,
  wochentag,
} from './format';

describe('Feiertage', () => {
  it('berechnet Ostern', () => {
    expect(ostersonntag(2024)).toBe('2024-03-31');
    expect(ostersonntag(2026)).toBe('2026-04-05');
    expect(ostersonntag(2027)).toBe('2027-03-28');
  });

  it('kennt ohne Bundesland nur die 9 bundesweiten Feiertage', () => {
    const f = feiertage(2026);
    expect(f.size).toBe(9);
    expect(f.get('2026-04-03')).toBe('Karfreitag');
    expect(f.get('2026-05-25')).toBe('Pfingstmontag');
    expect(f.has('2026-06-04')).toBe(false); // Fronleichnam nur in einigen Ländern
  });

  it('ergänzt Landesfeiertage je Bundesland', () => {
    expect(feiertagName('2026-06-04', 'HE')).toBe('Fronleichnam');
    expect(feiertagName('2026-06-04', 'NI')).toBeUndefined();
    expect(feiertagName('2026-10-31', 'NI')).toBe('Reformationstag');
    expect(feiertagName('2026-11-01', 'BY')).toBe('Allerheiligen');
    expect(feiertagName('2026-01-06', 'BW')).toBe('Heilige Drei Könige');
    expect(feiertagName('2026-03-08', 'BE')).toBe('Internationaler Frauentag');
    expect(feiertagName('2026-09-20', 'TH')).toBe('Weltkindertag');
    expect(feiertagName('2026-08-15', 'SL')).toBe('Mariä Himmelfahrt');
    // Buß- und Bettag: Mittwoch vor dem 23.11.
    expect(feiertagName('2026-11-18', 'SN')).toBe('Buß- und Bettag');
    expect(feiertagName('2027-11-17', 'SN')).toBe('Buß- und Bettag');
    expect(istFeiertag('2026-11-18', 'BY')).toBe(false);
    expect(feiertage(2026, 'BY').size).toBe(12);
  });
});

describe('Arbeitstage', () => {
  afterEach(() => {
    setzeEinstellung('plan.arbeitstage', [1, 2, 3, 4, 5]);
    setzeEinstellung('plan.bundesland', '');
  });

  it('prüft Wochentag und Feiertag', () => {
    expect(istArbeitstag('2026-10-02', [1, 2, 3, 4, 5], null)).toBe(true); // Freitag
    expect(istArbeitstag('2026-10-03', [1, 2, 3, 4, 5, 6], null)).toBe(false); // Samstag, aber Feiertag
    expect(istArbeitstag('2026-10-10', [1, 2, 3, 4, 5, 6], null)).toBe(true); // Samstagsbetrieb
    expect(istArbeitstag('2026-06-04', [1, 2, 3, 4, 5], 'HE')).toBe(false);
    expect(istArbeitstag('2026-06-04', [1, 2, 3, 4, 5], null)).toBe(true);
  });

  it('nimmt ohne Angabe die Einstellungen des Betriebs (Standard Mo–Fr, bundesweit)', () => {
    expect(betriebsArbeitstage()).toEqual([1, 2, 3, 4, 5]);
    expect(betriebsBundesland()).toBeUndefined();
    expect(istArbeitstag('2026-06-04')).toBe(true);
    setzeEinstellung('plan.bundesland', 'NW');
    setzeEinstellung('plan.arbeitstage', [1, 2, 3, 4]);
    expect(betriebsBundesland()).toBe('NW');
    expect(istArbeitstag('2026-06-04')).toBe(false); // Fronleichnam in NRW
    expect(istArbeitstag('2026-10-09')).toBe(false); // Freitag ist frei
    setzeEinstellung('plan.bundesland', 'XX');
    expect(betriebsBundesland()).toBeUndefined();
  });

  it('zählt und sucht Arbeitstage', () => {
    // Woche mit Ostermontag
    expect(arbeitstageZwischen('2026-04-06', '2026-04-12', [1, 2, 3, 4, 5], null)).toBe(4);
    expect(naechsteArbeitstage('2026-12-24', 3, [1, 2, 3, 4, 5], null)).toEqual(['2026-12-24', '2026-12-28', '2026-12-29']);
    expect(naechsteArbeitstage('2026-12-24', 3, [], null)).toEqual([]);
  });
});

describe('Datums- und Uhrzeit-Helfer', () => {
  it('rechnet Monate mit Monatsende', () => {
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(plusMonate('2028-01-31', 1)).toBe('2028-02-29');
    expect(plusMonate('2026-03-31', -1)).toBe('2026-02-28');
    expect(plusMonate('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('kennt Wochentag, Wochenstart, Kalenderwoche und Tageslisten', () => {
    expect(wochentag('2026-10-05')).toBe(1);
    expect(wochentag('2026-10-04')).toBe(7);
    expect(wochenStart('2026-10-04')).toBe('2026-09-28');
    expect(wochenStart('2026-10-05')).toBe('2026-10-05');
    expect(kalenderwoche('2026-10-02')).toBe(40);
    expect(kalenderwoche('2027-01-01')).toBe(53);
    expect(kalenderwoche('2025-12-29')).toBe(1);
    expect(tage('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(tage('2026-11-02', '2026-10-30')).toEqual([]);
  });

  it('wandelt Uhrzeiten', () => {
    expect(minutenAus('07:30')).toBe(450);
    expect(minutenAus('')).toBe(0);
    expect(minutenAusStreng('7:05')).toBe(425);
    expect(minutenAusStreng('7 Uhr')).toBeUndefined();
    expect(minutenAusStreng(undefined)).toBeUndefined();
    expect(uhrAus(450)).toBe('07:30');
    expect(uhrAus(1440)).toBe('24:00');
    expect(uhrAus(449.6)).toBe('07:30');
    expect(minutenVon(lokal('2026-10-05', 615))).toBe(615);
    expect(minutenVon(lokal('2026-10-05', 615).toISOString())).toBe(615);
  });
});
