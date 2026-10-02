/** Gemeinsame Testdaten für die Heute-Module (nur in Tests verwendet). */
import { db, zuruecksetzen } from '@core/db';
import { zeitpunkt } from '@core/format';

export const TAG = '2026-10-02';
export const JETZT = new Date(2026, 9, 2, 10, 0);

export function aufbauen() {
  zuruecksetzen();
  db.betrieb.create({ id: 'betrieb', name: 'Test', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 3, adresse: { strasse: '', plz: '', ort: '' }, telefon: '', email: '', stundensatz: 6000, zahlungszielTage: 14, ustSatz: 19, arbeitsbeginn: '07:00', arbeitsende: '16:00', onboardingFertig: true });
  const ma = (vorname: string, rolle: 'chef' | 'buero' | 'monteur' | 'azubi') =>
    db.mitarbeiter.create({ vorname, nachname: 'T', rolle, wochenstunden: 39, urlaubstageJahr: 30, kostensatz: 3000, aktiv: true });
  const chef = ma('Chefin', 'chef');
  const jonas = ma('Jonas', 'monteur');
  const lukas = ma('Lukas', 'azubi');
  const kunde = db.kunden.create({ art: 'privat', name: 'Familie Hoffmann', ansprechpartner: [], telefon: '0171 1' });
  const ort = db.orte.create({ kundeId: kunde.id, bezeichnung: 'Haus', art: 'haus', adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' }, hinweise: 'Hund im Garten.', telefonVorOrt: '0175 2', ansprechpartnerVorOrt: 'Herr Albers' });
  const auftrag = db.auftraege.create({ nummer: 'A-1', titel: 'Wartung', art: 'wartung', phase: 'beauftragt', kundeId: kunde.id, ortId: ort.id });
  const t = (start: string, ende: string, ids: string[], x: Partial<Parameters<typeof db.termine.create>[0]> = {}, tag = TAG) =>
    db.termine.create({ art: 'einsatz', titel: 'Wartung', start: zeitpunkt(tag, start), ende: zeitpunkt(tag, ende), auftragId: auftrag.id, kundeId: kunde.id, ortId: ort.id, mitarbeiterIds: ids, status: 'geplant', ...x });
  return { chef, jonas, lukas, kunde, ort, auftrag, t };
}
