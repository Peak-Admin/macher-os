/** Dateien – Pläne, PDFs, Zeichnungen als `dokumente` am Auftrag. */
import type { Dokument, DokumentArt } from '@core/objects';
import type { TypTon } from '@core/zeichen';
import type { IconName } from '@ui/index';
import { groesseText } from '@modules/fotos/daten';

export const DATEI_ARTEN: DokumentArt[] = ['datei', 'plan', 'pdf'];
export const istDatei = (d: Pick<Dokument, 'art'>) => DATEI_ARTEN.includes(d.art);

/** Höchstgröße je Datei. Grund: Handwerk OS speichert noch im Browser (wenige MB insgesamt). */
export const MAX_DATEI_BYTES = 1.5 * 1024 * 1024;

export const AKZEPTIERT = '.pdf,image/*,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,.csv';

export const ART_LABEL: Partial<Record<DokumentArt, string>> = {
  pdf: 'PDF',
  plan: 'Plan / Zeichnung',
  datei: 'Datei',
  foto: 'Foto',
  sprache: 'Sprachnotiz',
  notiz: 'Notiz',
  unterschrift: 'Unterschrift',
  bericht: 'Bericht',
  video: 'Video',
};

/** Strich-Icon der Typ-Kachel je Art */
export const ART_ICON: Partial<Record<DokumentArt, IconName>> = { pdf: 'dokument', plan: 'ordner', datei: 'dokument', foto: 'kamera', sprache: 'mikro', notiz: 'notiz', unterschrift: 'unterschrift', bericht: 'notiz' };

/** Farbton der Typ-Kachel je Art – unterscheidet Arten, kein Status */
export const ART_TON: Partial<Record<DokumentArt, TypTon>> = { pdf: 'blau', plan: 'petrol', datei: 'neutral', foto: 'gruen', sprache: 'lila', notiz: 'sand', unterschrift: 'rose', bericht: 'sand', video: 'lila' };

/** Verständliche Meldung, wenn die Datei nicht passt – sonst undefined */
export function dateiFehler(f: { name: string; size: number; type: string }, max = MAX_DATEI_BYTES): string | undefined {
  if (!f.size) return `„${f.name}“ ist leer.`;
  // Bilder werden vor dem Speichern verkleinert – deshalb großzügiger
  if (f.type.startsWith('image/')) return f.size > 25 * 1024 * 1024 ? `„${f.name}“ ist mit ${groesseText(f.size)} zu groß für ein Bild.` : undefined;
  if (f.size > max)
    return `„${f.name}“ ist ${groesseText(f.size)} groß. Hier gehen höchstens ${groesseText(max)} pro Datei, weil Handwerk OS gerade noch im Browser speichert. Verkleinere die Datei (z. B. PDF komprimieren) oder teile sie auf.`;
  return undefined;
}

const PLAN_WOERTER = /(plan|grundriss|schnitt|ansicht|zeichnung|schema|stromlauf|skizze|\.dwg$|\.dxf$)/i;

export function artFuer(name: string, mime: string): DokumentArt {
  if (PLAN_WOERTER.test(name)) return 'plan';
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  return 'datei';
}

/** Dateiname ohne Endung als Titel */
export const titelAusName = (name: string) => name.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[_-]+/g, ' ').trim() || name;

export type Vorschau = 'bild' | 'pdf' | 'audio' | 'text' | 'keine';

export function vorschauArt(d: Pick<Dokument, 'art' | 'mime' | 'url' | 'text'>): Vorschau {
  if (d.mime?.startsWith('image/') && d.url) return 'bild';
  if (d.mime === 'application/pdf' && d.url) return 'pdf';
  if (d.mime?.startsWith('audio/') && d.url) return 'audio';
  if (d.art === 'notiz' || (d.text && !d.url)) return 'text';
  return 'keine';
}

/** Data-URL → Blob (für PDF-Vorschau und Download; Browser blocken data:-PDFs oft) */
export function dataUrlZuBlob(url: string): Blob | undefined {
  if (!url.startsWith('data:')) return undefined;
  const komma = url.indexOf(',');
  if (komma < 0) return undefined;
  const kopf = url.slice(5, komma).split(';');
  const mime = kopf[0] || 'application/octet-stream';
  const daten = url.slice(komma + 1);
  if (!kopf.includes('base64')) return new Blob([decodeURIComponent(daten)], { type: mime });
  const bin = atob(daten);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
