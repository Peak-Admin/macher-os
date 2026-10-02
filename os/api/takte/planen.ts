/**
 * Server-Takt, reiner Teil: aus den Zeilen der Tabelle `objekte` eines Betriebs und seinen Mitgliedern
 * berechnen, wer jetzt welchen Takt bekommt – mit denselben Funktionen wie im Browser
 * (`src/modules/takte/*`). Keine Netzwerkzugriffe, damit es testbar bleibt.
 */
import type { Mitarbeiter, Rolle } from '../../src/core/objects.js';
import { deinTag, entscheidungenAusBestand, leererBestand, tagesbrief, wochenbilanz, zeitenHeute, type Bestand, type TaktInhalt } from '../../src/modules/takte/inhalt.js';
import { einstellungenAus, einstellungsSchluessel, faelligeTakte, zuletztSchluessel, type Kanal, type TaktId } from '../../src/modules/takte/regeln.js';
import { istArbeitstagServer } from '../../src/modules/takte/feiertage.js';
import { uhrVon } from '../../src/modules/takte/zeit.js';
import { nachrichtAus, type TaktNachricht } from '../../src/modules/takte/zustellung.js';

/** Eine Zeile aus `objekte` (laut Datenvertrag) */
export interface ObjektZeile {
  sammlung: string;
  id: string;
  daten: Record<string, unknown>;
}

/** Eine Zeile aus `mitglieder` */
export interface Mitglied {
  nutzer_id: string;
  mitarbeiter_id: string | null;
  rolle: string | null;
}

export interface Zustellung {
  nutzerId: string;
  mitarbeiterId: string;
  takt: TaktId;
  kanal: Kanal;
  email?: string;
  nachricht: TaktNachricht;
  /** Push-Abos, die das Gerät selbst als Einstellung `takte.push-abo.<mitarbeiterId>` abgelegt hat */
  geraete: { endpoint: string; keys: { p256dh: string; auth: string } }[];
}

/** Diese Sammlungen braucht der Takt (der Rest wird gar nicht geladen) */
export const SAMMLUNGEN = ['betrieb', 'mitarbeiter', 'termine', 'auftraege', 'kunden', 'orte', 'material', 'aufgaben', 'zeiten', 'rechnungen', 'zahlungen', 'erledigungen', 'abwesenheiten', 'hinweise', 'einstellungen'] as const;

/** Wie `STANDARD_RECHTE` in `src/core/session.ts` (nur die Rechte, die die Takte brauchen) */
const STANDARD_RECHTE: Record<Rolle, string[]> = { chef: ['geld', 'personal'], buero: ['geld'], monteur: [], azubi: [] };

export interface BetriebsDaten {
  bestand: Bestand & { hinweise: NonNullable<Parameters<typeof entscheidungenAusBestand>[0]['hinweise']> };
  einstellungen: Map<string, unknown>;
}

export function betriebsDaten(zeilen: ObjektZeile[]): BetriebsDaten {
  const nach = new Map<string, Record<string, unknown>[]>();
  const einstellungen = new Map<string, unknown>();
  for (const z of zeilen) {
    if (!z.daten || (z.daten as { geloeschtAm?: string }).geloeschtAm) continue;
    if (z.sammlung === 'einstellungen') {
      einstellungen.set(z.id, (z.daten as { wert?: unknown }).wert);
      continue;
    }
    const liste = nach.get(z.sammlung) ?? [];
    liste.push({ ...z.daten, id: (z.daten as { id?: string }).id ?? z.id });
    nach.set(z.sammlung, liste);
  }
  const alle = <T,>(n: string) => (nach.get(n) ?? []) as T[];
  const bestand = {
    ...leererBestand({
      betrieb: alle<NonNullable<Bestand['betrieb']>>('betrieb')[0],
      mitarbeiter: alle('mitarbeiter'),
      termine: alle('termine'),
      auftraege: alle('auftraege'),
      kunden: alle('kunden'),
      orte: alle('orte'),
      material: alle('material'),
      aufgaben: alle('aufgaben'),
      zeiten: alle('zeiten'),
      rechnungen: alle('rechnungen'),
      zahlungen: alle('zahlungen'),
      erledigungen: alle('erledigungen'),
      abwesenheiten: alle('abwesenheiten'),
    }),
    hinweise: alle('hinweise'),
  } as BetriebsDaten['bestand'];
  return { bestand, einstellungen };
}

function darf(einstellungen: Map<string, unknown>, rolle: Rolle, recht: string): boolean {
  const matrix = (einstellungen.get('rollen.rechte') as Record<Rolle, string[]> | undefined) ?? STANDARD_RECHTE;
  return matrix[rolle]?.includes(recht) ?? false;
}

export function inhaltAufServer(takt: TaktId, d: BetriebsDaten, m: Mitarbeiter, jetzt: Date): TaktInhalt {
  const uhr = uhrVon(jetzt);
  switch (takt) {
    case 'dein-tag':
      return deinTag(d.bestand, m, uhr);
    case 'tagesbrief': {
      const geld = darf(d.einstellungen, m.rolle, 'geld');
      return tagesbrief(d.bestand, uhr, entscheidungenAusBestand(d.bestand, m, uhr, { geld, personal: darf(d.einstellungen, m.rolle, 'personal') }), { geld });
    }
    case 'zeiten':
      return zeitenHeute(d.bestand, m, uhr, !!d.einstellungen.get(`takte.zeiten-bestaetigt.${m.id}.${uhr.datum}`));
    case 'wochenbilanz': {
      const rueckgaengig = new Set(d.bestand.erledigungen.filter((e) => d.einstellungen.get(`erledigt.rueckgaengig.${e.id}`)).map((e) => e.id));
      return wochenbilanz(d.bestand, uhr, { rueckgaengig });
    }
  }
}

/**
 * Wer bekommt jetzt welchen Takt? Liefert auch die neuen „zuletzt“-Stände, damit jeder Takt
 * höchstens einmal am Tag kommt – auch wenn der Inhalt leer war (dann wird nichts zugestellt).
 */
export function planen(d: BetriebsDaten, mitglieder: Mitglied[], jetzt: Date): { zustellungen: Zustellung[]; zuletzt: Map<string, Partial<Record<TaktId, string>>> } {
  const uhr = uhrVon(jetzt);
  const zustellungen: Zustellung[] = [];
  const zuletzt = new Map<string, Partial<Record<TaktId, string>>>();
  if (d.bestand.betrieb && !(d.bestand.betrieb as { onboardingFertig?: boolean }).onboardingFertig) return { zustellungen, zuletzt };
  const gesetzt = d.einstellungen.get('plan.arbeitstage') as number[] | undefined;
  const arbeitstage = Array.isArray(gesetzt) && gesetzt.length ? gesetzt : [1, 2, 3, 4, 5];
  const bundesland = (d.einstellungen.get('plan.bundesland') as string | undefined) || null;
  const arbeitstag = istArbeitstagServer(uhr.datum, arbeitstage, bundesland);
  for (const mg of mitglieder) {
    const m = d.bestand.mitarbeiter.find((x) => x.id === mg.mitarbeiter_id);
    if (!m || !m.aktiv) continue;
    const einstellungen = einstellungenAus(d.einstellungen.get(einstellungsSchluessel(m.id)));
    const bisher = (d.einstellungen.get(zuletztSchluessel(m.id)) as Partial<Record<TaktId, string>> | undefined) ?? {};
    const faellig = faelligeTakte({ rolle: m.rolle, einstellungen, uhr, zuletzt: bisher, arbeitstag });
    if (!faellig.length) continue;
    const neu = { ...bisher };
    for (const takt of faellig) {
      neu[takt] = uhr.datum;
      const nachricht = nachrichtAus(inhaltAufServer(takt, d, m, jetzt), m.id);
      const geraete = ((d.einstellungen.get(`takte.push-abo.${m.id}`) as Zustellung['geraete'] | undefined) ?? []).filter((a) => a?.endpoint && a.keys?.p256dh && a.keys?.auth);
      if (!nachricht.leer) zustellungen.push({ nutzerId: mg.nutzer_id, mitarbeiterId: m.id, takt, kanal: einstellungen.kanal, email: m.email, nachricht, geraete });
    }
    zuletzt.set(m.id, neu);
  }
  return { zustellungen, zuletzt };
}
