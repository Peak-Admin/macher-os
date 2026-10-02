import { describe, expect, it } from 'vitest';
import type { Abwesenheit, Auftrag, Erledigung, Kunde, Materialbuchung, Mitarbeiter, Ort, Rechnung, Termin, Zahlung, Zeiteintrag } from '../../core/objects';
import { deinTag, entscheidungenAusBestand, leererBestand, letzterWerktag, offenePosten, tagesbrief, wochenbilanz, zeitenHeute, type Entscheidung } from './inhalt';
import { uhrVon } from './zeit';
import { emailAus, nachrichtAus } from './zustellung';

const B = { erstelltAm: '2026-09-01T08:00:00Z', geaendertAm: '2026-09-01T08:00:00Z' };
const ma = (id: string, rolle: Mitarbeiter['rolle']): Mitarbeiter => ({ ...B, id, vorname: id, nachname: 'T', rolle, wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
const jonas = ma('jonas', 'monteur');
const chefin = ma('chefin', 'chef');
const kunde: Kunde = { ...B, id: 'k1', art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], telefon: '0171 1' };
const ort: Ort = { ...B, id: 'o1', kundeId: 'k1', bezeichnung: 'Haus', art: 'haus', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' }, hinweise: 'Hund im Garten.', ansprechpartnerVorOrt: 'Herr Albers', telefonVorOrt: '0175 2' };
const auftrag: Auftrag = { ...B, id: 'a1', nummer: 'A-1', titel: 'Wartung Heizung', art: 'wartung', phase: 'beauftragt', kundeId: 'k1', ortId: 'o1' };
// 2.10.2026 (Freitag), Sommerzeit: 07:30 Uhr deutscher Zeit = 05:30 UTC
const termin = (id: string, start: string, ende: string, x: Partial<Termin> = {}): Termin => ({ ...B, id, art: 'einsatz', titel: 'Wartung', start, ende, auftragId: 'a1', kundeId: 'k1', ortId: 'o1', mitarbeiterIds: ['jonas'], status: 'geplant', ...x });
const material: Materialbuchung = { ...B, id: 'm1', auftragId: 'a1', text: 'Dichtung', menge: 2, einheit: 'Stk', ek: 100, status: 'bereit' };
const rechnung = (id: string, x: Partial<Rechnung>): Rechnung => ({ ...B, id, nummer: `R-${id}`, art: 'rechnung', kundeId: 'k1', titel: 'x', positionen: [{ id: 'p', art: 'pauschal', text: 'Arbeit', menge: 1, einheit: 'Psch', einzelpreis: 100_00 }], status: 'versendet', datum: '2026-09-01', faelligAm: '2026-09-15', mahnstufe: 0, ...x });

const FREITAG_0630 = uhrVon('2026-10-02T04:30:00Z');

describe('Dein Tag (Monteur)', () => {
  const b = leererBestand({ mitarbeiter: [jonas], kunden: [kunde], orte: [ort], auftraege: [auftrag], material: [material, { ...material, id: 'm2', status: 'verbraucht' }], termine: [termin('t2', '2026-10-02T11:00:00Z', '2026-10-02T12:00:00Z'), termin('t1', '2026-10-02T05:30:00Z', '2026-10-02T07:00:00Z', { notiz: 'Schlüssel beim Nachbarn' }), termin('t3', '2026-10-02T05:30:00Z', '2026-10-02T07:00:00Z', { mitarbeiterIds: ['chefin'] })], aufgaben: [{ ...B, id: 'au1', titel: 'Leiter mitnehmen', zustaendigId: 'jonas', erledigt: false, prioritaet: 'normal' }] });

  it('zeigt ersten Einsatz mit Adresse, Material und Hinweisen', () => {
    const i = deinTag(b, jonas, FREITAG_0630);
    expect(i.anzahl).toBe(2);
    expect(i.erster).toMatchObject({ terminId: 't1', zeit: '07:30–09:00', kunde: 'Familie Hoffmann', adresse: 'Lindenweg 12, 34117 Kassel', vorOrt: 'Herr Albers', telefon: '0175 2' });
    expect(i.material).toEqual([{ text: 'Dichtung', menge: 2, einheit: 'Stk', status: 'bereit', auftrag: undefined }]);
    expect(i.hinweise).toEqual(['Zugang: Hund im Garten.', 'Schlüssel beim Nachbarn', 'Aufgabe: Leiter mitnehmen']);
    const n = nachrichtAus(i, 'jonas');
    expect(n).toMatchObject({ titel: 'Dein Tag: 2 Termine', pfad: '/macher/takte/dein-tag', leer: false });
    expect(n.text).toBe('Los geht\'s 07:30 mit „Wartung“ – Familie Hoffmann, Lindenweg 12, 34117 Kassel. Material: 1 Position.');
  });

  it('ohne Einsatz: nichts aufs Handy; Urlaub wird genannt', () => {
    const urlaub: Abwesenheit = { ...B, id: 'u', mitarbeiterId: 'jonas', art: 'urlaub', von: '2026-10-01', bis: '2026-10-05', status: 'genehmigt' };
    const i = deinTag(leererBestand({ abwesenheiten: [urlaub] }), jonas, FREITAG_0630);
    expect(i.abwesend).toBe('Urlaub');
    expect(nachrichtAus(i, 'jonas').leer).toBe(true);
  });
});

describe('Tagesbrief (Chef/Büro)', () => {
  const e = (n: number, gewicht: number): Entscheidung => ({ schluessel: `e${n}`, titel: `Entscheidung ${n}`, art: 'entscheidung', gewicht, aktionen: [{ aktion: 'x.tun', label: 'Tun', primaer: true, payload: { n } }, { aktion: 'x.lassen', label: 'Lassen' }, { aktion: 'x.drei', label: 'Drei' }] });
  const zahlungen: Zahlung[] = [
    { ...B, id: 'z1', rechnungId: 'r1', betrag: 50_00, datum: '2026-10-01', art: 'ueberweisung' },
    { ...B, id: 'z2', rechnungId: 'r9', betrag: 80_00, datum: '2026-10-02', art: 'ueberweisung' },
  ];
  const b = leererBestand({ kunden: [kunde], rechnungen: [rechnung('r1', {}), rechnung('r2', { faelligAm: '2026-10-10' }), rechnung('r3', { status: 'bezahlt' })], zahlungen });
  const sieben = uhrVon('2026-10-02T05:00:00Z');

  it('höchstens 3 Entscheidungen, wichtigste zuerst, und Geld', () => {
    const i = tagesbrief(b, sieben, [e(1, 10), e(2, 90), e(3, 50), e(4, 70)], { geld: true });
    expect(i.entscheidungen.map((x) => x.schluessel)).toEqual(['e2', 'e4', 'e3']);
    expect(i.weitere).toBe(1);
    // r1: 119 € brutto − 50 € gezahlt = 69 € offen, überfällig; r2 noch nicht fällig
    expect(i.geld).toMatchObject({ seitText: 'gestern', eingaenge: { summe: 50_00, anzahl: 1 }, ueberfaellig: { summe: 69_00, anzahl: 1 } });
    const n = nachrichtAus(i, 'chefin');
    expect(n.titel).toBe('Tagesbrief: 4 Entscheidungen');
    expect(n.aktionen).toEqual([{ aktion: 'x.tun', label: 'Tun', payload: { n: 2 } }, { aktion: 'x.lassen', label: 'Lassen', payload: undefined }]);
    expect(n.text.replace(/\s/g, ' ')).toContain('Überfällig: 69,00 €');
  });

  it('montags zählen die Eingänge seit Freitag', () => {
    expect(letzterWerktag('2026-10-05', 1)).toBe('2026-10-02');
    const i = tagesbrief(b, uhrVon('2026-10-05T05:00:00Z'), [], { geld: true });
    expect(i.geld?.seitText).toBe('seit Freitag');
    expect(i.geld?.eingaenge.anzahl).toBe(1);
  });

  it('ohne Geld-Recht kein Geld; ohne Entscheidungen „Nichts brennt.“', () => {
    const i = tagesbrief(b, sieben, [], { geld: false });
    expect(i.geld).toBeUndefined();
    expect(nachrichtAus(i, 'x')).toMatchObject({ titel: 'Tagesbrief: Nichts brennt', text: 'Nichts brennt.', aktionen: [] });
  });

  it('Server: Entscheidungen aus gespeicherten Hinweisen, Urlaubsanträgen und alten Rechnungen', () => {
    const antrag: Abwesenheit = { ...B, id: 'ab1', mitarbeiterId: 'jonas', art: 'urlaub', von: '2026-10-12', bis: '2026-10-16', status: 'beantragt' };
    const liste = entscheidungenAusBestand(
      { ...b, mitarbeiter: [jonas, chefin], abwesenheiten: [antrag], hinweise: [{ id: 'h1', status: 'offen', art: 'freigabe', titel: 'Bestellung freigeben', gewicht: 40, aktionen: [{ id: 'bestellung.oeffnen', label: 'Öffnen' }] }, { id: 'h2', status: 'erledigt', art: 'info', titel: 'alt', gewicht: 1 }, { id: 'h3', status: 'offen', art: 'info', titel: 'Monteur', gewicht: 1, fuerRollen: ['monteur'] }] },
      chefin,
      sieben,
      { geld: true, personal: true },
    );
    expect(liste.map((x) => x.titel)).toEqual(['Bestellung freigeben', 'Urlaub beantragt: jonas T', 'Überfällig: R-r1 · Familie Hoffmann']);
    expect(liste[1].aktionen[0]).toEqual({ aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', primaer: true, payload: { id: 'ab1' } });
  });
});

describe('Zeiten bestätigen (Monteur)', () => {
  const z = (id: string, start: string, ende: string | undefined, x: Partial<Zeiteintrag> = {}): Zeiteintrag => ({ ...B, id, mitarbeiterId: 'jonas', datum: '2026-10-02', start, ende, pauseMinuten: 0, art: 'arbeit', auftragId: 'a1', terminId: 't1', ...x });
  const halbfuenf = uhrVon('2026-10-02T14:30:00Z');

  it('fasst die Zeiten des Tages zusammen und bietet einen Tipp zum Bestätigen', () => {
    const b = leererBestand({ auftraege: [auftrag], termine: [termin('t1', '2026-10-02T05:30:00Z', '2026-10-02T07:00:00Z')], zeiten: [z('z1', '07:30', '12:00', { pauseMinuten: 30 }), z('z2', '12:30', undefined), z('z3', '08:00', '09:00', { mitarbeiterId: 'x' })] });
    const i = zeitenHeute(b, jonas, halbfuenf);
    expect(i.minuten).toBe(240);
    expect(i.laeuft).toMatchObject({ id: 'z2', start: '12:30' });
    expect(i.termineOhneZeit).toEqual([]);
    const n = nachrichtAus(i, 'jonas');
    expect(n).toMatchObject({ titel: 'Zeiten von heute bestätigen?', text: '1 Eintrag · 4 Std. · läuft noch seit 12:30', leer: false });
    expect(n.aktionen).toEqual([{ aktion: 'takte.zeiten-bestaetigen', label: 'Bestätigen', payload: { mitarbeiterId: 'jonas', datum: '2026-10-02' } }]);
  });

  it('fehlt die Zeit zu einem Einsatz, geht es ums Nachtragen; bestätigt oder leer → nichts', () => {
    const b = leererBestand({ termine: [termin('t1', '2026-10-02T05:30:00Z', '2026-10-02T07:00:00Z')] });
    const n = nachrichtAus(zeitenHeute(b, jonas, halbfuenf), 'jonas');
    expect(n.aktionen[0].aktion).toBe('zeiten.nachtragen');
    expect(nachrichtAus(zeitenHeute(leererBestand(), jonas, halbfuenf), 'jonas').leer).toBe(true);
    expect(nachrichtAus(zeitenHeute(leererBestand({ zeiten: [z('z1', '07:30', '12:00')] }), jonas, halbfuenf, true), 'jonas').leer).toBe(true);
  });
});

describe('Wochenbilanz (Chef)', () => {
  it('Umsatz, offene Posten, Aufträge und Erledigt der Woche – Zeit als Schätzung', () => {
    const erl = (id: string, am: string, minuten?: number): Erledigung => ({ ...B, id, erstelltAm: am, titel: id, regel: 'r', minutenGespart: minuten });
    const b = leererBestand({
      kunden: [kunde],
      rechnungen: [rechnung('r1', { datum: '2026-09-29' }), rechnung('r2', { datum: '2026-09-25' }), rechnung('r3', { datum: '2026-10-01', status: 'entwurf' })],
      auftraege: [auftrag, { ...auftrag, id: 'a2', phase: 'erledigt', abgeschlossenAm: '2026-10-01T10:00:00Z', erstelltAm: '2026-09-30T08:00:00Z' }, { ...auftrag, id: 'a3', phase: 'verloren' }],
      erledigungen: [erl('e1', '2026-09-28T06:00:00Z', 5), erl('e2', '2026-10-02T09:00:00Z'), erl('e3', '2026-09-26T09:00:00Z', 10), erl('e4', '2026-10-01T09:00:00Z', 7)],
    });
    const i = wochenbilanz(b, uhrVon('2026-10-02T13:00:00Z'), { rueckgaengig: new Set(['e4']) });
    expect(i).toMatchObject({ von: '2026-09-28', bis: '2026-10-02', umsatz: { netto: 100_00, anzahl: 1 }, auftraege: { neu: 1, abgeschlossen: 1, laufend: 1 }, erledigt: { anzahl: 2, minuten: 5 } });
    expect(i.offen).toMatchObject({ summe: 238_00, anzahl: 2, anzahlUeberfaellig: 2 });
    const n = nachrichtAus(i, 'chefin');
    expect(n.text.replace(/\s/g, ' ')).toBe('Umsatz 100,00 € netto · offen 238,00 € · 1 Auftrag fertig · Macher hat 2 erledigt');
    const mail = emailAus(n, 'wochenbilanz', 'https://app.example/');
    expect(mail.text).toContain('Öffnen: https://app.example/macher/takte/wochenbilanz');
    expect(mail.text).toContain('Abbestellen');
  });

  it('offene Posten berücksichtigen Teilzahlungen und Gutschriften nicht', () => {
    const b = leererBestand({ rechnungen: [rechnung('r1', {}), rechnung('g', { art: 'gutschrift' })], zahlungen: [{ ...B, id: 'z', rechnungId: 'r1', betrag: 119_00, datum: '2026-09-20', art: 'bar' }] });
    expect(offenePosten(b, '2026-10-02')).toEqual([]);
  });
});
