/**
 * Unterschriften – gemeinsam genutzt von Abnahme, Berichten und Zusatzleistungen.
 * Das Bild der Unterschrift ist ein `dokument` (Art `unterschrift`) am Auftrag;
 * die Protokolle verweisen nur per ID darauf.
 */
import { db } from '@core/db';
import type { ID, Zeitpunkt } from '@core/objects';
import type { UnterschriftEingabe } from '@ui/index';

export interface UnterschriftDaten {
  dokumentId: ID;
  /** Name in Druckbuchstaben, wie vor Ort eingetragen */
  name: string;
  ort?: string;
  zeitpunkt: Zeitpunkt;
}

export function unterschriftSpeichern(auftragId: ID | undefined, titel: string, e: UnterschriftEingabe, beispiel?: boolean): UnterschriftDaten {
  const d = db.dokumente.create({
    art: 'unterschrift',
    titel,
    url: e.bild,
    mime: e.bild.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
    text: e.name.trim(),
    auftragId,
    fuerKunde: true,
    tags: [],
    beispiel,
  });
  return { dokumentId: d.id, name: e.name.trim(), ort: e.ort?.trim() || undefined, zeitpunkt: new Date().toISOString() };
}

/** Beispiel-Unterschrift als SVG-Linie (für Beispieldaten) */
export function beispielUnterschriftBild(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120"><path d="M20 90c30-60 50-70 60-40s-10 50 10 30 30-60 50-40 0 50 30 30 40-40 60-30 20 30 50 10 40-20 80-10" fill="none" stroke="#374040" stroke-width="3" stroke-linecap="round"/></svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
