import { describe, expect, test } from 'vitest';
import { anfragePlanen, betriebSlug, betreffBereinigt, emailAus, kundeFinden, mailLesen, naechsteAuftragsnummer, postfachAdresse, slugAusAdresse, telefonAusText } from './postfach';

describe('Anfrage-Postfach: Adresse', () => {
  test('Slug aus dem Betriebsnamen – Umlaute, Rechtsform weg', () => {
    expect(betriebSlug('Müller Elektro GmbH & Co. KG')).toBe('mueller-elektro');
    expect(betriebSlug('Schröder & Söhne Haustechnik')).toBe('schroeder-soehne-haustechnik');
    expect(betriebSlug('')).toBe('betrieb');
    expect(postfachAdresse('Elektro Weiß')).toBe('anfragen@elektro-weiss.macher-os.de');
  });
  test('Slug aus der Empfängeradresse', () => {
    expect(slugAusAdresse('Anfragen <anfragen@mueller-elektro.macher-os.de>')).toBe('mueller-elektro');
    expect(slugAusAdresse('anfragen+web@mueller-elektro.macher-os.de')).toBe('mueller-elektro');
    expect(slugAusAdresse('info@mueller-elektro.de')).toBeUndefined();
  });
  test('E-Mail, Telefon und Betreff aus Rohtext', () => {
    expect(emailAus('"Petra Schulz" <Petra@Example.de>')).toBe('petra@example.de');
    expect(telefonAusText('Viele Grüße\nPetra Schulz\nTel. 0171 / 234 56 78')).toBe('0171 / 234 56 78');
    expect(betreffBereinigt('AW: Re: Steckdose im Bad')).toBe('Steckdose im Bad');
  });
});

describe('Anfrage-Postfach: Webhook-Formate', () => {
  test('Postmark Inbound', () => {
    const m = mailLesen({
      FromFull: { Email: 'petra@example.de', Name: 'Petra Schulz' },
      ToFull: [{ Email: 'anfragen@mueller-elektro.macher-os.de' }],
      Subject: 'Steckdose im Bad',
      TextBody: 'Hallo, die Steckdose im Bad geht nicht.',
      MessageID: 'pm-1',
    });
    expect(m).toMatchObject({ vonEmail: 'petra@example.de', vonName: 'Petra Schulz', betreff: 'Steckdose im Bad', nachrichtId: 'pm-1' });
    expect(m?.an).toContain('anfragen@mueller-elektro.macher-os.de');
  });
  test('Resend Inbound (type + data) mit HTML', () => {
    const m = mailLesen({ type: 'email.received', data: { from: 'Jan Becker <jan@firma.de>', to: ['anfragen@mueller-elektro.macher-os.de'], subject: 'Wallbox', html: '<p>Wir brauchen eine Wallbox.</p>', email_id: 'rs-1' } });
    expect(m).toMatchObject({ vonEmail: 'jan@firma.de', vonName: 'Jan Becker', text: 'Wir brauchen eine Wallbox.', nachrichtId: 'rs-1' });
  });
  test('Unbrauchbares wird abgelehnt', () => {
    expect(mailLesen(null)).toBeUndefined();
    expect(mailLesen({ foo: 1 })).toBeUndefined();
  });
});

describe('Anfrage-Postfach: Kunde, Anfrage, Dubletten', () => {
  const ids = () => {
    let n = 0;
    return () => `id-${++n}`;
  };
  const jetzt = new Date('2026-10-02T09:00:00Z');
  const mail = { vonEmail: 'petra@example.de', vonName: 'Petra Schulz', an: [], betreff: 'Steckdose im Bad', text: 'Geht nicht mehr.' };

  test('neuer Kunde → Kunde + Anfrage + Nachricht, Nummer fortlaufend', () => {
    const p = anfragePlanen(mail, { kunden: [], auftraege: [{ id: 'x', nummer: '2610-007' }] }, { id: ids(), jetzt });
    expect(p.kunde.neu).toBe(true);
    expect(p.kunde.daten).toMatchObject({ name: 'Petra Schulz', email: 'petra@example.de', quelle: 'email' });
    expect(p.auftrag?.daten).toMatchObject({ nummer: '2610-008', phase: 'anfrage', quelle: 'email', titel: 'Steckdose im Bad', kundeId: p.kunde.id });
    expect(p.nachricht.daten).toMatchObject({ kanal: 'email', richtung: 'ein', gelesen: false, auftragId: p.auftrag?.id });
  });

  test('bekannter Kunde wird erkannt (auch über Ansprechpartner oder Telefon in der Signatur)', () => {
    expect(kundeFinden([{ id: 'k1', email: 'Petra@example.de' }], mail)?.id).toBe('k1');
    expect(kundeFinden([{ id: 'k2', ansprechpartner: [{ email: 'petra@example.de' }] }], mail)?.id).toBe('k2');
    expect(kundeFinden([{ id: 'k3', telefon: '+49 171 2345678' }], { text: 'Gruß, Tel 0171 2345678' })?.id).toBe('k3');
    expect(kundeFinden([{ id: 'k4', email: 'petra@example.de', geloeschtAm: '2026-01-01' }], mail)).toBeUndefined();
  });

  test('Antwort auf offene Anfrage desselben Kunden → keine zweite Anfrage, nur Nachricht', () => {
    const p = anfragePlanen(
      { ...mail, betreff: 'AW: Steckdose im Bad' },
      { kunden: [{ id: 'k1', email: 'petra@example.de' }], auftraege: [{ id: 'a1', kundeId: 'k1', phase: 'anfrage', titel: 'Steckdose im Bad', erstelltAm: '2026-09-30T08:00:00Z' }] },
      { id: ids(), jetzt },
    );
    expect(p.kunde).toEqual({ neu: false, id: 'k1' });
    expect(p.auftrag).toBeUndefined();
    expect(p.angehaengtAn).toBe('a1');
    expect(p.nachricht.daten.auftragId).toBe('a1');
  });

  test('anderes Thema beim selben Kunden → neue Anfrage', () => {
    const p = anfragePlanen({ ...mail, betreff: 'Wallbox' }, { kunden: [{ id: 'k1', email: 'petra@example.de' }], auftraege: [{ id: 'a1', kundeId: 'k1', phase: 'anfrage', titel: 'Steckdose im Bad', erstelltAm: '2026-09-30T08:00:00Z' }] }, { id: ids(), jetzt });
    expect(p.auftrag).toBeDefined();
  });

  test('Projektnummer je Monat', () => {
    expect(naechsteAuftragsnummer(['A-2025-0099', '2609-004', undefined], new Date(2026, 9, 2))).toBe('2610-001');
    expect(naechsteAuftragsnummer(['2610-004'], new Date(2026, 9, 30))).toBe('2610-005');
  });
});
