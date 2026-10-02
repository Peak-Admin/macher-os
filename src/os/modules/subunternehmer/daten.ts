/**
 * Subunternehmer: Fremdfirmen mit Gewerk, Stundensatz, Nachweisen und Einsätzen an Aufträgen.
 * Firma, Kontakt und Adresse stehen im Kernobjekt `lieferanten` (eine Firma = ein Objekt,
 * Eingangsrechnungen hängen per `lieferantId` dran). Hier liegt nur, was Subunternehmer zusätzlich brauchen.
 */
import { defineCollection } from '@core/db';
import { datum, plusTage, tageZwischen } from '@core/format';
import type { HinweisVorschlag } from '@core/modul';
import type { Basis, Cent, Datum, ID } from '@core/objects';

export type NachweisArt =
  | 'freistellung_48b'
  | 'unbedenklichkeit_finanzamt'
  | 'unbedenklichkeit_krankenkasse'
  | 'unbedenklichkeit_bg'
  | 'haftpflicht'
  | 'sonstiges';

export const NACHWEIS_ARTEN: { id: NachweisArt; label: string; text: string; pflicht?: boolean }[] = [
  {
    id: 'freistellung_48b',
    label: 'Freistellungsbescheinigung § 48b EStG',
    text: 'Ohne gültige Bescheinigung musst du bei Bauleistungen in der Regel 15 % Bauabzugsteuer einbehalten und ans Finanzamt abführen.',
    pflicht: true,
  },
  { id: 'unbedenklichkeit_finanzamt', label: 'Unbedenklichkeitsbescheinigung Finanzamt', text: 'Zeigt, dass keine Steuerschulden offen sind.' },
  { id: 'unbedenklichkeit_krankenkasse', label: 'Unbedenklichkeitsbescheinigung Krankenkasse', text: 'Zeigt, dass Sozialversicherungsbeiträge bezahlt sind – sonst kann es dich als Auftraggeber treffen.' },
  { id: 'unbedenklichkeit_bg', label: 'Unbedenklichkeitsbescheinigung Berufsgenossenschaft', text: 'Zeigt, dass Beiträge zur Unfallversicherung bezahlt sind.' },
  { id: 'haftpflicht', label: 'Betriebshaftpflicht', text: 'Nachweis über eine bestehende Haftpflichtversicherung.' },
  { id: 'sonstiges', label: 'Sonstiger Nachweis', text: '' },
];

export interface SubNachweis {
  id: ID;
  art: NachweisArt;
  gueltigBis?: Datum;
  /** Scan/Foto als `dokumente` */
  dokumentId?: ID;
  notiz?: string;
}

export interface SubEinsatz {
  id: ID;
  auftragId: ID;
  von: Datum;
  bis?: Datum;
  /** was macht der Subunternehmer? */
  leistung: string;
  /** vereinbarte oder erwartete Kosten netto */
  kosten?: Cent;
  status: 'geplant' | 'laeuft' | 'erledigt';
}

export interface Subunternehmer extends Basis {
  lieferantId: ID;
  gewerk: string;
  ansprechpartner?: string;
  /** Stundensatz netto */
  stundensatz?: Cent;
  nachweise: SubNachweis[];
  einsaetze: SubEinsatz[];
  notiz?: string;
  aktiv: boolean;
}

export const subunternehmer = defineCollection<Subunternehmer>('subunternehmer');

export const EINSATZ_STATUS: { wert: SubEinsatz['status']; label: string }[] = [
  { wert: 'geplant', label: 'Geplant' },
  { wert: 'laeuft', label: 'Läuft' },
  { wert: 'erledigt', label: 'Erledigt' },
];

/** Vorwarnzeit für ablaufende Nachweise */
export const VORWARNUNG_TAGE = 30;

export type NachweisStatus = 'gueltig' | 'laeuft_ab' | 'abgelaufen' | 'ohne_datum';

export function nachweisStatus(n: SubNachweis, heute: Datum): NachweisStatus {
  if (!n.gueltigBis) return 'ohne_datum';
  if (n.gueltigBis < heute) return 'abgelaufen';
  if (n.gueltigBis <= plusTage(heute, VORWARNUNG_TAGE)) return 'laeuft_ab';
  return 'gueltig';
}

/** Aktuell gültigster Nachweis einer Art (spätestes Ablaufdatum) */
export function bester(sub: Subunternehmer, art: NachweisArt): SubNachweis | undefined {
  return sub.nachweise.filter((n) => n.art === art).sort((a, b) => (b.gueltigBis ?? '9999').localeCompare(a.gueltigBis ?? '9999'))[0];
}

export function offeneEinsaetze(sub: Subunternehmer): SubEinsatz[] {
  return sub.einsaetze.filter((e) => e.status !== 'erledigt');
}

/** Freistellung fehlt oder ist abgelaufen? */
export function freistellungFehlt(sub: Subunternehmer, heute: Datum): boolean {
  const n = bester(sub, 'freistellung_48b');
  return !n || nachweisStatus(n, heute) === 'abgelaufen';
}

/** Kurzstatus für Listen: schlimmstes zuerst */
export function subStatus(sub: Subunternehmer, heute: Datum): { text: string; ton: 'achtung' | 'aktiv' | 'erfolg' | 'neutral' } {
  if (freistellungFehlt(sub, heute)) return { text: bester(sub, 'freistellung_48b') ? 'Freistellung abgelaufen' : 'Freistellung fehlt', ton: 'achtung' };
  const arten = [...new Set(sub.nachweise.map((n) => n.art))];
  const st = arten.map((a) => nachweisStatus(bester(sub, a)!, heute));
  if (st.includes('abgelaufen')) return { text: 'Nachweis abgelaufen', ton: 'achtung' };
  if (st.includes('laeuft_ab')) return { text: 'Nachweis läuft ab', ton: 'aktiv' };
  return { text: 'Nachweise in Ordnung', ton: 'erfolg' };
}

export function kostenSumme(einsaetze: SubEinsatz[]): Cent {
  return einsaetze.reduce((s, e) => s + (e.kosten ?? 0), 0);
}

/** Exception-First: was muss das Büro bei Subunternehmern tun? */
export function subHinweise(subs: Subunternehmer[], name: (s: Subunternehmer) => string, heute: Datum): HinweisVorschlag[] {
  const liste: HinweisVorschlag[] = [];
  for (const s of subs) {
    if (!s.aktiv) continue;
    const pfad = `/betrieb/subunternehmer/${s.id}`;
    const offen = offeneEinsaetze(s);
    const frei = bester(s, 'freistellung_48b');
    if (offen.length && freistellungFehlt(s, heute)) {
      liste.push({
        schluessel: `sub-freistellung:${s.id}:${frei?.gueltigBis ?? 'fehlt'}`,
        art: 'problem',
        titel: frei ? `Freistellungsbescheinigung von ${name(s)} ist abgelaufen` : `Freistellungsbescheinigung von ${name(s)} fehlt`,
        text: 'Ohne gültige Bescheinigung musst du bei Bauleistungen in der Regel 15 % Bauabzugsteuer einbehalten. Fordere eine neue an, bevor du bezahlst.',
        gewicht: 80,
        fuerRollen: ['chef', 'buero'],
        pfad,
      });
    }
    const arten = [...new Set(s.nachweise.map((n) => n.art))];
    for (const art of arten) {
      const n = bester(s, art)!;
      const st = nachweisStatus(n, heute);
      const label = NACHWEIS_ARTEN.find((a) => a.id === art)?.label ?? 'Nachweis';
      if (st === 'laeuft_ab') {
        const tage = tageZwischen(heute, n.gueltigBis!);
        liste.push({
          schluessel: `sub-nachweis-laeuft-ab:${s.id}:${n.id}`,
          art: 'info',
          titel: `${label} von ${name(s)} läuft ${tage === 0 ? 'heute' : tage === 1 ? 'morgen' : `in ${tage} Tagen`} ab`,
          text: `Gültig bis ${datum(n.gueltigBis)}. Fordere rechtzeitig eine neue an.`,
          gewicht: art === 'freistellung_48b' ? 48 : 36,
          fuerRollen: ['chef', 'buero'],
          faellig: n.gueltigBis,
          pfad,
        });
      } else if (st === 'abgelaufen' && art !== 'freistellung_48b' && offen.length) {
        liste.push({
          schluessel: `sub-nachweis-abgelaufen:${s.id}:${n.id}`,
          art: 'problem',
          titel: `${label} von ${name(s)} ist abgelaufen`,
          text: `${offen.length === 1 ? 'Ein Einsatz ist' : `${offen.length} Einsätze sind`} noch offen. Fordere einen aktuellen Nachweis an.`,
          gewicht: 54,
          fuerRollen: ['chef', 'buero'],
          pfad,
        });
      }
    }
  }
  return liste;
}
