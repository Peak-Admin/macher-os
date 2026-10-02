/** Freundliche Zahlungserinnerungen per E-Mail (Resend) – drei Stufen, dann Lesemodus nach 14 Tagen Kulanz. */
import { KULANZ_TAGE, plusTage } from '../../src/modules/abo/regeln.js';
import { env } from './_gemeinsam.js';

const TEXTE: Record<1 | 2 | 3, { betreff: string; text: (bis: string) => string }> = {
  1: {
    betreff: 'Die Abbuchung für Macher OS hat nicht geklappt',
    text: (bis) =>
      `Hallo,\n\ndie letzte Abbuchung für Macher OS hat nicht geklappt. Das passiert – oft ist das Konto kurz nicht gedeckt oder die Karte abgelaufen.\n\nBitte prüf deine Zahlungsart in Macher OS unter Betrieb › Einstellungen › Dein Plan. Bis einschließlich ${bis} läuft alles normal weiter.\n\nDanke!`,
  },
  2: {
    betreff: 'Erinnerung: Abbuchung für Macher OS noch offen',
    text: (bis) =>
      `Hallo,\n\ndie Abbuchung für Macher OS ist noch offen. Prüf bitte deine Zahlungsart unter Betrieb › Einstellungen › Dein Plan.\n\nBis einschließlich ${bis} läuft alles normal weiter. Danach kannst du weiter alles lesen und exportieren, aber nichts Neues anlegen.\n\nDanke!`,
  },
  3: {
    betreff: 'Letzte Erinnerung: Abbuchung für Macher OS',
    text: (bis) =>
      `Hallo,\n\ndie Abbuchung für Macher OS ist weiter offen. Nach dem ${bis} wechselt Macher OS in den Lesemodus: Deine Daten bleiben vollständig lesbar und exportierbar, nur Neues anlegen geht nicht mehr.\n\nMit einer gültigen Zahlungsart unter Betrieb › Einstellungen › Dein Plan geht es sofort weiter.\n\nDanke!`,
  },
};

const datumDe = (d: string) => d.split('-').reverse().join('.');

/** Sendet die Erinnerung der Stufe – nur wenn `RESEND_API_KEY` und `ABO_ABSENDER` gesetzt sind. */
export async function erinnern(an: string | undefined, stufe: 1 | 2 | 3, offenSeit: string): Promise<boolean> {
  const key = env('RESEND_API_KEY');
  const von = env('ABO_ABSENDER');
  if (!key || !von || !an) return false;
  const t = TEXTE[stufe];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: von, to: [an], subject: t.betreff, text: t.text(datumDe(plusTage(offenSeit, KULANZ_TAGE - 1))) }),
  });
  return r.ok;
}
