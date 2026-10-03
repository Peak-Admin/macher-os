/**
 * „Wir sind unterwegs“: Fährt jemand los bzw. startet den Einsatz, bekommt der Kunde eine kurze Nachricht.
 * - Mit Backend: automatisch über `cloud().senden` – SMS bevorzugt, sonst E-Mail.
 * - Ohne Backend (lokaler Rückfall): nur als Vorschlag für den Monteur („Kunde informieren“) – ein Tipp öffnet
 *   das SMS-/Mail-Programm. Nichts geht ungefragt raus.
 * Je Termin genau einmal. Abschaltbar unter Automationen.
 */
import { db, vermerken, zeitstrahl } from '@core/db';
import { cloud, cloudAktiv } from '@core/cloud';
import { on } from '@core/events';
import { erledigt, hinweis, hinweisErledigen } from '@core/macher';
import { uhrzeit } from '@core/format';
import type { Automation } from '@core/modul';
import type { ID, Kunde, Termin } from '@core/objects';
import { aktiverZugang, portalLink } from '@modules/kundenbereich/daten';

export const UNTERWEGS_ID = 'einsatz.unterwegs-melden';
export const UNTERWEGS_AKTION = 'einsatz.unterwegs.senden';
const VERMERK = 'kunde.unterwegs';

/** Termine, bei denen der Kunde wartet */
const ARTEN: Termin['art'][] = ['einsatz', 'wartung', 'besichtigung', 'abnahme'];

/** SMS bevorzugt (Handy liest jeder), sonst E-Mail */
export function unterwegsZiel(k: Pick<Kunde, 'telefon' | 'email' | 'ansprechpartner'> | undefined): { kanal: 'sms' | 'email'; an: string } | undefined {
  if (!k) return undefined;
  const tel = k.telefon?.trim() || k.ansprechpartner?.find((a) => a.telefon)?.telefon?.trim();
  if (tel && tel.replace(/[^\d]/g, '').length >= 6) return { kanal: 'sms', an: tel };
  const mail = k.email?.trim() || k.ansprechpartner?.find((a) => a.email)?.email?.trim();
  return mail ? { kanal: 'email', an: mail } : undefined;
}

/** Kurz, höflich (Sie), ohne erfundene Ankunftszeit */
export function unterwegsText(o: { kunde: string; betrieb?: string; vorname?: string; termin: Pick<Termin, 'start'> }): string {
  const wer = o.vorname ? `${o.vorname} von ${o.betrieb || 'uns'}` : o.betrieb || 'Wir';
  const satz = o.vorname ? `${wer} ist jetzt auf dem Weg zu Ihnen` : `${wer} sind jetzt auf dem Weg zu Ihnen`;
  return `Guten Tag ${o.kunde}, ${satz} (Termin ${uhrzeit(o.termin.start)} Uhr). Bis gleich!`;
}

export function schonGemeldet(terminId: ID): boolean {
  return zeitstrahl({ typ: 'termine', id: terminId }).some((e) => e.typ === VERMERK);
}

interface Vorbereitet {
  termin: Termin;
  kunde: Kunde;
  ziel: { kanal: 'sms' | 'email'; an: string };
  text: string;
  link?: string;
}

function vorbereiten(terminId: ID): Vorbereitet | undefined {
  const termin = db.termine.get(terminId);
  if (!termin || !ARTEN.includes(termin.art) || schonGemeldet(termin.id)) return undefined;
  // Beispielkunden bekommen nie eine echte Nachricht – lokal bleibt es beim Vorschlag zum Ausprobieren
  if (termin.beispiel && cloudAktiv()) return undefined;
  const auftrag = db.auftraege.get(termin.auftragId);
  const kunde = db.kunden.get(termin.kundeId ?? auftrag?.kundeId);
  const ziel = unterwegsZiel(kunde);
  if (!kunde || !ziel) return undefined;
  const monteur = db.mitarbeiter.get(termin.mitarbeiterIds[0]);
  const zugang = aktiverZugang(kunde.id);
  return {
    termin,
    kunde,
    ziel,
    text: unterwegsText({ kunde: kunde.name, betrieb: db.betrieb.get('betrieb')?.name, vorname: monteur?.vorname, termin }),
    link: zugang ? portalLink(zugang.token) : undefined,
  };
}

/** Wirklich senden (Cloud) bzw. Programm öffnen (lokal) – und festhalten */
export async function unterwegsSenden(terminId: ID): Promise<boolean> {
  const v = vorbereiten(terminId);
  if (!v) return false;
  const r = await cloud().senden({ an: v.ziel.an, kanal: v.ziel.kanal, betreff: 'Wir sind unterwegs', text: v.text, link: v.link, bezug: { typ: 'termine', id: v.termin.id } });
  if (r.status === 'fehler') return false;
  const kanal = v.ziel.kanal === 'sms' ? 'SMS' : 'E-Mail';
  const text = r.status === 'gesendet' ? `Kunde informiert: „Wir sind unterwegs“ (${kanal})` : `„Wir sind unterwegs“ im ${kanal}-Programm geöffnet`;
  vermerken({ typ: 'termine', id: v.termin.id }, VERMERK, text, { kanal: v.ziel.kanal, status: r.status });
  if (v.termin.auftragId) vermerken({ typ: 'auftraege', id: v.termin.auftragId }, VERMERK, text);
  db.nachrichten.create({ kanal: v.ziel.kanal, richtung: 'aus', kundeId: v.kunde.id, auftragId: v.termin.auftragId, text: v.text, betreff: 'Wir sind unterwegs', gelesen: true });
  const offen = db.hinweise.all().find((h) => h.schluessel === `unterwegs:${terminId}` && h.status === 'offen');
  if (offen) hinweisErledigen(offen.id);
  return true;
}

/** Auslöser: Losfahren (Status „unterwegs“) oder Einsatz gestartet */
export function unterwegsAusloesen(terminId: ID, fuer?: ID): 'gesendet' | 'vorschlag' | undefined {
  const v = vorbereiten(terminId);
  if (!v) return undefined;
  if (cloudAktiv()) {
    void unterwegsSenden(terminId).then((ok) => {
      if (ok) erledigt(UNTERWEGS_ID, `„Wir sind unterwegs“ an ${v.kunde.name}`, { text: `Per ${v.ziel.kanal === 'sms' ? 'SMS' : 'E-Mail'} an ${v.ziel.an}.`, bezug: { typ: 'termine', id: terminId } });
    });
    return 'gesendet';
  }
  hinweis({
    schluessel: `unterwegs:${terminId}`,
    art: 'entscheidung',
    titel: `${v.kunde.name} Bescheid geben: Wir sind unterwegs`,
    text: v.text,
    bezug: { typ: 'termine', id: terminId },
    gewicht: 55,
    fuerMitarbeiterId: fuer ?? v.termin.mitarbeiterIds[0],
    faellig: v.termin.start.slice(0, 10),
    aktionen: [{ id: UNTERWEGS_AKTION, label: v.ziel.kanal === 'sms' ? 'SMS senden' : 'E-Mail senden', primaer: true, payload: { terminId } }],
  });
  return 'vorschlag';
}

export const unterwegsAutomation: Automation = {
  id: UNTERWEGS_ID,
  titel: '„Wir sind unterwegs“ an den Kunden',
  beschreibung: 'Fährt jemand zum Einsatz los, bekommt der Kunde eine kurze SMS (sonst E-Mail). Ohne verbundenen Versand schlägt Lotte sie nur vor.',
  standardAn: true,
  minuten: 2,
  start: () => {
    const losgefahren = on('termine.updated', (e) => {
      const t = e.objekt as Termin | undefined;
      const vorher = e.vorher as Termin | undefined;
      if (t && t.status === 'unterwegs' && vorher?.status !== 'unterwegs') unterwegsAusloesen(t.id);
      // Einsatz vorbei: offener Vorschlag ist nicht mehr sinnvoll
      if (t && (t.status === 'erledigt' || t.status === 'abgesagt')) {
        const offen = db.hinweise.all().find((h) => h.schluessel === `unterwegs:${t.id}` && h.status === 'offen');
        if (offen) hinweisErledigen(offen.id);
      }
    });
    const gestartet = on('einsatz.gestartet', (e) => {
      const d = e.daten as { terminId?: ID; mitarbeiterId?: ID } | undefined;
      const id = d?.terminId ?? e.objekt?.id;
      if (id) unterwegsAusloesen(id, d?.mitarbeiterId);
    });
    return () => (losgefahren(), gestartet());
  },
};
