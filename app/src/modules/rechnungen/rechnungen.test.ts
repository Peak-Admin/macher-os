import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@core/db';
import { heute } from '@core/format';
import { on } from '@core/events';
import {
  entwurfLoeschen,
  festschreiben,
  istUeberfaellig,
  offenerBetrag,
  pflichtangabenPruefen,
  pflichtTexte,
  rechnungErstellen,
  rechnungsSummen,
  rechnungsVorschau,
  statusAusZahlungen,
  stornieren,
  korrekturEntwurf,
} from './logik';
import { rechnungX, rechnungAendern } from './typen';
import { kundeOhneAdresse, testBetrieb, vorTagen } from './testdaten';

let t: ReturnType<typeof testBetrieb>;

function angebot(rabatt = 0) {
  return db.angebote.create({
    nummer: 'AN-2026-0001',
    auftragId: t.auftrag.id,
    kundeId: t.kunde.id,
    titel: 'Bad',
    positionen: [
      { id: 'a', art: 'leistung', text: 'Steckdosen setzen', menge: 10, einheit: 'Stk', einzelpreis: 4500 },
      { id: 'b', art: 'material', text: 'Kabel NYM', menge: 50, einheit: 'm', einzelpreis: 200, artikelId: 'art-kabel' },
      { id: 'c', art: 'leistung', text: 'Option: Bewegungsmelder', menge: 1, einheit: 'Stk', einzelpreis: 9900, optional: true },
    ],
    rabattProzent: rabatt,
    status: 'angenommen',
    datum: vorTagen(20),
    gueltigBis: heute(),
    version: 1,
  });
}

beforeEach(() => {
  t = testBetrieb();
});

describe('Rechnung aus Auftrag', () => {
  it('übernimmt Angebotspositionen ohne Optionen und Material ohne Doppelung', () => {
    angebot();
    db.material.create({ auftragId: t.auftrag.id, artikelId: 'art-kabel', text: 'Kabel NYM', menge: 50, einheit: 'm', ek: 100, status: 'verbraucht' });
    const extra = db.material.create({ auftragId: t.auftrag.id, text: 'Abzweigdose', menge: 4, einheit: 'Stk', ek: 250, status: 'verbraucht' });
    db.material.create({ auftragId: t.auftrag.id, text: 'Geplant', menge: 1, einheit: 'Stk', ek: 100, status: 'geplant' });
    const v = rechnungsVorschau(t.auftrag.id);
    expect(v.positionen.map((p) => p.text)).toEqual(['Steckdosen setzen', 'Kabel NYM', 'Abzweigdose']);
    // Material ohne Artikel: EK + 20 % Aufschlag
    expect(v.positionen[2].einzelpreis).toBe(300);
    expect(v.materialIds).toEqual([extra.id]);
    expect(v.zeitIds).toEqual([]);
  });

  it('rechnet nach Aufwand: Zeiten × Stundensatz, auf Viertelstunden gerundet', () => {
    db.zeiten.create({ mitarbeiterId: 'm1', auftragId: t.auftrag.id, datum: vorTagen(2), start: '07:00', ende: '16:00', pauseMinuten: 45, art: 'arbeit' });
    db.zeiten.create({ mitarbeiterId: 'm1', auftragId: t.auftrag.id, datum: vorTagen(1), start: '07:00', ende: '07:40', pauseMinuten: 0, art: 'fahrt' });
    db.zeiten.create({ mitarbeiterId: 'm1', auftragId: t.auftrag.id, datum: heute(), start: '07:00', pauseMinuten: 0, art: 'arbeit' }); // läuft noch
    const v = rechnungsVorschau(t.auftrag.id);
    const arbeit = v.positionen.find((p) => p.text === 'Arbeitszeit')!;
    const fahrt = v.positionen.find((p) => p.text === 'Fahrtzeit')!;
    expect(arbeit.menge).toBe(8.25);
    expect(arbeit.einzelpreis).toBe(6000);
    expect(fahrt.menge).toBe(0.75);
    expect(v.zeitIds).toHaveLength(2);
    expect(v.leistungVon).toBe(vorTagen(2));
  });

  it('rechnet Zeiten nicht doppelt ab', () => {
    db.zeiten.create({ mitarbeiterId: 'm1', auftragId: t.auftrag.id, datum: vorTagen(2), start: '08:00', ende: '10:00', pauseMinuten: 0, art: 'arbeit' });
    const r = rechnungErstellen(t.auftrag.id, 'teil')!;
    expect(r.zeitIds).toHaveLength(1);
    const v = rechnungsVorschau(t.auftrag.id, 'schluss');
    expect(v.zeitIds).toHaveLength(0);
  });

  it('Abschlag: Prozent der Angebotssumme (nach Rabatt)', () => {
    angebot(10);
    const v = rechnungsVorschau(t.auftrag.id, 'abschlag', { prozent: 30 });
    // Angebot netto 45000 + 10000 = 55000, -10 % = 49500, davon 30 % = 14850
    expect(v.positionen).toHaveLength(1);
    expect(v.positionen[0].einzelpreis).toBe(14850);
    expect(v.titel).toMatch(/^1\. Abschlag/);
  });

  it('Schlussrechnung zieht versendete Abschläge ab', () => {
    angebot();
    const ab = rechnungErstellen(t.auftrag.id, 'abschlag', { prozent: 50 })!;
    expect(festschreiben(ab.id).ok).toBe(true);
    const schluss = rechnungErstellen(t.auftrag.id, 'schluss')!;
    expect(schluss.abzugRechnungIds).toEqual([ab.id]);
    const s = rechnungsSummen(schluss);
    expect(s.netto).toBe(55000);
    expect(s.brutto).toBe(65450);
    expect(s.abzugBrutto).toBe(rechnungsSummen(rechnungX(ab.id)!).brutto);
    expect(s.zahlbetrag).toBe(65450 - 32725);
  });

  it('liefert bestehenden Entwurf statt einen zweiten', () => {
    const a = rechnungErstellen(t.auftrag.id)!;
    const b = rechnungErstellen(t.auftrag.id)!;
    expect(a.id).toBe(b.id);
  });

  it('markiert Material als abgerechnet und gibt es beim Verwerfen wieder frei', () => {
    const m = db.material.create({ auftragId: t.auftrag.id, text: 'Dose', menge: 1, einheit: 'Stk', ek: 100, status: 'verbraucht' });
    const r = rechnungErstellen(t.auftrag.id)!;
    expect(db.material.get(m.id)?.abgerechnetIn).toBe(r.id);
    entwurfLoeschen(r.id);
    expect(db.material.get(m.id)?.abgerechnetIn).toBeUndefined();
  });

  it('liest Zusatzleistungen tolerant aus der fremden Sammlung', async () => {
    const { defineCollection } = await import('@core/db');
    const zus = defineCollection<{ id: string; erstelltAm: string; geaendertAm: string; auftragId: string; titel: string; preis: number; abrechenbar: boolean }>('zusatzleistungen');
    zus.create({ auftragId: t.auftrag.id, titel: 'Zusätzliche Steckdose', preis: 8000, abrechenbar: true } as never);
    zus.create({ auftragId: t.auftrag.id, titel: 'Kulanz', preis: 5000, abrechenbar: false } as never);
    const v = rechnungsVorschau(t.auftrag.id);
    expect(v.positionen.find((p) => p.text === 'Zusätzliche Steckdose')?.einzelpreis).toBe(8000);
    expect(v.positionen.some((p) => p.text === 'Kulanz')).toBe(false);
    expect(v.zusatzleistungIds).toHaveLength(1);
  });
});

describe('Pflichtangaben § 14 UStG', () => {
  it('meldet fehlende Steuernummer und Kundenanschrift verständlich', () => {
    db.betrieb.update('betrieb', { steuernummer: undefined, ustId: undefined });
    const k = kundeOhneAdresse();
    const r = db.rechnungen.create({ nummer: '', art: 'rechnung', kundeId: k.id, titel: 'X', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 1, einheit: 'h', einzelpreis: 100 }], status: 'entwurf', datum: heute(), faelligAm: heute(), mahnstufe: 0 });
    const p = pflichtangabenPruefen(r);
    expect(p.ok).toBe(false);
    const felder = p.pflicht.map((m) => m.feld);
    expect(felder).toContain('betrieb.steuernummer');
    expect(felder).toContain('kunde.adresse');
    expect(felder).toContain('leistungszeitraum');
  });

  it('verhindert das Festschreiben bei Mängeln und vergibt keine Nummer', () => {
    const r = rechnungErstellen(t.auftrag.id)!;
    const e = festschreiben(r.id);
    expect(e.ok).toBe(false);
    expect(rechnungX(r.id)?.nummer).toBe('');
  });

  it('setzt Hinweise für Kleinunternehmer, § 13b und Privatkunden', () => {
    const r = rechnungErstellen(t.auftrag.id)!;
    expect(pflichtTexte(r).join(' ')).toMatch(/zwei Jahre/);
    db.betrieb.update('betrieb', { kleinunternehmer: true });
    expect(pflichtTexte(r).join(' ')).toMatch(/§ 19 UStG/);
    expect(rechnungsSummen(r).ust).toBe(0);
    db.betrieb.update('betrieb', { kleinunternehmer: false });
    const r2 = rechnungAendern(r.id, { reverseCharge: true })!;
    expect(pflichtTexte(r2).join(' ')).toMatch(/§ 13b/);
    // § 13b nicht bei Privatkunden
    expect(pflichtangabenPruefen(r2).pflicht.some((m) => m.feld === 'reverseCharge')).toBe(true);
  });
});

describe('Festschreiben, Zahlungsstatus, Storno', () => {
  function fertigeRechnung() {
    const r = rechnungErstellen(t.auftrag.id)!;
    rechnungAendern(r.id, { leistungszeitraum: '01.09.2026', positionen: [{ id: 'p', art: 'leistung', text: 'Arbeit', menge: 2, einheit: 'h', einzelpreis: 5000 }] });
    return r;
  }

  it('vergibt die Nummer erst beim Festschreiben und feuert rechnung.versendet', () => {
    const r = fertigeRechnung();
    let events = 0;
    const aus = on('rechnung.versendet', () => events++);
    const e = festschreiben(r.id, { weg: 'email' });
    aus();
    expect(e.ok).toBe(true);
    expect(e.rechnung?.nummer).toMatch(/^R-\d{4}-0001$/);
    expect(e.rechnung?.status).toBe('versendet');
    expect(e.rechnung?.datum).toBe(heute());
    expect(events).toBe(1);
  });

  it('berechnet offen, teilbezahlt, bezahlt und überfällig', () => {
    const r = fertigeRechnung();
    festschreiben(r.id);
    const f = rechnungX(r.id)!;
    expect(offenerBetrag(f)).toBe(11900);
    db.zahlungen.create({ rechnungId: r.id, betrag: 5000, datum: heute(), art: 'ueberweisung' });
    expect(statusAusZahlungen(f)).toBe('teilbezahlt');
    db.zahlungen.create({ rechnungId: r.id, betrag: 6662, datum: heute(), art: 'ueberweisung', skonto: 238 } as never);
    expect(statusAusZahlungen(f)).toBe('bezahlt');
    const alt = rechnungAendern(r.id, { faelligAm: vorTagen(3), status: 'versendet' })!;
    expect(istUeberfaellig(alt)).toBe(false); // bezahlt (über Skonto) → nicht überfällig
  });

  it('storniert mit eigener Nummer und negativen Beträgen, Original bleibt erhalten', () => {
    const r = fertigeRechnung();
    festschreiben(r.id);
    const s = stornieren(r.id, 'falscher Satz')!;
    expect(s.nummer).toMatch(/-0002$/);
    expect(s.art).toBe('gutschrift');
    expect(rechnungsSummen(s).zahlbetrag).toBe(-11900);
    expect(rechnungX(r.id)?.status).toBe('storniert');
    expect(offenerBetrag(rechnungX(r.id)!)).toBe(0);
    const k = korrekturEntwurf(r.id)!;
    expect(k.status).toBe('entwurf');
    expect(k.nummer).toBe('');
    expect(k.positionen[0].menge).toBe(2);
  });

  it('lässt festgeschriebene Rechnungen nicht als Entwurf löschen', () => {
    const r = fertigeRechnung();
    festschreiben(r.id);
    expect(entwurfLoeschen(r.id)).toBe(false);
    expect(rechnungX(r.id)?.geloeschtAm).toBeUndefined();
  });
});
