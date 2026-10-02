import { beforeEach, describe, expect, it } from 'vitest';
import { db, zuruecksetzen } from '@core/db';
import { registriereModule } from '@core/modul';
import { heute, plusTage, zeitpunkt } from '@core/format';
import type { Angebot, Auftrag, Rechnung, Termin } from '@core/objects';
import { alleEinsaetzeErledigt, istVor, naechsterSchritt, tageOhneBewegung, type SchrittKontext } from './logik';
import {
  auftragIdAus,
  beiAbnahmeUnterschrieben,
  beiAngebotAngenommen,
  beiEinsatzGestartet,
  beiTerminErledigt,
  beiZahlung,
  schrittAusfuehren,
  schrittFuer,
} from './daten';

const basis = { id: 'x', erstelltAm: '2026-01-01T00:00:00Z', geaendertAm: '2026-01-01T00:00:00Z' };
const auftrag = (x: Partial<Auftrag>): Auftrag => ({ ...basis, nummer: 'A-1', titel: 'T', art: 'projekt', phase: 'anfrage', kundeId: 'k', ...x });
const termin = (x: Partial<Termin>): Termin => ({ ...basis, art: 'einsatz', titel: '', start: zeitpunkt(plusTage(heute(), 2), '08:00'), ende: zeitpunkt(plusTage(heute(), 2), '12:00'), mitarbeiterIds: [], status: 'geplant', ...x });
const kontext = (x: Partial<SchrittKontext> = {}): SchrittKontext => ({ termine: [], angebote: [], rechnungen: [], heute: heute(), aktionDa: () => true, pfadZu: (t, id) => `/${t}/${id}`, ...x });

describe('Phasen', () => {
  it('kennt die Reihenfolge', () => {
    expect(istVor('angebot', 'beauftragt')).toBe(true);
    expect(istVor('in_arbeit', 'beauftragt')).toBe(false);
    expect(istVor('verloren', 'beauftragt')).toBe(false);
  });
  it('erkennt erledigte Einsätze, Besichtigungen zählen nicht', () => {
    expect(alleEinsaetzeErledigt([])).toBe(false);
    expect(alleEinsaetzeErledigt([termin({ status: 'erledigt' }), termin({ art: 'besichtigung' })])).toBe(true);
    expect(alleEinsaetzeErledigt([termin({ status: 'erledigt' }), termin({ status: 'geplant' })])).toBe(false);
    expect(alleEinsaetzeErledigt([termin({ status: 'erledigt' }), termin({ status: 'abgesagt' })])).toBe(true);
  });
  it('zählt Tage ohne Bewegung', () => {
    expect(tageOhneBewegung(plusTage(heute(), -15) + 'T10:00:00Z', heute())).toBe(15);
  });
});

describe('Nächster Schritt', () => {
  it('Projekt-Anfrage → Besichtigung planen', () => {
    expect(naechsterSchritt(auftrag({}), kontext())?.aktion).toBe('besichtigung.planen');
  });
  it('Kundendienst-Anfrage → annehmen und einplanen', () => {
    const s = naechsterSchritt(auftrag({ art: 'kundendienst' }), kontext())!;
    expect(s.aktion).toBe('plan.einplanen');
    expect(s.vorherPhase).toBe('beauftragt');
  });
  it('Besichtigung geplant → Angebot erstellen', () => {
    expect(naechsterSchritt(auftrag({ phase: 'besichtigung' }), kontext({ termine: [termin({ art: 'besichtigung' })] }))?.aktion).toBe('angebot.erstellen');
  });
  it('Angebot versendet → Zusage eintragen', () => {
    const an = { ...basis, status: 'versendet' } as Angebot;
    expect(naechsterSchritt(auftrag({ phase: 'angebot' }), kontext({ angebote: [an] }))?.phase).toBe('beauftragt');
  });
  it('Angebotsentwurf → fertigstellen', () => {
    const an = { ...basis, id: 'an1', status: 'entwurf' } as Angebot;
    expect(naechsterSchritt(auftrag({ phase: 'angebot' }), kontext({ angebote: [an] }))?.pfad).toBe('/angebote/an1');
  });
  it('beauftragt ohne Termin → einplanen, mit Termin heute → Einsatz starten', () => {
    expect(naechsterSchritt(auftrag({ phase: 'beauftragt' }), kontext())?.aktion).toBe('plan.einplanen');
    const t = termin({ id: 't1', start: zeitpunkt(heute(), '08:00') });
    expect(naechsterSchritt(auftrag({ phase: 'beauftragt' }), kontext({ termine: [t] }))?.aktion).toBe('einsatz.starten');
  });
  it('laufender Einsatz → Einsatz beenden statt erneut starten', () => {
    const t = termin({ id: 't1', start: zeitpunkt(heute(), '08:00'), status: 'vor_ort' });
    expect(naechsterSchritt(auftrag({ phase: 'in_arbeit' }), kontext({ termine: [t] }))).toMatchObject({ aktion: 'einsatz.beenden', payload: { terminId: 't1' } });
  });
  it('in Arbeit ohne kommende Einsätze → Abnahme starten', () => {
    expect(naechsterSchritt(auftrag({ phase: 'in_arbeit' }), kontext({ termine: [termin({ status: 'erledigt' })] }))?.aktion).toBe('abnahme.starten');
  });
  it('Abrechnung mit Abschlag → Schlussrechnung', () => {
    const r = { ...basis, art: 'abschlag', status: 'bezahlt' } as Rechnung;
    const s = naechsterSchritt(auftrag({ phase: 'abrechnung' }), kontext({ rechnungen: [r] }))!;
    expect(s.aktion).toBe('rechnung.erstellen');
    expect(s.payload).toEqual({ auftragId: 'x', art: 'schluss' });
  });
  it('erledigt ohne Bewertungsmodul → kein Schritt; verloren → wieder aufnehmen', () => {
    expect(naechsterSchritt(auftrag({ phase: 'erledigt' }), kontext({ aktionDa: () => false }))).toBeUndefined();
    expect(naechsterSchritt(auftrag({ phase: 'verloren' }), kontext())?.phase).toBe('anfrage');
  });
});

describe('Ausführen mit Rückfall und Phasen-Automationen', () => {
  beforeEach(() => {
    zuruecksetzen();
    registriereModule([]);
  });
  const neu = (x: Partial<Auftrag> = {}) => db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Test', art: 'projekt', phase: 'anfrage', kundeId: 'k', ...x });

  it('fehlt die Aktion, gibt es Phase + Aufgabe statt Fehler', () => {
    const a = neu();
    const r = schrittAusfuehren(a, schrittFuer(a)!);
    expect(r.meldung).toMatch(/Aufgabe angelegt/);
    expect(db.auftraege.get(a.id)?.phase).toBe('besichtigung');
    expect(db.aufgaben.where((x) => x.auftragId === a.id)).toHaveLength(1);
    // zweimal ausführen legt keine doppelte Aufgabe an
    schrittAusfuehren(a, schrittFuer(a)!);
    expect(db.aufgaben.where((x) => x.auftragId === a.id && x.titel.startsWith('Besichtigung'))).toHaveLength(1);
  });

  it('nutzt registrierte Aktionen und gibt den Zielpfad zurück', () => {
    registriereModule([{ id: 'plan', titel: 'P', bereich: 'plan', beschreibung: '', aktionen: { 'plan.einplanen': () => '/plan/x' } }]);
    const a = neu({ art: 'kundendienst' });
    const r = schrittAusfuehren(a, schrittFuer(a)!);
    expect(r.pfad).toBe('/plan/x');
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
  });

  it('Angebot angenommen → beauftragt, nicht rückwärts', () => {
    const a = neu({ phase: 'angebot' });
    expect(beiAngebotAngenommen(a.id)).toBe(true);
    expect(db.auftraege.get(a.id)?.phase).toBe('beauftragt');
    expect(db.erledigungen.all()).toHaveLength(1);
    const b = neu({ phase: 'in_arbeit' });
    expect(beiAngebotAngenommen(b.id)).toBe(false);
    expect(db.auftraege.get(b.id)?.phase).toBe('in_arbeit');
  });

  it('Einsatz gestartet → in Arbeit', () => {
    const a = neu({ phase: 'beauftragt' });
    beiEinsatzGestartet(a.id);
    expect(db.auftraege.get(a.id)?.phase).toBe('in_arbeit');
  });

  it('alle Termine erledigt → Abnahme, außer es sind Aufgaben offen', () => {
    const a = neu({ phase: 'in_arbeit' });
    const t = db.termine.create({ art: 'einsatz', titel: '', start: '2026-01-01T07:00:00Z', ende: '2026-01-01T09:00:00Z', mitarbeiterIds: [], status: 'erledigt', auftragId: a.id });
    const auf = db.aufgaben.create({ titel: 'Rest', auftragId: a.id, erledigt: false, prioritaet: 'normal' });
    expect(beiTerminErledigt(a.id)).toBe(false);
    db.aufgaben.update(auf.id, { erledigt: true });
    expect(beiTerminErledigt(a.id)).toBe(true);
    expect(db.auftraege.get(a.id)?.phase).toBe('abnahme');
    expect(t.id).toBeTruthy();
  });

  it('Abnahme unterschrieben → Abrechnung; Ereignis mit auftragId in daten', () => {
    const a = neu({ phase: 'abnahme' });
    beiAbnahmeUnterschrieben(auftragIdAus({ typ: 'abnahme.unterschrieben', daten: { auftragId: a.id } }));
    expect(db.auftraege.get(a.id)?.phase).toBe('abrechnung');
  });

  it('Schlussrechnung bezahlt → erledigt, offene Abschläge verhindern das', () => {
    const a = neu({ phase: 'abrechnung' });
    const r = (x: Partial<Rechnung>) => db.rechnungen.create({ nummer: 'R', art: 'schluss', kundeId: 'k', auftragId: a.id, titel: '', positionen: [], status: 'bezahlt', datum: heute(), faelligAm: heute(), mahnstufe: 0, ...x });
    const ab = r({ art: 'abschlag', status: 'versendet' });
    r({});
    expect(beiZahlung(a.id)).toBe(false);
    db.rechnungen.update(ab.id, { status: 'bezahlt' });
    expect(beiZahlung(auftragIdAus({ typ: 'zahlung.eingegangen', daten: { rechnungId: ab.id } }))).toBe(true);
    expect(db.auftraege.get(a.id)?.phase).toBe('erledigt');
    expect(db.auftraege.get(a.id)?.abgeschlossenAm).toBeTruthy();
  });
});
