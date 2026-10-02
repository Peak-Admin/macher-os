import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { abrechnen, anlagenAbstimmen, faelligeAbrechnung, kuendigen, kuendigenBis, laufzeitBis, servicevertraege, vertragFuerAnlage, zustand, type Servicevertrag } from './daten';

const basis = (x: Partial<Servicevertrag> = {}) =>
  servicevertraege.create({
    nummer: 'SV-2026-001',
    titel: 'Wartungsvertrag Heizung',
    kundeId: 'k1',
    ortIds: ['o1'],
    anlageIds: [],
    leistungen: ['Jährliche Wartung', 'Anfahrt'],
    intervallMonate: 12,
    preisJahr: 24000,
    abrechnung: 'quartal',
    beginn: '2026-01-01',
    laufzeitMonate: 12,
    kuendigungsfristMonate: 3,
    automatischVerlaengern: true,
    verlaengerungMonate: 12,
    status: 'aktiv',
    abrechnungen: [],
    ...x,
  });

describe('Serviceverträge – Laufzeit und Fristen', () => {
  it('verlängert sich automatisch, wenn die Frist verstrichen ist', () => {
    const v = basis();
    expect(laufzeitBis(v, '2026-06-01')).toBe('2026-12-31');
    expect(kuendigenBis(v, '2026-06-01')).toBe('2026-09-30');
    // nach Ablauf der Kündigungsfrist ist das nächste mögliche Ende ein Jahr später
    expect(laufzeitBis(v, '2026-10-01')).toBe('2027-12-31');
    expect(kuendigenBis(v, '2026-10-01')).toBe('2027-09-30');
  });

  it('zeigt Zustand Kündigungsfrist und Auslaufen', () => {
    expect(zustand(basis(), '2026-09-10')).toBe('frist');
    expect(zustand(basis(), '2026-06-01')).toBe('aktiv');
    const fest = basis({ automatischVerlaengern: false });
    expect(zustand(fest, '2026-11-15')).toBe('laeuft_aus');
    expect(zustand(fest, '2027-01-02')).toBe('beendet');
  });

  it('Kündigung setzt das Vertragsende', () => {
    const v = basis();
    expect(kuendigen(v.id, '2026-09-01')).toBe('2026-12-31');
    expect(zustand(servicevertraege.get(v.id)!, '2026-09-02')).toBe('gekuendigt');
    expect(zustand(servicevertraege.get(v.id)!, '2027-01-01')).toBe('beendet');
  });
});

describe('Serviceverträge – Abrechnung', () => {
  it('rechnet vierteljährlich im Voraus ab', () => {
    const v = basis();
    expect(faelligeAbrechnung(v, '2025-12-31')).toBeUndefined();
    expect(faelligeAbrechnung(v, '2026-01-01')).toEqual({ von: '2026-01-01', bis: '2026-03-31', betrag: 6000 });
  });

  it('legt Abrechnungsauftrag und Rechnungsentwurf an und rechnet nicht doppelt', () => {
    const v = basis({ abrechnung: 'monatlich' });
    const r = abrechnen(v.id, '2026-02-10')!;
    expect(db.auftraege.get(r.auftragId)?.phase).toBe('abrechnung');
    const rechnung = db.rechnungen.get(r.rechnungId)!;
    expect(rechnung.status).toBe('entwurf');
    expect(rechnung.positionen[0].einzelpreis).toBe(2000);
    // zweite Periode ist am 10.02. auch schon fällig (Rückstand), dritte noch nicht
    expect(faelligeAbrechnung(servicevertraege.get(v.id)!, '2026-02-10')).toEqual({ von: '2026-02-01', bis: '2026-02-28', betrag: 2000 });
    abrechnen(v.id, '2026-02-10');
    expect(faelligeAbrechnung(servicevertraege.get(v.id)!, '2026-02-10')).toBeUndefined();
    expect(servicevertraege.get(v.id)!.abrechnungen).toHaveLength(2);
  });

  it('findet den Vertrag zur Anlage und übernimmt das Intervall', () => {
    const anl = db.anlagen.create({ ortId: 'o9', kundeId: 'k9', typ: 'Gasheizung' });
    const v = basis({ kundeId: 'k9', ortIds: ['o9'], anlageIds: [anl.id], intervallMonate: 6 });
    expect(vertragFuerAnlage(anl.id, '2026-05-01')?.id).toBe(v.id);
    anlagenAbstimmen(v, '2026-05-01');
    expect(db.anlagen.get(anl.id)?.wartungMonate).toBe(6);
    expect(db.anlagen.get(anl.id)?.naechsteWartung).toBe('2026-07-01');
  });
});
