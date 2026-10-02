import { db } from '@core/db';
import { datum, datumVon, heute as heuteDatum, personName } from '@core/format';
import type { HinweisVorschlag } from '@core/modul';
import type { Nachweis } from '@core/objects';
import { istAktiv } from '@modules/mitarbeiter/team';
import { schulungen } from '@modules/schulungen/daten';
import { ablaufStufe, aktuellerNachweis, gueltigBisAus, statusAnzeige } from './daten';

/** Ablauf-Hinweise 60 / 30 Tage vorher und nach Ablauf – nur für den jeweils aktuellsten Nachweis */
export function qualiHinweise(t = heuteDatum()): HinweisVorschlag[] {
  const alle = db.nachweise.all();
  const liste: HinweisVorschlag[] = [];
  const geplant = schulungen
    .where((s) => s.status === 'geplant' && !!s.qualifikationId)
    .map((s) => ({ s, t: db.termine.get(s.terminId) }))
    .filter((x) => x.t && datumVon(x.t.start) >= t);
  for (const n of alle) {
    const m = db.mitarbeiter.get(n.mitarbeiterId);
    const q = db.qualifikationen.get(n.qualifikationId);
    if (!m || !q || q.geloeschtAm || !istAktiv(m, t)) continue;
    if (aktuellerNachweis(alle, m.id, q.id)?.id !== n.id) continue;
    const stufe = ablaufStufe(n, t);
    if (stufe == null) continue;
    const schon = geplant.find((x) => x.s.qualifikationId === q.id && x.t!.mitarbeiterIds.includes(m.id));
    if (schon && stufe !== 0) continue; // Schulung ist schon geplant – nichts zu tun
    const s = statusAnzeige(n, t);
    liste.push({
      schluessel: `quali-ablauf:${n.id}:${stufe}`,
      art: stufe === 0 ? 'problem' : 'entscheidung',
      titel: `${q.name} von ${personName(m)}: ${s.text[0].toLowerCase() + s.text.slice(1)}`,
      text: schon
        ? `Schulung am ${datum(schon.t!.start)} ist geplant. Bis dahin darf ${m.vorname} keine Arbeiten machen, die das voraussetzen.`
        : stufe === 0
          ? `${m.vorname} darf Arbeiten, die das voraussetzen, nicht mehr übernehmen. Plane eine Schulung oder trag den neuen Nachweis ein.`
          : 'Plane jetzt die Auffrischung, damit es keine Lücke gibt.',
      bezug: { typ: 'mitarbeiter', id: m.id },
      gewicht: stufe === 0 ? 75 : stufe === 30 ? 55 : 35,
      fuerRollen: ['chef', 'buero'],
      faellig: n.gueltigBis,
      aktionen: schon ? undefined : [{ aktion: 'schulung.planen', label: 'Schulung planen', primaer: true, payload: { qualifikationId: q.id, mitarbeiterIds: [m.id] } }],
      pfad: `/betrieb/qualifikationen/${q.id}`,
    });
  }
  return liste;
}

/** „Gültig bis“ aus Erwerb + Gültigkeit der Qualifikation ergänzen. Gibt true zurück, wenn ergänzt. */
export function gueltigkeitErgaenzen(n: Nachweis): boolean {
  if (n.gueltigBis || !n.erworbenAm) return false;
  const q = db.qualifikationen.get(n.qualifikationId);
  const bis = gueltigBisAus(n.erworbenAm, q?.gueltigMonate);
  if (!bis) return false;
  db.nachweise.update(n.id, { gueltigBis: bis }, { text: `Gültig bis ${datum(bis)} ergänzt` });
  return true;
}
