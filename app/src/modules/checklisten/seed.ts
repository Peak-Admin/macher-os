import { batch, db } from '@core/db';
import { checklisten, checklistenVorlagen, ausVorlage, type ChecklistenVorlage } from './daten';
import { vorlagenFuer } from './vorlagen';

/** Startvorlagen fürs Gewerk + Beispiel-Checklisten an den Beispielaufträgen */
export function seedChecklisten() {
  if (checklistenVorlagen.all().length) return;
  const gewerk = db.betrieb.get('betrieb')?.gewerk;
  batch(() => {
    const vorlagen: ChecklistenVorlage[] = vorlagenFuer(gewerk).map((v) =>
      checklistenVorlagen.create({
        name: v.name,
        beschreibung: v.beschreibung,
        gewerke: v.gewerke,
        arten: v.arten,
        automatisch: v.automatisch,
        aktiv: true,
        punkte: v.punkte.map(([text, pflicht, foto], i) => ({ id: `p${i + 1}`, text, pflicht: pflicht || undefined, fotoPflicht: foto || undefined })),
      }),
    );

    // Beispiele: laufende Baustelle (Start fast fertig) und Wartung
    const beispiele = db.auftraege.where((a) => !!a.beispiel);
    const baustelle = beispiele.find((a) => a.phase === 'in_arbeit');
    const start = vorlagen.find((v) => v.name === 'Baustelle: Start');
    if (baustelle && start) {
      const c = ausVorlage(start, baustelle.id);
      c.punkte = c.punkte.map((p, i) => (i < 2 || i === 3 ? { ...p, erledigt: true, erledigtAm: new Date().toISOString() } : p));
      checklisten.create({ ...c, beispiel: true }, { leise: true });
      const ende = vorlagen.find((v) => v.name === 'Baustelle: Abschluss und Übergabe');
      if (ende) checklisten.create({ ...ausVorlage(ende, baustelle.id), beispiel: true }, { leise: true });
    }
    const wartung = beispiele.find((a) => a.art === 'wartung');
    const wv = vorlagen.find((v) => v.arten.includes('wartung') && v.automatisch) ?? vorlagen.find((v) => v.name === 'Kundendienst-Einsatz');
    if (wartung && wv) checklisten.create({ ...ausVorlage(wv, wartung.id), beispiel: true }, { leise: true });
  });
}
