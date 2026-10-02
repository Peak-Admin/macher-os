/**
 * Alte Dateien umziehen: Fotos, PDFs und Unterschriften, die noch als Data-URL in Objekten stecken
 * (aus der Zeit ohne Konto), werden nach der Anmeldung in den Speicher geladen und durch ihren Link ersetzt.
 * Das spart Platz im Browser und in der Datenbank. Läuft im Hintergrund, Stück für Stück, und darf abbrechen –
 * beim nächsten Start geht es weiter.
 */
import { alleSammlungen } from './db';

const DATA_URL = /^data:([\w.+-]+\/[\w.+-]+)(;[^,]*)?;base64,/;

const ENDUNG: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

export function dataUrlZuBlob(url: string): Blob | undefined {
  const m = DATA_URL.exec(url);
  if (!m) return undefined;
  const roh = atob(url.slice(url.indexOf(',') + 1));
  const bytes = new Uint8Array(roh.length);
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}

async function ersetzen(wert: unknown, ablegen: (url: string) => Promise<string | undefined>): Promise<unknown> {
  if (typeof wert === 'string') return (await ablegen(wert)) ?? wert;
  if (Array.isArray(wert)) {
    let anders = false;
    const neu = [];
    for (const x of wert) {
      const y = await ersetzen(x, ablegen);
      anders ||= y !== x;
      neu.push(y);
    }
    return anders ? neu : wert;
  }
  if (wert && typeof wert === 'object') {
    let anders = false;
    const neu: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(wert)) {
      const y = await ersetzen(x, ablegen);
      anders ||= y !== x;
      neu[k] = y;
    }
    return anders ? neu : wert;
  }
  return wert;
}

/**
 * Lädt große Data-URLs (ab `abBytes`) über `dateiAblegen` hoch und ersetzt sie im Objekt.
 * Liefert die Zahl der umgezogenen Dateien. `ablegen` muss eine http(s)-Adresse liefern, sonst bleibt alles, wie es ist.
 */
export async function dataUrlsAuslagern(
  dateiAblegen: (datei: Blob, name: string) => Promise<string>,
  opt: { abBytes?: number; hoechstens?: number; weiter?: () => boolean } = {},
): Promise<number> {
  const abBytes = opt.abBytes ?? 20_000;
  const hoechstens = opt.hoechstens ?? 200;
  let n = 0;
  for (const c of alleSammlungen()) {
    for (const obj of c.allMitGeloeschten()) {
      if (n >= hoechstens || opt.weiter?.() === false) return n;
      if (obj.beispiel) continue;
      const patch: Record<string, unknown> = {};
      let nr = 0;
      for (const [feld, wert] of Object.entries(obj)) {
        const neu = await ersetzen(wert, async (url) => {
          if (url.length < abBytes || !DATA_URL.test(url) || n >= hoechstens) return undefined;
          const blob = dataUrlZuBlob(url);
          if (!blob) return undefined;
          const endung = ENDUNG[blob.type] ?? 'bin';
          const ziel = await dateiAblegen(blob, `${c.name}-${obj.id}-${feld}-${++nr}.${endung}`);
          if (!/^https?:\/\//.test(ziel)) return undefined;
          n++;
          return ziel;
        });
        if (neu !== wert) patch[feld] = neu;
      }
      if (Object.keys(patch).length) {
        try {
          c.update(obj.id, patch as never, { leise: true });
        } catch {
          return n; // z. B. Lesemodus – später erneut
        }
      }
    }
  }
  return n;
}
