/** „Mit Lotte vorbereiten“: Kontextübergabe (Objekt + Absicht) vom Knopf über das Overlay bis in den Gateway. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { db, zuruecksetzen } from '@core/db';
import { fuehrePlanAus, kiProtokoll, registriereGateway, type GatewayKontext } from '@core/gateway';
import { schliesse, useOverlay } from '@core/overlay';
import type { Recht } from '@core/session';
import { ANGEBOT_AKTIONEN, ANGEBOT_ENTWURF } from '@modules/angebote/gateway';
import { NACHRICHT_AKTIONEN } from '@modules/nachrichten/gateway';
import { RECHNUNG_SENDEN } from '@modules/rechnungen/gateway';
import { ABSICHTEN, AKTIONEN, fragen, type Vorschlag } from './assistent';
import { macherStart, mitMacherOeffnen, vorbereitungFuer } from './vorbereiten';

const HEUTE = '2026-10-02';
const ALLE: Recht[] = ['lesen', 'schreiben', 'planen', 'geld', 'veroeffentlichen', 'personal'];

function basis() {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 2, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  db.mitarbeiter.create({ vorname: 'Max', nachname: 'Macher', rolle: 'chef', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true });
  const kunde = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], email: 'hoffmann@example.org', telefon: '0561 123456' });
  const leistung = db.leistungen.create({ name: 'Steckdose setzen', einheit: 'Stk', preis: 4500, aktiv: true });
  const anfrage = db.auftraege.create({ nummer: 'A-2026-0010', titel: 'Küche Elektrik', beschreibung: '3 Stk Steckdose setzen', art: 'kundendienst', phase: 'anfrage', kundeId: kunde.id });
  return { kunde, leistung, anfrage };
}

const kontext = (rechte: Recht[] = ALLE): GatewayKontext => ({ heute: HEUTE, jetzt: new Date(`${HEUTE}T10:00:00`), ich: db.mitarbeiter.all()[0], darf: (r) => rechte.includes(r) });

const planVon = (v: Vorschlag | undefined) => {
  if (v?.art !== 'plan') throw new Error('kein Plan');
  return v.plan;
};

let aus: () => void;
let d: ReturnType<typeof basis>;
beforeEach(() => {
  d = basis();
  aus = registriereGateway({ absichten: ABSICHTEN, aktionen: [...AKTIONEN, ...ANGEBOT_AKTIONEN, ...ANGEBOT_ENTWURF, ...NACHRICHT_AKTIONEN, ...RECHNUNG_SENDEN] as never[] });
});
afterEach(() => {
  aus();
  schliesse();
});

describe('Welche Vorbereitung passt zum Objekt?', () => {
  it('Anfrage → Angebot aus Anfrage, in der Einsatzplanung → Einsatz', () => {
    const v = vorbereitungFuer({ typ: 'auftraege', id: d.anfrage.id }, HEUTE);
    expect(v?.absicht).toBe('offer.prepare_from_request');
    expect(v?.bezug).toEqual({ typ: 'auftraege', id: d.anfrage.id });
    expect(v?.frage).toContain('Küche Elektrik');
    expect(vorbereitungFuer({ typ: 'auftraege', id: d.anfrage.id }, HEUTE, 'einplanen')?.absicht).toBe('job.prepare_schedule');
  });

  it('Angebot: Entwurf → senden, versendet → nachfassen, entschieden → nichts', () => {
    const a = db.angebote.create({ nummer: 'AN-1', auftragId: d.anfrage.id, kundeId: d.kunde.id, titel: 'Küche', positionen: [], status: 'entwurf', datum: HEUTE, gueltigBis: '2026-11-01', version: 1 });
    expect(vorbereitungFuer({ typ: 'angebote', id: a.id }, HEUTE)?.absicht).toBe('offer.prepare_send');
    db.angebote.update(a.id, { status: 'versendet', versendetAm: '2026-09-20T10:00:00Z' });
    expect(vorbereitungFuer({ typ: 'angebote', id: a.id }, HEUTE)?.absicht).toBe('offer.prepare_followup');
    db.angebote.update(a.id, { status: 'angenommen' });
    expect(vorbereitungFuer({ typ: 'angebote', id: a.id }, HEUTE)).toBeUndefined();
  });

  it('Rechnung: Entwurf → senden, bezahlt → nichts', () => {
    const r = db.rechnungen.create({ nummer: '', art: 'rechnung', kundeId: d.kunde.id, titel: 'Küche', positionen: [], status: 'entwurf', datum: HEUTE, faelligAm: '2026-10-16', mahnstufe: 0 });
    expect(vorbereitungFuer({ typ: 'rechnungen', id: r.id }, HEUTE)?.absicht).toBe('invoice.prepare_send');
    db.rechnungen.update(r.id, { status: 'bezahlt', nummer: 'R-2026-001' });
    expect(vorbereitungFuer({ typ: 'rechnungen', id: r.id }, HEUTE)).toBeUndefined();
  });
});

describe('Kontextübergabe an den Assistenten', () => {
  it('öffnet dasselbe Overlay wie Strg+K – mit Frage, Absicht und Objekt', () => {
    const { result } = renderHook(() => useOverlay('macher'));
    expect(result.current.offen).toBe(false);
    act(() => {
      expect(mitMacherOeffnen({ typ: 'auftraege', id: d.anfrage.id }, HEUTE)).toBe(true);
    });
    expect(result.current.offen).toBe(true);
    expect(result.current.payload).toEqual(macherStart(vorbereitungFuer({ typ: 'auftraege', id: d.anfrage.id }, HEUTE)!));
    expect(result.current.payload).toMatchObject({ absicht: 'offer.prepare_from_request', bezug: { typ: 'auftraege', id: d.anfrage.id } });
  });

  it('öffnet nichts, wenn es nichts vorzubereiten gibt', () => {
    const { result } = renderHook(() => useOverlay('macher'));
    act(() => {
      expect(mitMacherOeffnen({ typ: 'angebote', id: 'gibt-es-nicht' }, HEUTE)).toBe(false);
    });
    expect(result.current.offen).toBe(false);
  });

  it('der Gateway nimmt die vorbelegte Absicht und das Objekt – Vorschau, erst nach Bestätigung ein Entwurf', async () => {
    const v = vorbereitungFuer({ typ: 'auftraege', id: d.anfrage.id }, HEUTE)!;
    const { antwort } = await fragen(v.frage, kontext(), 'text', { absicht: v.absicht, werte: { bezug: v.bezug } });
    expect(antwort.absicht).toBe('angebot-aus-anfrage');
    const plan = planVon(antwort.vorschlaege?.[0]);
    expect(plan.schritte).toHaveLength(1);
    expect(plan.schritte[0].aktion).toBe('offer.create_draft');
    const daten = plan.schritte[0].daten as { auftragId: string; positionen: { text: string; menge: number }[] };
    expect(daten.auftragId).toBe(d.anfrage.id);
    expect(daten.positionen[0]).toMatchObject({ text: 'Steckdose setzen', menge: 3 });
    // protokolliert mit der vorbelegten Absicht, noch nichts angelegt
    expect(kiProtokoll.all().at(-1)).toMatchObject({ absicht: 'offer.prepare_from_request', ergebnis: 'vorgeschlagen' });
    expect(db.angebote.all()).toHaveLength(0);

    const r = await fuehrePlanAus(plan, kontext(), { bestaetigt: true });
    expect(r[0].status).toBe('ausgefuehrt');
    const angebot = db.angebote.all()[0];
    expect(angebot.auftragId).toBe(d.anfrage.id);
    expect(angebot.positionen).toHaveLength(1);
    expect(db.auftraege.get(d.anfrage.id)?.phase).toBe('angebot');
  });

  it('gibt es schon einen Entwurf, schlägt Lotte vor, dort weiterzumachen', async () => {
    db.angebote.create({ nummer: 'AN-1', auftragId: d.anfrage.id, kundeId: d.kunde.id, titel: 'Küche', positionen: [], status: 'entwurf', datum: HEUTE, gueltigBis: '2026-11-01', version: 1 });
    const { antwort } = await fragen('Angebot vorbereiten', kontext(), 'text', { absicht: 'offer.prepare_from_request', werte: { bezug: { typ: 'auftraege', id: d.anfrage.id } } });
    expect(antwort.absicht).toBe('angebot-vorhanden');
    expect(antwort.vorschlaege?.some((x) => x.art === 'plan')).not.toBe(true);
  });

  it('Nachfassen: Nachricht an genau diesen Kunden, Text vor dem Senden änderbar', async () => {
    const a = db.angebote.create({ nummer: 'AN-2', auftragId: d.anfrage.id, kundeId: d.kunde.id, titel: 'Küche', positionen: [], status: 'versendet', versendetAm: '2026-09-20T10:00:00Z', datum: HEUTE, gueltigBis: '2026-11-01', version: 1 });
    const v = vorbereitungFuer({ typ: 'angebote', id: a.id }, HEUTE)!;
    const { antwort } = await fragen(v.frage, kontext(), 'text', { absicht: v.absicht, werte: { bezug: v.bezug } });
    const plan = planVon(antwort.vorschlaege?.find((x) => x.art === 'plan'));
    expect(plan.schritte[0]).toMatchObject({ aktion: 'message.send', daten: { kundeId: d.kunde.id, auftragId: d.anfrage.id }, textFeld: { feld: 'text' } });
    expect((plan.schritte[0].daten as { text: string }).text).toContain('AN-2');
    // Anrufen als Alternative, nur weil eine Nummer hinterlegt ist
    expect(antwort.vorschlaege?.some((x) => x.art === 'oeffnen' && x.pfad.startsWith('tel:'))).toBe(true);
  });

  it('Rechte gelten wie bei jeder Frage: ohne „Preise & Geld“ kein Angebot aus der Anfrage', async () => {
    const { antwort } = await fragen('Angebot vorbereiten', kontext(['lesen', 'schreiben']), 'text', { absicht: 'offer.prepare_from_request', werte: { bezug: { typ: 'auftraege', id: d.anfrage.id } } });
    expect(antwort.absicht).toBe('keine-berechtigung');
    expect(kiProtokoll.all().at(-1)).toMatchObject({ ergebnis: 'verweigert' });
  });

  it('ohne Objekt (z. B. frei getippt) gibt es nur einen Hinweis, keine Aktion', async () => {
    const { antwort } = await fragen('Angebot vorbereiten', kontext(), 'text', { absicht: 'offer.prepare_send' });
    expect(antwort.absicht).toBe('kontext-fehlt');
    expect(antwort.vorschlaege).toBeUndefined();
  });
});
