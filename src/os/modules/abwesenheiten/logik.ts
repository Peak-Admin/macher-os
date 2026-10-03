/** Abwesenheiten: Antrag, Entscheidung, Krankmeldung, Hinweise – ohne React, damit testbar. */
import { db, vermerken } from '@core/db';
import { emit, on } from '@core/events';
import { benachrichtigen } from '@core/macher';
import type { HinweisVorschlag } from '@core/modul';
import { datum, heute as heuteDatum, personName } from '@core/format';
import type { Abwesenheit, AbwesenheitsArt, Datum, ID } from '@core/objects';
import { ART_LABEL, arbeitstage, kollisionen, tageText, urlaubskonto, zeitraumText } from './daten';

export interface Antrag {
  mitarbeiterId: ID;
  art: AbwesenheitsArt;
  von: Datum;
  bis: Datum;
  halbtags?: boolean;
  notiz?: string;
}

/**
 * Urlaub/Frei wird beantragt (Chef entscheidet), Krankheit und Berufsschule gelten sofort.
 * Wer selbst das Recht `personal` hat (Chef), trägt direkt genehmigt ein.
 */
export function eintragen(a: Antrag, opts: { direktGenehmigt?: boolean } = {}): Abwesenheit {
  const sofort = opts.direktGenehmigt || a.art === 'krank' || a.art === 'schule' || a.art === 'schulung';
  const x = db.abwesenheiten.create({ ...a, status: sofort ? 'genehmigt' : 'beantragt' });
  vermerken({ typ: 'mitarbeiter', id: a.mitarbeiterId }, 'abwesenheit.eingetragen', `${ART_LABEL[a.art]} ${zeitraumText(a)} ${sofort ? 'eingetragen' : 'beantragt'}`);
  return x;
}

/**
 * Fachliches Ereignis `mitarbeiter.abwesend`: eine Abwesenheit ist wirksam geworden – sofort genehmigt
 * angelegt (Krankheit, Berufsschule, vom Chef eingetragen) oder ein Antrag wurde genehmigt.
 * Planung, Arbeitszeiten und Automationen hängen sich daran, ohne das Modul zu kennen.
 */
export function abwesendMelden(a: Abwesenheit | undefined, vorher?: Abwesenheit): boolean {
  if (!a || a.geloeschtAm || a.status !== 'genehmigt' || vorher?.status === 'genehmigt') return false;
  emit({
    typ: 'mitarbeiter.abwesend',
    sammlung: 'abwesenheiten',
    objekt: a,
    daten: { mitarbeiterId: a.mitarbeiterId, abwesenheitId: a.id, art: a.art, von: a.von, bis: a.bis, halbtags: !!a.halbtags },
  });
  return true;
}

/** Hört auf alle Wege, auf denen Abwesenheiten entstehen (Formular, Lotte, Import) – einmal beim Start */
export function abwesendBeobachten(): () => void {
  const aus1 = on('abwesenheiten.created', (e) => abwesendMelden(e.objekt as Abwesenheit));
  const aus2 = on('abwesenheiten.updated', (e) => abwesendMelden(e.objekt as Abwesenheit, e.vorher as Abwesenheit | undefined));
  return () => {
    aus1();
    aus2();
  };
}

/** Offene Anträge (Urlaub, Frei), über die der Chef noch entscheiden muss – nach Beginn sortiert */
export function offeneAntraege(alle: Abwesenheit[], t: Datum = heuteDatum()): Abwesenheit[] {
  return alle.filter((a) => !a.geloeschtAm && a.status === 'beantragt' && a.bis >= t).sort((a, b) => a.von.localeCompare(b.von));
}

export function entscheiden(id: ID, genehmigt: boolean): Abwesenheit | undefined {
  const a = db.abwesenheiten.get(id);
  if (!a || a.status !== 'beantragt') return a;
  return db.abwesenheiten.update(id, { status: genehmigt ? 'genehmigt' : 'abgelehnt' }, { text: genehmigt ? 'Genehmigt' : 'Abgelehnt' });
}

export function bescheidSenden(a: Abwesenheit) {
  benachrichtigen(`${ART_LABEL[a.art]} ${zeitraumText(a)} ${a.status === 'genehmigt' ? 'genehmigt' : 'abgelehnt'}`, {
    text: a.status === 'genehmigt' ? 'Viel Spaß und gute Erholung!' : 'Sprich bei Fragen kurz mit dem Chef.',
    bezug: { typ: 'abwesenheiten', id: a.id },
    fuer: a.mitarbeiterId,
    art: 'abwesenheit.bescheid',
    grund: 'Es ist dein Antrag.',
    quelleId: `abwesenheit-bescheid:${a.id}:${a.status}`,
  });
}

export function krankInfo(a: Abwesenheit) {
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const termine = kollisionen(a, db.termine.all());
  const empfaenger = db.mitarbeiter.where((x) => x.aktiv && (x.rolle === 'chef' || x.rolle === 'buero') && x.id !== a.mitarbeiterId);
  for (const e of empfaenger)
    benachrichtigen(`${personName(m)} ist krank (${zeitraumText(a)})`, {
      text: termine.length ? `${termine.length === 1 ? '1 Termin muss' : `${termine.length} Termine müssen`} umgeplant werden.` : 'Keine Termine betroffen.',
      bezug: { typ: 'abwesenheiten', id: a.id },
      fuer: e.id,
      art: 'abwesenheit.krank',
      // betroffene Termine meldet die Einsatzplanung als eigene Aktion („umplanen“)
      grund: e.rolle === 'chef' ? 'Du bist Chef im Betrieb.' : 'Du planst im Büro.',
      quelleId: `krank:${a.id}:${a.von}:${a.bis}`,
    });
  return empfaenger.length;
}

export function abwesenheitenHinweise(t = heuteDatum()): HinweisVorschlag[] {
  const alle = db.abwesenheiten.all();
  const termine = db.termine.all();
  const liste: HinweisVorschlag[] = [];
  for (const a of alle) {
    const m = db.mitarbeiter.get(a.mitarbeiterId);
    if (!m) continue;
    if (a.status === 'beantragt' && a.bis >= t) {
      const tage = arbeitstage(a.von, a.bis, a.halbtags);
      const k = urlaubskonto(m, alle, Number(a.von.slice(0, 4)));
      const betroffen = kollisionen(a, termine);
      const teile = [tageText(tage)];
      if (a.art === 'urlaub') teile.push(`Rest danach ${k.rest - tage} Tage`);
      if (betroffen.length) teile.push(`${betroffen.length === 1 ? '1 Termin' : `${betroffen.length} Termine`} im Zeitraum`);
      const andere = alle.filter((x) => x.id !== a.id && x.mitarbeiterId !== a.mitarbeiterId && x.status !== 'abgelehnt' && x.art === 'urlaub' && x.von <= a.bis && x.bis >= a.von);
      if (andere.length) teile.push(`gleichzeitig weg: ${andere.map((x) => db.mitarbeiter.get(x.mitarbeiterId)?.vorname).join(', ')}`);
      liste.push({
        schluessel: `abwesenheit-antrag:${a.id}`,
        art: 'freigabe',
        titel: `${ART_LABEL[a.art]} genehmigen: ${personName(m)}, ${zeitraumText(a)}`,
        text: teile.join(' · '),
        bezug: { typ: 'abwesenheiten', id: a.id },
        gewicht: a.von <= t ? 80 : 65,
        fuerRollen: ['chef'],
        faellig: a.von,
        aktionen: [
          { aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', primaer: true, payload: { id: a.id } },
          { aktion: 'abwesenheit.ablehnen', label: 'Ablehnen', payload: { id: a.id } },
        ],
        pfad: `/betrieb/abwesenheiten/${a.id}`,
      });
    }
    if (a.status === 'genehmigt' && a.bis >= t) {
      const betroffen = kollisionen({ ...a, von: a.von < t ? t : a.von }, termine);
      if (!betroffen.length) continue;
      const erster = betroffen[0];
      liste.push({
        schluessel: `abwesenheit-kollision:${a.id}:${betroffen.length}`,
        art: 'problem',
        titel: `${m.vorname} ist ${a.art === 'krank' ? 'krank' : `im ${ART_LABEL[a.art]}`}: ${betroffen.length === 1 ? '1 Termin' : `${betroffen.length} Termine`} umplanen`,
        text: betroffen
          .slice(0, 3)
          .map((x) => `${datum(x.start)} ${x.titel}`)
          .join(' · '),
        bezug: { typ: 'abwesenheiten', id: a.id },
        gewicht: a.art === 'krank' ? 85 : 60,
        fuerRollen: ['chef', 'buero'],
        faellig: erster.start.slice(0, 10),
        aktionen: erster.auftragId ? [{ aktion: 'plan.einplanen', label: 'Umplanen', primaer: true, payload: { auftragId: erster.auftragId } }] : undefined,
        pfad: `/betrieb/abwesenheiten/${a.id}`,
      });
    }
  }
  return liste;
}
