/**
 * Mahnwesen: Stufen (Zahlungserinnerung → 1. Mahnung → 2. Mahnung), Gebühren, Verzugszinsen,
 * vorbereitete Mahnschreiben – versendet wird nur nach Freigabe durch einen Menschen.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { hinweisErledigen } from '@core/macher';
import { datum, euro, heute, plusTage, tageZwischen } from '@core/format';
import type { Basis, Cent, Datum, ID, Zeitpunkt } from '@core/objects';
import { istUeberfaellig, offenePosten, offenerBetrag } from '../rechnungen/logik';
import { rechnungAendern, rechnungX, type RechnungX } from '../rechnungen/typen';

export type Stufe = 1 | 2 | 3;

export interface Mahnung extends Basis {
  rechnungId: ID;
  /** 1 = Zahlungserinnerung, 2 = 1. Mahnung, 3 = 2. Mahnung */
  stufe: Stufe;
  status: 'vorbereitet' | 'versendet' | 'verworfen';
  /** Datum des Schreibens */
  datum: Datum;
  /** offener Rechnungsbetrag zum Zeitpunkt des Schreibens */
  offen: Cent;
  gebuehr: Cent;
  zinsen: Cent;
  zinsSatz: number;
  zinsTage: number;
  verzugSeit?: Datum;
  /** neue Zahlungsfrist im Schreiben */
  frist: Datum;
  /** „Noch warten“: erst ab diesem Tag wieder fragen */
  wartenBis?: Datum;
  /** Gebühren/Zinsen bewusst weggelassen (z. B. Stammkunde) */
  kulanz?: boolean;
  versendetAm?: Zeitpunkt;
}

export const mahnungen = defineCollection<Mahnung>('mahnungen');

export const STUFE_LABEL: Record<Stufe, string> = { 1: 'Zahlungserinnerung', 2: '1. Mahnung', 3: '2. Mahnung' };

export interface Regeln {
  /** Tage nach Fälligkeit bis zur Zahlungserinnerung */
  erinnerungTage: number;
  /** Tage nach der Erinnerung bis zur 1. Mahnung */
  mahnung1Tage: number;
  /** Tage nach der 1. Mahnung bis zur 2. Mahnung */
  mahnung2Tage: number;
  /** neue Zahlungsfrist im Schreiben (Tage) */
  fristTage: number;
  gebuehr1: Cent;
  gebuehr2: Cent;
  /** Basiszinssatz in Prozent (Bundesbank, halbjährlich) */
  basiszins: number;
  /** 40-€-Pauschale bei Unternehmen (§ 288 Abs. 5 BGB) */
  pauschale40: boolean;
}

export const STANDARD_REGELN: Regeln = {
  erinnerungTage: 7,
  mahnung1Tage: 14,
  mahnung2Tage: 14,
  fristTage: 10,
  gebuehr1: 500,
  gebuehr2: 500,
  // Stand 1. Juli 2025 – bitte in den Einstellungen aktuell halten
  basiszins: 1.27,
  pauschale40: false,
};

export const regeln = (): Regeln => ({ ...STANDARD_REGELN, ...einstellung<Partial<Regeln>>('mahnungen.regeln', {}) });
export const regelnSetzen = (r: Partial<Regeln>) => setzeEinstellung('mahnungen.regeln', { ...regeln(), ...r });

export const istVerbraucher = (kundeId: ID) => db.kunden.get(kundeId)?.art === 'privat';

/** Zinssatz: 5 Prozentpunkte über Basiszins bei Verbrauchern, 9 bei Unternehmen (§ 288 BGB) */
export const zinsSatz = (verbraucher: boolean, basiszins: number) => Math.round((basiszins + (verbraucher ? 5 : 9)) * 100) / 100;

export function verzugszinsen(betrag: Cent, satz: number, tage: number): Cent {
  if (betrag <= 0 || tage <= 0) return 0;
  return Math.round((betrag * satz * tage) / 100 / 365);
}

export const mahnungenZu = (rechnungId: ID) =>
  mahnungen.where((m) => m.rechnungId === rechnungId).sort((a, b) => a.stufe - b.stufe || a.erstelltAm.localeCompare(b.erstelltAm));

/** Verzug beginnt mit der ersten Mahnung/Erinnerung nach Fälligkeit, spätestens 30 Tage nach Fälligkeit (§ 286 BGB) */
export function verzugsbeginn(r: RechnungX): Datum {
  const dreissig = plusTage(r.faelligAm, 30);
  const erste = mahnungenZu(r.id).find((m) => m.status === 'versendet');
  const nachMahnung = erste ? plusTage(erste.datum, 1) : undefined;
  return nachMahnung && nachMahnung < dreissig ? nachMahnung : dreissig;
}

/** Welche Stufe ist heute fällig? `undefined` = nichts zu tun */
export function naechsteStufe(r: RechnungX, rg: Regeln = regeln(), stichtag: Datum = heute()): Stufe | undefined {
  if (!istUeberfaellig(r, stichtag)) return undefined;
  const stufe = r.mahnstufe ?? 0;
  if (stufe >= 3) return undefined;
  const bezug = stufe === 0 ? r.faelligAm : r.letzteMahnungAm ?? r.faelligAm;
  const tage = stufe === 0 ? rg.erinnerungTage : stufe === 1 ? rg.mahnung1Tage : rg.mahnung2Tage;
  return tageZwischen(bezug, stichtag) >= tage ? ((stufe + 1) as Stufe) : undefined;
}

/** Ab wann ist die nächste Stufe dran? */
export function naechsteStufeAm(r: RechnungX, rg: Regeln = regeln()): Datum | undefined {
  const stufe = r.mahnstufe ?? 0;
  if (stufe >= 3) return undefined;
  const bezug = stufe === 0 ? r.faelligAm : r.letzteMahnungAm ?? r.faelligAm;
  return plusTage(bezug, stufe === 0 ? rg.erinnerungTage : stufe === 1 ? rg.mahnung1Tage : rg.mahnung2Tage);
}

/** Beträge eines Schreibens berechnen */
export function berechnen(r: RechnungX, stufe: Stufe, rg: Regeln = regeln(), stichtag: Datum = heute(), kulanz = false) {
  const offen = offenerBetrag(r);
  const verbraucher = istVerbraucher(r.kundeId);
  const satz = zinsSatz(verbraucher, rg.basiszins);
  const seit = verzugsbeginn(r);
  const tage = stufe >= 2 ? Math.max(0, tageZwischen(seit, stichtag)) : 0;
  const zinsen = kulanz ? 0 : verzugszinsen(offen, satz, tage);
  let gebuehr = kulanz ? 0 : stufe === 2 ? rg.gebuehr1 : stufe === 3 ? rg.gebuehr2 : 0;
  if (!kulanz && stufe === 2 && !verbraucher && rg.pauschale40) gebuehr += 4000;
  return { offen, gebuehr, zinsen, zinsSatz: satz, zinsTage: tage, verzugSeit: stufe >= 2 ? seit : undefined, gesamt: offen + gebuehr + zinsen };
}

const hinweisSchluessel = (m: Mahnung) => `mahnung-freigabe:${m.id}`;

function freigabeHinweis(m: Mahnung) {
  const r = rechnungX(m.rechnungId);
  if (!r) return;
  const schluessel = hinweisSchluessel(m);
  if (db.hinweise.all().some((h) => h.schluessel === schluessel && h.status === 'offen')) return;
  const k = db.kunden.get(r.kundeId);
  db.hinweise.create({
    art: 'freigabe',
    titel: `${STUFE_LABEL[m.stufe]} an ${k?.name ?? 'Kunde'} senden?`,
    text: `${r.nummer} ist seit ${tageZwischen(r.faelligAm, heute())} Tagen überfällig, offen ${euro(m.offen)}${m.gebuehr || m.zinsen ? ` – mit Gebühr und Zinsen ${euro(m.offen + m.gebuehr + m.zinsen)}` : ''}. Das Schreiben ist vorbereitet.`,
    bezug: { typ: 'rechnungen', id: r.id },
    gewicht: m.stufe === 1 ? 66 : m.stufe === 2 ? 74 : 80,
    status: 'offen',
    schluessel,
    fuerRollen: ['chef', 'buero'],
    aktionen: [
      { id: 'mahnung.senden', label: 'Senden', primaer: true, payload: { mahnungId: m.id } },
      { id: 'mahnung.warten', label: 'Noch warten', payload: { mahnungId: m.id } },
      { id: 'mahnung.ansehen', label: 'Schreiben ansehen', payload: { mahnungId: m.id } },
    ],
    beispiel: m.beispiel,
  });
}

function hinweisSchliessen(m: Mahnung) {
  for (const h of db.hinweise.where((x) => x.schluessel === hinweisSchluessel(m) && x.status === 'offen')) hinweisErledigen(h.id);
}

/** Schreiben vorbereiten (ohne zu senden) */
export function vorbereiten(r: RechnungX, stufe: Stufe, rg: Regeln = regeln(), stichtag: Datum = heute()): Mahnung {
  const b = berechnen(r, stufe, rg, stichtag);
  const m = mahnungen.create({
    rechnungId: r.id,
    stufe,
    status: 'vorbereitet',
    datum: stichtag,
    offen: b.offen,
    gebuehr: b.gebuehr,
    zinsen: b.zinsen,
    zinsSatz: b.zinsSatz,
    zinsTage: b.zinsTage,
    verzugSeit: b.verzugSeit,
    frist: plusTage(stichtag, rg.fristTage),
    beispiel: r.beispiel,
  });
  freigabeHinweis(m);
  return m;
}

/** Tägliche Prüfung: neue Stufen vorbereiten, Erledigtes aufräumen. Gibt die neu vorbereiteten Schreiben zurück. */
export function pruefen(stichtag: Datum = heute()): { neu: Mahnung[]; verworfen: Mahnung[] } {
  const rg = regeln();
  const neu: Mahnung[] = [];
  const verworfen: Mahnung[] = [];
  // bezahlte/stornierte Rechnungen: vorbereitete Schreiben verwerfen
  for (const m of mahnungen.where((x) => x.status === 'vorbereitet')) {
    const r = rechnungX(m.rechnungId);
    if (!r || r.geloeschtAm || offenerBetrag(r) <= 0) {
      mahnungen.update(m.id, { status: 'verworfen' }, { text: 'Verworfen – Rechnung ist bezahlt' });
      hinweisSchliessen(m);
      verworfen.push(m);
    }
  }
  for (const r of offenePosten()) {
    const vorbereitet = mahnungen.where((x) => x.rechnungId === r.id && x.status === 'vorbereitet')[0];
    if (vorbereitet) {
      if (!vorbereitet.wartenBis || vorbereitet.wartenBis <= stichtag) {
        // Beträge aktualisieren und wieder fragen
        const b = berechnen(r, vorbereitet.stufe, rg, stichtag, vorbereitet.kulanz);
        mahnungen.update(vorbereitet.id, { offen: b.offen, gebuehr: b.gebuehr, zinsen: b.zinsen, zinsTage: b.zinsTage, zinsSatz: b.zinsSatz, verzugSeit: b.verzugSeit, wartenBis: undefined }, { leise: true });
        freigabeHinweis(mahnungen.get(vorbereitet.id)!);
      }
      continue;
    }
    const stufe = naechsteStufe(r, rg, stichtag);
    if (stufe) neu.push(vorbereiten(r, stufe, rg, stichtag));
  }
  return { neu, verworfen };
}

/** Freigabe: Schreiben als versendet markieren, Mahnstufe an der Rechnung setzen */
export function senden(mahnungId: ID): Mahnung | undefined {
  const m = mahnungen.get(mahnungId);
  if (!m || m.status !== 'vorbereitet') return m;
  const r = rechnungX(m.rechnungId);
  if (!r) return undefined;
  const b = berechnen(r, m.stufe, regeln(), heute(), m.kulanz);
  const neu = mahnungen.update(m.id, {
    status: 'versendet',
    datum: heute(),
    offen: b.offen,
    gebuehr: b.gebuehr,
    zinsen: b.zinsen,
    zinsTage: b.zinsTage,
    zinsSatz: b.zinsSatz,
    verzugSeit: b.verzugSeit,
    frist: plusTage(heute(), regeln().fristTage),
    versendetAm: new Date().toISOString(),
    wartenBis: undefined,
  })!;
  rechnungAendern(r.id, { mahnstufe: m.stufe, letzteMahnungAm: heute() }, { text: `${STUFE_LABEL[m.stufe]} versendet` });
  vermerken({ typ: 'kunden', id: r.kundeId }, 'mahnung.versendet', `${STUFE_LABEL[m.stufe]} zu ${r.nummer} versendet`);
  hinweisSchliessen(m);
  emit({ typ: 'mahnung.versendet', sammlung: 'mahnungen', objekt: neu, daten: { rechnungId: r.id, stufe: m.stufe } });
  return neu;
}

/** „Noch warten“: in X Tagen erneut fragen */
export function warten(mahnungId: ID, tage = 7) {
  const m = mahnungen.get(mahnungId);
  if (!m) return;
  mahnungen.update(m.id, { wartenBis: plusTage(heute(), tage) }, { text: `Zurückgestellt bis ${datum(plusTage(heute(), tage))}` });
  hinweisSchliessen(m);
}

export function verwerfen(mahnungId: ID) {
  const m = mahnungen.get(mahnungId);
  if (!m) return;
  mahnungen.update(m.id, { status: 'verworfen' }, { text: 'Verworfen' });
  hinweisSchliessen(m);
}

export function kulanzSetzen(mahnungId: ID, kulanz: boolean) {
  const m = mahnungen.get(mahnungId);
  const r = rechnungX(m?.rechnungId);
  if (!m || !r || m.status !== 'vorbereitet') return;
  const b = berechnen(r, m.stufe, regeln(), heute(), kulanz);
  mahnungen.update(m.id, { kulanz, gebuehr: b.gebuehr, zinsen: b.zinsen }, { leise: true });
}

/** Text des Mahnschreibens (Kundenbrief in Sie-Form) */
export function mahntext(m: Mahnung) {
  const r = rechnungX(m.rechnungId);
  const k = db.kunden.get(r?.kundeId);
  const b = db.betrieb.get('betrieb');
  const gesamt = m.offen + m.gebuehr + m.zinsen;
  const anrede = k?.art === 'privat' ? `Guten Tag ${k.name},` : 'Sehr geehrte Damen und Herren,';
  const rechnung = `unsere Rechnung ${r?.nummer} vom ${datum(r?.datum)} über ${euro(m.offen)}`;
  const absaetze: string[] = [];
  if (m.stufe === 1) {
    absaetze.push(`sicher ist es Ihrer Aufmerksamkeit entgangen: ${rechnung} war am ${datum(r?.faelligAm)} fällig und ist noch offen.`);
    absaetze.push(`Bitte überweisen Sie den Betrag bis zum ${datum(m.frist)}${b?.iban ? ` auf das Konto IBAN ${b.iban}` : ''}.`);
    absaetze.push('Falls Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.');
  } else {
    const vorher = mahnungenZu(m.rechnungId).filter((x) => x.status === 'versendet' && x.stufe < m.stufe);
    const letzte = vorher[vorher.length - 1];
    absaetze.push(
      `trotz ${letzte ? `unserer ${STUFE_LABEL[letzte.stufe]} vom ${datum(letzte.datum)}` : 'Fälligkeit'} ist ${rechnung} noch nicht beglichen.`,
    );
    absaetze.push(`Bitte überweisen Sie den Gesamtbetrag von ${euro(gesamt)} bis zum ${datum(m.frist)}${b?.iban ? ` auf das Konto IBAN ${b.iban}` : ''}.`);
    if (m.stufe === 3) absaetze.push('Geht der Betrag bis dahin nicht ein, leiten wir ohne weitere Ankündigung das gerichtliche Mahnverfahren ein.');
    absaetze.push('Falls Sie bereits gezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.');
  }
  return {
    betreff: `${STUFE_LABEL[m.stufe]} – Rechnung ${r?.nummer}`,
    anrede,
    absaetze,
    posten: [
      ['Offener Rechnungsbetrag', m.offen],
      ...(m.gebuehr ? [['Mahngebühr', m.gebuehr] as [string, Cent]] : []),
      ...(m.zinsen ? [[`Verzugszinsen ${String(m.zinsSatz).replace('.', ',')} % p. a. für ${m.zinsTage} Tage`, m.zinsen] as [string, Cent]] : []),
    ] as [string, Cent][],
    gesamt,
    gruss: ['Mit freundlichen Grüßen', b?.name ?? ''],
  };
}

export function mahnungMailto(m: Mahnung) {
  const r = rechnungX(m.rechnungId);
  const k = db.kunden.get(r?.kundeId);
  const t = mahntext(m);
  const body = [t.anrede, '', ...t.absaetze.flatMap((a) => [a, '']), ...t.posten.map(([l, c]) => `${l}: ${euro(c)}`), m.gebuehr || m.zinsen ? `Gesamt: ${euro(t.gesamt)}` : '', '', ...t.gruss].join('\n');
  return `mailto:${encodeURIComponent(k?.email ?? '')}?subject=${encodeURIComponent(t.betreff)}&body=${encodeURIComponent(body)}`;
}
