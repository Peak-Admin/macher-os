/**
 * „Rechnung schreiben“ im Bereich Rechnungen – derselbe Ablauf wie „Rechnung in einer Minute“:
 * Lotte bereitet die passende Rechnung vor, Fortgeschrittenes steht hinter „Weitere Optionen“.
 * Einstieg mit `?auftrag=…`, `?kunde=…` oder `?art=abschlag`.
 */
import { RechnungSchnell } from './RechnungSchnell';

export function RechnungNeu() {
  return <RechnungSchnell />;
}
