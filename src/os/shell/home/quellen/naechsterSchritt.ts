/**
 * „Dein nächster Schritt“: aus dem Zustand des Betriebs die eine wichtigste Handlung ableiten.
 * Kein festverdrahtetes Onboarding – die Einrichtung ist nur eine von mehreren Quellen. Neue Quellen
 * kommen als weiterer Kandidat in `naechsteAktionen` dazu. Reine Regeln, ohne Datenbank testbar.
 */
import type { Angebot, Auftrag, Bezug, Rechnung, Termin } from '@core/objects';
import type { NextAction } from '../typen';

export interface Einrichtungsschritt {
  id: string;
  titel: string;
  erledigt: boolean;
  aktion: { label: string; pfad: string };
}

export interface NaechsterSchrittStand {
  heute: string;
  /** Chef/Büro sehen Betriebsthemen (Anfragen, Angebote, Rechnungen) */
  buero: boolean;
  darfGeld: boolean;
  einrichtung: Einrichtungsschritt[];
  /** offene Anfragen, älteste zuerst */
  anfragen: Pick<Auftrag, 'id' | 'titel'>[];
  angebote: Pick<Angebot, 'id' | 'titel' | 'status' | 'versendetAm' | 'kundeId' | 'geaendertAm'>[];
  /** Aufträge, die abgerechnet werden können (Phase Abrechnung, noch keine Rechnung) */
  abzurechnen: Pick<Auftrag, 'id' | 'titel' | 'kundeId'>[];
  ueberfaellig: Pick<Rechnung, 'id' | 'nummer' | 'kundeId'>[];
  /** eigener nächster Einsatz */
  einsatz?: Pick<Termin, 'id' | 'titel' | 'status' | 'start'>;
  /** wichtigste offene Entscheidung (Macher) */
  entscheidung?: { schluessel: string; titel: string; text?: string; pfad?: string; gewicht: number };
  ueberfaelligeAufgaben: number;
  nachfassenTage: number;
  kundenName: (id: string | undefined) => string | undefined;
  pfad: (b: Bezug) => string | undefined;
}

const tageSeit = (iso: string, heute: string) => Math.floor((Date.parse(heute) - Date.parse(iso.slice(0, 10))) / 86_400_000);
const mehrzahl = (n: number, eins: string, viele: string) => (n === 1 ? `1 ${eins}` : `${n} ${viele}`);

export function naechsteAktionen(s: NaechsterSchrittStand): NextAction[] {
  const liste: NextAction[] = [];

  // Läuft ein eigener Einsatz, ist das immer das Wichtigste
  if (s.einsatz) {
    const laeuft = s.einsatz.status === 'vor_ort' || s.einsatz.status === 'unterwegs';
    const heute = s.einsatz.start.slice(0, 10) === s.heute;
    liste.push({
      id: `einsatz:${s.einsatz.id}`,
      type: 'einsatz',
      title: laeuft ? `Einsatz läuft: ${s.einsatz.titel}` : heute ? `Heute: ${s.einsatz.titel}` : `Nächster Einsatz: ${s.einsatz.titel}`,
      description: laeuft ? 'Halte Zeiten, Fotos und Material direkt am Einsatz fest.' : 'Adresse, Aufgabe und Material – alles an einer Stelle.',
      priority: laeuft ? 98 : heute ? (s.buero ? 50 : 92) : s.buero ? 20 : 70,
      icon: 'auto',
      actionLabel: laeuft ? 'Einsatz öffnen' : 'Zum Einsatz',
      actionUrl: `/heute/naechster-einsatz/${s.einsatz.id}`,
      completed: false,
      bezug: { typ: 'termine', id: s.einsatz.id },
    });
  }

  // Einrichtung: der Betrieb ist angelegt (sonst wäre man nicht hier) – plus die offenen Start-Haken
  const offen = s.einrichtung.filter((h) => !h.erledigt);
  if (s.darfGeld && offen.length) {
    const schritte = [{ titel: 'Betrieb angelegt', erledigt: true }, ...s.einrichtung.map((h) => ({ titel: h.titel, erledigt: h.erledigt }))];
    const erster = offen[0];
    liste.push({
      id: `einrichtung:${erster.id}`,
      type: 'onboarding',
      title: erster.aktion.label,
      description: `Damit ist dein Betrieb startklar. Noch ${mehrzahl(offen.length, 'Schritt', 'Schritte')}.`,
      priority: 90,
      icon: 'start',
      progress: { erledigt: schritte.filter((x) => x.erledigt).length, gesamt: schritte.length, schritte },
      actionLabel: 'Jetzt erledigen',
      actionUrl: erster.aktion.pfad,
      completed: false,
    });
  }

  if (s.buero && s.anfragen.length) {
    const n = s.anfragen.length;
    liste.push({
      id: 'anfragen',
      type: 'anfragen',
      title: n === 1 ? '1 neue Kundenanfrage wartet auf dich' : `${n} neue Kundenanfragen warten auf dich`,
      description: n === 1 ? `„${s.anfragen[0].titel}“ – antworte, bevor der Kunde weitersucht.` : `Die älteste: „${s.anfragen[0].titel}“. Antworte, bevor Kunden weitersuchen.`,
      priority: 85,
      icon: 'mail',
      actionLabel: 'Anfragen ansehen',
      actionUrl: '/auftraege/anfragen',
      completed: false,
    });
  }

  if (s.darfGeld && s.ueberfaellig.length) {
    const n = s.ueberfaellig.length;
    const r = s.ueberfaellig[0];
    liste.push({
      id: 'rechnungen-ueberfaellig',
      type: 'rechnung_ueberfaellig',
      title: n === 1 ? `Rechnung ${r.nummer} ist überfällig` : `${n} Rechnungen sind überfällig`,
      description: n === 1 ? `${s.kundenName(r.kundeId) ?? 'Der Kunde'} hat noch nicht bezahlt. Eine freundliche Erinnerung hilft meist.` : 'Eine freundliche Erinnerung hilft meist. Macher bereitet sie vor.',
      priority: 80,
      icon: 'euro',
      actionLabel: 'Offene Posten ansehen',
      actionUrl: '/betrieb/zahlungen',
      completed: false,
    });
  }

  if (s.darfGeld) {
    const entwurf = [...s.angebote].filter((a) => a.status === 'entwurf').sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))[0];
    if (entwurf) {
      const kunde = s.kundenName(entwurf.kundeId);
      liste.push({
        id: `angebot-entwurf:${entwurf.id}`,
        type: 'angebot_versenden',
        title: kunde ? `Dein Angebot für ${kunde} ist noch nicht verschickt` : 'Ein Angebot ist noch nicht verschickt',
        description: `„${entwurf.titel}“ liegt als Entwurf bereit. Prüfen, senden, fertig.`,
        priority: 75,
        icon: 'dokument',
        actionLabel: 'Weiter bearbeiten',
        actionUrl: s.pfad({ typ: 'angebote', id: entwurf.id }) ?? '/auftraege/angebote',
        completed: false,
        bezug: { typ: 'angebote', id: entwurf.id },
      });
    }

    const abrechnen = s.abzurechnen[0];
    if (abrechnen) {
      const n = s.abzurechnen.length;
      liste.push({
        id: `abrechnen:${abrechnen.id}`,
        type: 'rechnung_erstellen',
        title: n === 1 ? 'Eine Rechnung kann jetzt erstellt werden' : `${n} Rechnungen können jetzt erstellt werden`,
        description: `„${abrechnen.titel}“${s.kundenName(abrechnen.kundeId) ? ` für ${s.kundenName(abrechnen.kundeId)}` : ''} ist fertig. Rechne ab, solange alles frisch ist.`,
        priority: 70,
        icon: 'euro',
        actionLabel: 'Rechnung schreiben',
        actionUrl: s.pfad({ typ: 'auftraege', id: abrechnen.id }) ?? '/start/rechnung',
        completed: false,
        bezug: { typ: 'auftraege', id: abrechnen.id },
      });
    }

    const nachfassen = s.angebote
      .filter((a) => a.status === 'versendet' && a.versendetAm && tageSeit(a.versendetAm, s.heute) >= s.nachfassenTage)
      .sort((a, b) => (a.versendetAm ?? '').localeCompare(b.versendetAm ?? ''))[0];
    if (nachfassen) {
      const kunde = s.kundenName(nachfassen.kundeId);
      liste.push({
        id: `nachfassen:${nachfassen.id}`,
        type: 'angebot_nachfassen',
        title: kunde ? `Frag bei ${kunde} nach` : 'Frag beim Kunden nach',
        description: `Das Angebot „${nachfassen.titel}“ ist seit ${tageSeit(nachfassen.versendetAm!, s.heute)} Tagen ohne Antwort.`,
        priority: 60,
        icon: 'telefon',
        actionLabel: 'Angebot öffnen',
        actionUrl: s.pfad({ typ: 'angebote', id: nachfassen.id }) ?? '/auftraege/angebote',
        completed: false,
        bezug: { typ: 'angebote', id: nachfassen.id },
      });
    }
  }

  if (s.entscheidung) {
    liste.push({
      id: `entscheidung:${s.entscheidung.schluessel}`,
      type: 'entscheidung',
      title: s.entscheidung.titel,
      description: s.entscheidung.text ?? 'Macher braucht hier deine Entscheidung.',
      priority: Math.min(65, 40 + Math.round(s.entscheidung.gewicht / 4)),
      icon: 'macher',
      actionLabel: 'Entscheiden',
      actionUrl: s.entscheidung.pfad ?? '/heute/braucht-dich',
      completed: false,
    });
  }

  if (s.ueberfaelligeAufgaben) {
    liste.push({
      id: 'aufgaben-ueberfaellig',
      type: 'aufgabe',
      title: s.ueberfaelligeAufgaben === 1 ? 'Eine Aufgabe ist überfällig' : `${s.ueberfaelligeAufgaben} Aufgaben sind überfällig`,
      description: 'Erledige sie oder gib ihnen ein neues Datum.',
      priority: 45,
      icon: 'liste',
      actionLabel: 'Aufgaben ansehen',
      actionUrl: '/auftraege/aufgaben',
      completed: false,
    });
  }

  return liste.sort((a, b) => b.priority - a.priority);
}
