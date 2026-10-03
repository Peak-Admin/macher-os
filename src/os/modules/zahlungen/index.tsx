import { defineModul } from '@core/modul';
import { db, subscribe } from '@core/db';
import { on } from '@core/events';
import { erledigt, hinweisErledigen } from '@core/macher';
import { darf } from '@core/session';
import { euro, passt } from '@core/format';
import type { Cent, Datum, ID, Rechnung } from '@core/objects';
import { OffenePosten } from './OffenePosten';
import { KontoauszugImport } from './KontoauszugImport';
import { Abgleich } from './Abgleich';
import { statusAbgleichen, zahlungBuchen } from './logik';
import { abgleichen, AUTOMATION_ABGLEICH, zuordnungAufheben } from './abgleich';
import { bankumsaetze, brauchtDich, type ZahlungMitUmsatz } from './daten';
import { istUeberfaellig, offenePosten, offenerBetrag } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';

const ABGLEICH_PFAD = '/betrieb/zahlungen/abgleich';

function freigabeSchliessen(schluessel: string) {
  for (const h of db.hinweise.where((x) => x.schluessel === schluessel && x.status === 'offen')) hinweisErledigen(h.id);
}

const zuZuordnen = () => bankumsaetze.where(brauchtDich);

export default defineModul({
  id: 'zahlungen',
  titel: 'Zahlungen',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Offene Posten, Zahlungseingänge und automatischer Abgleich mit dem Kontoauszug.',
  icon: 'euro',
  gewicht: 85,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: OffenePosten },
    { pfad: 'import', element: KontoauszugImport },
    { pfad: 'abgleich', element: Abgleich },
  ],
  // Kein eigenes Hub-Widget: „Offene Posten“ steht schon in „Zahlen auf einen Blick“ (Auswertung) – jede Zahl genau einmal
  kurzinfo: () => {
    const unklar = zuZuordnen().length;
    if (unklar) return { text: unklar === 1 ? '1 Zahlung zuordnen' : `${unklar} Zahlungen zuordnen`, ton: 'achtung' };
    const p = offenePosten();
    if (!p.length) return { text: 'Alles bezahlt', ton: 'erfolg' };
    const u = p.filter((r) => istUeberfaellig(r)).length;
    return { text: `${euro(p.reduce((s, r) => s + offenerBetrag(r), 0))} offen${u ? `, ${u} überfällig` : ''}`, ton: u ? 'gefahr' : 'aktiv' };
  },
  // Exception-First: der Chef sieht nur zwei Sätze – was überfällig ist und was Lotte nicht allein zuordnen konnte
  hinweise: () => {
    if (!darf('geld')) return [];
    const liste = [];
    const unklar = zuZuordnen();
    if (unklar.length) {
      const summe = unklar.reduce((s, u) => s + u.betrag, 0);
      liste.push({
        schluessel: 'zahlungen-zuordnen',
        art: 'entscheidung' as const,
        titel: unklar.length === 1 ? '1 Zahlung konnte nicht eindeutig zugeordnet werden' : `${unklar.length} Zahlungen konnten nicht eindeutig zugeordnet werden`,
        text: `${euro(summe)} sind eingegangen. Sag kurz, zu welcher Rechnung sie gehören – Lotte merkt sich das Konto für das nächste Mal.`,
        gewicht: 62,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: ABGLEICH_PFAD,
        aktionen: [{ aktion: 'zahlung.zuordnen', label: 'Zuordnen', primaer: true }],
      });
    }
    const ueber = offenePosten().filter((r) => istUeberfaellig(r));
    if (ueber.length) {
      liste.push({
        schluessel: 'rechnungen-ueberfaellig',
        art: 'problem' as const,
        titel: ueber.length === 1 ? '1 Rechnung ist überfällig' : `${ueber.length} Rechnungen sind überfällig`,
        text: `Zusammen ${euro(ueber.reduce((s, r) => s + offenerBetrag(r), 0))} offen. Zahlungserinnerungen bereitet Lotte vor, du gibst sie frei.`,
        gewicht: 56,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: '/betrieb/zahlungen?ansicht=ueberfaellig',
        aktionen: [{ aktion: 'zahlungen.ueberfaellige', label: 'Ansehen', primaer: true }],
      });
    }
    return liste;
  },
  suche: (q) =>
    darf('geld')
      ? zuZuordnen()
          .filter((u) => passt(q, u.name, u.zweck, euro(u.betrag)))
          .slice(0, 5)
          .map((u) => ({ typ: 'Zahlung', titel: `${euro(u.betrag)} · ${u.name || 'ohne Namen'}`, untertitel: `Zuordnen · ${u.zweck}`, pfad: ABGLEICH_PFAD, relevanz: 40 }))
      : [],
  aktionen: {
    'zahlung.erfassen': (payload) => `/betrieb/zahlungen?rechnung=${(payload as { rechnungId: ID }).rechnungId}`,
    'zahlung.zuordnen': () => ABGLEICH_PFAD,
    'zahlungen.ueberfaellige': () => '/betrieb/zahlungen?ansicht=ueberfaellig',
    /** Rückgängig für den automatischen Abgleich (Erledigt-Protokoll) */
    'zahlung.zuordnung_aufheben': (payload) => {
      zuordnungAufheben((payload as { umsatzId: ID }).umsatzId);
      return ABGLEICH_PFAD;
    },
    // ältere gespeicherte Freigaben (vor dem Abgleich) bleiben bedienbar
    'zahlung.bestaetigen': (payload) => {
      const p = payload as { rechnungId: ID; betrag: Cent; datum: Datum; zweck?: string; name?: string; schluessel: string };
      zahlungBuchen({ rechnungId: p.rechnungId, betrag: p.betrag, datum: p.datum, verwendungszweck: p.zweck, zahler: p.name, quelle: 'kontoauszug' });
      freigabeSchliessen(p.schluessel);
    },
    'zahlung.verwerfen': (payload) => {
      freigabeSchliessen((payload as { schluessel: string }).schluessel);
      return '/betrieb/zahlungen';
    },
  },
  automationen: [
    {
      id: 'zahlungen.status',
      titel: 'Rechnungsstatus nach Zahlungseingang setzen',
      beschreibung: 'Geht Geld ein, setzt Lotte die Rechnung auf „teilbezahlt“ oder „bezahlt“ und vermerkt es am Auftrag.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const aus = [
          on('zahlungen.created', (e) => {
            const z = e.objekt as ZahlungMitUmsatz | undefined;
            if (!z) return;
            const neu = statusAbgleichen(z.rechnungId);
            const r = rechnungX(z.rechnungId);
            // aus dem Abgleich: dort steht schon ein Eintrag mit „Rückgängig“
            if (r && neu === 'bezahlt' && !z.umsatzId) {
              erledigt('zahlungen.status', `${r.nummer} ist bezahlt`, { text: `${db.kunden.get(r.kundeId)?.name ?? ''} · ${euro(z.betrag)}`, bezug: { typ: 'rechnungen', id: r.id } });
            }
          }),
          on('zahlungen.removed', (e) => {
            const z = e.objekt as ZahlungMitUmsatz | undefined;
            if (z) statusAbgleichen(z.rechnungId);
          }),
          on('zahlungen.updated', (e) => {
            const z = e.objekt as ZahlungMitUmsatz | undefined;
            if (z) statusAbgleichen(z.rechnungId);
          }),
        ];
        return () => aus.forEach((f) => f());
      },
    },
    {
      id: AUTOMATION_ABGLEICH,
      titel: 'Zahlungseingänge den Rechnungen zuordnen',
      beschreibung:
        'Kommen Umsätze von der Bank, erkennt Lotte Rechnungsnummer, Betrag und Kunde. Passt es eindeutig, bucht Lotte die Zahlung (rückgängig machbar) – sonst fragt Lotte dich.',
      standardAn: true,
      minuten: 4,
      start: () => {
        // Umsätze von der Bankverbindung kommen über den Abgleich (Sync) ohne Ereignis – daher auf den Datenstand hören
        let geplant: ReturnType<typeof setTimeout> | undefined;
        const pruefen = () => {
          if (geplant) return;
          geplant = setTimeout(() => {
            geplant = undefined;
            if (darf('geld') && bankumsaetze.where((u) => u.status === 'neu').length) abgleichen({ automatisch: true });
          }, 500);
        };
        const ab = subscribe(pruefen);
        pruefen();
        return () => {
          ab();
          if (geplant) clearTimeout(geplant);
        };
      },
    },
    {
      id: 'zahlungen.mahnung_stoppen',
      titel: 'Mahnung stoppen, sobald bezahlt ist',
      beschreibung: 'Ist eine Rechnung bezahlt, schließt Lotte die Freigabe für ein vorbereitetes Mahnschreiben – niemand mahnt aus Versehen einen Kunden, der schon gezahlt hat.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('rechnung.bezahlt', (e) => {
          const r = e.objekt as Rechnung | undefined;
          if (!r) return;
          const offen = db.hinweise.where((h) => h.status === 'offen' && h.bezug?.typ === 'rechnungen' && h.bezug.id === r.id && !!h.aktionen?.some((a) => a.id.startsWith('mahnung.')));
          for (const h of offen) hinweisErledigen(h.id);
          if (offen.length) erledigt('zahlungen.mahnung_stoppen', `Mahnung zu ${r.nummer} gestoppt – ist bezahlt`, { bezug: { typ: 'rechnungen', id: r.id } });
        }),
    },
  ],
});
