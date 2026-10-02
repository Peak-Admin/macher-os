/** Aktionen der Nachrichten für den Macher AI Gateway (`@core/gateway`). */
import { db, vermerken } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { kontaktArt, sendenMitRueckfall } from '@modules/start/daten';
import { absenderVon } from '@modules/start/emailHtml';

export interface NachrichtDaten {
  kundeId: ID;
  auftragId?: ID;
  text: string;
  betreff?: string;
  /** E-Mail oder Handynummer; ohne Angabe die des Kunden (E-Mail vor Telefon) */
  an?: string;
}

const zielFuer = (d: NachrichtDaten) => {
  const k = db.kunden.get(d.kundeId);
  return (d.an || k?.email || k?.telefon || '').trim();
};

export const NACHRICHT_AKTIONEN: AktionDef<NachrichtDaten>[] = [
  {
    id: 'message.send',
    titel: 'Nachricht gesendet',
    risiko: 'kritisch',
    rechte: ['veroeffentlichen'],
    pruefe: (d) => {
      const k = db.kunden.get(d.kundeId);
      if (!k) return 'Den Kunden gibt es nicht mehr.';
      if (!d.text.trim()) return 'Schreib zuerst eine Nachricht.';
      if (d.text.length > 4000) return 'Die Nachricht ist zu lang.';
      if (!kontaktArt(zielFuer(d))) return `Für ${k.name} ist keine E-Mail oder Handynummer hinterlegt.`;
      return undefined;
    },
    fuehreAus: async (d) => {
      const ziel = zielFuer(d);
      const kanal = kontaktArt(ziel)!;
      const auftrag = db.auftraege.get(d.auftragId);
      const betreff = d.betreff ?? (auftrag ? `${auftrag.titel} (${auftrag.nummer})` : `Nachricht von ${db.betrieb.get('betrieb')?.name ?? 'uns'}`);
      const r = await sendenMitRueckfall({ an: ziel, kanal, betreff, text: d.text.trim(), absender: absenderVon(db.betrieb.get('betrieb')), bezug: { typ: 'kunden', id: d.kundeId } });
      if (r.status === 'fehler') throw new AktionsFehler(r.fehler ?? 'Die Nachricht wurde nicht gesendet.');
      const n = db.nachrichten.create({ kanal, richtung: 'aus', kundeId: d.kundeId, auftragId: d.auftragId, text: d.text.trim(), betreff, gelesen: true });
      if (d.auftragId) vermerken({ typ: 'auftraege', id: d.auftragId }, 'nachricht.gesendet', `Nachricht an ${db.kunden.get(d.kundeId)?.name ?? 'Kunde'} gesendet`);
      return { bezug: { typ: 'nachrichten', id: n.id }, text: r.status === 'gesendet' ? `An ${ziel}` : `Im eigenen ${kanal === 'email' ? 'Mailprogramm' : 'SMS-Programm'} geöffnet` };
    },
  },
];
