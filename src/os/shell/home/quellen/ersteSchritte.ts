/**
 * „Erste Schritte“: Checkliste für neue Betriebe aus den echten Daten – Häkchen setzen sich von selbst.
 * Nutzt die Regeln aus dem Modul start wieder (Kunden, Team, Briefkopf). Beispieldaten zählen nie.
 * Reine Regeln, ohne Datenbank testbar; `ersteSchritteJetzt()` liest die echten Daten.
 */
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import type { Angebot, Auftrag, Betrieb, Kunde, Mitarbeiter, Rechnung } from '@core/objects';
import { darf } from '@core/session';
import { briefkopfVorSenden, DATEN_UEBERNOMMEN, PLATZHALTER_NAME, START_AUS, startHaken, TEAM_EINGELADEN } from '@modules/start/daten';
import type { Einrichtungsschritt } from './naechsterSchritt';

/** Einstellung zum Wegklicken – dieselbe wie „Macher fertig machen“ im Modul start */
export const ERSTE_SCHRITTE_AUS = START_AUS;

export interface ErsteSchritteStand {
  betrieb?: Pick<Betrieb, 'name' | 'adresse' | 'steuernummer' | 'ustId'>;
  kunden: Pick<Kunde, 'beispiel'>[];
  mitarbeiter: Pick<Mitarbeiter, 'aktiv' | 'beispiel'>[];
  auftraege: Pick<Auftrag, 'beispiel' | 'phase'>[];
  angebote: Pick<Angebot, 'beispiel'>[];
  rechnungen: Pick<Rechnung, 'beispiel'>[];
  teamEingeladen?: boolean;
  datenUebernommen?: boolean;
  /** ohne Geld-Recht gibt es den Schritt „Angebot oder Rechnung“ nicht */
  darfGeld: boolean;
}

const echt = <T extends { beispiel?: boolean }>(x: T) => !x.beispiel;

export function ersteSchritte(s: ErsteSchritteStand): Einrichtungsschritt[] {
  const haken = startHaken({ kunden: s.kunden, mitarbeiter: s.mitarbeiter, teamEingeladen: s.teamEingeladen, datenUebernommen: s.datenUebernommen });
  const kunden = haken.find((h) => h.id === 'kunden')!;
  const team = haken.find((h) => h.id === 'team')!;
  const schritte: Einrichtungsschritt[] = [
    {
      id: 'briefkopf',
      titel: 'Firmendaten für den Briefkopf',
      erledigt: briefkopfVorSenden(s.betrieb, PLATZHALTER_NAME).length === 0,
      aktion: { label: 'Firmendaten ergänzen', pfad: '/betrieb/einstellungen' },
    },
    { id: 'kunde', titel: 'Ersten Kunden anlegen', erledigt: kunden.erledigt, aktion: { label: 'Kunde anlegen', pfad: '/auftraege/kunden/neu' } },
    {
      id: 'auftrag',
      titel: 'Ersten Auftrag anlegen',
      erledigt: s.auftraege.some((a) => echt(a) && a.phase !== 'anfrage'),
      aktion: { label: 'Auftrag anlegen', pfad: '/auftraege/auftraege/neu' },
    },
  ];
  if (s.darfGeld)
    schritte.push({
      id: 'angebot',
      titel: 'Erstes Angebot oder erste Rechnung',
      erledigt: s.angebote.some(echt) || s.rechnungen.some(echt),
      aktion: { label: 'Angebot schreiben', pfad: '/start/angebot' },
    });
  schritte.push({ id: 'team', titel: 'Team einladen', erledigt: team.erledigt, aktion: team.aktion });
  return schritte;
}

/** Stand aus den echten Daten (ohne React – auch für `verbergen` im Raster) */
export function ersteSchritteJetzt(ich: Mitarbeiter): Einrichtungsschritt[] {
  return ersteSchritte({
    betrieb: db.betrieb.get('betrieb'),
    kunden: db.kunden.all(),
    mitarbeiter: db.mitarbeiter.all(),
    auftraege: db.auftraege.all(),
    angebote: db.angebote.all(),
    rechnungen: db.rechnungen.all(),
    teamEingeladen: einstellung(TEAM_EINGELADEN, false),
    datenUebernommen: einstellung(DATEN_UEBERNOMMEN, false),
    darfGeld: darf('geld', ich),
  });
}

/** Der Baustein verschwindet, wenn alles erledigt ist oder er weggeklickt wurde */
export function ersteSchritteVerbergen(ich: Mitarbeiter): boolean {
  return einstellung(ERSTE_SCHRITTE_AUS, false) || ersteSchritteJetzt(ich).every((x) => x.erledigt);
}
