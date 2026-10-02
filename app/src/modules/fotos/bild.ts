/** Bilder im Browser verkleinern (Canvas → JPEG), damit sie in den lokalen Speicher passen. */
import { JPEG_QUALITAET, MAX_KANTE, dataUrlBytes, skalierteGroesse } from './daten';

export interface Bild {
  url: string;
  bytes: number;
  breite: number;
  hoehe: number;
  name: string;
}

function ladeBild(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Das Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
}

export async function verkleinern(file: File, max = MAX_KANTE, qualitaet = JPEG_QUALITAET): Promise<Bild> {
  const img = await ladeBild(file);
  const ziel = skalierteGroesse(img.naturalWidth, img.naturalHeight, max);
  const canvas = document.createElement('canvas');
  canvas.width = ziel.breite;
  canvas.height = ziel.hoehe;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Dein Browser kann das Bild nicht verkleinern.');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, ziel.breite, ziel.hoehe);
  ctx.drawImage(img, 0, 0, ziel.breite, ziel.hoehe);
  const url = canvas.toDataURL('image/jpeg', qualitaet);
  return { url, bytes: dataUrlBytes(url), breite: ziel.breite, hoehe: ziel.hoehe, name: file.name };
}

export function alsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    r.readAsDataURL(blob);
  });
}
