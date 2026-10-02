/**
 * Bestellungen beim Lieferanten: je Lieferant gebündelt,
 * Status Entwurf → bestellt → teilgeliefert → geliefert.
 * Wareneingang bucht ins Lager und setzt die passenden Materialbuchungen auf „bereit“.
 */
import { batch, db, defineCollection, neueId } from '@core/db';
import { erledigt } from '@core/macher';
import { adresseText, euro, heute, plusTage, zahl, datum } from '@core/format';
import type { Ton } from '@core/modul';
import type { Basis, Cent, Datum, Einheit, ID, Lieferant, Zeitpunkt } from '@core/objects';
import { buchen, HAUPTLAGER, lagerortName, type LagerortId } from '../lager/daten';
import { naechsteNummerFuer } from '@core/nummern';

export interface Bestellposition {
  id: ID;
  artikelId?: ID;
  text: string;
  menge: number;
  einheit: Einheit;
  /** EK netto je Einheit */
  ek: Cent;
  /** bereits geliefert */
  geliefert: number;
  /** Materialbuchungen an Aufträgen, die diese Position abdeckt */
  materialIds?: ID[];
}

export type BestellStatus = 'entwurf' | 'bestellt' | 'teilgeliefert' | 'geliefert' | 'storniert';

export interface Bestellung extends Basis {
  nummer: string;
  lieferantId?: ID;
  status: BestellStatus;
  positionen: Bestellposition[];
  /** Lieferadresse: Lagerort (Hauptlager oder Fahrzeug) */
  lieferort: LagerortId;
  bestelltAm?: Zeitpunkt;
  erwartetAm?: Datum;
  geliefertAm?: Zeitpunkt;
  notiz?: string;
}

export const bestellungen = defineCollection<Bestellung>('bestellungen');

export const STATUS: Record<BestellStatus, { text: string; ton: Ton }> = {
  entwurf: { text: 'Entwurf', ton: 'neutral' },
  bestellt: { text: 'Bestellt', ton: 'aktiv' },
  teilgeliefert: { text: 'Teilweise geliefert', ton: 'aktiv' },
  geliefert: { text: 'Geliefert', ton: 'erfolg' },
  storniert: { text: 'Storniert', ton: 'neutral' },
};

export const istOffen = (b: Bestellung) => b.status === 'entwurf' || b.status === 'bestellt' || b.status === 'teilgeliefert';
export const istUnterwegs = (b: Bestellung) => b.status === 'bestellt' || b.status === 'teilgeliefert';

export function ueberfaellig(b: Bestellung, t: Datum = heute()): boolean {
  return istUnterwegs(b) && !!b.erwartetAm && b.erwartetAm < t;
}

export function restMenge(p: Bestellposition): number {
  return Math.max(0, Math.round((p.menge - p.geliefert) * 1000) / 1000);
}

/** Offene (bestellte oder im Entwurf liegende, noch nicht gelieferte) Menge je Artikel */
export function offeneMengen(): Map<ID, number> {
  const m = new Map<ID, number>();
  for (const b of bestellungen.where(istOffen)) {
    for (const p of b.positionen) {
      if (!p.artikelId) continue;
      m.set(p.artikelId, (m.get(p.artikelId) ?? 0) + restMenge(p));
    }
  }
  return m;
}

/** Materialbuchungen, die bereits in einer offenen Bestellung stecken */
export function materialInBestellung(): Set<ID> {
  const s = new Set<ID>();
  for (const b of bestellungen.where(istOffen)) for (const p of b.positionen) p.materialIds?.forEach((id) => s.add(id));
  return s;
}

export function summe(b: Bestellung): Cent {
  return b.positionen.reduce((s, p) => s + Math.round(p.menge * p.ek), 0);
}

export function naechsteBestellnummer(jahr = new Date().getFullYear()): string {
  return naechsteNummerFuer('B', bestellungen.allMitGeloeschten().map((b) => b.nummer), { jahr });
}

export function neuePosition(p: Omit<Bestellposition, 'id' | 'geliefert'> & { geliefert?: number }): Bestellposition {
  return { geliefert: 0, ...p, id: neueId('pos') };
}

export function bestellungAnlegen(lieferantId: ID | undefined, positionen: Bestellposition[] = [], opts: { beispiel?: boolean } = {}): Bestellung {
  return bestellungen.create({
    nummer: naechsteBestellnummer(),
    lieferantId,
    status: 'entwurf',
    positionen,
    lieferort: HAUPTLAGER,
    beispiel: opts.beispiel,
  });
}

/** Positionen in den offenen Entwurf eines Lieferanten übernehmen (oder neuen Entwurf anlegen). */
export function inEntwurfUebernehmen(lieferantId: ID | undefined, positionen: Omit<Bestellposition, 'id' | 'geliefert'>[]): Bestellung {
  const entwurf = bestellungen.where((b) => b.status === 'entwurf' && b.lieferantId === lieferantId).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm))[0];
  if (!entwurf) return bestellungAnlegen(lieferantId, positionen.map(neuePosition));
  const liste = entwurf.positionen.map((p) => ({ ...p }));
  for (const neu of positionen) {
    const vorhanden = neu.artikelId ? liste.find((p) => p.artikelId === neu.artikelId) : liste.find((p) => !p.artikelId && p.text === neu.text);
    if (vorhanden) {
      vorhanden.menge = Math.round((vorhanden.menge + neu.menge) * 1000) / 1000;
      vorhanden.materialIds = [...new Set([...(vorhanden.materialIds ?? []), ...(neu.materialIds ?? [])])];
    } else liste.push(neuePosition(neu));
  }
  return bestellungen.update(entwurf.id, { positionen: liste })!;
}

export function erwartetAm(l: Lieferant | undefined, ab: Datum = heute()): Datum {
  return plusTage(ab, Math.max(1, l?.lieferzeitTage ?? 2));
}

/** Entwurf → bestellt. Setzt geplante Materialbuchungen auf „bestellt“ und den erwarteten Liefertermin. */
export function alsBestelltMarkieren(id: ID): string | undefined {
  const b = bestellungen.get(id);
  if (!b) return 'Bestellung nicht gefunden.';
  if (b.status !== 'entwurf') return 'Diese Bestellung ist schon raus.';
  if (!b.lieferantId) return 'Wähle zuerst einen Lieferanten.';
  if (!b.positionen.some((p) => p.menge > 0)) return 'Füge mindestens eine Position hinzu.';
  const l = db.lieferanten.get(b.lieferantId);
  batch(() => {
    bestellungen.update(id, { status: 'bestellt', bestelltAm: new Date().toISOString(), erwartetAm: b.erwartetAm ?? erwartetAm(l) }, { text: `Bestellt bei ${l?.name ?? 'Lieferant'}` });
    for (const p of b.positionen)
      for (const mid of p.materialIds ?? []) {
        const m = db.material.get(mid);
        if (m && m.status === 'geplant') db.material.update(mid, { status: 'bestellt' }, { text: `Bestellt mit ${b.nummer}` });
      }
  });
  return undefined;
}

export function stornieren(id: ID) {
  const b = bestellungen.get(id);
  if (!b || b.status === 'geliefert') return;
  batch(() => {
    bestellungen.update(id, { status: 'storniert' }, { text: 'Storniert' });
    for (const p of b.positionen)
      for (const mid of p.materialIds ?? []) {
        const m = db.material.get(mid);
        if (m && m.status === 'bestellt') db.material.update(mid, { status: 'geplant' }, { text: `Bestellung ${b.nummer} storniert` });
      }
  });
}

/**
 * Wareneingang: gelieferte Mengen je Position.
 * Bucht Lagerartikel als Zugang in den Lieferort und setzt abgedeckte Materialbuchungen auf „bereit“.
 */
export function wareneingang(id: ID, mengen: Record<ID, number>, mitarbeiterId?: ID): { positionen: number; bereit: number } {
  const b = bestellungen.get(id);
  if (!b || !istOffen(b) || b.status === 'entwurf') return { positionen: 0, bereit: 0 };
  let anzahl = 0;
  let bereit = 0;
  batch(() => {
    const positionen = b.positionen.map((p) => {
      const menge = Math.max(0, mengen[p.id] ?? 0);
      if (!menge) return p;
      anzahl++;
      if (p.artikelId && db.artikel.get(p.artikelId)) {
        buchen({ art: 'zugang', artikelId: p.artikelId, menge, nach: b.lieferort, bestellungId: b.id, mitarbeiterId, notiz: `Wareneingang ${b.nummer}` });
      }
      const neu = { ...p, geliefert: Math.round((p.geliefert + menge) * 1000) / 1000 };
      // Materialbuchungen der Reihe nach abdecken
      let abgedeckt = neu.geliefert;
      for (const mid of neu.materialIds ?? []) {
        const m = db.material.get(mid);
        if (!m) continue;
        if (abgedeckt + 1e-9 >= m.menge) {
          abgedeckt -= m.menge;
          if (m.status === 'geplant' || m.status === 'bestellt') {
            db.material.update(mid, { status: 'bereit' }, { text: `Geliefert mit ${b.nummer}` });
            bereit++;
          }
        } else break;
      }
      return neu;
    });
    const fertig = positionen.every((p) => restMenge(p) === 0);
    bestellungen.update(
      id,
      { positionen, status: fertig ? 'geliefert' : 'teilgeliefert', geliefertAm: fertig ? new Date().toISOString() : undefined },
      { text: fertig ? 'Vollständig geliefert' : 'Teillieferung eingegangen' },
    );
  });
  if (anzahl) {
    erledigt('bestellungen.wareneingang', `Wareneingang ${b.nummer} ins ${lagerortName(b.lieferort)} gebucht`, {
      text: bereit ? `${bereit} Materialbuchung${bereit === 1 ? '' : 'en'} am Auftrag auf „bereit“ gesetzt.` : undefined,
      bezug: b.lieferantId ? { typ: 'lieferanten', id: b.lieferantId } : undefined,
      minuten: 3 + bereit,
    });
  }
  return { positionen: anzahl, bereit };
}

/** Bestelltext für E-Mail an den Lieferanten */
export function bestelltext(b: Bestellung): string {
  const l = db.lieferanten.get(b.lieferantId);
  const betrieb = db.betrieb.get('betrieb');
  const zeilen = b.positionen
    .filter((p) => p.menge > 0)
    .map((p) => {
      const a = db.artikel.get(p.artikelId);
      const nr = [a?.nummer && `Art.-Nr. ${a.nummer}`, a?.herstellerNummer && `Hersteller-Nr. ${a.herstellerNummer}`, a?.ean && `EAN ${a.ean}`].filter(Boolean).join(', ');
      return `- ${zahl(p.menge)} ${p.einheit} ${p.text}${nr ? ` (${nr})` : ''}`;
    });
  const lieferung = b.lieferort === HAUPTLAGER ? adresseText(betrieb?.adresse) || 'an unsere Firmenadresse' : `${lagerortName(b.lieferort)} – bitte Lieferung vorher abstimmen`;
  return [
    'Hallo,',
    '',
    `wir bestellen hiermit (Bestellnummer ${b.nummer}):`,
    '',
    ...zeilen,
    '',
    l?.kundennummer ? `Unsere Kundennummer: ${l.kundennummer}` : undefined,
    `Lieferung: ${lieferung}`,
    b.erwartetAm ? `Gewünschter Liefertermin: ${datum(b.erwartetAm)}` : undefined,
    b.notiz ? `Hinweis: ${b.notiz}` : undefined,
    '',
    'Bitte bestätigt kurz Liefertermin und Preise.',
    '',
    'Viele Grüße',
    betrieb?.name ?? '',
    betrieb?.telefon ?? '',
  ]
    .filter((z) => z !== undefined)
    .join('\n');
}

export function mailtoLink(b: Bestellung): string {
  const l = db.lieferanten.get(b.lieferantId);
  const betreff = `Bestellung ${b.nummer}${l?.kundennummer ? ` – Kd.-Nr. ${l.kundennummer}` : ''}`;
  return `mailto:${encodeURIComponent(l?.email ?? '')}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(bestelltext(b))}`;
}

export function kurzText(b: Bestellung): string {
  const n = b.positionen.length;
  return `${n} Position${n === 1 ? '' : 'en'} · ${euro(summe(b))} netto`;
}
