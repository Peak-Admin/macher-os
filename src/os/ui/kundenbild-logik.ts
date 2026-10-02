/**
 * Kundenbild ohne eigenes Feld: Logo von der Website des Kunden (Favicon der eigenen Domain) oder die Initialen.
 * Die Domain kommt aus dem Feld „Website“ oder – bei Firmen – aus der E-Mail-Adresse (nicht bei Freemail).
 * Das Bild wird direkt von der Domain des Kunden geladen, nie über einen fremden Dienst.
 */
export const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 'web.de', 't-online.de', 'outlook.com', 'outlook.de',
  'hotmail.com', 'hotmail.de', 'live.de', 'live.com', 'yahoo.com', 'yahoo.de', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'freenet.de', 'posteo.de', 'mailbox.org', 'arcor.de', 'online.de', '1und1.de', 'proton.me', 'protonmail.com', 'beispiel.de', 'example.com',
]);

/** Domain aus einer Website-Angabe („www.baeckerei-sommer.de/kontakt“ → „baeckerei-sommer.de“) */
export function domainAusWebsite(website: string | undefined): string | undefined {
  const w = website?.trim().toLowerCase();
  if (!w) return undefined;
  const ohne = w.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(ohne) ? ohne : undefined;
}

export function kundenDomain(k: { website?: string; email?: string; art?: string }): string | undefined {
  const aus = domainAusWebsite(k.website);
  if (aus) return aus;
  // Privatleute haben selten eine eigene Domain – dort nur die Website, nie die E-Mail
  if (k.art === 'privat' || !k.email?.includes('@')) return undefined;
  const d = domainAusWebsite(k.email.split('@')[1]);
  return d && !FREEMAIL.has(d) ? d : undefined;
}

const FUELLWOERTER = /^(familie|fam\.?|herr|frau|dr\.?|gmbh|ug|ag|kg|ohg|gbr|e\.?\s?k\.?|e\.?\s?v\.?|co\.?|&|und|mbh|haftungsbeschränkt|\(haftungsbeschränkt\))$/i;

/** Zwei Buchstaben für den Kunden: „Bäckerei Sommer GmbH“ → „BS“, „Familie Hoffmann“ → „H“, „Petra Schulz“ → „PS“ */
export function kundenInitialen(name: string | undefined): string {
  const worte = (name ?? '').split(/[\s,]+/).filter((w) => w && !FUELLWOERTER.test(w) && /\p{L}/u.test(w));
  if (!worte.length) return '?';
  const erste = (w: string) => (w.match(/\p{L}/u)?.[0] ?? '').toUpperCase();
  return worte.length === 1 ? erste(worte[0]) : erste(worte[0]) + erste(worte[worte.length - 1]);
}

/** Ruhige Kennfarbe je Kunde (stabil aus dem Namen) – gedämpfte Töne, weiße Schrift mit ausreichendem Kontrast */
const FARBEN = ['#164c34', '#2c5d7c', '#6b4f8a', '#8a4b2c', '#5b6b2f', '#7a3a4f', '#3d5a5a', '#7a5a14'];
export function kundenFarbe(name: string | undefined): string {
  let h = 0;
  for (const c of name ?? '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FARBEN[h % FARBEN.length];
}
