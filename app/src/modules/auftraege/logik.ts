/**
 * Reine Regeln der Auftragsakte: Phasen, nächster Schritt, Stillstand.
 * Keine UI, kein Speicher – damit testbar und überall gleich.
 */
import { tageZwischen } from '@core/format';
import { PHASEN } from '@core/objects';
import type { Angebot, Auftrag, Auftragsart, Datum, ID, Phase, Rechnung, Termin } from '@core/objects';
import type { Ton } from '@core/modul';

/** Phasen, in denen ein Auftrag noch Arbeit macht (Pipeline-Spalten) */
export const AKTIVE_PHASEN: Phase[] = ['anfrage', 'besichtigung', 'angebot', 'beauftragt', 'in_arbeit', 'abnahme', 'abrechnung'];
/** Fortschritt von links nach rechts (ohne „verloren“) */
export const PHASEN_REIHE: Phase[] = [...AKTIVE_PHASEN, 'erledigt'];

export const ART_LABEL: Record<Auftragsart, string> = {
  kundendienst: 'Kundendienst',
  projekt: 'Projekt / Baustelle',
  wartung: 'Wartung',
  reklamation: 'Reklamation',
  werkstatt: 'Werkstatt',
};

export const phaseLabel = (p: Phase) => PHASEN.find((x) => x.id === p)?.label ?? p;
export const phaseIndex = (p: Phase) => PHASEN_REIHE.indexOf(p);
export const istOffen = (a: Pick<Auftrag, 'phase'>) => a.phase !== 'erledigt' && a.phase !== 'verloren';

/** liegt Phase `p` vor `ziel` (und ist nicht verloren/erledigt)? */
export function istVor(p: Phase, ziel: Phase): boolean {
  const i = phaseIndex(p);
  return i >= 0 && i < phaseIndex(ziel);
}

export function phaseTon(p: Phase): Ton {
  if (p === 'erledigt') return 'erfolg';
  if (p === 'verloren') return 'neutral';
  if (p === 'anfrage') return 'achtung';
  return 'aktiv';
}

// ------------------------------------------------------------------ Nächster Schritt

export interface Schritt {
  /** Beschriftung des Hauptbuttons */
  label: string;
  /** Ein Satz: warum ist das jetzt dran? */
  text: string;
  icon?: string;
  /** Aktion eines anderen Pakets (`aktionAusfuehren`) */
  aktion?: string;
  payload?: unknown;
  /** Phase vor dem Ausführen setzen (z. B. Kundendienst annehmen) */
  vorherPhase?: Phase;
  /** reine Phasenänderung ohne Aktion */
  phase?: Phase;
  /** direkt navigieren */
  pfad?: string;
  /** Rückfall, wenn die Aktion (noch) nicht registriert ist */
  ersatz?: { phase?: Phase; aufgabe?: string; meldung: string };
}

export interface SchrittKontext {
  termine: Termin[];
  angebote: Angebot[];
  rechnungen: Rechnung[];
  heute: Datum;
  aktionDa: (id: string) => boolean;
  pfadZu: (typ: 'angebote' | 'rechnungen' | 'termine', id: ID) => string | undefined;
}

const istEinsatz = (t: Termin) => t.art !== 'besichtigung' && t.art !== 'intern' && t.art !== 'schulung';

export function kommendeEinsaetze(termine: Termin[]): Termin[] {
  return termine
    .filter((t) => istEinsatz(t) && t.status !== 'abgesagt' && t.status !== 'erledigt')
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Alle Einsätze erledigt (mindestens einer, keiner mehr offen) */
export function alleEinsaetzeErledigt(termine: Termin[]): boolean {
  const e = termine.filter((t) => istEinsatz(t) && t.status !== 'abgesagt');
  return e.length > 0 && e.every((t) => t.status === 'erledigt');
}

export function naechsterSchritt(a: Auftrag, k: SchrittKontext): Schritt | undefined {
  const payload = { auftragId: a.id };
  const besichtigungen = k.termine.filter((t) => t.art === 'besichtigung' && t.status !== 'abgesagt');
  const kommend = kommendeEinsaetze(k.termine);

  const besichtigungPlanen: Schritt = {
    label: 'Besichtigung planen',
    text: 'Schau dir die Sache vor Ort an, bevor du ein Angebot schreibst.',
    icon: 'kalender',
    aktion: 'besichtigung.planen',
    payload,
    ersatz: { phase: 'besichtigung', aufgabe: 'Besichtigungstermin mit dem Kunden vereinbaren', meldung: 'Aufgabe angelegt: Besichtigungstermin vereinbaren.' },
  };
  const angebotErstellen: Schritt = {
    label: 'Angebot erstellen',
    text: 'Alles Nötige ist bekannt. Jetzt das Angebot schreiben.',
    icon: 'dokument',
    aktion: 'angebot.erstellen',
    payload,
    ersatz: { phase: 'angebot', aufgabe: 'Angebot schreiben und an den Kunden schicken', meldung: 'Aufgabe angelegt: Angebot schreiben.' },
  };
  const einplanen: Schritt = {
    label: 'Einsatz einplanen',
    text: 'Der Auftrag steht. Leg fest, wer wann rausfährt.',
    icon: 'plan',
    aktion: 'plan.einplanen',
    payload,
    ersatz: { aufgabe: 'Einsatz einplanen', meldung: 'Aufgabe angelegt: Einsatz einplanen.' },
  };
  const terminSchritt = (t: Termin, textWeiter: string): Schritt => {
    if ((t.status === 'unterwegs' || t.status === 'vor_ort') && k.aktionDa('einsatz.beenden'))
      return { label: 'Einsatz beenden', text: 'Der Einsatz läuft. Wenn du fertig bist, stopp die Zeit.', icon: 'stop', aktion: 'einsatz.beenden', payload: { terminId: t.id } };
    if (t.start.slice(0, 10) <= k.heute && k.aktionDa('einsatz.starten'))
      return { label: 'Einsatz starten', text: 'Der Einsatz ist heute dran. Mit dem Start läuft die Zeit.', icon: 'start', aktion: 'einsatz.starten', payload: { terminId: t.id } };
    const p = k.pfadZu('termine', t.id);
    if (p) return { label: 'Nächsten Einsatz ansehen', text: textWeiter, icon: 'kalender', pfad: p };
    return { ...einplanen, label: 'Weiteren Einsatz einplanen', text: `${textWeiter} Reicht das nicht, plan weitere ein.` };
  };

  switch (a.phase) {
    case 'anfrage':
      if (a.art !== 'projekt')
        return {
          ...einplanen,
          label: 'Annehmen und einplanen',
          text: 'Für Kundendienst reicht meist ein Einsatz – ohne Besichtigung und Angebot.',
          vorherPhase: 'beauftragt',
        };
      return besichtigungPlanen;
    case 'besichtigung':
      return besichtigungen.length ? angebotErstellen : besichtigungPlanen;
    case 'angebot': {
      const entwurf = k.angebote.find((x) => x.status === 'entwurf');
      if (entwurf) {
        const p = k.pfadZu('angebote', entwurf.id);
        if (p) return { label: 'Angebot fertigstellen', text: 'Ein Entwurf liegt bereit. Prüfen und an den Kunden schicken.', icon: 'dokument', pfad: p };
      }
      if (k.angebote.some((x) => x.status === 'versendet'))
        return { label: 'Zusage eintragen', text: 'Das Angebot ist beim Kunden. Hat er zugesagt, trag es hier ein.', icon: 'check', phase: 'beauftragt' };
      return angebotErstellen;
    }
    case 'beauftragt':
      if (!kommend.length) return einplanen;
      return terminSchritt(kommend[0], 'Der Einsatz ist geplant.');
    case 'in_arbeit':
      if (kommend.length) return terminSchritt(kommend[0], `Noch ${kommend.length === 1 ? 'ein Einsatz' : `${kommend.length} Einsätze`} geplant.`);
      return {
        label: 'Abnahme starten',
        text: 'Die Arbeit ist gemacht. Lass dir die Fertigstellung vom Kunden bestätigen.',
        icon: 'unterschrift',
        aktion: 'abnahme.starten',
        payload,
        ersatz: { phase: 'abnahme', meldung: 'Auftrag steht jetzt auf Abnahme.' },
      };
    case 'abnahme':
      return {
        label: 'Abnahme durchführen',
        text: 'Mit dem Kunden durchgehen und unterschreiben lassen.',
        icon: 'unterschrift',
        aktion: 'abnahme.starten',
        payload,
        ersatz: { phase: 'abrechnung', meldung: 'Abnahme vermerkt. Weiter mit der Rechnung.' },
      };
    case 'abrechnung': {
      const aktiv = k.rechnungen.filter((r) => r.status !== 'storniert');
      const entwurf = aktiv.find((r) => r.status === 'entwurf');
      if (entwurf) {
        const p = k.pfadZu('rechnungen', entwurf.id);
        if (p) return { label: 'Rechnung fertigstellen', text: 'Ein Rechnungsentwurf liegt bereit. Prüfen und verschicken.', icon: 'euro', pfad: p };
      }
      const offen = aktiv.find((r) => (r.art === 'schluss' || r.art === 'rechnung') && (r.status === 'versendet' || r.status === 'teilbezahlt'));
      if (offen) {
        const p = k.pfadZu('rechnungen', offen.id);
        return {
          label: 'Rechnung ansehen',
          text: 'Die Rechnung ist raus. Sobald sie bezahlt ist, schließt Macher den Auftrag automatisch.',
          icon: 'euro',
          pfad: p,
          phase: p ? undefined : 'erledigt',
        };
      }
      const hatAbschlag = aktiv.some((r) => r.art === 'abschlag' || r.art === 'teil');
      return {
        label: hatAbschlag ? 'Schlussrechnung schreiben' : 'Rechnung schreiben',
        text: 'Die Arbeit ist abgenommen. Jetzt das Geld holen.',
        icon: 'euro',
        aktion: 'rechnung.erstellen',
        payload: { auftragId: a.id, art: hatAbschlag ? 'schluss' : 'rechnung' },
        ersatz: { aufgabe: hatAbschlag ? 'Schlussrechnung schreiben' : 'Rechnung schreiben', meldung: 'Aufgabe angelegt: Rechnung schreiben.' },
      };
    }
    case 'erledigt':
      if (k.aktionDa('bewertung.anfragen'))
        return { label: 'Bewertung anfragen', text: 'Zufriedene Kunden bringen neue Kunden.', icon: 'stern', aktion: 'bewertung.anfragen', payload };
      return undefined;
    case 'verloren':
      return { label: 'Wieder aufnehmen', text: 'Der Kunde meldet sich doch? Dann geht es als Anfrage weiter.', icon: 'wiederholen', phase: 'anfrage' };
  }
}

// ------------------------------------------------------------------ Stillstand

/** Tage seit der letzten Bewegung (beliebige Änderung am Auftrag oder an etwas, das daran hängt) */
export function tageOhneBewegung(letzteBewegung: string, heute: Datum): number {
  return tageZwischen(letzteBewegung.slice(0, 10), heute);
}

export const STILLSTAND_TAGE = 14;
