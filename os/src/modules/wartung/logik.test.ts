import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { buendeln, einordnen, faelligeAnlagen, wartungAbschliessen, wartungenAnlegen, wartungFortschreiben, benachrichtigungsText, kundeBenachrichtigen, kundeBenachrichtigt } from './logik';
import { servicevertraege } from '../servicevertraege/daten';
import { serien, termineErzeugen } from '../wiederkehrend/daten';

const T = '2026-10-02';

function aufbau() {
  const k = db.kunden.create({ art: 'privat', name: 'Familie Test', ansprechpartner: [], email: 'a@b.de' });
  const o = db.orte.create({ kundeId: k.id, bezeichnung: 'Haus', art: 'haus', adresse: { strasse: 'Weg 1', plz: '12345', ort: 'Stadt' } });
  const o2 = db.orte.create({ kundeId: k.id, bezeichnung: 'Ferienhaus', art: 'haus', adresse: { strasse: 'See 2', plz: '12345', ort: 'Stadt' } });
  const a1 = db.anlagen.create({ ortId: o.id, kundeId: k.id, typ: 'Gasheizung', wartungMonate: 12, naechsteWartung: '2026-10-20' });
  const a2 = db.anlagen.create({ ortId: o.id, kundeId: k.id, typ: 'Enthärtungsanlage', wartungMonate: 6, naechsteWartung: '2026-09-01' });
  const a3 = db.anlagen.create({ ortId: o2.id, kundeId: k.id, typ: 'Wärmepumpe', wartungMonate: 12, naechsteWartung: '2027-03-01' });
  return { k, o, o2, a1, a2, a3 };
}

describe('Wartung', () => {
  it('findet fällige Anlagen im Vorlauf und bündelt sie je Ort', () => {
    const { a1, a2, a3 } = aufbau();
    const f = faelligeAnlagen(T, 28);
    expect(f.map((a) => a.id)).toEqual(expect.arrayContaining([a2.id, a1.id]));
    expect(f.map((a) => a.id)).not.toContain(a3.id);
    expect(buendeln([a1, a2, a3])).toHaveLength(2);
  });

  it('legt einen Wartungsauftrag je Ort mit Prüfpunkten an – und nicht doppelt', () => {
    const { o, a1, a2 } = aufbau();
    const neu = wartungenAnlegen(T, false).filter((x) => x.ortId === o.id);
    expect(neu).toHaveLength(1);
    const auftrag = neu[0];
    expect(auftrag.art).toBe('wartung');
    expect(auftrag.phase).toBe('beauftragt');
    expect(auftrag.anlageIds).toEqual(expect.arrayContaining([a1.id, a2.id]));
    const aufgaben = db.aufgaben.where((t) => t.auftragId === auftrag.id);
    expect(aufgaben.length).toBeGreaterThan(5);
    expect(aufgaben.every((t) => t.quelle === 'wartung')).toBe(true);
    expect(wartungenAnlegen(T, false).filter((x) => x.ortId === o.id)).toHaveLength(0);
  });

  it('schreibt letzte und nächste Wartung fort', () => {
    const { o, a1, a2 } = aufbau();
    const auftrag = wartungenAnlegen(T, false).find((x) => x.ortId === o.id)!;
    expect(wartungFortschreiben(auftrag.id, '2026-10-10')).toBe(2);
    expect(db.anlagen.get(a1.id)?.naechsteWartung).toBe('2027-10-10');
    expect(db.anlagen.get(a2.id)?.naechsteWartung).toBe('2027-04-10');
    expect(wartungFortschreiben(auftrag.id, '2026-10-10')).toBe(0);
  });

  it('Wartung im Servicevertrag ist inklusive und wird direkt erledigt', () => {
    const { k, o, a1 } = aufbau();
    servicevertraege.create({ nummer: 'SV-X', titel: 'Heizung', kundeId: k.id, ortIds: [o.id], anlageIds: [a1.id], leistungen: [], intervallMonate: 12, preisJahr: 1000, abrechnung: 'jahr', beginn: '2026-01-01', laufzeitMonate: 24, kuendigungsfristMonate: 3, automatischVerlaengern: true, verlaengerungMonate: 12, status: 'aktiv', abrechnungen: [] });
    const auftrag = wartungenAnlegen(T, false).find((x) => x.ortId === o.id)!;
    expect(auftrag.beschreibung).toContain('nicht berechnen');
    wartungAbschliessen(auftrag.id, T);
    expect(db.auftraege.get(auftrag.id)?.phase).toBe('erledigt');
  });

  it('verknüpft Serientermin und bereitet Kundennachricht vor', () => {
    const { k, o, a1 } = aufbau();
    const s = serien.create({ titel: 'Heizungswartung', regel: { art: 'jaehrlich', alle: 1 }, start: '2026-10-15', uhrzeit: '09:00', dauerMinuten: 90, terminArt: 'wartung', mitarbeiterIds: [], kundeId: k.id, ortId: o.id, anlageIds: [a1.id], ausnahmen: [], erzeugt: [] });
    termineErzeugen(s, T, 3);
    const auftrag = wartungenAnlegen(T, false).find((x) => x.ortId === o.id)!;
    expect(db.termine.where((t) => t.auftragId === auftrag.id)).toHaveLength(1);
    const text = benachrichtigungsText(auftrag.id);
    expect(text).toContain('Terminvorschlag');
    expect(kundeBenachrichtigt(auftrag.id)).toBe(false);
    kundeBenachrichtigen(auftrag.id);
    expect(kundeBenachrichtigt(auftrag.id)).toBe(true);
  });

  it('ordnet Fälligkeiten ein', () => {
    // 2026-10-02 ist ein Freitag
    expect(einordnen('2026-09-30', T)).toBe('ueberfaellig');
    expect(einordnen('2026-10-04', T)).toBe('woche');
    expect(einordnen('2026-10-31', T)).toBe('monat');
    expect(einordnen('2026-11-01', T)).toBe('spaeter');
  });
});
