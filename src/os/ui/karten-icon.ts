/**
 * Strich-Icon für Karten- und Kennzahl-Titel.
 * Damit nicht alle Karten gleich aussehen, leitet `Karte` und `Kennzahl` ein Icon aus dem Titel ab –
 * ausdrücklich gesetzt (`icon="…"`) gewinnt, `icon={false}` schaltet es ab.
 * Reihenfolge zählt: die erste passende Regel gewinnt (Ausnahmen zuerst).
 */
const regeln: [RegExp, string][] = [
  // Ausnahmen und Risiken zuerst
  [/überfällig|braucht dich|mängel|reklamation|notfäll|nacharbeit|deaktiviert|fehlen noch|doppelt/, 'achtung'],
  [/gewährleistung/, 'schild'],
  [/unterschrift|empfang bestätigen|freigabe|abnahme/, 'unterschrift'],
  [/steuerberater/, 'person'],
  [/anruf|rangeht|macher fragt|nachfassen/, 'telefon'],
  [/geräte|benachrichtigung/, 'glocke'],
  [/auftragsbestand/, 'auftraege'],
  [/auslastung/, 'diagramm'],
  [/prüfen und importieren/, 'check'],
  [/wartung|prüf|werkzeug|einsatz-check/, 'werkzeug'],
  [/entwürfe/, 'stift'],
  [/verbraucht/, 'paket'],
  [/verwendet/, 'liste'],
  // Geld
  [/umsatz|kosten|preis|betrag|summe|marge|deckungsbeitrag|lohn|zahlung|posten|eingänge|offen beim kunden|pro jahr|verdient|bringt je|netto|stundensatz|abrechn|abgerechnet|rechnung|konditionen|steuer|zuschläge|datev|^offen$/, 'euro'],
  [/rolle|rechte/, 'schloss'],
  // Verlauf und Zeit
  [/verlauf|zuletzt|letzte änderung|versionen/, 'wiederholen'],
  [/termin|kalender|wann|urlaub|kranktage|abwesenheit|beantragt|serie|einplanen/, 'kalender'],
  [/stunden|zeit|gearbeitet|überstunden|woche|monat|zeitraum|läuft|laufen gerade|arbeit starten|soll bis heute/, 'uhr'],
  // Dinge
  [/fahrzeug/, 'auto'],
  [/lieferant/, 'lager'],
  [/material|artikel|lager|bestand|bestell|lieferung|datanorm|ausstattung/, 'paket'],
  // Menschen und Orte
  [/bewertung|zufriedenheit|empfehlung/, 'stern'],
  [/nachricht|anfrage|postfach|rückmeldung|eingang|gefragt/, 'chat'],
  [/ohne mitarbeiter|team|beschäftigung/, 'team'],
  [/kunde|kontakt|ansprechpartner|^wer\b|steuerberater|konto/, 'person'],
  [/^wo\b|ort|adresse|anlagen/, 'ort'],
  // Inhalte
  [/foto|logo/, 'kamera'],
  [/notiz|bemerkung|beschreibung|inhalt|bestelltext|worum|was ist|was wurde|daraus lernen|steht bei/, 'notiz'],
  [/link|verknüpfen|passt zu|bezug|online/, 'link'],
  [/datensicherung|daten übernehmen|json|datei/, 'download'],
  [/dokument|beleg|vorlage|briefkopf|fußzeile|formular|nummernkreis|platzhalter|kopf|nachweis|spalten/, 'dokument'],
  [/hinzufügen|eintragen|buchen/, 'plus'],
  [/erledigt|abgeschlossen|ausgeführt|abschließen|aufgaben/, 'check'],
  [/checkliste|position|leistung|prüfpunkte/, 'liste'],
  [/quote|auslastung|zahlen|auf einen blick|ergebnis|differenz|soll und ist|^ist$|aktualisiert|ausgelassen/, 'diagramm'],
  [/auftrag|aufträge|einsätze|servicevertr|verträge/, 'auftraege'],
  [/macher|eingeschaltet/, 'macher'],
  [/betrieb|einrichtung|beispieldaten|kundenbereich/, 'betrieb'],
  [/vorschau|so sieht|so arbeitet|so übernimmt|das passiert|ablauf|details|angaben|aktionen/, 'info'],
];

export function kartenIcon(titel: unknown): string | undefined {
  if (typeof titel !== 'string') return undefined;
  const t = titel.toLowerCase().replace(/^\d+\.\s*/, '');
  for (const [muster, icon] of regeln) if (muster.test(t)) return icon;
  return undefined;
}
