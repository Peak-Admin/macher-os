import { describe, expect, it } from 'vitest';
import type { Dokument, Termin } from '@core/objects';
import { dataUrlBytes, fotosGefiltert, groesseText, laufenderAuftrag, nachherFehlt, skalierteGroesse, titelAusText } from './daten';
import { platzFrei } from './speicher';

const basis = { erstelltAm: '2026-05-01T08:00:00.000Z', geaendertAm: '2026-05-01T08:00:00.000Z' };
const dok = (x: Partial<Dokument>): Dokument => ({ id: Math.random().toString(36), art: 'foto', titel: 'F', ...basis, ...x });
const termin = (x: Partial<Termin>): Termin => ({ id: Math.random().toString(36), art: 'einsatz', titel: 'T', start: '', ende: '', mitarbeiterIds: ['m1'], status: 'geplant', ...basis, ...x });

describe('Fotos', () => {
  it('verkleinert auf höchstens 1600 px und behält das Seitenverhältnis', () => {
    expect(skalierteGroesse(4000, 3000)).toEqual({ breite: 1600, hoehe: 1200 });
    expect(skalierteGroesse(3000, 4000)).toEqual({ breite: 1200, hoehe: 1600 });
    expect(skalierteGroesse(800, 600)).toEqual({ breite: 800, hoehe: 600 });
    expect(skalierteGroesse(0, 600)).toEqual({ breite: 0, hoehe: 0 });
  });

  it('schätzt Bytes einer Data-URL und formatiert Größen', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,QUJD')).toBe(3);
    expect(groesseText(512 * 1024)).toBe('512 KB');
    expect(groesseText(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });

  it('findet den laufenden Auftrag für die Vorauswahl', () => {
    const t = [
      termin({ auftragId: 'a1', start: '2026-05-01T07:00:00.000Z', ende: '2026-05-01T09:00:00.000Z' }),
      termin({ auftragId: 'a2', start: '2026-05-01T11:00:00.000Z', ende: '2026-05-01T12:00:00.000Z' }),
      termin({ auftragId: 'a3', start: '2026-05-01T07:00:00.000Z', ende: '2026-05-01T16:00:00.000Z', mitarbeiterIds: ['m2'] }),
    ];
    expect(laufenderAuftrag(t, 'm1', '2026-05-01T08:00:00.000Z')).toBe('a1');
    expect(laufenderAuftrag(t, 'm1', '2026-05-01T10:00:00.000Z')).toBe('a2');
    expect(laufenderAuftrag(t, 'm1', '2026-05-01T13:00:00.000Z')).toBeUndefined();
    expect(laufenderAuftrag([...t, termin({ auftragId: 'a9', status: 'vor_ort', start: '2026-05-01T14:00:00.000Z', ende: '2026-05-01T15:00:00.000Z' })], 'm1', '2026-05-01T08:00:00.000Z')).toBe('a9');
    expect(laufenderAuftrag(t, undefined, '2026-05-01T08:00:00.000Z')).toBeUndefined();
  });

  it('filtert Fotos nach Tag und erkennt fehlende Nachher-Fotos', () => {
    const d = [dok({ tags: ['Vorher'] }), dok({ tags: ['Mangel'] }), dok({ art: 'notiz' })];
    expect(fotosGefiltert(d)).toHaveLength(2);
    expect(fotosGefiltert(d, 'Mangel')).toHaveLength(1);
    expect(nachherFehlt(d)).toBe(true);
    expect(nachherFehlt([...d, dok({ tags: ['Nachher'] })])).toBe(false);
    expect(nachherFehlt([dok({})])).toBe(false);
  });

  it('macht aus Notiztext einen kurzen Titel', () => {
    expect(titelAusText('Erste Zeile\nZweite')).toBe('Erste Zeile');
    expect(titelAusText('x'.repeat(80), 10)).toBe('xxxxxxxxx…');
  });

  it('prüft freien Speicher, ohne etwas liegen zu lassen', () => {
    expect(platzFrei(10)).toBe(true);
    expect(localStorage.getItem('macher-os:platzprobe')).toBeNull();
  });
});
