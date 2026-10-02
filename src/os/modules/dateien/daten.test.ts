import { describe, expect, it } from 'vitest';
import { MAX_DATEI_BYTES, artFuer, dataUrlZuBlob, dateiFehler, istDatei, titelAusName, vorschauArt } from './daten';

describe('Dateien', () => {
  it('lehnt zu große und leere Dateien mit verständlicher Meldung ab', () => {
    expect(dateiFehler({ name: 'plan.pdf', size: 1000, type: 'application/pdf' })).toBeUndefined();
    expect(dateiFehler({ name: 'gross.pdf', size: MAX_DATEI_BYTES + 1, type: 'application/pdf' })).toMatch(/höchstens 1,5 MB/);
    expect(dateiFehler({ name: 'leer.txt', size: 0, type: 'text/plain' })).toMatch(/leer/);
    expect(dateiFehler({ name: 'foto.jpg', size: 8 * 1024 * 1024, type: 'image/jpeg' })).toBeUndefined();
  });

  it('erkennt Pläne und PDFs am Namen', () => {
    expect(artFuer('Grundriss_EG.pdf', 'application/pdf')).toBe('plan');
    expect(artFuer('Schaltplan.dwg', '')).toBe('plan');
    expect(artFuer('Angebot Lieferant.pdf', 'application/pdf')).toBe('pdf');
    expect(artFuer('liste.xlsx', '')).toBe('datei');
    expect(titelAusName('Grundriss_EG-neu.pdf')).toBe('Grundriss EG neu');
  });

  it('wählt die passende Vorschau', () => {
    expect(vorschauArt({ art: 'pdf', mime: 'application/pdf', url: 'data:' })).toBe('pdf');
    expect(vorschauArt({ art: 'foto', mime: 'image/jpeg', url: 'data:' })).toBe('bild');
    expect(vorschauArt({ art: 'sprache', mime: 'audio/webm', url: 'data:' })).toBe('audio');
    expect(vorschauArt({ art: 'notiz', text: 'x' })).toBe('text');
    expect(vorschauArt({ art: 'datei', mime: 'application/zip', url: 'data:' })).toBe('keine');
    expect(istDatei({ art: 'plan' })).toBe(true);
    expect(istDatei({ art: 'foto' })).toBe(false);
  });

  it('wandelt Data-URLs in Blobs', () => {
    expect(dataUrlZuBlob('data:text/plain;base64,SGFsbG8=')?.size).toBe(5);
    expect(dataUrlZuBlob('data:image/svg+xml;charset=utf-8,%3Csvg%3E')?.type).toBe('image/svg+xml');
    expect(dataUrlZuBlob('kaputt')).toBeUndefined();
  });
});
