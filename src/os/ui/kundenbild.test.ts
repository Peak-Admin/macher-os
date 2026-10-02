import { describe, expect, it } from 'vitest';
import { domainAusWebsite, kundenDomain, kundenFarbe, kundenInitialen } from './kundenbild-logik';

describe('Kundenbild', () => {
  it('liest die Domain aus der Website', () => {
    expect(domainAusWebsite('https://www.baeckerei-sommer.de/kontakt')).toBe('baeckerei-sommer.de');
    expect(domainAusWebsite('kein link')).toBeUndefined();
  });
  it('nimmt die E-Mail-Domain nur bei Firmen und nie bei Freemail', () => {
    expect(kundenDomain({ art: 'firma', email: 'info@hv-nord.de' })).toBe('hv-nord.de');
    expect(kundenDomain({ art: 'firma', email: 'chef@gmx.de' })).toBeUndefined();
    expect(kundenDomain({ art: 'privat', email: 'petra@schulz-familie.de' })).toBeUndefined();
    expect(kundenDomain({ art: 'privat', website: 'schulz.de' })).toBe('schulz.de');
  });
  it('bildet Initialen ohne Rechtsform und Anrede', () => {
    expect(kundenInitialen('Bäckerei Sommer GmbH')).toBe('BS');
    expect(kundenInitialen('Familie Hoffmann')).toBe('H');
    expect(kundenInitialen('Petra Schulz')).toBe('PS');
    expect(kundenInitialen('')).toBe('?');
  });
  it('gibt jedem Kunden dieselbe Farbe', () => {
    expect(kundenFarbe('Petra Schulz')).toBe(kundenFarbe('Petra Schulz'));
  });
});
