import { describe, expect, it } from 'vitest';
import { db } from '@core/db';
import type { Rechnung } from '@core/objects';
import { abrechenbar, alsPosition, anRechnungHaengen, betrag, freigeben, positionenAnhaengen, rechnungNimmtNachtraege, vonRechnungLoesen, zahlAus, zusatzHinweise, zusatzleistungen } from './daten';

function setup() {
  const k = db.kunden.create({ art: 'privat', name: 'K', ansprechpartner: [] });
  const a = db.auftraege.create({ nummer: 'A-5', titel: 'Bad', art: 'projekt', phase: 'abrechnung', kundeId: k.id });
  const z = zusatzleistungen.create({ auftragId: a.id, text: 'Steckdose', berechnung: 'pauschal', menge: 2, einheit: 'Stk', einzelpreis: 4550, fotoIds: [], status: 'offen' });
  return { a, z };
}

describe('Zusatzleistungen', () => {
  it('liest deutsche Zahlen', () => {
    expect(zahlAus('1,5')).toBe(1.5);
    expect(zahlAus('1.234,5')).toBe(1234.5);
    expect(zahlAus('2')).toBe(2);
    expect(zahlAus('')).toBeNaN();
  });

  it('rechnet Beträge in Cent und baut Rechnungspositionen', () => {
    const { z } = setup();
    expect(betrag(z)).toBe(9100);
    expect(alsPosition(z)).toMatchObject({ id: `zl-${z.id}`, art: 'pauschal', menge: 2, einzelpreis: 4550, text: 'Zusatzleistung: Steckdose' });
  });

  it('ist erst nach Freigabe abrechenbar und hängt nichts doppelt an', () => {
    const { a, z } = setup();
    expect(abrechenbar(z)).toBe(false);
    freigeben(z.id, { bild: 'data:image/png;base64,AA', name: 'K' });
    const frei = zusatzleistungen.get(z.id)!;
    expect(abrechenbar(frei)).toBe(true);
    const pos = positionenAnhaengen([], [frei]);
    expect(positionenAnhaengen(pos, [frei])).toHaveLength(1);

    const r = db.rechnungen.create({ nummer: 'R-1', art: 'rechnung', auftragId: a.id, kundeId: a.kundeId, titel: 'R', positionen: [], status: 'entwurf', datum: '2026-01-01', faelligAm: '2026-01-15', mahnstufe: 0 });
    expect(anRechnungHaengen(r)).toBe(1);
    expect(db.rechnungen.get(r.id)!.positionen).toHaveLength(1);
    expect(zusatzleistungen.get(z.id)!.status).toBe('abgerechnet');
    expect(vonRechnungLoesen(r.id)).toBe(1);
    expect(zusatzleistungen.get(z.id)!.status).toBe('freigegeben');
  });

  it('nimmt Nachträge nur in Entwürfe ohne Abschlag/Gutschrift', () => {
    const r = { auftragId: 'a', status: 'entwurf', art: 'rechnung' } as Rechnung;
    expect(rechnungNimmtNachtraege(r)).toBe(true);
    expect(rechnungNimmtNachtraege({ ...r, art: 'abschlag' })).toBe(false);
    expect(rechnungNimmtNachtraege({ ...r, status: 'versendet' })).toBe(false);
    expect(rechnungNimmtNachtraege({ ...r, auftragId: undefined })).toBe(false);
  });

  it('meldet fehlende Freigaben und nicht abgerechnete Nachträge', () => {
    const { a, z } = setup();
    let h = zusatzHinweise([z], [a]);
    expect(h.map((x) => x.schluessel)).toEqual([`zusatz-freigabe:${a.id}`]);
    h = zusatzHinweise([{ ...z, status: 'freigegeben' }], [a]);
    expect(h[0].schluessel).toBe(`zusatz-abrechnen:${a.id}`);
    expect(h[0].aktionen?.[0].aktion).toBe('rechnung.erstellen');
    h = zusatzHinweise([{ ...z, status: 'freigegeben' }], [{ ...a, phase: 'in_arbeit' }]);
    expect(h).toHaveLength(0);
  });
});
