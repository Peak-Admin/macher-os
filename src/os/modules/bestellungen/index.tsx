import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { datum, heute, passt, plusTage } from '@core/format';
import { BestellungDetail } from './BestellungDetail';
import { BestellungenListe } from './BestellungenListe';
import { BestellungNeu } from './BestellungNeu';
import { alsBestelltMarkieren, bestellungAnlegen, bestellungen, istUnterwegs, neuePosition, ueberfaellig } from './daten';

export default defineModul({
  id: 'bestellungen',
  titel: 'Bestellungen',
  bereich: 'betrieb',
  gruppe: 'material',
  beschreibung: 'Bestellungen je Lieferant: anlegen, per E-Mail senden, Lieferung verfolgen, Wareneingang buchen.',
  icon: 'paket',
  gewicht: 58,
  routen: [
    { pfad: '', element: BestellungenListe },
    { pfad: 'neu', element: BestellungNeu },
    { pfad: ':id', element: BestellungDetail },
  ],
  kurzinfo: () => {
    const unterwegs = bestellungen.where(istUnterwegs);
    const spaet = unterwegs.filter((b) => ueberfaellig(b)).length;
    const entwuerfe = bestellungen.where((b) => b.status === 'entwurf' && b.positionen.length > 0).length;
    if (spaet) return { text: `${spaet} Lieferung${spaet === 1 ? '' : 'en'} überfällig`, ton: 'gefahr' };
    if (entwuerfe) return { text: `${entwuerfe} Entwurf${entwuerfe === 1 ? '' : 'e'} zum Abschicken`, ton: 'aktiv' };
    if (unterwegs.length) return { text: `${unterwegs.length} unterwegs`, ton: 'aktiv' };
    return undefined;
  },
  erstellen: [{ label: 'Bestellung anlegen', pfad: '/betrieb/bestellungen/neu', gewicht: 20 }],
  hinweise: () => {
    const t = heute();
    const spaet = bestellungen.where((b) => ueberfaellig(b, t)).map((b) => {
      const l = db.lieferanten.get(b.lieferantId);
      return {
        schluessel: `bestellung-ueberfaellig:${b.id}:${b.erwartetAm}`,
        art: 'problem' as const,
        titel: `Lieferung überfällig: ${l?.name ?? 'Lieferant'} (${b.nummer})`,
        text: `Sollte am ${datum(b.erwartetAm)} da sein. Nachfragen oder Wareneingang buchen.`,
        bezug: b.lieferantId ? { typ: 'lieferanten' as const, id: b.lieferantId } : undefined,
        gewicht: 60,
        fuerRollen: ['chef' as const, 'buero' as const],
        aktionen: [{ aktion: 'bestellung.wareneingang', label: 'Wareneingang buchen', primaer: true, payload: { id: b.id } }],
        pfad: `/betrieb/bestellungen/${b.id}`,
      };
    });
    const entwuerfe = bestellungen
      .where((b) => b.status === 'entwurf' && b.positionen.some((p) => p.menge > 0) && b.erstelltAm.slice(0, 10) < t)
      .map((b) => ({
        schluessel: `bestellung-entwurf:${b.id}`,
        art: 'freigabe' as const,
        titel: `Bestellung an ${db.lieferanten.get(b.lieferantId)?.name ?? 'Lieferant'} abschicken?`,
        text: `${b.positionen.length} Position${b.positionen.length === 1 ? '' : 'en'} liegen im Entwurf ${b.nummer}.`,
        gewicht: 45,
        fuerRollen: ['chef' as const, 'buero' as const],
        aktionen: [{ aktion: 'bestellung.oeffnen', label: 'Prüfen und abschicken', primaer: true, payload: { id: b.id } }],
        pfad: `/betrieb/bestellungen/${b.id}`,
      }));
    return [...spaet, ...entwuerfe];
  },
  aktionen: {
    'bestellung.wareneingang': (p) => `/betrieb/bestellungen/${(p as { id: string }).id}?wareneingang=1`,
    'bestellung.oeffnen': (p) => `/betrieb/bestellungen/${(p as { id: string }).id}`,
  },
  suche: (q) =>
    bestellungen
      .where((b) => passt(q, b.nummer, db.lieferanten.get(b.lieferantId)?.name, ...b.positionen.map((p) => p.text)))
      .slice(0, 5)
      .map((b) => ({ typ: 'Bestellung', titel: `${b.nummer} · ${db.lieferanten.get(b.lieferantId)?.name ?? ''}`, untertitel: b.positionen.map((p) => p.text).slice(0, 3).join(', '), pfad: `/betrieb/bestellungen/${b.id}`, relevanz: 40 })),
  seed: () => {
    // Beispiel: eine Bestellung, die gestern hätte kommen sollen (nur mit Beispieldaten)
    if (!db.mitarbeiter.all().some((m) => m.beispiel)) return;
    const l = db.lieferanten.all().find((x) => db.artikel.all().some((a) => a.lieferantId === x.id));
    const artikel = db.artikel.where((a) => a.lieferantId === l?.id).slice(3, 5);
    if (!l || !artikel.length) return;
    const b = bestellungAnlegen(l.id, artikel.map((a) => neuePosition({ artikelId: a.id, text: a.name, menge: Math.max(5, a.mindestbestand ?? 10), einheit: a.einheit, ek: a.ek })), { beispiel: true });
    alsBestelltMarkieren(b.id);
    bestellungen.update(b.id, { erwartetAm: plusTage(heute(), -1), bestelltAm: new Date(Date.now() - 3 * 86_400_000).toISOString() }, { leise: true });
  },
});
