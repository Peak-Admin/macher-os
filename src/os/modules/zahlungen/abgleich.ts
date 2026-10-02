/**
 * Automatischer Zahlungsabgleich.
 *
 * Kontoumsatz (CSV, CAMT.053 oder Bankverbindung) → Rechnungsnummer (auch verstümmelt, z. B. „RE 2026 42“),
 * Betrag und Kunde (Name, IBAN, Kundennummer) erkennen → passende offene Rechnung bewerten (Punkte) →
 * eindeutig: Zahlung buchen (im Erledigt-Protokoll, rückgängig machbar) · sonst: Vorschlag zum Zuordnen.
 * Bezahlt / teilweise bezahlt / Skonto / Überzahlung ergibt sich aus dem offenen Betrag.
 *
 * Der Rechnungsstatus folgt den Zahlungen (`statusAbgleichen` → Event `rechnung.bezahlt`), damit hört auch
 * das Mahnwesen auf, denn es arbeitet nur mit offenen Posten.
 */
import { batch, db, vermerken } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import { euro } from '@core/format';
import type { Cent, ID, Kunde } from '@core/objects';
import { offenerBetrag, offenePosten, rechnungsSummen } from '../rechnungen/logik';
import { rechnungX, type RechnungX } from '../rechnungen/typen';
import { bankumsaetze, type Bankumsatz, type UmsatzQuelle } from './daten';
import { zahlungBuchen, zahlungLoeschen, type Umsatz } from './logik';

export const AUTOMATION_ABGLEICH = 'zahlungen.abgleich';

/** Skonto wird bis zu dieser Differenz (Prozent des Rechnungsbetrags) als solches erkannt */
export const SKONTO_MAX_PROZENT = 3;

// ------------------------------------------------------------------ Rechnungsnummern

export interface NummerTeile {
  praefix?: string;
  jahr?: number;
  lfd: number;
}

/** „R-2026-0042“ → { praefix: 'R', jahr: 2026, lfd: 42 } */
export function nummerTeile(nummer: string | undefined): NummerTeile | undefined {
  const s = (nummer ?? '').trim();
  const m = s.match(/^([A-Za-z]*)\D*?(\d{4})\D+(\d+)$/);
  if (m && Number(m[2]) >= 1990 && Number(m[2]) <= 2099) return { praefix: m[1].toUpperCase() || undefined, jahr: Number(m[2]), lfd: Number(m[3]) };
  const n = s.match(/(\d+)$/);
  return n ? { lfd: Number(n[1]) } : undefined;
}

export interface Fundstelle {
  jahr?: number;
  lfd: number;
  /** mit Jahr gefunden (sicherer) */
  stark: boolean;
}

const TRENNER = '[\\s\\-/._:#]{0,3}';

/**
 * Rechnungsnummern in einem Verwendungszweck finden – auch verstümmelt:
 * „R-2026-0042“, „RE 2026 42“, „Rg.Nr. 2026/42“, „R20260042“, „Rechnung 42“ (ohne Jahr = schwach).
 */
export function nummernImText(text: string): Fundstelle[] {
  const s = ` ${text} `;
  const funde: Fundstelle[] = [];
  const schon = new Set<string>();
  const merke = (f: Fundstelle) => {
    const k = `${f.jahr ?? ''}:${f.lfd}`;
    if (schon.has(k)) return;
    schon.add(k);
    funde.push(f);
  };
  const mitJahr = new RegExp(`(\\d?)(20\\d{2})${TRENNER}(\\d{1,6})(?!\\d)`, 'g');
  for (const m of s.matchAll(mitJahr)) {
    if (m[1]) continue; // Teil einer längeren Zahl (IBAN, Betrag)
    const start = m.index ?? 0;
    const davor = s.slice(Math.max(0, start - 6), start);
    const danach = s.slice(start + m[0].length, start + m[0].length + 3);
    if (/\d{1,2}[./]\d{1,2}[./]$/.test(davor)) continue; // „05.09.2026 …“ – das Jahr eines Datums
    if (/^[-./]\d/.test(danach)) continue; // „2026-09-05“ – ein Datum
    const lfd = Number(m[3]);
    if (lfd > 0) merke({ jahr: Number(m[2]), lfd, stark: true });
  }
  const ohneJahr = /(?:^|[^a-zäöüß])(?:rechnungs?\s*-?\s*(?:nr|nummer)|rechnung|rechn|rg|re|rnr|r)\.?[\s-]*(?:nr\.?|nummer)?\s*[:#.]?\s*-?\s*0*(\d{1,6})(?![\d]|[\s\-/._]{1,3}\d)/gi;
  for (const m of s.matchAll(ohneJahr)) {
    const lfd = Number(m[1]);
    if (lfd > 0 && !funde.some((f) => f.lfd === lfd)) merke({ lfd, stark: false });
  }
  return funde;
}

const kern = (s: string | undefined) => (s ?? '').replace(/[^0-9a-z]/gi, '').toLowerCase();

/** Wie gut passt die Rechnungsnummer zum Verwendungszweck? */
export function nummerPasst(r: Pick<RechnungX, 'nummer'>, zweck: string, funde: Fundstelle[] = nummernImText(zweck)): 'stark' | 'schwach' | undefined {
  if (!r.nummer) return undefined;
  const k = kern(r.nummer);
  if (k.length >= 5 && kern(zweck).includes(k)) return 'stark';
  const t = nummerTeile(r.nummer);
  if (!t) return undefined;
  if (t.jahr != null && funde.some((f) => f.stark && f.jahr === t.jahr && f.lfd === t.lfd)) return 'stark';
  if (funde.some((f) => !f.stark && f.lfd === t.lfd)) return 'schwach';
  return undefined;
}

// ------------------------------------------------------------------ Kunde erkennen

const FUELLWOERTER = new Set(['familie', 'gmbh', 'herr', 'frau', 'firma', 'und', 'co', 'kg', 'ohg', 'gbr', 'mbh', 'e.k.', 'ag']);

export function nameTreffer(name: string, zweck: string, k: Kunde | undefined): boolean {
  if (!k) return false;
  const heu = ` ${`${name} ${zweck}`.toLowerCase()} `;
  const woerter = [k.name, k.firma ?? '', ...k.ansprechpartner.map((a) => a.name)]
    .join(' ')
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/)
    .filter((w) => w.length >= 4 && !FUELLWOERTER.has(w));
  return woerter.some((w) => new RegExp(`(^|[^a-zäöüß])${w}($|[^a-zäöüß])`).test(heu));
}

/** IBAN → Kunde aus früheren Zuordnungen (Macher lernt mit jeder bestätigten Zahlung dazu) */
export function ibanKunden(): Map<string, ID> {
  const karte = new Map<string, ID>();
  const mehrdeutig = new Set<string>();
  for (const u of bankumsaetze.where((x) => x.status === 'zugeordnet' && !!x.iban)) {
    for (const zid of u.zahlungIds ?? []) {
      const kundeId = rechnungX(db.zahlungen.get(zid)?.rechnungId)?.kundeId;
      if (!kundeId) continue;
      const da = karte.get(u.iban!);
      if (da && da !== kundeId) mehrdeutig.add(u.iban!);
      karte.set(u.iban!, kundeId);
    }
  }
  for (const i of mehrdeutig) karte.delete(i);
  return karte;
}

// ------------------------------------------------------------------ Bewerten

export type BetragArt = 'gleich' | 'skonto' | 'teil' | 'mehr';

export interface Treffer {
  rechnung: RechnungX;
  /** offen vor dieser Zahlung */
  offen: Cent;
  punkte: number;
  nummer?: 'stark' | 'schwach';
  kunde?: 'iban' | 'kundennummer' | 'name';
  betrag: BetragArt;
  /** offen − gezahlt: > 0 fehlt noch, < 0 zu viel */
  differenz: Cent;
  gruende: string[];
}

export type Entscheidung = 'eindeutig' | 'vorschlag' | 'keine' | 'doppelt';

export interface Teilbuchung {
  rechnungId: ID;
  betrag: Cent;
  /** Rest als Skonto ausbuchen */
  skonto?: Cent;
}

export interface Bewertung {
  umsatz: Umsatz;
  entscheidung: Entscheidung;
  /** beste Treffer zuerst (höchstens drei) */
  treffer: Treffer[];
  /** nur bei `eindeutig`: was gebucht wird (mehrere bei Sammelzahlung) */
  buchungen?: Teilbuchung[];
  /** ein Satz für den Menschen */
  grund: string;
  /** Ergebnis für die Rechnung, z. B. „bezahlt“ oder „teilweise bezahlt, 50,00 € offen“ */
  ergebnis?: string;
}

export function betragArt(offen: Cent, betrag: Cent, zahlbetrag: Cent): BetragArt {
  if (betrag === offen) return 'gleich';
  if (betrag > offen) return 'mehr';
  const rest = offen - betrag;
  return zahlbetrag > 0 && (rest / zahlbetrag) * 100 <= SKONTO_MAX_PROZENT + 0.05 ? 'skonto' : 'teil';
}

const PUNKTE = {
  nummer: { stark: 60, schwach: 25 },
  betrag: { gleich: 30, skonto: 20, teil: 5, mehr: -15 },
  kunde: { iban: 30, kundennummer: 20, name: 20 },
} as const;

export interface Kontext {
  posten: RechnungX[];
  /** in diesem Lauf schon vergebene Beträge je Rechnung */
  vergeben: Map<ID, Cent>;
  iban: Map<string, ID>;
}

export function kontext(posten: RechnungX[] = offenePosten()): Kontext {
  return { posten, vergeben: new Map(), iban: ibanKunden() };
}

export function treffer(u: Umsatz, ctx: Kontext): Treffer[] {
  const funde = nummernImText(u.zweck);
  const ibanKunde = u.iban ? ctx.iban.get(u.iban) : undefined;
  const zweckKern = kern(u.zweck);
  const liste: Treffer[] = [];
  for (const r of ctx.posten) {
    const offen = offenerBetrag(r) - (ctx.vergeben.get(r.id) ?? 0);
    if (offen <= 0) continue;
    const gruende: string[] = [];
    let punkte = 0;
    const nummer = nummerPasst(r, u.zweck, funde);
    if (nummer) {
      punkte += PUNKTE.nummer[nummer];
      gruende.push(nummer === 'stark' ? `Rechnungsnummer ${r.nummer} erkannt` : `Nummer ${nummerTeile(r.nummer)?.lfd} könnte ${r.nummer} sein`);
    }
    const k = db.kunden.get(r.kundeId);
    let kunde: Treffer['kunde'];
    if (ibanKunde && ibanKunde === r.kundeId) kunde = 'iban';
    else if (k?.nummer && kern(k.nummer).length >= 3 && zweckKern.includes(kern(k.nummer))) kunde = 'kundennummer';
    else if (nameTreffer(u.name, u.zweck, k)) kunde = 'name';
    if (kunde) {
      punkte += PUNKTE.kunde[kunde];
      gruende.push(kunde === 'iban' ? 'Konto des Kunden bekannt' : kunde === 'kundennummer' ? 'Kundennummer erkannt' : `Name passt zu ${k?.name}`);
    }
    const art = betragArt(offen, u.betrag, rechnungsSummen(r).zahlbetrag);
    punkte += PUNKTE.betrag[art];
    if (!nummer && !kunde && art !== 'gleich') continue; // nichts spricht für diese Rechnung
    gruende.push(art === 'gleich' ? 'Betrag passt' : art === 'skonto' ? 'Betrag passt mit Skonto' : art === 'teil' ? 'Teilbetrag' : 'mehr als offen');
    liste.push({ rechnung: r, offen, punkte, nummer, kunde, betrag: art, differenz: offen - u.betrag, gruende });
  }
  // gleiche Punkte: ältere Fälligkeit zuerst (offenePosten ist so sortiert, sort ist stabil)
  return liste.sort((a, b) => b.punkte - a.punkte);
}

export function ergebnisText(t: Pick<Treffer, 'betrag' | 'differenz' | 'rechnung'>, mitSkonto = true): string {
  switch (t.betrag) {
    case 'gleich':
      return 'bezahlt';
    case 'skonto':
      return mitSkonto ? `bezahlt mit ${euro(t.differenz)} Skonto` : `teilweise bezahlt, ${euro(t.differenz)} offen`;
    case 'teil':
      return `teilweise bezahlt, ${euro(t.differenz)} offen`;
    case 'mehr':
      return `bezahlt, ${euro(-t.differenz)} zu viel überwiesen`;
  }
}

export const skontoAutomatisch = () => einstellung('zahlungen.skontoAutomatisch', true);

/** Einen Umsatz bewerten. Schreibt nichts – merkt sich nur im Kontext, was vergeben ist. */
export function bewerten(u: Umsatz, ctx: Kontext, vorhanden: Set<string> = new Set()): Bewertung {
  if (u.referenz && vorhanden.has(u.referenz)) return { umsatz: u, entscheidung: 'doppelt', treffer: [], grund: 'Schon importiert' };
  // ältere Importe (vor dem Abgleich) haben nur Zahlungen ohne Umsatz
  const alt = db.zahlungen.all().find((z) => z.quelle === 'kontoauszug' && !z.umsatzId && z.betrag === u.betrag && z.datum === u.datum);
  if (alt) return { umsatz: u, entscheidung: 'doppelt', treffer: [], grund: 'Schon gebucht' };

  const liste = treffer(u, ctx);
  const vergib = (b: Teilbuchung[]) => b.forEach((x) => ctx.vergeben.set(x.rechnungId, (ctx.vergeben.get(x.rechnungId) ?? 0) + x.betrag + (x.skonto ?? 0)));

  // Sammelzahlung: mehrere Rechnungsnummern, Summe passt genau
  const stark = liste.filter((t) => t.nummer === 'stark');
  if (stark.length >= 2 && stark.reduce((s, t) => s + t.offen, 0) === u.betrag) {
    const buchungen = stark.map((t) => ({ rechnungId: t.rechnung.id, betrag: t.offen }));
    vergib(buchungen);
    return { umsatz: u, entscheidung: 'eindeutig', treffer: stark.slice(0, 3), buchungen, grund: `Sammelzahlung für ${stark.map((t) => t.rechnung.nummer).join(', ')}`, ergebnis: 'alle bezahlt' };
  }

  const [best, zweiter] = liste;
  if (!best || best.punkte < 20) return { umsatz: u, entscheidung: 'keine', treffer: liste.slice(0, 3), grund: 'Keine passende Rechnung gefunden' };

  const sicher =
    best.betrag !== 'mehr' &&
    ((best.nummer === 'stark') ||
      (best.nummer === 'schwach' && best.betrag === 'gleich') ||
      ((best.betrag === 'gleich' || best.betrag === 'skonto') && !!best.kunde));
  const abstand = !zweiter || zweiter.punkte <= best.punkte - 15;
  const grund = best.gruende.join(' · ');
  if (sicher && abstand) {
    const skonto = best.betrag === 'skonto' && skontoAutomatisch() ? best.differenz : undefined;
    const buchungen = [{ rechnungId: best.rechnung.id, betrag: u.betrag, skonto }];
    vergib(buchungen);
    return { umsatz: u, entscheidung: 'eindeutig', treffer: liste.slice(0, 3), buchungen, grund, ergebnis: ergebnisText(best, !!skonto) };
  }
  return {
    umsatz: u,
    entscheidung: 'vorschlag',
    treffer: liste.slice(0, 3),
    grund: !abstand ? `${grund} – passt auch zu ${zweiter.rechnung.nummer}` : grund,
    ergebnis: ergebnisText(best),
  };
}

/** Vorschau für einen Import: nichts wird geschrieben */
export function vorschau(umsaetze: Umsatz[]): Bewertung[] {
  const ctx = kontext();
  const vorhanden = new Set(bankumsaetze.allMitGeloeschten().map((u) => u.referenz));
  const liste = mitReferenz(umsaetze, 'csv');
  return liste.map((u) => {
    const b = bewerten(u, ctx, vorhanden);
    if (u.referenz) vorhanden.add(u.referenz);
    return b;
  });
}

// ------------------------------------------------------------------ Speichern und Buchen

const norm = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

/** Umsätze ohne Bankreferenz (CSV) bekommen eine Prüfsumme – gleiche Datei zweimal = keine Dubletten */
export function mitReferenz(umsaetze: Umsatz[], quelle: UmsatzQuelle): Umsatz[] {
  const zaehler = new Map<string, number>();
  return umsaetze.map((u) => {
    if (u.referenz) return u;
    const basis = `${quelle === 'bank' ? 'bank' : 'csv'}:${u.datum}|${u.betrag}|${norm(u.name)}|${norm(u.zweck)}|${u.iban ?? ''}`;
    const n = (zaehler.get(basis) ?? 0) + 1;
    zaehler.set(basis, n);
    return { ...u, referenz: n > 1 ? `${basis}#${n}` : basis };
  });
}

/** Umsätze speichern (Eingänge, ohne Dubletten). Gibt die neu angelegten zurück. */
export function einlesen(umsaetze: Umsatz[], quelle: UmsatzQuelle, opts: { beispiel?: boolean } = {}): { neu: Bankumsatz[]; doppelt: number } {
  const vorhanden = new Set(bankumsaetze.allMitGeloeschten().map((u) => u.referenz));
  const neu: Bankumsatz[] = [];
  let doppelt = 0;
  batch(() => {
    for (const u of mitReferenz(umsaetze, quelle)) {
      if (u.betrag <= 0) continue;
      if (vorhanden.has(u.referenz!)) {
        doppelt++;
        continue;
      }
      vorhanden.add(u.referenz!);
      neu.push(
        bankumsaetze.create({
          referenz: u.referenz!,
          quelle,
          datum: u.datum,
          betrag: u.betrag,
          name: u.name || undefined,
          iban: u.iban,
          zweck: u.zweck,
          status: 'neu',
          ...(opts.beispiel ? { beispiel: true } : {}),
        }),
      );
    }
  });
  return { neu, doppelt };
}

function buchen(u: Bankumsatz, buchungen: Teilbuchung[]): ID[] {
  const ids: ID[] = [];
  for (const b of buchungen) {
    const z = zahlungBuchen({
      rechnungId: b.rechnungId,
      betrag: b.betrag,
      datum: u.datum,
      skonto: b.skonto,
      verwendungszweck: u.zweck,
      quelle: 'kontoauszug',
      zahler: u.name,
      umsatzId: u.id,
    });
    if (z) ids.push(z.id);
  }
  return ids;
}

export interface AbgleichErgebnis {
  zugeordnet: number;
  summe: Cent;
  vorschlaege: number;
  offen: number;
}

/**
 * Alle neuen Umsätze abgleichen. `automatisch`: eindeutige Treffer direkt buchen (im Erledigt-Protokoll mit
 * „Rückgängig“); sonst wird auch ein eindeutiger Treffer nur vorgeschlagen.
 */
export function abgleichen(opts: { automatisch?: boolean; ids?: ID[] } = {}): AbgleichErgebnis {
  const automatisch = opts.automatisch ?? true;
  const ergebnis: AbgleichErgebnis = { zugeordnet: 0, summe: 0, vorschlaege: 0, offen: 0 };
  const neu = bankumsaetze.where((u) => u.status === 'neu' && (!opts.ids || opts.ids.includes(u.id))).sort((a, b) => a.datum.localeCompare(b.datum));
  if (!neu.length) return ergebnis;
  const ctx = kontext();
  const jetzt = new Date().toISOString();
  for (const u of neu) {
    const b = bewerten({ zeile: 0, datum: u.datum, betrag: u.betrag, zweck: u.zweck, name: u.name ?? '', iban: u.iban }, ctx);
    const ids = b.treffer.map((t) => t.rechnung.id);
    if (b.entscheidung === 'eindeutig' && automatisch && b.buchungen) {
      const zahlungIds = buchen(u, b.buchungen);
      if (zahlungIds.length) {
        bankumsaetze.update(u.id, { status: 'zugeordnet', zahlungIds, vorschlagIds: undefined, grund: b.grund, automatisch: true, bearbeitetAm: jetzt }, { text: 'Automatisch zugeordnet' });
        const r = rechnungX(b.buchungen[0].rechnungId);
        const nummern = b.buchungen.map((x) => rechnungX(x.rechnungId)?.nummer).filter(Boolean).join(', ');
        erledigt(AUTOMATION_ABGLEICH, `Zahlung ${euro(u.betrag)} zu ${nummern} zugeordnet`, {
          text: `${u.name || db.kunden.get(r?.kundeId)?.name || ''} · ${b.ergebnis ?? 'bezahlt'} · ${b.grund}`,
          bezug: r ? { typ: 'rechnungen', id: r.id } : undefined,
          rueckgaengig: { aktion: 'zahlung.zuordnung_aufheben', payload: { umsatzId: u.id } },
        });
        ergebnis.zugeordnet++;
        ergebnis.summe += u.betrag;
        continue;
      }
    }
    if (b.entscheidung === 'eindeutig' || b.entscheidung === 'vorschlag') {
      bankumsaetze.update(u.id, { status: 'vorschlag', vorschlagIds: ids, grund: b.grund, bearbeitetAm: jetzt }, { leise: true });
      ergebnis.vorschlaege++;
    } else {
      bankumsaetze.update(u.id, { status: 'offen', vorschlagIds: ids.length ? ids : undefined, grund: b.grund, bearbeitetAm: jetzt }, { leise: true });
      ergebnis.offen++;
    }
  }
  return ergebnis;
}

/** Vorschau einer Zuordnung von Hand: Was passiert mit der Rechnung? */
export function zuordnungVorschau(umsatzId: ID, rechnungId: ID) {
  const u = bankumsaetze.get(umsatzId);
  const r = rechnungX(rechnungId);
  if (!u || !r) return undefined;
  const offen = offenerBetrag(r);
  const art = betragArt(offen, u.betrag, rechnungsSummen(r).zahlbetrag);
  return { offen, art, differenz: offen - u.betrag, rechnung: r };
}

/** Von Hand zuordnen (Bestätigen). `skonto`: Differenz als Skonto ausbuchen. */
export function zuordnen(umsatzId: ID, rechnungId: ID, opts: { skonto?: boolean } = {}): boolean {
  const u = bankumsaetze.get(umsatzId);
  const v = zuordnungVorschau(umsatzId, rechnungId);
  if (!u || !v || u.status === 'zugeordnet' || v.offen <= 0) return false;
  const skonto = opts.skonto && v.differenz > 0 ? v.differenz : undefined;
  const zahlungIds = buchen(u, [{ rechnungId, betrag: u.betrag, skonto }]);
  if (!zahlungIds.length) return false;
  bankumsaetze.update(u.id, { status: 'zugeordnet', zahlungIds, vorschlagIds: undefined, automatisch: false, grund: 'Von Hand zugeordnet', bearbeitetAm: new Date().toISOString() }, { text: `Zu ${v.rechnung.nummer} zugeordnet` });
  return true;
}

/** Zuordnung aufheben: Zahlungen in den Papierkorb, Rechnung wieder offen, Umsatz wartet auf Zuordnung */
export function zuordnungAufheben(umsatzId: ID): boolean {
  const u = bankumsaetze.get(umsatzId);
  if (!u || u.status !== 'zugeordnet') return false;
  const rechnungen = new Set<ID>();
  for (const id of u.zahlungIds ?? []) {
    const z = db.zahlungen.get(id);
    if (z) rechnungen.add(z.rechnungId);
    zahlungLoeschen(id);
  }
  bankumsaetze.update(u.id, { status: 'offen', zahlungIds: undefined, vorschlagIds: [...rechnungen], automatisch: false, grund: 'Zuordnung aufgehoben', bearbeitetAm: new Date().toISOString() }, { text: 'Zuordnung aufgehoben' });
  for (const id of rechnungen) vermerken({ typ: 'rechnungen', id }, 'zahlung.zuordnung_aufgehoben', `Zahlung über ${euro(u.betrag)} wieder gelöst`);
  return true;
}

/** Gehört zu keiner Rechnung (Privateinlage, Erstattung …) */
export function ignorieren(umsatzId: ID) {
  const u = bankumsaetze.get(umsatzId);
  if (!u || u.status === 'zugeordnet') return;
  bankumsaetze.update(u.id, { status: 'ignoriert', bearbeitetAm: new Date().toISOString() }, { text: 'Keine Rechnung' });
}

export function wiederOeffnen(umsatzId: ID) {
  const u = bankumsaetze.get(umsatzId);
  if (!u || u.status !== 'ignoriert') return;
  bankumsaetze.update(u.id, { status: 'offen' }, { text: 'Wieder zum Zuordnen' });
}
