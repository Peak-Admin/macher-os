/**
 * „Deine Arbeit“: alles, was für dich zur Bearbeitung bereitliegt – in einer Liste statt in vielen Kacheln.
 * Quellen: deine Aufgaben, Aufgaben von Kollegen im Urlaub (Vertretung), von Lotte vorbereitete Freigaben
 * und Entscheidungen, Angebotsentwürfe. Reine Regeln, ohne Datenbank testbar.
 */
import type { Abwesenheit, Angebot, Aufgabe, Auftrag, Bezug, ID, Mitarbeiter } from '@core/objects';
import type { WorkItem, WorkItemGruppe, WorkItemStatus } from '../typen';

export interface ArbeitStand {
  heute: string;
  ich: Pick<Mitarbeiter, 'id' | 'rolle'>;
  darfGeld: boolean;
  aufgaben: Aufgabe[];
  auftraege: Pick<Auftrag, 'id' | 'nummer' | 'titel' | 'kundeId'>[];
  abwesenheiten: Pick<Abwesenheit, 'mitarbeiterId' | 'von' | 'bis' | 'art' | 'status'>[];
  mitarbeiter: Pick<Mitarbeiter, 'id' | 'vorname'>[];
  hinweise: { schluessel: string; art: string; titel: string; text?: string; gewicht: number; pfad?: string; bezug?: Bezug; aktion?: string }[];
  angebote: Pick<Angebot, 'id' | 'titel' | 'status' | 'kundeId' | 'geaendertAm' | 'auftragId' | 'beispiel'>[];
  kundenName: (id: string | undefined) => string | undefined;
  pfad: (b: Bezug) => string | undefined;
  /** IDs (z. B. `angebote:<id>`), die schon als „nächster Schritt“ oben stehen */
  ohne?: string[];
}

const bueroRolle = (r: Mitarbeiter['rolle']) => r === 'chef' || r === 'buero';

function abwesendHeute(maId: ID | undefined, s: ArbeitStand) {
  if (!maId) return undefined;
  return s.abwesenheiten.find((a) => a.mitarbeiterId === maId && a.status === 'genehmigt' && a.von <= s.heute && a.bis >= s.heute);
}

export function arbeitsposten(s: ArbeitStand): WorkItem[] {
  const ohne = new Set(s.ohne ?? []);
  const auftrag = (id: ID | undefined) => s.auftraege.find((a) => a.id === id);
  const posten: WorkItem[] = [];

  for (const a of s.aufgaben) {
    if (a.erledigt || a.geloeschtAm) continue;
    const meine = a.zustaendigId === s.ich.id;
    // Urlaubsaufgabe: zuständig ist jemand, der heute fehlt – Büro und Chef springen ein
    const weg = !meine && bueroRolle(s.ich.rolle) ? abwesendHeute(a.zustaendigId, s) : undefined;
    if (!meine && !weg) continue;
    const au = auftrag(a.auftragId);
    const ueberfaellig = !!a.faellig && a.faellig < s.heute;
    const faelligHeute = a.faellig === s.heute;
    const kollege = weg ? s.mitarbeiter.find((m) => m.id === a.zustaendigId)?.vorname : undefined;
    const kontext = [au ? `${au.titel}${s.kundenName(au.kundeId) ? ` · ${s.kundenName(au.kundeId)}` : ''}` : undefined, ueberfaellig ? 'überfällig' : faelligHeute ? 'heute fällig' : a.faellig ? `fällig am ${a.faellig.split('-').reverse().join('.')}` : undefined]
      .filter(Boolean)
      .join(' · ');
    posten.push({
      id: `aufgaben:${a.id}`,
      type: weg ? 'vertretung' : 'aufgabe',
      title: weg ? `Urlaubsaufgabe: ${a.titel}` : a.titel,
      description: weg ? `${kollege ?? 'Ein Kollege'} ist nicht da.${kontext ? ` ${kontext}` : ''}` : kontext || 'Deine Aufgabe',
      status: 'to_do',
      gruppe: 'erledigen',
      priority: (weg ? 55 : 50) + (ueberfaellig ? 30 : faelligHeute ? 20 : 0) + (a.prioritaet === 'hoch' ? 10 : 0),
      updatedAt: a.geaendertAm,
      projectId: a.auftragId,
      assignedTo: a.zustaendigId,
      actionLabel: weg ? 'Übernehmen' : 'Öffnen',
      actionUrl: s.pfad({ typ: 'aufgaben', id: a.id }) ?? (au ? s.pfad({ typ: 'auftraege', id: au.id }) : undefined) ?? '/auftraege/aufgaben',
      ueberfaellig,
      beispiel: a.beispiel,
    });
  }

  // Von Lotte vorbereitet: Freigaben und Entscheidungen
  for (const h of s.hinweise) {
    if (h.art !== 'freigabe' && h.art !== 'entscheidung') continue;
    if (h.bezug && ohne.has(`${h.bezug.typ}:${h.bezug.id}`)) continue;
    const status: WorkItemStatus = 'ready';
    posten.push({
      id: `hinweis:${h.schluessel}`,
      type: h.art === 'freigabe' ? 'freigabe' : 'entscheidung',
      title: h.titel,
      description: h.text ?? (h.art === 'freigabe' ? 'Lotte hat das für dich vorbereitet. Prüfen und freigeben.' : 'Braucht deine Entscheidung.'),
      status,
      gruppe: h.art === 'freigabe' ? 'bestaetigen' : 'entscheiden',
      priority: 40 + Math.round(h.gewicht / 2),
      updatedAt: s.heute,
      actionLabel: h.art === 'freigabe' ? 'Prüfen' : 'Ansehen',
      actionUrl: h.pfad ?? (h.bezug ? s.pfad(h.bezug) : undefined) ?? '/heute/braucht-dich',
    });
  }

  if (s.darfGeld) {
    for (const a of s.angebote) {
      if (a.status !== 'entwurf' || ohne.has(`angebote:${a.id}`)) continue;
      const kunde = s.kundenName(a.kundeId);
      posten.push({
        id: `angebote:${a.id}`,
        type: 'angebot',
        title: kunde ? `${a.titel} · ${kunde}` : a.titel,
        description: 'Angebot ist vorbereitet – noch nicht verschickt',
        status: 'in_progress',
        gruppe: 'pruefen',
        priority: 45,
        updatedAt: a.geaendertAm,
        projectId: a.auftragId,
        actionLabel: 'Weiter bearbeiten',
        actionUrl: s.pfad({ typ: 'angebote', id: a.id }) ?? '/auftraege/angebote',
        beispiel: a.beispiel,
      });
    }
  }

  return posten.sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt));
}

export const GRUPPE_TEXT: Record<WorkItemGruppe, string> = {
  erledigen: 'Zu erledigen',
  pruefen: 'Zu prüfen',
  entscheiden: 'Zu entscheiden',
  bestaetigen: 'Zu bestätigen',
};

/** Gezeigte Posten nach Gruppe bündeln – Reihenfolge der Gruppen nach ihrem wichtigsten Posten (Exception-First) */
export function nachGruppe(posten: WorkItem[]): { gruppe: WorkItemGruppe; posten: WorkItem[] }[] {
  const out: { gruppe: WorkItemGruppe; posten: WorkItem[] }[] = [];
  for (const w of posten) {
    const g = w.gruppe ?? 'erledigen';
    const da = out.find((x) => x.gruppe === g);
    if (da) da.posten.push(w);
    else out.push({ gruppe: g, posten: [w] });
  }
  return out;
}

export const STATUS_TEXT: Record<WorkItemStatus, string> = {
  to_do: 'Zu erledigen',
  in_progress: 'In Bearbeitung',
  waiting: 'Wartet',
  ready: 'Bereit für dich',
  completed: 'Erledigt',
};
