import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { on } from '@core/events';
import { heute, plusTage } from '@core/format';
import { abnahmeHinweise, abnahmeStarten, abnahmeUnterschreiben, abnahmen, ergebnis, mangelHinzufuegen, offeneMaengel } from './daten';
import { unterschriftFehler } from '@ui/index';

function auftrag(phase: 'in_arbeit' | 'abnahme' = 'abnahme') {
  const k = db.kunden.create({ art: 'privat', name: 'Erika Muster', ansprechpartner: [] });
  return db.auftraege.create({ nummer: 'A-1', titel: 'Bad', art: 'projekt', phase, kundeId: k.id });
}

describe('Abnahme', () => {
  it('startet je Auftrag nur eine offene Abnahme', () => {
    const a = auftrag();
    const x = abnahmeStarten(a.id);
    expect(abnahmeStarten(a.id).id).toBe(x.id);
    expect(x.teilnehmer).toBe('Erika Muster');
  });

  it('macht aus jedem Mangel eine Aufgabe am Auftrag mit Frist', () => {
    const a = auftrag();
    const x = abnahmeStarten(a.id);
    const m = mangelHinzufuegen(x.id, 'Silikonfuge fehlt')!;
    expect(m.titel).toBe('Mangel: Silikonfuge fehlt');
    expect(m.auftragId).toBe(a.id);
    expect(m.faellig).toBe(plusTage(x.datum, 14));
    expect(abnahmen.get(x.id)!.mangelAufgabeIds).toEqual([m.id]);
    expect(ergebnis(abnahmen.get(x.id)!.mangelAufgabeIds)).toBe('mit_maengeln');
    expect(offeneMaengel(abnahmen.get(x.id)!, db.aufgaben.all())).toHaveLength(1);
    db.aufgaben.update(m.id, { erledigt: true });
    expect(offeneMaengel(abnahmen.get(x.id)!, db.aufgaben.all())).toHaveLength(0);
  });

  it('feuert abnahme.unterschrieben und speichert die Unterschrift als Dokument', () => {
    const a = auftrag();
    const x = abnahmeStarten(a.id);
    let gefeuert = 0;
    const aus = on('abnahme.unterschrieben', () => gefeuert++);
    const fertig = abnahmeUnterschreiben(x.id, { bild: 'data:image/png;base64,AAA', name: 'Erika Muster', ort: 'Kassel' })!;
    aus();
    expect(gefeuert).toBe(1);
    expect(fertig.status).toBe('unterschrieben');
    expect(db.dokumente.get(fertig.unterschriftKunde!.dokumentId)?.art).toBe('unterschrift');
    expect(abnahmeUnterschreiben(x.id, { bild: 'x', name: 'y' })).toBeUndefined();
  });

  it('verlangt Bild und Namen für eine Unterschrift', () => {
    expect(unterschriftFehler({ name: 'A' })).toMatch(/unterschreiben/);
    expect(unterschriftFehler({ bild: 'data:', name: ' ' })).toMatch(/Namen/);
    expect(unterschriftFehler({ bild: 'data:', name: 'A' })).toBeUndefined();
  });

  it('meldet fehlende Abnahmen und überfällige Mängel', () => {
    const a = auftrag();
    let h = abnahmeHinweise([a], [], [], heute());
    expect(h[0].schluessel).toBe(`abnahme-fehlt:${a.id}`);
    expect(h[0].aktionen?.[0].aktion).toBe('abnahme.starten');
    const x = abnahmeStarten(a.id);
    const m = mangelHinzufuegen(x.id, 'Kratzer')!;
    abnahmeUnterschreiben(x.id, { bild: 'data:image/png;base64,AAA', name: 'E' });
    h = abnahmeHinweise([a], abnahmen.all(), db.aufgaben.all(), plusTage(heute(), 30));
    expect(h.map((x2) => x2.schluessel)).toEqual([`abnahme-maengel:${x.id}`]);
    db.aufgaben.update(m.id, { erledigt: true });
    expect(abnahmeHinweise([a], abnahmen.all(), db.aufgaben.all(), plusTage(heute(), 30))).toHaveLength(0);
  });
});
