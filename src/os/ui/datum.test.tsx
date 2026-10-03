import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { Eingabe } from './index';
import { datumKurz, datumLang, datumLesen, kalenderwoche, monatsraster, plusMonate, schnellwahl } from './datum-logik';

afterEach(cleanup);

describe('Datumslogik', () => {
  it('liest getippte Daten', () => {
    const h = '2026-10-03';
    expect(datumLesen('03.10.2026', h)).toBe('2026-10-03');
    expect(datumLesen('3.10.', h)).toBe('2026-10-03');
    expect(datumLesen('3.1.27', h)).toBe('2027-01-03');
    expect(datumLesen('031026', h)).toBe('2026-10-03');
    expect(datumLesen('03102026', h)).toBe('2026-10-03');
    expect(datumLesen('2026-12-24', h)).toBe('2026-12-24');
    expect(datumLesen('morgen', h)).toBe('2026-10-04');
    expect(datumLesen('', h)).toBe('');
    expect(datumLesen('31.02.2026', h)).toBeUndefined();
    expect(datumLesen('irgendwann', h)).toBeUndefined();
  });

  it('zählt Kalenderwochen nach ISO', () => {
    expect(kalenderwoche('2026-10-03')).toBe(40);
    expect(kalenderwoche('2026-01-01')).toBe(1);
    expect(kalenderwoche('2027-01-01')).toBe(53);
    expect(kalenderwoche('2024-12-30')).toBe(1);
  });

  it('baut ein Raster ab Montag und rechnet Monate', () => {
    const r = monatsraster('2026-10-15');
    expect(r).toHaveLength(6);
    expect(r[0][0]).toBe('2026-09-28');
    expect(r[5][6]).toBe('2026-11-08');
    expect(plusMonate('2026-01-31', 1)).toBe('2026-02-28');
    expect(datumKurz('2026-10-03')).toBe('03.10.2026');
    expect(datumLang('2026-10-03')).toBe('Samstag, 3. Oktober 2026');
    expect(schnellwahl('2026-10-03').map((s) => s.datum)).toEqual(['2026-10-04', '2026-10-05', '2026-10-17']);
  });
});

describe('Eingabe type="date"', () => {
  function Test({ onWert, min }: { onWert: (v: string) => void; min?: string }) {
    const [v, setV] = useState('2026-10-03');
    return <Eingabe label="Datum" type="date" min={min} value={v} onChange={(e) => (setV(e.target.value), onWert(e.target.value))} />;
  }

  it('zeigt deutsch an und meldet getippte Daten als ISO', () => {
    const onWert = vi.fn();
    const { getByLabelText } = render(<Test onWert={onWert} />);
    const feld = getByLabelText('Datum') as HTMLInputElement;
    expect(feld.value).toBe('03.10.2026');
    fireEvent.change(feld, { target: { value: '24.12.26' } });
    fireEvent.blur(feld);
    expect(onWert).toHaveBeenCalledWith('2026-12-24');
    expect(feld.value).toBe('24.12.2026');
  });

  it('wählt im Kalender und sperrt Tage vor min', () => {
    const onWert = vi.fn();
    const { getByLabelText, getByRole } = render(<Test onWert={onWert} min="2026-10-02" />);
    fireEvent.click(getByLabelText('Datum'));
    expect(getByRole('dialog').textContent).toContain('Oktober 2026');
    const gesperrt = getByLabelText(/^Donnerstag, 1\. Oktober 2026/) as HTMLButtonElement;
    expect(gesperrt.disabled).toBe(true);
    fireEvent.click(getByLabelText(/^Mittwoch, 7\. Oktober 2026/));
    expect(onWert).toHaveBeenCalledWith('2026-10-07');
  });

  it('meldet unlesbare Eingaben als Fehler', () => {
    const onWert = vi.fn();
    const { getByLabelText, getByRole } = render(<Test onWert={onWert} />);
    const feld = getByLabelText('Datum');
    fireEvent.change(feld, { target: { value: '40.13.' } });
    fireEvent.blur(feld);
    expect(getByRole('alert').textContent).toContain('TT.MM.JJJJ');
    expect(onWert).not.toHaveBeenCalled();
  });
});
