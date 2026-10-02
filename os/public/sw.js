/*
 * Service Worker von Macher OS – Teil „Takte“: Push anzeigen und Klicks auf Mitteilungen.
 * Nutzlast vom Server-Takt (os/api/takte/cron.ts): { titel, text, pfad, takt, aktionen: [{ aktion, label, payload }] }.
 * Tippt jemand auf einen Aktionsknopf, öffnet sich die Takt-Ansicht mit ?aktion=… und führt die Entscheidung sofort aus.
 * Hinweis für das Paket Aktivierung: Offline-Cache hier ergänzen (ein Service Worker je Scope).
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let n = {};
  try {
    n = e.data ? e.data.json() : {};
  } catch {
    n = { titel: 'Macher OS', text: e.data ? e.data.text() : '' };
  }
  const aktionen = Array.isArray(n.aktionen) ? n.aktionen.slice(0, 2) : [];
  e.waitUntil(
    self.registration.showNotification(n.titel || 'Macher OS', {
      body: n.text || '',
      tag: n.takt ? `takt-${n.takt}` : undefined,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { pfad: n.pfad || '/', takt: n.takt, aktionen },
      actions: aktionen.map((a) => ({ action: a.aktion, title: a.label })),
    }),
  );
});

function link(daten, aktion) {
  const pfad = (daten && daten.pfad) || '/';
  const q = new URLSearchParams({ quelle: 'benachrichtigung' });
  if (aktion) {
    const a = ((daten && daten.aktionen) || []).find((x) => x.aktion === aktion);
    q.set('aktion', aktion);
    if (a && a.payload !== undefined) q.set('payload', JSON.stringify(a.payload));
  }
  return `${pfad}${pfad.includes('?') ? '&' : '?'}${q}`;
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ziel = link(e.notification.data, e.action);
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenster) => {
      const offen = fenster.find((f) => new URL(f.url).origin === self.location.origin);
      if (offen) return offen.navigate(ziel).then((f) => (f || offen).focus());
      return self.clients.openWindow(ziel);
    }),
  );
});
