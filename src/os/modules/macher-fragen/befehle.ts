/**
 * Befehle für „Macher fragen“ – auf Basis der Action Engine (`@core/aktionen`).
 *
 * Jeder Befehl: erkennen (Regeln) → Objekte finden → vorbereiten (Vorschau) → nach Freigabe ausführen.
 * Ausgeführt wird über die Aktionen der Fachmodule (`aktionAusfuehren`) – Macher kopiert keine Logik.
 * Audit und Rückgängig kommen automatisch aus dem Kern.
 */
import { db } from '@core/db';
import { aktionAusfuehren, pfadZu } from '@core/modul';
import { datum, datumKurz, euro, personName, plusTage, summen, tageZwischen, uhrAus, zeitpunkt } from '@core/format';
import { findeAuftrag, findeKunde, findeMitarbeiter, normalisieren, type Befehl, type VorschauZeile } from '@core/aktionen';
import { PHASEN, type Auftrag, type ID, type Kunde, type Mitarbeiter, type Nachricht } from '@core/objects';
import { zeitraumAus } from './zeit';
import { abwesenheitAm, arbeitstagIm, freieFenster, kontextAusDb as planKontext, restStunden, ABWESENHEIT_LABEL } from '../verfuegbarkeit/daten';
import { offenePosten, offenerBetrag, rechnungsVorschau } from '../rechnungen/logik';
import type { RechnungX } from '../rechnungen/typen';
import { mahnungen, mahnungMailto, naechsteStufe, senden as mahnungSenden, STUFE_LABEL, vorbereiten as mahnungVorbereiten, type Stufe } from '../mahnungen/daten';
import { berechneBedarf } from '../bedarf/daten';
import { checklisten, punktOffen } from '../checklisten/daten';
import { verfuegbareKanaele, versandLink, KANAL_LABEL, type KundenKanal } from '../nachrichten/daten';
import type { Vorschlag as PlanVorschlag } from '../autoplanung/daten';

const phaseLabel = (p: Auftrag['phase']) => PHASEN.find((x) => x.id === p)?.label ?? p;
const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const hat = (t: string, re: RegExp) => re.test(normalisieren(t));
const ust = () => db.betrieb.get('betrieb')?.ustSatz ?? 19;

/** Namen von Mitarbeitern, damit „Plane Jonas … bei Schneider“ Jonas nicht für einen Kunden hält */
const mitarbeiterWoerter = (m?: Mitarbeiter) => (m ? [m.vorname, m.nachname] : []);

function auftragZeile(a: Auftrag): VorschauZeile {
  return { titel: `${a.nummer} · ${a.titel}`, untertitel: `Schritt: ${phaseLabel(a.phase)}`, pfad: pfadZu({ typ: 'auftraege', id: a.id }) };
}

function keinKunde(beispiel: string) {
  return { art: 'antwort' as const, text: `Ich habe keinen passenden Kunden gefunden. Nenn mir den Namen, z. B. „${beispiel}“.`, folgefragen: [beispiel] };
}

// ------------------------------------------------------------------ 1. Rechnung fertig machen

export const rechnungFertig: Befehl<{ auftragId: ID }> = {
  id: 'rechnung.fertig',
  titel: 'Rechnung fertig machen',
  beschreibung: 'Legt den Rechnungsentwurf für den Auftrag eines Kunden aus Angebot, Material und Zeiten an.',
  beispiele: ['Mach Müller die Rechnung fertig', 'Schreib die Rechnung für Familie Hoffmann'],
  klassen: ['WRITE', 'MONEY'],
  braucht: ['rechnung.erstellen'],
  erkennen: (t) => {
    if (!hat(t, /\brechnung/)) return 0;
    if (hat(t, /(offen|ueberfaellig|bezahlt|unbezahlt|erinner|mahn|welche|wie viel|\bdass\b)/)) return 0;
    return hat(t, /\b(fertig|schreib\w*|mach\w*|erstell\w*|stell\w*|vorbereit\w*|abrechn\w*)\b/) ? 0.9 : 0;
  },
  vorbereiten: (k) => {
    const kunde = findeKunde(k.eingabe);
    const auftrag = findeAuftrag(k.eingabe, { kundeId: kunde?.id, vorrang: ['abrechnung', 'abnahme', 'in_arbeit', 'beauftragt'] });
    if (!auftrag) return kunde ? { art: 'antwort', text: `Bei ${kunde.name} gibt es keinen offenen Auftrag zum Abrechnen.` } : keinKunde('Mach Müller die Rechnung fertig');
    const k2 = db.kunden.get(auftrag.kundeId);
    if (['anfrage', 'besichtigung', 'angebot'].includes(auftrag.phase))
      return { art: 'antwort', text: `${auftrag.titel} (${auftrag.nummer}) ist erst im Schritt „${phaseLabel(auftrag.phase)}“. Es gibt noch nichts abzurechnen.`, zeilen: [auftragZeile(auftrag)] };
    const entwurf = db.rechnungen.where((r) => r.auftragId === auftrag.id && r.status === 'entwurf')[0];
    if (entwurf)
      return {
        art: 'antwort',
        text: `Für ${k2?.name ?? 'den Kunden'} liegt schon ein Rechnungsentwurf. Prüfe ihn und versende ihn dann.`,
        zeilen: [{ titel: `Rechnungsentwurf · ${entwurf.titel}`, untertitel: euro(summen(entwurf.positionen, ust()).netto) + ' netto', pfad: pfadZu({ typ: 'rechnungen', id: entwurf.id }), status: { ton: 'aktiv', text: 'Entwurf' } }],
      };
    const v = rechnungsVorschau(auftrag.id);
    const netto = summen(v.positionen, ust()).netto;
    return {
      art: 'entwurf',
      titel: `Rechnung für ${k2?.name ?? 'den Kunden'}`,
      text: `Ich lege den Rechnungsentwurf für ${auftrag.titel} an. Versendet wird noch nichts.`,
      zeilen: [
        auftragZeile(auftrag),
        { titel: `${anzahl(v.positionen.length, 'Position', 'Positionen')} · ${euro(netto)} netto`, untertitel: v.quellen.join(' · ') || undefined },
        ...v.hinweise.map((h) => ({ titel: h, status: { ton: 'achtung' as const, text: 'Prüfen' } })),
      ],
      parameter: { auftragId: auftrag.id },
      bestaetigen: 'Rechnungsentwurf anlegen',
      hinweis: 'Den Entwurf prüfst du danach und versendest ihn selbst.',
    };
  },
  ausfuehren: ({ auftragId }) => {
    const pfad = aktionAusfuehren('rechnung.erstellen', { auftragId });
    const r = db.rechnungen.where((x) => x.auftragId === auftragId && x.status === 'entwurf')[0];
    if (!r) throw new Error('Der Rechnungsentwurf konnte nicht angelegt werden.');
    return { text: `Der Rechnungsentwurf für ${db.kunden.get(r.kundeId)?.name ?? 'den Kunden'} ist angelegt.`, pfad: pfad || pfadZu({ typ: 'rechnungen', id: r.id }), bezug: { typ: 'rechnungen', id: r.id } };
  },
};

// ------------------------------------------------------------------ 2. Mitarbeiter einplanen

interface EinplanenParameter {
  vorschlag: PlanVorschlag;
}

export const einplanen: Befehl<EinplanenParameter> = {
  id: 'einsatz.einplanen',
  titel: 'Mitarbeiter einplanen',
  beschreibung: 'Plant einen Mitarbeiter an einem Tag beim Auftrag eines Kunden ein – in der ersten freien Zeit.',
  beispiele: ['Plane Jonas morgen bei Schneider ein', 'Teil Mehmet am Montag um 8 Uhr bei Hoffmann ein'],
  klassen: ['WRITE'],
  rechte: ['planen'],
  braucht: ['autoplanung.uebernehmen'],
  erkennen: (t) => (hat(t, /\b(plane?|teile?|setz\w*)\b.*\bein\b|\beinplanen\b|\beinteilen\b/) ? (findeMitarbeiter(t) ? 0.9 : 0.6) : 0),
  vorbereiten: (k) => {
    const m = findeMitarbeiter(k.eingabe);
    if (!m) return { art: 'antwort', text: 'Wen soll ich einplanen? Nenn mir den Namen, z. B. „Plane Jonas morgen bei Schneider ein“.' };
    const kunde = findeKunde(k.eingabe, { ohne: mitarbeiterWoerter(m) });
    const auftrag = findeAuftrag(k.eingabe, { kundeId: kunde?.id, vorrang: ['beauftragt', 'in_arbeit', 'abnahme', 'besichtigung', 'angebot', 'anfrage'] });
    if (!auftrag) return kunde ? { art: 'antwort', text: `Bei ${kunde.name} gibt es keinen offenen Auftrag zum Einplanen.` } : keinKunde(`Plane ${m.vorname} morgen bei Schneider ein`);
    const z = zeitraumAus(k.eingabe, k.heute);
    const tag = z?.von ?? plusTage(k.heute, 1);
    const pk = planKontext();
    if (!arbeitstagIm(pk, tag)) return { art: 'antwort', text: `${datumKurz(tag)} ist kein Arbeitstag. Nenn mir einen anderen Tag, z. B. „am Montag“.` };
    const ab = abwesenheitAm(m.id, tag, pk, { nurGenehmigt: true });
    if (ab) return { art: 'antwort', text: `${m.vorname} ist am ${datumKurz(tag)} nicht da${k.darf('personal') ? ` (${ABWESENHEIT_LABEL[ab.art] ?? 'abwesend'})` : ''}.`, folgefragen: ['Wer hat morgen Zeit?'] };
    const rest = restStunden(auftrag, pk.termine);
    const dauer = Math.round(Math.min(8, Math.max(1, rest ?? auftrag.geplanteStunden ?? 2)) * 60);
    const wunsch = normalisieren(k.eingabe).match(/\bum (\d{1,2})(?:[:.](\d{2}))?\s*(uhr)?\b/);
    const wunschVon = wunsch ? Number(wunsch[1]) * 60 + Number(wunsch[2] ?? 0) : undefined;
    const fenster = freieFenster(m.id, tag, pk).filter((f) => f.bis - f.von >= 60);
    const passend =
      wunschVon != null ? fenster.find((f) => f.von <= wunschVon && f.bis >= wunschVon + 60) : fenster.sort((a, b) => b.bis - b.von - (a.bis - a.von))[0];
    if (!passend)
      return {
        art: 'antwort',
        text: wunschVon != null ? `${m.vorname} ist am ${datumKurz(tag)} um ${uhrAus(wunschVon)} Uhr nicht frei.` : `${m.vorname} ist am ${datumKurz(tag)} schon voll verplant.`,
        folgefragen: [`Wer hat ${z?.label ?? 'morgen'} Zeit?`],
      };
    const von = wunschVon ?? passend.von;
    const bis = Math.min(passend.bis, von + dauer);
    const kd = db.kunden.get(auftrag.kundeId);
    const ort = db.orte.get(auftrag.ortId);
    const vorschlag: PlanVorschlag = {
      auftragId: auftrag.id,
      mitarbeiterIds: [m.id],
      bloecke: [{ datum: tag, von, bis }],
      stunden: (bis - von) / 60,
      score: 0,
      gruende: [`Von ${k.ich?.vorname ?? 'dir'} über Macher eingeplant`],
      warnungen: [],
    };
    const kuerzer = bis - von < dauer;
    return {
      art: 'entwurf',
      titel: `${personName(m)} einplanen`,
      text: `Ich plane ${m.vorname} am ${datumKurz(tag)} von ${uhrAus(von)} bis ${uhrAus(bis)} Uhr bei ${kd?.name ?? 'dem Kunden'} ein.`,
      zeilen: [
        { titel: `${datum(tag)}, ${uhrAus(von)}–${uhrAus(bis)} Uhr`, untertitel: personName(m) },
        { titel: kd?.name ?? 'Kunde', untertitel: ort ? `${ort.adresse.strasse}, ${ort.adresse.ort}` : undefined },
        auftragZeile(auftrag),
        ...(kuerzer ? [{ titel: `Nur ${((bis - von) / 60).toLocaleString('de-DE')} Std. frei – für den Auftrag sind noch ca. ${(dauer / 60).toLocaleString('de-DE')} Std. offen`, status: { ton: 'achtung' as const, text: 'Reicht nicht' } }] : []),
      ],
      parameter: { vorschlag },
      bestaetigen: 'Einsatz einplanen',
    };
  },
  ausfuehren: ({ vorschlag }) => {
    const pfad = aktionAusfuehren('autoplanung.uebernehmen', { vorschlag });
    const b = vorschlag.bloecke[0];
    const start = zeitpunkt(b.datum, uhrAus(b.von));
    const t = db.termine.where((x) => x.auftragId === vorschlag.auftragId && x.start === start && x.mitarbeiterIds.includes(vorschlag.mitarbeiterIds[0]))[0];
    if (!t) throw new Error('Inzwischen ist dort schon etwas geplant. Frag mich noch einmal, dann suche ich eine neue Zeit.');
    const m = db.mitarbeiter.get(vorschlag.mitarbeiterIds[0]);
    return { text: `${m?.vorname ?? 'Der Einsatz'} ist am ${datumKurz(b.datum)} um ${uhrAus(b.von)} Uhr eingeplant.`, pfad: pfad || pfadZu({ typ: 'termine', id: t.id }), bezug: { typ: 'termine', id: t.id } };
  },
};

// ------------------------------------------------------------------ 3. Was fehlt noch?

export const wasFehlt: Befehl<undefined> = {
  id: 'auftrag.was-fehlt',
  titel: 'Was fehlt noch?',
  beschreibung: 'Zeigt, was für einen Auftrag noch fehlt: Material, Aufgaben, Checklisten, Termin, Zusage.',
  beispiele: ['Was fehlt noch für die Baustelle Wagner?', 'Was ist bei Hoffmann noch offen?'],
  klassen: ['READ'],
  erkennen: (t) => (hat(t, /\bwas fehlt\b|\bfehlt (noch|uns)\b|\bwas ist (bei|fuer) .+ noch offen\b/) ? 0.9 : 0),
  vorbereiten: (k) => {
    const kunde = findeKunde(k.eingabe);
    const a = findeAuftrag(k.eingabe, { kundeId: kunde?.id, vorrang: ['in_arbeit', 'beauftragt', 'abnahme', 'abrechnung', 'angebot', 'besichtigung', 'anfrage'] });
    if (!a) return kunde ? { art: 'antwort', text: `Bei ${kunde.name} gibt es keinen offenen Auftrag.` } : keinKunde('Was fehlt noch für die Baustelle Wagner?');
    const zeilen: VorschauZeile[] = [];
    const geld = k.darf('geld');
    // Material
    const material = db.material.where((x) => x.auftragId === a.id && (x.status === 'geplant' || x.status === 'bestellt'));
    const imLager = berechneBedarf(k.heute).filter((z) => z.fehl > 0 && z.auftraege.some((x) => x.auftragId === a.id));
    const fehltIds = new Set(imLager.flatMap((z) => z.materialIds));
    for (const x of material)
      zeilen.push({
        titel: `Material: ${x.text}`,
        untertitel: `${x.menge} ${x.einheit}`,
        pfad: pfadZu({ typ: 'auftraege', id: a.id }),
        status: x.status === 'bestellt' ? { ton: 'aktiv', text: 'Bestellt' } : fehltIds.has(x.id) ? { ton: 'achtung', text: 'Fehlt – bestellen' } : { ton: 'neutral', text: 'Noch nicht bereitgelegt' },
      });
    for (const z of imLager)
      if (!material.some((x) => z.materialIds.includes(x.id)))
        zeilen.push({ titel: `Im Lager zu wenig: ${z.text}`, untertitel: `${z.fehl} ${z.einheit} fehlen`, status: { ton: 'achtung', text: 'Fehlt' } });
    // Aufgaben
    for (const x of db.aufgaben.where((t) => t.auftragId === a.id && !t.erledigt))
      zeilen.push({ titel: `Aufgabe: ${x.titel}`, untertitel: [x.zustaendigId ? personName(db.mitarbeiter.get(x.zustaendigId)) : 'noch niemand zuständig', x.faellig ? `fällig ${datumKurz(x.faellig)}` : undefined].filter(Boolean).join(' · '), status: x.faellig && x.faellig < k.heute ? { ton: 'achtung', text: 'Überfällig' } : undefined });
    // Checklisten
    for (const c of checklisten.where((x) => x.auftragId === a.id)) {
      const offen = c.punkte.filter(punktOffen);
      if (offen.length) zeilen.push({ titel: `Checkliste „${c.titel}“`, untertitel: `${anzahl(offen.length, 'Punkt', 'Punkte')} offen${offen.some((p) => p.pflicht) ? ', davon Pflicht' : ''}`, status: offen.some((p) => p.pflicht) ? { ton: 'achtung', text: 'Pflicht offen' } : { ton: 'aktiv', text: 'Offen' } });
    }
    // Termin
    const termine = db.termine.where((t) => t.auftragId === a.id && t.status !== 'abgesagt' && t.start.slice(0, 10) >= k.heute);
    if (!termine.length && ['beauftragt', 'in_arbeit'].includes(a.phase)) zeilen.push({ titel: 'Noch kein Einsatz geplant', status: { ton: 'achtung', text: 'Einplanen' } });
    // Zusage
    if (a.phase === 'angebot') {
      const an = db.angebote.where((x) => x.auftragId === a.id && x.status === 'versendet')[0];
      zeilen.push({ titel: an ? 'Antwort des Kunden auf das Angebot' : 'Angebot noch nicht versendet', untertitel: an && geld ? euro(summen(an.positionen, ust(), an.rabattProzent).netto) + ' netto' : undefined, status: { ton: 'aktiv', text: 'Ausstehend' } });
    }
    if (a.phase === 'abnahme') zeilen.push({ titel: 'Abnahme durch den Kunden', status: { ton: 'aktiv', text: 'Ausstehend' } });
    const kd = db.kunden.get(a.kundeId);
    const wer = `${a.titel} bei ${kd?.name ?? 'dem Kunden'} (${a.nummer})`;
    if (!zeilen.length)
      return { art: 'antwort', text: `Für ${wer} fehlt nichts: Material ist da, keine offenen Aufgaben oder Checklistenpunkte.`, zeilen: [auftragZeile(a)], grundlage: 'Material, Aufgaben, Checklisten und Plan des Auftrags' };
    const nichtBestellt = imLager.length > 0;
    return {
      art: 'antwort',
      text: `Für ${wer} fehlt noch: ${anzahl(zeilen.length, 'Punkt', 'Punkte')}.`,
      zeilen: [...zeilen, auftragZeile(a)],
      grundlage: 'Material, Aufgaben, Checklisten und Plan des Auftrags',
      folgefragen: nichtBestellt ? ['Bestell das fehlende Material'] : undefined,
    };
  },
  ausfuehren: () => ({ text: '' }),
};

// ------------------------------------------------------------------ 4. Fehlendes Material bestellen

export const materialBestellen: Befehl<undefined> = {
  id: 'material.bestellen',
  titel: 'Fehlendes Material bestellen',
  beschreibung: 'Legt Bestellentwürfe je Lieferant für alles an, was für anstehende Aufträge oder das Lager fehlt.',
  beispiele: ['Bestell das fehlende Material', 'Bestelle, was für nächste Woche fehlt'],
  klassen: ['WRITE'],
  braucht: ['material.bestellvorschlag'],
  erkennen: (t) => (hat(t, /\bbestell\w*\b/) && hat(t, /(material|fehl|teile|artikel|lager|was)/) && !hat(t, /\b(welche|wann|wo)\b/) ? 0.9 : 0),
  vorbereiten: (k) => {
    const zeilen = berechneBedarf(k.heute).filter((z) => z.fehl > 0);
    if (!zeilen.length) return { art: 'antwort', text: 'Es fehlt kein Material. Alles für die anstehenden Aufträge ist im Lager oder schon bestellt.', grundlage: 'Geplantes Material, Lagerbestand und offene Bestellungen' };
    const lieferanten = new Set(zeilen.map((z) => z.lieferantId ?? ''));
    return {
      art: 'entwurf',
      titel: 'Fehlendes Material bestellen',
      text: `Es fehlen ${anzahl(zeilen.length, 'Artikel', 'Artikel')}. Ich lege ${lieferanten.size === 1 ? 'einen Bestellentwurf' : `${lieferanten.size} Bestellentwürfe (je Lieferant)`} an.`,
      zeilen: zeilen.slice(0, 12).map((z) => ({
        titel: z.text,
        untertitel: [`${z.fehl} ${z.einheit} fehlen`, z.lieferantId ? db.lieferanten.get(z.lieferantId)?.name : 'ohne Lieferant', z.fruehestens ? `gebraucht ab ${datumKurz(z.fruehestens)}` : undefined].filter(Boolean).join(' · '),
        status: z.grund === 'auftrag' ? { ton: 'achtung', text: 'Für Auftrag' } : { ton: 'neutral', text: 'Mindestbestand' },
      })),
      parameter: undefined,
      bestaetigen: 'Bestellentwürfe anlegen',
      hinweis: 'Bestellt ist erst, wenn du die Entwürfe an den Lieferanten schickst.',
    };
  },
  ausfuehren: () => {
    const pfad = aktionAusfuehren('material.bestellvorschlag', undefined);
    return { text: 'Die Bestellentwürfe sind angelegt. Prüfe sie und schick sie an den Lieferanten.', pfad: pfad || '/betrieb/bestellungen' };
  },
};

// ------------------------------------------------------------------ 5. Kunden an offene Rechnungen erinnern

interface ErinnernParameter {
  rechnungIds: ID[];
}

const tageAus = (t: string) => {
  const m = normalisieren(t).match(/(\d+)\s*(tage?n?|wochen?)\b/);
  if (!m) return undefined;
  return /woche/.test(m[2]) ? Number(m[1]) * 7 : Number(m[1]);
};

/** Welche Rechnungen sind „länger als N Tage offen“ – und heute für eine Erinnerung dran? */
export function erinnerungsKandidaten(heute: string, tage = 14): { r: RechnungX; stufe: Stufe; tageOffen: number }[] {
  return offenePosten()
    .map((r) => ({ r, stufe: naechsteStufe(r, undefined, heute) ?? mahnungen.where((m) => m.rechnungId === r.id && m.status === 'vorbereitet')[0]?.stufe, tageOffen: tageZwischen(r.datum, heute) }))
    .filter((x): x is { r: RechnungX; stufe: Stufe; tageOffen: number } => !!x.stufe && x.tageOffen > tage && x.r.faelligAm < heute);
}

export const kundenErinnern: Befehl<ErinnernParameter> = {
  id: 'rechnungen.erinnern',
  titel: 'An offene Rechnungen erinnern',
  beschreibung: 'Bereitet für überfällige Rechnungen die nächste Erinnerung oder Mahnung vor und gibt sie nach deiner Freigabe raus.',
  beispiele: ['Erinnere alle Kunden, deren Rechnung länger als 14 Tage offen ist', 'Mahne alle überfälligen Rechnungen'],
  klassen: ['WRITE', 'MONEY', 'PUBLICATION'],
  braucht: ['mahnung.senden'],
  erkennen: (t) => {
    if (!hat(t, /\b(erinner\w*|mahn\w*)\b/)) return 0;
    if (hat(t, /\b(mich|uns)\b/)) return 0;
    return hat(t, /(kunde|rechnung|offen|ueberfaellig|zahl)/) ? 0.9 : 0;
  },
  vorbereiten: (k) => {
    const tage = tageAus(k.eingabe) ?? (hat(k.eingabe, /ueberfaellig/) ? 0 : 14);
    const liste = erinnerungsKandidaten(k.heute, tage);
    const zuFrueh = offenePosten().filter((r) => tageZwischen(r.datum, k.heute) > tage && !liste.some((x) => x.r.id === r.id)).length;
    if (!liste.length)
      return {
        art: 'antwort',
        text: `Keine Rechnung ist länger als ${tage} Tage offen und gerade für eine Erinnerung dran.${zuFrueh ? ` ${anzahl(zuFrueh, 'Rechnung ist', 'Rechnungen sind')} noch nicht fällig oder wurde erst kürzlich erinnert.` : ''}`,
        grundlage: 'Offene Posten und Mahnregeln',
      };
    const ohneMail = liste.filter((x) => !db.kunden.get(x.r.kundeId)?.email).length;
    const summe = liste.reduce((s, x) => s + offenerBetrag(x.r), 0);
    return {
      art: 'entwurf',
      titel: liste.length === 1 ? 'Einen Kunden erinnern' : `${liste.length} Kunden erinnern`,
      text: `${anzahl(liste.length, 'Rechnung ist', 'Rechnungen sind')} länger als ${tage} Tage offen und überfällig, zusammen ${euro(summe)}. Ich bereite die Schreiben vor.`,
      zeilen: liste.map(({ r, stufe }) => ({
        titel: `${r.nummer} · ${db.kunden.get(r.kundeId)?.name ?? 'Kunde'}`,
        untertitel: `${euro(offenerBetrag(r))} offen · fällig seit ${datumKurz(r.faelligAm)}`,
        pfad: pfadZu({ typ: 'rechnungen', id: r.id }),
        status: { ton: stufe === 1 ? 'aktiv' : 'achtung', text: STUFE_LABEL[stufe] },
      })),
      parameter: { rechnungIds: liste.map((x) => x.r.id) },
      bestaetigen: 'Schreiben freigeben',
      hinweis: `Die Schreiben gelten als versendet. Die E-Mails öffnest du danach einzeln in deinem Mailprogramm.${ohneMail ? ` ${anzahl(ohneMail, 'Kunde hat', 'Kunden haben')} keine E-Mail-Adresse – druck das Schreiben aus der Mahnung.` : ''}`,
      endgueltig: 'Was beim Kunden angekommen ist, lässt sich nicht zurückholen.',
    };
  },
  ausfuehren: ({ rechnungIds }, k) => {
    const oeffnen: { label: string; url: string }[] = [];
    let n = 0;
    for (const id of rechnungIds) {
      const r = offenePosten().find((x) => x.id === id);
      if (!r) continue;
      let m = mahnungen.where((x) => x.rechnungId === id && x.status === 'vorbereitet')[0];
      const stufe = m?.stufe ?? naechsteStufe(r, undefined, k.heute);
      if (!m && stufe) m = mahnungVorbereiten(r, stufe, undefined, k.heute);
      if (!m) continue;
      const gesendet = mahnungSenden(m.id);
      if (!gesendet) continue;
      n++;
      const kunde = db.kunden.get(r.kundeId);
      if (kunde?.email) oeffnen.push({ label: `E-Mail an ${kunde.name}`, url: mahnungMailto(gesendet) });
    }
    if (!n) throw new Error('Es war keine Rechnung mehr zu erinnern – vielleicht wurde inzwischen bezahlt.');
    return { text: `${anzahl(n, 'Schreiben ist', 'Schreiben sind')} freigegeben.`, pfad: '/betrieb/mahnungen', oeffnen };
  },
};

// ------------------------------------------------------------------ 6. Kunden schreiben

interface SchreibenParameter {
  kundeId: ID;
  auftragId?: ID;
  kanal: KundenKanal;
  text: string;
}

const PRONOMEN = new Set(['wir', 'ich', 'er', 'sie', 'es', 'jonas', 'der', 'die', 'das', 'unser', 'unsere']);

/** „wir morgen um 8 Uhr kommen“ → „wir kommen morgen um 8 Uhr“ (Verb aus dem dass-Satz nach vorn) */
export function hauptsatz(nebensatz: string): string {
  const w = nebensatz.trim().replace(/[.!]+$/, '').split(/\s+/);
  if (w.length >= 3 && PRONOMEN.has(w[0].toLowerCase())) {
    const verb = w.pop()!;
    return [w[0], verb, ...w.slice(1)].join(' ');
  }
  return w.join(' ');
}

/** Nachrichtentext aus dem Auftrag: „Schreib Frau Müller, dass wir morgen um 8 Uhr kommen“ */
export function nachrichtAusText(eingabe: string, kunde: Kunde, heute: string, absender?: string): string {
  const roh = eingabe.match(/\bdass\s+(.+)$/i)?.[1] ?? eingabe.split(/:\s*/).slice(1).join(': ');
  let satz = hauptsatz(roh || '');
  const z = zeitraumAus(satz, heute);
  if (z?.tag && /\b(morgen|übermorgen|heute)\b/i.test(satz)) satz = satz.replace(/\b(übermorgen|morgen|heute)\b/i, (w) => `${w} (${datumKurz(z.von)})`);
  satz = satz.replace(/\bum (\d{1,2})\s*uhr\b/i, (_, h) => `um ${h}:00 Uhr`);
  const anredeName = eingabe.match(/\b(Frau|Herr|Herrn|Familie)\s+([A-ZÄÖÜ][\p{L}-]+)/u);
  const anrede = anredeName ? `Guten Tag ${anredeName[1] === 'Herrn' ? 'Herr' : anredeName[1]} ${anredeName[2]},` : `Guten Tag ${kunde.ansprechpartner[0]?.name ?? kunde.name},`;
  return [anrede, '', satz ? `${satz.charAt(0).toLowerCase() + satz.slice(1)}.` : '', '', 'Viele Grüße', absender ?? db.betrieb.get('betrieb')?.name ?? ''].join('\n').trim();
}

export const kundenSchreiben: Befehl<SchreibenParameter> = {
  id: 'nachricht.schreiben',
  titel: 'Kunden schreiben',
  beschreibung: 'Formuliert eine kurze Nachricht an einen Kunden und öffnet sie nach deiner Freigabe in E-Mail oder WhatsApp.',
  beispiele: ['Schreib Frau Müller, dass wir morgen um 8 Uhr kommen', 'Sag Hoffmann Bescheid, dass wir am Montag kommen'],
  klassen: ['WRITE', 'PUBLICATION'],
  erkennen: (t) => {
    if (!hat(t, /^\s*(schreib\w*|schick\w*|sag\w*|teil\w*|informier\w*|benachrichtig\w*)\b/)) return 0;
    if (hat(t, /\b(rechnung|angebot|aufgabe)\b/) && !hat(t, /\bdass\b/)) return 0;
    if (hat(t, /\b(mir|mich)\b/)) return 0;
    return hat(t, /\bdass\b/) || t.includes(':') ? 0.85 : 0.55;
  },
  vorbereiten: (k) => {
    const kunde = findeKunde(k.eingabe, { ohne: db.mitarbeiter.all().flatMap((m) => mitarbeiterWoerter(m)) }) ?? findeKunde(k.eingabe);
    if (!kunde) return keinKunde('Schreib Frau Müller, dass wir morgen um 8 Uhr kommen');
    const kanaele = verfuegbareKanaele(kunde);
    if (!kanaele.length) return { art: 'antwort', text: `Für ${kunde.name} ist weder E-Mail noch Telefonnummer hinterlegt.`, zeilen: [{ titel: kunde.name, pfad: pfadZu({ typ: 'kunden', id: kunde.id }) }] };
    const kanal = kanaele.includes('whatsapp') && hat(k.eingabe, /whatsapp/) ? 'whatsapp' : hat(k.eingabe, /\bsms\b/) && kanaele.includes('sms') ? 'sms' : kanaele[0];
    const text = nachrichtAusText(k.eingabe, kunde, k.heute, k.ich ? `${k.ich.vorname} ${k.ich.nachname} · ${db.betrieb.get('betrieb')?.name ?? ''}`.replace(/ · $/, '') : undefined);
    const auftrag = findeAuftrag(k.eingabe, { kundeId: kunde.id, vorrang: ['in_arbeit', 'beauftragt', 'abnahme', 'angebot', 'besichtigung', 'anfrage'] });
    return {
      art: 'entwurf',
      titel: `Nachricht an ${kunde.name}`,
      text: `Ich habe die Nachricht an ${kunde.name} vorbereitet. Prüfe den Text und gib ihn frei.`,
      zeilen: [
        { titel: `Per ${KANAL_LABEL[kanal]}`, untertitel: kanal === 'email' ? kunde.email : kunde.telefon },
        ...(auftrag ? [auftragZeile(auftrag)] : []),
      ],
      parameter: { kundeId: kunde.id, auftragId: auftrag?.id, kanal, text },
      felder: [{ schluessel: 'text', label: 'Nachricht', mehrzeilig: true }],
      bestaetigen: `${KANAL_LABEL[kanal]} öffnen`,
      hinweis: 'Macher legt die Nachricht im Verlauf ab und öffnet sie in deiner App. Abschicken tust du dort.',
      endgueltig: 'Was du abschickst, lässt sich nicht zurückholen. „Rückgängig“ entfernt nur den Eintrag im Verlauf.',
    };
  },
  ausfuehren: (p, k) => {
    const kunde = db.kunden.get(p.kundeId);
    if (!kunde) throw new Error('Den Kunden gibt es nicht mehr.');
    if (!p.text.trim()) throw new Error('Die Nachricht ist leer.');
    const url = versandLink(p.kanal, kunde, p.text, p.kanal === 'email' ? `Nachricht von ${db.betrieb.get('betrieb')?.name ?? 'uns'}` : undefined);
    const n = db.nachrichten.create({ kanal: p.kanal as Nachricht['kanal'], richtung: 'aus', kundeId: kunde.id, auftragId: p.auftragId, vonMitarbeiterId: k.ich?.id, text: p.text.trim(), gelesen: true });
    return {
      text: `Die Nachricht an ${kunde.name} liegt im Verlauf. Öffne ${KANAL_LABEL[p.kanal]} und schick sie ab.`,
      pfad: pfadZu({ typ: 'kunden', id: kunde.id }),
      bezug: { typ: 'nachrichten', id: n.id },
      oeffnen: url ? [{ label: `${KANAL_LABEL[p.kanal]} öffnen`, url }] : undefined,
    };
  },
};

export const MACHER_BEFEHLE = [rechnungFertig, einplanen, wasFehlt, materialBestellen, kundenErinnern, kundenSchreiben];
