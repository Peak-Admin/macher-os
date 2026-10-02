/**
 * Aktionen des Telefonassistenten für den Macher AI Gateway (`@core/gateway`).
 * Die Werkzeuge der Agent-Definition (`agent.ts` → `WERKZEUGE`) zeigen auf genau diese Aktionen.
 * Capability-Klassen: `call.customer_lookup` = READ, alle anderen = WRITE. Kein Geld, nichts senden, nichts löschen.
 */
import { db } from '@core/db';
import { emit } from '@core/events';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import { benachrichtigen } from '@core/macher';
import type { Bezug, ID, Nachricht } from '@core/objects';
import { rueckrufFaellig } from '@modules/anfragen/daten';
import { adresseZerlegen, type Uebersetzung } from './agent';
import { assistentKonfig } from './assistent';
import { anrufErfassen, erkenneAnrufer, kurztitel, offeneAuftraegeVon, type Dringlichkeit } from './daten';

export interface KiAnrufDaten {
  u: Uebersetzung;
  /** vom Eingang abgelegte Nachricht, die ergänzt wird */
  nachrichtId?: ID;
  kundeId?: ID;
  /** offener Auftrag des Anrufers (bei Rückruf und Notiz) */
  auftragId?: ID;
}

const DRINGLICHKEIT: Record<Uebersetzung['dringlichkeit'], Dringlichkeit> = { normal: 'normal', dringend: 'heute', notfall: 'notfall' };

function eintragen(d: KiAnrufDaten) {
  const { u } = d;
  const r = anrufErfassen({
    nummer: u.nummer,
    name: u.name,
    kundeId: d.kundeId,
    auftragId: u.schritt === 'anfrage' ? undefined : d.auftragId,
    anliegen: u.anliegen,
    dringlichkeit: DRINGLICHKEIT[u.dringlichkeit],
    schritt: u.schritt,
    faellig: rueckrufFaellig(u.dringlichkeit !== 'normal'),
    adresse: adresseZerlegen(u.details.felder?.adresse),
    anruf: { ...u.details, status: 'verarbeitet' },
    nachrichtId: d.nachrichtId,
    gelesen: false,
  });
  emit({
    typ: 'anruf.angenommen',
    sammlung: 'nachrichten',
    objekt: r.nachricht,
    daten: { ergebnis: u.details.ergebnis, dringlichkeit: u.dringlichkeit, auftragId: r.auftrag?.id, kundeNeu: r.kundeNeu || undefined, anbieter: u.details.anbieter },
  });
  return { bezug: { typ: 'nachrichten', id: r.nachricht.id } as Bezug };
}

const pruefe = (d: KiAnrufDaten) => (!d?.u?.anliegen?.trim() ? 'Ohne Anliegen lässt sich der Anruf nicht eintragen.' : undefined);

/** Wohin eine Meldung zum Anruf führt: Auftrag, sonst Kunde, sonst der Anruf selbst */
export function anrufBezug(n: Nachricht): Bezug {
  return n.auftragId ? { typ: 'auftraege', id: n.auftragId } : n.kundeId ? { typ: 'kunden', id: n.kundeId } : { typ: 'nachrichten', id: n.id };
}

export const TELEFON_AKTIONEN: AktionDef<never>[] = [
  {
    id: 'call.customer_lookup',
    titel: 'Anrufer nachgeschlagen',
    risiko: 'lesen',
    rechte: ['lesen'],
    // Nur „bekannt“ und Anzahl offener Aufträge – der Anrufer ist nicht verifiziert, also keine Kundendaten am Telefon
    fuehreAus: (d: { telefon: string }) => {
      const k = erkenneAnrufer(d.telefon ?? '');
      return { text: JSON.stringify({ bekannt: !!k, offeneAuftraege: offeneAuftraegeVon(k?.id).length }) };
    },
  } satisfies AktionDef<{ telefon: string }>,
  { id: 'call.request_create', titel: 'Anruf als Anfrage eingetragen', risiko: 'schreiben', rechte: ['schreiben'], pruefe, fuehreAus: eintragen } satisfies AktionDef<KiAnrufDaten>,
  { id: 'call.callback_create', titel: 'Rückruf aus Anruf eingetragen', risiko: 'schreiben', rechte: ['schreiben'], pruefe, fuehreAus: eintragen } satisfies AktionDef<KiAnrufDaten>,
  { id: 'call.note_create', titel: 'Anruf notiert', risiko: 'schreiben', rechte: ['schreiben'], pruefe, fuehreAus: eintragen } satisfies AktionDef<KiAnrufDaten>,
  {
    id: 'call.emergency_forward',
    titel: 'Notfall an Bereitschaft weitergegeben',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    fuehreAus: (d: { nachrichtId: ID }) => {
      const n = db.nachrichten.get(d.nachrichtId);
      if (!n?.anruf) throw new AktionsFehler('Den Anruf gibt es nicht mehr.');
      const k = assistentKonfig();
      const ma = db.mitarbeiter.get(k.bereitschaft.mitarbeiterId);
      db.nachrichten.update(n.id, { anruf: { ...n.anruf, ergebnis: 'weitergeleitet', weitergeleitetAn: ma?.id } });
      const f = n.anruf.felder ?? {};
      const wer = db.kunden.get(n.kundeId)?.name ?? f.name ?? n.anruf.nummer ?? 'Unbekannt';
      benachrichtigen(`Notfall am Telefon: ${kurztitel(f.anliegen || n.text)}`, {
        text: [wer, f.rueckrufnummer || n.anruf.nummer, f.adresse, n.anruf.notfallGrund].filter(Boolean).join(' · '),
        bezug: anrufBezug(n),
        fuer: ma?.id,
        wichtig: true,
      });
      emit({
        typ: 'anruf.notfall_weitergeleitet',
        sammlung: 'nachrichten',
        objekt: n,
        daten: { mitarbeiterId: ma?.id, nummer: k.bereitschaft.nummer, durchgestellt: !!n.anruf.durchgestellt, grund: n.anruf.notfallGrund },
      });
      return { bezug: { typ: 'nachrichten', id: n.id } };
    },
  } satisfies AktionDef<{ nachrichtId: ID }>,
] as AktionDef<never>[];
