import { describe, expect, it } from 'vitest';
import type { Auftrag, Nachricht } from '@core/objects';
import { istUngelesen, nachrichtenHinweise, nummerInternational, passenderAuftrag, threads, verfuegbareKanaele, versandLink } from './daten';

let n = 0;
const msg = (x: Partial<Nachricht>): Nachricht => {
  n++;
  const t = `2026-05-01T0${n % 10}:00:00.000Z`;
  return { id: `n${n}`, kanal: 'email', richtung: 'ein', text: 'Hallo', gelesen: false, erstelltAm: t, geaendertAm: t, ...x };
};

describe('Nachrichten', () => {
  it('bündelt nach Auftrag, sonst Kunde, sonst intern', () => {
    const t = threads([msg({ auftragId: 'a1', kundeId: 'k1' }), msg({ auftragId: 'a1', richtung: 'aus', gelesen: true }), msg({ kundeId: 'k2' }), msg({ kanal: 'intern', richtung: 'intern', vonMitarbeiterId: 'm1' })], 'm2');
    expect(t.map((x) => x.schluessel).sort()).toEqual(['a:a1', 'intern', 'k:k2']);
    const a1 = t.find((x) => x.schluessel === 'a:a1')!;
    expect(a1.nachrichten).toHaveLength(2);
    expect(a1.ungelesenKunde).toBe(1);
    expect(t.find((x) => x.schluessel === 'intern')!.ungelesen).toBe(1);
  });

  it('eigene interne Nachrichten sind nie ungelesen', () => {
    expect(istUngelesen(msg({ kanal: 'intern', richtung: 'intern', vonMitarbeiterId: 'm1' }), 'm1')).toBe(false);
    expect(istUngelesen(msg({ richtung: 'aus' }))).toBe(false);
  });

  it('baut Links für E-Mail, SMS und WhatsApp', () => {
    const k = { email: 'a@b.de', telefon: '0171 234 56-78' };
    expect(nummerInternational('0171 2345678')).toBe('491712345678');
    expect(nummerInternational('+43 660 123')).toBe('43660123');
    expect(nummerInternational('0049 171 1')).toBe('491711');
    expect(versandLink('email', k, 'Hallo du', 'Betreff')).toBe('mailto:a@b.de?subject=Betreff&body=Hallo%20du');
    expect(versandLink('sms', k, 'Hi')).toBe('sms:+4917123456' + '78?body=Hi');
    expect(versandLink('whatsapp', k, 'Hi')).toBe('https://wa.me/491712345678?text=Hi');
    expect(versandLink('email', { telefon: '1' }, 'x')).toBeUndefined();
    expect(verfuegbareKanaele({ email: 'a@b.de' })).toEqual(['email']);
    expect(verfuegbareKanaele({ telefon: '0171' })).toEqual(['whatsapp', 'sms']);
  });

  it('meldet Kunden, die auf Antwort warten – nach 4 Stunden dringender', () => {
    const m = msg({ kundeId: 'k1', erstelltAm: '2026-05-01T08:00:00.000Z' });
    const h1 = nachrichtenHinweise([m], [], [{ id: 'k1', name: 'Petra' } as never], new Date('2026-05-01T09:00:00.000Z'));
    expect(h1[0].titel).toBe('Petra wartet auf Antwort');
    expect(h1[0].gewicht).toBe(56);
    const h2 = nachrichtenHinweise([m], [], [], new Date('2026-05-01T13:00:00.000Z'));
    expect(h2[0].gewicht).toBe(68);
    expect(nachrichtenHinweise([{ ...m, gelesen: true }], [], [], new Date())).toHaveLength(0);
    expect(nachrichtenHinweise([msg({ kanal: 'intern', richtung: 'intern' })], [], [], new Date())).toHaveLength(0);
  });

  it('ordnet Kundennachrichten nur bei genau einem offenen Auftrag zu', () => {
    const a = (id: string, phase: Auftrag['phase'] = 'in_arbeit') => ({ id, kundeId: 'k1', phase }) as Auftrag;
    expect(passenderAuftrag({ kundeId: 'k1', richtung: 'ein' }, [a('a1'), a('a2', 'erledigt')])).toBe('a1');
    expect(passenderAuftrag({ kundeId: 'k1', richtung: 'ein' }, [a('a1'), a('a2')])).toBeUndefined();
    expect(passenderAuftrag({ kundeId: 'k1', richtung: 'aus' }, [a('a1')])).toBeUndefined();
  });
});
