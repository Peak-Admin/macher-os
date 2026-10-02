/**
 * Ablauf-Engine – Speicher und Anbindung:
 * - `ablaeufe`: angepasste Abläufe des Betriebs. Solange nichts angepasst ist, gelten die Abläufe der
 *   Gewerk-Vorlage (`@core/gewerke`) – ohne Kopie.
 * - `schrittstaende`: welcher Schritt zuletzt für einen Auftrag galt und seit wann (ID = Auftrags-ID).
 *   Die Phase bleibt am Auftrag; hier steht nie eine Kopie davon.
 */
import { batch, db, defineCollection, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { datumVon, heute, plusTage, tageZwischen } from '@core/format';
import { VORLAGE_KEY, ablaufVorlageFuer, vorlageFuer, type SchrittVorlage, type Vorlage } from '@core/gewerke';
import type { Auftrag, Auftragsart, Basis, ID, Zeitpunkt } from '@core/objects';
import { setzePhase } from '@modules/auftraege/daten';
import { kommendeEinsaetze } from '@modules/auftraege/logik';
import { aktuellerSchritt, faelligAm, naechsterSchrittIm, type AblaufDef, type AktuellerSchritt, type Fakten } from './logik';

export interface Ablauf extends Basis, AblaufDef {
  /** aus welcher Vorlage der Ablauf stammt (z. B. `projekt`) */
  vorlageId?: string;
  reihenfolge: number;
}

export interface Schrittstand extends Basis {
  auftragId: ID;
  ablaufId: string;
  /** zuletzt gültiger Schritt */
  schrittId: string;
  /** seit wann dieser Schritt gilt */
  seit: Zeitpunkt;
}

export const ablaeufe = defineCollection<Ablauf>('ablaeufe');
export const schrittstaende = defineCollection<Schrittstand>('schrittstaende');

export const ABLAUF_PFAD = '/betrieb/ablauf';
export const ablaufPfad = (id: string) => `${ABLAUF_PFAD}/${encodeURIComponent(id)}`;

// ------------------------------------------------------------------ Abläufe

/** Vorlage des Betriebs (Gewerk bzw. gewählte Fachrichtung) */
export function aktiveVorlage(): Vorlage {
  return vorlageFuer(db.betrieb.get('betrieb')?.gewerk, einstellung<string | undefined>(VORLAGE_KEY, undefined));
}

const ZEIT = '2026-01-01T00:00:00.000Z';

/** Abläufe aus der Vorlage (nicht gespeichert) */
export function vorlagenAblaeufe(v: Vorlage = aktiveVorlage()): Ablauf[] {
  return v.ablaeufe.map((a, i) => ({ ...a, schritte: a.schritte.map((s) => ({ ...s })), vorlageId: a.id, reihenfolge: i, erstelltAm: ZEIT, geaendertAm: ZEIT }));
}

/** Hat der Betrieb seine Abläufe angepasst? */
export const angepasst = () => ablaeufe.all().length > 0;

/** Alle gültigen Abläufe: angepasste oder die der Vorlage */
export function alleAblaeufe(): Ablauf[] {
  const eigene = ablaeufe.all();
  return eigene.length ? [...eigene].sort((a, b) => a.reihenfolge - b.reihenfolge) : vorlagenAblaeufe();
}

export function ablaufMitId(id: string | undefined): Ablauf | undefined {
  return id ? alleAblaeufe().find((a) => a.id === id) : undefined;
}

/** Vorlage übernehmen, damit sie geändert werden kann (gleiche IDs – laufende Aufträge bleiben zugeordnet) */
export function anpassen(): void {
  if (angepasst()) return;
  const liste = vorlagenAblaeufe();
  batch(() => {
    for (const a of liste) {
      const { erstelltAm: _e, geaendertAm: _g, ...rest } = a;
      void _e;
      void _g;
      if (ablaeufe.allMitGeloeschten().some((x) => x.id === a.id)) ablaeufe.purge(a.id);
      ablaeufe.create(rest);
    }
  });
}

/** Zurück zur Vorlage: eigene Abläufe in den Papierkorb */
export function aufVorlageZuruecksetzen(): void {
  batch(() => ablaeufe.all().forEach((a) => ablaeufe.remove(a.id)));
}

/** Einen Ablauf speichern (übernimmt vorher die Vorlage, falls noch nicht geschehen) */
export function ablaufSpeichern(a: Pick<Ablauf, 'id' | 'name' | 'arten' | 'schritte'>): Ablauf | undefined {
  anpassen();
  if (ablaeufe.get(a.id) && !ablaeufe.get(a.id)!.geloeschtAm) return ablaeufe.update(a.id, { name: a.name, arten: a.arten, schritte: a.schritte });
  return ablaeufe.create({ id: a.id, name: a.name, arten: a.arten, schritte: a.schritte, reihenfolge: ablaeufe.all().length });
}

/** Welcher Ablauf gilt für einen Auftrag? Einmal zugeordnet bleibt er, sonst nach Auftragsart. */
export function ablaufFuer(a: Pick<Auftrag, 'id' | 'art'>): Ablauf {
  const liste = alleAblaeufe();
  const stand = schrittstaende.get(a.id);
  return liste.find((x) => x.id === stand?.ablaufId) ?? liste.find((x) => x.arten.includes(a.art)) ?? liste[0] ?? vorlagenAblaeufe()[0];
}

export function ablaufFuerArt(art: Auftragsart): Ablauf {
  return alleAblaeufe().find((x) => x.arten.includes(art)) ?? alleAblaeufe()[0] ?? { ...ablaufVorlageFuer(aktiveVorlage(), art), reihenfolge: 0, erstelltAm: ZEIT, geaendertAm: ZEIT };
}

// ------------------------------------------------------------------ Schrittstand

/** Fakten zum Auftrag aus den verbundenen Objekten (nichts kopiert, nur gelesen) */
export function fakten(auftragId: ID): Fakten {
  const termine = db.termine.where((t) => t.auftragId === auftragId);
  const material = db.material.where((m) => m.auftragId === auftragId);
  const rechnungen = db.rechnungen.where((r) => r.auftragId === auftragId && r.status !== 'storniert' && (r.art === 'rechnung' || r.art === 'schluss'));
  return {
    besichtigung_geplant: termine.some((t) => t.art === 'besichtigung' && t.status !== 'abgesagt'),
    angebot_versendet: db.angebote.where((x) => x.auftragId === auftragId).some((x) => x.status === 'versendet'),
    material_bestellt: material.some((m) => m.status !== 'geplant'),
    material_bereit: material.length > 0 && material.every((m) => m.status === 'bereit' || m.status === 'verbraucht'),
    termin_geplant: kommendeEinsaetze(termine).length > 0,
    rechnung_versendet: rechnungen.some((r) => r.status === 'versendet' || r.status === 'teilbezahlt'),
  };
}

export interface Stand extends AktuellerSchritt {
  ablauf: Ablauf;
  /** seit wann der Schritt gilt (ISO) */
  seit?: string;
  /** Frist (YYYY-MM-DD), wenn der Schritt eine hat */
  faellig?: string;
  ueberfaellig: boolean;
  zustaendigId?: ID;
}

/** Wo steht der Auftrag? – live berechnet */
export function standVon(a: Auftrag, ueberschreiben?: string): Stand {
  const ablauf = ablaufFuer(a);
  const gespeichert = schrittstaende.get(a.id);
  const basis = ueberschreiben ?? (gespeichert?.ablaufId === ablauf.id ? gespeichert.schrittId : undefined);
  const akt = aktuellerSchritt(ablauf, a.phase, basis, fakten(a.id));
  const seit = gespeichert && gespeichert.schrittId === akt.schritt.id ? gespeichert.seit : a.geaendertAm;
  const faellig = akt.fertig || a.phase === 'verloren' ? undefined : faelligAm(seit ? datumVon(seit) : undefined, akt.schritt.fristTage, plusTage);
  return { ...akt, ablauf, seit, faellig, ueberfaellig: !!faellig && faellig < heute(), zustaendigId: zustaendigFuer(a, akt.schritt) };
}

/** Wer ist für den Schritt zuständig? */
export function zustaendigFuer(a: Pick<Auftrag, 'id' | 'verantwortlichId'>, s: SchrittVorlage): ID | undefined {
  const aktiv = db.mitarbeiter.where((m) => m.aktiv);
  switch (s.zustaendig) {
    case 'verantwortlich':
      return a.verantwortlichId;
    case 'buero':
      return (aktiv.find((m) => m.rolle === 'buero') ?? aktiv.find((m) => m.rolle === 'chef'))?.id;
    case 'chef':
      return aktiv.find((m) => m.rolle === 'chef')?.id;
    case 'eingeplant':
      return kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0]?.mitarbeiterIds[0] ?? a.verantwortlichId;
    default:
      return undefined;
  }
}

/** Kurzer Text für Listen: der feinere Schritt statt der Phase */
export function schrittLabel(a: Auftrag): string {
  return standVon(a).schritt.label;
}

let beschaeftigt = 0;

/**
 * Schrittstand mit der Wirklichkeit abgleichen. Hat sich der Schritt geändert: speichern, im Verlauf des
 * Auftrags vermerken und `auftrag.schritt_gewechselt` senden. Der erste Stand wird still angelegt.
 */
export function mitfuehren(auftragId: ID | undefined, ueberschreiben?: string, opts: { automatisch?: boolean; grund?: string } = {}): Stand | undefined {
  if (!auftragId || beschaeftigt) return undefined;
  const a = db.auftraege.get(auftragId);
  if (!a || a.geloeschtAm) return undefined;
  const st = standVon(a, ueberschreiben);
  const alt = schrittstaende.get(a.id);
  if (alt && !alt.geloeschtAm && alt.schrittId === st.schritt.id && alt.ablaufId === st.ablauf.id) return st;
  const jetzt = new Date().toISOString();
  if (!alt) {
    const seit = ueberschreiben || a.phase !== 'anfrage' ? jetzt : a.erstelltAm;
    schrittstaende.create({ id: a.id, auftragId: a.id, ablaufId: st.ablauf.id, schrittId: st.schritt.id, seit }, { leise: true });
    // erster Stand: still anlegen – außer eine Regel oder ein Mensch hat den Schritt gesetzt
    if (!ueberschreiben) return { ...st, seit };
  } else {
    schrittstaende.update(a.id, { ablaufId: st.ablauf.id, schrittId: st.schritt.id, seit: jetzt, geloeschtAm: undefined }, { leise: true });
  }
  const von = alt && alt.ablaufId === st.ablauf.id ? st.ablauf.schritte.find((s) => s.id === alt.schrittId)?.label : undefined;
  vermerken({ typ: 'auftraege', id: a.id }, 'auftrag.schritt_gewechselt', `Schritt: ${von ? `${von} → ` : ''}${st.schritt.label}${opts.automatisch ? ' (automatisch)' : ''}${opts.grund ? ` · ${opts.grund}` : ''}`);
  emit({ typ: 'auftrag.schritt_gewechselt', sammlung: 'auftraege', objekt: a, daten: { auftragId: a.id, ablaufId: st.ablauf.id, von: alt?.schrittId, nach: st.schritt.id } });
  return { ...st, seit: jetzt };
}

/**
 * Einen bestimmten Schritt setzen (Regel oder Hand). Gehört er zu einer anderen Phase, wechselt die Phase mit –
 * so laufen alle Phasen-Automationen wie gewohnt.
 */
export function setzeSchritt(auftragId: ID, schrittId: string, opts: { automatisch?: boolean; grund?: string } = {}): Stand | undefined {
  const a = db.auftraege.get(auftragId);
  if (!a) return undefined;
  const ablauf = ablaufFuer(a);
  const ziel = ablauf.schritte.find((s) => s.id === schrittId);
  if (!ziel) return undefined;
  if (ziel.phase !== a.phase) {
    beschaeftigt++;
    try {
      setzePhase(a.id, ziel.phase, { automatisch: opts.automatisch });
    } finally {
      beschaeftigt--;
    }
  }
  return mitfuehren(a.id, ziel.id, opts);
}

/** Von Hand weiter zum nächsten Schritt derselben Phase */
export function weiter(auftragId: ID): Stand | undefined {
  const a = db.auftraege.get(auftragId);
  if (!a) return undefined;
  const st = standVon(a);
  const n = naechsterSchrittIm(st.ablauf, st.index);
  if (!n || n.phase !== st.schritt.phase) return undefined;
  return setzeSchritt(a.id, n.id);
}

/** Ersten Schritt mit dieser ID im Ablauf des Auftrags – sonst den ersten Schritt der Phase */
export function schrittOderPhase(a: Auftrag, id: string, phase: Auftrag['phase']): string | undefined {
  const ablauf = ablaufFuer(a);
  return (ablauf.schritte.find((s) => s.id === id) ?? ablauf.schritte.find((s) => s.phase === phase))?.id;
}

/** Seit wie vielen Tagen gilt der Schritt? */
export function tageSeit(seit: string | undefined): number | undefined {
  return seit ? Math.max(0, tageZwischen(datumVon(seit), heute())) : undefined;
}

/** Begriff des Betriebs aus der Gewerk-Vorlage, z. B. „Baustelle“ oder „Objekt“ */
export function begriff(k: keyof Vorlage['begriffe']): string {
  return aktiveVorlage().begriffe[k];
}

/** Merker: Materialbedarf für diesen Auftrag ist geklärt (blendet den Hinweis aus) */
export const materialKey = (auftragId: ID) => `ablauf.material:${auftragId}`;

export function materialGeklaert(auftragId: ID): void {
  setzeEinstellung(materialKey(auftragId), true);
  vermerken({ typ: 'auftraege', id: auftragId }, 'ablauf.material', 'Materialbedarf geklärt');
}
