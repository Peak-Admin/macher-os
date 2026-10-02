import { describe, expect, test } from 'vitest';
import { aktivierung, type AktivierungsDaten } from './aktivierung';

const start = '2026-10-01T08:00:00.000Z';
const tag = (n: number, uhr = '10:00') => new Date(Date.parse(start) + n * 86_400_000).toISOString().slice(0, 11) + `${uhr}:00.000Z`;

function basis(): AktivierungsDaten {
  return {
    start,
    mitarbeiter: [
      { id: 'chef', rolle: 'chef' },
      { id: 'tim', rolle: 'monteur' },
    ],
    auftraege: [
      { id: 'a1', erstelltAm: tag(0) },
      { id: 'a2', erstelltAm: tag(1) },
      { id: 'a3', erstelltAm: tag(3) },
    ],
    rechnungen: [{ auftragId: 'a1', status: 'versendet', versendetAm: tag(5) }],
    zeiten: [{ mitarbeiterId: 'tim', auftragId: 'a1', erstelltAm: tag(2), erstelltVon: 'tim' }],
    dokumente: [],
  };
}

describe('aktivierung.erreicht', () => {
  test('alle vier Kriterien innerhalb von 14 Tagen → erreicht, am Tag des letzten Kriteriums', () => {
    const a = aktivierung(basis());
    expect(a.erreicht).toBe(true);
    expect(a.erreichtAm).toBe(tag(5));
    expect(a.tage).toBe(6);
    expect(a.kriterien).toEqual({ auftraege: 3, durchgelaufen: true, monteurErfasst: true, rechnungVersendet: true });
  });

  test('nur zwei Aufträge → nicht erreicht', () => {
    const d = basis();
    d.auftraege.pop();
    expect(aktivierung(d).erreicht).toBe(false);
    expect(aktivierung(d).kriterien.auftraege).toBe(2);
  });

  test('Erfassung durch den Chef zählt nicht als Monteur-Erfassung, Foto vom Monteur schon', () => {
    const d = basis();
    d.zeiten = [{ mitarbeiterId: 'chef', auftragId: 'a1', erstelltAm: tag(2), erstelltVon: 'chef' }];
    expect(aktivierung(d).kriterien.monteurErfasst).toBe(false);
    d.dokumente = [{ art: 'foto', auftragId: 'a2', erstelltAm: tag(4), erstelltVon: 'tim' }];
    expect(aktivierung(d).erreicht).toBe(true);
  });

  test('Erfassung ohne Auftrag zählt nicht', () => {
    const d = basis();
    d.zeiten = [{ mitarbeiterId: 'tim', erstelltAm: tag(2), erstelltVon: 'tim' }];
    expect(aktivierung(d).erreicht).toBe(false);
  });

  test('Rechnung im Entwurf zählt nicht; Rechnung ohne Auftrag zählt als versendet, aber nicht als durchgelaufen', () => {
    const d = basis();
    d.rechnungen = [{ auftragId: 'a1', status: 'entwurf' }];
    expect(aktivierung(d).kriterien.rechnungVersendet).toBe(false);
    d.rechnungen = [{ status: 'versendet', versendetAm: tag(5) }];
    expect(aktivierung(d).kriterien).toMatchObject({ rechnungVersendet: true, durchgelaufen: false });
  });

  test('nach 14 Tagen ist es zu spät', () => {
    const d = basis();
    d.rechnungen = [{ auftragId: 'a1', status: 'bezahlt', versendetAm: tag(15) }];
    expect(aktivierung(d).erreicht).toBe(false);
    expect(aktivierung(d, 30).erreicht).toBe(true);
  });

  test('Beispieldaten und Papierkorb zählen nie', () => {
    const d = basis();
    d.auftraege[2] = { ...d.auftraege[2], beispiel: true };
    expect(aktivierung(d).erreicht).toBe(false);
    const e = basis();
    e.rechnungen = [{ auftragId: 'a1', status: 'versendet', versendetAm: tag(5), geloeschtAm: tag(6) }];
    expect(aktivierung(e).erreicht).toBe(false);
  });
});
