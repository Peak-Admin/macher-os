import { describe, expect, it } from 'vitest';
import { mailtoLink, unbeantwortetTage, vorlagen, wartetZuLange, type Bewerber } from './daten';

const b = (x: Partial<Bewerber>): Bewerber => ({ id: '1', erstelltAm: '', geaendertAm: '', vorname: 'Kevin', nachname: 'Brandt', stelle: 'monteur', status: 'neu', eingegangenAm: '2026-09-28', ...x }) as Bewerber;

describe('Bewerber', () => {
  it('erkennt unbeantwortete Bewerbungen nach mehr als 3 Tagen', () => {
    expect(unbeantwortetTage(b({}), '2026-10-02')).toBe(4);
    expect(wartetZuLange(b({}), '2026-10-02')).toBe(true);
    expect(wartetZuLange(b({}), '2026-10-01')).toBe(false);
    expect(wartetZuLange(b({ beantwortetAm: '2026-09-29T10:00:00' }), '2026-10-02')).toBe(false);
    expect(wartetZuLange(b({ status: 'absage' }), '2026-10-02')).toBe(false);
  });

  it('baut Antwortvorlagen mit Du-Ansprache als mailto-Link', () => {
    const v = vorlagen(b({}), 'Elektro Muster', 'Max Macher');
    expect(v.map((x) => x.id)).toEqual(['eingang', 'gespraech', 'probearbeiten', 'zusage', 'absage']);
    expect(v[0].text).toContain('Hallo Kevin');
    expect(v[0].text).toContain('Monteur / Geselle');
    const link = mailtoLink('k@example.de', v[1]);
    expect(link.startsWith('mailto:k@example.de?subject=')).toBe(true);
    expect(decodeURIComponent(link.split('body=')[1])).toContain('Max Macher');
  });
});
