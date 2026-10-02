/** Verbindet die reinen Regeln mit den echten Daten (lokale Datenbank, Macher-Hinweise, Einstellungen). */
import { db, useDatenstand } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { heute } from '@core/format';
import { offeneHinweise } from '@core/macher';
import { pfadZu } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { darf, istBuero } from '@core/session';
import { offeneAnfragen } from '@modules/anfragen/daten';
import { naechsterEinsatz } from '@modules/naechster-einsatz/logik';
import { istUeberfaellig, offenePosten } from '@modules/rechnungen/logik';
import { useStartHaken } from '@modules/start/useStartHaken';
import type { NextAction, WorkItem } from '../typen';
import { arbeitsposten } from './arbeit';
import { naechsteAktionen } from './naechsterSchritt';

const kundenName = (id: string | undefined) => (id ? db.kunden.get(id)?.name : undefined);

export function useNaechsteAktionen(ich: Mitarbeiter): NextAction[] {
  useDatenstand();
  const einrichtung = useStartHaken();
  const tag = heute();
  const buero = istBuero(ich);
  const darfGeld = darf('geld', ich);
  const abgerechnet = new Set(db.rechnungen.where((r) => r.status !== 'storniert' && !!r.auftragId).map((r) => r.auftragId));
  const top = offeneHinweise({ rolle: ich.rolle, mitarbeiterId: ich.id }).find((h) => h.art === 'entscheidung' || h.art === 'problem');
  return naechsteAktionen({
    heute: tag,
    buero,
    darfGeld,
    einrichtung,
    anfragen: buero ? offeneAnfragen() : [],
    angebote: darfGeld ? db.angebote.all() : [],
    abzurechnen: darfGeld ? db.auftraege.where((a) => a.phase === 'abrechnung' && !abgerechnet.has(a.id)) : [],
    ueberfaellig: darfGeld ? offenePosten().filter((r) => istUeberfaellig(r, tag)) : [],
    einsatz: naechsterEinsatz(ich.id),
    entscheidung: top && { schluessel: top.schluessel, titel: top.titel, text: top.text, pfad: top.pfad ?? pfadZu(top.bezug), gewicht: top.gewicht },
    ueberfaelligeAufgaben: db.aufgaben.where((a) => !a.erledigt && a.zustaendigId === ich.id && !!a.faellig && a.faellig < tag).length,
    nachfassenTage: einstellung('angebote.nachfassenTage', 7),
    kundenName,
    pfad: pfadZu,
  });
}

export function useArbeit(ich: Mitarbeiter, ohne?: string[]): WorkItem[] {
  useDatenstand();
  return arbeitsposten({
    heute: heute(),
    ich,
    darfGeld: darf('geld', ich),
    aufgaben: db.aufgaben.all(),
    auftraege: db.auftraege.all(),
    abwesenheiten: db.abwesenheiten.all(),
    mitarbeiter: db.mitarbeiter.all(),
    hinweise: offeneHinweise({ rolle: ich.rolle, mitarbeiterId: ich.id }).map((h) => ({ ...h, pfad: h.pfad ?? pfadZu(h.bezug) })),
    angebote: db.angebote.all(),
    kundenName,
    pfad: pfadZu,
    ohne,
  });
}

/** Für „Deine Arbeit“: was schon als nächster Schritt oben steht, nicht doppelt zeigen */
export function bezugKennung(a: NextAction | undefined): string[] {
  return a?.bezug ? [`${a.bezug.typ}:${a.bezug.id}`] : [];
}
