/**
 * Berichte & Protokolle – eigene Sammlung `berichte`.
 * Ein Bericht kopiert nichts: Zeiten, Material, Fotos und Aufgaben werden per ID verwiesen
 * und beim Anzeigen/Drucken aufgelöst.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { datumVon, heute, plusTage, minutenAus } from '@core/format';
import type { Aufgabe, Basis, Datum, Dokument, Gewerk, ID, Materialbuchung, Termin, Zeiteintrag } from '@core/objects';
import type { HinweisVorschlag } from '@core/modul';
import { unterschriftSpeichern, type UnterschriftDaten, type UnterschriftEingabe } from '@modules/abnahme/unterschrift';

export type BerichtArt = 'tagesbericht' | 'regiebericht' | 'rapport' | 'pruefprotokoll';

export const BERICHT_ARTEN: { wert: BerichtArt; label: string; text: string }[] = [
  { wert: 'tagesbericht', label: 'Tagesbericht', text: 'Was heute auf der Baustelle passiert ist.' },
  { wert: 'regiebericht', label: 'Regiebericht', text: 'Stundenlohnarbeiten, die der Kunde gegenzeichnet.' },
  { wert: 'rapport', label: 'Rapport', text: 'Kurzer Arbeitsnachweis für den Kundendienst.' },
  { wert: 'pruefprotokoll', label: 'Prüfprotokoll', text: 'Prüfpunkte mit Ergebnis und Messwerten.' },
];
export const artLabel = (a: BerichtArt) => BERICHT_ARTEN.find((x) => x.wert === a)?.label ?? a;

export interface Pruefpunkt {
  id: string;
  text: string;
  ergebnis?: 'ok' | 'mangel' | 'entfaellt';
  /** Messwert oder Bemerkung */
  wert?: string;
}

export interface Bericht extends Basis {
  nummer: string;
  art: BerichtArt;
  auftragId: ID;
  terminId?: ID;
  datum: Datum;
  /** Was wurde gemacht? */
  taetigkeiten?: string;
  zeitIds: ID[];
  materialIds: ID[];
  fotoIds: ID[];
  aufgabeIds: ID[];
  pruefpunkte?: Pruefpunkt[];
  bemerkung?: string;
  status: 'entwurf' | 'fertig' | 'unterschrieben';
  unterschriftKunde?: UnterschriftDaten;
  /** von Macher vorbereitet */
  automatisch?: boolean;
}

export const berichte = defineCollection<Bericht>('berichte');

// ------------------------------------------------------------------ reine Logik

export function naechsteBerichtNummer(nummern: string[], jahr = new Date().getFullYear()): string {
  const start = `BR-${jahr}-`;
  const max = nummern
    .filter((n) => n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(4, '0')}`;
}

/** Arbeitsminuten eines Zeiteintrags (ohne Pause). Laufende Einträge zählen 0. */
export function minuten(z: Pick<Zeiteintrag, 'start' | 'ende' | 'pauseMinuten'>): number {
  if (!z.ende) return 0;
  let d = minutenAus(z.ende) - minutenAus(z.start);
  if (d < 0) d += 24 * 60;
  return Math.max(0, d - (z.pauseMinuten || 0));
}

export const stundenText = (min: number) => `${(min / 60).toFixed(2).replace('.', ',')} h`;

export interface Quellen {
  zeiten: Zeiteintrag[];
  material: Materialbuchung[];
  dokumente: Dokument[];
  aufgaben: Aufgabe[];
}

/** Was gehört in den Bericht dieses Tages? */
export function sammeln(auftragId: ID, tag: Datum, q: Quellen) {
  const amTag = (iso?: string) => !!iso && datumVon(iso) === tag;
  return {
    zeitIds: q.zeiten.filter((z) => z.auftragId === auftragId && z.datum === tag).map((z) => z.id),
    materialIds: q.material.filter((m) => m.auftragId === auftragId && (m.datum ? m.datum === tag : m.status === 'verbraucht' && amTag(m.geaendertAm))).map((m) => m.id),
    fotoIds: q.dokumente.filter((d) => d.auftragId === auftragId && d.art === 'foto' && amTag(d.erstelltAm)).map((d) => d.id),
    aufgabeIds: q.aufgaben.filter((a) => a.auftragId === auftragId && a.erledigt && amTag(a.erledigtAm)).map((a) => a.id),
  };
}

/** Tätigkeiten aus Notizen und Sprachnotizen des Tages vorbefüllen */
export function taetigkeitenAusNotizen(auftragId: ID, tag: Datum, dokumente: Dokument[]): string {
  return dokumente
    .filter((d) => d.auftragId === auftragId && (d.art === 'notiz' || d.art === 'sprache') && d.text && datumVon(d.erstelltAm) === tag)
    .sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm))
    .map((d) => `- ${d.text!.trim()}`)
    .join('\n');
}

export function standardPruefpunkte(gewerk: Gewerk | undefined): Pruefpunkt[] {
  const basis = ['Sichtprüfung', 'Funktionsprüfung'];
  const je: Partial<Record<Gewerk, string[]>> = {
    elektro: ['Durchgängigkeit Schutzleiter', 'Isolationswiderstand', 'Schleifenimpedanz', 'RCD-Auslöseprüfung', 'Drehfeld'],
    shk: ['Dichtheitsprüfung', 'Druckprüfung', 'Abgasmessung', 'Sicherheitsventil'],
    dach: ['Dichtheit Anschlüsse', 'Befestigung', 'Entwässerung'],
  };
  return [...basis, ...(je[gewerk ?? 'sonstiges'] ?? []), 'Arbeitsplatz sauber übergeben'].map((text, i) => ({ id: `p${i}`, text }));
}

/** Einsätze der letzten 14 Tage, die beendet sind, aber noch keinen fertigen Bericht haben */
export function einsaetzeOhneBericht(termine: Termin[], liste: Bericht[], tag: Datum) {
  const ab = plusTage(tag, -14);
  return termine
    .filter((t) => t.status === 'erledigt' && t.auftragId && (t.art === 'einsatz' || t.art === 'wartung'))
    .filter((t) => {
      const d = datumVon(t.start);
      return d >= ab && d <= tag;
    })
    .map((t) => {
      const passend = liste.filter((b) => b.auftragId === t.auftragId && (b.terminId === t.id || (!b.terminId && b.datum === datumVon(t.start))));
      return { termin: t, entwurf: passend.find((b) => b.status === 'entwurf'), fertig: passend.some((b) => b.status !== 'entwurf') };
    })
    .filter((x) => !x.fertig);
}

// ------------------------------------------------------------------ Schreiben

export function quellen(): Quellen {
  return { zeiten: db.zeiten.all(), material: db.material.all(), dokumente: db.dokumente.all(), aufgaben: db.aufgaben.all() };
}

/** Bericht anlegen (oder passenden Entwurf zurückgeben) – automatisch vorbefüllt */
export function berichtErstellen(opts: { auftragId: ID; terminId?: ID; art?: BerichtArt; datum?: Datum; automatisch?: boolean; beispiel?: boolean }): Bericht {
  const termin = db.termine.get(opts.terminId);
  const tag = opts.datum ?? (termin ? datumVon(termin.start) : heute());
  const art = opts.art ?? (db.auftraege.get(opts.auftragId)?.art === 'kundendienst' ? 'rapport' : 'tagesbericht');
  const vorhanden = berichte
    .all()
    .find((b) => b.auftragId === opts.auftragId && b.status === 'entwurf' && b.art === art && (opts.terminId ? b.terminId === opts.terminId : b.datum === tag));
  if (vorhanden) return vorhanden;
  const q = quellen();
  const b = berichte.create({
    nummer: naechsteBerichtNummer(berichte.allMitGeloeschten().map((x) => x.nummer)),
    art,
    auftragId: opts.auftragId,
    terminId: opts.terminId,
    datum: tag,
    taetigkeiten: taetigkeitenAusNotizen(opts.auftragId, tag, q.dokumente) || undefined,
    ...sammeln(opts.auftragId, tag, q),
    pruefpunkte: art === 'pruefprotokoll' ? standardPruefpunkte(db.betrieb.get('betrieb')?.gewerk) : undefined,
    status: 'entwurf',
    automatisch: opts.automatisch,
    beispiel: opts.beispiel,
  });
  vermerken({ typ: 'auftraege', id: opts.auftragId }, 'bericht.erstellt', `${artLabel(art)} ${b.nummer} ${opts.automatisch ? 'von Macher vorbereitet' : 'angelegt'}`);
  return b;
}

/** Zeiten, Material, Fotos, Aufgaben des Tages neu einlesen */
export function berichtAktualisieren(id: ID) {
  const b = berichte.get(id);
  if (!b || b.status === 'unterschrieben') return;
  berichte.update(id, sammeln(b.auftragId, b.datum, quellen()), { leise: true });
}

export function berichtUnterschreiben(id: ID, e: UnterschriftEingabe) {
  const b = berichte.get(id);
  if (!b || b.status === 'unterschrieben') return;
  const sig = unterschriftSpeichern(b.auftragId, `Unterschrift ${artLabel(b.art)} ${b.nummer}`, e);
  berichte.update(id, { status: 'unterschrieben', unterschriftKunde: sig }, { text: `Unterschrieben von ${sig.name}` });
  vermerken({ typ: 'auftraege', id: b.auftragId }, 'bericht.unterschrieben', `${artLabel(b.art)} ${b.nummer} vom Kunden unterschrieben`);
}

export function berichtHinweise(termine: Termin[], liste: Bericht[], tag: Datum): HinweisVorschlag[] {
  return einsaetzeOhneBericht(termine, liste, tag).map(({ termin, entwurf }) =>
    entwurf
      ? {
          schluessel: `bericht-entwurf:${entwurf.id}`,
          art: 'freigabe',
          titel: `Bericht prüfen und abschließen: ${termin.titel}`,
          text: `Macher hat den ${artLabel(entwurf.art)} vom ${datumVon(termin.start).split('-').reverse().join('.')} vorbereitet. Kurz prüfen, dann abschließen oder unterschreiben lassen.`,
          bezug: { typ: 'auftraege', id: termin.auftragId! },
          gewicht: 48,
          pfad: `/auftraege/berichte/${entwurf.id}`,
        }
      : {
          schluessel: `bericht-fehlt:${termin.id}`,
          art: 'problem',
          titel: `Einsatz beendet, aber kein Bericht: ${termin.titel}`,
          text: 'Ohne Bericht fehlt dir der Nachweis für Stunden und Material.',
          bezug: { typ: 'auftraege', id: termin.auftragId! },
          gewicht: 52,
          aktionen: [{ aktion: 'bericht.erstellen', label: 'Bericht erstellen', primaer: true, payload: { auftragId: termin.auftragId, terminId: termin.id } }],
        },
  );
}
