/** Bilder vor dem Speichern verkleinern – Fotos vom Handy sind sonst schnell 5 MB groß. */

export function dateiAlsDataUrl(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    r.readAsDataURL(datei);
  });
}

/** Verkleinert ein Bild auf höchstens `maxBreite` × `maxHoehe` (Seitenverhältnis bleibt). PNG bleibt PNG (Transparenz für Logos). */
export async function bildVerkleinern(datei: File, maxBreite: number, maxHoehe: number): Promise<string> {
  if (!datei.type.startsWith('image/')) throw new Error('Bitte wähle ein Bild (JPG oder PNG).');
  const url = await dateiAlsDataUrl(datei);
  const bild = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Das Bild konnte nicht geöffnet werden.'));
    i.src = url;
  });
  const faktor = Math.min(1, maxBreite / bild.width, maxHoehe / bild.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bild.width * faktor));
  canvas.height = Math.max(1, Math.round(bild.height * faktor));
  const ctx = canvas.getContext('2d');
  if (!ctx) return url;
  ctx.drawImage(bild, 0, 0, canvas.width, canvas.height);
  return datei.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
}
