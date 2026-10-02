/** Foto aufnehmen/auswählen, verkleinern und als Dokument am Auftrag speichern. */
import { db } from '@core/db';
import type { Dokument, ID } from '@core/objects';

/** Bild auf max. Kantenlänge verkleinern (spart Speicher), Ergebnis als Data-URL */
export function bildVerkleinern(datei: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const leser = new FileReader();
    leser.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    leser.onload = () => {
      const roh = String(leser.result);
      const bild = new Image();
      bild.onerror = () => resolve(roh);
      bild.onload = () => {
        const f = Math.min(1, max / Math.max(bild.width, bild.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bild.width * f);
        c.height = Math.round(bild.height * f);
        const ctx = c.getContext('2d');
        if (!ctx) return resolve(roh);
        ctx.drawImage(bild, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.75));
      };
      bild.src = roh;
    };
    leser.readAsDataURL(datei);
  });
}

export async function fotoSpeichern(datei: File, opts: { titel: string; auftragId?: ID; tags?: string[] }): Promise<Dokument> {
  const url = await bildVerkleinern(datei);
  return db.dokumente.create({
    art: 'foto',
    titel: opts.titel,
    url,
    mime: 'image/jpeg',
    groesse: Math.round((url.length * 3) / 4),
    auftragId: opts.auftragId,
    bezug: opts.auftragId ? { typ: 'auftraege', id: opts.auftragId } : undefined,
    tags: opts.tags,
  });
}
