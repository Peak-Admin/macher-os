/**
 * E-Mail-Versand über die Server-Funktion `/api/senden` (Resend), solange kein vollständiges Backend verbunden ist.
 *
 * Alles andere am Cloud-Vertrag bleibt lokal. Ist kein `RESEND_API_KEY` gesetzt (Server antwortet 501) oder ist der
 * Server nicht erreichbar, gilt der bisherige Rückfall: Mailprogramm. SMS bleibt beim lokalen Programm.
 */
import { useSyncExternalStore } from 'react';
import { cloud, cloudAktiv, setzeCloud, type Cloud, type Versand, type VersandErgebnis } from './cloud';

const PFAD = '/api/senden';

let emailServer = false;
const hoerer = new Set<() => void>();
const melden = () => hoerer.forEach((h) => h());

/** Kann der Server gerade echte E-Mails verschicken? */
export function emailUeberServer(): boolean {
  return emailServer || cloudAktiv();
}

export function useEmailUeberServer(): boolean {
  return useSyncExternalStore(
    (h) => (hoerer.add(h), () => hoerer.delete(h)),
    emailUeberServer,
    () => false,
  );
}

/** Fragt einmal beim Start, ob E-Mail-Versand eingerichtet ist */
export async function versandPruefen(f: typeof fetch = globalThis.fetch): Promise<boolean> {
  try {
    const r = await f(PFAD, { method: 'GET' });
    const d = r.ok && r.headers.get('content-type')?.includes('json') ? ((await r.json()) as { email?: boolean }) : undefined;
    emailServer = !!d?.email;
  } catch {
    emailServer = false;
  }
  melden();
  return emailServer;
}

/** Cloud mit E-Mail über den Server; alles andere (und jeder Fehlschlag vor dem Versand) bleibt bei `basis`. */
export function mitServerVersand(basis: Cloud, f: typeof fetch = globalThis.fetch): Cloud {
  return {
    ...basis,
    senden: async (v: Versand): Promise<VersandErgebnis> => {
      if (v.kanal !== 'email') return basis.senden(v);
      let r: Response;
      try {
        r = await f(PFAD, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v) });
      } catch {
        return basis.senden(v);
      }
      // nicht eingerichtet (501) oder keine Server-Funktion (404): ehrlicher lokaler Rückfall
      if (r.status === 501 || r.status === 404) {
        emailServer = false;
        melden();
        return basis.senden(v);
      }
      const d = (await r.json().catch(() => ({}))) as { id?: string; fehler?: string };
      return r.ok ? { status: 'gesendet', id: d.id } : { status: 'fehler', fehler: d.fehler ?? `Versand fehlgeschlagen (${r.status})` };
    },
  };
}

/** Beim App-Start: nur wenn kein Backend die Cloud schon gesetzt hat */
export function serverVersandEinrichten() {
  if (cloudAktiv() || typeof window === 'undefined') return;
  setzeCloud(mitServerVersand(cloud()));
  void versandPruefen();
}
