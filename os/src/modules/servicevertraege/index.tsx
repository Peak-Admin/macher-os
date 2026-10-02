import { defineModul, pfadZu, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { automationAn, erledigt, hinweisAusblenden } from '@core/macher';
import { datum, euro, heute, passt, plusTage, tageZwischen, plusMonate } from '@core/format';
import { gewerkVorlage } from '@core/gewerke';
import type { ID } from '@core/objects';
import { VertragListe } from './VertragListe';
import { VertragForm } from './VertragForm';
import { VertragDetail } from './VertragDetail';
import { AnlageVertragPanel, KundeVertraegePanel } from './Panels';
import { abrechnen, faelligeAbrechnung, kuendigenBis, laufzeitBis, naechsteVertragsnummer, servicevertraege, verlaengern, zustand } from './daten';

const REGEL_ABRECHNUNG = 'servicevertraege.abrechnung';

/** Alle fälligen Perioden abrechnen (Rückstände bis max. 12 je Vertrag) */
function abrechnungenErstellen() {
  for (const v of servicevertraege.all()) {
    for (let i = 0; i < 12 && faelligeAbrechnung(servicevertraege.get(v.id)!); i++) {
      const f = faelligeAbrechnung(servicevertraege.get(v.id)!)!;
      const r = abrechnen(v.id);
      if (!r) break;
      const kunde = db.kunden.get(v.kundeId)?.name ?? 'Kunde';
      erledigt(REGEL_ABRECHNUNG, `Rechnungsentwurf für Servicevertrag ${v.nummer} (${kunde}) erstellt`, {
        text: `${datum(f.von)} – ${datum(f.bis)}, ${euro(f.betrag)} netto. Bitte prüfen und versenden.`,
        bezug: r.rechnungId ? { typ: 'rechnungen', id: r.rechnungId } : { typ: 'auftraege', id: r.auftragId },
      });
    }
  }
}

const pfad = (id: ID) => `/auftraege/servicevertraege/${id}`;

export default defineModul({
  id: 'servicevertraege',
  titel: 'Serviceverträge',
  bereich: 'auftraege',
  beschreibung: 'Wartungsverträge mit Laufzeit, Preis und automatischer Abrechnung.',
  icon: 'dokument',
  gewicht: 55,
  routen: [
    { pfad: '', element: VertragListe },
    { pfad: 'neu', element: VertragForm },
    { pfad: ':id', element: VertragDetail },
    { pfad: ':id/bearbeiten', element: VertragForm },
  ],
  erstellen: [{ label: 'Servicevertrag anlegen', pfad: '/auftraege/servicevertraege/neu', gewicht: 35 }],
  panels: [
    { objekt: 'kunden', component: KundeVertraegePanel, gewicht: 50 },
    { objekt: 'anlagen', component: AnlageVertragPanel, gewicht: 60 },
  ],
  kurzinfo: () => {
    const n = servicevertraege.where((v) => zustand(v) !== 'beendet').length;
    return n ? { text: n === 1 ? '1 laufender Vertrag' : `${n} laufende Verträge`, ton: 'neutral' } : undefined;
  },
  automationen: [
    {
      id: REGEL_ABRECHNUNG,
      titel: 'Serviceverträge abrechnen',
      beschreibung: 'Erstellt zu Beginn jeder Abrechnungsperiode einen Abrechnungsauftrag mit Rechnungsentwurf. Du prüfst und versendest.',
      standardAn: true,
      minuten: 10,
      start: () => {
        const t = setInterval(abrechnungenErstellen, 6 * 60 * 60 * 1000);
        return () => clearInterval(t);
      },
      pruefen: abrechnungenErstellen,
    },
  ],
  aktionen: {
    'servicevertrag.abrechnen': (p) => {
      const { vertragId } = p as { vertragId: ID };
      const r = abrechnen(vertragId);
      return (r?.rechnungId && pfadZu({ typ: 'rechnungen', id: r.rechnungId })) || pfad(vertragId);
    },
    'servicevertrag.verlaengern': (p) => {
      const { vertragId } = p as { vertragId: ID };
      verlaengern(vertragId);
      return pfad(vertragId);
    },
    'servicevertrag.weiterlaufen': (p) => {
      const { schluessel, tage } = p as { schluessel: string; tage: number };
      hinweisAusblenden(schluessel, Math.max(1, tage));
    },
  },
  hinweise: () => {
    const t = heute();
    const out: HinweisVorschlag[] = [];
    for (const v of servicevertraege.all()) {
      const z = zustand(v, t);
      const kunde = db.kunden.get(v.kundeId)?.name ?? 'Kunde';
      if (z === 'frist') {
        const bis = kuendigenBis(v, t);
        const schluessel = `servicevertrag-frist:${v.id}:${bis}`;
        out.push({
          schluessel,
          art: 'entscheidung',
          titel: `Servicevertrag ${kunde}: Kündigungsfrist bis ${datum(bis)}`,
          text: `${v.titel} verlängert sich danach um ${v.verlaengerungMonate} Monate. Preis anpassen oder weiterlaufen lassen?`,
          bezug: { typ: 'kunden', id: v.kundeId },
          gewicht: 64,
          faellig: bis,
          pfad: pfad(v.id),
          aktionen: [{ aktion: 'servicevertrag.weiterlaufen', label: 'Weiterlaufen lassen', payload: { schluessel, tage: tageZwischen(t, bis) + 1 } }],
        });
      }
      if (z === 'laeuft_aus') {
        out.push({
          schluessel: `servicevertrag-ende:${v.id}:${v.laufzeitMonate}`,
          art: 'entscheidung',
          titel: `Servicevertrag ${kunde} läuft am ${datum(laufzeitBis(v, t))} aus`,
          text: 'Er verlängert sich nicht automatisch. Biete die Verlängerung an, sonst fällt die Wartung weg.',
          bezug: { typ: 'kunden', id: v.kundeId },
          gewicht: 60,
          faellig: laufzeitBis(v, t),
          pfad: pfad(v.id),
          aktionen: [{ aktion: 'servicevertrag.verlaengern', label: 'Verlängern', primaer: true, payload: { vertragId: v.id } }],
        });
      }
      const f = faelligeAbrechnung(v, t);
      if (f && !automationAn(REGEL_ABRECHNUNG)) {
        out.push({
          schluessel: `servicevertrag-abrechnung:${v.id}:${f.von}`,
          art: 'freigabe',
          titel: `Servicevertrag ${kunde} abrechnen`,
          text: `${datum(f.von)} – ${datum(f.bis)}, ${euro(f.betrag)} netto.`,
          bezug: { typ: 'kunden', id: v.kundeId },
          gewicht: 58,
          faellig: f.von,
          fuerRollen: ['chef', 'buero'],
          pfad: pfad(v.id),
          aktionen: [{ aktion: 'servicevertrag.abrechnen', label: 'Rechnung erstellen', primaer: true, payload: { vertragId: v.id } }],
        });
      }
    }
    return out;
  },
  suche: (q) =>
    servicevertraege
      .where((v) => passt(q, v.nummer, v.titel, db.kunden.get(v.kundeId)?.name, 'servicevertrag wartungsvertrag', ...v.leistungen))
      .slice(0, 6)
      .map((v) => ({ typ: 'Servicevertrag', titel: `${v.nummer} · ${v.titel}`, untertitel: db.kunden.get(v.kundeId)?.name, pfad: pfad(v.id), relevanz: 50 })),
  seed: () => {
    if (servicevertraege.all().some((v) => v.beispiel)) return;
    const betrieb = db.betrieb.get('betrieb');
    if (!betrieb) return;
    const t = heute();
    const satz = betrieb.stundensatz;
    const typen = gewerkVorlage(betrieb.gewerk).anlagentypen;

    // Hausverwaltung: Jahresvertrag, Kündigungsfrist steht bevor, Wartung überfällig
    const hvAnlage = db.anlagen.all().find((a) => a.beispiel && db.kunden.get(a.kundeId)?.art === 'hausverwaltung');
    if (hvAnlage) {
      const beginn = plusTage(plusMonate(t, -9), 12);
      servicevertraege.create({
        nummer: naechsteVertragsnummer(),
        titel: `Wartungsvertrag ${hvAnlage.typ}`,
        kundeId: hvAnlage.kundeId,
        ortIds: [hvAnlage.ortId],
        anlageIds: [hvAnlage.id],
        leistungen: [`Jährliche Wartung ${hvAnlage.typ}`, 'Anfahrt', 'Prüfprotokoll'],
        intervallMonate: 12,
        preisJahr: satz * 3,
        abrechnung: 'jahr',
        beginn,
        laufzeitMonate: 12,
        kuendigungsfristMonate: 3,
        automatischVerlaengern: true,
        verlaengerungMonate: 12,
        status: 'aktiv',
        abgerechnetBis: plusMonate(beginn, 12),
        abrechnungen: [],
        beispiel: true,
      });
    }

    // Gewerbekunde: monatliche Abrechnung, eine Periode ist fällig
    const ort = db.orte.all().find((o) => o.beispiel && o.bezeichnung === 'Backstube');
    if (ort) {
      const anlage = db.anlagen.create({
        ortId: ort.id,
        kundeId: ort.kundeId,
        typ: typen[2] ?? typen[0] ?? 'Anlage',
        baujahr: 2021,
        wartungMonate: 6,
        letzteWartung: plusTage(t, -140),
        naechsteWartung: plusTage(t, 40),
        beispiel: true,
      });
      const beginn = plusTage(plusMonate(t, -1), -5);
      servicevertraege.create({
        nummer: naechsteVertragsnummer(),
        titel: `Servicevertrag ${anlage.typ}`,
        kundeId: ort.kundeId,
        ortIds: [ort.id],
        anlageIds: [anlage.id],
        leistungen: ['Halbjährliche Wartung', 'Störungsdienst werktags', 'Anfahrt'],
        intervallMonate: 6,
        preisJahr: satz * 4,
        abrechnung: 'monatlich',
        beginn,
        laufzeitMonate: 24,
        kuendigungsfristMonate: 3,
        automatischVerlaengern: true,
        verlaengerungMonate: 12,
        status: 'aktiv',
        abgerechnetBis: plusMonate(beginn, 1),
        abrechnungen: [],
        beispiel: true,
      });
    }
    if (automationAn(REGEL_ABRECHNUNG)) abrechnungenErstellen();
  },
});
