/**
 * Aus einem Takt-Inhalt wird eine Benachrichtigung: kurzer Titel, ein Satz, Ziel in der App
 * und höchstens zwei Aktionen direkt an der Nachricht. Für E-Mail derselbe Inhalt als Text.
 * Rein – läuft im Browser und auf dem Server.
 */
import { euro } from '../../core/format';
import type { ID } from '../../core/objects';
import type { TaktAktion, TaktInhalt } from './inhalt';
import { dauerText } from './inhalt';
import { taktDef } from './regeln';

/** Höchstens so viele Knöpfe an einer Benachrichtigung (Web-Push zeigt meist zwei) */
export const AKTIONEN_MAX = 2;

export const taktPfad = (takt: string) => `/macher/takte/${takt}`;

export interface TaktNachricht {
  titel: string;
  text: string;
  pfad: string;
  aktionen: TaktAktion[];
  /** nichts zu sagen → nicht zustellen (keine Dauerbeschallung) */
  leer: boolean;
}

const mehrzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

export function nachrichtAus(i: TaktInhalt, mitarbeiterId: ID): TaktNachricht {
  const pfad = taktPfad(i.takt);
  switch (i.takt) {
    case 'dein-tag': {
      if (!i.anzahl || !i.erster) return { titel: 'Dein Tag', text: i.abwesend ? `Heute: ${i.abwesend}.` : 'Heute ist kein Einsatz geplant.', pfad, aktionen: [], leer: true };
      const wo = [i.erster.kunde, i.erster.adresse].filter(Boolean).join(', ');
      const material = i.material.length ? ` Material: ${mehrzahl(i.material.length, 'Position', 'Positionen')}.` : '';
      return {
        titel: `Dein Tag: ${mehrzahl(i.anzahl, 'Termin', 'Termine')}`,
        text: `Los geht's ${i.erster.zeit.split('–')[0]} mit „${i.erster.titel}“${wo ? ` – ${wo}` : ''}.${material}`,
        pfad,
        aktionen: [],
        leer: false,
      };
    }
    case 'tagesbrief': {
      const n = i.entscheidungen.length;
      const teile: string[] = [n ? i.entscheidungen.map((e) => e.titel).join(' · ') : 'Nichts brennt.'];
      if (i.geld) {
        if (i.geld.eingaenge.anzahl) teile.push(`Eingänge ${i.geld.seitText}: ${euro(i.geld.eingaenge.summe)}`);
        if (i.geld.ueberfaellig.anzahl) teile.push(`Überfällig: ${euro(i.geld.ueberfaellig.summe)}`);
      }
      const erste = i.entscheidungen[0];
      return {
        titel: n ? `Tagesbrief: ${mehrzahl(n + i.weitere, 'Entscheidung', 'Entscheidungen')}` : 'Tagesbrief: Nichts brennt',
        text: teile.join(' – '),
        pfad,
        aktionen: (erste?.aktionen ?? []).slice(0, AKTIONEN_MAX).map((a) => ({ aktion: a.aktion, label: a.label, payload: a.payload })),
        leer: false,
      };
    }
    case 'zeiten': {
      const nichts = !i.eintraege.length && !i.laeuft && !i.termineOhneZeit.length;
      if (i.bestaetigt || nichts) return { titel: 'Zeiten von heute', text: i.bestaetigt ? 'Schon bestätigt.' : 'Heute keine Zeiten.', pfad, aktionen: [], leer: true };
      if (!i.eintraege.length && !i.laeuft) {
        return {
          titel: 'Zeiten von heute fehlen',
          text: `Zu ${mehrzahl(i.termineOhneZeit.length, 'Termin', 'Terminen')} ist keine Zeit erfasst.`,
          pfad,
          aktionen: [{ aktion: 'zeiten.nachtragen', label: 'Nachtragen', payload: { datum: i.datum } }],
          leer: false,
        };
      }
      const laeuft = i.laeuft ? ` · läuft noch seit ${i.laeuft.start}` : '';
      return {
        titel: 'Zeiten von heute bestätigen?',
        text: `${mehrzahl(i.eintraege.length, 'Eintrag', 'Einträge')} · ${dauerText(i.minuten)}${laeuft}`,
        pfad,
        aktionen: [{ aktion: 'takte.zeiten-bestaetigen', label: 'Bestätigen', payload: { mitarbeiterId, datum: i.datum } }],
        leer: false,
      };
    }
    case 'wochenbilanz': {
      const teile = [
        `Umsatz ${euro(i.umsatz.netto)} netto`,
        `offen ${euro(i.offen.summe)}`,
        `${mehrzahl(i.auftraege.abgeschlossen, 'Auftrag', 'Aufträge')} fertig`,
        `Macher hat ${i.erledigt.anzahl} erledigt`,
      ];
      return { titel: 'Deine Wochenbilanz', text: teile.join(' · '), pfad, aktionen: [], leer: false };
    }
  }
}

/** Dieselbe Nachricht als E-Mail (Kanal „E-Mail“) */
export function emailAus(n: TaktNachricht, takt: string, basisUrl: string): { betreff: string; text: string } {
  const def = taktDef(takt);
  const link = `${basisUrl.replace(/\/$/, '')}${n.pfad}`;
  return {
    betreff: n.titel,
    text: [n.text, '', `Öffnen: ${link}`, '', `Du bekommst diese Nachricht als „${def?.titel ?? takt}“. Abbestellen oder Uhrzeit ändern: Macher OS › Benachrichtigungen › Einstellungen.`].join('\n'),
  };
}
