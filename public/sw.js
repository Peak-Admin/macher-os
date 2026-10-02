/*
 * Service Worker von Macher OS – Teil „Takte“: Push anzeigen und Klicks auf Mitteilungen.
 * Nutzlast vom Server-Takt (src/app/api/takte/cron): { titel, text, pfad, takt, aktionen: [{ aktion, label, payload, schluessel? }] }.
 * Aktionsknopf mit Schlüssel: Entscheidung geht direkt an /api/takte/aktion – ohne die App zu öffnen, danach kurze Bestätigung.
 * Ohne Schlüssel oder wenn der Server ablehnt: Die Takt-Ansicht öffnet sich mit ?aktion=… und führt die Entscheidung dort aus.
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

function oeffnen(ziel) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenster) => {
    const offen = fenster.find((f) => new URL(f.url).origin === self.location.origin);
    if (offen) return offen.navigate(ziel).then((f) => (f || offen).focus());
    return self.clients.openWindow(ziel);
  });
}

/** Entscheidung auf dem Server ausführen; true = erledigt */
async function aufDemServer(daten, aktion) {
  const a = ((daten && daten.aktionen) || []).find((x) => x.aktion === aktion);
  if (!a || !a.schluessel) return false;
  try {
    const r = await fetch('/api/takte/aktion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schluessel: a.schluessel }) });
    const antwort = await r.json().catch(() => ({}));
    if (!r.ok) {
      // abgelehnt mit Grund (z. B. schon genehmigt) → kurz sagen, nicht die App aufzwingen
      if (r.status === 409 && antwort.fehler) {
        await self.registration.showNotification('Nicht ausgeführt', { body: antwort.fehler, tag: 'takt-ergebnis', data: { pfad: daten.pfad } });
        return true;
      }
      return false;
    }
    await self.registration.showNotification(antwort.text || 'Erledigt', { body: 'Direkt aus der Mitteilung erledigt.', tag: 'takt-ergebnis', data: { pfad: daten.pfad } });
    return true;
  } catch {
    return false;
  }
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const daten = e.notification.data;
  e.waitUntil(
    (e.action ? aufDemServer(daten, e.action) : Promise.resolve(false)).then((erledigt) => (erledigt ? undefined : oeffnen(link(daten, e.action)))),
  );
});
