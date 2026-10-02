/** Live-Hinweise der Auftragsakte für „Braucht dich“ */
import { db } from '@core/db';
import { heute } from '@core/format';
import type { HinweisVorschlag } from '@core/modul';
import { STILLSTAND_TAGE, alleEinsaetzeErledigt, istOffen, istVor, kommendeEinsaetze, phaseLabel, tageOhneBewegung } from './logik';
import { auftragPfad, letzteBewegungen } from './daten';

export function auftragHinweise(): HinweisVorschlag[] {
  const t = heute();
  const bewegung = letzteBewegungen();
  const liste: HinweisVorschlag[] = [];
  for (const a of db.auftraege.all().filter(istOffen)) {
    const kunde = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
    const termine = db.termine.where((x) => x.auftragId === a.id);
    const payload = { auftragId: a.id };
    const bezug = { typ: 'auftraege' as const, id: a.id };

    // Beauftragt, aber kein Termin: Kunde wartet, Geld liegt auf der Straße
    if (a.phase === 'beauftragt' && !kommendeEinsaetze(termine).length) {
      liste.push({
        schluessel: `auftrag-ohne-termin:${a.id}`,
        art: 'problem',
        titel: `${a.titel}: beauftragt, aber noch kein Termin`,
        text: `${kunde} · ${a.nummer}`,
        bezug,
        gewicht: a.dringend ? 80 : 63,
        aktionen: [{ aktion: 'auftrag.einplanen', label: 'Einplanen', primaer: true, payload }],
        pfad: auftragPfad(a.id),
      });
      continue;
    }

    // Alle Einsätze erledigt, aber noch offene Aufgaben – fertig oder nicht?
    if (a.phase === 'in_arbeit' && alleEinsaetzeErledigt(termine)) {
      const offen = db.aufgaben.where((x) => x.auftragId === a.id && !x.erledigt).length;
      liste.push({
        schluessel: `auftrag-fertig:${a.id}`,
        art: 'entscheidung',
        titel: `${a.titel}: alle Einsätze erledigt – ist der Auftrag fertig?`,
        text: `${kunde} · ${offen === 1 ? '1 Aufgabe ist' : `${offen} Aufgaben sind`} noch offen.`,
        bezug,
        gewicht: 54,
        aktionen: [
          { aktion: 'auftrag.zur-abnahme', label: 'Zur Abnahme', primaer: true, payload },
          { aktion: 'auftrag.einplanen', label: 'Weiteren Einsatz planen', payload },
        ],
        pfad: auftragPfad(a.id),
      });
      continue;
    }

    // Stillstand
    const tage = tageOhneBewegung(bewegung.get(a.id) ?? a.geaendertAm, t);
    if (tage > STILLSTAND_TAGE) {
      const frueh = istVor(a.phase, 'beauftragt');
      liste.push({
        schluessel: `auftrag-still:${a.id}`,
        art: 'entscheidung',
        titel: `${a.titel}: seit ${tage} Tagen keine Bewegung`,
        text: `${kunde} · steht auf „${phaseLabel(a.phase)}“`,
        bezug,
        gewicht: frueh ? 46 : 52,
        aktionen: [
          { aktion: 'auftrag.nachfassen', label: 'Nachfassen', primaer: true, payload },
          ...(frueh ? [{ aktion: 'auftrag.verloren', label: 'Als verloren markieren', payload }] : []),
        ],
        pfad: auftragPfad(a.id),
      });
    }
  }
  return liste;
}
