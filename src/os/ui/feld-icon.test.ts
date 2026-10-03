import { describe, expect, it } from 'vitest';
import { feldIcon } from './feld-icon';

describe('feldIcon', () => {
  it('nimmt zuerst den Feldtyp', () => {
    expect(feldIcon({ label: 'Irgendwas', type: 'email' })).toBe('mail');
    expect(feldIcon({ label: 'Irgendwas', type: 'tel' })).toBe('telefon');
    expect(feldIcon({ label: 'Eintritt', type: 'date' })).toBe('kalender');
    expect(feldIcon({ label: 'Von', type: 'time' })).toBe('uhr');
  });

  it('lässt Felder ohne Text weg', () => {
    expect(feldIcon({ label: 'Datei', type: 'file' })).toBeUndefined();
    expect(feldIcon({ label: 'Ja', type: 'checkbox' })).toBeUndefined();
  });

  it.each([
    ['Vorname', 'person'],
    ['Nachname', 'person'],
    ['Handynummer', 'telefon'],
    ['Wochenstunden laut Vertrag', 'uhr'],
    ['Urlaubstage pro Jahr', 'kalender'],
    ['Team / Kolonne', 'team'],
    ['Interne Kosten je Stunde (€)', 'euro'],
    ['Rabatt in %', 'prozent'],
    ['Straße und Hausnummer', 'ort'],
    ['PLZ', 'ort'],
    ['Name des Betriebs', 'betrieb'],
    ['Kundennummer', 'nummer'],
    ['Zeitraum', 'kalender'],
    ['Code aus der SMS', 'schloss'],
    ['Website / Shop', 'link'],
    ['Kilometerstand', 'auto'],
    ['Titel', 'stift'],
  ])('„%s“ → %s', (label, icon) => {
    expect(feldIcon({ label })).toBe(icon);
  });

  it('hat für jede Art einen Standard', () => {
    expect(feldIcon({ label: 'Xyz' })).toBe('stift');
    expect(feldIcon({ label: 'Xyz', art: 'auswahl' })).toBe('liste');
    expect(feldIcon({ label: 'Xyz', art: 'text' })).toBe('notiz');
    expect(feldIcon({ label: 'Xyz', inputMode: 'decimal' })).toBe('nummer');
  });
});
