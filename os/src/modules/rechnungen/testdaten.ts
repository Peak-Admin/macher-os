/** Gemeinsame Testdaten für die Tests im Paket „geld“ (nur in *.test.ts verwenden). */
import { db, zuruecksetzen } from '@core/db';
import { heute, plusTage } from '@core/format';
import type { Kunde } from '@core/objects';

export function testBetrieb(extra: Partial<Parameters<typeof db.betrieb.create>[0]> = {}) {
  zuruecksetzen();
  db.betrieb.create({
    id: 'betrieb',
    name: 'Elektro Muster GmbH',
    gewerk: 'elektro',
    arbeitsweisen: ['kundendienst'],
    teamgroesse: 5,
    adresse: { strasse: 'Werkstraße 1', plz: '34117', ort: 'Kassel' },
    telefon: '0561 123456',
    email: 'info@muster.example',
    steuernummer: '026 123 45678',
    iban: 'DE02120300000000202051',
    stundensatz: 6000,
    zahlungszielTage: 14,
    ustSatz: 19,
    arbeitsbeginn: '07:00',
    arbeitsende: '16:00',
    onboardingFertig: true,
    ...extra,
  });
  const kunde = db.kunden.create({
    art: 'privat',
    name: 'Familie Hoffmann',
    ansprechpartner: [],
    email: 'hoffmann@example.de',
    adresse: { strasse: 'Lindenweg 12', plz: '34117', ort: 'Kassel' },
    nummer: 'K-1001',
  });
  const firma = db.kunden.create({
    art: 'firma',
    name: 'Bäckerei Sommer',
    firma: 'Bäckerei Sommer KG',
    ansprechpartner: [],
    email: 'info@sommer.example',
    adresse: { strasse: 'Hauptstraße 41', plz: '34246', ort: 'Vellmar' },
  });
  const auftrag = db.auftraege.create({ nummer: 'A-2026-0001', titel: 'Bad sanieren', art: 'projekt', phase: 'in_arbeit', kundeId: kunde.id });
  return { kunde, firma, auftrag };
}

export function kundeOhneAdresse(): Kunde {
  return db.kunden.create({ art: 'privat', name: 'Ohne Adresse', ansprechpartner: [] });
}

export const vorTagen = (n: number) => plusTage(heute(), -n);
