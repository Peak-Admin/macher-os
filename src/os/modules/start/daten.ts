/**
 * First Value: „Was willst du als Erstes erledigen?“, die „Dein Start“-Haken und der gemeinsame Versandweg
 * für Angebot und Rechnung (Cloud, sonst ehrlicher lokaler Rückfall).
 * Reine Regeln sind ohne Datenbank testbar.
 */
import { cloud, LOKALE_CLOUD, type Cloud, type Versand, type VersandErgebnis } from '@core/cloud';
import { emit } from '@core/events';
import { messen } from '@core/messung';
import type { Angebot, Arbeitsweise, Bezug, Mitarbeiter, Termin } from '@core/objects';
import type { IconName } from '@ui/index';

// ------------------------------------------------------------------ Was willst du als Erstes erledigen?

export type Wahl = 'angebot' | 'rechnung' | 'planen';

export interface StartKarte {
  id: Wahl;
  titel: string;
  text: string;
  icon: IconName;
  pfad: string;
}

export const KARTEN: Record<Wahl, StartKarte> = {
  angebot: { id: 'angebot', titel: 'Angebot schreiben', text: 'Kunde, Positionen, senden – in drei Minuten raus.', icon: 'dokument', pfad: '/start/angebot' },
  rechnung: { id: 'rechnung', titel: 'Rechnung schreiben', text: 'Arbeit erledigt? In einer Minute abgerechnet, E-Rechnung inklusive.', icon: 'euro', pfad: '/start/rechnung' },
  planen: { id: 'planen', titel: 'Woche planen', text: 'Wer ist wann wo – die Woche auf einen Blick.', icon: 'plan', pfad: '/plan' },
};

/**
 * Reihenfolge nach Arbeitsweise. Ein Dokument beim Kunden ist der erste Wert – deshalb stehen Angebot und
 * Rechnung vorn: Kundendienst rechnet sofort ab (Rechnung zuerst), Baustelle und Werkstatt beginnen mit dem
 * Angebot. Nur wer ausschließlich Wartung macht, startet mit dem Plan.
 */
export function kartenReihenfolge(arbeitsweisen: Arbeitsweise[] = []): Wahl[] {
  const hat = (w: Arbeitsweise) => arbeitsweisen.includes(w);
  if (arbeitsweisen.length && arbeitsweisen.every((w) => w === 'wartung')) return ['planen', 'angebot', 'rechnung'];
  if (hat('kundendienst') && !hat('baustelle') && !hat('werkstatt')) return ['rechnung', 'angebot', 'planen'];
  return ['angebot', 'rechnung', 'planen'];
}

// ------------------------------------------------------------------ Dein Start

export interface Haken {
  id: 'angebot' | 'team' | 'termin';
  titel: string;
  erledigt: boolean;
  /** konkreter nächster Schritt */
  aktion: { label: string; pfad: string };
}

export interface StartStand {
  angebote: Pick<Angebot, 'status' | 'versendetAm' | 'beispiel'>[];
  mitarbeiter: Pick<Mitarbeiter, 'aktiv' | 'beispiel'>[];
  termine: Pick<Termin, 'status' | 'beispiel'>[];
  /** Event `team.eingeladen` kam schon einmal */
  teamEingeladen?: boolean;
}

/** Drei Haken – nur echte Daten zählen, Beispieldaten nie. */
export function startHaken(s: StartStand): Haken[] {
  const echt = <T extends { beispiel?: boolean }>(x: T) => !x.beispiel;
  return [
    {
      id: 'angebot',
      titel: 'Erstes Angebot raus',
      erledigt: s.angebote.filter(echt).some((a) => !!a.versendetAm || (a.status !== 'entwurf' && a.status !== 'abgelaufen')),
      aktion: { label: 'Angebot schreiben', pfad: '/start/angebot' },
    },
    {
      id: 'team',
      titel: 'Team eingeladen',
      erledigt: !!s.teamEingeladen || s.mitarbeiter.filter(echt).filter((m) => m.aktiv).length > 1,
      aktion: { label: 'Team einladen', pfad: '/betrieb/team' },
    },
    {
      id: 'termin',
      titel: 'Erster Termin geplant',
      erledigt: s.termine.filter(echt).some((t) => t.status !== 'abgesagt'),
      aktion: { label: 'Termin planen', pfad: '/plan' },
    },
  ];
}

export const TEAM_EINGELADEN = 'start.teamEingeladen';
export const START_AUS = 'start.karteAus';

// ------------------------------------------------------------------ Versand

export interface SendeErgebnis extends VersandErgebnis {
  /** Cloud-Versand ging schief, stattdessen hat sich das Mail-/SMS-Programm geöffnet */
  rueckfall?: boolean;
}

/**
 * Über den Cloud-Vertrag senden. Klappt das nicht, öffnet Macher das Mail-/SMS-Programm (lokaler Rückfall) –
 * damit das Dokument trotzdem rausgeht. Das Ergebnis sagt ehrlich, was passiert ist.
 */
export async function sendenMitRueckfall(v: Versand, c: Cloud = cloud(), lokal: Cloud = LOKALE_CLOUD): Promise<SendeErgebnis> {
  let r: VersandErgebnis;
  try {
    r = await c.senden(v);
  } catch (e) {
    r = { status: 'fehler', fehler: e instanceof Error ? e.message : String(e) };
  }
  if (r.status !== 'fehler' || c === lokal) return r;
  const zweit = await lokal.senden(v);
  return { ...zweit, rueckfall: true, fehler: r.fehler };
}

/** Text für Erfolgsmeldungen – sagt, ob wirklich verschickt oder nur das Programm geöffnet wurde */
export function versandText(r: SendeErgebnis, kanal: Versand['kanal'], was: string): string {
  const programm = kanal === 'sms' ? 'SMS-App' : kanal === 'whatsapp' ? 'WhatsApp' : 'Mailprogramm';
  if (r.status === 'gesendet') return `${was} ist raus.`;
  if (r.status === 'geoeffnet') return `${r.rueckfall ? 'Der Versand über Macher hat nicht geklappt. ' : ''}${kanal === 'email' ? 'Dein' : 'Deine'} ${programm} ist offen – drück dort auf Senden.`;
  return `${was} konnte nicht gesendet werden${r.fehler ? `: ${r.fehler}` : '.'}`;
}

/** Fachliches Event + Messpunkt nach dem Versand eines Dokuments */
export function dokumentVersendet(bezug: Bezug, kanal: Versand['kanal'], r: SendeErgebnis, sekunden?: number) {
  emit({ typ: 'dokument.versendet', sammlung: bezug.typ, daten: { bezug, kanal, status: r.status } });
  messen('erstwert.dokument_versendet', {
    art: bezug.typ,
    kanal,
    status: r.status,
    rueckfall: !!r.rueckfall,
    ...(sekunden !== undefined ? { sekunden: Math.round(sekunden) } : {}),
  });
}

/** E-Mail-Adresse oder Telefonnummer? */
export function kontaktArt(s: string): 'email' | 'sms' | undefined {
  const t = s.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'email';
  if (t.replace(/[^\d]/g, '').length >= 6 && /^[+\d][\d\s/()-]+$/.test(t)) return 'sms';
  return undefined;
}
