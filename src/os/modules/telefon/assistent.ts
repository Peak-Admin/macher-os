/**
 * Telefonassistent in der App: Konfiguration lesen/speichern, Agent-Definition aus den Betriebsdaten, und das
 * Eintragen eines Gesprächsergebnisses – immer über den Macher AI Gateway (`gateway.ts`), nie direkt.
 */
import { db } from '@core/db';
import { einstellung, setzeEinstellung, useEinstellung } from '@core/einstellungen';
import { fuehreAus, type GatewayKontext } from '@core/gateway';
import { heute, personName } from '@core/format';
import { betriebsArbeitstage, istArbeitstag } from '@core/kalender';
import type { Auftrag, ID, Kunde, Nachricht } from '@core/objects';
import { agentDefinition, ergebnisAusDetails, ergebnisUebersetzen, konfigNormalisieren, type AssistentKonfig, type Geschaeftszeiten, type Uebersetzung } from './agent';
import type { AgentDefinition, AnrufErgebnis } from './anbieter/typen';
import { erkenneAnrufer, offeneAuftraegeVon } from './daten';

export const KONFIG_KEY = 'telefon.assistent';
/** gesetzt, sobald ein Anbieter mit einer Nummer verbunden ist (heute nie) */
export const VERBINDUNG_KEY = 'telefon.verbindung';

export function assistentKonfig(): AssistentKonfig {
  return konfigNormalisieren(einstellung<Partial<AssistentKonfig> | undefined>(KONFIG_KEY, undefined));
}

export function konfigSpeichern(patch: Partial<AssistentKonfig>) {
  setzeEinstellung(KONFIG_KEY, konfigNormalisieren({ ...assistentKonfig(), ...patch }));
}

export function useAssistentKonfig(): [AssistentKonfig, (patch: Partial<AssistentKonfig>) => void] {
  const [roh] = useEinstellung<Partial<AssistentKonfig> | undefined>(KONFIG_KEY, undefined);
  return [konfigNormalisieren(roh), konfigSpeichern];
}

export interface Verbindung {
  anbieter: string;
  nummer: string;
}

export function telefonVerbindung(): Verbindung | undefined {
  return einstellung<Verbindung | undefined>(VERBINDUNG_KEY, undefined);
}

/** Geschäftszeiten aus den Betriebsdaten (Arbeitszeit) und Arbeitstagen inkl. Feiertagen */
export function betriebsZeiten(): Geschaeftszeiten {
  const b = db.betrieb.get('betrieb');
  return { beginn: b?.arbeitsbeginn || '07:00', ende: b?.arbeitsende || '16:00', tage: betriebsArbeitstage(), istArbeitstag: (d) => istArbeitstag(d) };
}

export function aktuelleAgentDefinition(k: AssistentKonfig = assistentKonfig()): AgentDefinition {
  const b = db.betrieb.get('betrieb');
  const ma = db.mitarbeiter.get(k.bereitschaft.mitarbeiterId);
  return agentDefinition(k, { name: b?.name ?? '', telefon: b?.telefon }, betriebsZeiten(), ma ? personName(ma) : undefined);
}

/**
 * Kontext für den Gateway, wenn ein Anruf ohne Menschen hereinkommt. Der Assistent darf genau, was ihm die
 * Einstellung erlaubt: lesen und schreiben (Anfrage, Rückruf, Notiz, Meldung an die Bereitschaft) – kein Geld,
 * nichts senden, nichts löschen.
 */
export function telefonKontext(): GatewayKontext {
  return { heute: heute(), jetzt: new Date(), darf: (r) => r === 'lesen' || r === 'schreiben', kanal: 'sprache' };
}

/** Bekannter Kunde zur Anrufer- oder Rückrufnummer */
export function anruferKunde(e: Pick<AnrufErgebnis, 'von' | 'felder'>): Kunde | undefined {
  return erkenneAnrufer(e.von) ?? (e.felder.rueckrufnummer ? erkenneAnrufer(e.felder.rueckrufnummer) : undefined);
}

export interface Vorschau {
  u: Uebersetzung;
  kunde?: Kunde;
  /** der eine offene Auftrag, an den der Anruf gehängt wird */
  auftrag?: Auftrag;
}

/** Was würde Macher aus diesem Gespräch machen? Ändert nichts (Probeanruf). */
export function vorschau(e: AnrufErgebnis, k: AssistentKonfig = assistentKonfig()): Vorschau {
  const kunde = anruferKunde(e);
  const offen = offeneAuftraegeVon(kunde?.id);
  const u = ergebnisUebersetzen(e, k, { kundeName: kunde?.name, offeneAuftraege: offen.length });
  return { u, kunde, auftrag: u.schritt !== 'anfrage' && offen.length === 1 ? offen[0] : undefined };
}

export type KiAnrufAusgang = { ok: true; nachricht: Nachricht; doppelt?: boolean; notfall: boolean } | { ok: false; fehler: string };

const inArbeit = new Set<string>();

/**
 * Ein Gesprächsergebnis eintragen: Kunde erkennen → übersetzen → Anfrage/Rückruf/Notiz über den Gateway →
 * bei Notfall an die Bereitschaft. Die Freigabe ist die Einstellung „Telefonassistent an“ des Chefs
 * (stehende Freigabe genau für diese Schreibaktionen); jede Aktion steht im KI-Protokoll und im Verlauf.
 */
export async function kiAnrufAufnehmen(e: AnrufErgebnis, opt: { nachrichtId?: ID } = {}): Promise<KiAnrufAusgang> {
  const vorhanden = opt.nachrichtId ? db.nachrichten.get(opt.nachrichtId) : e.anrufId ? db.nachrichten.all().find((n) => n.anruf?.anrufId === e.anrufId) : undefined;
  if (vorhanden?.anruf && vorhanden.anruf.status === 'verarbeitet') return { ok: true, nachricht: vorhanden, doppelt: true, notfall: vorhanden.anruf.dringlichkeit === 'notfall' };
  const schluessel = e.anrufId || vorhanden?.id || '';
  if (schluessel && inArbeit.has(schluessel)) return { ok: false, fehler: 'Der Anruf wird schon eingetragen.' };
  if (schluessel) inArbeit.add(schluessel);
  try {
    const { u, kunde, auftrag } = vorschau(e);
    const k = telefonKontext();
    const r = await fuehreAus({ aktion: u.aktionen[0], daten: { u, nachrichtId: vorhanden?.id, kundeId: kunde?.id, auftragId: auftrag?.id }, lane: 0 }, k, { bestaetigt: true });
    if (!r.ok) {
      if (vorhanden?.anruf) db.nachrichten.update(vorhanden.id, { anruf: { ...vorhanden.anruf, status: 'fehler', fehler: r.text } });
      return { ok: false, fehler: r.text };
    }
    const nachrichtId = r.bezug?.id;
    if (u.notfall && nachrichtId) await fuehreAus({ aktion: 'call.emergency_forward', daten: { nachrichtId }, lane: 0 }, k, { bestaetigt: true });
    const nachricht = db.nachrichten.get(nachrichtId);
    return nachricht ? { ok: true, nachricht, notfall: u.notfall } : { ok: false, fehler: 'Der Anruf ließ sich nicht speichern.' };
  } finally {
    if (schluessel) inArbeit.delete(schluessel);
  }
}

/** Vom Eingang abgelegte Nachricht (`anruf.status: 'neu'`) eintragen */
export function rohAnrufVerarbeiten(n: Nachricht): Promise<KiAnrufAusgang> {
  if (!n.anruf || n.anruf.status !== 'neu') return Promise.resolve({ ok: false, fehler: 'Kein neuer Anruf.' });
  return kiAnrufAufnehmen(ergebnisAusDetails(n.anruf), { nachrichtId: n.id });
}

export const istKiAnruf = (n: Pick<Nachricht, 'kanal' | 'anruf'>) => n.kanal === 'telefon' && n.anruf?.quelle === 'ki-assistent';
