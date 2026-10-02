/**
 * Nachrichten – Kernobjekt `nachrichten`. Verlauf je Auftrag (oder je Kunde, wenn es keinen Auftrag gibt).
 * Macher OS verschickt nichts selbst: An Kunden geht es über mailto:/sms:/WhatsApp-Links in deiner App.
 */
import type { Auftrag, ID, Kunde, Nachricht } from '@core/objects';
import type { HinweisVorschlag } from '@core/modul';

export type KundenKanal = 'email' | 'sms' | 'whatsapp';

export const KANAL_LABEL: Record<Nachricht['kanal'], string> = {
  intern: 'Intern',
  email: 'E-Mail',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  telefon: 'Telefon',
  portal: 'Kundenbereich',
};

export const SCHNELLANTWORTEN_KUNDE = [
  'Vielen Dank für Ihre Nachricht. Wir melden uns kurzfristig bei Ihnen.',
  'Wir sind jetzt auf dem Weg zu Ihnen.',
  'Können Sie uns bitte ein Foto davon schicken?',
  'Wir müssen den Termin leider verschieben und melden uns mit einem neuen Vorschlag.',
  'Die Arbeiten sind abgeschlossen. Vielen Dank für Ihren Auftrag!',
];

export const SCHNELLANTWORTEN_INTERN = ['Erledigt.', 'Bin dran.', 'Ruf mich bitte kurz an.', 'Brauche dafür Material – bitte bestellen.'];

export const istKundenNachricht = (n: Nachricht) => n.kanal !== 'intern';
/** Ungelesen = eingegangen (Kunde) oder intern von jemand anderem, noch nicht gelesen */
export const istUngelesen = (n: Nachricht, ich?: ID) => !n.gelesen && (n.richtung === 'ein' || (n.richtung === 'intern' && n.vonMitarbeiterId !== ich));

export interface Thread {
  schluessel: string;
  typ: 'auftrag' | 'kunde' | 'intern';
  /** Auftrags- bzw. Kunden-ID */
  id?: ID;
  nachrichten: Nachricht[];
  letzte: Nachricht;
  ungelesen: number;
  ungelesenKunde: number;
  pfad: string;
}

export function threadVon(n: Pick<Nachricht, 'auftragId' | 'kundeId'>): { typ: Thread['typ']; id?: ID; schluessel: string; pfad: string } {
  if (n.auftragId) return { typ: 'auftrag', id: n.auftragId, schluessel: `a:${n.auftragId}`, pfad: `/auftraege/nachrichten/auftrag/${n.auftragId}` };
  if (n.kundeId) return { typ: 'kunde', id: n.kundeId, schluessel: `k:${n.kundeId}`, pfad: `/auftraege/nachrichten/kunde/${n.kundeId}` };
  return { typ: 'intern', schluessel: 'intern', pfad: '/auftraege/nachrichten/intern' };
}

/** Nachrichten zu Gesprächsverläufen bündeln – neueste Aktivität zuerst */
export function threads(nachrichten: Nachricht[], ich?: ID): Thread[] {
  const map = new Map<string, Thread>();
  for (const n of [...nachrichten].sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm))) {
    const t = threadVon(n);
    const vorhanden = map.get(t.schluessel);
    const u = istUngelesen(n, ich) ? 1 : 0;
    const uk = u && istKundenNachricht(n) ? 1 : 0;
    if (vorhanden) {
      vorhanden.nachrichten.push(n);
      vorhanden.letzte = n;
      vorhanden.ungelesen += u;
      vorhanden.ungelesenKunde += uk;
    } else map.set(t.schluessel, { ...t, nachrichten: [n], letzte: n, ungelesen: u, ungelesenKunde: uk });
  }
  return [...map.values()].sort((a, b) => b.letzte.erstelltAm.localeCompare(a.letzte.erstelltAm));
}

/** Telefonnummer international ohne + (für wa.me): 0171 234 → 49171234 */
export function nummerInternational(tel: string | undefined, land = '49'): string | undefined {
  if (!tel) return undefined;
  let d = tel.trim();
  const plus = d.startsWith('+');
  d = d.replace(/\D/g, '');
  if (!d) return undefined;
  if (plus) return d;
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return land + d.slice(1);
  return d;
}

export function verfuegbareKanaele(k: Pick<Kunde, 'email' | 'telefon'> | undefined): KundenKanal[] {
  if (!k) return [];
  const out: KundenKanal[] = [];
  if (k.email) out.push('email');
  if (k.telefon) out.push('whatsapp', 'sms');
  return out;
}

/** Link, der die passende App mit dem Text öffnet (kein Versand durch Macher OS) */
export function versandLink(kanal: KundenKanal, k: Pick<Kunde, 'email' | 'telefon'>, text: string, betreff?: string): string | undefined {
  const t = encodeURIComponent(text);
  if (kanal === 'email') {
    if (!k.email) return undefined;
    const teile = [betreff ? `subject=${encodeURIComponent(betreff)}` : '', `body=${t}`].filter(Boolean).join('&');
    return `mailto:${k.email}?${teile}`;
  }
  const nr = nummerInternational(k.telefon);
  if (!nr) return undefined;
  if (kanal === 'sms') return `sms:+${nr}?body=${t}`;
  return `https://wa.me/${nr}?text=${t}`;
}

export function nachrichtenHinweise(alle: Nachricht[], auftraege: Auftrag[], kunden: Kunde[], jetzt: Date): HinweisVorschlag[] {
  return threads(alle.filter(istKundenNachricht))
    .filter((t) => t.ungelesenKunde > 0)
    .map((t) => {
      const erste = t.nachrichten.find((n) => istUngelesen(n) && n.richtung === 'ein') ?? t.letzte;
      const stunden = (jetzt.getTime() - new Date(erste.erstelltAm).getTime()) / 3_600_000;
      const auftrag = auftraege.find((a) => a.id === (t.typ === 'auftrag' ? t.id : undefined));
      const kunde = kunden.find((k) => k.id === (erste.kundeId ?? auftrag?.kundeId));
      const vorschau = erste.text.length > 90 ? erste.text.slice(0, 89) + '…' : erste.text;
      return {
        schluessel: `nachricht-ungelesen:${t.schluessel}`,
        art: 'problem' as const,
        titel: `${kunde?.name ?? 'Kunde'} wartet auf Antwort${t.ungelesenKunde > 1 ? ` (${t.ungelesenKunde} Nachrichten)` : ''}`,
        text: `„${vorschau}“`,
        bezug: auftrag ? { typ: 'auftraege' as const, id: auftrag.id } : kunde ? { typ: 'kunden' as const, id: kunde.id } : undefined,
        gewicht: stunden >= 4 ? 68 : 56,
        pfad: t.pfad,
      };
    });
}

/** Eingehende Kundennachricht ohne Auftrag: genau ein offener Auftrag beim Kunden → zuordnen */
export function passenderAuftrag(n: Pick<Nachricht, 'auftragId' | 'kundeId' | 'richtung'>, auftraege: Auftrag[]): ID | undefined {
  if (n.auftragId || !n.kundeId || n.richtung !== 'ein') return undefined;
  const offen = auftraege.filter((a) => a.kundeId === n.kundeId && !['erledigt', 'verloren'].includes(a.phase) && !a.geloeschtAm);
  return offen.length === 1 ? offen[0].id : undefined;
}
