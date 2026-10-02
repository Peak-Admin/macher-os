import { describe, expect, it } from 'vitest';
import type { Termin } from '@core/objects';
import { icsDateiname, kalenderwoche, kuenftigeTermine, monatsAnfang, terminAlsIcs, terminAmTag, termineIm, verschoben } from './daten';

const iso = (d: string, uhr: string) => new Date(`${d}T${uhr}:00`).toISOString();
const t = (id: string, tag: string, von: string, bis: string, x: Partial<Termin> = {}): Termin => ({
  id,
  erstelltAm: '',
  geaendertAm: '',
  art: 'einsatz',
  titel: id,
  start: iso(tag, von),
  ende: iso(tag, bis),
  mitarbeiterIds: ['m1'],
  status: 'geplant',
  ...x,
});

describe('Kalender', () => {
  it('filtert und sortiert Termine im Zeitraum', () => {
    const liste = [
      t('b', '2030-03-05', '10:00', '11:00'),
      t('a', '2030-03-05', '08:00', '09:00'),
      t('c', '2030-03-06', '08:00', '09:00', { mitarbeiterIds: ['m2'] }),
      t('x', '2030-03-05', '12:00', '13:00', { status: 'abgesagt' }),
      t('z', '2030-03-09', '08:00', '09:00'),
    ];
    expect(termineIm(liste, '2030-03-05', '2030-03-06').map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(termineIm(liste, '2030-03-05', '2030-03-06', { mitarbeiterId: 'm2' }).map((x) => x.id)).toEqual(['c']);
    expect(termineIm(liste, '2030-03-05', '2030-03-05', { mitAbgesagten: true })).toHaveLength(3);
  });

  it('erkennt mehrtägige Termine an jedem Tag', () => {
    const m = { start: iso('2030-03-05', '07:00'), ende: iso('2030-03-07', '16:00') };
    expect(terminAmTag(m, '2030-03-06')).toBe(true);
    expect(terminAmTag(m, '2030-03-08')).toBe(false);
  });

  it('verschiebt mit gleicher Dauer', () => {
    const v = verschoben(t('a', '2030-03-05', '08:00', '10:30'), '2030-03-07');
    expect(v).toEqual({ start: iso('2030-03-07', '08:00'), ende: iso('2030-03-07', '10:30') });
    expect(verschoben(t('a', '2030-03-05', '08:00', '10:30'), '2030-03-07', '13:00').ende).toBe(iso('2030-03-07', '15:30'));
  });

  it('findet künftige Termine eines Auftrags', () => {
    const liste = [
      t('alt', '2030-03-01', '08:00', '09:00', { auftragId: 'A' }),
      t('neu', '2030-03-10', '08:00', '09:00', { auftragId: 'A' }),
      t('ab', '2030-03-11', '08:00', '09:00', { auftragId: 'A', status: 'abgesagt' }),
      t('fremd', '2030-03-10', '08:00', '09:00', { auftragId: 'B' }),
    ];
    expect(kuenftigeTermine(liste, 'A', new Date(iso('2030-03-05', '12:00'))).map((x) => x.id)).toEqual(['neu']);
  });

  it('erzeugt gültiges ICS mit maskiertem Text', () => {
    const ics = terminAlsIcs(t('t1', '2030-03-05', '08:00', '09:30', { titel: 'Wartung; Heizung, Keller' }), {
      ort: 'Lindenweg 12, 34117 Kassel',
      beschreibung: 'Zeile 1\nZeile 2',
      erstellt: new Date('2030-01-01T00:00:00Z'),
    });
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('UID:t1@macher-os');
    expect(ics).toContain(`DTSTART:${new Date(iso('2030-03-05', '08:00')).toISOString().replace(/[-:]/g, '').replace('.000', '')}`);
    expect(ics).toContain('SUMMARY:Wartung\\; Heizung\\, Keller');
    expect(ics).toContain('LOCATION:Lindenweg 12\\, 34117 Kassel');
    expect(ics).toContain('DESCRIPTION:Zeile 1\\nZeile 2');
    expect(ics).toContain('STATUS:TENTATIVE');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((z) => z.length <= 75)).toBe(true);
  });

  it('erzeugt ganztägige ICS-Termine und Dateinamen', () => {
    const ics = terminAlsIcs(t('g', '2030-03-05', '00:00', '23:00', { ganztags: true, status: 'bestaetigt' }));
    expect(ics).toContain('DTSTART;VALUE=DATE:20300305');
    expect(ics).toContain('DTEND;VALUE=DATE:20300306');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(icsDateiname(t('x', '2030-03-05', '08:00', '09:00', { titel: 'Prüfung Gerät Süd' }))).toBe('termin-2030-03-05-pruefung-geraet-sued.ics');
  });
});

describe('Kalenderwochen', () => {
  it('rechnet ISO-KW und Monate', () => {
    expect(kalenderwoche('2026-01-01')).toBe(1);
    expect(kalenderwoche('2026-10-02')).toBe(40);
    expect(kalenderwoche('2027-01-01')).toBe(53);
    expect(kalenderwoche('2025-12-29')).toBe(1);
    expect(monatsAnfang('2026-10-17')).toBe('2026-10-01');
    expect(monatsAnfang('2026-12-17', 1)).toBe('2027-01-01');
    expect(monatsAnfang('2026-03-31', -1)).toBe('2026-02-01');
  });
});
