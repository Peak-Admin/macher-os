/**
 * Macher fragen – Fragen und Aufträge in Alltagssprache, beantwortet aus den echten Daten.
 *
 * Läuft vollständig über den Macher AI Gateway (`@core/gateway`): Dieses Modul meldet nur seine
 * Absichten (`ABSICHTEN`) und Aktionen (`AKTIONEN`) an. Heute erkennt Lane 0 (Regeln) alles ohne
 * Modell; Jev/Luna hängen sich später per `registriereModell()` an – gleicher Kontext, gleiche
 * Antwortform, gleiche Rechteprüfung. Ausführende Aktionen sind immer erst ein Entwurf, den der
 * Mensch bestätigt.
 */
import { db } from '@core/db';
import { AUFTRAGSNUMMER_IM_TEXT } from '@core/projektnummer';
import { datum, datumKurz, euro, personName, relativ, summen, tage as tageIn, uhrzeit, datumVon, plusTage, wochenStart, tageZwischen } from '@core/format';
import { offeneHinweise } from '@core/macher';
import { pfadZu, sucheUeberall, type Ton } from '@core/modul';
import type { Angebot, Bezug, Datum, ID, Phase, Rechnung, Termin } from '@core/objects';
import { frage as gatewayFrage, type AbsichtDef, type Plan, type AktionDef, type GatewayAntwort, type GatewayKontext, type Kanal, type OeffnenLink, type Vorgabe } from '@core/gateway';
import { zeitraumAus, type Zeitraum } from './zeit';
import { rechnungsVorschau } from '../rechnungen/logik';
import { AKTIONS_ABSICHTEN } from './aktionen';
import { MEHR_ABSICHTEN, auftragEintrag } from './absichten';
import { VORBEREITEN_ABSICHTEN } from './vorbereiten';
import { FRAGE, LAUFEND, findeAuftrag, findeKunde, findeMitarbeiter, gross, klein, planAntwort, schritte, stand, woerter } from './hilfen';

export { FRAGE, LAUFEND, findeAuftrag, findeKunde, findeMitarbeiter, gross, klein, planAntwort, schritte, stand };
import { abwesenheitAm, anwesenheit, arbeitstagIm, geplanteStunden, kontextAusDb as planKontextAusDb, verfuegbareStunden } from '../verfuegbarkeit/daten';

// ------------------------------------------------------------------ Schnittstelle

export type Kontext = GatewayKontext;

export interface AntwortEintrag {
  titel: string;
  untertitel?: string;
  /** interner Link zum Objekt (Quelle) */
  pfad?: string;
  status?: { ton: Ton; text: string };
}

export interface AufgabeEntwurf {
  titel: string;
  zustaendigId?: ID;
  faellig?: Datum;
  auftragId?: ID;
}

/** Ergebnis eines Planschritts, wie es im Verlauf stehen bleibt */
export interface PlanSchrittStand {
  id: string;
  label: string;
  status: 'ausgefuehrt' | 'fehler' | 'uebersprungen';
  text?: string;
  bezug?: Bezug;
  /** Verlaufseinträge (Audit) des Schritts – für „Rückgängig“ */
  eintraege?: ID[];
  /** Links, die der Mensch selbst öffnet (mailto: …) */
  oeffnen?: OeffnenLink[];
  /** gesetzt, wenn sich der Schritt nicht zurücknehmen lässt */
  endgueltig?: string;
}

export type Vorschlag =
  | { id: string; art: 'aufgabe'; label: string; entwurf: AufgabeEntwurf; status: 'entwurf' | 'ausgefuehrt' | 'verworfen'; ergebnisId?: ID }
  /** eine oder mehrere strukturierte Aktionen – erst nach Bestätigung über den Gateway ausgeführt */
  | { id: string; art: 'plan'; label: string; plan: Plan; status: 'entwurf' | 'ausgefuehrt' | 'verworfen' | 'zurueckgenommen'; ergebnisse?: PlanSchrittStand[] }
  | { id: string; art: 'oeffnen'; label: string; pfad: string };

export interface Antwort {
  /** kurze Antwort in 1–2 Sätzen */
  text: string;
  eintraege?: AntwortEintrag[];
  /** worauf die Antwort beruht – macht Quellen und Datenstand sichtbar */
  grundlage?: string;
  vorschlaege?: Vorschlag[];
  /** passende Anschlussfragen */
  folgefragen?: string[];
  /** erkannte Absicht (für Tests und spätere Auswertung) */
  absicht: string;
}

export const BEISPIELFRAGEN = [
  'Was steht morgen an?',
  'Welche Rechnungen sind offen?',
  'Wo ist Familie Hoffmann?',
  'Wer hat nächste Woche Zeit?',
  'Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag',
  'Was braucht mich gerade?',
  'Der Auftrag von Familie Hoffmann ist fertig',
  'Verschieb den Termin bei Familie Hoffmann auf Montag',
];

// ------------------------------------------------------------------ Hilfen

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const vid = () => Math.random().toString(36).slice(2, 10);

function rechnungOffen(r: Rechnung, ust: number) {
  const brutto = r.art === 'gutschrift' ? 0 : summen(r.positionen, ust).brutto;
  const bezahlt = db.zahlungen.where((z) => z.rechnungId === r.id).reduce((s, z) => s + z.betrag, 0);
  return Math.max(0, brutto - bezahlt);
}

function terminZeile(t: Termin, mitDatum: boolean): AntwortEintrag {
  const kunde = db.kunden.get(t.kundeId);
  const ort = db.orte.get(t.ortId);
  const leute = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)?.vorname).filter(Boolean).join(', ');
  const zeit = t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`;
  return {
    titel: `${mitDatum ? datumKurz(t.start) + ', ' : ''}${zeit} · ${t.titel || 'Termin'}`,
    untertitel: [kunde?.name, ort?.adresse ? `${ort.adresse.strasse}, ${ort.adresse.ort}` : undefined, leute].filter(Boolean).join(' · '),
    pfad: pfadZu({ typ: 'termine', id: t.id }) ?? (t.auftragId ? pfadZu({ typ: 'auftraege', id: t.auftragId }) : undefined),
    status: t.status === 'abgesagt' ? { ton: 'neutral', text: 'Abgesagt' } : t.art === 'besichtigung' ? { ton: 'aktiv', text: 'Besichtigung' } : undefined,
  };
}



const KEIN_GELD: Antwort = {
  absicht: 'keine-berechtigung',
  text: 'Du kannst diesen Bereich nicht sehen. Für Rechnungen und Beträge brauchst du die Freigabe „Preise & Geld“.',
  folgefragen: ['Was steht morgen an?', 'Was braucht mich gerade?'],
};

// ------------------------------------------------------------------ Absichten

function offeneRechnungen(k: Kontext): Antwort {
  if (!k.darf('geld')) return { ...KEIN_GELD };
  const ust = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  const offen = db.rechnungen
    .where((r) => r.status === 'versendet' || r.status === 'teilbezahlt')
    .map((r) => ({ r, betrag: rechnungOffen(r, ust) }))
    .filter((x) => x.betrag > 0)
    .sort((a, b) => a.r.faelligAm.localeCompare(b.r.faelligAm));
  const entwuerfe = db.rechnungen.where((r) => r.status === 'entwurf').length;
  const ueber = offen.filter((x) => x.r.faelligAm < k.heute);
  const summe = offen.reduce((s, x) => s + x.betrag, 0);
  const zusatz = entwuerfe ? ` Außerdem ${entwuerfe === 1 ? 'liegt 1 Rechnungsentwurf' : `liegen ${entwuerfe} Rechnungsentwürfe`} noch unversendet.` : '';
  if (!offen.length)
    return {
      absicht: 'rechnungen-offen',
      text: `Alle versendeten Rechnungen sind bezahlt.${zusatz}`,
      grundlage: `${anzahl(db.rechnungen.all().length, 'Rechnung', 'Rechnungen')} geprüft · ${stand(k)}`,
      folgefragen: ['Welche Angebote sind offen?'],
    };
  return {
    absicht: 'rechnungen-offen',
    text: `${anzahl(offen.length, 'Rechnung ist', 'Rechnungen sind')} offen, zusammen ${euro(summe)}.${ueber.length ? ` ${ueber.length === 1 ? '1 davon ist' : `${ueber.length} davon sind`} überfällig.` : ''}${zusatz}`,
    eintraege: offen.map(({ r, betrag }) => {
      const tage = tageZwischen(r.faelligAm, k.heute);
      return {
        titel: `${r.nummer} · ${db.kunden.get(r.kundeId)?.name ?? 'Kunde'}`,
        untertitel: `${euro(betrag)} offen · fällig ${relativ(r.faelligAm)}${r.mahnstufe ? ` · Mahnstufe ${r.mahnstufe}` : ''}`,
        pfad: pfadZu({ typ: 'rechnungen', id: r.id }),
        status: r.faelligAm < k.heute ? { ton: 'achtung', text: tage === 1 ? '1 Tag überfällig' : `${tage} Tage überfällig` } : { ton: 'aktiv', text: 'Offen' },
      };
    }),
    grundlage: `Rechnungen und Zahlungseingänge in Macher OS · ${stand(k)}`,
    folgefragen: ['Welche Angebote sind offen?', 'Was braucht mich gerade?'],
  };
}

function offeneAngebote(k: Kontext): Antwort {
  const geld = k.darf('geld');
  const ust = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  const liste = db.angebote.where((a) => a.status === 'versendet').sort((a, b) => (a.versendetAm ?? '').localeCompare(b.versendetAm ?? ''));
  const entwuerfe = db.angebote.where((a) => a.status === 'entwurf').length;
  if (!liste.length)
    return {
      absicht: 'angebote-offen',
      text: `Gerade wartet kein Angebot auf eine Antwort vom Kunden.${entwuerfe ? ` ${anzahl(entwuerfe, 'Entwurf ist', 'Entwürfe sind')} noch nicht versendet.` : ''}`,
      grundlage: stand(k),
    };
  return {
    absicht: 'angebote-offen',
    text: `${anzahl(liste.length, 'Angebot wartet', 'Angebote warten')} auf eine Antwort vom Kunden.${entwuerfe ? ` ${anzahl(entwuerfe, 'Entwurf ist', 'Entwürfe sind')} noch nicht versendet.` : ''}`,
    eintraege: liste.map((a) => ({
      titel: `${a.nummer} · ${db.kunden.get(a.kundeId)?.name ?? 'Kunde'}`,
      untertitel: [a.titel, geld ? euro(summen(a.positionen, ust, a.rabattProzent).netto) + ' netto' : undefined, a.versendetAm ? `versendet ${relativ(a.versendetAm)}` : undefined].filter(Boolean).join(' · '),
      pfad: pfadZu({ typ: 'angebote', id: a.id }),
      status: a.gueltigBis < k.heute ? { ton: 'achtung', text: 'Abgelaufen' } : { ton: 'aktiv', text: `gültig bis ${datum(a.gueltigBis)}` },
    })),
    grundlage: `Angebote in Macher OS · ${stand(k)}`,
    folgefragen: ['Welche Anfragen sind offen?'],
  };
}

function offeneAnfragen(k: Kontext): Antwort {
  const liste = db.auftraege.where((a) => a.phase === 'anfrage').sort((a, b) => Number(!!b.dringend) - Number(!!a.dringend) || a.erstelltAm.localeCompare(b.erstelltAm));
  if (!liste.length) return { absicht: 'anfragen-offen', text: 'Es liegt keine unbearbeitete Anfrage vor.', grundlage: stand(k) };
  return {
    absicht: 'anfragen-offen',
    text: `${anzahl(liste.length, 'Anfrage wartet', 'Anfragen warten')} auf Bearbeitung${liste.some((a) => a.dringend) ? ', mindestens eine ist dringend' : ''}.`,
    eintraege: liste.map((a) => ({
      titel: `${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? 'Kunde'}`,
      untertitel: [`eingegangen ${relativ(a.erstelltAm)}`, a.wunschtermin ? `Wunsch: ${a.wunschtermin}` : undefined].filter(Boolean).join(' · '),
      pfad: pfadZu({ typ: 'auftraege', id: a.id }),
      status: a.dringend ? { ton: 'gefahr', text: 'Dringend' } : undefined,
    })),
    grundlage: `Aufträge in Phase „Anfrage“ · ${stand(k)}`,
  };
}

function agenda(k: Kontext, z: Zeitraum, nurMeine: boolean): Antwort {
  const meine = (ids: ID[] | undefined) => !nurMeine || !k.ich || !!ids?.includes(k.ich.id);
  const termine = db.termine
    .where((t) => t.status !== 'abgesagt' && datumVon(t.start) >= z.von && datumVon(t.start) <= z.bis && meine(t.mitarbeiterIds))
    .sort((a, b) => a.start.localeCompare(b.start));
  const aufgaben = db.aufgaben.where((a) => !a.erledigt && !!a.faellig && a.faellig >= z.von && a.faellig <= z.bis && (!nurMeine || !k.ich || a.zustaendigId === k.ich.id));
  const wann = z.tag ? `${gross(z.label)} (${datumKurz(z.von)})` : `${gross(z.label)} (${datumKurz(z.von)} bis ${datumKurz(z.bis)})`;
  const fuer = nurMeine ? ' für dich' : '';
  if (!termine.length && !aufgaben.length)
    return {
      absicht: 'agenda',
      text: `${wann} ist${fuer} nichts geplant.`,
      grundlage: `Kalender und Aufgaben · ${stand(k)}`,
      folgefragen: ['Wer hat nächste Woche Zeit?', 'Welche Anfragen sind offen?'],
    };
  const teile = [termine.length ? anzahl(termine.length, 'Termin', 'Termine') : '', aufgaben.length ? anzahl(aufgaben.length, 'fällige Aufgabe', 'fällige Aufgaben') : ''].filter(Boolean);
  return {
    absicht: 'agenda',
    text: `${wann} ${termine.length + aufgaben.length === 1 ? 'steht' : 'stehen'}${fuer} ${teile.join(' und ')} an.`,
    eintraege: [
      ...termine.map((t) => terminZeile(t, !z.tag)),
      ...aufgaben.map((a) => ({
        titel: `Aufgabe: ${a.titel}`,
        untertitel: [a.zustaendigId ? personName(db.mitarbeiter.get(a.zustaendigId)) : 'noch niemand zuständig', `fällig ${relativ(a.faellig)}`].join(' · '),
        pfad: pfadZu({ typ: 'aufgaben', id: a.id }),
        status: a.prioritaet === 'hoch' ? ({ ton: 'achtung', text: 'Wichtig' } as const) : undefined,
      })),
    ],
    grundlage: `Kalender und Aufgaben${nurMeine ? ' (nur deine)' : ''} · ${stand(k)}`,
    folgefragen: z.label === 'morgen' ? ['Was steht übermorgen an?', 'Wer hat nächste Woche Zeit?'] : ['Was steht morgen an?'],
  };
}

const ABWESEND_LABEL: Record<string, string> = { urlaub: 'Urlaub', krank: 'krank', schule: 'Berufsschule', schulung: 'Schulung', frei: 'frei', sonstiges: 'abwesend' };

/** Freie Stunden je Mitarbeiter im Zeitraum – gerechnet von `verfuegbarkeit` (Arbeitstage, Feiertage, Abwesenheiten, Termine) */
export function verfuegbarkeit(z: { von: Datum; bis: Datum }) {
  const pk = planKontextAusDb();
  const tage = tageIn(z.von, z.bis).filter((d) => arbeitstagIm(pk, d));
  return pk.mitarbeiter
    .filter((m) => m.aktiv && !m.geloeschtAm && m.rolle !== 'buero')
    .map((m) => {
      const abwesend: { tag: Datum; art: string; beantragt: boolean; halbtags: boolean }[] = [];
      for (const d of tage) {
        const a = anwesenheit(m.id, d, pk);
        if (a.abwesenheit) abwesend.push({ tag: d, art: a.abwesenheit.art, beantragt: a.status === 'beantragt', halbtags: !!a.abwesenheit.halbtags });
      }
      const kapazitaet = verfuegbareStunden(m.id, z.von, z.bis, pk);
      const verplant = geplanteStunden(m.id, z.von, z.bis, pk);
      return { m, frei: Math.max(0, Math.round((kapazitaet - verplant) * 2) / 2), verplant: Math.round(verplant * 2) / 2, tage: tage.length, abwesend };
    })
    .sort((a, b) => b.frei - a.frei);
}

function werHatZeit(k: Kontext, z: Zeitraum): Antwort {
  const pk = planKontextAusDb();
  const werktage = tageIn(z.von, z.bis).filter((d) => arbeitstagIm(pk, d));
  if (!werktage.length)
    return { absicht: 'verfuegbarkeit', text: `${gross(z.label)} ist kein Arbeitstag. Frag z. B. nach „nächste Woche“.`, folgefragen: ['Wer hat nächste Woche Zeit?'] };
  const liste = verfuegbarkeit(z);
  const personal = k.darf('personal');
  const frei = liste.filter((x) => x.frei > 0);
  const zr = z.tag ? `${z.label} (${datumKurz(z.von)})` : `${z.label} (${datumKurz(z.von)} bis ${datumKurz(werktage[werktage.length - 1])})`;
  return {
    absicht: 'verfuegbarkeit',
    text: frei.length
      ? `${gross(zr)} haben ${anzahl(frei.length, 'Person', 'Personen')} noch Zeit. Am meisten frei: ${frei[0].m.vorname} mit ca. ${frei[0].frei.toLocaleString('de-DE')} Std.`
      : `${gross(zr)} ist niemand mehr frei – alle sind verplant oder abwesend.`,
    eintraege: liste.map((x) => {
      const ganzWeg = x.tage > 0 && x.abwesend.filter((a) => !a.beantragt && !a.halbtags).length === x.tage;
      const art = x.abwesend[0] ? (personal ? ABWESEND_LABEL[x.abwesend[0].art] ?? 'abwesend' : 'abwesend') : '';
      const beantragt = x.abwesend.some((a) => a.beantragt);
      return {
        titel: personName(x.m),
        untertitel: ganzWeg
          ? `nicht da (${art})`
          : [`ca. ${x.frei.toLocaleString('de-DE')} Std. frei`, `${x.verplant.toLocaleString('de-DE')} Std. verplant`, x.abwesend.length ? `${anzahl(x.abwesend.length, 'Tag', 'Tage')} ${beantragt ? `${art} beantragt` : art}` : undefined].filter(Boolean).join(' · '),
        pfad: pfadZu({ typ: 'mitarbeiter', id: x.m.id }),
        status: ganzWeg ? { ton: 'neutral', text: 'Abwesend' } : x.frei <= 0 ? { ton: 'achtung', text: 'Voll' } : beantragt ? { ton: 'aktiv', text: 'Urlaub beantragt' } : { ton: 'erfolg', text: 'Hat Zeit' },
      };
    }),
    grundlage: `Schätzung aus Wochenstunden, geplanten Terminen und Abwesenheiten · ${stand(k)}`,
    folgefragen: ['Welche Anfragen sind offen?', 'Was steht morgen an?'],
  };
}

function woIst(k: Kontext, frage: string): Antwort {
  const m = findeMitarbeiter(frage);
  const kunde = findeKunde(frage);
  if (m && (!kunde || frage.toLowerCase().includes(m.vorname.toLowerCase()))) {
    const heuteTermine = db.termine
      .where((t) => t.status !== 'abgesagt' && t.mitarbeiterIds.includes(m.id) && datumVon(t.start) === k.heute)
      .sort((a, b) => a.start.localeCompare(b.start));
    const jetzt = k.jetzt.toISOString();
    const laufend = heuteTermine.find((t) => t.start <= jetzt && t.ende >= jetzt);
    const naechster = heuteTermine.find((t) => t.start > jetzt);
    const ab = abwesenheitAm(m.id, k.heute, { abwesenheiten: db.abwesenheiten.all() }, { nurGenehmigt: true });
    const ortText = (t: Termin) => {
      const o = db.orte.get(t.ortId);
      const kd = db.kunden.get(t.kundeId);
      return [kd?.name, o?.adresse ? `${o.adresse.strasse}, ${o.adresse.ort}` : undefined].filter(Boolean).join(', ');
    };
    let text: string;
    if (ab) text = `${m.vorname} ist heute nicht da${k.darf('personal') ? ` (${ABWESEND_LABEL[ab.art] ?? 'abwesend'})` : ''}.`;
    else if (laufend) text = `${m.vorname} ist laut Plan gerade bei ${ortText(laufend) || laufend.titel} (bis ${uhrzeit(laufend.ende)} Uhr).`;
    else if (naechster) text = `${m.vorname} hat gerade keinen Termin. Als Nächstes um ${uhrzeit(naechster.start)} Uhr: ${ortText(naechster) || naechster.titel}.`;
    else if (heuteTermine.length) text = `${m.vorname} hat die Termine für heute hinter sich. Zuletzt: ${ortText(heuteTermine[heuteTermine.length - 1])}.`;
    else text = `Für ${m.vorname} ist heute kein Termin geplant.`;
    return {
      absicht: 'wo-mitarbeiter',
      text,
      eintraege: heuteTermine.map((t) => terminZeile(t, false)),
      grundlage: `Einsatzplan von heute, keine Ortung · ${stand(k)}`,
      vorschlaege: m.telefon ? [{ id: vid(), art: 'oeffnen', label: `${m.vorname} anrufen`, pfad: `tel:${m.telefon.replace(/[^\d+]/g, '')}` }] : undefined,
      folgefragen: [`Was steht morgen an?`],
    };
  }
  if (kunde) {
    const orte = db.orte.where((o) => o.kundeId === kunde.id);
    const naechste = db.termine
      .where((t) => t.kundeId === kunde.id && t.status !== 'abgesagt' && datumVon(t.start) >= k.heute)
      .sort((a, b) => a.start.localeCompare(b.start))[0];
    const adr = kunde.adresse ? `${kunde.adresse.strasse}, ${kunde.adresse.plz} ${kunde.adresse.ort}` : undefined;
    return {
      absicht: 'wo-kunde',
      text: adr ? `${kunde.name}: ${adr}.${naechste ? ` Nächster Termin ${relativ(naechste.start)} um ${uhrzeit(naechste.start)} Uhr.` : ''}` : `Für ${kunde.name} ist keine Adresse hinterlegt.`,
      eintraege: [
        { titel: kunde.name, untertitel: [adr, kunde.telefon].filter(Boolean).join(' · '), pfad: pfadZu({ typ: 'kunden', id: kunde.id }) },
        ...orte.map((o) => ({
          titel: o.bezeichnung,
          untertitel: [`${o.adresse.strasse}, ${o.adresse.plz} ${o.adresse.ort}`, o.hinweise].filter(Boolean).join(' · '),
          pfad: pfadZu({ typ: 'orte', id: o.id }),
        })),
        ...(naechste ? [terminZeile(naechste, true)] : []),
      ],
      grundlage: `Kundenakte · ${stand(k)}`,
      vorschlaege: [
        ...(adr ? [{ id: vid(), art: 'oeffnen' as const, label: 'Route öffnen', pfad: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adr)}` }] : []),
        ...(kunde.telefon ? [{ id: vid(), art: 'oeffnen' as const, label: 'Anrufen', pfad: `tel:${kunde.telefon.replace(/[^\d+]/g, '')}` }] : []),
      ],
    };
  }
  return {
    absicht: 'wo-unbekannt',
    text: 'Ich habe niemanden mit diesem Namen gefunden. Nenn mir den Namen eines Kunden oder Kollegen, z. B. „Wo ist Familie Hoffmann?“.',
    folgefragen: BEISPIELFRAGEN.slice(2, 3),
  };
}

function brauchtMich(k: Kontext): Antwort {
  const liste = offeneHinweise(k.ich ? { rolle: k.ich.rolle, mitarbeiterId: k.ich.id } : undefined).slice(0, 6);
  if (!liste.length) return { absicht: 'braucht-mich', text: 'Gerade braucht dich nichts. Macher meldet sich, sobald eine Entscheidung ansteht.', grundlage: stand(k) };
  return {
    absicht: 'braucht-mich',
    text: `${anzahl(liste.length, 'Punkt braucht', 'Punkte brauchen')} dich. Das Wichtigste zuerst:`,
    eintraege: liste.map((h) => ({
      titel: h.titel,
      untertitel: h.text,
      pfad: h.pfad ?? pfadZu(h.bezug),
      status: h.art === 'problem' ? { ton: 'achtung', text: 'Problem' } : h.art === 'freigabe' ? { ton: 'aktiv', text: 'Freigabe' } : h.art === 'entscheidung' ? { ton: 'aktiv', text: 'Entscheidung' } : { ton: 'neutral', text: 'Info' },
    })),
    grundlage: `Hinweise aus allen Bereichen, nach Wichtigkeit sortiert · ${stand(k)}`,
    vorschlaege: [{ id: vid(), art: 'oeffnen', label: 'Alle Hinweise öffnen', pfad: '/macher/hinweise' }],
  };
}

function meineAufgaben(k: Kontext): Antwort {
  const liste = db.aufgaben
    .where((a) => !a.erledigt && (!k.ich || a.zustaendigId === k.ich.id))
    .sort((a, b) => (a.faellig ?? '9999').localeCompare(b.faellig ?? '9999'));
  if (!liste.length) return { absicht: 'aufgaben', text: 'Du hast keine offenen Aufgaben.', grundlage: stand(k) };
  return {
    absicht: 'aufgaben',
    text: `Du hast ${anzahl(liste.length, 'offene Aufgabe', 'offene Aufgaben')}.`,
    eintraege: liste.slice(0, 10).map((a) => ({
      titel: a.titel,
      untertitel: [a.faellig ? `fällig ${relativ(a.faellig)}` : 'ohne Frist', a.auftragId ? db.auftraege.get(a.auftragId)?.titel : undefined].filter(Boolean).join(' · '),
      pfad: pfadZu({ typ: 'aufgaben', id: a.id }) ?? (a.auftragId ? pfadZu({ typ: 'auftraege', id: a.auftragId }) : undefined),
      status: a.faellig && a.faellig < k.heute ? { ton: 'achtung', text: 'Überfällig' } : undefined,
    })),
    grundlage: `Aufgaben · ${stand(k)}`,
  };
}

/** „Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag“ → Entwurf */
export function aufgabeAusText(frage: string, heute: Datum): AufgabeEntwurf {
  const m = findeMitarbeiter(frage.split(':')[0]) ?? findeMitarbeiter(frage);
  let rest = frage.includes(':') ? frage.slice(frage.indexOf(':') + 1) : frage.replace(/^.*?\baufgabe\b/i, '');
  // „bis Freitag“ / „bis morgen“ / „bis 12.10.“ herauslösen
  let faellig: Datum | undefined;
  // von hinten suchen, damit „Leiter am Lager prüfen bis Freitag“ den Titel behält
  const marken = [...rest.matchAll(/(^|\s)(bis|am|fällig|spätestens)\s+/gi)].reverse();
  for (const mk of marken) {
    const z = zeitraumAus(rest.slice(mk.index! + mk[0].length), heute);
    if (z) {
      faellig = z.bis;
      rest = rest.slice(0, mk.index);
      break;
    }
  }
  if (!faellig) faellig = zeitraumAus(rest, heute)?.bis;
  if (!frage.includes(':')) {
    rest = rest.replace(/\bfür\s+\S+(\s+\S+)?\s+an\b/i, '').replace(/\bfür\s+\S+/i, '').replace(/\ban\b\s*$/i, '');
  }
  const titel = gross(rest.replace(/^[\s,:-]+|[\s,.!?]+$/g, '').replace(/\s+/g, ' '));
  const nr = frage.match(AUFTRAGSNUMMER_IM_TEXT);
  const auftrag = nr ? db.auftraege.where((a) => a.nummer.toLowerCase() === nr[0].toLowerCase())[0] : undefined;
  return { titel, zustaendigId: m?.id, faellig, auftragId: auftrag?.id };
}

const TRENNBAR = ['an', 'ab', 'auf', 'aus', 'bei', 'ein', 'mit', 'nach', 'vor', 'zu', 'zurück', 'weg', 'durch', 'um', 'los', 'fest', 'rein', 'raus'];

/** „…, Familie Hartmann anzurufen“ → „Familie Hartmann anrufen“ (zu-Infinitiv in Grundform) */
function grundform(satz: string): string {
  return satz
    .replace(/\bzu\s+(\S+)$/i, '$1')
    .replace(/(\S+)$/, (w) => {
      const m = w.match(/^(.+?)zu(.{3,})$/i);
      return m && TRENNBAR.includes(m[1].toLowerCase()) ? m[1] + m[2] : w;
    });
}

/** „Erinnere mich morgen daran, Familie Hartmann anzurufen“ → Aufgabe für mich, fällig morgen */
export function erinnerungAusText(frage: string, heute: Datum, ichId?: ID): AufgabeEntwurf {
  const kopf = frage.match(/^\s*erinnere?n?\s+(\S+)/i);
  const wen = kopf && !/^(mich|uns)$/i.test(kopf[1]) ? findeMitarbeiter(kopf[1]) : undefined;
  const faellig = zeitraumAus(frage, heute)?.bis;
  let rest = frage.replace(/^\s*erinnere?n?\s+\S+\s*/i, '');
  const i = rest.search(/\b(daran|dran)\b[,:]?\s*(,?\s*dass\s+)?/i);
  if (i >= 0) rest = rest.slice(i).replace(/^(daran|dran)[,:]?\s*(dass\s+)?/i, '');
  else rest = rest.replace(/^(heute|morgen|übermorgen|am\s+\S+|nächste\s+woche)\s+/i, '').replace(/^an\s+/i, '');
  const titel = gross(grundform(rest.replace(/[\s,.!?]+$/g, '').replace(/\s+(bitte)$/i, '')).trim());
  return { titel, zustaendigId: wen?.id ?? ichId, faellig: faellig ?? heute };
}

function aufgabeAnlegen(k: Kontext, frage: string, erinnerung = false): Antwort {
  if (!k.darf('schreiben'))
    return { absicht: 'keine-berechtigung', text: 'Du kannst Aufgaben ansehen. Zum Anlegen brauchst du die entsprechende Freigabe.' };
  const e = erinnerung ? erinnerungAusText(frage, k.heute, k.ich?.id) : aufgabeAusText(frage, k.heute);
  if (!e.titel)
    return {
      absicht: 'aufgabe-unklar',
      text: 'Was soll erledigt werden? Schreib es so: „Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag“.',
      folgefragen: ['Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag'],
    };
  const wer = e.zustaendigId ? db.mitarbeiter.get(e.zustaendigId) : undefined;
  return {
    absicht: 'aufgabe-entwurf',
    text: `Ich habe einen Entwurf vorbereitet. Prüfe ihn und lege die Aufgabe dann an${wer ? (wer.id === k.ich?.id ? ' – sie landet bei dir' : ` – ${wer.vorname} bekommt sie direkt`) : ''}.`,
    vorschlaege: [{ id: vid(), art: 'aufgabe', label: 'Aufgabe anlegen', entwurf: e, status: 'entwurf' }],
  };
}

function suchen(k: Kontext, frage: string): Antwort {
  const begriffe = woerter(frage)
    .filter((w) => !['wo', 'was', 'wer', 'wie', 'ist', 'sind', 'zeig', 'zeige', 'mir', 'finde', 'such', 'suche', 'gibt', 'es', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'zu', 'zum', 'zur', 'mit', 'ich', 'du', 'bitte', 'über', 'von', 'nach', 'macher', 'hat', 'haben', 'wir', 'unser', 'unsere'].includes(w))
    .join(' ');
  const gesehen = new Set<string>();
  const treffer = begriffe
    ? sucheUeberall(begriffe).filter((t) => (gesehen.has(t.pfad) ? false : (gesehen.add(t.pfad), true)))
    : [];
  if (treffer.length)
    return {
      absicht: 'suche',
      text: `Dazu habe ich ${anzahl(treffer.length, 'Treffer', 'Treffer')} gefunden:`,
      eintraege: treffer.slice(0, 8).map((t) => ({ titel: t.titel, untertitel: [t.typ, t.untertitel].filter(Boolean).join(' · '), pfad: t.pfad })),
      grundlage: `Suche über alle Bereiche nach „${begriffe}“ · ${stand(k)}`,
    };
  return {
    absicht: 'unbekannt',
    text: 'Das kann ich noch nicht beantworten. Ich kenne Termine, Aufgaben, Rechnungen, Angebote, Anfragen, Kunden und dein Team. Probier zum Beispiel:',
    folgefragen: BEISPIELFRAGEN.slice(0, 4),
  };
}

// ------------------------------------------------------------------ Aktionen vorbereiten (Pläne)

const ZAHLWORT: Record<string, number> = { ein: 1, eine: 1, einer: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, anderthalb: 1.5, eineinhalb: 1.5 };

/** „zwei Stunden“, „1,5 Std.“, „eine halbe Stunde“, „45 Minuten“ → Minuten */
export function dauerAus(text: string): number | undefined {
  const t = klein(text);
  if (/\bhalbe?n?\s+stunde\b/.test(t)) return 30;
  const std = t.match(/(\d+(?:[.,]\d+)?|ein|eine|einer|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|anderthalb|eineinhalb)\s*(stunden?|std\.?|h)(?=\s|$|[.,!?])/);
  if (std) {
    const n = ZAHLWORT[std[1]] ?? Number(std[1].replace(',', '.'));
    return n > 0 ? Math.round(n * 60) : undefined;
  }
  const min = t.match(/(\d+)\s*(minuten|min\.?)(?=\s|$|[.,!?])/);
  return min ? Number(min[1]) : undefined;
}

/** „… zwei Stunden Nacharbeit auf das Projekt“ → „Nacharbeit“ */
function taetigkeitAus(text: string): string | undefined {
  const m = text.match(/(?:stunden?|std\.?|minuten|min\.?)\s+(.+?)(?:\s+(?:auf|für|bei|beim|zum|zur|im|ins|in)\b.*)?[\s.!?]*$/i);
  const w = m?.[1]?.trim();
  return w && !/^(auf|für|bei|noch|bitte|drauf)$/i.test(w) ? gross(w) : undefined;
}

/** „Der Müller-Auftrag ist fertig.“ → Arbeiten fertig melden, Rechnung vorbereiten, Plan freigeben, Bewertung anfragen */
function auftragFertig(k: Kontext, frage: string): Antwort {
  const a = findeAuftrag(frage);
  if (!a)
    return {
      absicht: 'auftrag-unklar',
      text: 'Welcher Auftrag ist fertig? Nenn mir den Kunden oder die Auftragsnummer, z. B. „Der Auftrag von Familie Hoffmann ist fertig“.',
    };
  const kunde = db.kunden.get(a.kundeId);
  const daten = { auftragId: a.id };
  const plan: Plan = {
    titel: `Auftrag ${a.nummer} abschließen`,
    schritte: schritte([
      { aktion: 'job.complete', absicht: 'job.finish', daten, label: 'Arbeiten als fertig melden (weiter zur Abnahme)' },
      ...(k.darf('geld') ? [{ aktion: 'invoice.create_draft', absicht: 'job.finish', daten, label: 'Rechnung vorbereiten (nur Entwurf)' }] : []),
      { aktion: 'job.release_plan', absicht: 'job.finish', daten, label: 'Weitere Einsätze aus dem Plan nehmen' },
      { aktion: 'review.request', absicht: 'job.finish', daten, label: 'Bewertung beim Kunden anfragen' },
    ]),
  };
  return planAntwort(
    'auftrag-fertig',
    `${a.titel} bei ${kunde?.name ?? 'Kunde'}: Ich habe vorbereitet, was jetzt ansteht. Wähl aus, was passieren soll – erst nach deiner Bestätigung führt Macher es aus.`,
    plan,
    `Auftrag ${a.nummer}, Phase „${PHASE_LABEL[a.phase] ?? a.phase}“ · ${stand(k)}`,
  );
}

const PHASE_LABEL: Partial<Record<Phase, string>> = { anfrage: 'Anfrage', besichtigung: 'Besichtigung', angebot: 'Angebot', beauftragt: 'Beauftragt', in_arbeit: 'In Arbeit', abnahme: 'Abnahme', abrechnung: 'Abrechnung' };

/** „Schreib bei Müller noch zwei Stunden Nacharbeit auf das Projekt.“ */
function zeitErfassen(k: Kontext, frage: string): Antwort {
  const minuten = dauerAus(frage);
  if (!minuten) return { absicht: 'zeit-unklar', text: 'Wie lange? Schreib es so: „Schreib bei Hoffmann zwei Stunden Nacharbeit auf“.' };
  const fuer = frage.match(/\bfür\s+(\S+)/i);
  const wer = (fuer ? findeMitarbeiter(fuer[1]) : undefined) ?? k.ich;
  const a = findeAuftrag(frage, ['in_arbeit', 'beauftragt', 'abnahme', 'abrechnung']);
  const datum = zeitraumAus(frage, k.heute)?.von ?? k.heute;
  const notiz = taetigkeitAus(frage);
  const dauer = minuten % 60 ? `${(minuten / 60).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Std.` : `${minuten / 60} Std.`;
  const plan: Plan = {
    titel: 'Zeit erfassen',
    schritte: schritte([
      {
        aktion: 'time.track',
        absicht: 'time.track',
        daten: { mitarbeiterId: wer?.id ?? '', auftragId: a?.id, datum, minuten, notiz },
        label: `${dauer}${notiz ? ` ${notiz}` : ''} für ${wer?.vorname ?? 'dich'}${a ? ` auf ${a.nummer}` : ''} erfassen (${datumKurz(datum)})`,
      },
    ]),
  };
  return planAntwort(
    'zeit-entwurf',
    a ? `Ich buche die Zeit auf ${a.titel} bei ${db.kunden.get(a.kundeId)?.name ?? 'Kunde'}. Prüf kurz und bestätige.` : 'Ich habe keinen laufenden Auftrag dazu gefunden. Die Zeit wird ohne Auftrag erfasst – oder nenn mir den Kunden.',
    plan,
    stand(k),
  );
}

/** „Schick das Angebot an Familie Hoffmann.“ */
function angebotSenden(k: Kontext, frage: string): Antwort {
  const kunde = findeKunde(frage);
  const nr = frage.match(/\bAN-\d{4}-\d{3,4}\b/i);
  const offen = (x: Angebot) => x.status === 'entwurf' || x.status === 'versendet';
  const angebot: Angebot | undefined = nr
    ? db.angebote.where((x) => x.nummer.toLowerCase() === nr[0].toLowerCase())[0]
    : kunde
      ? db.angebote.where((x) => x.kundeId === kunde.id && offen(x)).sort((x, y) => Number(y.status === 'entwurf') - Number(x.status === 'entwurf') || y.geaendertAm.localeCompare(x.geaendertAm))[0]
      : undefined;
  if (!angebot) return { absicht: 'angebot-unklar', text: 'Welches Angebot soll raus? Nenn mir den Kunden oder die Angebotsnummer.', folgefragen: ['Welche Angebote sind offen?'] };
  const empf = db.kunden.get(angebot.kundeId);
  const ziel = empf?.email || empf?.telefon;
  const plan: Plan = {
    titel: `Angebot ${angebot.nummer} senden`,
    schritte: schritte([{ aktion: 'offer.send', absicht: 'offer.send', daten: { angebotId: angebot.id }, label: `Angebot ${angebot.nummer} an ${ziel ?? empf?.name ?? 'Kunde'} senden` }]),
  };
  return planAntwort(
    'angebot-senden',
    `${angebot.titel} für ${empf?.name ?? 'Kunde'}${angebot.status === 'versendet' ? ' (wurde schon einmal versendet)' : ''}. Das Angebot geht an den Kunden – erst nach deiner Bestätigung.`,
    plan,
    `Angebot ${angebot.nummer} · ${stand(k)}`,
  );
}

/** „Mach aus dem Auftrag von Schneider schon mal eine Rechnung.“ */
function rechnungVorbereiten(k: Kontext, frage: string): Antwort {
  const a = findeAuftrag(frage, ['abrechnung', 'abnahme', 'in_arbeit', 'beauftragt']);
  if (!a) {
    const kunde = findeKunde(frage);
    const frueh = kunde && findeAuftrag(frage, ['angebot', 'besichtigung', 'anfrage']);
    if (frueh) return { absicht: 'rechnung-zu-frueh', text: `${frueh.titel} (${frueh.nummer}) ist erst im Schritt „${PHASE_LABEL[frueh.phase] ?? frueh.phase}“. Es gibt noch nichts abzurechnen.`, eintraege: [auftragEintrag(frueh)] };
    return { absicht: 'auftrag-unklar', text: kunde ? `Bei ${kunde.name} gibt es keinen offenen Auftrag zum Abrechnen.` : 'Für welchen Auftrag? Nenn mir den Kunden oder die Auftragsnummer, z. B. „Mach Müller die Rechnung fertig“.' };
  }
  const kunde = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
  // Liegt schon ein Entwurf? Dann keinen zweiten anlegen – prüfen und versenden.
  const entwurf = db.rechnungen.where((r) => r.auftragId === a.id && r.status === 'entwurf')[0];
  if (entwurf)
    return {
      absicht: 'rechnung-entwurf-da',
      text: `Für ${kunde} liegt schon ein Rechnungsentwurf. Prüf ihn und versende ihn dann.`,
      eintraege: [{ titel: `Rechnungsentwurf · ${entwurf.titel}`, untertitel: `${euro(summen(entwurf.positionen, db.betrieb.get('betrieb')?.ustSatz ?? 19).netto)} netto`, pfad: pfadZu({ typ: 'rechnungen', id: entwurf.id }), status: { ton: 'aktiv', text: 'Entwurf' } }],
      folgefragen: [`Schick die Rechnung an ${kunde}`],
    };
  const plan: Plan = {
    titel: `Rechnung für ${a.nummer} vorbereiten`,
    schritte: schritte([{ aktion: 'invoice.create_draft', absicht: 'invoice.create_draft', daten: { auftragId: a.id }, label: `Rechnungsentwurf für ${a.nummer} vorbereiten` }]),
  };
  // Vorschau: was in den Entwurf kommt (Positionen, Summe, Hinweise zum Prüfen)
  const v = rechnungsVorschau(a.id);
  const netto = summen(v.positionen, db.betrieb.get('betrieb')?.ustSatz ?? 19).netto;
  return {
    ...planAntwort(
      'rechnung-entwurf',
      `${a.titel} bei ${kunde}: Macher übernimmt Leistungen, Material und Zeiten in einen Entwurf. Versendet wird nichts.`,
      plan,
      `Auftrag ${a.nummer} · ${stand(k)}`,
    ),
    eintraege: [
      auftragEintrag(a),
      { titel: `${anzahl(v.positionen.length, 'Position', 'Positionen')} · ${euro(netto)} netto`, untertitel: v.quellen.join(' · ') || undefined },
      ...v.hinweise.map((h): AntwortEintrag => ({ titel: h, status: { ton: 'achtung', text: 'Prüfen' } })),
    ],
  };
}



// ------------------------------------------------------------------ Absichten für den Gateway (Lane 0: Regeln)

type Def = AbsichtDef<Antwort>;
const nurMeineRolle = (k: Kontext) => !!k.ich && (k.ich.rolle === 'monteur' || k.ich.rolle === 'azubi');
const naechsteWoche = (k: Kontext): Zeitraum => ({ von: plusTage(wochenStart(k.heute), 7), bis: plusTage(wochenStart(k.heute), 11), label: 'nächste Woche', tag: false });

/**
 * Was Macher versteht – in der Reihenfolge der Prüfung. Alle Absichten laufen über `@core/gateway`:
 * Regeln vor Modell, Rechte vor Antwort, Aktionen nur als Entwurf.
 */
export const ABSICHTEN: Def[] = [
  {
    id: 'task.create',
    titel: 'Aufgabe anlegen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => /\baufgabe\b/.test(klein(t)) && /\b(leg|lege|erstell|erstelle|anlegen|neue|mach|notier|notiere)\b/.test(klein(t)),
    beantworte: (t, _e, k) => aufgabeAnlegen(k, t),
  },
  // Was fehlt, einplanen, Material bestellen, an Rechnungen erinnern – vor „Erinnerung anlegen“ und den Fragen
  ...MEHR_ABSICHTEN,
  {
    id: 'reminder.create',
    titel: 'Erinnerung anlegen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => /^erinnere?n?\s/.test(klein(t.trim())),
    beantworte: (t, _e, k) => aufgabeAnlegen(k, t, true),
  },
  // Aktionen in anderen Modulen (Senden, Verschieben, Kunden schreiben …) – vor den Fragen geprüft
  ...AKTIONS_ABSICHTEN,
  // „Mit Macher vorbereiten“ am Objekt – nur mit Vorgabe (Absicht + Objekt), ohne Texterkennung
  ...VORBEREITEN_ABSICHTEN,
  {
    id: 'job.finish',
    titel: 'Auftrag fertig melden (mehrere Schritte)',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => !FRAGE.test(klein(t)) && /(auftrag|baustelle|arbeiten|projekt)/.test(klein(t)) && /\b(fertig|abgeschlossen|abschließen|abschliessen)\b/.test(klein(t)),
    beantworte: (t, _e, k) => auftragFertig(k, t),
  },
  {
    id: 'time.track',
    titel: 'Zeit erfassen',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => !!dauerAus(t) && /\b(schreib|schreibe|buch|buche|trag|trage|erfass|erfasse|notier|notiere|auf)\b/.test(klein(t)),
    beantworte: (t, _e, k) => zeitErfassen(k, t),
  },
  {
    id: 'offer.send',
    titel: 'Angebot senden',
    risiko: 'kritisch',
    rechte: ['veroeffentlichen'],
    erkenne: (t) => !FRAGE.test(klein(t)) && /angebot/.test(klein(t)) && /\b(schick|schicke|send|sende|senden|versende|versenden|raus)\b/.test(klein(t)),
    beantworte: (t, _e, k) => angebotSenden(k, t),
  },
  {
    id: 'invoice.create_draft',
    titel: 'Rechnung vorbereiten',
    risiko: 'schreiben',
    rechte: ['schreiben', 'geld'],
    erkenne: (t) => !FRAGE.test(klein(t)) && /rechnung/.test(klein(t)) && /\b(mach|mache|erstell|erstelle|schreib|schreibe|vorbereiten|bereite|anlegen|leg)\b/.test(klein(t)),
    beantworte: (t, _e, k) => rechnungVorbereiten(k, t),
  },
  {
    id: 'invoice.list',
    titel: 'Offene Rechnungen zeigen',
    risiko: 'lesen',
    rechte: ['geld'],
    erkenne: (t) => /rechnung/.test(klein(t)) && /(offen|überfällig|ueberfaellig|unbezahlt|ausstehend|bezahlt|zahlt|schuld|geld)/.test(klein(t)),
    beantworte: (_t, _e, k) => offeneRechnungen(k),
  },
  {
    id: 'employee.availability',
    titel: 'Freie Kapazität im Team zeigen',
    risiko: 'lesen',
    erkenne: (t) => /\bwer\b.*\b(zeit|frei|verfügbar|kapazität|luft)\b/.test(klein(t)) || /\b(freie kapazität|wer ist frei)\b/.test(klein(t)),
    beantworte: (t, _e, k) => werHatZeit(k, zeitraumAus(klein(t), k.heute) ?? naechsteWoche(k)),
  },
  {
    id: 'location.find',
    titel: 'Kunde oder Kollege finden',
    risiko: 'lesen',
    erkenne: (t) => /^wo\b|\bwo (ist|sind|wohnt|steckt|arbeitet)\b|\badresse\b/.test(klein(t)),
    beantworte: (t, _e, k) => woIst(k, t),
  },
  {
    id: 'offer.list',
    titel: 'Offene Angebote zeigen',
    risiko: 'lesen',
    erkenne: (t) => /angebot/.test(klein(t)) && /(offen|warten|ausstehend|antwort|versendet|stand)/.test(klein(t)),
    beantworte: (_t, _e, k) => offeneAngebote(k),
  },
  {
    id: 'request.list',
    titel: 'Offene Anfragen zeigen',
    risiko: 'lesen',
    erkenne: (t) => /anfrage/.test(klein(t)),
    beantworte: (_t, _e, k) => offeneAnfragen(k),
  },
  {
    id: 'attention.list',
    titel: 'Zeigen, was dich braucht',
    risiko: 'lesen',
    erkenne: (t) => /(braucht mich|brauchst du|was ist wichtig|was muss ich|hinweis|freigabe|entscheid)/.test(klein(t)),
    beantworte: (_t, _e, k) => brauchtMich(k),
  },
  {
    id: 'task.list',
    titel: 'Meine Aufgaben zeigen',
    risiko: 'lesen',
    erkenne: (t) => /(meine aufgaben|was ist zu tun|was hab ich zu tun|was habe ich zu tun|offene aufgaben)/.test(klein(t)),
    beantworte: (_t, _e, k) => meineAufgaben(k),
  },
  {
    id: 'appointment.list',
    titel: 'Termine und Einsätze zeigen',
    risiko: 'lesen',
    erkenne: (t, k) => {
      const f = klein(t);
      return (!!zeitraumAus(f, k.heute) && /(steht|an\b|termin|plan|geplant|los|einsatz|einsätze|was ist|was hab|was habe|was gibt)/.test(f)) || /\b(termine?|einsätze|plan)\b/.test(f);
    },
    beantworte: (t, _e, k) => {
      const f = klein(t);
      const z = zeitraumAus(f, k.heute);
      if (z && /(steht|an\b|termin|plan|geplant|los|einsatz|einsätze|was ist|was hab|was habe|was gibt)/.test(f))
        return agenda(k, z, /\b(ich|mich|mir|meine?n?)\b/.test(f) || nurMeineRolle(k));
      return agenda(k, { von: k.heute, bis: k.heute, label: 'heute', tag: true }, nurMeineRolle(k));
    },
  },
  {
    id: 'help',
    titel: 'Hilfe',
    risiko: 'lesen',
    erkenne: (t) => /(hilfe|was kannst du|wie funktioniert)/.test(klein(t)),
    beantworte: () => ({ absicht: 'hilfe', text: 'Ich beantworte Fragen aus deinen Daten und bereite Aufgaben vor. Ausgeführt wird erst, wenn du bestätigst.', folgefragen: BEISPIELFRAGEN }),
  },
  {
    id: 'search',
    titel: 'In allen Bereichen suchen',
    risiko: 'lesen',
    rang: 100,
    auffang: true,
    beantworte: (t, _e, k) => suchen(k, t),
  },
];

/** Antwort, wenn der Gateway ablehnt – gleiche Form wie jede andere Antwort */
export function abgelehnt(g: Pick<GatewayAntwort, 'verweigert' | 'fehlendeRechte'>): Antwort {
  if (g.verweigert === 'rechte') {
    if (g.fehlendeRechte?.includes('geld')) return { ...KEIN_GELD };
    if (g.fehlendeRechte?.includes('veroeffentlichen'))
      return { absicht: 'keine-berechtigung', text: 'An Kunden senden darfst du nicht. Dafür brauchst du die Freigabe „An Kunden senden“.' };
    if (g.fehlendeRechte?.includes('schreiben'))
      return { absicht: 'keine-berechtigung', text: 'Du kannst Aufgaben ansehen. Zum Anlegen brauchst du die entsprechende Freigabe.' };
    return { absicht: 'keine-berechtigung', text: 'Dafür fehlt dir die Berechtigung. Frag deinen Chef nach der Freigabe.' };
  }
  return { absicht: 'unbekannt', text: 'Das kann ich noch nicht beantworten. Probier zum Beispiel:', folgefragen: BEISPIELFRAGEN.slice(0, 4) };
}

const LEER: Antwort = { absicht: 'leer', text: 'Stell mir eine Frage zu deinem Betrieb.', folgefragen: BEISPIELFRAGEN };

/** Lane 0 ohne Protokoll: erkennt die Absicht per Regel und beantwortet sie direkt aus den Daten (Tests, Vorschau). */
export function beantworte(frage: string, k: Kontext): Antwort {
  if (!frage.trim()) return LEER;
  const def = ABSICHTEN.find((a) => a.erkenne?.(frage, k)) ?? ABSICHTEN.find((a) => a.auffang)!;
  if ((def.rechte ?? []).some((r) => !k.darf(r))) return abgelehnt({ verweigert: 'rechte', fehlendeRechte: (def.rechte ?? []).filter((r) => !k.darf(r)) });
  return def.beantworte(frage, { absicht: def.id, sicherheit: 1, lane: 0 }, k, {});
}

/**
 * Vermutete Absicht vor der Antwort (nur Regeln, ohne Protokoll) – damit der Orb schon beim Fragen den passenden
 * Zustand zeigt („Macher sucht …“, „Macher schreibt …“).
 */
export function vermuteteAbsicht(text: string, k: Kontext): string | undefined {
  if (!text.trim()) return undefined;
  return ABSICHTEN.find((a) => a.erkenne?.(text, k))?.id;
}

/** Der Weg für die Oberfläche: Text oder Sprache → Gateway → Antwort (protokolliert). Mit `vorgabe` aus „Mit Macher vorbereiten“. */
export async function fragen(text: string, k: Kontext, kanal: Kanal = 'text', vorgabe?: Vorgabe): Promise<{ antwort: Antwort; modell: string }> {
  if (!text.trim()) return { antwort: LEER, modell: 'Regeln' };
  const g = await gatewayFrage<Antwort>(text, { ...k, kanal }, vorgabe);
  return { antwort: g.ergebnis ?? abgelehnt(g), modell: g.modell };
}

// ------------------------------------------------------------------ Ausführen (erst nach Bestätigung)

export const AKTIONEN: AktionDef<AufgabeEntwurf>[] = [
  {
    id: 'task.create',
    titel: 'Aufgabe angelegt',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    pruefe: (e) => (e.titel.trim() ? undefined : 'Trage ein, was erledigt werden soll.'),
    fuehreAus: (e, k) => ({ bezug: { typ: 'aufgaben', id: aufgabeAusEntwurf(e, k).id } }),
  },
];

export function aufgabeAusEntwurf(e: AufgabeEntwurf, k: Pick<Kontext, 'darf'>) {
  if (!k.darf('schreiben')) throw new Error('Keine Berechtigung');
  if (!e.titel.trim()) throw new Error('Titel fehlt');
  return db.aufgaben.create({
    titel: e.titel.trim(),
    zustaendigId: e.zustaendigId || undefined,
    faellig: e.faellig || undefined,
    auftragId: e.auftragId || undefined,
    erledigt: false,
    prioritaet: 'normal',
    quelle: 'macher',
  });
}

