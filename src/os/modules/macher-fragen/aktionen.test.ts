import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { zeitpunkt } from '@core/format';
import { fuehrePlanAus, pruefePlan, registriereGateway, registriereModell, type GatewayKontext, type Plan } from '@core/gateway';
import type { Recht } from '@core/session';
import { URLAUB_EINTRAGEN, URLAUB_ENTSCHEIDEN } from '@modules/abwesenheiten/gateway';
import { KALENDER_AKTIONEN } from '@modules/kalender/gateway';
import { KUNDEN_AKTIONEN } from '@modules/kunden/gateway';
import { MATERIAL_AKTIONEN } from '@modules/material-am-auftrag/gateway';
import { NACHRICHT_AKTIONEN } from '@modules/nachrichten/gateway';
import { RECHNUNG_AKTIONEN, RECHNUNG_SENDEN } from '@modules/rechnungen/gateway';
import { kundeAusText, neuesDatum, uhrAusText, urlaubAus } from './aktionen';
import { ABSICHTEN, AKTIONEN, beantworte, fragen, type Antwort } from './assistent';

const HEUTE = '2026-10-02'; // Freitag
const ALLE: Recht[] = ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'personal'];

const kontext = (rechte: Recht[] = ALLE, ich = db.mitarbeiter.all()[0]): GatewayKontext => ({
  heute: HEUTE,
  jetzt: new Date(`${HEUTE}T10:00:00`),
  ich,
  darf: (r) => rechte.includes(r),
});

const planAus = (a: Antwort): Plan => {
  const v = a.vorschlaege?.[0];
  if (v?.art !== 'plan') throw new Error(`kein Plan: ${a.absicht} – ${a.text}`);
  return v.plan;
};

let aus: (() => void)[] = [];
beforeEach(() => {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Elektro Macher', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: 'Hauptstr. 1', plz: '34117', ort: 'Kassel' }, telefon: '0561 1', email: 'info@macher.test', steuernummer: '12/345/67890', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  const chef = db.mitarbeiter.create({ vorname: 'Max', nachname: 'Macher', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  db.mitarbeiter.create({ vorname: 'Jonas', nachname: 'Becker', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const kunde = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], email: 'hoffmann@example.org', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } });
  const auftrag = db.auftraege.create({ nummer: 'A-2026-0007', titel: 'Bad Elektrik', art: 'projekt', phase: 'in_arbeit', kundeId: kunde.id });
  db.termine.create({ art: 'einsatz', titel: 'Steckdosen setzen', auftragId: auftrag.id, kundeId: kunde.id, start: zeitpunkt('2026-10-05', '08:00'), ende: zeitpunkt('2026-10-05', '12:00'), mitarbeiterIds: [chef.id], status: 'geplant' });
  db.artikel.create({ name: 'Mantelleitung NYM-J 3x1,5', einheit: 'm', ek: 50, vk: 120, aktiv: true, bestand: 100 } as never);
  aus = [
    registriereGateway({
      absichten: ABSICHTEN,
      aktionen: [...AKTIONEN, ...RECHNUNG_AKTIONEN, ...RECHNUNG_SENDEN, ...KALENDER_AKTIONEN, ...NACHRICHT_AKTIONEN, ...MATERIAL_AKTIONEN, ...URLAUB_EINTRAGEN, ...URLAUB_ENTSCHEIDEN, ...KUNDEN_AKTIONEN] as never[],
    }),
  ];
});
afterEach(() => aus.forEach((f) => f()));

describe('Alltagssprache', () => {
  it('liest Uhrzeit, neues Datum, Urlaub und Kundendaten', () => {
    expect(uhrAusText('auf Montag um 9 Uhr')).toBe('09:00');
    expect(uhrAusText('gegen 14:30 Uhr')).toBe('14:30');
    expect(neuesDatum('verschiebt sich um zwei Tage', '2026-10-05', HEUTE)).toBe('2026-10-07');
    expect(neuesDatum('auf Dienstag', '2026-10-05', HEUTE)).toBe('2026-10-06');
    expect(neuesDatum('auf den 12.10.', '2026-10-05', HEUTE)).toBe('2026-10-12');
    expect(urlaubAus('Urlaub vom 12.10. bis 16.10.', HEUTE)).toEqual({ von: '2026-10-12', bis: '2026-10-16' });
    expect(urlaubAus('nächste Woche Urlaub', HEUTE)).toEqual({ von: '2026-10-05', bis: '2026-10-09' });
    expect(kundeAusText('Leg einen neuen Kunden an: Bäckerei Schmidt GmbH, 0561 123456, info@schmidt.de')).toEqual({ name: 'Bäckerei Schmidt GmbH', telefon: '0561 123456', email: 'info@schmidt.de' });
  });
});

describe('Termin verschieben', () => {
  it('verschiebt und informiert den Kunden – erst nach Bestätigung', async () => {
    const plan = planAus(beantworte('Verschieb den Termin bei Familie Hoffmann auf Dienstag um 9 Uhr wegen Krankheit', kontext()));
    expect(plan.schritte.map((s) => s.aktion)).toEqual(['appointment.reschedule', 'message.send']);
    expect((plan.schritte[1].daten as { text: string }).text).toContain('wegen Krankheit');
    expect(pruefePlan(plan, kontext()).map((p) => p.risiko)).toEqual(['kritisch', 'kritisch']);
    expect(db.termine.all()[0].start).toBe(zeitpunkt('2026-10-05', '08:00'));
    const r = await fuehrePlanAus(plan, kontext(), { bestaetigt: true, auswahl: ['s1'] });
    expect(r[0].status).toBe('ausgefuehrt');
    expect(db.termine.all()[0].start).toBe(zeitpunkt('2026-10-06', '09:00'));
  });

  it('lässt Luna die Nachricht schreiben, wenn sie angeschlossen ist – mit minimalem Kontext', async () => {
    let gesehen: Record<string, unknown> | undefined;
    aus.push(registriereModell({ lane: 2, name: 'Luna', verfuegbar: () => true, schreibe: async (_t, k) => ((gesehen = k as Record<string, unknown>), 'Guten Tag, Ihr Termin verschiebt sich auf Dienstag.') }));
    const { antwort, modell } = await fragen('Die Baustelle Hoffmann verschiebt sich um zwei Tage', kontext());
    expect(modell).toBe('Luna');
    expect((planAus(antwort).schritte[1].daten as { text: string }).text).toBe('Guten Tag, Ihr Termin verschiebt sich auf Dienstag.');
    expect(Object.keys(gesehen ?? {}).sort()).toEqual(['aufgabe', 'betrieb', 'grund', 'kunde', 'termin']);
    expect(JSON.stringify(gesehen)).not.toContain('hoffmann@example.org');
  });

  it('bleibt bei der Vorlage, wenn Luna ausfällt', async () => {
    aus.push(registriereModell({ lane: 2, name: 'Luna', verfuegbar: () => true, schreibe: async () => Promise.reject(new Error('weg')) }));
    const { antwort, modell } = await fragen('Die Baustelle Hoffmann verschiebt sich um zwei Tage', kontext());
    expect(modell).toBe('Regeln');
    expect((planAus(antwort).schritte[1].daten as { text: string }).text).toMatch(/^Guten Tag Familie Hoffmann/);
  });
});

describe('Kunden schreiben, Rechnung senden', () => {
  it('„Schreib Hoffmann, dass wir gegen neun kommen“ → editierbarer Entwurf', () => {
    const plan = planAus(beantworte('Schreib Familie Hoffmann, dass wir morgen gegen neun kommen', kontext()));
    expect(plan.schritte[0]).toMatchObject({ aktion: 'message.send', textFeld: { feld: 'text' } });
    expect((plan.schritte[0].daten as { text: string }).text).toContain('Wir morgen gegen neun kommen');
  });

  it('Monteure dürfen Kunden nicht direkt schreiben', () => {
    expect(beantworte('Schreib Familie Hoffmann, dass wir später kommen', kontext(['lesen', 'schreiben'])).absicht).toBe('keine-berechtigung');
  });

  it('Rechnung senden prüft Pflichtangaben vorher', async () => {
    const plan = planAus(beantworte('Mach aus dem Auftrag von Hoffmann eine Rechnung', kontext()));
    await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    const senden = planAus(beantworte('Schick die Rechnung an Familie Hoffmann', kontext()));
    expect(senden.schritte[0].aktion).toBe('invoice.send');
    expect(pruefePlan(senden, kontext())[0]).toMatchObject({ erlaubt: false, risiko: 'kritisch' });
    expect(pruefePlan(senden, kontext())[0].grund).toMatch(/Position|Leistungs/);
  });
});

describe('Material, Urlaub, Kunde', () => {
  it('reserviert Material und achtet auf den freien Bestand', async () => {
    const plan = planAus(beantworte('Reservier 20 Meter Mantelleitung für Hoffmann', kontext()));
    expect(plan.schritte[0].daten).toMatchObject({ menge: 20 });
    await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    expect(db.material.all()[0]).toMatchObject({ status: 'bereit', menge: 20 });
    const zuViel = planAus(beantworte('Reservier 90 Meter Mantelleitung für Hoffmann', kontext()));
    expect(pruefePlan(zuViel, kontext())[0].grund).toContain('nur noch 80');
  });

  it('Urlaub: Monteur beantragt, Chef genehmigt', async () => {
    const jonas = db.mitarbeiter.all()[1];
    const antrag = planAus(beantworte('Ich brauche Urlaub vom 12.10. bis 16.10.', kontext(['lesen', 'schreiben'], jonas)));
    await fuehrePlanAus(antrag, kontext(['lesen', 'schreiben'], jonas), { bestaetigt: true });
    expect(db.abwesenheiten.all()[0]).toMatchObject({ mitarbeiterId: jonas.id, status: 'beantragt', von: '2026-10-12', bis: '2026-10-16' });
    const ok = planAus(beantworte('Genehmige den Urlaub von Jonas', kontext()));
    await fuehrePlanAus(ok, kontext(), { bestaetigt: true });
    expect(db.abwesenheiten.all()[0].status).toBe('genehmigt');
  });

  it('legt Kunden an und warnt vor Dubletten', async () => {
    const plan = planAus(beantworte('Leg einen neuen Kunden an: Bäckerei Schmidt GmbH, 0561 123456', kontext()));
    await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    expect(db.kunden.all().find((k) => k.name === 'Bäckerei Schmidt GmbH')).toMatchObject({ art: 'firma', telefon: '0561 123456' });
    const doppelt = planAus(beantworte('Leg einen neuen Kunden an: Familie Hoffmann', kontext()));
    expect(pruefePlan(doppelt, kontext())[0].grund).toContain('vielleicht schon');
  });
});
