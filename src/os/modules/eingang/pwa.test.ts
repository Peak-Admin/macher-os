/** Reine Teile des Service Workers (`src/sw.ts`) */
import { describe, expect, it } from 'vitest';
import { assetsAusHtml, cachebar, zielVonKlick } from '../../sw';

describe('Service Worker', () => {
  it('Tipp auf Benachrichtigung: Aktion → Hinweise mit Aktion, sonst Pfad, sonst Heute', () => {
    const inhalt = { titel: 'Urlaub', pfad: '/betrieb/abwesenheiten', aktionen: [{ aktion: 'urlaub.genehmigen', label: 'Genehmigen', payload: { id: 'u1' } }] };
    expect(zielVonKlick(inhalt, 'urlaub.genehmigen')).toBe(`/os/macher/hinweise?aktion=urlaub.genehmigen&payload=${encodeURIComponent('{"id":"u1"}')}`);
    expect(zielVonKlick(inhalt, undefined)).toBe('/os/betrieb/abwesenheiten');
    expect(zielVonKlick({ pfad: '/os/heute' }, undefined)).toBe('/os/heute');
    expect(zielVonKlick({ pfad: '//boese.de' }, undefined)).toBe('/os/heute');
    expect(zielVonKlick(undefined, undefined)).toBe('/os/heute');
    // Takte öffnen ihre Ansicht und führen die Aktion dort aus
    const takt = { tag: 'takt-tagesbrief', pfad: '/os/macher/takte/tagesbrief', aktionen: [{ aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', payload: { id: 'a1' } }] };
    expect(zielVonKlick(takt, undefined)).toBe('/os/macher/takte/tagesbrief?quelle=benachrichtigung');
    expect(zielVonKlick(takt, 'abwesenheit.genehmigen')).toBe(`/os/macher/takte/tagesbrief?quelle=benachrichtigung&aktion=abwesenheit.genehmigen&payload=${encodeURIComponent('{"id":"a1"}')}`);
  });

  it('nur eigene statische Dateien in den Cache – nie Server-Funktionen', () => {
    const h = 'https://app.macher-os.de';
    expect(cachebar(new URL('/_next/static/chunks/abc.js', h), h)).toBe(true);
    expect(cachebar(new URL('/_next/static/media/barlow.woff2', h), h)).toBe(true);
    expect(cachebar(new URL('/os/icons/icon-192.png', h), h)).toBe(true);
    expect(cachebar(new URL('/api/oeffentlich/lesen', h), h)).toBe(false);
    expect(cachebar(new URL('/os/sw.js', h), h)).toBe(false);
    expect(cachebar(new URL('/preise', h), h)).toBe(false);
    expect(cachebar(new URL('https://fremd.de/a.js'), h)).toBe(false);
  });

  it('liest die Assets der App-Shell aus der index.html', () => {
    const html = '<link rel="manifest" href="/os/manifest.webmanifest"><script src="/_next/static/chunks/x.js" async=""></script><link rel="stylesheet" href="/_next/static/css/y.css"><a href="/os/heute">';
    expect(assetsAusHtml(html).sort()).toEqual(['/_next/static/chunks/x.js', '/_next/static/css/y.css', '/os/manifest.webmanifest']);
  });
});
