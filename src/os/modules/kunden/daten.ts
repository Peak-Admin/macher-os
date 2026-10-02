/**
 * Kunden: reine Logik für Dubletten-Erkennung und Zusammenführen.
 *
 * Zusammenführen heißt: alle Verweise (kundeId, bezug) zeigen danach auf den
 * Kunden, der bleibt. Der doppelte Kunde wandert in den Papierkorb. Es werden
 * keine Aufträge, Rechnungen o. Ä. kopiert.
 */
import { alleSammlungen, batch, db, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import type { Basis, Bezug, ID, Kunde } from '@core/objects';

// ------------------------------------------------------------------ Normalisieren

const ANREDEN = /\b(familie|fam|herr|herrn|frau|hr|fr|dr|prof|eheleute)\b\.?/g;
const RECHTSFORMEN = /\b(gmbh|ug|kg|ag|ohg|gbr|e\.?k|mbh|co|haftungsbeschränkt)\b\.?/g;

export function normName(s: string | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(ANREDEN, ' ')
    .replace(RECHTSFORMEN, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Telefonnummer auf Ziffern, +49/0049 → 0 */
export function normTelefon(t: string | undefined): string {
  let z = (t ?? '').replace(/[^\d+]/g, '');
  if (z.startsWith('+49')) z = '0' + z.slice(3);
  else if (z.startsWith('0049')) z = '0' + z.slice(4);
  return z.replace(/\D/g, '');
}

export function normEmail(e: string | undefined): string {
  return (e ?? '').trim().toLowerCase();
}

function normStrasse(s: string | undefined): string {
  return normName(s).replace(/strasse\b|str\b/g, 'str').replace(/\s/g, '');
}

function namensTeile(s: string | undefined): string[] {
  return normName(s)
    .split(' ')
    .filter((w) => w.length >= 3);
}

// ------------------------------------------------------------------ Dubletten

export interface Dublette {
  a: Kunde;
  b: Kunde;
  gruende: string[];
}

type KundeVergleich = Pick<Kunde, 'name' | 'firma' | 'telefon' | 'email' | 'adresse' | 'ansprechpartner'>;

/** Gründe, warum zwei Kunden dieselbe Person/Firma sein könnten (leer = keine Dublette) */
export function dublettenGruende(a: KundeVergleich, b: KundeVergleich): string[] {
  const g: string[] = [];
  const telA = [a.telefon, ...(a.ansprechpartner ?? []).map((x) => x.telefon)].map(normTelefon).filter((t) => t.length >= 6);
  const telB = new Set([b.telefon, ...(b.ansprechpartner ?? []).map((x) => x.telefon)].map(normTelefon).filter((t) => t.length >= 6));
  if (telA.some((t) => telB.has(t))) g.push('gleiche Telefonnummer');
  if (normEmail(a.email) && normEmail(a.email) === normEmail(b.email)) g.push('gleiche E-Mail');

  const na = normName(a.name);
  const nb = normName(b.name);
  const ta = namensTeile(a.name).sort().join(' ');
  const tb = namensTeile(b.name).sort().join(' ');
  if (na && (na === nb || (ta && ta === tb))) g.push('gleicher Name');
  else if (a.adresse && b.adresse && normStrasse(a.adresse.strasse) && normStrasse(a.adresse.strasse) === normStrasse(b.adresse.strasse) && a.adresse.plz === b.adresse.plz) {
    const gemeinsam = namensTeile(a.name).some((w) => namensTeile(b.name).includes(w));
    if (gemeinsam) g.push('ähnlicher Name und gleiche Adresse');
  }
  return g;
}

export const paarSchluessel = (a: ID, b: ID) => [a, b].sort().join('|');

export function findeDubletten(kunden: Kunde[], ignoriert: Set<string> = new Set()): Dublette[] {
  const liste: Dublette[] = [];
  for (let i = 0; i < kunden.length; i++) {
    for (let j = i + 1; j < kunden.length; j++) {
      const a = kunden[i];
      const b = kunden[j];
      if (ignoriert.has(paarSchluessel(a.id, b.id))) continue;
      const gruende = dublettenGruende(a, b);
      if (gruende.length) liste.push({ a, b, gruende });
    }
  }
  return liste;
}

/** Mögliche Dubletten zu einem Kunden, der gerade angelegt wird */
export function aehnlicheKunden(neu: KundeVergleich, kunden: Kunde[]): Kunde[] {
  return kunden.filter((k) => dublettenGruende(neu, k).length > 0);
}

const IGNORIERT_KEY = 'kunden.keineDubletten';

export function ignorierteDubletten(): Set<string> {
  return new Set(einstellung<string[]>(IGNORIERT_KEY, []));
}

export function keineDublette(a: ID, b: ID) {
  const s = ignorierteDubletten();
  s.add(paarSchluessel(a, b));
  setzeEinstellung(IGNORIERT_KEY, [...s]);
}

export function aktuelleDubletten(): Dublette[] {
  return findeDubletten(db.kunden.all(), ignorierteDubletten());
}

// ------------------------------------------------------------------ Zusammenführen

const istKunde = (b: Bezug | undefined, id: ID) => b?.typ === 'kunden' && b.id === id;

/**
 * Hängt alle Verweise von `quelleId` auf `zielId` um, ergänzt fehlende Kontaktdaten
 * beim Ziel und legt die Quelle in den Papierkorb. Rückgabe: Anzahl umgehängter Verweise.
 */
export function kundenZusammenfuehren(zielId: ID, quelleId: ID): number {
  const ziel = db.kunden.get(zielId);
  const quelle = db.kunden.get(quelleId);
  if (!ziel || !quelle || zielId === quelleId) throw new Error('Diese Kunden können nicht zusammengeführt werden.');
  const text = `Kunde zusammengeführt: ${quelle.name} → ${ziel.name}`;
  let n = 0;
  batch(() => {
    // Alle registrierten Sammlungen – Kern und Module (z. B. Serviceverträge, Reklamationen, Bewertungen).
    // Der Zeitstrahl (`ereignisse`) bleibt unverändert: er dokumentiert, was war.
    for (const col of alleSammlungen()) {
      if (col.name === 'kunden' || col.name === 'ereignisse') continue;
      for (const x of col.all() as (Basis & { kundeId?: ID; bezug?: Bezug })[]) {
        if (x.kundeId === quelleId) {
          col.update(x.id, { kundeId: zielId } as Partial<Basis>, { text });
          n++;
        }
        if (istKunde(x.bezug, quelleId)) {
          col.update(x.id, { bezug: { typ: 'kunden', id: zielId } } as Partial<Basis>, { text, leise: true });
          n++;
        }
      }
    }

    // Fehlende Angaben beim bleibenden Kunden ergänzen – die Quelle verschwindet danach.
    const vorhandeneAp = new Set(ziel.ansprechpartner.map((a) => normName(a.name)));
    db.kunden.update(
      zielId,
      {
        telefon: ziel.telefon || quelle.telefon,
        email: ziel.email || quelle.email,
        adresse: ziel.adresse?.strasse ? ziel.adresse : quelle.adresse ?? ziel.adresse,
        firma: ziel.firma || quelle.firma,
        quelle: ziel.quelle ?? quelle.quelle,
        zahlungszielTage: ziel.zahlungszielTage ?? quelle.zahlungszielTage,
        notiz: [ziel.notiz, quelle.notiz].filter(Boolean).join('\n') || undefined,
        ansprechpartner: [...ziel.ansprechpartner, ...quelle.ansprechpartner.filter((a) => !vorhandeneAp.has(normName(a.name)))],
      },
      { text: `Zusammengeführt mit ${quelle.name}` },
    );
    db.kunden.remove(quelleId);
    vermerken({ typ: 'kunden', id: quelleId }, 'kunde.zusammengefuehrt', `In ${ziel.name} zusammengeführt`);
  });
  // Für weitere Verweisfelder (z. B. `empfohlenVonKundeId`) hören Module auf dieses Ereignis.
  emit({ typ: 'kunde.zusammengefuehrt', daten: { zielId, quelleId } });
  return n;
}

/** Anzahl der Verweise auf einen Kunden – für Löschen-Warnung und Zusammenführen-Vorschau */
export function verweiseAufKunde(id: ID) {
  const offen = db.auftraege.where((a) => a.kundeId === id && !['erledigt', 'verloren'].includes(a.phase)).length;
  return {
    auftraege: db.auftraege.where((a) => a.kundeId === id).length,
    offeneAuftraege: offen,
    orte: db.orte.where((o) => o.kundeId === id).length,
    anlagen: db.anlagen.where((a) => a.kundeId === id).length,
    rechnungen: db.rechnungen.where((r) => r.kundeId === id).length,
    offeneRechnungen: db.rechnungen.where((r) => r.kundeId === id && ['versendet', 'teilbezahlt'].includes(r.status)).length,
  };
}

export const KUNDEN_ARTEN: { wert: Kunde['art']; label: string; icon: string }[] = [
  { wert: 'privat', label: 'Privat', icon: 'person' },
  { wert: 'firma', label: 'Firma', icon: 'betrieb' },
  { wert: 'hausverwaltung', label: 'Hausverwaltung', icon: 'ordner' },
  { wert: 'oeffentlich', label: 'Öffentlich', icon: 'schild' },
];

export const QUELLEN: { wert: NonNullable<Kunde['quelle']>; label: string }[] = [
  { wert: 'telefon', label: 'Telefon' },
  { wert: 'email', label: 'E-Mail' },
  { wert: 'website', label: 'Website' },
  { wert: 'empfehlung', label: 'Empfehlung' },
  { wert: 'whatsapp', label: 'WhatsApp' },
  { wert: 'vor_ort', label: 'Vor Ort angesprochen' },
  { wert: 'portal', label: 'Kundenbereich' },
  { wert: 'sonstiges', label: 'Sonstiges' },
];

/** Nächste freie Kundennummer K-1001, K-1002 … */
export function naechsteKundennummer(kunden: Pick<Kunde, 'nummer'>[] = db.kunden.allMitGeloeschten()): string {
  const max = kunden
    .map((k) => Number(k.nummer?.match(/^K-(\d+)$/)?.[1]))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 1000);
  return `K-${max + 1}`;
}
