/**
 * Eingebettete Google-Karte für einen Ort – reine Logik (Adresse der Karte, gemerkte Einwilligung).
 *
 * Die Karte lädt erst nach einem Klick: Beim Laden gehen IP-Adresse und Ort an Google (DSGVO/TTDSG).
 * Mit `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` läuft sie über die offizielle Maps Embed API,
 * ohne Schlüssel über die schlüssellose Einbettung von Google Maps.
 */
import type { Adresse } from '@core/objects';
import { adresseText } from '@core/format';

export interface KartenZiel {
  adresse?: Adresse;
  lat?: number;
  lng?: number;
}

export const KARTEN_ZUSTIMMUNG_KEY = 'macher-os:karten-immer-laden';

/** Suchbegriff für die Karte: Koordinaten, wenn vorhanden, sonst die Adresse */
export function kartenSuche(z: KartenZiel): string | undefined {
  if (typeof z.lat === 'number' && typeof z.lng === 'number') return `${z.lat},${z.lng}`;
  const text = adresseText(z.adresse);
  return text || undefined;
}

export function kartenEinbettung(z: KartenZiel, schluessel?: string): string | undefined {
  const q = kartenSuche(z);
  if (!q) return undefined;
  if (schluessel) {
    const p = new URLSearchParams({ key: schluessel, q, language: 'de', region: 'DE' });
    return `https://www.google.com/maps/embed/v1/place?${p.toString()}`;
  }
  const p = new URLSearchParams({ q, hl: 'de', z: '16', output: 'embed' });
  return `https://maps.google.com/maps?${p.toString()}`;
}

export function kartenImmerLaden(): boolean {
  try {
    return globalThis.localStorage?.getItem(KARTEN_ZUSTIMMUNG_KEY) === '1';
  } catch {
    return false;
  }
}

export function setzeKartenImmerLaden(an: boolean) {
  try {
    if (an) globalThis.localStorage?.setItem(KARTEN_ZUSTIMMUNG_KEY, '1');
    else globalThis.localStorage?.removeItem(KARTEN_ZUSTIMMUNG_KEY);
  } catch {
    /* privater Modus: dann eben jedes Mal fragen */
  }
}
