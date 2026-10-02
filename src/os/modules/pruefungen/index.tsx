import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { benachrichtigen, erledigt } from '@core/macher';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { datum, heute } from '@core/format';
import { woIst } from '../werkzeuge/daten';
import { faelligkeit, pruefliste } from './daten';
import { PruefungenListe } from './PruefungenListe';

const AUTOMATION = 'pruefungen.besitzer-warnen';

/** Wer ein Gerät mit überfälliger Prüfung hat, bekommt einmal eine Nachricht. */
export function besitzerWarnen() {
  for (const { b, f } of pruefliste()) {
    if (f.stufe !== 'ueberfaellig' || !b.mitarbeiterId) continue;
    const key = `pruefungen.gewarnt.${b.id}.${b.naechstePruefung}`;
    if (einstellung(key, false)) continue;
    benachrichtigen(`Nicht verwenden: ${b.name}`, {
      text: `${b.pruefungArt ?? 'Prüfung'} war am ${datum(b.naechstePruefung)} fällig. Bitte bring es zur Prüfung oder gib es im Lager ab.`,
      bezug: { typ: 'betriebsmittel', id: b.id },
      fuer: b.mitarbeiterId,
      wichtig: true,
    });
    erledigt(AUTOMATION, `${b.name}: Mitarbeiter vor überfälliger Prüfung gewarnt`, { bezug: { typ: 'betriebsmittel', id: b.id } });
    setzeEinstellung(key, true);
  }
}

export default defineModul({
  id: 'pruefungen',
  titel: 'Prüfungen & Wartung',
  bereich: 'betrieb',
  gruppe: 'werkzeuge',
  beschreibung: 'Erinnert an TÜV, DGUV V3, UVV, Leiterprüfung und Kalibrierung.',
  icon: 'schild',
  gewicht: 70,
  routen: [{ pfad: '', element: PruefungenListe }],
  kurzinfo: () => {
    const l = pruefliste();
    if (!l.length) return undefined;
    const ueber = l.filter((x) => x.f.stufe === 'ueberfaellig').length;
    if (ueber) return { text: `${ueber} überfällig`, ton: 'achtung' };
    const bald = l.filter((x) => x.f.stufe === 'tage14' || x.f.stufe === 'tage30').length;
    return bald ? { text: `${bald} in den nächsten 30 Tagen`, ton: 'aktiv' } : { text: 'Alle Fristen im grünen Bereich', ton: 'erfolg' };
  },
  hinweise: () => {
    const t = heute();
    return db.betriebsmittel
      .where((b) => b.status !== 'ausgemustert' && !!b.naechstePruefung)
      .flatMap((b): HinweisVorschlag[] => {
        const f = faelligkeit(b, t);
        if (f.stufe === 'ok' || f.stufe === 'keine') return [];
        const art = b.pruefungArt ?? 'Prüfung';
        const wo = woIst(b).text;
        const aktion = { aktion: 'pruefung.dokumentieren', label: 'Prüfung eintragen', primaer: true, payload: { id: b.id } };
        if (f.stufe === 'ueberfaellig')
          return [{ schluessel: `pruefung:${b.id}:${b.naechstePruefung}:ueber`, art: 'problem', sicherheit: true, titel: `${art} überfällig: ${b.name} – nicht verwenden!`, text: `Fällig seit ${datum(b.naechstePruefung)} · ${wo}`, bezug: { typ: 'betriebsmittel', id: b.id }, gewicht: b.art === 'fahrzeug' ? 90 : 80, faellig: b.naechstePruefung, aktionen: [aktion], pfad: `/betrieb/werkzeuge/${b.id}` }];
        if (f.stufe === 'tage14')
          return [{ schluessel: `pruefung:${b.id}:${b.naechstePruefung}:14`, art: 'problem', titel: `${art} ${f.tage === 0 ? 'heute' : `in ${f.tage} ${f.tage === 1 ? 'Tag' : 'Tagen'}`} fällig: ${b.name}`, text: `Termin machen · ${wo}`, bezug: { typ: 'betriebsmittel', id: b.id }, gewicht: 55, faellig: b.naechstePruefung, aktionen: [aktion], pfad: `/betrieb/werkzeuge/${b.id}` }];
        return [{ schluessel: `pruefung:${b.id}:${b.naechstePruefung}:30`, art: 'info', titel: `${art} in ${f.tage} Tagen: ${b.name}`, text: `Fällig am ${datum(b.naechstePruefung)} – jetzt Termin vereinbaren`, bezug: { typ: 'betriebsmittel', id: b.id }, gewicht: 30, faellig: b.naechstePruefung, aktionen: [aktion], pfad: `/betrieb/werkzeuge/${b.id}` }];
      });
  },
  aktionen: {
    'pruefung.dokumentieren': (p) => `/betrieb/werkzeuge/${(p as { id: string }).id}?pruefung=1`,
  },
  automationen: [
    {
      id: AUTOMATION,
      titel: 'Bei überfälliger Prüfung warnen',
      beschreibung: 'Wer ein Gerät mit überfälliger Prüfung hat, bekommt eine Nachricht: nicht verwenden, zur Prüfung bringen.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const t = setInterval(besitzerWarnen, 60 * 60 * 1000);
        return () => clearInterval(t);
      },
      pruefen: besitzerWarnen,
    },
  ],
});
