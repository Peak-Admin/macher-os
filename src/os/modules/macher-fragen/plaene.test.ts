import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import { zeitpunkt } from '@core/format';
import { fuehreAus, fuehrePlanAus, kiProtokoll, pruefePlan, registriereGateway, type GatewayKontext } from '@core/gateway';
import type { Recht } from '@core/session';
import { ANGEBOT_AKTIONEN } from '@modules/angebote/gateway';
import { ZEIT_AKTIONEN } from '@modules/arbeitszeiten/gateway';
import { AUFTRAG_AKTIONEN } from '@modules/auftraege/gateway';
import { BEWERTUNG_AKTIONEN } from '@modules/bewertungen/gateway';
import { LINK_KEY } from '@modules/bewertungen/daten';
import { PLAN_AKTIONEN } from '@modules/einsatzplanung/gateway';
import { RECHNUNG_AKTIONEN } from '@modules/rechnungen/gateway';
import { ABSICHTEN, AKTIONEN, beantworte, dauerAus, fragen, type Vorschlag } from './assistent';

const HEUTE = '2026-10-02';
const ALLE: Recht[] = ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'personal'];

function basis() {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  const chef = db.mitarbeiter.create({ vorname: 'Max', nachname: 'Macher', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const kunde = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], email: 'hoffmann@example.org', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' } });
  const auftrag = db.auftraege.create({ nummer: 'A-2026-0007', titel: 'Bad Elektrik', art: 'projekt', phase: 'in_arbeit', kundeId: kunde.id });
  return { chef, kunde, auftrag };
}

const kontext = (rechte: Recht[] = ALLE): GatewayKontext => ({
  heute: HEUTE,
  jetzt: new Date(`${HEUTE}T10:00:00`),
  ich: db.mitarbeiter.all()[0],
  darf: (r) => rechte.includes(r),
});

const planAus = (v: Vorschlag | undefined) => {
  if (v?.art !== 'plan') throw new Error('kein Plan');
  return v.plan;
};

let aus: () => void;
beforeEach(() => {
  basis();
  aus = registriereGateway({ absichten: ABSICHTEN, aktionen: [...AKTIONEN, ...ANGEBOT_AKTIONEN, ...ZEIT_AKTIONEN, ...AUFTRAG_AKTIONEN, ...BEWERTUNG_AKTIONEN, ...PLAN_AKTIONEN, ...RECHNUNG_AKTIONEN] as never[] });
});
afterEach(() => aus());

describe('Dauer aus Alltagssprache', () => {
  it('versteht Stunden und Minuten', () => {
    expect(dauerAus('zwei Stunden Nacharbeit')).toBe(120);
    expect(dauerAus('1,5 Std. auf Hoffmann')).toBe(90);
    expect(dauerAus('eine halbe Stunde')).toBe(30);
    expect(dauerAus('45 Minuten Fahrt')).toBe(45);
    expect(dauerAus('Was steht morgen an?')).toBeUndefined();
  });
});

describe('„Der Auftrag ist fertig“ – Mehrschritt-Plan', () => {
  it('bereitet die verbundenen Schritte vor und ändert noch nichts', () => {
    const a = beantworte('Der Auftrag von Familie Hoffmann ist fertig', kontext());
    expect(a.absicht).toBe('auftrag-fertig');
    const plan = planAus(a.vorschlaege?.[0]);
    expect(plan.schritte.map((s) => s.aktion)).toEqual(['job.complete', 'invoice.create_draft', 'job.release_plan', 'review.request']);
    expect(db.auftraege.all()[0].phase).toBe('in_arbeit');
    expect(db.rechnungen.all()).toHaveLength(0);
  });

  it('zeigt, was nicht geht, und warum', () => {
    const plan = planAus(beantworte('Der Auftrag von Familie Hoffmann ist fertig', kontext()).vorschlaege?.[0]);
    const p = pruefePlan(plan, kontext());
    expect(p.find((x) => x.id === 's1')).toMatchObject({ erlaubt: true, risiko: 'schreiben' });
    expect(p.find((x) => x.id === 's3')).toMatchObject({ erlaubt: false, grund: expect.stringContaining('keine weiteren Einsätze') });
    expect(p.find((x) => x.id === 's4')).toMatchObject({ erlaubt: false, risiko: 'kritisch', grund: expect.stringContaining('Bewertungslink') });
  });

  it('lässt die Rechnung weg, wenn du kein Geld siehst', () => {
    const plan = planAus(beantworte('Der Auftrag von Familie Hoffmann ist fertig', kontext(['lesen', 'schreiben'])).vorschlaege?.[0]);
    expect(plan.schritte.map((s) => s.aktion)).not.toContain('invoice.create_draft');
  });

  it('führt die ausgewählten Schritte nach einer Bestätigung aus und protokolliert jeden einzeln', async () => {
    setzeEinstellung(LINK_KEY, 'https://g.page/r/test');
    const { auftrag } = { auftrag: db.auftraege.all()[0] };
    db.termine.create({ art: 'einsatz', titel: 'Rest', auftragId: auftrag.id, kundeId: auftrag.kundeId, start: zeitpunkt('2026-10-05', '08:00'), ende: zeitpunkt('2026-10-05', '12:00'), mitarbeiterIds: [], status: 'geplant' });
    const plan = planAus(beantworte('Der Auftrag von Familie Hoffmann ist fertig', kontext()).vorschlaege?.[0]);

    // ohne Bestätigung passiert bei schreibenden/kritischen Schritten nichts
    const ohne = await fuehrePlanAus(plan, kontext());
    expect(ohne.every((x) => x.status === 'fehler')).toBe(true);
    expect(db.auftraege.get(auftrag.id)?.phase).toBe('in_arbeit');

    const r = await fuehrePlanAus(plan, kontext(), { bestaetigt: true, auswahl: ['s1', 's2', 's3', 's4'] });
    expect(r.map((x) => x.status)).toEqual(['ausgefuehrt', 'ausgefuehrt', 'ausgefuehrt', 'ausgefuehrt']);
    expect(db.auftraege.get(auftrag.id)?.phase).toBe('abnahme');
    expect(db.rechnungen.where((x) => x.auftragId === auftrag.id && x.status === 'entwurf')).toHaveLength(1);
    expect(db.termine.all()[0].status).toBe('abgesagt');
    expect(db.nachrichten.where((n) => n.auftragId === auftrag.id && n.richtung === 'aus')).toHaveLength(1);
    expect(kiProtokoll.where((p) => p.ergebnis === 'ausgefuehrt' && p.plan === plan.titel)).toHaveLength(4);
  });

  it('überspringt abgewählte Schritte', async () => {
    const plan = planAus(beantworte('Der Auftrag von Familie Hoffmann ist fertig', kontext()).vorschlaege?.[0]);
    const r = await fuehrePlanAus(plan, kontext(), { bestaetigt: true, auswahl: ['s1'] });
    expect(r.map((x) => x.status)).toEqual(['ausgefuehrt', 'uebersprungen', 'uebersprungen', 'uebersprungen']);
    expect(db.rechnungen.all()).toHaveLength(0);
  });

  it('fragt nach, wenn der Auftrag unklar ist', () => {
    expect(beantworte('Der Auftrag ist fertig', kontext()).absicht).toBe('auftrag-unklar');
  });
});

describe('Einzelne Aktionen aus Sätzen', () => {
  it('„Schreib bei Hoffmann noch zwei Stunden Nacharbeit auf das Projekt“', async () => {
    const { antwort } = await fragen('Schreib bei Hoffmann noch zwei Stunden Nacharbeit auf das Projekt', kontext());
    const plan = planAus(antwort.vorschlaege?.[0]);
    expect(plan.schritte[0]).toMatchObject({ aktion: 'time.track', daten: { minuten: 120, notiz: 'Nacharbeit', datum: HEUTE } });
    await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    expect(db.zeiten.all()[0]).toMatchObject({ start: '07:00', ende: '09:00', notiz: 'Nacharbeit', auftragId: db.auftraege.all()[0].id, art: 'arbeit' });
  });

  it('„Mach aus dem Auftrag von Hoffmann eine Rechnung“ legt nur einen Entwurf an', async () => {
    const plan = planAus(beantworte('Mach aus dem Auftrag von Hoffmann schon mal eine Rechnung', kontext()).vorschlaege?.[0]);
    const r = await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    expect(r[0].status).toBe('ausgefuehrt');
    expect(db.rechnungen.all()[0].status).toBe('entwurf');
  });

  it('Angebot senden ist kritisch und braucht das Senderecht', async () => {
    expect(beantworte('Schick das Angebot an Familie Hoffmann', kontext(['lesen', 'schreiben'])).absicht).toBe('keine-berechtigung');
    const k = db.kunden.all()[0];
    db.angebote.create({ nummer: 'AN-2026-0001', auftragId: db.auftraege.all()[0].id, kundeId: k.id, titel: 'Bad', positionen: [], status: 'entwurf', datum: HEUTE, gueltigBis: '2026-11-01', version: 1 });
    const plan = planAus(beantworte('Schick das Angebot an Familie Hoffmann', kontext()).vorschlaege?.[0]);
    expect(pruefePlan(plan, kontext())[0]).toMatchObject({ risiko: 'kritisch', erlaubt: false, grund: expect.stringContaining('keine Positionen') });
    expect(await fuehreAus({ aktion: 'offer.send', daten: plan.schritte[0].daten }, kontext())).toMatchObject({ ok: false });
  });

  it('Fragen nach Angeboten und Rechnungen bleiben Fragen', () => {
    expect(beantworte('Welche Angebote sind versendet?', kontext()).absicht).toBe('angebote-offen');
    expect(beantworte('Welche Rechnungen sind offen?', kontext()).absicht).toBe('rechnungen-offen');
  });
});
