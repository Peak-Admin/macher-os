import { afterEach, describe, expect, it } from 'vitest';
import { kartenEinbettung, kartenImmerLaden, kartenSuche, setzeKartenImmerLaden } from './ortskarte-logik';

const adresse = { strasse: 'Goethestraße 22–26', plz: '34119', ort: 'Kassel' };

describe('Ortskarte', () => {
  afterEach(() => setzeKartenImmerLaden(false));

  it('nimmt Koordinaten vor der Adresse', () => {
    expect(kartenSuche({ adresse, lat: 51.31, lng: 9.47 })).toBe('51.31,9.47');
    expect(kartenSuche({ adresse })).toBe('Goethestraße 22–26, 34119 Kassel');
    expect(kartenSuche({})).toBeUndefined();
  });

  it('nutzt mit Schlüssel die Maps Embed API, sonst die schlüssellose Einbettung', () => {
    const offiziell = new URL(kartenEinbettung({ adresse }, 'abc')!);
    expect(offiziell.pathname).toBe('/maps/embed/v1/place');
    expect(offiziell.searchParams.get('key')).toBe('abc');
    expect(offiziell.searchParams.get('q')).toBe('Goethestraße 22–26, 34119 Kassel');
    const ohne = new URL(kartenEinbettung({ adresse })!);
    expect(ohne.searchParams.get('output')).toBe('embed');
    expect(kartenEinbettung({})).toBeUndefined();
  });

  it('merkt sich „immer anzeigen“', () => {
    expect(kartenImmerLaden()).toBe(false);
    setzeKartenImmerLaden(true);
    expect(kartenImmerLaden()).toBe(true);
  });
});
