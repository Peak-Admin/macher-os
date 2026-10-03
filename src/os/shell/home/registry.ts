/**
 * Widget-Bibliothek des Home. Ein neues Widget = ein Eintrag hier (oder `registriereWidget()` aus einem Modul).
 * Welche Widgets jemand sehen und hinzufügen darf, bestimmen Rolle, Rechte und installierte Module –
 * dieselben Regeln wie überall in Handwerk OS.
 */
import { modul } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { darf } from '@core/session';
import type { WidgetDefinition } from './typen';
import { AnsprechpartnerWidget, ArbeitWidget, NaechsterSchrittWidget, NeuWidget } from './widgets/kern';
import {
  AbwesendWidget,
  AnfragenWidget,
  AngeboteWidget,
  AuslastungWidget,
  BetriebHeuteWidget,
  DeinTagWidget,
  EinplanenWidget,
  EinsatzWidget,
  EntscheidungenWidget,
  ErledigtWidget,
  FavoritenWidget,
  NachrichtenWidget,
  NotizWidget,
  OffenePostenWidget,
  SchnellWidget,
  WartungWidget,
  WocheWidget,
  ZahlenWidget,
} from './widgets/bibliothek';

const beide = ['klein', 'gross'] as WidgetDefinition['availableSizes'];

export const WIDGETS: WidgetDefinition[] = [
  // Das Wichtigste – die vier Standard-Widgets
  { id: 'naechster-schritt', name: 'Dein nächster Schritt', description: 'Die eine wichtigste Handlung – Einrichtung, Anfragen, Angebote, Rechnungen.', icon: 'start', objekt: 'werkzeugkiste', kategorie: 'kern', component: NaechsterSchrittWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'links' },
  { id: 'arbeit', name: 'Deine Arbeit', description: 'Aufgaben, Freigaben, Urlaubsaufgaben und vorbereitete Angebote an einer Stelle.', icon: 'liste', objekt: 'hammer', kategorie: 'kern', component: ArbeitWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'links', alle: { label: 'Alle ansehen', pfad: '/auftraege/aufgaben' } },
  { id: 'ansprechpartner', name: 'Dein Ansprechpartner', description: 'Persönliche Betreuung und technischer Support in einem.', icon: 'person', kategorie: 'kern', component: AnsprechpartnerWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'rechts', roles: ['chef', 'buero'] },
  { id: 'neu', name: 'Neu für dich', description: 'Workshops, neue Funktionen, Vorlagen und Tipps.', icon: 'stern', objekt: 'bauplan', kategorie: 'kern', component: NeuWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'rechts' },

  // Tag & Planung
  { id: 'dein-tag', name: 'Dein Tag', description: 'Deine Termine und Aufgaben für heute.', icon: 'heute', kategorie: 'tag', component: DeinTagWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'rechts', modul: 'mein-tag', alle: { label: 'Mein Tag öffnen', pfad: '/heute/mein-tag' } },
  { id: 'einsatz', name: 'Dein nächster Einsatz', description: 'Kunde, Adresse, Aufgabe – und Losfahren mit einem Tipp.', icon: 'auto', kategorie: 'tag', component: EinsatzWidget, availableSizes: beide, defaultSize: 'klein', modul: 'naechster-einsatz', ohneTitel: true },
  { id: 'woche', name: 'Deine Woche', description: 'Die nächsten sieben Tage auf einen Blick.', icon: 'kalender', objekt: 'zollstock', kategorie: 'tag', component: WocheWidget, availableSizes: beide, defaultSize: 'klein', defaultSpalte: 'rechts', alle: { label: 'Kalender öffnen', pfad: '/plan/kalender' } },
  { id: 'betrieb-heute', name: 'Heute im Betrieb', description: 'Was läuft gerade, welcher Termin hat noch niemanden.', icon: 'plan', kategorie: 'tag', component: BetriebHeuteWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['planen'], alle: { label: 'Plan öffnen', pfad: '/plan/kalender' } },
  { id: 'einplanen', name: 'Noch einplanen', description: 'Beauftragte Arbeit ohne Termin.', icon: 'uhr', objekt: 'zollstock', kategorie: 'tag', component: EinplanenWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['planen'], modul: 'offen', alle: { label: 'Zum Einplanen', pfad: '/plan/offen' } },

  // Eingang & Entscheidungen
  { id: 'entscheidungen', name: 'Braucht deine Entscheidung', description: 'Was Macher nicht allein entscheiden darf – das Wichtigste zuerst.', icon: 'macher', kategorie: 'eingang', component: EntscheidungenWidget, availableSizes: beide, defaultSize: 'klein', alle: { label: 'Alle ansehen', pfad: '/heute/braucht-dich' } },
  { id: 'anfragen', name: 'Neue Anfragen', description: 'Kundenanfragen, die noch eine Antwort brauchen.', icon: 'mail', kategorie: 'eingang', component: AnfragenWidget, availableSizes: beide, defaultSize: 'klein', roles: ['chef', 'buero'], modul: 'anfragen', alle: { label: 'Zum Eingang', pfad: '/auftraege/anfragen' } },
  { id: 'nachrichten', name: 'Neue Nachrichten', description: 'Ungelesene Nachrichten von Kunden und aus dem Team.', icon: 'chat', kategorie: 'eingang', component: NachrichtenWidget, availableSizes: beide, defaultSize: 'klein', modul: 'nachrichten', alle: { label: 'Alle Nachrichten', pfad: '/auftraege/nachrichten' } },

  // Geld
  { id: 'angebote', name: 'Offene Angebote', description: 'Wer hat noch nicht geantwortet, wer hat schon geöffnet.', icon: 'dokument', objekt: 'bleistift', kategorie: 'geld', component: AngeboteWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['geld'], modul: 'angebote', alle: { label: 'Alle Angebote', pfad: '/auftraege/angebote' } },
  { id: 'offene-posten', name: 'Offene Rechnungen', description: 'Was noch nicht bezahlt ist – Überfälliges zuerst.', icon: 'euro', kategorie: 'geld', component: OffenePostenWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['geld'], modul: 'rechnungen', alle: { label: 'Offene Posten', pfad: '/betrieb/zahlungen' } },
  { id: 'zahlen', name: 'Monat in Zahlen', description: 'Umsatz, offene Posten, Auftragsbestand – aus deinen echten Rechnungen.', icon: 'diagramm', kategorie: 'geld', component: ZahlenWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['geld'], modul: 'auswertung', alle: { label: 'Auswertung', pfad: '/betrieb/auswertung' } },

  // Team & Betrieb
  { id: 'abwesend', name: 'Wer fehlt heute', description: 'Urlaub, krank, Schule – wer heute nicht da ist.', icon: 'team', objekt: 'handschuhe', kategorie: 'team', component: AbwesendWidget, availableSizes: beide, defaultSize: 'klein', permissions: ['planen'], modul: 'abwesenheiten' },
  { id: 'auslastung', name: 'Auslastung', description: 'Wie voll ist das Team diese und nächste Woche.', icon: 'diagramm', kategorie: 'team', component: AuslastungWidget, availableSizes: ['klein'], defaultSize: 'klein', permissions: ['planen'], modul: 'auslastung', alle: { label: 'Auslastung öffnen', pfad: '/plan/auslastung' } },
  { id: 'wartung', name: 'Fällige Wartungen', description: 'Anlagen, deren Wartung diesen Monat ansteht.', icon: 'werkzeug', objekt: 'schraubenschluessel', kategorie: 'team', component: WartungWidget, availableSizes: beide, defaultSize: 'klein', modul: 'wartung', alle: { label: 'Alle Wartungen', pfad: '/auftraege/wartung' } },
  { id: 'erledigt', name: 'Macher hat erledigt', description: 'Was diese Woche automatisch passiert ist – mit Rückgängig.', icon: 'check', kategorie: 'team', component: ErledigtWidget, availableSizes: beide, defaultSize: 'klein', modul: 'erledigt', alle: { label: 'Alles ansehen', pfad: '/heute/erledigt' } },

  // Abkürzungen
  { id: 'schnell', name: 'Schnell erledigen', description: 'Angebot, Rechnung, Foto, Zeit – direkt loslegen.', icon: 'start', objekt: 'akkuschrauber', kategorie: 'werkzeuge', component: SchnellWidget, availableSizes: beide, defaultSize: 'klein' },
  { id: 'favoriten', name: 'Deine Favoriten', description: 'Die Module aus deiner Seitenleiste mit einem Tipp.', icon: 'stern', objekt: 'werkzeugwand', kategorie: 'werkzeuge', component: FavoritenWidget, availableSizes: ['klein'], defaultSize: 'klein', defaultSpalte: 'rechts' },
  { id: 'notiz', name: 'Dein Merkzettel', description: 'Eine kurze Notiz nur für dich.', icon: 'notiz', kategorie: 'werkzeuge', component: NotizWidget, availableSizes: ['klein'], defaultSize: 'klein', defaultSpalte: 'rechts' },
];

/** Weitere Widgets aus Modulen anmelden (z. B. in `init`). Gleiche ID ersetzt den Eintrag. */
export function registriereWidget(def: WidgetDefinition) {
  const i = WIDGETS.findIndex((w) => w.id === def.id);
  if (i >= 0) WIDGETS[i] = def;
  else WIDGETS.push(def);
}

/** Widgets, die dieser Mensch sehen darf */
export function erlaubteWidgets(ich: Mitarbeiter, alle: WidgetDefinition[] = WIDGETS): WidgetDefinition[] {
  return alle.filter((w) => (!w.roles || w.roles.includes(ich.rolle)) && (w.permissions ?? []).every((r) => darf(r, ich)) && (!w.modul || !!modul(w.modul)));
}
