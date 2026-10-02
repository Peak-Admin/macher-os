/**
 * Einsatz abschließen per Sprache: Aus dem gelesenen Bericht (`sprachbericht.ts`) wird ein Plan, den der Monteur
 * bestätigt („Passt das so?“). „Übernehmen“ schreibt dann genau EINMAL in die bestehenden Objekte:
 *
 * - Zeit: Zeiteintrag am Termin (laufende Stempeluhr wird zum genannten Ende gestoppt, sonst Eintrag nach Plan)
 * - Material: geplantes Material am Auftrag wird „verbraucht“, sonst neue Buchung (mit Artikel, wenn er passt)
 * - Zusatzarbeit: Zusatzleistung (Nachtrag) „wartet auf Freigabe“
 * - Bericht: Rapport/Tagesbericht des Einsatzes (Sammlung `berichte`) mit Tätigkeiten und Bemerkung
 * - Baustellendokumentation: Notiz-Dokument mit dem ganzen Text, verknüpft mit dem Bericht
 * - Zeitstrahl: Vermerk am Auftrag und am Termin
 * - Status: offen → Aufgabe „Restarbeiten“, Problem → Hinweis an Chef und Büro
 * - zuletzt `einsatzBeenden` → Termin erledigt, Event `einsatz.beendet`
 *
 * Nichts davon muss der Monteur ein zweites Mal eintippen.
 */
import { batch, db, vermerken, zeitstrahl } from '@core/db';
import { datum as datumText, datumVon, heute, isoDatum, minutenAus, minutenVon, uhrAus } from '@core/format';
import { hinweis } from '@core/macher';
import type { Artikel, Cent, Einheit, ID, Leistung, Materialbuchung, Termin, Zeiteintrag } from '@core/objects';
import { ich } from '@core/session';
import { stoppen } from '@modules/arbeitszeiten/daten';
import { berichte, berichtErstellen } from '@modules/berichte/daten';
import { zusatzleistungen } from '@modules/zusatzleistungen/daten';
import { einsatzBeenden } from './logik';
import { besterTreffer, mengeText, zeitText, type BerichtStatus, type MaterialPosten, type SprachBericht, type ZeitAngabe } from './sprachbericht';

/** Zeitstrahl-Typ des Vermerks – zugleich Schutz gegen doppeltes Übernehmen */
export const VERMERK_ABSCHLUSS = 'einsatz.sprachbericht';
export const VERMERK_PROBLEM = 'einsatz.problem_gemeldet';

// ------------------------------------------------------------------ Zeit (rein)

export interface ZeitRahmen {
  /** Minuten seit Mitternacht */
  planStart: number;
  planEnde: number;
  /** Start einer laufenden Stempeluhr auf diesem Termin */
  laufStart?: number;
  /** schon beendeter Eintrag auf diesem Termin */
  vorhanden?: { start: number; ende: number };
  /** jetzt, Minuten seit Mitternacht */
  jetzt: number;
  /** Termin ist heute */
  heute: boolean;
}

/**
 * Welche Arbeitszeit wird gebucht?
 * - „von 8 bis 13 Uhr“ → genau so
 * - „3 Stunden gearbeitet“ → ab Start (Stempeluhr, sonst Plan) drei Stunden
 * - „eine Stunde länger“ / „30 Minuten weniger“ → Planende ± Minuten
 * - nichts gesagt → laufende Stempeluhr endet jetzt; ohne Stempeluhr gilt der Plan (heute höchstens bis jetzt)
 */
export function zeitPlanen(r: ZeitRahmen, z: ZeitAngabe | undefined): { start: number; ende: number } {
  if (z?.art === 'spanne' && z.von != null && z.bis != null) return { start: z.von, ende: z.bis };
  const start = r.laufStart ?? r.vorhanden?.start ?? r.planStart;
  let ende: number;
  if (z?.art === 'dauer') ende = start + (z.minuten ?? 0);
  else if (z?.art === 'mehr') ende = r.planEnde + (z.minuten ?? 0);
  else if (z?.art === 'weniger') ende = r.planEnde - (z.minuten ?? 0);
  else if (r.laufStart != null) ende = r.heute ? r.jetzt : r.planEnde;
  else if (r.vorhanden) ende = r.vorhanden.ende;
  else ende = r.heute && r.jetzt > start ? Math.min(r.planEnde, r.jetzt) : r.planEnde;
  return { start, ende: Math.min(24 * 60 - 1, Math.max(start, ende)) };
}

// ------------------------------------------------------------------ Material (rein)

export interface MaterialPlan {
  posten: MaterialPosten;
  /** geplantes Material am Auftrag, das jetzt als verbraucht gilt */
  buchungId?: ID;
  artikelId?: ID;
  /** Name für die Buchung: Artikelname, sonst wie gesagt */
  name: string;
  einheit: Einheit;
  ek: Cent;
}

/**
 * Gesagtes Material zuordnen: zuerst offenes Material am Auftrag (geplant/bestellt/bereit), dann Artikelstamm,
 * sonst Freitext. Jede geplante Buchung wird höchstens einmal genommen.
 */
export function materialZuordnen(posten: MaterialPosten[], offen: Pick<Materialbuchung, 'id' | 'text' | 'einheit' | 'artikelId' | 'ek'>[], artikel: Pick<Artikel, 'id' | 'name' | 'einheit' | 'ek'>[]): MaterialPlan[] {
  const genutzt = new Set<ID>();
  return posten.map((p) => {
    const einheit = p.einheitGenannt ? p.einheit : undefined;
    const b = besterTreffer(
      p.text,
      offen.filter((x) => !genutzt.has(x.id)).map((x) => ({ id: x.id, name: x.text, einheit: x.einheit })),
      einheit,
    );
    if (b) {
      genutzt.add(b.id);
      const x = offen.find((o) => o.id === b.id)!;
      return { posten: p, buchungId: x.id, artikelId: x.artikelId, name: x.text, einheit: x.einheit, ek: x.ek };
    }
    const a = besterTreffer(p.text, artikel, einheit);
    if (a) return { posten: p, artikelId: a.id, name: a.name, einheit: a.einheit, ek: a.ek };
    return { posten: p, name: p.text, einheit: p.einheit, ek: 0 };
  });
}

// ------------------------------------------------------------------ Zusatzarbeit (rein)

export interface ZusatzPlan {
  text: string;
  berechnung: 'leistung' | 'stunden';
  leistungId?: ID;
  /** Stunden (bei „stunden“) bzw. Menge der Leistung – fehlt, wenn nichts gesagt wurde */
  menge?: number;
  einheit: Einheit;
  einzelpreis: Cent;
}

/**
 * Zusatzarbeit als Nachtrag: passt eine Leistung aus dem Katalog, gilt deren Preis. Sonst nach Stunden –
 * „eine Stunde länger“ ist dann die Zeit für die Zusatzarbeit (nur bei genau einer Zusatzarbeit eindeutig).
 */
export function zusatzPlanen(texte: string[], zeit: ZeitAngabe | undefined, leistungen: Pick<Leistung, 'id' | 'name' | 'einheit' | 'preis'>[], stundensatz: Cent): ZusatzPlan[] {
  const mehrStunden = zeit?.art === 'mehr' && texte.length === 1 ? Math.round(((zeit.minuten ?? 0) / 60) * 100) / 100 : undefined;
  return texte.map((text) => {
    const l = besterTreffer(text, leistungen);
    if (l) return { text, berechnung: 'leistung', leistungId: l.id, menge: 1, einheit: l.einheit, einzelpreis: l.preis };
    return { text, berechnung: 'stunden', menge: mehrStunden, einheit: 'h', einzelpreis: stundensatz };
  });
}

// ------------------------------------------------------------------ Plan aus dem Datenstand

export interface AbschlussPlan {
  terminId: ID;
  auftragId?: ID;
  mitarbeiterId?: ID;
  bericht: SprachBericht;
  datum: string;
  zeit: { start: number; ende: number; laufendId?: ID; vorhandenId?: ID };
  material: MaterialPlan[];
  zusatz: ZusatzPlan[];
  status: BerichtStatus;
}

/** Ist dieser Einsatz schon per Sprachbericht abgeschlossen? (verhindert doppeltes Schreiben) */
export function schonUebernommen(terminId: ID): boolean {
  return zeitstrahl({ typ: 'termine', id: terminId }).some((e) => e.typ === VERMERK_ABSCHLUSS);
}

function terminZeiten(t: Termin, maId: ID | undefined) {
  const tag = datumVon(t.start);
  const eigene = db.zeiten.where((z) => z.terminId === t.id && z.mitarbeiterId === maId && z.art === 'arbeit');
  return { tag, laufend: eigene.find((z) => !z.ende), fertig: eigene.find((z) => !!z.ende && z.datum === tag) };
}

export function planen(terminId: ID, bericht: SprachBericht, jetzt = new Date(), maId: ID | undefined = ich()?.id): AbschlussPlan | undefined {
  const t = db.termine.get(terminId);
  if (!t) return undefined;
  const z = terminZeiten(t, maId);
  const { laufend, fertig } = z;
  // Läuft die Stempeluhr an einem anderen Tag als geplant (Einsatz vorgezogen), gilt der Tag der Stempeluhr
  const tag = laufend?.datum ?? z.tag;
  const r: ZeitRahmen = {
    planStart: minutenVon(t.start),
    planEnde: t.ende && datumVon(t.ende) === datumVon(t.start) ? minutenVon(t.ende) : minutenVon(t.start) + 60,
    laufStart: laufend ? minutenAus(laufend.start) : undefined,
    vorhanden: fertig ? { start: minutenAus(fertig.start), ende: minutenAus(fertig.ende!) } : undefined,
    jetzt: jetzt.getHours() * 60 + jetzt.getMinutes(),
    heute: tag === isoDatum(jetzt),
  };
  const offen = t.auftragId ? db.material.where((b) => b.auftragId === t.auftragId && b.status !== 'verbraucht') : [];
  const betrieb = db.betrieb.get('betrieb');
  return {
    terminId,
    auftragId: t.auftragId,
    mitarbeiterId: maId,
    bericht,
    datum: tag,
    zeit: { ...zeitPlanen(r, bericht.zeit), laufendId: laufend?.id, vorhandenId: fertig?.id },
    material: materialZuordnen(bericht.material, offen, db.artikel.where((a) => a.aktiv)),
    zusatz: t.auftragId ? zusatzPlanen(bericht.zusatz, bericht.zeit, db.leistungen.where((l) => l.aktiv), betrieb?.stundensatz ?? 0) : [],
    status: bericht.status,
  };
}

// ------------------------------------------------------------------ Schreiben

export interface AbschlussErgebnis {
  zeitId?: ID;
  materialIds: ID[];
  zusatzIds: ID[];
  berichtId?: ID;
  dokumentId?: ID;
  aufgabeId?: ID;
  hinweisId?: ID;
  /** Pfad, den der Bildschirm danach öffnen kann (z. B. Bericht zum Unterschreiben) */
  ziel?: string;
}

/** Problem vom Einsatz an Chef und Büro melden – derselbe Weg für „Problem melden“ und den Sprachbericht */
export function problemMelden(terminId: ID, text: string): ID | undefined {
  const t = db.termine.get(terminId);
  const sauber = text.trim();
  if (!t || !sauber) return undefined;
  const wer = ich();
  const h = hinweis({
    art: 'problem',
    titel: `Problem beim Einsatz: ${t.titel}`,
    text: `${sauber}${wer ? ` (gemeldet von ${wer.vorname})` : ''}`,
    bezug: t.auftragId ? { typ: 'auftraege', id: t.auftragId } : { typ: 'termine', id: t.id },
    gewicht: 72,
    fuerRollen: ['chef', 'buero'],
    schluessel: `einsatz-problem:${t.id}:${sauber.slice(0, 40)}`,
    faellig: heute(),
  });
  vermerken({ typ: 'termine', id: t.id }, VERMERK_PROBLEM, `Problem gemeldet: ${sauber}`);
  if (t.auftragId) vermerken({ typ: 'auftraege', id: t.auftragId }, VERMERK_PROBLEM, `Problem gemeldet: ${sauber}`);
  return h.id;
}

function zeitSchreiben(plan: AbschlussPlan, t: Termin): Zeiteintrag | undefined {
  const maId = plan.mitarbeiterId;
  if (!maId) return undefined;
  const start = uhrAus(plan.zeit.start);
  const ende = uhrAus(plan.zeit.ende);
  const notiz = 'Per Sprachbericht beim Einsatzabschluss';
  if (plan.zeit.laufendId) {
    const z = db.zeiten.get(plan.zeit.laufendId);
    if (z && !z.ende) {
      // Stempeluhr zum genannten Ende stoppen – den Start nur bei „von … bis …“ korrigieren
      const lauf = plan.bericht.zeit?.art === 'spanne' && z.start !== start ? (db.zeiten.update(z.id, { start }, { text: `Start laut Sprachbericht: ${start}` }) ?? z) : z;
      return stoppen(lauf, ende, `Gestoppt um ${ende} (Sprachbericht)`);
    }
  }
  if (plan.zeit.vorhandenId) {
    // schon gestoppt: nur korrigieren, wenn der Monteur etwas zur Zeit gesagt hat
    if (!plan.bericht.zeit) return db.zeiten.get(plan.zeit.vorhandenId);
    return db.zeiten.update(plan.zeit.vorhandenId, { start, ende }, { text: `Zeit laut Sprachbericht: ${start}–${ende}` });
  }
  return db.zeiten.create({ mitarbeiterId: maId, auftragId: t.auftragId, terminId: t.id, datum: plan.datum, start, ende, pauseMinuten: 0, art: 'arbeit', notiz, freigegeben: false });
}

/**
 * Alles übernehmen. Wirft, wenn der Einsatz schon übernommen wurde oder eine Zusatzarbeit noch keine Stunden hat.
 * `zusatzStunden` ergänzt fehlende Stunden je Zusatzarbeit (Index wie `plan.zusatz`).
 */
export function uebernehmen(plan: AbschlussPlan, zusatzStunden: (number | undefined)[] = []): AbschlussErgebnis {
  const t = db.termine.get(plan.terminId);
  if (!t) throw new Error('Diesen Einsatz gibt es nicht mehr.');
  if (schonUebernommen(t.id)) throw new Error('Dieser Einsatz ist schon abgeschlossen. Es wurde nichts doppelt gebucht.');
  const zusatz = plan.zusatz.map((z, i) => ({ ...z, menge: z.menge ?? zusatzStunden[i] }));
  if (zusatz.some((z) => !(z.menge != null && z.menge > 0))) throw new Error('Trag ein, wie lange die Zusatzarbeit gedauert hat.');

  const b = plan.bericht;
  const ergebnis: AbschlussErgebnis = { materialIds: [], zusatzIds: [] };
  const tag = plan.datum;
  const auftrag = db.auftraege.get(t.auftragId);

  batch(() => {
    // 1. Zeit
    ergebnis.zeitId = zeitSchreiben(plan, t)?.id;

    // 2. Material (nur mit Auftrag)
    if (auftrag) {
      for (const m of plan.material) {
        if (m.buchungId && db.material.get(m.buchungId)) {
          db.material.update(m.buchungId, { status: 'verbraucht', menge: m.posten.menge, datum: tag, mitarbeiterId: plan.mitarbeiterId }, { text: `Verbraucht laut Sprachbericht: ${mengeText(m.posten.menge)} ${m.einheit}` });
          ergebnis.materialIds.push(m.buchungId);
        } else {
          const neu = db.material.create({ auftragId: auftrag.id, artikelId: m.artikelId, text: m.name, menge: m.posten.menge, einheit: m.einheit, ek: m.ek, status: 'verbraucht', mitarbeiterId: plan.mitarbeiterId, datum: tag });
          ergebnis.materialIds.push(neu.id);
        }
      }
    }

    // 3. Zusatzarbeit als Nachtrag (wartet auf Freigabe des Kunden)
    if (auftrag) {
      for (const z of zusatz) {
        const neu = zusatzleistungen.create({
          auftragId: auftrag.id,
          text: z.text,
          berechnung: z.berechnung,
          leistungId: z.leistungId,
          menge: z.menge!,
          einheit: z.einheit,
          einzelpreis: z.einzelpreis,
          notiz: 'Per Sprachbericht beim Einsatzabschluss erfasst',
          fotoIds: [],
          status: 'offen',
        });
        ergebnis.zusatzIds.push(neu.id);
      }
    }

    // 4. Bericht (Rapport/Tagesbericht des Einsatzes) – vorhandenen Entwurf weiterverwenden
    if (auftrag) {
      const vorhanden = berichte.all().find((x) => x.terminId === t.id && x.status === 'entwurf');
      const bericht = vorhanden ?? berichtErstellen({ auftragId: auftrag.id, terminId: t.id, datum: tag });
      const taetigkeiten = [...b.ausgefuehrt.map((x) => `- ${x}`), ...b.zusatz.map((x) => `- Zusätzlich: ${x}`)].join('\n');
      const bemerkung = b.statusText ?? (b.status === 'abgeschlossen' ? undefined : STATUS_LABEL[b.status]);
      berichte.update(
        bericht.id,
        {
          taetigkeiten: taetigkeiten || bericht.taetigkeiten,
          bemerkung: [bericht.bemerkung, bemerkung].filter(Boolean).join('\n') || undefined,
          zeitIds: [...new Set([...bericht.zeitIds, ...(ergebnis.zeitId ? [ergebnis.zeitId] : [])])],
          materialIds: [...new Set([...bericht.materialIds, ...ergebnis.materialIds])],
        },
        { text: 'Aus dem Sprachbericht befüllt' },
      );
      ergebnis.berichtId = bericht.id;
      ergebnis.ziel = `/auftraege/berichte/${bericht.id}`;
    }

    // 5. Baustellendokumentation: der ganze Text als Notiz am Auftrag, verknüpft mit dem Bericht
    if (b.doku.trim()) {
      const d = db.dokumente.create({
        art: 'notiz',
        titel: `Baustellenbericht ${datumText(tag)}${auftrag ? ` · ${auftrag.titel}` : ''}`,
        text: b.doku.trim(),
        auftragId: auftrag?.id,
        bezug: ergebnis.berichtId ? { typ: 'berichte', id: ergebnis.berichtId } : { typ: 'termine', id: t.id },
        tags: ['Baustellenbericht'],
      });
      ergebnis.dokumentId = d.id;
    }

    // 6. Status: offen → Restarbeiten als Aufgabe, Problem → Hinweis an Chef und Büro
    if (plan.status === 'offen' && auftrag) {
      ergebnis.aufgabeId = db.aufgaben.create({
        titel: `Restarbeiten: ${auftrag.titel}`,
        notiz: b.statusText,
        auftragId: auftrag.id,
        erledigt: false,
        prioritaet: 'hoch',
        quelle: 'sprachbericht',
      }).id;
    }
    if (plan.status === 'problem') ergebnis.hinweisId = problemMelden(t.id, b.statusText ?? 'Beim Einsatz gab es ein Problem.');

    // 7. Zeitstrahl
    const zusammenfassung = zusammenfassen(plan);
    vermerken({ typ: 'termine', id: t.id }, VERMERK_ABSCHLUSS, zusammenfassung, { ergebnis });
    if (auftrag) vermerken({ typ: 'auftraege', id: auftrag.id }, VERMERK_ABSCHLUSS, zusammenfassung, { terminId: t.id, ergebnis });
  });

  // 8. Einsatz beenden (Stempeluhr, Terminstatus, Event `einsatz.beendet`) – außerhalb des Bündels, damit Automationen den neuen Stand sehen
  einsatzBeenden(t.id);
  return ergebnis;
}

export const STATUS_LABEL: Record<BerichtStatus, string> = { abgeschlossen: 'Abgeschlossen', offen: 'Noch offen', problem: 'Problem' };

/** Ein Satz für den Zeitstrahl */
export function zusammenfassen(plan: AbschlussPlan): string {
  const teile = [
    `Einsatz per Sprachbericht abgeschlossen (${STATUS_LABEL[plan.status]})`,
    `Zeit ${uhrAus(plan.zeit.start)}–${uhrAus(plan.zeit.ende)}`,
    plan.material.length ? `${plan.material.length === 1 ? '1 Material' : `${plan.material.length} Materialien`}` : null,
    plan.zusatz.length ? `${plan.zusatz.length === 1 ? '1 Zusatzarbeit' : `${plan.zusatz.length} Zusatzarbeiten`}` : null,
    plan.bericht.zeit ? zeitText(plan.bericht.zeit) : null,
  ];
  return teile.filter(Boolean).join(' · ');
}
