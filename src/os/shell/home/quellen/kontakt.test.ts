import { describe, expect, it } from 'vitest';
import { BEISPIEL_ANSPRECHPARTNER } from './beispiel-inhalte';
import { kontaktWege } from './kontakt';

describe('Kontaktwege des Ansprechpartners', () => {
  it('zeigt nur, was als Daten da ist – das Beispiel hat keine Nummer, also kein Anrufen und kein WhatsApp', () => {
    const w = kontaktWege(BEISPIEL_ANSPRECHPARTNER);
    expect(w.anrufen).toBeUndefined();
    expect(w.schreiben.map((x) => x.art)).toEqual(['nachricht']);
    expect(w.termin?.href).toBe('/demo');
  });

  it('Anrufen primär, WhatsApp vor Nachricht, Termin extra', () => {
    const w = kontaktWege({ telefon: '0561 123 456', whatsapp: '0171 2345678', messageUrl: '/kontakt', bookingUrl: '/demo' });
    expect(w.anrufen).toMatchObject({ href: 'tel:0561123456', nummer: '0561 123 456' });
    expect(w.schreiben.map((x) => x.art)).toEqual(['whatsapp', 'nachricht']);
    expect(w.schreiben[0].href).toBe('https://wa.me/491712345678');
  });

  it('ohne Daten keine Wege', () => {
    expect(kontaktWege({})).toEqual({ anrufen: undefined, schreiben: [], termin: undefined });
    expect(kontaktWege({ telefon: '  ' }).anrufen).toBeUndefined();
  });
});
