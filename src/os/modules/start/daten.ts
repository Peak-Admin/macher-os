/**
 * First Value: „Was möchtest du als Erstes erledigen?“, „Macher fertig machen“, Briefkopf just in time und der gemeinsame Versandweg
 * für Angebot und Rechnung (Cloud, sonst ehrlicher lokaler Rückfall).
 * Reine Regeln sind ohne Datenbank testbar.
 */
import { cloud, LOKALE_CLOUD, type Cloud, type Versand, type VersandErgebnis } from '@core/cloud';
import { emit } from '@core/events';
import { messen } from '@core/messung';
import type { Betrieb, Bezug, Kunde, Mitarbeiter } from '@core/objects';
import type { IconName } from '@ui/index';

// ------------------------------------------------------------------ Was möchtest du als Erstes erledigen?

/**
 * Drei First-Value-Pfade statt eines Aktivierungsereignisses:
 * Angebot (erstes echtes Angebot vorbereitet) · Wechsel (erste Kunden/Leistungen übernommen) · Auftrag (erster Auftrag angelegt).
 */
export type Wahl = 'angebot' | 'kunden' | 'auftrag';

export interface StartKarte {
  id: Wahl;
  titel: string;
  text: string;
  icon: IconName;
  pfad: string;
}

export const KARTEN: Record<Wahl, StartKarte> = {
  angebot: { id: 'angebot', titel: 'Angebot erstellen', text: 'Kunde, Positionen, senden – in drei Minuten raus.', icon: 'dokument', pfad: '/start/angebot' },
  kunden: { id: 'kunden', titel: 'Kunden übernehmen', text: 'Aus Excel oder deinem alten Programm. Doppelte führt Macher zusammen.', icon: 'upload', pfad: '/betrieb/import?art=kunden' },
  auftrag: { id: 'auftrag', titel: 'Auftrag anlegen', text: 'Kunde, was zu tun ist, wo – Macher legt den passenden Ablauf an.', icon: 'auftraege', pfad: '/auftraege/auftraege/neu' },
};

/** Angebot ist die Hauptaktion. Ohne Geld-Recht gibt es kein Angebot – dann bleiben Kunden und Auftrag. */
export function startKarten(darfGeld: boolean): Wahl[] {
  return darfGeld ? ['angebot', 'kunden', 'auftrag'] : ['kunden', 'auftrag'];
}

/** Welcher First-Value-Pfad steckt in einem Ereignis? (nur echte Daten, nie Beispiele) */
export function erstwertPfad(e: { typ: string; objekt?: { beispiel?: boolean; phase?: string } }): 'angebot' | 'auftrag' | 'wechsel' | undefined {
  if (e.objekt?.beispiel) return undefined;
  if (e.typ === 'angebot.erstellt') return 'angebot';
  if (e.typ === 'auftrag.angelegt' && e.objekt?.phase !== 'anfrage') return 'auftrag';
  if (e.typ === 'import.abgeschlossen') return 'wechsel';
  return undefined;
}

// ------------------------------------------------------------------ Macher fertig machen

export interface Haken {
  id: 'betrieb' | 'gewerk' | 'kunden' | 'team';
  titel: string;
  erledigt: boolean;
  /** konkreter nächster Schritt */
  aktion: { label: string; pfad: string };
}

export interface StartStand {
  betrieb?: Pick<Betrieb, 'onboardingFertig' | 'gewerk'>;
  kunden: Pick<Kunde, 'beispiel'>[];
  mitarbeiter: Pick<Mitarbeiter, 'aktiv' | 'beispiel'>[];
  /** Event `import.abgeschlossen` kam schon einmal */
  datenUebernommen?: boolean;
  /** Event `team.eingeladen` kam schon einmal */
  teamEingeladen?: boolean;
}

/** Vier Haken „Macher fertig machen“ – komplett optional, nur echte Daten zählen, Beispieldaten nie. */
export function startHaken(s: StartStand): Haken[] {
  const echt = <T extends { beispiel?: boolean }>(x: T) => !x.beispiel;
  return [
    { id: 'betrieb', titel: 'Betrieb eingerichtet', erledigt: !!s.betrieb?.onboardingFertig, aktion: { label: 'Betrieb einrichten', pfad: '/willkommen' } },
    { id: 'gewerk', titel: 'Gewerk eingerichtet', erledigt: !!s.betrieb?.onboardingFertig && !!s.betrieb.gewerk, aktion: { label: 'Gewerk wählen', pfad: '/betrieb/einstellungen' } },
    {
      id: 'kunden',
      titel: 'Kunden & Preise übernehmen',
      erledigt: !!s.datenUebernommen || s.kunden.some(echt),
      aktion: { label: 'Kunden & Preise übernehmen', pfad: '/betrieb/import?art=kunden' },
    },
    {
      id: 'team',
      titel: 'Team hinzufügen',
      erledigt: !!s.teamEingeladen || s.mitarbeiter.filter(echt).filter((m) => m.aktiv).length > 1,
      aktion: { label: 'Team hinzufügen', pfad: '/betrieb/mitarbeiter/neu' },
    },
  ];
}

export const TEAM_EINGELADEN = 'start.teamEingeladen';
export const DATEN_UEBERNOMMEN = 'start.datenUebernommen';
/** „Macher fertig machen“ weggeklickt */
export const START_AUS = 'start.karteAus';
/** Erster sichtbarer Nutzen: { pfad, am } – wird genau einmal gesetzt und gemessen */
export const ERSTWERT_KEY = 'start.erstwert';

// ------------------------------------------------------------------ Briefkopf just in time

/** Name, solange der Betrieb ohne Website eingerichtet wurde – gilt beim ersten Dokument als „fehlt noch“ */
export const PLATZHALTER_NAME = 'Mein Betrieb';

export interface BriefkopfLuecke {
  feld: 'name' | 'adresse' | 'steuer';
  label: string;
}

/**
 * Was fehlt im Briefkopf, bevor ein Dokument rausgeht? Erst hier fragt Macher danach – nicht im Onboarding.
 * `platzhalter` ist der Name, unter dem ein Betrieb ohne Website eingerichtet wurde.
 */
export function briefkopfVorSenden(b: Pick<Betrieb, 'name' | 'adresse' | 'steuernummer' | 'ustId'> | undefined, platzhalter: string): BriefkopfLuecke[] {
  const l: BriefkopfLuecke[] = [];
  if (!b?.name?.trim() || b.name.trim() === platzhalter) l.push({ feld: 'name', label: 'Name des Betriebs' });
  if (!b?.adresse?.strasse?.trim() || !b.adresse.plz?.trim() || !b.adresse.ort?.trim()) l.push({ feld: 'adresse', label: 'Anschrift' });
  if (!b?.steuernummer?.trim() && !b?.ustId?.trim()) l.push({ feld: 'steuer', label: 'Steuernummer oder USt-IdNr.' });
  return l;
}

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
  if (r.status === 'geoeffnet') return `${r.rueckfall ? `Der Versand über Macher hat nicht geklappt${r.fehler ? ` (${r.fehler})` : ''}. ` : ''}${kanal === 'email' ? 'Dein' : 'Deine'} ${programm} ist offen – drück dort auf Senden.`;
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
