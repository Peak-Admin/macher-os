/**
 * „Mit Macher vorbereiten“ – kontextuelle Einstiege in denselben Macher-Assistenten wie Strg+K und Seitenleiste.
 *
 * Am Angebot, an der Rechnung, an der Anfrage und in der Einsatzplanung weiß die Oberfläche schon, worum es geht.
 * Statt zu raten, übergibt sie Objekt (Typ + ID) und Absicht an den Gateway (`frage(…, vorgabe)`). Die Absichten hier
 * haben deshalb keine Texterkennung (`erkenne`) – sie bauen nur einen Plan aus den Aktionen der Besitzer-Module.
 * Ablauf wie überall: Vorschau → bestätigen → Gateway führt aus → Protokoll, Rückgängig wo möglich.
 */
import { db } from '@core/db';
import { datumKurz, euro, personName, summen, uhrAus } from '@core/format';
import type { AbsichtDef, Plan } from '@core/gateway';
import { pfadZu } from '@core/modul';
import { oeffne } from '@core/overlay';
import type { Bezug, Datum, ID, Position } from '@core/objects';
import { positionAusArtikel, positionAusLeistung } from '../angebote/daten';
import { positionenErkennen } from '../start/sprache';
import { istUeberfaellig, offenerBetrag } from '../rechnungen/logik';
import { kontextAusDb as planungsKontext } from '../autoplanung/basis';
import { vorschlaege } from '../autoplanung/daten';
import type { Antwort, AntwortEintrag, Kontext } from './assistent';
import { planAntwort, schritte, stand, vid } from './hilfen';
import { vorlage } from './aktionen';

// ------------------------------------------------------------------ Was passt zu welchem Objekt?

export type VorbereitenAbsicht =
  | 'offer.prepare_from_request'
  | 'offer.prepare_send'
  | 'offer.prepare_followup'
  | 'invoice.prepare_send'
  | 'invoice.prepare_reminder'
  | 'job.prepare_schedule';

export interface Vorbereitung {
  absicht: VorbereitenAbsicht;
  /** steht im Verlauf als Frage – so sieht man, was Macher vorbereiten soll */
  frage: string;
  bezug: Bezug;
}

/** Payload für `oeffne('macher', …)` – derselbe Assistent wie über Strg+K, nur vorbelegt */
export interface MacherStart {
  frage: string;
  absicht?: string;
  bezug?: Bezug;
}

/** `zweck: 'einplanen'` – in der Einsatzplanung geht es ums Einplanen, auch wenn der Auftrag noch Anfrage ist */
export function vorbereitungFuer(bezug: Bezug, heute: Datum, zweck?: 'einplanen'): Vorbereitung | undefined {
  if (bezug.typ === 'angebote') {
    const a = db.angebote.get(bezug.id);
    if (!a) return undefined;
    if (a.status === 'entwurf') return { absicht: 'offer.prepare_send', frage: `Angebot ${a.nummer} „${a.titel}“ zum Senden vorbereiten`, bezug };
    if (a.status === 'versendet') return { absicht: 'offer.prepare_followup', frage: `Nachfassen zu Angebot ${a.nummer} „${a.titel}“ vorbereiten`, bezug };
    return undefined;
  }
  if (bezug.typ === 'rechnungen') {
    const r = db.rechnungen.get(bezug.id);
    if (!r || r.art === 'gutschrift') return undefined;
    if (r.status === 'entwurf') return { absicht: 'invoice.prepare_send', frage: `Rechnung für ${db.kunden.get(r.kundeId)?.name ?? 'den Kunden'} zum Senden vorbereiten`, bezug };
    if (istUeberfaellig(r, heute)) return { absicht: 'invoice.prepare_reminder', frage: `Zahlungserinnerung zu Rechnung ${r.nummer} vorbereiten`, bezug };
    return undefined;
  }
  if (bezug.typ === 'auftraege') {
    const a = db.auftraege.get(bezug.id);
    if (!a || a.phase === 'verloren' || a.phase === 'erledigt') return undefined;
    if (zweck === 'einplanen') return { absicht: 'job.prepare_schedule', frage: `Einsatz für „${a.titel}“ vorbereiten`, bezug };
    if (a.phase === 'anfrage' || a.phase === 'besichtigung') return { absicht: 'offer.prepare_from_request', frage: `Angebot aus Anfrage „${a.titel}“ vorbereiten`, bezug };
    return undefined;
  }
  return undefined;
}

export function macherStart(v: Vorbereitung): MacherStart {
  return { frage: v.frage, absicht: v.absicht, bezug: v.bezug };
}

// ------------------------------------------------------------------ Antworten (Vorschau)

const OHNE_KONTEXT: Antwort = {
  absicht: 'kontext-fehlt',
  text: 'Dafür brauche ich das Objekt. Öffne das Angebot, die Rechnung oder die Anfrage und tipp dort auf „Mit Macher vorbereiten“.',
};

const bezugAus = (werte: Record<string, unknown> | undefined, typ: string): ID | undefined => {
  const b = werte?.bezug as Bezug | undefined;
  return b?.typ === typ ? b.id : undefined;
};

const ust = () => db.betrieb.get('betrieb')?.ustSatz ?? 19;

/** Positionen aus der Anfrage: Leistungen am Auftrag und im Text erkannte Leistungen/Artikel aus deinem Katalog */
export function positionenAusAnfrage(auftragId: ID): Position[] {
  const a = db.auftraege.get(auftragId);
  if (!a) return [];
  const leistungen = db.leistungen.where((l) => l.aktiv);
  const ausAuftrag = (a.leistungIds ?? []).map((id) => db.leistungen.get(id)).filter((l) => !!l).map((l) => positionAusLeistung(l!));
  const schon = new Set(a.leistungIds ?? []);
  const ausText = positionenErkennen(`${a.titel}\n${a.beschreibung ?? ''}`, leistungen, db.artikel.where((x) => x.aktiv))
    .filter((e) => (e.leistung && !schon.has(e.leistung.id)) || e.artikel)
    .map((e) => (e.leistung ? (schon.add(e.leistung.id), positionAusLeistung(e.leistung, e.menge)) : positionAusArtikel(e.artikel!, e.menge)));
  return [...ausAuftrag, ...ausText];
}

function angebotAusAnfrage(k: Kontext, auftragId: ID | undefined): Antwort {
  const a = db.auftraege.get(auftragId);
  if (!a) return OHNE_KONTEXT;
  const kunde = db.kunden.get(a.kundeId)?.name ?? 'den Kunden';
  const entwurf = db.angebote.where((x) => x.auftragId === a.id && x.status === 'entwurf')[0];
  if (entwurf) {
    const pfad = pfadZu({ typ: 'angebote', id: entwurf.id });
    return {
      absicht: 'angebot-vorhanden',
      text: `Für „${a.titel}“ liegt schon der Entwurf ${entwurf.nummer}. Mach dort weiter, dann gibt es kein zweites Angebot.`,
      vorschlaege: pfad ? [{ id: vid(), art: 'oeffnen', label: `Angebot ${entwurf.nummer} öffnen`, pfad }] : undefined,
      grundlage: stand(k),
    };
  }
  const positionen = positionenAusAnfrage(a.id);
  const plan: Plan = {
    titel: `Angebot für ${kunde} vorbereiten`,
    schritte: schritte([{ aktion: 'offer.create_draft', absicht: 'offer.prepare_from_request', daten: { auftragId: a.id, positionen }, label: `Angebotsentwurf „${a.titel}“ anlegen` }]),
  };
  const netto = summen(positionen, ust()).netto;
  const eintraege: AntwortEintrag[] = positionen.length
    ? positionen.map((p) => ({ titel: p.text, untertitel: `${p.menge.toLocaleString('de-DE')} ${p.einheit}${k.darf('geld') ? ` · ${euro(p.einzelpreis)} je ${p.einheit}` : ''}` }))
    : [{ titel: 'Keine Position aus deinem Katalog erkannt', untertitel: 'Der Entwurf startet leer – du trägst die Positionen selbst ein.', status: { ton: 'neutral', text: 'Leer' } }];
  return {
    ...planAntwort(
      'angebot-aus-anfrage',
      `Aus der Anfrage von ${kunde} lege ich einen Angebotsentwurf an${positionen.length ? ` mit ${positionen.length === 1 ? '1 Position' : `${positionen.length} Positionen`}${k.darf('geld') ? `, zusammen ${euro(netto)} netto` : ''}` : ''}. Versendet wird nichts – Preise und Texte prüfst du im Entwurf.`,
      plan,
      `Anfrage ${a.nummer} und dein Leistungskatalog · ${stand(k)}`,
    ),
    eintraege,
  };
}

function angebotSenden(k: Kontext, angebotId: ID | undefined): Antwort {
  const a = db.angebote.get(angebotId);
  if (!a) return OHNE_KONTEXT;
  const kunde = db.kunden.get(a.kundeId);
  const plan: Plan = {
    titel: `Angebot ${a.nummer} senden`,
    schritte: schritte([{ aktion: 'offer.send', absicht: 'offer.prepare_send', daten: { angebotId: a.id }, label: `Angebot ${a.nummer} an ${kunde?.email || kunde?.telefon || kunde?.name || 'den Kunden'} senden` }]),
  };
  return {
    ...planAntwort('angebot-senden', `Ich habe das Angebot geprüft. Wenn alles passt, geht es nach deiner Freigabe an ${kunde?.name ?? 'den Kunden'}.`, plan, `Angebot ${a.nummer} · ${stand(k)}`),
    eintraege: [
      { titel: `${a.positionen.length === 1 ? '1 Position' : `${a.positionen.length} Positionen`}${k.darf('geld') ? ` · ${euro(summen(a.positionen, ust(), a.rabattProzent).netto)} netto` : ''}`, untertitel: a.titel },
      { titel: `Gültig bis ${datumKurz(a.gueltigBis)}`, status: a.gueltigBis < k.heute ? { ton: 'achtung', text: 'Abgelaufen' } : undefined },
    ],
  };
}

function angebotNachfassen(k: Kontext, angebotId: ID | undefined): Antwort {
  const a = db.angebote.get(angebotId);
  if (!a) return OHNE_KONTEXT;
  const kunde = db.kunden.get(a.kundeId);
  if (!kunde) return { absicht: 'kunde-fehlt', text: 'Zu diesem Angebot gibt es keinen Kunden mehr.' };
  const text = vorlage(kunde, `wir wollten kurz nachfragen, ob Sie unser Angebot ${a.nummer} „${a.titel}“ erhalten haben und ob noch Fragen offen sind. Wir beraten Sie gern`);
  const plan: Plan = {
    titel: `Bei ${kunde.name} nachfassen`,
    schritte: schritte([
      {
        aktion: 'message.send',
        absicht: 'offer.prepare_followup',
        daten: { kundeId: kunde.id, auftragId: a.auftragId, text, betreff: `Ihr Angebot ${a.nummer} – ${a.titel}` },
        label: `Nachricht an ${kunde.email || kunde.telefon || kunde.name}`,
        textFeld: { feld: 'text', label: 'Nachricht an den Kunden' },
      },
    ]),
  };
  const antwort = planAntwort('angebot-nachfassen', `Ich habe eine kurze Nachfrage an ${kunde.name} vorbereitet. Lies sie durch und ändere, was du anders sagen willst.`, plan, `Angebot ${a.nummer} · ${stand(k)}`);
  return {
    ...antwort,
    vorschlaege: [
      ...(antwort.vorschlaege ?? []),
      ...(kunde.telefon ? [{ id: vid(), art: 'oeffnen' as const, label: `Lieber anrufen: ${kunde.telefon}`, pfad: `tel:${kunde.telefon.replace(/[^\d+]/g, '')}` }] : []),
    ],
  };
}

function rechnungSenden(k: Kontext, rechnungId: ID | undefined): Antwort {
  const r = db.rechnungen.get(rechnungId);
  if (!r) return OHNE_KONTEXT;
  const kunde = db.kunden.get(r.kundeId);
  const plan: Plan = {
    titel: 'Rechnung senden',
    schritte: schritte([{ aktion: 'invoice.send', absicht: 'invoice.prepare_send', daten: { rechnungId: r.id }, label: `Rechnung festschreiben und an ${kunde?.email || kunde?.telefon || kunde?.name || 'den Kunden'} senden` }]),
  };
  return {
    ...planAntwort('rechnung-senden', `Ich habe Pflichtangaben und Empfänger geprüft. Nach deiner Freigabe bekommt die Rechnung ihre Nummer und geht an ${kunde?.name ?? 'den Kunden'}.`, plan, `Rechnungsentwurf · ${stand(k)}`),
    eintraege: [{ titel: `${r.positionen.length === 1 ? '1 Position' : `${r.positionen.length} Positionen`}${k.darf('geld') ? ` · ${euro(summen(r.positionen, ust()).brutto)} brutto` : ''}`, untertitel: kunde?.name }],
  };
}

function rechnungErinnern(k: Kontext, rechnungId: ID | undefined): Antwort {
  const r = db.rechnungen.get(rechnungId);
  if (!r) return OHNE_KONTEXT;
  const kunde = db.kunden.get(r.kundeId);
  const plan: Plan = {
    titel: `${kunde?.name ?? 'Kunden'} an ${r.nummer} erinnern`,
    schritte: schritte([{ aktion: 'invoice.remind', absicht: 'invoice.prepare_reminder', daten: { rechnungId: r.id }, label: `Nächste Erinnerung zu ${r.nummer} freigeben` }]),
  };
  return {
    ...planAntwort('rechnung-erinnern', `Rechnung ${r.nummer} ist seit ${datumKurz(r.faelligAm)} fällig. Macher bereitet die nächste Stufe nach deinen Mahnregeln vor.`, plan, `Offene Posten und Mahnregeln · ${stand(k)}`),
    eintraege: [{ titel: `${euro(offenerBetrag(r))} offen`, untertitel: kunde?.name, status: { ton: 'gefahr', text: 'Überfällig' } }],
  };
}

function einsatzVorbereiten(k: Kontext, auftragId: ID | undefined): Antwort {
  const a = db.auftraege.get(auftragId);
  if (!a) return OHNE_KONTEXT;
  const e = vorschlaege(planungsKontext(), a.id);
  const v = e.vorschlaege[0];
  if (!v) return { absicht: 'einsatz-kein-vorschlag', text: e.hinweise[0] ?? `Für „${a.titel}“ finde ich gerade keine freie Zeit.`, grundlage: `Plan und Abwesenheiten · ${stand(k)}` };
  const leute = v.mitarbeiterIds.map((id) => personName(db.mitarbeiter.get(id))).join(' und ');
  const zeit = v.bloecke.length === 1 ? `${datumKurz(v.bloecke[0].datum)}, ${uhrAus(v.bloecke[0].von)}–${uhrAus(v.bloecke[0].bis)} Uhr` : `${v.bloecke.length} Tage ab ${datumKurz(v.bloecke[0].datum)}`;
  const plan: Plan = {
    titel: `„${a.titel}“ einplanen`,
    schritte: schritte([{ aktion: 'employee.schedule', absicht: 'job.prepare_schedule', daten: { vorschlag: v }, label: `${leute}: ${zeit}` }]),
  };
  return {
    ...planAntwort('einsatz-vorbereiten', `Mein Vorschlag: ${leute}, ${zeit}. Erst mit deiner Bestätigung trage ich den Einsatz ein.`, plan, `Plan, Abwesenheiten und Qualifikationen · ${stand(k)}`),
    eintraege: [
      ...v.gruende.map((g): AntwortEintrag => ({ titel: g })),
      ...v.warnungen.map((w): AntwortEintrag => ({ titel: w, status: { ton: 'achtung', text: 'Prüfen' } })),
      ...e.hinweise.map((h): AntwortEintrag => ({ titel: h, status: { ton: 'neutral', text: 'Hinweis' } })),
    ],
  };
}

type Def = AbsichtDef<Antwort>;

/** Nur über „Mit Macher vorbereiten“ erreichbar (Vorgabe mit Objekt) – keine Texterkennung */
export const VORBEREITEN_ABSICHTEN: Def[] = [
  { id: 'offer.prepare_from_request', titel: 'Angebot aus Anfrage vorbereiten', risiko: 'schreiben', rechte: ['schreiben', 'geld'], beantworte: (_t, e, k) => angebotAusAnfrage(k, bezugAus(e.werte, 'auftraege')) },
  { id: 'offer.prepare_send', titel: 'Angebot zum Senden vorbereiten', risiko: 'kritisch', rechte: ['veroeffentlichen'], beantworte: (_t, e, k) => angebotSenden(k, bezugAus(e.werte, 'angebote')) },
  { id: 'offer.prepare_followup', titel: 'Nachfassen zum Angebot vorbereiten', risiko: 'kritisch', rechte: ['veroeffentlichen'], beantworte: (_t, e, k) => angebotNachfassen(k, bezugAus(e.werte, 'angebote')) },
  { id: 'invoice.prepare_send', titel: 'Rechnung zum Senden vorbereiten', risiko: 'kritisch', rechte: ['geld', 'veroeffentlichen'], beantworte: (_t, e, k) => rechnungSenden(k, bezugAus(e.werte, 'rechnungen')) },
  { id: 'invoice.prepare_reminder', titel: 'Zahlungserinnerung vorbereiten', risiko: 'kritisch', rechte: ['geld', 'veroeffentlichen'], beantworte: (_t, e, k) => rechnungErinnern(k, bezugAus(e.werte, 'rechnungen')) },
  { id: 'job.prepare_schedule', titel: 'Einsatz vorbereiten', risiko: 'schreiben', rechte: ['planen'], beantworte: (_t, e, k) => einsatzVorbereiten(k, bezugAus(e.werte, 'auftraege')) },
];

// ------------------------------------------------------------------ Öffnen

/**
 * Öffnet den Macher-Assistenten (dasselbe Overlay wie Strg+K) mit Absicht und Objekt. `false`, wenn es für dieses
 * Objekt gerade nichts vorzubereiten gibt.
 */
export function mitMacherOeffnen(bezug: Bezug, heute: Datum, zweck?: 'einplanen'): boolean {
  const v = vorbereitungFuer(bezug, heute, zweck);
  if (!v) return false;
  oeffne('macher', macherStart(v));
  return true;
}
