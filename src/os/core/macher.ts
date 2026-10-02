/**
 * Macher-Laufzeit: Automationen, Hinweise („Braucht dich“), Erledigt-Protokoll, Benachrichtigungen.
 *
 * Grundsatz: Macher erledigt Routine selbst und holt den Menschen nur bei
 * Entscheidungen, Freigaben oder echten Problemen dazu. Alles, was Macher tut,
 * steht im Erledigt-Protokoll und ist – wo möglich – rückgängig zu machen.
 */
import { db } from './db';
import { alsAkteur, registriereAls, type Akteur } from './akteur';
import { verlaufAufraeumen } from './audit';
import { starteEreignisse } from './ereignisse';
import { einstellung, setzeEinstellung } from './einstellungen';
import { alleAutomationen, alleHinweisVorschlaege, type HinweisVorschlag } from './modul';
import type { Bezug, Hinweis, ID, Rolle } from './objects';

// ------------------------------------------------------------------ Automationen

const laufend = new Map<string, () => void>();

export function automationAn(id: string): boolean {
  const a = alleAutomationen().find((x) => x.id === id);
  return einstellung(`automation.${id}`, a?.standardAn ?? false);
}

export function setzeAutomation(id: string, an: boolean) {
  setzeEinstellung(`automation.${id}`, an);
  stoppeAutomation(id);
  if (an) starteAutomation(id);
}

/** Als wer eine Automation handelt (Audit: „durch Macher“) */
export function automationAkteur(a: { id: string; titel?: string }): Akteur {
  return { quelle: 'automation', id: a.id, name: a.titel };
}

function starteAutomation(id: string) {
  const a = alleAutomationen().find((x) => x.id === id);
  if (!a || laufend.has(id)) return;
  // Handler, die `start()` per `on()` registriert, laufen später automatisch im Namen der Automation
  laufend.set(id, registriereAls(automationAkteur(a), () => a.start()));
}

/** `pruefen()` einer Automation in ihrem Namen ausführen */
export function automationPruefen(a: { id: string; titel?: string; pruefen?: () => void }) {
  if (!a.pruefen) return;
  alsAkteur(automationAkteur(a), () => a.pruefen!());
}

function stoppeAutomation(id: string) {
  laufend.get(id)?.();
  laufend.delete(id);
}

/** Beim App-Start: alle eingeschalteten Automationen starten und einmal prüfen */
export function starteAutomationen() {
  // Ereignis-Architektur (Ableitung, Protokoll, Webhooks) und Verlauf-Rotation laufen immer
  starteEreignisse();
  try {
    verlaufAufraeumen();
  } catch (e) {
    console.warn('Verlauf konnte nicht aufgeräumt werden', e);
  }
  for (const a of alleAutomationen()) {
    if (automationAn(a.id)) {
      starteAutomation(a.id);
      try {
        automationPruefen(a);
      } catch (e) {
        console.error(`Prüfung ${a.id} fehlgeschlagen`, e);
      }
    }
  }
}

/**
 * Im Erledigt-Protokoll vermerken, was Macher getan hat.
 * `regel` = Automation-ID. Wird nur geschrieben, wenn die Automation an ist
 * (oder `regel` keine registrierte Automation ist, z. B. manuelle Macher-Aktion).
 */
export function erledigt(
  regel: string,
  titel: string,
  opts: { text?: string; bezug?: Bezug; minuten?: number; rueckgaengig?: { aktion: string; payload?: unknown } } = {},
) {
  return db.erledigungen.create({
    regel,
    titel,
    text: opts.text,
    bezug: opts.bezug,
    minutenGespart: opts.minuten ?? alleAutomationen().find((a) => a.id === regel)?.minuten,
    rueckgaengig: opts.rueckgaengig,
  });
}

// ------------------------------------------------------------------ Hinweise

/** Gespeicherten Hinweis anlegen – dedupliziert über `schluessel` */
export function hinweis(h: Omit<Hinweis, keyof import('./objects').Basis | 'status'> & { status?: Hinweis['status'] }) {
  if (h.schluessel) {
    const vorhanden = db.hinweise.all().find((x) => x.schluessel === h.schluessel && x.status === 'offen');
    if (vorhanden) return vorhanden;
  }
  return db.hinweise.create({ status: 'offen', ...h });
}

export function hinweisErledigen(id: ID) {
  db.hinweise.update(id, { status: 'erledigt', erledigtAm: new Date().toISOString() });
}

/** Ein live berechneter Hinweis wurde bewusst ausgeblendet (bei gebündelten Hinweisen alle zum selben Objekt) */
export function hinweisAusblenden(schluessel: string, tage = 7) {
  const bis = new Date(Date.now() + tage * 86_400_000).toISOString();
  for (const k of gebuendelt.get(schluessel) ?? [schluessel]) setzeEinstellung(`hinweis.aus.${k}`, bis);
}

/** Schlüssel → alle Schlüssel der Bündelung (aus der letzten Berechnung) */
const gebuendelt = new Map<string, string[]>();

function ausgeblendet(schluessel: string) {
  const bis = einstellung<string | undefined>(`hinweis.aus.${schluessel}`, undefined);
  return !!bis && bis > new Date().toISOString();
}

export interface OffenerHinweis extends HinweisVorschlag {
  /** gesetzt, wenn gespeichert (dann über `hinweisErledigen` schließbar) */
  hinweisId?: ID;
  /** weitere Hinweise zum selben Objekt, die in diesen gebündelt wurden */
  weitere?: OffenerHinweis[];
}

/**
 * Mehrere Module melden oft dasselbe Objekt (z. B. „Auftrag ohne Termin“ aus Akte, Plan und Autoplanung).
 * Der Mensch soll es nur einmal sehen: Hinweise mit gleichem Bezug werden zu einem gebündelt –
 * der wichtigste führt (mit seinen Aktionen), der Rest steht in `weitere`.
 */
export function buendeln(liste: OffenerHinweis[]): OffenerHinweis[] {
  const sortiert = [...liste].sort((a, b) => b.gewicht - a.gewicht);
  const nachBezug = new Map<string, OffenerHinweis>();
  const ergebnis: OffenerHinweis[] = [];
  for (const h of sortiert) {
    const key = h.bezug ? `${h.bezug.typ}:${h.bezug.id}:${h.fuerMitarbeiterId ?? ''}` : undefined;
    const fuehrend = key ? nachBezug.get(key) : undefined;
    if (!fuehrend) {
      const kopie = { ...h, weitere: [] as OffenerHinweis[] };
      if (key) nachBezug.set(key, kopie);
      ergebnis.push(kopie);
      continue;
    }
    fuehrend.weitere!.push(h);
    // Aktionen des wichtigsten Hinweises reichen; nur wenn er keine hat, die des nächsten übernehmen
    if (!fuehrend.aktionen?.length && h.aktionen?.length) fuehrend.aktionen = h.aktionen;
    if (h.art === 'problem' && fuehrend.art !== 'problem') fuehrend.art = 'problem';
    // eine gebündelte Sicherheitswarnung bleibt als solche sichtbar
    if (h.sicherheit) fuehrend.sicherheit = true;
  }
  gebuendelt.clear();
  for (const h of ergebnis) {
    const alle = [h.schluessel, ...(h.weitere ?? []).map((w) => w.schluessel)];
    for (const k of alle) gebuendelt.set(k, alle);
    if (!h.weitere?.length) delete h.weitere;
  }
  return ergebnis;
}

/** Alles, was einen Menschen braucht – sortiert nach Gewicht (Pain-Score) */
export function offeneHinweise(fuer?: { rolle?: Rolle; mitarbeiterId?: ID }): OffenerHinweis[] {
  const gespeichert: OffenerHinweis[] = db.hinweise
    .where((h) => h.status === 'offen')
    .map((h) => ({
      schluessel: h.schluessel ?? h.id,
      hinweisId: h.id,
      art: h.art,
      titel: h.titel,
      text: h.text,
      bezug: h.bezug,
      gewicht: h.gewicht,
      fuerRollen: h.fuerRollen,
      fuerMitarbeiterId: h.fuerMitarbeiterId,
      faellig: h.faellig,
      aktionen: h.aktionen?.map((a) => ({ aktion: a.id, label: a.label, primaer: a.primaer, payload: a.payload })),
    }));
  const live = alleHinweisVorschlaege();
  const schluessel = new Set(gespeichert.map((h) => h.schluessel));
  const gefiltert = [...gespeichert, ...live.filter((h) => !schluessel.has(h.schluessel))]
    .filter((h) => !ausgeblendet(h.schluessel))
    .filter((h) => {
      if (!fuer) return true;
      if (h.fuerMitarbeiterId) return h.fuerMitarbeiterId === fuer.mitarbeiterId;
      if (h.fuerRollen && fuer.rolle) return h.fuerRollen.includes(fuer.rolle);
      // ohne Zielgruppe: Chef und Büro
      return !fuer.rolle || fuer.rolle === 'chef' || fuer.rolle === 'buero';
    });
  return buendeln(gefiltert);
}

// ------------------------------------------------------------------ Benachrichtigungen

export function benachrichtigen(titel: string, opts: { text?: string; bezug?: Bezug; fuer?: ID; wichtig?: boolean } = {}) {
  return db.benachrichtigungen.create({
    titel,
    text: opts.text,
    bezug: opts.bezug,
    fuerMitarbeiterId: opts.fuer,
    wichtig: opts.wichtig,
    gelesen: false,
  });
}
