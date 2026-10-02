/**
 * Service Worker anmelden und – mit Erlaubnis und VAPID-Schlüssel – dieses Gerät für Push abonnieren.
 * Das Abo wird als Einstellung `takte.push-abo.<mitarbeiterId>` gemerkt: Mit verbundenem Konto
 * gelangt es so in `objekte`, wo der Server-Takt es findet (zusätzlich zu `push_abos`).
 */
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import type { ID } from '@core/objects';

export const pushAboSchluessel = (mitarbeiterId: ID) => `takte.push-abo.${mitarbeiterId}`;

export function swAnmelden() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {
    /* ohne Service Worker gibt es nur die Glocke und direkte Mitteilungen */
  });
}

function schluesselAus(b64: string): Uint8Array {
  const roh = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(roh, (c) => c.charCodeAt(0));
}

/** Gerät für Push abonnieren. `false`, wenn es hier nicht geht (kein Schlüssel, kein SW, keine Erlaubnis). */
export async function pushAbonnieren(mitarbeiterId: ID): Promise<boolean> {
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapid || typeof navigator === 'undefined' || !('serviceWorker' in navigator) || typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const abo = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluesselAus(vapid) as BufferSource }));
    const json = abo.toJSON();
    const bisher = einstellung<{ endpoint: string }[]>(pushAboSchluessel(mitarbeiterId), []);
    if (!bisher.some((a) => a.endpoint === json.endpoint)) setzeEinstellung(pushAboSchluessel(mitarbeiterId), [...bisher, json].slice(-5));
    return true;
  } catch {
    return false;
  }
}

/** Ist Push auf diesem Gerät überhaupt möglich (Schlüssel gesetzt)? */
export function pushMoeglich(): boolean {
  return !!import.meta.env.VITE_VAPID_PUBLIC_KEY && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}
