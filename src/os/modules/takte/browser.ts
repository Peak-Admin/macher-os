/**
 * Takte im Browser: Bestand aus `db`, Inhalte für die Ansicht und der lokale Planer.
 *
 * Zustellung:
 * - Backend verbunden (`cloudAktiv()`): Der Server-Takt (`os/api/takte/cron.ts`) stellt zu – der Browser
 *   plant nicht zusätzlich, damit niemand doppelt benachrichtigt wird.
 * - Ohne Backend: Takt als In-App-Benachrichtigung (Glocke) und – mit Erlaubnis – als Systemmeldung
 *   über die Notification-API. Das klappt nur, solange die App (oder ihr Service Worker) offen ist.
 */
import { db } from '@core/db';
import { cloud, cloudAktiv, type PushNachricht } from '@core/cloud';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { istArbeitstag } from '@core/kalender';
import { benachrichtigen, offeneHinweise } from '@core/macher';
import type { Datum, ID, Mitarbeiter } from '@core/objects';
import { darf, ich } from '@core/session';
import { deinTag, tagesbrief, wochenbilanz, zeitenHeute, type Bestand, type Entscheidung, type TaktInhalt } from './inhalt';
import { einstellungenAus, einstellungsSchluessel, faelligeTakte, darfMelden, zuletztSchluessel, type TaktEinstellungen, type TaktId } from './regeln';
import { uhrVon, type Uhr } from './zeit';
import { nachrichtAus, type TaktNachricht } from './zustellung';

export function bestandAusDb(): Bestand {
  return {
    betrieb: db.betrieb.get('betrieb'),
    mitarbeiter: db.mitarbeiter.all(),
    termine: db.termine.all(),
    auftraege: db.auftraege.all(),
    kunden: db.kunden.all(),
    orte: db.orte.all(),
    material: db.material.all(),
    aufgaben: db.aufgaben.all(),
    zeiten: db.zeiten.all(),
    rechnungen: db.rechnungen.all(),
    zahlungen: db.zahlungen.all(),
    erledigungen: db.erledigungen.all(),
    abwesenheiten: db.abwesenheiten.all(),
  };
}

// ------------------------------------------------------------------ Einstellungen je Nutzer

export function taktEinstellungen(mitarbeiterId: ID | undefined): TaktEinstellungen {
  return einstellungenAus(mitarbeiterId ? einstellung(einstellungsSchluessel(mitarbeiterId), undefined) : undefined);
}

export function setzeTaktEinstellungen(mitarbeiterId: ID, e: TaktEinstellungen) {
  setzeEinstellung(einstellungsSchluessel(mitarbeiterId), e);
}

// ------------------------------------------------------------------ Zeiten bestätigt (je Person und Tag)

const bestaetigtSchluessel = (mitarbeiterId: ID, datum: Datum) => `takte.zeiten-bestaetigt.${mitarbeiterId}.${datum}`;

export function zeitenBestaetigtAm(mitarbeiterId: ID, datum: Datum): string | undefined {
  return einstellung<string | undefined>(bestaetigtSchluessel(mitarbeiterId, datum), undefined);
}

export function merkeZeitenBestaetigt(mitarbeiterId: ID, datum: Datum) {
  setzeEinstellung(bestaetigtSchluessel(mitarbeiterId, datum), new Date().toISOString());
}

// ------------------------------------------------------------------ Inhalte

/** Entscheidungen aus „Braucht dich“ – dieselbe Quelle wie Heute */
export function entscheidungenFuer(m: Mitarbeiter): Entscheidung[] {
  return offeneHinweise({ rolle: m.rolle, mitarbeiterId: m.id })
    .filter((h) => h.art !== 'info')
    .map((h) => ({ schluessel: h.schluessel, titel: h.titel, text: h.text, art: h.art, gewicht: h.gewicht, pfad: h.pfad, aktionen: h.aktionen ?? [] }));
}

/** Rückgängig gemachte Erledigungen (Modul Erledigt merkt sie sich als Einstellung) */
function rueckgaengigIds(): Set<ID> {
  return new Set(db.erledigungen.all().filter((e) => einstellung(`erledigt.rueckgaengig.${e.id}`, undefined)).map((e) => e.id));
}

export function inhaltFuer(takt: TaktId, m: Mitarbeiter, jetzt = new Date()): TaktInhalt {
  const uhr = uhrVon(jetzt);
  const b = bestandAusDb();
  switch (takt) {
    case 'dein-tag':
      return deinTag(b, m, uhr);
    case 'tagesbrief':
      return tagesbrief(b, uhr, entscheidungenFuer(m), { geld: darf('geld', m) });
    case 'zeiten':
      return zeitenHeute(b, m, uhr, !!zeitenBestaetigtAm(m.id, uhr.datum));
    case 'wochenbilanz':
      return wochenbilanz(b, uhr, { rueckgaengig: rueckgaengigIds() });
  }
}

// ------------------------------------------------------------------ Lokaler Planer

/** Erlaubnis für Systemmeldungen auf diesem Gerät */
export function systemmeldungStatus(): 'erlaubt' | 'verweigert' | 'offen' | 'nicht-verfuegbar' {
  if (typeof Notification === 'undefined') return 'nicht-verfuegbar';
  return Notification.permission === 'granted' ? 'erlaubt' : Notification.permission === 'denied' ? 'verweigert' : 'offen';
}

export async function systemmeldungErlauben(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** Systemmeldung zeigen – über den Service Worker (mit Aktionen), sonst direkt. */
async function systemmeldung(n: TaktNachricht, takt: TaktId) {
  if (systemmeldungStatus() !== 'erlaubt') return false;
  const daten = { pfad: n.pfad, takt, aktionen: n.aktionen };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(n.titel, { body: n.text, tag: `takt-${takt}`, data: daten, ...({ actions: n.aktionen.map((a) => ({ action: a.aktion, title: a.label })) } as object) });
      return true;
    }
  } catch {
    /* ohne Service Worker weiter unten */
  }
  const meldung = new Notification(n.titel, { body: n.text, tag: `takt-${takt}`, data: daten });
  meldung.onclick = () => {
    window.focus();
    window.open(`${n.pfad}?quelle=benachrichtigung`, '_self');
    meldung.close();
  };
  return true;
}

/**
 * Einen Takt zustellen. Gibt zurück, ob etwas zugestellt wurde.
 * Mit Backend über `cloud().push` (Aktionen an der Nachricht), sonst lokal (Glocke + ggf. Systemmeldung).
 */
export async function taktZustellen(takt: TaktId, m: Mitarbeiter, jetzt = new Date()): Promise<boolean> {
  const n = nachrichtAus(inhaltFuer(takt, m, jetzt), m.id);
  if (n.leer) return false;
  if (cloudAktiv()) {
    await cloud().push({ anMitarbeiterId: m.id, titel: n.titel, text: n.text, pfad: n.pfad, aktionen: n.aktionen });
    return true;
  }
  benachrichtigen(n.titel, { text: n.text, bezug: { typ: 'takte', id: takt }, fuer: m.id });
  await systemmeldung(n, takt);
  return true;
}

/** Prüft die Takte für die Person an diesem Gerät. Nur ohne Backend (sonst plant der Server). */
export async function taktePruefen(jetzt = new Date(), m: Mitarbeiter | undefined = ich()): Promise<TaktId[]> {
  if (cloudAktiv() || !m || !m.aktiv) return [];
  if (!db.betrieb.get('betrieb')?.onboardingFertig) return [];
  const uhr: Uhr = uhrVon(jetzt);
  const zuletzt = einstellung<Partial<Record<TaktId, Datum>>>(zuletztSchluessel(m.id), {});
  const faellig = faelligeTakte({ rolle: m.rolle, einstellungen: taktEinstellungen(m.id), uhr, zuletzt, arbeitstag: istArbeitstag(uhr.datum) });
  const zugestellt: TaktId[] = [];
  for (const takt of faellig) {
    // zuerst merken: auch ein leerer Takt ist für heute erledigt
    setzeEinstellung(zuletztSchluessel(m.id), { ...einstellung(zuletztSchluessel(m.id), {}), [takt]: uhr.datum });
    if (await taktZustellen(takt, m, jetzt)) zugestellt.push(takt);
  }
  return zugestellt;
}

/** Für andere Module: Darf jetzt eine Systemmeldung an diese Person gehen? (Ruhezeit, Notdienst) */
export function jetztMelden(mitarbeiterId: ID, opts: { dringend?: boolean } = {}, jetzt = new Date()): boolean {
  return darfMelden(taktEinstellungen(mitarbeiterId), uhrVon(jetzt), opts);
}

/**
 * Push für Ereignisse außerhalb der Takte (z. B. dringende Anfrage, Urlaubsantrag) – mit Ruhezeit.
 * Mit Backend über `cloud().push`; ohne Backend nur als Systemmeldung auf diesem Gerät,
 * wenn die Person hier angemeldet ist und es erlaubt hat. Die Glocke bekommt es ohnehin.
 */
export async function pushMitRuhezeit(n: PushNachricht, opts: { dringend?: boolean } = {}, jetzt = new Date()): Promise<boolean> {
  if (!jetztMelden(n.anMitarbeiterId, opts, jetzt)) return false;
  if (cloudAktiv()) {
    await cloud().push(n);
    return true;
  }
  if (ich()?.id !== n.anMitarbeiterId || systemmeldungStatus() !== 'erlaubt') return false;
  new Notification(n.titel, { body: n.text, tag: `ereignis-${n.pfad ?? n.titel}`, data: { pfad: n.pfad } }).onclick = () => {
    window.focus();
    if (n.pfad) window.open(n.pfad, '_self');
  };
  return true;
}
