/**
 * Weitere Absichten für „Macher fragen“ – aus der früheren Action Engine in den Gateway übernommen.
 *
 *   „Was fehlt noch für die Baustelle Wagner?“            job.missing         (lesen – Antwort aus den Daten)
 *   „Plane Jonas morgen bei Schneider ein“                  employee.schedule   (Plan → Aktion der Autoplanung)
 *   „Bestell das fehlende Material“                         order.create_draft  (Plan → Aktion des Bedarfs)
 *   „Erinnere alle Kunden, deren Rechnung länger als
 *    14 Tage offen ist“                                     invoice.remind      (Plan → Aktion der Mahnungen, je Rechnung ein Schritt)
 *
 * „Mach Müller die Rechnung fertig“ (`invoice.create_draft`) und „Schreib Frau Müller, dass …“ (`message.send`)
 * stehen in `assistent.ts` bzw. `aktionen.ts`. Jede Absicht baut nur einen Plan aus strukturierten Aktionen
 * (`@core/gateway`); ausgeführt wird erst nach Bestätigung – durch die Aktion des Besitzer-Moduls, als Macher
 * protokolliert und über das Audit rücknehmbar.
 */
import { db } from '@core/db';
import { datum, datumKurz, euro, personName, plusTage, summen, tageZwischen, uhrAus } from '@core/format';
import type { AbsichtDef, Plan } from '@core/gateway';
import { pfadZu } from '@core/modul';
import { PHASEN, type Auftrag } from '@core/objects';
import type { Antwort, AntwortEintrag, Kontext } from './assistent';
import { findeAuftrag, findeKunde, findeMitarbeiter, namenVon, normalisieren, planAntwort, schritte, stand } from './hilfen';
import { zeitraumAus } from './zeit';
import { abwesenheitAm, arbeitstagIm, freieFenster, kontextAusDb as planKontext, restStunden, ABWESENHEIT_LABEL } from '../verfuegbarkeit/daten';
import { berechneBedarf } from '../bedarf/daten';
import { checklisten, punktOffen } from '../checklisten/daten';
import { offenePosten, offenerBetrag } from '../rechnungen/logik';
import { erinnerungsKandidaten } from '../mahnungen/gateway';
import { STUFE_LABEL } from '../mahnungen/daten';
import type { Vorschlag as PlanVorschlag } from '../autoplanung/daten';

type Def = AbsichtDef<Antwort>;

const phaseLabel = (p: Auftrag['phase']) => PHASEN.find((x) => x.id === p)?.label ?? p;
const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const hat = (t: string, re: RegExp) => re.test(normalisieren(t));
const ust = () => db.betrieb.get('betrieb')?.ustSatz ?? 19;

export function auftragEintrag(a: Auftrag): AntwortEintrag {
  return { titel: `${a.nummer} · ${a.titel}`, untertitel: `Schritt: ${phaseLabel(a.phase)}`, pfad: pfadZu({ typ: 'auftraege', id: a.id }) };
}

const keinKunde = (absicht: string, beispiel: string): Antwort => ({
  absicht,
  text: `Ich habe keinen passenden Kunden gefunden. Nenn mir den Namen, z. B. „${beispiel}“.`,
  folgefragen: [beispiel],
});

// ------------------------------------------------------------------ Was fehlt noch?

const ALLE_OFFEN: Auftrag['phase'][] = ['in_arbeit', 'beauftragt', 'abnahme', 'abrechnung', 'angebot', 'besichtigung', 'anfrage'];

export function wasFehlt(k: Kontext, frage: string): Antwort {
  const kunde = findeKunde(frage);
  const a = findeAuftrag(frage, ALLE_OFFEN);
  if (!a) return kunde ? { absicht: 'auftrag-unklar', text: `Bei ${kunde.name} gibt es keinen offenen Auftrag.` } : keinKunde('auftrag-unklar', 'Was fehlt noch für die Baustelle Wagner?');
  const zeilen: AntwortEintrag[] = [];
  const geld = k.darf('geld');
  const auftragPfad = pfadZu({ typ: 'auftraege', id: a.id });
  // Material
  const material = db.material.where((x) => x.auftragId === a.id && (x.status === 'geplant' || x.status === 'bestellt'));
  const imLager = berechneBedarf(k.heute).filter((z) => z.fehl > 0 && z.auftraege.some((x) => x.auftragId === a.id));
  const fehltIds = new Set(imLager.flatMap((z) => z.materialIds));
  for (const x of material)
    zeilen.push({
      titel: `Material: ${x.text}`,
      untertitel: `${x.menge} ${x.einheit}`,
      pfad: auftragPfad,
      status: x.status === 'bestellt' ? { ton: 'aktiv', text: 'Bestellt' } : fehltIds.has(x.id) ? { ton: 'achtung', text: 'Fehlt – bestellen' } : { ton: 'neutral', text: 'Noch nicht bereitgelegt' },
    });
  for (const z of imLager)
    if (!material.some((x) => z.materialIds.includes(x.id))) zeilen.push({ titel: `Im Lager zu wenig: ${z.text}`, untertitel: `${z.fehl} ${z.einheit} fehlen`, status: { ton: 'achtung', text: 'Fehlt' } });
  // Aufgaben
  for (const x of db.aufgaben.where((t) => t.auftragId === a.id && !t.erledigt))
    zeilen.push({
      titel: `Aufgabe: ${x.titel}`,
      untertitel: [x.zustaendigId ? personName(db.mitarbeiter.get(x.zustaendigId)) : 'noch niemand zuständig', x.faellig ? `fällig ${datumKurz(x.faellig)}` : undefined].filter(Boolean).join(' · '),
      pfad: pfadZu({ typ: 'aufgaben', id: x.id }),
      status: x.faellig && x.faellig < k.heute ? { ton: 'achtung', text: 'Überfällig' } : undefined,
    });
  // Checklisten
  for (const c of checklisten.where((x) => x.auftragId === a.id)) {
    const offen = c.punkte.filter(punktOffen);
    if (offen.length)
      zeilen.push({
        titel: `Checkliste „${c.titel}“`,
        untertitel: `${anzahl(offen.length, 'Punkt', 'Punkte')} offen${offen.some((p) => p.pflicht) ? ', davon Pflicht' : ''}`,
        pfad: auftragPfad,
        status: offen.some((p) => p.pflicht) ? { ton: 'achtung', text: 'Pflicht offen' } : { ton: 'aktiv', text: 'Offen' },
      });
  }
  // Termin
  const termine = db.termine.where((t) => t.auftragId === a.id && t.status !== 'abgesagt' && t.start.slice(0, 10) >= k.heute);
  if (!termine.length && ['beauftragt', 'in_arbeit'].includes(a.phase)) zeilen.push({ titel: 'Noch kein Einsatz geplant', pfad: auftragPfad, status: { ton: 'achtung', text: 'Einplanen' } });
  // Zusage
  if (a.phase === 'angebot') {
    const an = db.angebote.where((x) => x.auftragId === a.id && x.status === 'versendet')[0];
    zeilen.push({
      titel: an ? 'Antwort des Kunden auf das Angebot' : 'Angebot noch nicht versendet',
      untertitel: an && geld ? euro(summen(an.positionen, ust(), an.rabattProzent).netto) + ' netto' : undefined,
      status: { ton: 'aktiv', text: 'Ausstehend' },
    });
  }
  if (a.phase === 'abnahme') zeilen.push({ titel: 'Abnahme durch den Kunden', status: { ton: 'aktiv', text: 'Ausstehend' } });
  const wer = `${a.titel} bei ${db.kunden.get(a.kundeId)?.name ?? 'dem Kunden'} (${a.nummer})`;
  const grundlage = `Material, Aufgaben, Checklisten und Plan des Auftrags · ${stand(k)}`;
  if (!zeilen.length) return { absicht: 'was-fehlt', text: `Für ${wer} fehlt nichts: Material ist da, keine offenen Aufgaben oder Checklistenpunkte.`, eintraege: [auftragEintrag(a)], grundlage };
  return {
    absicht: 'was-fehlt',
    text: `Für ${wer} fehlt noch: ${anzahl(zeilen.length, 'Punkt', 'Punkte')}.`,
    eintraege: [...zeilen, auftragEintrag(a)],
    grundlage,
    folgefragen: imLager.length ? ['Bestell das fehlende Material'] : undefined,
  };
}

// ------------------------------------------------------------------ Mitarbeiter einplanen

export function einplanen(k: Kontext, frage: string): Antwort {
  const m = findeMitarbeiter(frage);
  if (!m) return { absicht: 'einplanen-unklar', text: 'Wen soll ich einplanen? Nenn mir den Namen, z. B. „Plane Jonas morgen bei Schneider ein“.' };
  const ohne = namenVon(m);
  const kunde = findeKunde(frage, { ohne });
  const auftrag = findeAuftrag(frage, ['beauftragt', 'in_arbeit', 'abnahme', 'besichtigung', 'angebot', 'anfrage'], { ohne });
  if (!auftrag) return kunde ? { absicht: 'auftrag-unklar', text: `Bei ${kunde.name} gibt es keinen offenen Auftrag zum Einplanen.` } : keinKunde('kunde-unklar', `Plane ${m.vorname} morgen bei Schneider ein`);
  const z = zeitraumAus(frage, k.heute);
  const tag = z?.von ?? plusTage(k.heute, 1);
  const pk = planKontext();
  if (!arbeitstagIm(pk, tag)) return { absicht: 'einplanen-unklar', text: `${datumKurz(tag)} ist kein Arbeitstag. Nenn mir einen anderen Tag, z. B. „am Montag“.` };
  const ab = abwesenheitAm(m.id, tag, pk, { nurGenehmigt: true });
  if (ab) return { absicht: 'einplanen-unklar', text: `${m.vorname} ist am ${datumKurz(tag)} nicht da${k.darf('personal') ? ` (${ABWESENHEIT_LABEL[ab.art] ?? 'abwesend'})` : ''}.`, folgefragen: ['Wer hat morgen Zeit?'] };
  const rest = restStunden(auftrag, pk.termine);
  const dauer = Math.round(Math.min(8, Math.max(1, rest ?? auftrag.geplanteStunden ?? 2)) * 60);
  const wunsch = normalisieren(frage).match(/\bum (\d{1,2})(?:[:.](\d{2}))?\s*(uhr)?\b/);
  const wunschVon = wunsch ? Number(wunsch[1]) * 60 + Number(wunsch[2] ?? 0) : undefined;
  const fenster = freieFenster(m.id, tag, pk).filter((f) => f.bis - f.von >= 60);
  const passend = wunschVon != null ? fenster.find((f) => f.von <= wunschVon && f.bis >= wunschVon + 60) : fenster.sort((a, b) => b.bis - b.von - (a.bis - a.von))[0];
  if (!passend)
    return {
      absicht: 'einplanen-voll',
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
  const plan: Plan = {
    titel: `${personName(m)} einplanen`,
    schritte: schritte([
      { aktion: 'employee.schedule', absicht: 'employee.schedule', daten: { vorschlag }, label: `${m.vorname} am ${datumKurz(tag)}, ${uhrAus(von)}–${uhrAus(bis)} Uhr bei ${kd?.name ?? 'dem Kunden'} einplanen` },
    ]),
  };
  const kuerzer = bis - von < dauer;
  return {
    ...planAntwort('einplanen', `Ich plane ${m.vorname} am ${datumKurz(tag)} von ${uhrAus(von)} bis ${uhrAus(bis)} Uhr bei ${kd?.name ?? 'dem Kunden'} ein.`, plan, `Plan und Abwesenheiten · ${stand(k)}`),
    eintraege: [
      { titel: `${datum(tag)}, ${uhrAus(von)}–${uhrAus(bis)} Uhr`, untertitel: personName(m) },
      { titel: kd?.name ?? 'Kunde', untertitel: ort ? `${ort.adresse.strasse}, ${ort.adresse.ort}` : undefined },
      auftragEintrag(auftrag),
      ...(kuerzer
        ? [{ titel: `Nur ${((bis - von) / 60).toLocaleString('de-DE')} Std. frei – für den Auftrag sind noch ca. ${(dauer / 60).toLocaleString('de-DE')} Std. offen`, status: { ton: 'achtung' as const, text: 'Reicht nicht' } }]
        : []),
    ],
  };
}

// ------------------------------------------------------------------ Fehlendes Material bestellen

export function materialBestellen(k: Kontext): Antwort {
  const zeilen = berechneBedarf(k.heute).filter((z) => z.fehl > 0);
  const grundlage = `Geplantes Material, Lagerbestand und offene Bestellungen · ${stand(k)}`;
  if (!zeilen.length) return { absicht: 'material-da', text: 'Es fehlt kein Material. Alles für die anstehenden Aufträge ist im Lager oder schon bestellt.', grundlage };
  const lieferanten = new Set(zeilen.map((z) => z.lieferantId ?? ''));
  const plan: Plan = {
    titel: 'Fehlendes Material bestellen',
    schritte: schritte([
      { aktion: 'order.create_draft', absicht: 'order.create_draft', daten: {}, label: lieferanten.size === 1 ? 'Einen Bestellentwurf anlegen' : `${lieferanten.size} Bestellentwürfe anlegen (je Lieferant)` },
    ]),
  };
  return {
    ...planAntwort('material-bestellen', `Es ${zeilen.length === 1 ? 'fehlt 1 Artikel' : `fehlen ${zeilen.length} Artikel`}. Bestellt ist erst, wenn du die Entwürfe an den Lieferanten schickst.`, plan, grundlage),
    eintraege: zeilen.slice(0, 12).map((z) => ({
      titel: z.text,
      untertitel: [`${z.fehl} ${z.einheit} fehlen`, z.lieferantId ? db.lieferanten.get(z.lieferantId)?.name : 'ohne Lieferant', z.fruehestens ? `gebraucht ab ${datumKurz(z.fruehestens)}` : undefined].filter(Boolean).join(' · '),
      status: z.grund === 'auftrag' ? { ton: 'achtung', text: 'Für Auftrag' } : { ton: 'neutral', text: 'Mindestbestand' },
    })),
  };
}

// ------------------------------------------------------------------ Kunden an offene Rechnungen erinnern

const tageAus = (t: string) => {
  const m = normalisieren(t).match(/(\d+)\s*(tage?n?|wochen?)\b/);
  if (!m) return undefined;
  return /woche/.test(m[2]) ? Number(m[1]) * 7 : Number(m[1]);
};

export function kundenErinnern(k: Kontext, frage: string): Antwort {
  const tage = tageAus(frage) ?? (hat(frage, /ueberfaellig/) ? 0 : 14);
  const liste = erinnerungsKandidaten(k.heute, tage);
  const grundlage = `Offene Posten und Mahnregeln · ${stand(k)}`;
  if (!liste.length) {
    const zuFrueh = offenePosten().filter((r) => tageZwischen(r.datum, k.heute) > tage).length;
    return {
      absicht: 'erinnern-keine',
      text: `Keine Rechnung ist länger als ${tage} Tage offen und gerade für eine Erinnerung dran.${zuFrueh ? ` ${anzahl(zuFrueh, 'Rechnung ist', 'Rechnungen sind')} noch nicht fällig oder wurde erst kürzlich erinnert.` : ''}`,
      grundlage,
    };
  }
  const ohneMail = liste.filter((x) => !db.kunden.get(x.r.kundeId)?.email).length;
  const summe = liste.reduce((s, x) => s + offenerBetrag(x.r), 0);
  const plan: Plan = {
    titel: liste.length === 1 ? 'Einen Kunden erinnern' : `${liste.length} Kunden erinnern`,
    schritte: schritte(
      liste.map(({ r, stufe }) => ({
        aktion: 'invoice.remind',
        absicht: 'invoice.remind',
        daten: { rechnungId: r.id },
        label: `${STUFE_LABEL[stufe]}: ${r.nummer} · ${db.kunden.get(r.kundeId)?.name ?? 'Kunde'} · ${euro(offenerBetrag(r))} offen seit ${datumKurz(r.faelligAm)}`,
      })),
    ),
  };
  return planAntwort(
    'erinnern',
    `${anzahl(liste.length, 'Rechnung ist', 'Rechnungen sind')} länger als ${tage} Tage offen und überfällig, zusammen ${euro(summe)}. Die Schreiben gelten nach deiner Freigabe als versendet; die E-Mails öffnest du danach selbst.${ohneMail ? ` ${anzahl(ohneMail, 'Kunde hat', 'Kunden haben')} keine E-Mail-Adresse – druck das Schreiben aus der Mahnung.` : ''}`,
    plan,
    grundlage,
  );
}

// ------------------------------------------------------------------ Absichten

/**
 * Reihenfolge: vor „Erinnerung anlegen“ (`reminder.create` fängt jedes „Erinnere …“) und vor den Fragen
 * (`appointment.list` würde „Plane … morgen“ als Terminfrage lesen).
 */
export const MEHR_ABSICHTEN: Def[] = [
  {
    id: 'job.missing',
    titel: 'Zeigen, was für einen Auftrag noch fehlt',
    risiko: 'lesen',
    erkenne: (t) => hat(t, /\bwas fehlt\b|\bfehlt (noch|uns)\b|\bwas ist (bei|fuer) .+ noch offen\b/),
    beantworte: (t, _e, k) => wasFehlt(k, t),
  },
  {
    id: 'employee.schedule',
    titel: 'Mitarbeiter einplanen',
    risiko: 'schreiben',
    rechte: ['planen'],
    erkenne: (t) => hat(t, /\b(plane?|teile?|setz\w*)\b.*\bein\b|\beinplanen\b|\beinteilen\b/) && !hat(t, /^\s*(wer|wann|was|welche)\b/),
    beantworte: (t, _e, k) => einplanen(k, t),
  },
  {
    id: 'order.create_draft',
    titel: 'Fehlendes Material bestellen (Entwürfe)',
    risiko: 'schreiben',
    rechte: ['schreiben'],
    erkenne: (t) => hat(t, /\bbestell\w*\b/) && hat(t, /(material|fehl|teile|artikel|lager)/) && !hat(t, /^\s*(welche|wann|wo|was)\b|\baufgabe\b/),
    beantworte: (_t, _e, k) => materialBestellen(k),
  },
  {
    id: 'invoice.remind',
    titel: 'An offene Rechnungen erinnern',
    risiko: 'kritisch',
    rechte: ['geld', 'veroeffentlichen'],
    erkenne: (t) => hat(t, /\b(erinner\w*|mahn\w*)\b/) && !hat(t, /\b(mich|uns|mir)\b/) && hat(t, /(kunde|rechnung|offen|ueberfaellig|zahl)/),
    beantworte: (t, _e, k) => kundenErinnern(k, t),
  },
];
