/** Testdaten-Bausteine für die Planprüfungen (nur in Tests genutzt). */
import { zeitpunkt } from '@core/format';
import type { Auftrag, Betriebsmittel, Kunde, Materialbuchung, Mitarbeiter, Nachweis, Ort, Termin } from '@core/objects';
import { leererKontext, type Kontext } from './basis';

/** Montag */
export const MO = '2026-10-05';
const basis = { erstelltAm: '2026-01-01T00:00:00.000Z', geaendertAm: '2026-01-01T00:00:00.000Z' };

export function ma(id: string, x: Partial<Mitarbeiter> = {}): Mitarbeiter {
  return { ...basis, id, vorname: id, nachname: 'Test', rolle: 'monteur', wochenstunden: 40, urlaubstageJahr: 30, kostensatz: 0, aktiv: true, ...x };
}

export function ort(id: string, plz: string, x: Partial<Ort> = {}): Ort {
  return { ...basis, id, kundeId: 'k1', bezeichnung: id, art: 'haus', adresse: { strasse: `${id}straße 1`, plz, ort: 'Stadt' }, ...x };
}

export function auftrag(id: string, x: Partial<Auftrag> = {}): Auftrag {
  return { ...basis, id, nummer: id, titel: `Auftrag ${id}`, art: 'kundendienst', phase: 'beauftragt', kundeId: 'k1', ...x };
}

export function termin(id: string, datum: string, von: string, bis: string, x: Partial<Termin> = {}): Termin {
  return { ...basis, id, art: 'einsatz', titel: `Termin ${id}`, start: zeitpunkt(datum, von), ende: zeitpunkt(datum, bis), mitarbeiterIds: [], status: 'geplant', ...x };
}

export function nachweis(mitarbeiterId: string, qualifikationId: string, gueltigBis?: string): Nachweis {
  return { ...basis, id: `n_${mitarbeiterId}_${qualifikationId}`, mitarbeiterId, qualifikationId, gueltigBis };
}

export function mittel(id: string, x: Partial<Betriebsmittel> = {}): Betriebsmittel {
  return { ...basis, id, art: 'werkzeug', name: id, status: 'verfuegbar', ...x };
}

export function material(id: string, auftragId: string, x: Partial<Materialbuchung> = {}): Materialbuchung {
  return { ...basis, id, auftragId, text: id, menge: 1, einheit: 'Stk', ek: 0, status: 'geplant', ...x };
}

export const kunde: Kunde = { ...basis, id: 'k1', art: 'privat', name: 'Kunde', ansprechpartner: [], adresse: { strasse: 'Weg 1', plz: '34117', ort: 'Kassel' } };

export function ctx(x: Partial<Kontext> = {}): Kontext {
  return leererKontext({
    heute: MO,
    betrieb: {
      ...basis, id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3,
      adresse: { strasse: 'Hof 1', plz: '34117', ort: 'Kassel' }, telefon: '', email: '', stundensatz: 0,
      zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true,
    },
    kunden: [kunde],
    qualifikationen: [{ ...basis, id: 'q1', name: 'Elektrofachkraft', kategorie: 'fachlich' }],
    ...x,
  });
}
