/**
 * Service Worker von Macher OS (Monteur-App = installierbare PWA), Scope `/os/`.
 *
 * - App-Shell offline: Seitenaufrufe unter `/os/…` zuerst aus dem Netz, ohne Netz die zuletzt geladene App-Seite
 *   (SPA-Rückfall – den Rest regelt der Router der App).
 * - Dateien (`/_next/static/*` mit Hash, Schriften, Icons): zuerst aus dem Cache, sonst Netz – und dann gemerkt.
 * - Server-Funktionen (`/api/*`) gehen immer ans Netz, nie in den Cache.
 * - Push: zeigt die Nachricht mit Aktionen; ein Tipp öffnet `pfad` bzw. `/os/macher/hinweise?aktion=<id>`.
 *
 * `scripts/os-sw.mjs` übersetzt diese Datei vor `dev`/`build` nach `public/os/sw.js`. Keine Abhängigkeiten.
 */

// ---------------------------------------------------------------- Typen (ohne WebWorker-Lib, damit DOM-Typen nicht kollidieren)

interface Erweiterbar extends Event {
  waitUntil(p: Promise<unknown>): void;
}
interface AbrufEreignis extends Erweiterbar {
  request: Request;
  respondWith(r: Response | Promise<Response>): void;
}
interface PushEreignis extends Erweiterbar {
  data?: { json(): unknown; text(): string } | null;
}
interface Benachrichtigung {
  data?: unknown;
  close(): void;
}
interface KlickEreignis extends Erweiterbar {
  action: string;
  notification: Benachrichtigung;
}
interface FensterClient {
  url: string;
  focus(): Promise<FensterClient>;
  navigate?(url: string): Promise<FensterClient | null>;
}
interface NachrichtEreignis extends Erweiterbar {
  data: unknown;
}
interface SwBereich {
  location: Location;
  registration: { showNotification(titel: string, o?: Record<string, unknown>): Promise<void> };
  clients: {
    claim(): Promise<void>;
    matchAll(o?: { type?: string; includeUncontrolled?: boolean }): Promise<FensterClient[]>;
    openWindow(url: string): Promise<FensterClient | null>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(typ: 'install' | 'activate', f: (e: Erweiterbar) => void): void;
  addEventListener(typ: 'fetch', f: (e: AbrufEreignis) => void): void;
  addEventListener(typ: 'push', f: (e: PushEreignis) => void): void;
  addEventListener(typ: 'notificationclick', f: (e: KlickEreignis) => void): void;
  addEventListener(typ: 'message', f: (e: NachrichtEreignis) => void): void;
}

const sw = self as unknown as SwBereich;

// ---------------------------------------------------------------- Cache

export const CACHE = 'macher-os-v2';
/** Pfad der App (wie `BASIS` in `core/basis.ts`) */
const BASIS = '/os';
const SHELL = BASIS;
/** Höchstens so viele Einträge – alte Assets früherer Versionen fallen hinten raus */
const MAX_EINTRAEGE = 250;

/** Was darf in den Cache? Nur eigene, statische Dateien. */
export function cachebar(url: URL, herkunft: string): boolean {
  if (url.origin !== herkunft) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.endsWith('/sw.js')) return false;
  return /^\/_next\/static\//.test(url.pathname) || /^\/os\/icons\//.test(url.pathname) || url.pathname === '/os/manifest.webmanifest';
}

/** Asset-Adressen aus der index.html lesen (Skripte, Stylesheets, Preloads) */
export function assetsAusHtml(html: string): string[] {
  const treffer = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
    const pfad = m[1];
    if (/^\/_next\/static\//.test(pfad) || /^\/os\/icons\//.test(pfad) || pfad === '/os/manifest.webmanifest') treffer.add(pfad.replace(/&amp;/g, '&'));
  }
  return [...treffer];
}

async function aufraeumen() {
  const c = await caches.open(CACHE);
  const schluessel = await c.keys();
  const zuviel = schluessel.length - MAX_EINTRAEGE;
  for (let i = 0; i < zuviel; i++) await c.delete(schluessel[i]);
}

/** App-Shell und ihre Assets vorhalten */
async function shellMerken() {
  const c = await caches.open(CACHE);
  const antwort = await fetch(SHELL, { cache: 'no-cache' });
  if (!antwort.ok) return;
  const html = await antwort.clone().text();
  await c.put(SHELL, antwort);
  await Promise.all(
    [...assetsAusHtml(html), '/os/manifest.webmanifest', '/os/icons/icon-192.png'].map((u) =>
      c.match(u).then((da) => (da ? undefined : c.add(u).catch(() => undefined))),
    ),
  );
}

/** Liste von Adressen (vom Client gemeldet, z. B. bereits geladene Schriften) in den Cache holen */
async function adressenMerken(urls: string[]) {
  const c = await caches.open(CACHE);
  const herkunft = sw.location.origin;
  for (const u of urls.slice(0, 200)) {
    try {
      const url = new URL(u, herkunft);
      if (!cachebar(url, herkunft) || (await c.match(url.pathname))) continue;
      await c.add(url.pathname);
    } catch {
      /* einzelne Datei egal */
    }
  }
  await aufraeumen();
}

sw.addEventListener('install', (e) => {
  e.waitUntil(shellMerken().catch(() => undefined).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n.startsWith('macher-os-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('message', (e) => {
  const d = e.data as { typ?: string; urls?: string[] } | undefined;
  if (d?.typ === 'merken' && Array.isArray(d.urls)) e.waitUntil(adressenMerken(d.urls));
});

async function seite(anfrage: Request): Promise<Response> {
  const c = await caches.open(CACHE);
  try {
    const antwort = await fetch(anfrage);
    // Nur echte HTML-Seiten als neue Shell merken
    if (antwort.ok && (antwort.headers.get('content-type') ?? '').includes('text/html')) await c.put(SHELL, antwort.clone());
    return antwort;
  } catch {
    const shell = await c.match(SHELL);
    if (shell) return shell;
    return new Response('<!doctype html><meta charset="utf-8"><title>Macher OS</title><p style="font-family:sans-serif;padding:24px">Kein Netz. Öffne Macher OS einmal mit Netz, danach geht es auch offline.</p>', {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}

async function datei(anfrage: Request): Promise<Response> {
  const c = await caches.open(CACHE);
  const da = await c.match(anfrage, { ignoreSearch: true });
  if (da) return da;
  const antwort = await fetch(anfrage);
  if (antwort.ok && antwort.type === 'basic') {
    await c.put(anfrage, antwort.clone());
    void aufraeumen();
  }
  return antwort;
}

sw.addEventListener('fetch', (e) => {
  const anfrage = e.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  if (url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;
  if (anfrage.mode === 'navigate') {
    if (url.pathname === BASIS || url.pathname.startsWith(`${BASIS}/`)) e.respondWith(seite(anfrage));
    return;
  }
  if (cachebar(url, sw.location.origin)) e.respondWith(datei(anfrage));
});

// ---------------------------------------------------------------- Push & Benachrichtigungen

export interface PushInhalt {
  titel?: string;
  text?: string;
  pfad?: string;
  /** zum Zusammenfassen gleicher Nachrichten */
  tag?: string;
  aktionen?: { aktion: string; label: string; payload?: unknown }[];
}

/**
 * Wohin führt ein Tipp? Aktion → Hinweise mit Aktion, sonst `pfad`, sonst Heute.
 * `pfad` ist ein Pfad der App (`/heute`) oder schon mit `/os` davor.
 */
export function zielVonKlick(inhalt: PushInhalt | undefined, aktion: string | undefined): string {
  if (aktion) {
    const a = inhalt?.aktionen?.find((x) => x.aktion === aktion);
    const payload = a?.payload !== undefined ? `&payload=${encodeURIComponent(JSON.stringify(a.payload))}` : '';
    return `${BASIS}/macher/hinweise?aktion=${encodeURIComponent(aktion)}${payload}`;
  }
  const pfad = inhalt?.pfad;
  if (!pfad || !pfad.startsWith('/') || pfad.startsWith('//')) return `${BASIS}/heute`;
  return pfad === BASIS || pfad.startsWith(`${BASIS}/`) ? pfad : `${BASIS}${pfad}`;
}

function inhaltLesen(e: PushEreignis): PushInhalt {
  if (!e.data) return {};
  try {
    const roh = e.data.json() as PushInhalt & { title?: string; body?: string };
    return { ...roh, titel: roh.titel ?? roh.title, text: roh.text ?? roh.body };
  } catch {
    return { text: e.data.text() };
  }
}

sw.addEventListener('push', (e) => {
  const inhalt = inhaltLesen(e);
  e.waitUntil(
    sw.registration.showNotification(inhalt.titel || 'Macher OS', {
      body: inhalt.text,
      icon: '/os/icons/icon-192.png',
      badge: '/os/icons/icon-192.png',
      lang: 'de',
      tag: inhalt.tag,
      data: inhalt,
      actions: (inhalt.aktionen ?? []).slice(0, 2).map((a) => ({ action: a.aktion, title: a.label })),
    }),
  );
});

sw.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ziel = new URL(zielVonKlick(e.notification.data as PushInhalt | undefined, e.action || undefined), sw.location.origin).href;
  e.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (fenster) => {
      const offen = fenster.find((f) => new URL(f.url).origin === sw.location.origin);
      if (offen) {
        const neu = offen.navigate ? await offen.navigate(ziel).catch(() => null) : null;
        return (neu ?? offen).focus();
      }
      return sw.clients.openWindow(ziel);
    }),
  );
});
