import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import type { Mitarbeiter } from '@core/objects';
import { beispielProfilbild, PROFILBILD, profilbild } from './person';

const person = (extra: Partial<Mitarbeiter> = {}) =>
  db.mitarbeiter.create({ vorname: 'Mehmet', nachname: 'Yılmaz', rolle: 'monteur', wochenstunden: 39, urlaubstageJahr: 30, kostensatz: 3600, aktiv: true, ...extra });

describe('Profilbilder', () => {
  afterEach(() => setzeEinstellung('modus.spielwiese', false));

  it('Beispielteam bekommt ein Porträt, echte Mitarbeiter nicht', () => {
    expect(beispielProfilbild({ vorname: 'Mehmet', nachname: 'Yılmaz', beispiel: true })).toBe('/bilder/os/team/mehmet-yilmaz.webp');
    expect(beispielProfilbild({ vorname: 'Mehmet', nachname: 'Yılmaz' })).toBeUndefined();
    expect(beispielProfilbild({ vorname: 'Erika', nachname: 'Muster', beispiel: true })).toBeUndefined();
  });

  it('in der Spielwiese auch der Chef', () => {
    setzeEinstellung('modus.spielwiese', true);
    expect(beispielProfilbild({ vorname: 'Max', nachname: 'Macher' })).toBe('/bilder/os/team/max-macher.webp');
  });

  it('hochgeladenes Foto hat Vorrang', () => {
    const m = person({ beispiel: true });
    expect(profilbild(m.id)).toBe('/bilder/os/team/mehmet-yilmaz.webp');
    db.dokumente.create({ art: 'foto', titel: 'Profilbild', url: 'data:image/webp;base64,AA', bezug: { typ: 'mitarbeiter', id: m.id }, tags: [PROFILBILD] });
    expect(profilbild(m.id)).toBe('data:image/webp;base64,AA');
  });
});
