/** Aktionen und Automation der Nachkalkulation (mit Seiteneffekten auf die Datenschicht). */
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt, hinweis } from '@core/macher';
import type { Auftrag, ID } from '@core/objects';
import { basisAusDb } from '../kosten/basis';
import { nachkalkulation } from './daten';
import { kalkulationFuer } from './kalkulation';

export const AUTOMATION_ERLEDIGT = 'nachkalkulation-bei-erledigt';

/** Leistungsminuten an die tatsächliche Dauer anpassen (Lerneffekt) */
export function minutenAnpassen(payload: unknown) {
  const { leistungId, minuten } = (payload ?? {}) as { leistungId?: ID; minuten?: number };
  const l = db.leistungen.get(leistungId);
  if (!l || !minuten || minuten < 1) return;
  const alt = l.minuten;
  db.leistungen.update(l.id, { minuten }, { text: `Kalkulationszeit aus Nachkalkulation angepasst: ${alt ?? '–'} → ${minuten} min` });
  erledigt('nachkalkulation-lerneffekt', `„${l.name}“ auf ${minuten} min angepasst`, {
    text: `Vorher ${alt ?? '–'} min je Einheit – aus der Nachkalkulation abgeschlossener Aufträge.`,
    bezug: { typ: 'leistungen', id: l.id },
    minuten: 5,
    rueckgaengig: { aktion: 'nachkalkulation.minutenAnpassen', payload: { leistungId: l.id, minuten: alt } },
  });
}

/** Nachkalkulation für einen gerade erledigten Auftrag als Hinweis bereitstellen */
export function nachkalkulationMelden(a: Auftrag) {
  const n = nachkalkulation(a, basisAusDb(), kalkulationFuer(a.id));
  const bezug = { typ: 'auftraege' as const, id: a.id };
  if (!n.hatIst && !n.hatSoll) {
    hinweis({
      art: 'info',
      titel: `Nachkalkulation ${a.nummer} nicht möglich`,
      text: 'Es gibt weder ein Soll (angenommenes Angebot, geplante Stunden) noch gebuchte Zeiten, Material oder Belege. Trag fehlende Zeiten nach, damit du aus dem Auftrag lernen kannst.',
      bezug,
      gewicht: 24,
      fuerRollen: ['chef', 'buero'],
      schluessel: `nachkalkulation:${a.id}`,
      aktionen: [{ id: 'nachkalkulation.oeffnen', label: 'Ansehen', primaer: true, payload: { auftragId: a.id } }],
    });
    return;
  }
  hinweis({
    art: 'info',
    titel: `Nachkalkulation ${a.nummer}: ${n.bewertung.text}`,
    text: n.saetze.slice(0, 3).join(' '),
    bezug,
    gewicht: n.bewertung.ton === 'achtung' ? 48 : 30,
    fuerRollen: ['chef', 'buero'],
    schluessel: `nachkalkulation:${a.id}`,
    aktionen: [{ id: 'nachkalkulation.oeffnen', label: 'Nachkalkulation ansehen', primaer: true, payload: { auftragId: a.id } }],
  });
  erledigt(AUTOMATION_ERLEDIGT, `Nachkalkulation für ${a.nummer} erstellt`, { text: n.saetze[0], bezug });
}

export function starteNachkalkulationsAutomation() {
  return on('auftraege.updated', (e) => {
    const neu = e.objekt as Auftrag | undefined;
    const alt = e.vorher as Auftrag | undefined;
    if (!neu || neu.phase !== 'erledigt' || alt?.phase === 'erledigt') return;
    nachkalkulationMelden(neu);
  });
}
