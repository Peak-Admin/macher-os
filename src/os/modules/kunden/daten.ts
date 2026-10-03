/**
 * Kunden: reine Logik für Dubletten-Erkennung und Zusammenführen.
 *
 * Zusammenführen heißt: alle Verweise (kundeId, bezug) zeigen danach auf den
 * Kunden, der bleibt. Der doppelte Kunde wandert in den Papierkorb. Es werden
 * keine Aufträge, Rechnungen o. Ä. kopiert.
 */
import { alleSammlungen, batch, db, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import type { Basis, Bezug, ID, Kunde } from '@core/objects';
export { aehnlicheKunden, dublettenGruende, findeDubletten, normEmail, normName, normTelefon, paarSchluessel, kundennummerNach, type Dublette } from './dubletten';
import { findeDubletten, kundennummerNach, normName, paarSchluessel, type Dublette } from './dubletten';

const IGNORIERT_KEY = 'kunden.keineDubletten';

export function ignorierteDubletten(): Set<string> {
  return new Set(einstellung<string[]>(IGNORIERT_KEY, []));
}

export function keineDublette(a: ID, b: ID) {
  const s = ignorierteDubletten();
  s.add(paarSchluessel(a, b));
  setzeEinstellung(IGNORIERT_KEY, [...s]);
}

export function aktuelleDubletten(): Dublette[] {
  return findeDubletten(db.kunden.all(), ignorierteDubletten());
}

// ------------------------------------------------------------------ Zusammenführen

const istKunde = (b: Bezug | undefined, id: ID) => b?.typ === 'kunden' && b.id === id;

/**
 * Hängt alle Verweise von `quelleId` auf `zielId` um, ergänzt fehlende Kontaktdaten
 * beim Ziel und legt die Quelle in den Papierkorb. Rückgabe: Anzahl umgehängter Verweise.
 */
export function kundenZusammenfuehren(zielId: ID, quelleId: ID): number {
  const ziel = db.kunden.get(zielId);
  const quelle = db.kunden.get(quelleId);
  if (!ziel || !quelle || zielId === quelleId) throw new Error('Diese Kunden können nicht zusammengeführt werden.');
  const text = `Kunde zusammengeführt: ${quelle.name} → ${ziel.name}`;
  let n = 0;
  batch(() => {
    // Alle registrierten Sammlungen – Kern und Module (z. B. Serviceverträge, Reklamationen, Bewertungen).
    // Der Zeitstrahl (`ereignisse`) bleibt unverändert: er dokumentiert, was war.
    for (const col of alleSammlungen()) {
      if (col.name === 'kunden' || col.name === 'ereignisse') continue;
      for (const x of col.all() as (Basis & { kundeId?: ID; bezug?: Bezug })[]) {
        if (x.kundeId === quelleId) {
          col.update(x.id, { kundeId: zielId } as Partial<Basis>, { text });
          n++;
        }
        if (istKunde(x.bezug, quelleId)) {
          col.update(x.id, { bezug: { typ: 'kunden', id: zielId } } as Partial<Basis>, { text, leise: true });
          n++;
        }
      }
    }

    // Fehlende Angaben beim bleibenden Kunden ergänzen – die Quelle verschwindet danach.
    const vorhandeneAp = new Set(ziel.ansprechpartner.map((a) => normName(a.name)));
    db.kunden.update(
      zielId,
      {
        telefon: ziel.telefon || quelle.telefon,
        email: ziel.email || quelle.email,
        adresse: ziel.adresse?.strasse ? ziel.adresse : quelle.adresse ?? ziel.adresse,
        firma: ziel.firma || quelle.firma,
        quelle: ziel.quelle ?? quelle.quelle,
        zahlungszielTage: ziel.zahlungszielTage ?? quelle.zahlungszielTage,
        notiz: [ziel.notiz, quelle.notiz].filter(Boolean).join('\n') || undefined,
        ansprechpartner: [...ziel.ansprechpartner, ...quelle.ansprechpartner.filter((a) => !vorhandeneAp.has(normName(a.name)))],
      },
      { text: `Zusammengeführt mit ${quelle.name}` },
    );
    db.kunden.remove(quelleId);
    vermerken({ typ: 'kunden', id: quelleId }, 'kunde.zusammengefuehrt', `In ${ziel.name} zusammengeführt`);
  });
  // Für weitere Verweisfelder (z. B. `empfohlenVonKundeId`) hören Module auf dieses Ereignis.
  emit({ typ: 'kunde.zusammengefuehrt', daten: { zielId, quelleId } });
  return n;
}

/** Anzahl der Verweise auf einen Kunden – für Löschen-Warnung und Zusammenführen-Vorschau */
export function verweiseAufKunde(id: ID) {
  const offen = db.auftraege.where((a) => a.kundeId === id && !['erledigt', 'verloren'].includes(a.phase)).length;
  return {
    auftraege: db.auftraege.where((a) => a.kundeId === id).length,
    offeneAuftraege: offen,
    orte: db.orte.where((o) => o.kundeId === id).length,
    anlagen: db.anlagen.where((a) => a.kundeId === id).length,
    rechnungen: db.rechnungen.where((r) => r.kundeId === id).length,
    offeneRechnungen: db.rechnungen.where((r) => r.kundeId === id && ['versendet', 'teilbezahlt'].includes(r.status)).length,
  };
}

export const KUNDEN_ARTEN: { wert: Kunde['art']; label: string; icon: string }[] = [
  { wert: 'privat', label: 'Privat', icon: 'person' },
  { wert: 'firma', label: 'Firma', icon: 'betrieb' },
  { wert: 'hausverwaltung', label: 'Hausverwaltung', icon: 'ordner' },
  { wert: 'oeffentlich', label: 'Öffentlich', icon: 'schild' },
];

export const QUELLEN: { wert: NonNullable<Kunde['quelle']>; label: string }[] = [
  { wert: 'telefon', label: 'Telefon' },
  { wert: 'email', label: 'E-Mail' },
  { wert: 'website', label: 'Website' },
  { wert: 'empfehlung', label: 'Empfehlung' },
  { wert: 'whatsapp', label: 'WhatsApp' },
  { wert: 'vor_ort', label: 'Vor Ort angesprochen' },
  { wert: 'portal', label: 'Kundenbereich' },
  { wert: 'sonstiges', label: 'Sonstiges' },
];

/** Nächste freie Kundennummer K-1001, K-1002 … */
export function naechsteKundennummer(kunden: Pick<Kunde, 'nummer'>[] = db.kunden.allMitGeloeschten()): string {
  return kundennummerNach(kunden);
}
