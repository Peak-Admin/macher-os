import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db, zuruecksetzen } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import { BRIEFKOPF_KEY, Briefbogen, DateiFeld, GeldEingabe, ToastProvider, ZahlEingabe, dataUrlBytes, dateiLesen, skalierteGroesse, unterschriftFehler, zahlAus, zahlAlsEingabe } from './index';

afterEach(cleanup);

describe('Zahlen', () => {
  it('liest deutsche Schreibweise, Einheiten und Leeres', () => {
    expect(zahlAus('1.234,5')).toBe(1234.5);
    expect(zahlAus('12.5')).toBe(12.5);
    expect(zahlAus('3,99 €')).toBe(3.99);
    expect(zahlAus('19 %')).toBe(19);
    expect(zahlAus('abc')).toBeUndefined();
    expect(zahlAus('')).toBeUndefined();
    expect(zahlAlsEingabe(1.5)).toBe('1,5');
  });

  it('ZahlEingabe meldet sofort, GeldEingabe erst beim Verlassen und in Cent', () => {
    const zahl = vi.fn();
    const geld = vi.fn();
    const { getByLabelText } = render(
      <>
        <ZahlEingabe label="Menge" wert={undefined} onWert={zahl} />
        <GeldEingabe label="Preis" wert={undefined} onWert={geld} />
      </>,
    );
    fireEvent.change(getByLabelText('Menge'), { target: { value: '2,5' } });
    expect(zahl).toHaveBeenLastCalledWith(2.5);
    const preis = getByLabelText('Preis') as HTMLInputElement;
    fireEvent.focus(preis);
    fireEvent.change(preis, { target: { value: '12,34' } });
    expect(geld).not.toHaveBeenCalled();
    fireEvent.blur(preis);
    expect(geld).toHaveBeenLastCalledWith(1234);
    expect(preis.value).toBe('12,34');
  });
});

describe('Bilder und Dateien', () => {
  it('verkleinert auf höchstens 1600 px bzw. eine Box und behält das Seitenverhältnis', () => {
    expect(skalierteGroesse(4000, 3000)).toEqual({ breite: 1600, hoehe: 1200 });
    expect(skalierteGroesse(800, 600)).toEqual({ breite: 800, hoehe: 600 });
    expect(skalierteGroesse(1200, 300, 600, 240)).toEqual({ breite: 600, hoehe: 150 });
    expect(skalierteGroesse(600, 600, 600, 240)).toEqual({ breite: 240, hoehe: 240 });
  });

  it('liest PDFs unverändert als Data-URL', async () => {
    const pdf = new File(['%PDF-1.4 test'], 'plan.pdf', { type: 'application/pdf' });
    const d = await dateiLesen(pdf);
    expect(d).toMatchObject({ mime: 'application/pdf', name: 'plan.pdf', istBild: false, bytes: pdf.size });
    expect(d.url.startsWith('data:application/pdf')).toBe(true);
    // Base64-Schätzung inkl. Auffüllzeichen
    expect(Math.abs(dataUrlBytes(d.url) - pdf.size)).toBeLessThanOrEqual(2);
  });

  it('DateiFeld gibt die gewählten Dateien weiter und zeigt sie an', () => {
    const gewaehlt = vi.fn();
    const datei = new File(['x'], 'au.jpg', { type: 'image/jpeg' });
    const { container, getByText, rerender } = render(<DateiFeld label="Krankmeldung" accept="image/*" dateien={[]} onDateien={gewaehlt} />);
    expect(getByText('Noch nichts gewählt.')).toBeTruthy();
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [datei] } });
    expect(gewaehlt).toHaveBeenCalledWith([datei]);
    rerender(<DateiFeld label="Krankmeldung" accept="image/*" dateien={[datei]} onDateien={gewaehlt} />);
    expect(getByText('au.jpg')).toBeTruthy();
  });
});

describe('Unterschrift', () => {
  it('verlangt Bild und Namen', () => {
    expect(unterschriftFehler({ name: 'A' })).toMatch(/unterschreiben/);
    expect(unterschriftFehler({ bild: 'data:', name: ' ' })).toMatch(/Namen/);
    expect(unterschriftFehler({ bild: 'data:', name: 'A' })).toBeUndefined();
  });
});

describe('Briefbogen', () => {
  it('nimmt Absender aus den Betriebsdaten und die Fußzeile aus dem Briefkopf', () => {
    zuruecksetzen();
    db.betrieb.create({ id: 'betrieb', name: 'Elektro Muster', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: 'Weg 1', plz: '34117', ort: 'Kassel' }, telefon: '0561 1', email: 'info@muster.example', iban: 'DE02120300000000202051', stundensatz: 0, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
    const k = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } });
    setzeEinstellung(BRIEFKOPF_KEY, { zeigeBank: false, zeigeSteuer: true, zusatz: 'HWK Kassel' });
    const { getByText, queryByText, getAllByText } = render(
      <MemoryRouter>
        <ToastProvider>
          <Briefbogen titel="Rechnung R-2026-0001" kundeId={k.id} daten={[['Datum', '02.10.2026'], ['Leer', '']]}>
            <p>Inhalt</p>
          </Briefbogen>
        </ToastProvider>
      </MemoryRouter>,
    );
    expect(getAllByText('Elektro Muster').length).toBeGreaterThan(0);
    expect(getByText('Familie Hoffmann')).toBeTruthy();
    expect(getByText('Lindenweg 12')).toBeTruthy();
    expect(getByText('HWK Kassel')).toBeTruthy();
    expect(queryByText(/IBAN/)).toBeNull();
    expect(queryByText('Leer')).toBeNull();
    expect(getByText('Inhalt')).toBeTruthy();
  });
});
