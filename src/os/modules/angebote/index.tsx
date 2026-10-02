import { darf } from '@core/session';
import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { euro, heute, passt, relativ, tageZwischen } from '@core/format';
import type { ID } from '@core/objects';
import { AngeboteListe, AngeboteTab } from './AngeboteListe';
import { AngebotDetail } from './AngebotDetail';
import { AngebotDruck } from './AngebotDruck';
import { portalGeoeffnet } from './erstwert';
import { alsNachgefasstMarkieren, angebotSummen, entwurfFuer, istAktuelleVersion, istAbgelaufen, laeuftBaldAb, nachfassenFaellig, nachfassenTage } from './daten';
import { ANGEBOT_ABSICHTEN, ANGEBOT_AKTIONEN } from './gateway';

const aktuelleAngebote = () => {
  const alle = db.angebote.all();
  return alle.filter((a) => istAktuelleVersion(a, alle));
};

/** Versendete Angebote ohne Antwort → Aufgabe „Nachfassen“ */
function nachfassenPruefen() {
  const tag = heute();
  for (const a of aktuelleAngebote()) {
    if (!nachfassenFaellig(a, tag, nachfassenTage())) continue;
    const gibtEs = db.aufgaben.all().some((x) => !x.erledigt && x.quelle === 'nachfassen' && x.bezug?.typ === 'angebote' && x.bezug.id === a.id);
    if (gibtEs) continue;
    const auftrag = db.auftraege.get(a.auftragId);
    const kunde = db.kunden.get(a.kundeId);
    db.aufgaben.create({
      titel: `Angebot nachfassen: ${kunde?.name ?? a.titel}`,
      notiz: `${a.nummer} · ${a.titel} · ${euro(angebotSummen(a).brutto)} · versendet ${relativ(a.versendetAm)}${kunde?.telefon ? ` · Tel. ${kunde.telefon}` : ''}`,
      auftragId: a.auftragId,
      bezug: { typ: 'angebote', id: a.id },
      zustaendigId: auftrag?.verantwortlichId,
      faellig: tag,
      erledigt: false,
      prioritaet: 'normal',
      quelle: 'nachfassen',
      beispiel: a.beispiel || undefined,
    });
    erledigt('angebote.nachfassen', `Nachfassen für Angebot ${a.nummer} als Aufgabe angelegt`, { bezug: { typ: 'angebote', id: a.id } });
  }
}

/** Abgelaufene Angebote markieren */
function ablaufPruefen() {
  const tag = heute();
  for (const a of aktuelleAngebote()) {
    if (!istAbgelaufen(a, tag)) continue;
    db.angebote.update(a.id, { status: 'abgelaufen' }, { text: 'Gültigkeit abgelaufen' });
    erledigt('angebote.ablauf', `Angebot ${a.nummer} als abgelaufen markiert`, { bezug: { typ: 'angebote', id: a.id } });
  }
}

const regelmaessig = (fn: () => void) => () => {
  const t = setInterval(fn, 60 * 60 * 1000);
  return () => clearInterval(t);
};

export default defineModul({
  id: 'angebote',
  titel: 'Angebote',
  bereich: 'auftraege',
  beschreibung: 'Angebote schreiben, versenden, nachfassen – bis zum Auftrag.',
  icon: 'dokument',
  gewicht: 85,
  routen: [
    { pfad: '', element: AngeboteListe },
    { pfad: ':id', element: AngebotDetail },
  ],
  vollbildRouten: [{ pfad: '/druck/angebot/:id', element: AngebotDruck }],
  erstellen: [{ label: 'Angebot erstellen', pfad: '/auftraege/angebote?neu=1', gewicht: 70 }],
  detail: [{ objekt: 'angebote', pfad: (id) => `/auftraege/angebote/${id}` }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Angebote',
      component: ({ id }) => <AngeboteTab id={id} />,
      gewicht: 75,
      zaehler: (id) => db.angebote.where((a) => a.auftragId === id).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && darf('geld') && (['anfrage', 'besichtigung', 'angebot'].includes(a.phase) || db.angebote.all().some((x) => x.auftragId === id));
      },
    },
    {
      objekt: 'kunden',
      titel: 'Angebote',
      component: ({ id }) => <AngeboteTab id={id} kunde />,
      gewicht: 55,
      zaehler: (id) => db.angebote.where((a) => a.kundeId === id).length || undefined,
      sichtbar: (id) => darf('geld') && db.angebote.all().some((a) => a.kundeId === id),
    },
  ],
  kurzinfo: () => {
    const n = aktuelleAngebote().filter((a) => a.status === 'versendet').length;
    return n ? { text: n === 1 ? '1 Angebot offen' : `${n} Angebote offen`, ton: 'aktiv' } : undefined;
  },
  gateway: { absichten: [...ANGEBOT_ABSICHTEN], aktionen: [...ANGEBOT_AKTIONEN] },
  aktionen: {
    'angebot.erstellen': (p) => {
      const { auftragId } = p as { auftragId: ID };
      return `/auftraege/angebote/${entwurfFuer(auftragId).id}`;
    },
    'angebot.nachgefasst': (p) => {
      alsNachgefasstMarkieren((p as { angebotId: ID }).angebotId);
    },
  },
  hinweise: () => {
    const tag = heute();
    const liste: HinweisVorschlag[] = [];
    for (const a of aktuelleAngebote()) {
      const kunde = db.kunden.get(a.kundeId)?.name ?? '';
      const summe = euro(angebotSummen(a).brutto);
      const bezug = { typ: 'angebote' as const, id: a.id };
      if (nachfassenFaellig(a, tag, nachfassenTage())) {
        liste.push({
          schluessel: `angebot-nachfassen:${a.id}`,
          art: 'entscheidung',
          titel: `Angebot nachfassen: ${kunde || a.titel}`,
          text: `${a.titel} · ${summe} · versendet ${relativ(a.versendetAm)}, noch keine Antwort.`,
          bezug,
          gewicht: 70,
          aktionen: [{ aktion: 'angebot.nachgefasst', label: 'Nachgefasst', primaer: true, payload: { angebotId: a.id } }],
          pfad: `/auftraege/angebote/${a.id}`,
        });
      } else if (laeuftBaldAb(a, tag)) {
        liste.push({
          schluessel: `angebot-ablauf:${a.id}`,
          art: 'info',
          titel: `Angebot läuft ${relativ(a.gueltigBis)} ab: ${kunde || a.titel}`,
          text: `${a.titel} · ${summe}. Nachfragen oder Gültigkeit mit neuer Version verlängern.`,
          bezug,
          gewicht: 60,
          faellig: a.gueltigBis,
          pfad: `/auftraege/angebote/${a.id}`,
        });
      } else if (a.status === 'entwurf' && tageZwischen(a.erstelltAm.slice(0, 10), tag) >= 3) {
        liste.push({
          schluessel: `angebot-entwurf:${a.id}`,
          art: 'entscheidung',
          titel: `Angebot fertig machen: ${kunde || a.titel}`,
          text: `Der Entwurf liegt seit ${relativ(a.erstelltAm).replace('vor ', '')} – der Kunde wartet.`,
          bezug,
          gewicht: 52,
          pfad: `/auftraege/angebote/${a.id}`,
        });
      }
    }
    return liste;
  },
  automationen: [
    {
      id: 'angebote.nachfassen',
      titel: 'Ans Nachfassen erinnern',
      beschreibung: 'Bleibt ein Angebot ohne Antwort, legt Macher nach der eingestellten Zahl an Tagen eine Aufgabe „Nachfassen“ an.',
      standardAn: true,
      minuten: 3,
      start: regelmaessig(nachfassenPruefen),
      pruefen: nachfassenPruefen,
    },
    {
      id: 'angebote.ablauf',
      titel: 'Abgelaufene Angebote markieren',
      beschreibung: 'Ist die Gültigkeit vorbei, setzt Macher das Angebot auf „Abgelaufen“.',
      standardAn: true,
      minuten: 1,
      start: regelmaessig(ablaufPruefen),
      pruefen: ablaufPruefen,
    },
  ],
  init: () => {
    // „Der Kunde hat dein Angebot geöffnet“ – Event kommt aus dem Kundenbereich (Paket Aktivierung)
    on('portal.geoeffnet', (e) => {
      portalGeoeffnet(e.daten as { kundeId?: ID; bezug?: { typ: string; id: ID } } | undefined);
    });
  },
  suche: (q) =>
    db.angebote
      .where((a) => passt(q, a.nummer, a.titel, db.kunden.get(a.kundeId)?.name))
      .slice(0, 6)
      .map((a) => ({ typ: 'Angebot', titel: `${a.nummer} · ${a.titel}`, untertitel: `${db.kunden.get(a.kundeId)?.name ?? ''} · ${euro(angebotSummen(a).brutto)}`, pfad: `/auftraege/angebote/${a.id}`, relevanz: 55 })),
});
