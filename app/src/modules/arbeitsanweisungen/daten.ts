/** Arbeitsanweisungen: kurz, klar, was vor Ort zu tun ist. Eigene Sammlung `arbeitsanweisungen`. */
import { db, defineCollection, neueId } from '@core/db';
import type { Basis, ID, Zeitpunkt } from '@core/objects';

export interface AnweisungsSchritt {
  id: ID;
  text: string;
  /** Foto/Skizze als Dokument */
  fotoId?: ID;
}

export interface Arbeitsanweisung extends Basis {
  titel: string;
  /** leer + `vorlage` = wiederverwendbare Vorlage */
  auftragId?: ID;
  /** nur für einen bestimmten Einsatz */
  terminId?: ID;
  /** Was soll am Ende fertig sein? */
  ziel?: string;
  schritte: AnweisungsSchritt[];
  /** Sicherheits-Hinweise, je ein Satz */
  sicherheit: string[];
  vorlage?: boolean;
  /** „Gelesen und verstanden“ der Monteure */
  gelesen?: { mitarbeiterId: ID; am: Zeitpunkt }[];
}

export const arbeitsanweisungen = defineCollection<Arbeitsanweisung>('arbeitsanweisungen');

export const anweisungPfad = (id: ID, bearbeiten = false) => `/auftraege/arbeitsanweisungen/${id}${bearbeiten ? '?bearbeiten=1' : ''}`;

/** Anweisungen, die für einen Termin gelten: am Termin selbst oder am Auftrag ohne Terminbindung */
export function anweisungenFuerTermin(alle: Arbeitsanweisung[], termin: { id: ID; auftragId?: ID }): Arbeitsanweisung[] {
  if (!termin.auftragId) return alle.filter((x) => x.terminId === termin.id);
  return alle.filter((x) => !x.vorlage && x.auftragId === termin.auftragId && (!x.terminId || x.terminId === termin.id));
}

/** Text mit einem Hinweis je Zeile → Liste ohne Leerzeilen */
export const zeilen = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

/** Neue Anweisung am Auftrag – aus Vorlage oder leer, Ziel aus der Auftragsbeschreibung */
export function anweisungAnlegen(auftragId: ID, vorlageId?: ID): Arbeitsanweisung {
  const a = db.auftraege.get(auftragId);
  const v = vorlageId ? arbeitsanweisungen.get(vorlageId) : undefined;
  return arbeitsanweisungen.create({
    titel: v?.titel ?? (a ? `So geht's: ${a.titel}` : 'Arbeitsanweisung'),
    auftragId,
    ziel: a?.beschreibung ?? v?.ziel,
    schritte: (v?.schritte ?? [{ id: '', text: '' }]).map((s) => ({ ...s, id: neueId('s') })),
    sicherheit: [...(v?.sicherheit ?? [])],
  });
}

export function alsGelesen(id: ID, mitarbeiterId: ID) {
  const x = arbeitsanweisungen.get(id);
  if (!x || x.gelesen?.some((g) => g.mitarbeiterId === mitarbeiterId)) return;
  arbeitsanweisungen.update(id, { gelesen: [...(x.gelesen ?? []), { mitarbeiterId, am: new Date().toISOString() }] }, { text: 'Gelesen und verstanden' });
}
