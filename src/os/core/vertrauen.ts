/**
 * Blauer Vertrauenskasten: gemeinsame Quelle für Website (Footer) und Software (Anmeldung).
 * Reine Daten, keine Importe – so kann jede Seite sie einbinden.
 * Jede Zeile muss belegt sein (`docs/produkt/einwaende.md`, Abschnitt „Datensicherheit“).
 */
export const DATEN_VERTRAUEN = [
  { titel: 'DSGVO-konform', text: 'Mit Vertrag zur Auftragsverarbeitung' },
  { titel: 'Server in Frankfurt', text: 'Deine Daten werden in Deutschland gespeichert' },
  { titel: 'KI nach EU AI Act', text: 'Gekennzeichnet – du entscheidest' },
] as const;
