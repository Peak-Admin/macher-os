/**
 * Server-Funktion für Eingangsrechnungen per E-Mail: `belege@<betrieb>.macher-os.de`.
 *
 * Läuft im selben Webhook wie das Anfrage-Postfach (`POST /api/eingang/email`, Route `src/app/api/eingang/email/route.ts`):
 * Ist ein Empfänger ein Belege-Postfach, übernimmt diese Funktion.
 *  → erkennt den Betrieb an der Adresse (Spalte `betriebe.postfach`, sonst eindeutiger Slug aus dem Namen),
 *  → lädt jeden PDF/JPG/PNG-Anhang in den privaten Speicher `dateien/<betrieb>/…` (signierter Link wie in der App),
 *  → legt je Anhang ein Dokument und einen Beleg an (Status „neu“, Quelle „email“, Lieferant-Vorschlag aus dem Absender),
 *  → ignoriert doppelt zugestellte Mails (gleiche Message-ID).
 *
 * Antwortet bei fachlichen Problemen (Betrieb unbekannt, kein passender Anhang) mit 200, damit der Mail-Dienst
 * nicht endlos neu zustellt. Einrichtung: `docs/os/BELEGE-EMAIL.md`.
 */
import { dateiSignatur } from '@/server/cloud/datei';
import type { EingehendeMail } from './postfach';
import { betriebSlug } from './postfach';
import { anhaengeLesen, belegePlanen, type Anhang, type BelegZeile, type LieferantZeile } from './belege-postfach';
import { json, lesen, neueId, objekteLesen, objekteSchreiben, type ObjektZeile, type Verbindung } from './supabase';

/** Betrieb zum Postfach-Slug: Spalte `betriebe.postfach`, sonst – solange sie fehlt – eindeutiger Slug aus dem Namen */
export async function betriebZumSlug(v: Verbindung, slug: string): Promise<{ id: string } | undefined> {
  const mitSpalte = await lesen<{ id: string }>(v, 'betriebe', `select=id&postfach=eq.${encodeURIComponent(slug)}`).catch(() => undefined);
  if (mitSpalte?.length === 1) return mitSpalte[0];
  const betriebe = await lesen<{ id: string; name?: string }>(v, 'betriebe', 'select=id,name');
  const treffer = betriebe.filter((b) => betriebSlug(b.name) === slug);
  return treffer.length === 1 ? treffer[0] : undefined;
}

/** Dateiname für den Speicher: nur `[\w.-]`, wie beim Hochladen aus der App */
export function speicherName(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .slice(-80) || 'beleg'
  );
}

/** Nur öffentliche https-Adressen laden (kein Zugriff auf interne Dienste) */
export function downloadErlaubt(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    return !(h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':'));
  } catch {
    return false;
  }
}

async function inhaltLaden(a: Anhang, maxBytes: number): Promise<Uint8Array> {
  if (a.inhalt) {
    const roh = atob(a.inhalt.replace(/\s+/g, ''));
    const bytes = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
    return bytes;
  }
  if (!a.url || !downloadErlaubt(a.url)) throw new Error(`Anhang ${a.name}: kein Inhalt`);
  const r = await fetch(a.url);
  if (!r.ok) throw new Error(`Anhang ${a.name}: ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength > maxBytes) throw new Error(`Anhang ${a.name}: zu groß`);
  return buf;
}

async function hochladen(v: Verbindung, pfad: string, mime: string, inhalt: Uint8Array): Promise<void> {
  const r = await fetch(`${v.url}/storage/v1/object/dateien/${pfad}`, {
    method: 'POST',
    headers: { apikey: v.schluessel, authorization: `Bearer ${v.schluessel}`, 'content-type': mime, 'x-upsert': 'false' },
    body: inhalt as unknown as BodyInit,
  });
  if (!r.ok) throw new Error(`Hochladen: ${r.status}`);
}

export interface BelegeEingangOptionen {
  v: Verbindung;
  body: unknown;
  mail: EingehendeMail;
  slug: string;
  /** öffentliche Adresse der App ohne `/os` (für den signierten Datei-Link) */
  appBasis: string;
  jetzt?: Date;
  id?: () => string;
}

export async function belegeEingang(o: BelegeEingangOptionen): Promise<Response> {
  const { v, mail } = o;
  try {
    const betrieb = await betriebZumSlug(v, o.slug);
    if (!betrieb) return json({ ok: false, fehler: 'Betrieb nicht gefunden' }, 200);

    const [lieferanten, belege] = await Promise.all([
      objekteLesen<LieferantZeile>(v, betrieb.id, 'lieferanten'),
      objekteLesen<BelegZeile>(v, betrieb.id, 'belege'),
    ]);
    const plan = belegePlanen(mail, anhaengeLesen(o.body), { lieferanten, belege }, { id: o.id ?? neueId, jetzt: o.jetzt ?? new Date() });
    if (plan.doppelt) return json({ ok: true, doppelt: true });
    if (!plan.belege.length) return json({ ok: false, fehler: 'Kein PDF, JPG oder PNG im Anhang', uebersprungen: plan.uebersprungen }, 200);

    const k = { url: v.url, serviceKey: v.schluessel };
    const zeilen: ObjektZeile[] = [];
    const fehler: { name: string; grund: string }[] = [];
    for (let i = 0; i < plan.dokumente.length; i++) {
      const d = plan.dokumente[i];
      const b = plan.belege[i];
      try {
        const inhalt = await inhaltLaden(d.anhang, 10 * 1024 * 1024);
        const pfad = `${betrieb.id}/${neueId().replace(/[^\w]/g, '')}-${speicherName(d.anhang.name)}`;
        await hochladen(v, pfad, d.anhang.mime, inhalt);
        const url = `${o.appBasis.replace(/\/$/, '')}/api/cloud/datei?p=${encodeURIComponent(pfad)}&s=${dateiSignatur(k, pfad)}`;
        zeilen.push({ betrieb_id: betrieb.id, sammlung: 'dokumente', id: d.id, daten: { ...d.daten, url, groesse: inhalt.byteLength } });
        zeilen.push({ betrieb_id: betrieb.id, sammlung: 'belege', id: b.id, daten: b.daten });
      } catch (e) {
        console.error('Belege-Eingang: Anhang', e);
        fehler.push({ name: d.anhang.name, grund: 'konnte nicht gespeichert werden' });
      }
    }
    if (!zeilen.length) return json({ ok: false, fehler: 'Anhänge konnten nicht gespeichert werden', uebersprungen: [...plan.uebersprungen, ...fehler] }, 502);
    await objekteSchreiben(v, zeilen);
    return json({
      ok: true,
      belege: zeilen.filter((z) => z.sammlung === 'belege').map((z) => z.id),
      lieferant: plan.lieferant,
      uebersprungen: [...plan.uebersprungen, ...fehler],
    });
  } catch (e) {
    console.error('Belege-Eingang fehlgeschlagen', e);
    return json({ fehler: e instanceof Error ? e.message : 'Fehler' }, 502);
  }
}
