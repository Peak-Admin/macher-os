/**
 * Action API v1 – Termine: ansehen, anlegen, verschieben (wie der Kalender der App).
 *
 * Uhrzeiten nach außen sind deutsche Zeit (`date` + `start_time`), gespeichert wird wie in der App als Zeitpunkt.
 * Konflikte (anderer Termin zur selben Zeit, genehmigte Abwesenheit) werden gemeldet – nach Rückfrage beim Nutzer
 * kann HeyLotte mit `allow_conflict: true` trotzdem eintragen.
 */
import type { Abwesenheit, Auftrag, ID, Kunde, Mitarbeiter, Termin, TerminArt } from '@core/objects';
import {
  aktiv,
  berlin,
  berlinZeitpunkt,
  Eingabefehler,
  ISO_DATUM,
  nameVon,
  nichtGefunden,
  ohneLeere,
  plusTage,
  pruefeMit,
  text,
  UHRZEIT,
  zahl,
  type Bestand,
  type Ergebnis,
  type PartnerAktion,
} from './grundlagen';

const ARTEN: TerminArt[] = ['einsatz', 'besichtigung', 'wartung', 'intern', 'schulung', 'abnahme'];
const ART_TEXT: Record<TerminArt, string> = { einsatz: 'Einsatz', besichtigung: 'Besichtigung', wartung: 'Wartung', intern: 'Intern', schulung: 'Schulung', abnahme: 'Abnahme' };
/** Rollen, die ohne Filter nur ihre eigenen Termine sehen */
const NUR_EIGENE = new Set(['monteur', 'azubi']);

const zaehlt = (t: Termin) => !t.geloeschtAm && t.status !== 'abgesagt' && t.status !== 'erledigt';
const ueberlappt = (a: { von: number; bis: number }, b: { von: number; bis: number }) => a.von < b.bis && b.von < a.bis;

/** Zeitraum eines Termins in ms (ganztags = der ganze Tag in deutscher Zeit) */
function spanne(t: Pick<Termin, 'start' | 'ende' | 'ganztags'>): { von: number; bis: number } {
  if (!t.ganztags) return { von: Date.parse(t.start), bis: Date.parse(t.ende) };
  const von = berlinZeitpunkt(berlin(new Date(t.start)).datum, '00:00').getTime();
  const bisTag = berlin(new Date(t.ende)).datum;
  return { von, bis: berlinZeitpunkt(plusTage(bisTag, 1), '00:00').getTime() };
}

export interface Konflikt {
  employee_id: ID;
  employee_name: string;
  reason: 'appointment' | 'absence';
  message: string;
  appointment_id?: ID;
}

/** Wer ist zu dieser Zeit schon verplant oder abwesend? */
export function konflikte(t: Pick<Termin, 'id' | 'start' | 'ende' | 'ganztags' | 'mitarbeiterIds'>, bestand: Bestand): Konflikt[] {
  const s = spanne(t);
  const tage = { von: berlin(new Date(s.von)).datum, bis: berlin(new Date(s.bis - 1)).datum };
  const mitarbeiter = (bestand.mitarbeiter ?? []) as unknown as Mitarbeiter[];
  const liste: Konflikt[] = [];
  for (const id of t.mitarbeiterIds) {
    const name = nameVon(mitarbeiter.find((m) => m.id === id) ?? { id, vorname: '', nachname: '', rolle: 'monteur' });
    for (const x of (bestand.termine ?? []) as unknown as Termin[]) {
      if (x.id === t.id || !zaehlt(x) || !x.mitarbeiterIds?.includes(id) || !ueberlappt(spanne(x), s)) continue;
      const b = berlin(new Date(x.start));
      liste.push({ employee_id: id, employee_name: name, reason: 'appointment', appointment_id: x.id, message: `${name} hat schon „${x.titel}“ (${b.datum.slice(8, 10)}.${b.datum.slice(5, 7)}., ${x.ganztags ? 'ganztags' : `${b.uhr} Uhr`}).` });
    }
    for (const a of (bestand.abwesenheiten ?? []) as unknown as Abwesenheit[]) {
      if (a.geloeschtAm || a.status !== 'genehmigt' || a.mitarbeiterId !== id || a.bis < tage.von || a.von > tage.bis) continue;
      liste.push({ employee_id: id, employee_name: name, reason: 'absence', message: `${name} ist abwesend (${a.art}${a.halbtags ? ', halbtags' : ''}).` });
    }
  }
  return liste;
}

function terminKurz(t: Termin, bestand: Bestand) {
  const s = berlin(new Date(t.start));
  const e = berlin(new Date(t.ende));
  const kunde = aktiv(bestand.kunden as unknown as Kunde[]).find((k) => k.id === t.kundeId);
  const mitarbeiter = (bestand.mitarbeiter ?? []) as unknown as Mitarbeiter[];
  return {
    appointment_id: t.id,
    title: t.titel,
    type: t.art,
    date: s.datum,
    start_time: t.ganztags ? null : s.uhr,
    end_date: e.datum,
    end_time: t.ganztags ? null : e.uhr,
    all_day: !!t.ganztags,
    appointment_status: t.status,
    customer_id: t.kundeId ?? null,
    customer_name: kunde?.name ?? null,
    job_id: t.auftragId ?? null,
    assignees: (t.mitarbeiterIds ?? []).map((id) => {
      const m = mitarbeiter.find((x) => x.id === id);
      return { employee_id: id, name: m ? nameVon(m) : null };
    }),
  };
}

const konfliktAntwort = (liste: Konflikt[]): Ergebnis => ({
  art: 'antwort',
  status: 409,
  antwort: {
    status: 'conflict',
    message: `${liste[0].message}${liste.length > 1 ? ` (und ${liste.length - 1} weitere Überschneidung${liste.length > 2 ? 'en' : ''})` : ''} Nach Rückfrage mit "allow_conflict": true trotzdem eintragen.`,
    conflicts: liste.slice(0, 10),
    requires_confirmation: true,
  },
});

const datumText = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

// ------------------------------------------------------------------ Termine ansehen

interface TermineSuchen {
  datum?: string;
  tage: number;
  mitarbeiterId?: ID;
  kundeId?: ID;
  auftragId?: ID;
}

export const termineSuchen: PartnerAktion<TermineSuchen> = {
  name: 'find-appointments',
  gateway: 'appointment.find',
  beschreibung:
    'Termine ansehen – für einen Tag oder mehrere, für einen Mitarbeiter, Kunden oder Auftrag. Monteure und Azubis sehen ohne Filter nur ihre eigenen Termine.',
  risiko: 'lesen',
  rechte: ['lesen'],
  liest: ['termine', 'kunden', 'mitarbeiter'],
  eingabe: {
    date: { typ: 'string', beschreibung: 'Erster Tag (YYYY-MM-DD), Standard: heute' },
    days: { typ: 'number', beschreibung: 'Wie viele Tage ab date (1–31), Standard: 1' },
    assignee_id: { typ: 'string', beschreibung: 'Nur Termine dieses Mitarbeiters; „me“ = der Nutzer selbst' },
    customer_id: { typ: 'string', beschreibung: 'Nur Termine dieses Kunden' },
    job_id: { typ: 'string', beschreibung: 'Nur Termine dieses Auftrags' },
  },
  pruefe: pruefeMit((roh) => {
    const datum = text(roh, 'date', 10);
    if (datum && (!ISO_DATUM.test(datum) || Number.isNaN(Date.parse(datum)))) throw new Eingabefehler('„date“ ist ein Datum wie 2026-10-12.', 'date');
    const tage = zahl(roh, 'days') ?? 1;
    if (!Number.isInteger(tage) || tage < 1 || tage > 31) throw new Eingabefehler('„days“ ist eine ganze Zahl von 1 bis 31.', 'days');
    return { datum, tage, mitarbeiterId: text(roh, 'assignee_id', 100), kundeId: text(roh, 'customer_id', 100), auftragId: text(roh, 'job_id', 100) };
  }),
  fuehreAus(d, k, bestand) {
    const ich = k.handelnder.mitarbeiter;
    const ab = d.datum ?? berlin(k.jetzt).datum;
    const von = berlinZeitpunkt(ab, '00:00').getTime();
    const bis = berlinZeitpunkt(plusTage(ab, d.tage), '00:00').getTime();
    const fuer = d.mitarbeiterId === 'me' ? ich.id : (d.mitarbeiterId ?? (NUR_EIGENE.has(ich.rolle) && !d.kundeId && !d.auftragId ? ich.id : undefined));
    const liste = ((bestand.termine ?? []) as unknown as Termin[])
      .filter((t) => !t.geloeschtAm && ueberlappt(spanne(t), { von, bis }))
      .filter((t) => (!fuer || t.mitarbeiterIds?.includes(fuer)) && (!d.kundeId || t.kundeId === d.kundeId) && (!d.auftragId || t.auftragId === d.auftragId))
      .sort((a, b) => a.start.localeCompare(b.start));
    return {
      art: 'antwort',
      status: 200,
      antwort: { status: 'ok', from: ab, days: d.tage, assignee_id: fuer ?? null, total: liste.length, appointments: liste.slice(0, 100).map((t) => terminKurz(t, bestand)) },
    };
  },
};

// ------------------------------------------------------------------ Termin anlegen

interface TerminAnlegen {
  datum: string;
  startUhr?: string;
  endeUhr?: string;
  dauer?: number;
  ganztags: boolean;
  titel?: string;
  art: TerminArt;
  auftragId?: ID;
  kundeId?: ID;
  mitarbeiterIds?: ID[];
  notiz?: string;
  trotzKonflikt: boolean;
}

export const terminAnlegen: PartnerAktion<TerminAnlegen> = {
  name: 'create-appointment',
  gateway: 'appointment.create',
  beschreibung:
    'Termin eintragen (Einsatz, Besichtigung, …) – für den Nutzer selbst oder Kollegen. Überschneidungen und Abwesenheiten werden gemeldet (409 conflict); nach Rückfrage mit allow_conflict: true trotzdem eintragen.',
  risiko: 'schreiben',
  rechte: ['planen'],
  liest: ['termine', 'kunden', 'auftraege', 'mitarbeiter', 'abwesenheiten'],
  eingabe: {
    date: { typ: 'string', pflicht: true, beschreibung: 'Tag (YYYY-MM-DD)' },
    start_time: { typ: 'string', beschreibung: 'Beginn in deutscher Zeit, z. B. 08:00 (Pflicht, außer all_day)' },
    end_time: { typ: 'string', beschreibung: 'Ende, z. B. 12:00 (alternativ duration_minutes)' },
    duration_minutes: { typ: 'number', beschreibung: 'Dauer in Minuten, Standard 60' },
    all_day: { typ: 'boolean', beschreibung: 'ganztägig' },
    title: { typ: 'string', beschreibung: 'Titel (Standard: Auftrag bzw. Kunde)' },
    type: { typ: 'string', beschreibung: 'Art, Standard einsatz', werte: ARTEN },
    job_id: { typ: 'string', beschreibung: 'Auftrag' },
    customer_id: { typ: 'string', beschreibung: 'Kunde (Standard: Kunde des Auftrags)' },
    assignee_ids: { typ: 'object', beschreibung: 'Liste der Mitarbeiter-IDs (Standard: der Nutzer selbst)' },
    note: { typ: 'string', beschreibung: 'Notiz für das Team' },
    allow_conflict: { typ: 'boolean', beschreibung: 'trotz Überschneidung eintragen (nach Rückfrage)' },
  },
  pruefe: pruefeMit((roh) => {
    const datum = text(roh, 'date', 10);
    if (!datum || !ISO_DATUM.test(datum) || Number.isNaN(Date.parse(datum))) throw new Eingabefehler('An welchem Tag? „date“ wie 2026-10-12.', 'date');
    const ganztags = roh.all_day === true;
    const startUhr = text(roh, 'start_time', 5);
    const endeUhr = text(roh, 'end_time', 5);
    if (!ganztags && !startUhr) throw new Eingabefehler('Um wie viel Uhr? „start_time“ wie 08:00.', 'start_time');
    if (startUhr && !UHRZEIT.test(startUhr)) throw new Eingabefehler('„start_time“ ist eine Uhrzeit wie 08:00.', 'start_time');
    if (endeUhr && !UHRZEIT.test(endeUhr)) throw new Eingabefehler('„end_time“ ist eine Uhrzeit wie 12:00.', 'end_time');
    if (startUhr && endeUhr && endeUhr <= startUhr) throw new Eingabefehler('„end_time“ liegt vor dem Beginn.', 'end_time');
    const dauer = zahl(roh, 'duration_minutes');
    if (dauer !== undefined && (!Number.isInteger(dauer) || dauer < 5 || dauer > 24 * 60)) throw new Eingabefehler('„duration_minutes“ liegt zwischen 5 und 1440.', 'duration_minutes');
    const art = (text(roh, 'type', 20) ?? 'einsatz') as TerminArt;
    if (!ARTEN.includes(art)) throw new Eingabefehler(`„type“ ist eins von ${ARTEN.join(', ')}.`, 'type');
    let mitarbeiterIds: ID[] | undefined;
    if (roh.assignee_ids !== undefined && roh.assignee_ids !== null) {
      if (!Array.isArray(roh.assignee_ids) || !roh.assignee_ids.length || roh.assignee_ids.length > 20 || !roh.assignee_ids.every((x) => typeof x === 'string' && x.trim()))
        throw new Eingabefehler('„assignee_ids“ ist eine Liste von Mitarbeiter-IDs.', 'assignee_ids');
      mitarbeiterIds = [...new Set((roh.assignee_ids as string[]).map((x) => x.trim()))];
    }
    return {
      datum,
      startUhr,
      endeUhr,
      dauer,
      ganztags,
      titel: text(roh, 'title', 200),
      art,
      auftragId: text(roh, 'job_id', 100),
      kundeId: text(roh, 'customer_id', 100),
      mitarbeiterIds,
      notiz: text(roh, 'note', 2000),
      trotzKonflikt: roh.allow_conflict === true,
    };
  }),
  fuehreAus(d, k, bestand) {
    if (d.datum < berlin(k.jetzt).datum) return nichtGefunden('date', 'Der Tag liegt in der Vergangenheit.');
    const auftrag = d.auftragId ? aktiv(bestand.auftraege as unknown as Auftrag[]).find((x) => x.id === d.auftragId) : undefined;
    if (d.auftragId && !auftrag) return nichtGefunden('job_id', 'Diesen Auftrag gibt es nicht (mehr).');
    const kundeId = d.kundeId ?? auftrag?.kundeId;
    const kunde = kundeId ? aktiv(bestand.kunden as unknown as Kunde[]).find((x) => x.id === kundeId) : undefined;
    if (kundeId && !kunde) return nichtGefunden('customer_id', 'Diesen Kunden gibt es nicht (mehr).');
    if (auftrag && kunde && auftrag.kundeId !== kunde.id) return nichtGefunden('job_id', 'Der Auftrag gehört zu einem anderen Kunden.');
    const alleMa = (bestand.mitarbeiter ?? []) as unknown as Mitarbeiter[];
    const ids = d.mitarbeiterIds ?? [k.handelnder.mitarbeiter.id];
    const fehlt = ids.find((id) => !alleMa.some((m) => m.id === id && !m.geloeschtAm && m.aktiv));
    if (fehlt) return nichtGefunden('assignee_ids', `Den Mitarbeiter „${fehlt}“ gibt es nicht oder er ist nicht aktiv.`);

    const start = d.ganztags ? berlinZeitpunkt(d.datum, '00:00') : berlinZeitpunkt(d.datum, d.startUhr!);
    const ende = d.ganztags
      ? berlinZeitpunkt(d.datum, '23:59')
      : d.endeUhr
        ? berlinZeitpunkt(d.datum, d.endeUhr)
        : new Date(start.getTime() + (d.dauer ?? 60) * 60_000);
    const zeit = k.jetzt.toISOString();
    const titel = d.titel ?? auftrag?.titel ?? (kunde ? `${ART_TEXT[d.art]} ${kunde.name}` : ART_TEXT[d.art]);
    const termin: Termin = {
      id: k.neueId(),
      erstelltAm: zeit,
      geaendertAm: zeit,
      erstelltVon: k.handelnder.mitarbeiter.id,
      art: d.art,
      titel,
      start: start.toISOString(),
      ende: ende.toISOString(),
      ganztags: d.ganztags || undefined,
      auftragId: auftrag?.id,
      kundeId: kunde?.id,
      ortId: auftrag?.ortId,
      mitarbeiterIds: ids,
      status: 'geplant',
      notiz: d.notiz,
    };
    const k1 = konflikte(termin, bestand);
    if (k1.length && !d.trotzKonflikt) return konfliktAntwort(k1);

    const kurz = terminKurz(termin, bestand);
    const wann = `${datumText(d.datum)}${d.ganztags ? ' ganztags' : `, ${kurz.start_time} Uhr`}`;
    const ereignisse = [{ typ: 'appointment.created', objekt: { typ: 'termine', id: termin.id }, daten: { ...kurz, conflicts: k1.length } }];
    if (auftrag && (d.art === 'einsatz' || d.art === 'wartung'))
      ereignisse.push({ typ: 'job.scheduled', objekt: { typ: 'termine', id: termin.id }, daten: { ...kurz, conflicts: k1.length } });
    return {
      art: 'geaendert',
      status: 201,
      antwort: { status: 'created', ...kurz, conflicts: k1, requires_confirmation: false },
      zeilen: [{ sammlung: 'termine', id: termin.id, daten: ohneLeere(termin) }],
      bezug: { typ: 'termine', id: termin.id },
      verlauf: `Termin ${wann} eingetragen${k1.length ? ' (trotz Überschneidung)' : ''} – über ${k.partnerName} für ${nameVon(k.handelnder.mitarbeiter)}`,
      weitereVerlaeufe: auftrag ? [{ bezug: { typ: 'auftraege', id: auftrag.id }, text: `Termin „${titel}“ am ${wann} – über ${k.partnerName}`, aenderung: 'updated' }] : [],
      ereignisse,
    };
  },
};

// ------------------------------------------------------------------ Termin verschieben

interface TerminVerschieben {
  terminId: ID;
  datum: string;
  startUhr?: string;
  trotzKonflikt: boolean;
}

export const terminVerschieben: PartnerAktion<TerminVerschieben> = {
  name: 'reschedule-appointment',
  gateway: 'appointment.reschedule',
  beschreibung:
    'Termin auf einen anderen Tag oder eine andere Uhrzeit legen – die Dauer bleibt. Kritisch wie in der App (der Kunde rechnet mit dem alten Termin): erst beim Nutzer bestätigen, dann mit "confirmed": true.',
  risiko: 'kritisch',
  rechte: ['planen'],
  liest: ['termine', 'kunden', 'auftraege', 'mitarbeiter', 'abwesenheiten'],
  eingabe: {
    appointment_id: { typ: 'string', pflicht: true, beschreibung: 'Termin (aus find-appointments)' },
    date: { typ: 'string', pflicht: true, beschreibung: 'Neuer Tag (YYYY-MM-DD)' },
    start_time: { typ: 'string', beschreibung: 'Neue Uhrzeit, z. B. 10:00 (Standard: Uhrzeit bleibt)' },
    allow_conflict: { typ: 'boolean', beschreibung: 'trotz Überschneidung verschieben (nach Rückfrage)' },
  },
  pruefe: pruefeMit((roh) => {
    const terminId = text(roh, 'appointment_id', 100);
    if (!terminId) throw new Eingabefehler('Welcher Termin? „appointment_id“ fehlt.', 'appointment_id');
    const datum = text(roh, 'date', 10);
    if (!datum || !ISO_DATUM.test(datum) || Number.isNaN(Date.parse(datum))) throw new Eingabefehler('Auf welchen Tag? „date“ wie 2026-10-12.', 'date');
    const startUhr = text(roh, 'start_time', 5);
    if (startUhr && !UHRZEIT.test(startUhr)) throw new Eingabefehler('„start_time“ ist eine Uhrzeit wie 10:00.', 'start_time');
    return { terminId, datum, startUhr, trotzKonflikt: roh.allow_conflict === true };
  }),
  fuehreAus(d, k, bestand) {
    const t = ((bestand.termine ?? []) as unknown as Termin[]).find((x) => x.id === d.terminId && !x.geloeschtAm);
    if (!t || t.status === 'abgesagt') return nichtGefunden('appointment_id', 'Diesen Termin gibt es nicht (mehr).');
    if (t.status === 'erledigt') return nichtGefunden('appointment_id', 'Dieser Termin ist schon erledigt.');
    if (d.datum < berlin(k.jetzt).datum) return nichtGefunden('date', 'Der Tag liegt in der Vergangenheit.');
    const dauer = Date.parse(t.ende) - Date.parse(t.start);
    const start = berlinZeitpunkt(d.datum, t.ganztags ? '00:00' : (d.startUhr ?? berlin(new Date(t.start)).uhr));
    const neu: Termin = { ...t, start: start.toISOString(), ende: new Date(start.getTime() + dauer).toISOString(), geaendertAm: k.jetzt.toISOString() };
    if (neu.start === t.start) return nichtGefunden('date', 'Der Termin liegt schon dort.');
    const k1 = konflikte(neu, bestand);
    if (k1.length && !d.trotzKonflikt) return konfliktAntwort(k1);
    const vorher = terminKurz(t, bestand);
    const kurz = terminKurz(neu, bestand);
    const wann = `${datumText(kurz.date)}${neu.ganztags ? ' ganztags' : `, ${kurz.start_time} Uhr`}`;
    return {
      art: 'geaendert',
      status: 200,
      antwort: { status: 'rescheduled', ...kurz, previous: { date: vorher.date, start_time: vorher.start_time }, conflicts: k1, requires_confirmation: false },
      zeilen: [{ sammlung: 'termine', id: t.id, daten: ohneLeere(neu) }],
      bezug: { typ: 'termine', id: t.id },
      aenderung: 'updated',
      verlauf: `Verschoben auf ${wann} – über ${k.partnerName} für ${nameVon(k.handelnder.mitarbeiter)}`,
      weitereVerlaeufe: t.auftragId ? [{ bezug: { typ: 'auftraege', id: t.auftragId }, text: `Termin „${t.titel}“ verschoben auf ${wann} – über ${k.partnerName}`, aenderung: 'updated' }] : [],
      ereignisse: [{ typ: 'appointment.rescheduled', objekt: { typ: 'termine', id: t.id }, daten: { ...kurz, previous: { date: vorher.date, start_time: vorher.start_time } } }],
    };
  },
};
