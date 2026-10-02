/**
 * Rückmeldung an das Macher-Team – reine Regeln, gemeinsam für Browser und Server (`/api/cloud/rueckmeldung`).
 */
export const RUECKMELDUNG_PFAD = "/macher/rueckmeldung";

/** Link auf „Rückmeldung geben“ mit der Seite, von der aus geschrieben wird */
export const rueckmeldungLink = (von?: string) =>
  von && von !== RUECKMELDUNG_PFAD
    ? `${RUECKMELDUNG_PFAD}?von=${encodeURIComponent(von)}`
    : RUECKMELDUNG_PFAD;

export type RueckmeldungArt = "problem" | "idee" | "lob";

export const ARTEN: {
  wert: RueckmeldungArt;
  label: string;
  text: string;
  platzhalter: string;
}[] = [
  {
    wert: "problem",
    label: "Etwas klappt nicht",
    text: "Fehler, hängt, falsche Anzeige",
    platzhalter: "Was wolltest du machen? Was ist passiert?",
  },
  {
    wert: "idee",
    label: "Idee oder Wunsch",
    text: "Das fehlt mir noch",
    platzhalter: "Was soll Macher können? Wofür brauchst du es?",
  },
  {
    wert: "lob",
    label: "Das gefällt mir",
    text: "Was wir so lassen sollen",
    platzhalter: "Was gefällt dir? Was hilft dir im Alltag?",
  },
];

export const artLabel = (art: RueckmeldungArt) =>
  ARTEN.find((a) => a.wert === art)?.label ?? art;

export const TEXT_MIN = 3;
export const TEXT_MAX = 4000;

export interface RueckmeldungEingang {
  id: string;
  art: RueckmeldungArt;
  text: string;
  /** Pfad in der App, von dem aus die Rückmeldung kam (ohne Abfrageteil) */
  seite?: string;
  /** Bildschirmbreite in px – hilft, Darstellungsfehler nachzustellen */
  breite?: number;
  version?: string;
}

const kurz = (s: unknown, max: number) =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

/** Eingabe prüfen und säubern. Liefert einen Fehlertext für Menschen oder die bereinigte Rückmeldung. */
export function rueckmeldungPruefen(
  roh: unknown,
): { ok: true; wert: RueckmeldungEingang } | { ok: false; fehler: string } {
  const r = (roh ?? {}) as Record<string, unknown>;
  const art = ARTEN.some((a) => a.wert === r.art)
    ? (r.art as RueckmeldungArt)
    : undefined;
  if (!art) return { ok: false, fehler: "Wähle aus, worum es geht." };
  const text = typeof r.text === "string" ? r.text.trim() : "";
  if (text.length < TEXT_MIN)
    return { ok: false, fehler: "Schreib kurz, worum es geht." };
  if (text.length > TEXT_MAX)
    return { ok: false, fehler: `Bitte höchstens ${TEXT_MAX} Zeichen.` };
  const id = kurz(r.id, 80);
  if (!/^[\w-]{6,80}$/.test(id))
    return { ok: false, fehler: "Ungültige Kennung." };
  const seite = kurz(r.seite, 200).split(/[?#]/)[0];
  const breite =
    typeof r.breite === "number" && Number.isFinite(r.breite)
      ? Math.max(0, Math.min(10000, Math.round(r.breite)))
      : undefined;
  return {
    ok: true,
    wert: {
      id,
      art,
      text,
      ...(seite.startsWith("/") ? { seite } : {}),
      ...(breite ? { breite } : {}),
      ...(kurz(r.version, 40) ? { version: kurz(r.version, 40) } : {}),
    },
  };
}
