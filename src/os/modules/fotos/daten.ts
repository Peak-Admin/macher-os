/**
 * Fotos & Dokumentation – reine Logik.
 * Fotos, Sprachnotizen und Notizen sind `dokumente` am Auftrag (Kernobjekt, keine eigene Sammlung).
 */
import type { Dokument, ID, Termin, Zeitpunkt } from '@core/objects';

export const FOTO_TAGS = ['Vorher', 'Nachher', 'Mangel'] as const;
export type FotoTag = (typeof FOTO_TAGS)[number];

/** Längste Bildkante nach dem Verkleinern (Speichergrenze im Browser) */
/** Sprachnotizen: höchstens 2 Minuten, sonst wird der Speicher knapp */
export const MAX_SPRACHE_SEKUNDEN = 120;

export const istFoto = (d: Dokument) => d.art === 'foto';
export const istNotizOderSprache = (d: Dokument) => d.art === 'notiz' || d.art === 'sprache';
/** Was im Tab „Fotos“ erscheint */
export const istDoku = (d: Dokument) => istFoto(d) || istNotizOderSprache(d) || d.art === 'video';

/** "1,2 MB", "340 KB" */
export function groesseText(bytes: number | undefined): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Welcher Auftrag läuft gerade für diesen Mitarbeiter? (für die Vorauswahl beim Fotografieren)
 * Vorrang: Termin „vor Ort“ → Termin, der jetzt läuft → nächster Termin heute.
 */
export function laufenderAuftrag(termine: Termin[], mitarbeiterId: ID | undefined, jetzt: Zeitpunkt): ID | undefined {
  if (!mitarbeiterId) return undefined;
  const meine = termine.filter((t) => t.auftragId && t.mitarbeiterIds.includes(mitarbeiterId) && t.status !== 'abgesagt');
  const vorOrt = meine.find((t) => t.status === 'vor_ort');
  if (vorOrt) return vorOrt.auftragId;
  const jetztLaeuft = meine.find((t) => t.start <= jetzt && jetzt <= t.ende);
  if (jetztLaeuft) return jetztLaeuft.auftragId;
  const tag = jetzt.slice(0, 10);
  const spaeter = meine
    .filter((t) => t.start.slice(0, 10) === tag && t.start > jetzt && t.status !== 'erledigt')
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  return spaeter?.auftragId;
}

/** Fotos eines Auftrags nach Tag filtern (leer = alle), neueste zuerst */
export function fotosGefiltert(dokumente: Dokument[], tag?: string): Dokument[] {
  return dokumente
    .filter((d) => istFoto(d) && (!tag || d.tags?.includes(tag)))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
}

/** Für die Abnahme/Abrechnung: fehlen Nachher-Fotos? (nur relevant, wenn es überhaupt Fotos gibt oder Vorher-Fotos) */
export function nachherFehlt(dokumente: Dokument[]): boolean {
  const fotos = dokumente.filter(istFoto);
  return fotos.some((d) => d.tags?.includes('Vorher')) && !fotos.some((d) => d.tags?.includes('Nachher'));
}

/** Titel für neue Einträge, z. B. „Foto 14:32“ */
export function standardTitel(art: 'foto' | 'sprache' | 'notiz', zeit: Date = new Date()): string {
  const uhr = zeit.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${art === 'foto' ? 'Foto' : art === 'sprache' ? 'Sprachnotiz' : 'Notiz'} ${uhr}`;
}

/** Notiztitel aus dem Text: erste Zeile, gekürzt */
export function titelAusText(text: string, max = 60): string {
  const zeile = text.trim().split('\n')[0] ?? '';
  return zeile.length > max ? zeile.slice(0, max - 1).trimEnd() + '…' : zeile;
}
