import { beforeEach, describe, expect, it } from 'vitest';
import { _verzeichnisZuruecksetzen, betriebAnlegen, betriebe, betriebMerken, betriebsSchluessel, betriebWaehlen, ERSTER_BETRIEB, leerenBetriebVerwerfen } from './betriebe';

describe('Betriebe (Wechsler)', () => {
  beforeEach(() => {
    localStorage.removeItem('macher-os:betriebe');
    _verzeichnisZuruecksetzen();
  });

  it('der erste Betrieb behält die bisherigen Speicherschlüssel', () => {
    expect(betriebsSchluessel('daten', ERSTER_BETRIEB)).toBe('daten');
    expect(betriebsSchluessel('daten', 'b42')).toBe('daten:b42');
    expect(betriebe().map((b) => b.id)).toEqual([ERSTER_BETRIEB]);
  });

  it('legt an, wählt und verwirft nur leere Betriebe', () => {
    const id = betriebAnlegen();
    expect(betriebe()).toHaveLength(2);
    betriebWaehlen(ERSTER_BETRIEB);
    leerenBetriebVerwerfen(id, ERSTER_BETRIEB);
    expect(betriebe()).toHaveLength(1);

    const zweiter = betriebAnlegen();
    betriebMerken({ name: 'Elektro Kraus', eingerichtet: true }, zweiter);
    leerenBetriebVerwerfen(zweiter, ERSTER_BETRIEB);
    expect(betriebe().find((b) => b.id === zweiter)?.name).toBe('Elektro Kraus');
  });

  it('übersteht kaputte Daten im Speicher', () => {
    localStorage.setItem('macher-os:betriebe', '{kaputt');
    _verzeichnisZuruecksetzen();
    expect(betriebe()[0].id).toBe(ERSTER_BETRIEB);
  });
});
