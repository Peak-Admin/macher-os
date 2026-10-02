/**
 * Checklisten: Vorlagen je Gewerk/Auftragsart und Instanzen am Auftrag (optional am Termin).
 * Eigene Sammlungen laut PAKETE.md: `checklistenVorlagen`, `checklisten`.
 */
import { db, defineCollection, neueId, type Neu } from '@core/db';
import { erledigt } from '@core/macher';
import type { Auftrag, Auftragsart, Basis, Gewerk, ID, Zeitpunkt } from '@core/objects';

export interface ChecklistenPunkt {
  id: ID;
  text: string;
  /** muss vor der Abnahme erledigt sein (blockiert nicht hart, erzeugt Hinweis) */
  pflicht?: boolean;
  /** Punkt gilt erst mit Foto als erledigt */
  fotoPflicht?: boolean;
}

export interface ChecklistenVorlage extends Basis {
  name: string;
  beschreibung?: string;
  /** leer = für alle Gewerke */
  gewerke?: Gewerk[];
  /** für welche Auftragsarten */
  arten: Auftragsart[];
  /** beim Beauftragen automatisch am Auftrag anlegen */
  automatisch: boolean;
  punkte: ChecklistenPunkt[];
  aktiv: boolean;
}

export interface PunktStand extends ChecklistenPunkt {
  erledigt: boolean;
  erledigtAm?: Zeitpunkt;
  erledigtVon?: ID;
  /** Foto als Dokument (db.dokumente) */
  fotoId?: ID;
}

export interface Checkliste extends Basis {
  vorlageId?: ID;
  titel: string;
  auftragId: ID;
  terminId?: ID;
  punkte: PunktStand[];
}

export const checklistenVorlagen = defineCollection<ChecklistenVorlage>('checklistenVorlagen');
export const checklisten = defineCollection<Checkliste>('checklisten');

export const checklistePfad = (id: ID) => `/auftraege/checklisten/${id}`;
export const vorlagePfad = (id: ID) => `/auftraege/checklisten/vorlage/${id}`;

// ------------------------------------------------------------------ reine Logik

/** offen = nicht abgehakt oder Foto fehlt trotz Foto-Pflicht */
export const punktOffen = (p: PunktStand) => !p.erledigt || (!!p.fotoPflicht && !p.fotoId);

export interface Stand {
  erledigt: number;
  gesamt: number;
  offenePflicht: number;
  fehlendeFotos: number;
  fertig: boolean;
}

export function stand(c: Pick<Checkliste, 'punkte'>): Stand {
  const erledigtN = c.punkte.filter((p) => !punktOffen(p)).length;
  return {
    erledigt: erledigtN,
    gesamt: c.punkte.length,
    offenePflicht: c.punkte.filter((p) => p.pflicht && punktOffen(p)).length,
    fehlendeFotos: c.punkte.filter((p) => p.erledigt && p.fotoPflicht && !p.fotoId).length,
    fertig: c.punkte.length > 0 && erledigtN === c.punkte.length,
  };
}

export function passendeVorlagen(vorlagen: ChecklistenVorlage[], gewerk: Gewerk | undefined, art: Auftragsart): ChecklistenVorlage[] {
  return vorlagen.filter((v) => v.aktiv && v.arten.includes(art) && (!v.gewerke?.length || (gewerk && v.gewerke.includes(gewerk))));
}

export function ausVorlage(v: Pick<ChecklistenVorlage, 'id' | 'name' | 'punkte'>, auftragId: ID, terminId?: ID): Neu<Checkliste> {
  return {
    vorlageId: v.id,
    titel: v.name,
    auftragId,
    terminId,
    punkte: v.punkte.map((p) => ({ ...p, id: p.id || neueId('p'), erledigt: false })),
  };
}

// ------------------------------------------------------------------ Datenschicht

export function checklisteAnlegen(vorlageId: ID, auftragId: ID, terminId?: ID) {
  const v = checklistenVorlagen.get(vorlageId);
  if (!v) return undefined;
  const c = checklisten.create(ausVorlage(v, auftragId, terminId));
  return c;
}

export function punktSetzen(checklisteId: ID, punktId: ID, patch: Partial<PunktStand>, vonId?: ID) {
  const c = checklisten.get(checklisteId);
  if (!c) return;
  const punkte = c.punkte.map((p) =>
    p.id !== punktId
      ? p
      : {
          ...p,
          ...patch,
          ...(patch.erledigt === true ? { erledigtAm: new Date().toISOString(), erledigtVon: vonId } : {}),
          ...(patch.erledigt === false ? { erledigtAm: undefined, erledigtVon: undefined } : {}),
        },
  );
  return checklisten.update(checklisteId, { punkte }, { text: patch.erledigt === false ? 'Punkt wieder geöffnet' : 'Punkt abgehakt' });
}

export function checklistenAm(auftragId: ID): Checkliste[] {
  return checklisten.where((c) => c.auftragId === auftragId).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm));
}

/** Offene Pflichtpunkte über alle Checklisten eines Auftrags – auch für andere Pakete (z. B. Abnahme) */
export function offenePflichtpunkte(auftragId: ID): { checkliste: Checkliste; punkt: PunktStand }[] {
  return checklistenAm(auftragId).flatMap((c) => c.punkte.filter((p) => p.pflicht && punktOffen(p)).map((punkt) => ({ checkliste: c, punkt })));
}

/** Passende automatische Vorlagen am Auftrag anlegen (jede Vorlage höchstens einmal) */
export function automatischAnlegen(a: Auftrag | undefined): Checkliste[] {
  if (!a) return [];
  const gewerk = db.betrieb.get('betrieb')?.gewerk;
  const vorhanden = new Set(checklistenAm(a.id).map((c) => c.vorlageId));
  const neu = passendeVorlagen(checklistenVorlagen.all(), gewerk, a.art)
    .filter((v) => v.automatisch && !vorhanden.has(v.id))
    .map((v) => checklisten.create(ausVorlage(v, a.id)));
  if (neu.length)
    erledigt('checklisten.automatisch', `${a.nummer}: ${neu.length === 1 ? `Checkliste „${neu[0].titel}“` : `${neu.length} Checklisten`} angelegt`, {
      bezug: { typ: 'auftraege', id: a.id },
    });
  return neu;
}
