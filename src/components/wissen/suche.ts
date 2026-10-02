/** Normalisiert Text für die Client-Suche (Kleinschreibung, Umlaute, Satzzeichen). */
export function normalisieren(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9€\s-]/g, " ");
}

/** Liefert eine Trefferbewertung > 0, wenn alle Suchwörter vorkommen. Titeltreffer zählen mehr. */
export function treffer(query: string, titel: string, rest: string) {
  const woerter = normalisieren(query).split(/\s+/).filter((w) => w.length > 1);
  if (woerter.length === 0) return 0;
  const t = normalisieren(titel);
  const r = normalisieren(rest);
  let score = 0;
  for (const w of woerter) {
    if (t.includes(w)) score += 3;
    else if (r.includes(w)) score += 1;
    else return 0;
  }
  return score;
}
