/**
 * Wartung: fällige Anlagen finden, Wartungsaufträge gebündelt je Ort anlegen,
 * Prüfpunkte als Aufgaben, Serientermine verknüpfen, nach Abschluss fortschreiben.
 * Reine Logik auf `db.*` – testbar ohne Oberfläche.
 */
import { batch, db, vermerken } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import { aktionAusfuehren, alleModule, pfadZu } from '@core/modul';
import { adresseText, datum, heute, plusTage, uhrzeit, plusMonate, wochenStart } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import type { Anlage, Auftrag, Datum, ID, Termin } from '@core/objects';
import { intervallText } from '../wiederkehrend/regel';
import { serien, terminDatum } from '../wiederkehrend/daten';
import { vertragFuerAnlage, vertragFuerAuftrag } from '../servicevertraege/daten';
import { pruefpunkte } from './pruefpunkte';

export const REGEL_ANLEGEN = 'wartung.auftraege-anlegen';
export const REGEL_FORTSCHREIBEN = 'wartung.fortschreiben';

const ABGESCHLOSSEN: Auftrag['phase'][] = ['abnahme', 'abrechnung', 'erledigt'];
const istOffen = (a: Auftrag) => !['erledigt', 'verloren'].includes(a.phase);

/** Vorlauf in Wochen, wie früh Wartungsaufträge angelegt werden */
export const vorlaufWochen = () => einstellung<number>('wartung.vorlaufWochen', 4);

export function offenerWartungsauftrag(anlageId: ID): Auftrag | undefined {
  return db.auftraege.all().find((a) => a.art === 'wartung' && istOffen(a) && (a.anlageIds ?? []).includes(anlageId));
}

/** Anlagen, deren nächste Wartung innerhalb des Vorlaufs liegt und für die noch kein offener Auftrag existiert */
export function faelligeAnlagen(stichtag: Datum = heute(), vorlaufTage = vorlaufWochen() * 7): Anlage[] {
  const grenze = plusTage(stichtag, vorlaufTage);
  return db.anlagen
    .where((a) => !!a.naechsteWartung && a.naechsteWartung <= grenze && !offenerWartungsauftrag(a.id))
    .sort((a, b) => a.naechsteWartung!.localeCompare(b.naechsteWartung!));
}

/** Anlagen am selben Ort (gleicher Kunde) bündeln – ein Einsatz statt drei */
export function buendeln(anlagen: Anlage[]): Anlage[][] {
  const gruppen = new Map<string, Anlage[]>();
  for (const a of anlagen) {
    const k = `${a.kundeId}|${a.ortId}`;
    gruppen.set(k, [...(gruppen.get(k) ?? []), a]);
  }
  return [...gruppen.values()];
}

const titelFuer = (anlagen: Anlage[]) => `Wartung: ${[...new Set(anlagen.map((a) => a.typ))].join(', ')}`;

/** Prüfpunkte je Anlage als Aufgaben am Auftrag */
function pruefpunkteAnlegen(auftrag: Auftrag, anlagen: Anlage[], faellig?: Datum) {
  const vorhanden = db.aufgaben.where((t) => t.auftragId === auftrag.id).length;
  let i = vorhanden;
  for (const anl of anlagen) {
    for (const punkt of pruefpunkte(anl.typ)) {
      db.aufgaben.create({
        titel: anlagen.length > 1 || vorhanden ? `${anl.typ}: ${punkt}` : punkt,
        auftragId: auftrag.id,
        bezug: { typ: 'anlagen', id: anl.id },
        faellig,
        erledigt: false,
        prioritaet: 'normal',
        quelle: 'wartung',
        reihenfolge: i++,
        beispiel: auftrag.beispiel,
      });
    }
  }
}

/** Freien Serientermin (aus „Wiederkehrende Termine“) für diese Anlagen an den Auftrag hängen */
export function serienterminVerknuepfen(auftrag: Auftrag, stichtag: Datum = heute()): Termin | undefined {
  const ids = auftrag.anlageIds ?? [];
  const passendeSerien = serien.where((s) => (s.anlageIds ?? []).some((id) => ids.includes(id)) || (!!s.ortId && s.ortId === auftrag.ortId && s.terminArt === 'wartung'));
  if (!passendeSerien.length) return undefined;
  const faellig = ids.map((id) => db.anlagen.get(id)?.naechsteWartung).filter(Boolean).sort()[0] ?? stichtag;
  const bis = plusTage(faellig, 45);
  const t = db.termine
    .where((t) => !t.auftragId && !!t.serieId && passendeSerien.some((s) => s.id === t.serieId) && ['geplant', 'bestaetigt'].includes(t.status))
    .filter((t) => terminDatum(t.start) >= stichtag && terminDatum(t.start) <= bis)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (!t) return undefined;
  return db.termine.update(t.id, { auftragId: auftrag.id }, { text: `Mit Wartungsauftrag ${auftrag.nummer} verknüpft` });
}

/**
 * Wartungsauftrag für Anlagen (alle am selben Ort) anlegen. Gibt es dort schon einen
 * offenen, noch nicht begonnenen Wartungsauftrag, werden die Anlagen ergänzt.
 */
export function wartungsauftragAnlegen(anlagen: Anlage[], stichtag: Datum = heute()): Auftrag {
  const erste = anlagen[0];
  const beispiel = anlagen.every((a) => a.beispiel) || undefined;
  const faellig = anlagen.map((a) => a.naechsteWartung).filter(Boolean).sort()[0] as Datum | undefined;
  const stunden = einstellung<number | undefined>('wartung.stundenJeAnlage', undefined);
  let auftrag: Auftrag | undefined = db.auftraege
    .all()
    .find((a) => a.art === 'wartung' && ['anfrage', 'beauftragt'].includes(a.phase) && a.kundeId === erste.kundeId && a.ortId === erste.ortId);
  let neu = false;
  batch(() => {
    if (auftrag) {
      const ids = [...new Set([...(auftrag.anlageIds ?? []), ...anlagen.map((a) => a.id)])];
      const alle = ids.map((id) => db.anlagen.get(id)).filter(Boolean) as Anlage[];
      auftrag = db.auftraege.update(auftrag.id, { anlageIds: ids, titel: titelFuer(alle) }, { text: 'Weitere Anlagen zur Wartung ergänzt' })!;
    } else {
      neu = true;
      const vertrag = anlagen.map((a) => vertragFuerAnlage(a.id, stichtag)).find(Boolean);
      const zeilen = anlagen.map(
        (a) =>
          `• ${a.typ}${a.hersteller ? ` (${[a.hersteller, a.modell].filter(Boolean).join(' ')})` : ''} – fällig ${datum(a.naechsteWartung)}, ${intervallText(a.wartungMonate)}`,
      );
      auftrag = db.auftraege.create({
        nummer: naechsteNummer('auftrag'),
        titel: titelFuer(anlagen),
        art: 'wartung',
        phase: 'beauftragt',
        kundeId: erste.kundeId,
        ortId: erste.ortId,
        anlageIds: anlagen.map((a) => a.id),
        beschreibung: [
          ...zeilen,
          vertrag ? `Im Servicevertrag ${vertrag.nummer} enthalten – nicht berechnen.` : undefined,
        ]
          .filter(Boolean)
          .join('\n'),
        wunschtermin: faellig ? `bis ${datum(faellig)}` : undefined,
        geplanteStunden: stunden ? stunden * anlagen.length : undefined,
        beispiel,
      });
    }
    pruefpunkteAnlegen(auftrag!, anlagen, faellig);
  });
  serienterminVerknuepfen(auftrag!, stichtag);
  if (!neu) vermerken({ typ: 'auftraege', id: auftrag!.id }, 'wartung.ergaenzt', `${anlagen.length} Anlage(n) ergänzt`);
  return auftrag!;
}

/** Automation: alle fälligen Anlagen gebündelt als Wartungsaufträge anlegen */
export function wartungenAnlegen(stichtag: Datum = heute(), protokollieren = true): Auftrag[] {
  const gruppen = buendeln(faelligeAnlagen(stichtag));
  const out: Auftrag[] = [];
  for (const g of gruppen) {
    const a = wartungsauftragAnlegen(g, stichtag);
    out.push(a);
    if (protokollieren) {
      const kunde = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
      erledigt(REGEL_ANLEGEN, `Wartungsauftrag ${a.nummer} für ${kunde} angelegt`, {
        text: `${g.length} Anlage(n) gebündelt, Prüfpunkte als Aufgaben angelegt.`,
        bezug: { typ: 'auftraege', id: a.id },
      });
    }
  }
  return out;
}

/**
 * Nach erledigter Wartung: letzte/nächste Wartung an den Anlagen fortschreiben.
 * Gibt die Anzahl aktualisierter Anlagen zurück.
 */
export function wartungFortschreiben(auftragId: ID, am: Datum = heute()): number {
  const a = db.auftraege.get(auftragId);
  if (!a || a.art !== 'wartung') return 0;
  let n = 0;
  batch(() => {
    for (const id of a.anlageIds ?? []) {
      const anl = db.anlagen.get(id);
      if (!anl || (anl.letzteWartung && anl.letzteWartung >= am)) continue;
      const monate = anl.wartungMonate ?? vertragFuerAnlage(id, am)?.intervallMonate;
      db.anlagen.update(
        id,
        { letzteWartung: am, naechsteWartung: monate ? plusMonate(am, monate) : anl.naechsteWartung },
        { text: `Wartung erledigt (${a.nummer})${monate ? `, nächste am ${datum(plusMonate(am, monate))}` : ''}` },
      );
      n++;
    }
  });
  return n;
}

/** Ist die Phase gerade in „fertig“ gewechselt? */
export const geradeAbgeschlossen = (vorher: Auftrag | undefined, neu: Auftrag) =>
  neu.art === 'wartung' && ABGESCHLOSSEN.includes(neu.phase) && (!vorher || !ABGESCHLOSSEN.includes(vorher.phase));

/** Wartung abschließen (Knopf im Tab): fortschreiben + Phase setzen (im Vertrag: direkt erledigt) */
export function wartungAbschliessen(auftragId: ID, am: Datum = heute()) {
  const a = db.auftraege.get(auftragId);
  if (!a) return;
  const vertrag = vertragFuerAuftrag(a, am);
  wartungFortschreiben(auftragId, am);
  db.auftraege.update(
    a.id,
    vertrag
      ? { phase: 'erledigt', abgeschlossenAm: new Date().toISOString() }
      : { phase: 'abrechnung', abgeschlossenAm: new Date().toISOString() },
    { text: vertrag ? `Wartung erledigt – im Servicevertrag ${vertrag.nummer} enthalten, keine Rechnung` : 'Wartung erledigt – bereit zur Abrechnung' },
  );
}

// ------------------------------------------------------------------ Termin & Kunde

export function wartungsTermin(auftragId: ID): Termin | undefined {
  return db.termine
    .where((t) => t.auftragId === auftragId && t.status !== 'abgesagt')
    .sort((a, b) => a.start.localeCompare(b.start))
    .find((t) => terminDatum(t.start) >= heute()) ?? undefined;
}

export function kundeBenachrichtigt(auftragId: ID): boolean {
  return db.nachrichten.where((n) => n.auftragId === auftragId && n.richtung === 'aus').length > 0;
}

/** Vorbereiteter Text an den Kunden (Kundenansprache „Sie“) */
export function benachrichtigungsText(auftragId: ID): string {
  const a = db.auftraege.get(auftragId);
  if (!a) return '';
  const k = db.kunden.get(a.kundeId);
  const o = db.orte.get(a.ortId);
  const anlagen = (a.anlageIds ?? []).map((id) => db.anlagen.get(id)).filter(Boolean) as Anlage[];
  const betrieb = db.betrieb.get('betrieb');
  const t = wartungsTermin(a.id);
  const vertrag = vertragFuerAuftrag(a);
  const was = anlagen.length === 1 ? `Ihre Anlage (${anlagen[0].typ})` : `Ihre Anlagen (${anlagen.map((x) => x.typ).join(', ')})`;
  const anrede = k?.art === 'privat' ? `Guten Tag ${k.name},` : 'Guten Tag,';
  return [
    anrede,
    '',
    `für ${was}${o ? ` in ${adresseText(o.adresse)}` : ''} steht die nächste Wartung an${vertrag ? ' – sie ist in Ihrem Servicevertrag enthalten' : ''}.`,
    t
      ? `Unser Terminvorschlag: ${datum(t.start)} um ${uhrzeit(t.start)} Uhr. Passt Ihnen das? Sonst melden Sie sich bitte kurz.`
      : 'Wir melden uns in Kürze mit einem Terminvorschlag.',
    '',
    'Viele Grüße',
    betrieb?.name ?? '',
  ].join('\n');
}

export function kundeBenachrichtigen(auftragId: ID, text = benachrichtigungsText(auftragId)) {
  const a = db.auftraege.get(auftragId);
  if (!a) return undefined;
  const k = db.kunden.get(a.kundeId);
  const n = db.nachrichten.create({
    kanal: k?.email ? 'email' : 'sms',
    richtung: 'aus',
    auftragId: a.id,
    kundeId: a.kundeId,
    text,
    gelesen: true,
    betreff: 'Ihre Wartung steht an',
    beispiel: a.beispiel,
  });
  vermerken({ typ: 'auftraege', id: a.id }, 'wartung.kunde-benachrichtigt', 'Kunde über die Wartung informiert');
  return n;
}

/** Terminvorschlag über die Planung holen (autoplanung → einsatzplanung → Auftrag) */
export function terminVorschlagen(auftragId: ID): string | void {
  const hat = (id: string) => alleModule().some((m) => !!m.aktionen?.[id]);
  if (hat('plan.vorschlag')) return aktionAusfuehren('plan.vorschlag', { auftragId });
  if (hat('plan.einplanen')) return aktionAusfuehren('plan.einplanen', { auftragId });
  return pfadZu({ typ: 'auftraege', id: auftragId });
}

// ------------------------------------------------------------------ Übersicht

export type Zeitraum = 'ueberfaellig' | 'woche' | 'monat' | 'spaeter';

export function einordnen(faellig: Datum, stichtag: Datum = heute()): Zeitraum {
  if (faellig < stichtag) return 'ueberfaellig';
  const sonntag = plusTage(wochenStart(stichtag), 6);
  if (faellig <= sonntag) return 'woche';
  const [j, m] = stichtag.split('-').map(Number);
  const monatsende = plusTage(`${j}-${String(m).padStart(2, '0')}-01`, 0);
  if (faellig <= plusTage(plusMonate(monatsende, 1), -1)) return 'monat';
  return 'spaeter';
}
