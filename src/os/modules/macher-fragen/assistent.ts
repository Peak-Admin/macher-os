/**
 * Macher fragen – lokaler, regelbasierter Assistent über die echten Daten.
 *
 * Kein API-Key, kein externes Modell. Die Schnittstelle `Sprachmodell` ist so geschnitten,
 * dass später eine echte KI dahinter hängen kann (gleicher Kontext, gleiche Antwortform,
 * gleiche Rechteprüfung). Ausführende Aktionen sind immer erst ein Entwurf, den der
 * Mensch bestätigt.
 */
import { db } from '@core/db';
import { datum, datumKurz, euro, personName, relativ, summen, tage as tageIn, uhrzeit, datumVon, plusTage, wochenStart, tageZwischen } from '@core/format';
import { offeneHinweise } from '@core/macher';
import { pfadZu, sucheUeberall, type Ton } from '@core/modul';
import type { Datum, ID, Mitarbeiter, Rechnung, Termin } from '@core/objects';
import type { Recht } from '@core/session';
import { befehlVorbereiten, erkenneBefehl, findeKunde, findeMitarbeiter, type Befehl, type Freigabe, type Klasse, type VorschauZeile } from '@core/aktionen';
import { zeitraumAus, type Zeitraum } from './zeit';
import { abwesenheitAm, anwesenheit, arbeitstagIm, geplanteStunden, kontextAusDb as planKontextAusDb, verfuegbareStunden } from '../verfuegbarkeit/daten';

// ------------------------------------------------------------------ Schnittstelle

export interface Kontext {
  heute: Datum;
  jetzt: Date;
  ich?: Mitarbeiter;
  darf: (r: Recht) => boolean;
}

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

/** Vorbereitete Aktion der Action Engine (`@core/aktionen`) – wird erst nach Bestätigung/Freigabe ausgeführt */
export interface BefehlVorschlag {
  id: string;
  art: 'befehl';
  /** Beschriftung des Bestätigungsknopfs */
  label: string;
  befehlId: string;
  /** die ursprüngliche Eingabe (Kontext beim Ausführen) */
  eingabe: string;
  titel: string;
  zeilen?: VorschauZeile[];
  parameter: unknown;
  klassen: Klasse[];
  freigabe: Freigabe;
  hinweis?: string;
  endgueltig?: string;
  felder?: { schluessel: string; label: string; mehrzeilig?: boolean }[];
  status: 'entwurf' | 'ausgefuehrt' | 'verworfen' | 'zurueckgenommen';
  ergebnis?: { text: string; pfad?: string; eintraege: ID[]; oeffnen?: { label: string; url: string }[]; am: string };
}

export type Vorschlag =
  | { id: string; art: 'aufgabe'; label: string; entwurf: AufgabeEntwurf; status: 'entwurf' | 'ausgefuehrt' | 'verworfen'; ergebnisId?: ID }
  | { id: string; art: 'oeffnen'; label: string; pfad: string }
  | BefehlVorschlag;

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

/** Adapter für ein Sprachmodell. Heute: Regeln. Später: echte KI mit denselben Werkzeugen. */
export interface Sprachmodell {
  readonly name: string;
  antworte(frage: string, kontext: Kontext): Promise<Antwort>;
}

export const BEISPIELFRAGEN = [
  'Was steht morgen an?',
  'Welche Rechnungen sind offen?',
  'Wo ist Familie Hoffmann?',
  'Wer hat nächste Woche Zeit?',
  'Leg eine Aufgabe für Jonas an: Leiter prüfen bis Freitag',
  'Was braucht mich gerade?',
  'Bestell das fehlende Material',
];

// ------------------------------------------------------------------ Hilfen

const klein = (t: string) => t.toLowerCase();
const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const vid = () => Math.random().toString(36).slice(2, 10);
const gross = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

function woerter(t: string) {
  return klein(t)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Mitarbeiter und Kunden per Name finden – eine Umsetzung im Kern (Action Engine) */
export { findeKunde, findeMitarbeiter };

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

const stand = (k: Kontext) => `Stand ${uhrzeit(k.jetzt.toISOString())} Uhr`;

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
      status: a.dringend ? { ton: 'achtung', text: 'Dringend' } : undefined,
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
  const nr = frage.match(/\bA-\d{4}-\d{3,4}\b/i);
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

// ------------------------------------------------------------------ Befehle (Action Engine)

/** Befehl vorbereiten und als Antwort mit Vorschau (oder direkter Auskunft) zurückgeben */
export function befehlAntwort(b: Befehl, frage: string, k: Kontext): Antwort {
  const v = befehlVorbereiten(b, { ...k, eingabe: frage });
  const e = v.ergebnis;
  if (e.art === 'antwort')
    return {
      absicht: `befehl:${b.id}`,
      text: e.text,
      eintraege: e.zeilen,
      grundlage: e.grundlage ? `${e.grundlage} · ${stand(k)}` : undefined,
      folgefragen: e.folgefragen,
    };
  return {
    absicht: `befehl:${b.id}`,
    text: e.text,
    vorschlaege: [
      {
        id: vid(),
        art: 'befehl',
        label: e.bestaetigen ?? 'Ausführen',
        befehlId: b.id,
        eingabe: frage,
        titel: e.titel,
        zeilen: e.zeilen,
        parameter: e.parameter,
        klassen: v.klassen ?? b.klassen,
        freigabe: v.freigabe ?? 'bestaetigen',
        hinweis: e.hinweis,
        endgueltig: e.endgueltig,
        felder: e.felder,
        status: 'entwurf',
      },
    ],
  };
}

// ------------------------------------------------------------------ Regelmodell

/** Erkennt die Absicht und beantwortet sie direkt aus den Daten. */
export function beantworte(frage: string, k: Kontext): Antwort {
  const f = klein(frage.trim());
  if (!f) return { absicht: 'leer', text: 'Stell mir eine Frage zu deinem Betrieb.', folgefragen: BEISPIELFRAGEN };
  // Befehle der Action Engine zuerst („Mach Müller die Rechnung fertig“)
  const erkannt = erkenneBefehl(frage);
  if (erkannt) return befehlAntwort(erkannt.befehl, frage, k);
  const z = zeitraumAus(f, k.heute);

  if (/\baufgabe\b/.test(f) && /\b(leg|lege|erstell|erstelle|anlegen|neue|mach|notier|notiere)\b/.test(f)) return aufgabeAnlegen(k, frage);
  if (/^erinnere?n?\s/.test(f)) return aufgabeAnlegen(k, frage, true);
  if (/rechnung/.test(f) && /(offen|überfällig|ueberfaellig|unbezahlt|ausstehend|bezahlt|zahlt|schuld|geld)/.test(f)) return offeneRechnungen(k);
  if (/\bwer\b.*\b(zeit|frei|verfügbar|kapazität|luft)\b/.test(f) || /\b(freie kapazität|wer ist frei)\b/.test(f))
    return werHatZeit(k, z ?? { von: plusTage(wochenStart(k.heute), 7), bis: plusTage(wochenStart(k.heute), 11), label: 'nächste Woche', tag: false });
  if (/^wo\b|\bwo (ist|sind|wohnt|steckt|arbeitet)\b|\badresse\b/.test(f)) return woIst(k, frage);
  if (/angebot/.test(f) && /(offen|warten|ausstehend|antwort|versendet|stand)/.test(f)) return offeneAngebote(k);
  if (/anfrage/.test(f)) return offeneAnfragen(k);
  if (/(braucht mich|brauchst du|was ist wichtig|was muss ich|hinweis|freigabe|entscheid)/.test(f)) return brauchtMich(k);
  if (/(meine aufgaben|was ist zu tun|was hab ich zu tun|was habe ich zu tun|offene aufgaben)/.test(f)) return meineAufgaben(k);
  if (z && /(steht|an\b|termin|plan|geplant|los|einsatz|einsätze|was ist|was hab|was habe|was gibt)/.test(f)) {
    const nurMeine = /\b(ich|mich|mir|meine?n?)\b/.test(f) || (!!k.ich && (k.ich.rolle === 'monteur' || k.ich.rolle === 'azubi'));
    return agenda(k, z, nurMeine);
  }
  if (/\b(termine?|einsätze|plan)\b/.test(f)) {
    const nurMeine = !!k.ich && (k.ich.rolle === 'monteur' || k.ich.rolle === 'azubi');
    return agenda(k, { von: k.heute, bis: k.heute, label: 'heute', tag: true }, nurMeine);
  }
  if (/(hilfe|was kannst du|wie funktioniert)/.test(f))
    return { absicht: 'hilfe', text: 'Ich beantworte Fragen aus deinen Daten und bereite Aufgaben vor. Ausgeführt wird erst, wenn du bestätigst.', folgefragen: BEISPIELFRAGEN };
  return suchen(k, frage);
}

export const regelModell: Sprachmodell = {
  name: 'Macher Regeln (lokal)',
  async antworte(frage, kontext) {
    return beantworte(frage, kontext);
  },
};

let aktiv: Sprachmodell = regelModell;

/** Später: `setzeSprachmodell(new EchteKi(...))` – die Oberfläche bleibt gleich. */
export function setzeSprachmodell(m: Sprachmodell) {
  aktiv = m;
}

export function sprachmodell(): Sprachmodell {
  return aktiv;
}

// ------------------------------------------------------------------ Ausführen (erst nach Bestätigung)

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

