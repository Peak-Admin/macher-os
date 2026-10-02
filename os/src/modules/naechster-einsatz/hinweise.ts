/**
 * Ausnahmen rund um Einsätze für „Braucht dich“:
 * – Monteur: Einsatz ist vorbei, aber nicht beendet (Zeit läuft womöglich weiter).
 * – Chef/Büro: Einsatz hätte längst starten sollen, niemand ist unterwegs.
 */
import { db } from '@core/db';
import { datumVon, isoDatum, personName, uhrzeit } from '@core/format';
import type { HinweisVorschlag } from '@core/modul';
import { ortKurz } from '@modules/mein-tag/logik';

/** Minuten Kulanz, bevor ein Einsatz als „nicht beendet“ gilt */
export const NACHLAUF_MINUTEN = 30;
/** Minuten Kulanz, bevor ein Einsatz als „nicht gestartet“ gilt */
export const VERSPAETUNG_MINUTEN = 20;

const ART_MIT_START = ['einsatz', 'wartung', 'abnahme'];

export function einsatzHinweise(jetzt = new Date()): HinweisVorschlag[] {
  const ms = jetzt.getTime();
  const tag = isoDatum(jetzt);
  const out: HinweisVorschlag[] = [];

  for (const t of db.termine.where((x) => !!x.start && x.status !== 'abgesagt' && x.status !== 'erledigt')) {
    const start = new Date(t.start).getTime();
    const ende = new Date(t.ende || t.start).getTime();
    const wo = ortKurz(t);

    // Läuft noch, obwohl längst vorbei → jeder eingeteilte Mitarbeiter bekommt den Hinweis
    if ((t.status === 'vor_ort' || t.status === 'unterwegs') && ms - ende > NACHLAUF_MINUTEN * 60_000) {
      for (const mid of t.mitarbeiterIds) {
        out.push({
          schluessel: `einsatz-nicht-beendet:${t.id}:${mid}`,
          art: 'problem',
          titel: `Einsatz noch nicht beendet: ${t.titel}`,
          text: `Geplant bis ${uhrzeit(t.ende)}${datumVon(t.start) !== tag ? ` am ${new Date(t.start).toLocaleDateString('de-DE')}` : ''}${wo ? ` · ${wo}` : ''}. Beende ihn, damit Zeiten und Status stimmen.`,
          bezug: { typ: 'termine', id: t.id },
          gewicht: 56,
          fuerMitarbeiterId: mid,
          aktionen: [{ aktion: 'heute.einsatz.beenden', label: 'Einsatz beenden', primaer: true, payload: { terminId: t.id } }],
          pfad: `/heute/naechster-einsatz/${t.id}`,
        });
      }
      continue;
    }

    // Hätte starten sollen, aber niemand ist unterwegs → Chef/Büro
    if (
      ART_MIT_START.includes(t.art) &&
      (t.status === 'geplant' || t.status === 'bestaetigt') &&
      datumVon(t.start) === tag &&
      t.mitarbeiterIds.length > 0 &&
      ms - start > VERSPAETUNG_MINUTEN * 60_000 &&
      ms < ende &&
      !zeitLaeuft(t.mitarbeiterIds, t.auftragId, tag)
    ) {
      const wer = t.mitarbeiterIds.map((id) => personName(db.mitarbeiter.get(id))).join(', ');
      out.push({
        schluessel: `einsatz-nicht-gestartet:${t.id}`,
        art: 'problem',
        titel: `Noch nicht gestartet: ${t.titel}`,
        text: `${wer} · geplant ab ${uhrzeit(t.start)}${wo ? ` · ${wo}` : ''}. Frag kurz nach, ob alles passt.`,
        bezug: { typ: 'termine', id: t.id },
        gewicht: 42,
        fuerRollen: ['chef', 'buero'],
        aktionen: [{ aktion: 'heute.einsatz.starten', label: 'Als gestartet markieren', payload: { terminId: t.id } }],
        pfad: `/heute/naechster-einsatz/${t.id}`,
      });
    }
  }
  return out;
}

function zeitLaeuft(mitarbeiterIds: string[], auftragId: string | undefined, tag: string) {
  return db.zeiten.where((z) => mitarbeiterIds.includes(z.mitarbeiterId) && z.datum === tag && !z.ende && (!auftragId || z.auftragId === auftragId)).length > 0;
}
