/** Reine Teile des Service Workers (`src/sw.ts`) */
import { describe, expect, it } from 'vitest';
import { assetsAusHtml, cachebar, zielVonKlick } from '../../sw';

describe('Service Worker', () => {
  it('Tipp auf Benachrichtigung: Aktion → Hinweise mit Aktion, sonst Pfad, sonst Heute', () => {
    const inhalt = { titel: 'Urlaub', pfad: '/betrieb/abwesenheiten', aktionen: [{ aktion: 'urlaub.genehmigen', label: 'Genehmigen', payload: { id: 'u1' } }] };
    expect(zielVonKlick(inhalt, 'urlaub.genehmigen')).toBe(`/macher/hinweise?aktion=urlaub.genehmigen&payload=${encodeURIComponent('{"id":"u1"}')}`);
    expect(zielVonKlick(inhalt, undefined)).toBe('/betrieb/abwesenheiten');
    expect(zielVonKlick({ pfad: '//boese.de' }, undefined)).toBe('/heute');
    expect(zielVonKlick(undefined, undefined)).toBe('/heute');
  });

  it('nur eigene statische Dateien in den Cache – nie Server-Funktionen', () => {
    const h = 'https://app.macher-os.de';
    expect(cachebar(new URL('/assets/index-abc.js', h), h)).toBe(true);
    expect(cachebar(new URL('/icons/icon-192.png', h), h)).toBe(true);
    expect(cachebar(new URL('/api/oeffentlich/lesen', h), h)).toBe(false);
    expect(cachebar(new URL('/sw.js', h), h)).toBe(false);
    expect(cachebar(new URL('https://fremd.de/a.js'), h)).toBe(false);
  });

  it('liest die Assets der App-Shell aus der index.html', () => {
    const html = '<link rel="icon" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest"><script type="module" src="/assets/index-x.js"></script><link rel="stylesheet" href="/assets/index-y.css"><a href="/heute">';
    expect(assetsAusHtml(html).sort()).toEqual(['/assets/index-x.js', '/assets/index-y.css', '/favicon.svg', '/manifest.webmanifest']);
  });
});
