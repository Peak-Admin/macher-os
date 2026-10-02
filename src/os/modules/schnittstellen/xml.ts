/**
 * Kleiner, toleranter XML-Leser für Austauschformate (GAEB DA XML, CAMT.053).
 *
 * Bewusst ohne DOMParser: läuft gleich im Browser, im Test und auf dem Server.
 * Namensräume werden entfernt (`ns:Ntry` → `Ntry`), Entitäten und CDATA aufgelöst,
 * Kommentare und Verarbeitungsanweisungen übersprungen.
 */

export interface XmlKnoten {
  name: string;
  attr: Record<string, string>;
  kinder: XmlKnoten[];
  /** direkter Text (ohne Text der Kinder) */
  text: string;
}

const ENTITAETEN: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function entitaeten(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (ganz, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : ganz;
    }
    return ENTITAETEN[e.toLowerCase()] ?? ganz;
  });
}

const ohneNs = (n: string) => n.slice(n.indexOf(':') + 1);

/** XML-Text in einen Baum lesen. Wirft bei völlig unlesbarem Inhalt. */
export function xmlLesen(xml: string): XmlKnoten {
  const wurzel: XmlKnoten = { name: '#dokument', attr: {}, kinder: [], text: '' };
  const stapel: XmlKnoten[] = [wurzel];
  const s = xml.replace(/^﻿/, '');
  let i = 0;
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    const oben = stapel[stapel.length - 1];
    if (lt < 0) {
      oben.text += entitaeten(s.slice(i));
      break;
    }
    if (lt > i) oben.text += entitaeten(s.slice(i, lt));
    if (s.startsWith('<!--', lt)) {
      const e = s.indexOf('-->', lt + 4);
      i = e < 0 ? s.length : e + 3;
    } else if (s.startsWith('<![CDATA[', lt)) {
      const e = s.indexOf(']]>', lt + 9);
      oben.text += s.slice(lt + 9, e < 0 ? s.length : e);
      i = e < 0 ? s.length : e + 3;
    } else if (s[lt + 1] === '?' || s[lt + 1] === '!') {
      const e = s.indexOf('>', lt);
      i = e < 0 ? s.length : e + 1;
    } else if (s[lt + 1] === '/') {
      const e = s.indexOf('>', lt);
      const name = ohneNs(s.slice(lt + 2, e < 0 ? s.length : e).trim());
      // bis zum passenden offenen Element zurück (verzeiht fehlende Endtags)
      for (let k = stapel.length - 1; k > 0; k--) {
        if (stapel[k].name === name) {
          stapel.length = k;
          break;
        }
      }
      i = e < 0 ? s.length : e + 1;
    } else {
      // Starttag – Attributwerte dürfen ">" enthalten
      let e = lt + 1;
      let q: string | undefined;
      while (e < s.length) {
        const c = s[e];
        if (q) {
          if (c === q) q = undefined;
        } else if (c === '"' || c === "'") q = c;
        else if (c === '>') break;
        e++;
      }
      const inhalt = s.slice(lt + 1, e);
      const leer = inhalt.endsWith('/');
      const roh = leer ? inhalt.slice(0, -1) : inhalt;
      const m = roh.match(/^\s*([^\s/>]+)/);
      if (!m) throw new Error('Die Datei ist kein gültiges XML.');
      const knoten: XmlKnoten = { name: ohneNs(m[1]), attr: {}, kinder: [], text: '' };
      for (const a of roh.slice(m[0].length).matchAll(/([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
        knoten.attr[ohneNs(a[1])] = entitaeten(a[3] ?? a[4] ?? '');
      }
      oben.kinder.push(knoten);
      if (!leer) stapel.push(knoten);
      i = e + 1;
    }
  }
  if (!wurzel.kinder.length) throw new Error('Die Datei ist kein gültiges XML.');
  return wurzel;
}

/** Erstes Kind mit diesem Namen; Pfad mit `/` (z. B. `BookgDt/Dt`) */
export function kind(k: XmlKnoten | undefined, pfad: string): XmlKnoten | undefined {
  let x = k;
  for (const teil of pfad.split('/')) {
    x = x?.kinder.find((c) => c.name === teil);
    if (!x) return undefined;
  }
  return x;
}

/** Alle direkten Kinder mit diesem Namen */
export function kinder(k: XmlKnoten | undefined, name: string): XmlKnoten[] {
  return k?.kinder.filter((c) => c.name === name) ?? [];
}

/** Alle Nachfahren mit diesem Namen (Tiefensuche, in Dokumentreihenfolge) */
export function alle(k: XmlKnoten | undefined, name: string): XmlKnoten[] {
  const out: XmlKnoten[] = [];
  const gehe = (x: XmlKnoten) => {
    for (const c of x.kinder) {
      if (c.name === name) out.push(c);
      gehe(c);
    }
  };
  if (k) gehe(k);
  return out;
}

/** Gesamter Text eines Knotens inkl. Kinder; Absätze (`p`, `br`, `div`) werden zu Zeilenumbrüchen */
export function textVon(k: XmlKnoten | undefined): string {
  if (!k) return '';
  const teile: string[] = [k.text];
  for (const c of k.kinder) {
    const t = textVon(c);
    teile.push(c.name === 'p' || c.name === 'div' || c.name === 'br' ? `\n${t}\n` : t);
  }
  return teile.join('');
}

/** Text eines Pfads, Leerraum zusammengefasst */
export function wert(k: XmlKnoten | undefined, pfad: string): string {
  return textVon(kind(k, pfad)).replace(/\s+/g, ' ').trim();
}

/** Text mit Absätzen: Zeilen getrimmt, Leerzeilen zusammengefasst */
export function absatzText(k: XmlKnoten | undefined): string {
  return textVon(k)
    .split('\n')
    .map((z) => z.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}
