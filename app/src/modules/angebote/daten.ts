/**
 * Angebote: Entwurf → versendet → angenommen/abgelehnt/abgelaufen, mit Versionen.
 * Reine Regeln (Nachfassen, Ablauf, Summen) sind ohne Datenbank testbar.
 */
import { db, neueId, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { euro, heute, plusTage, summen, tageZwischen, datum } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import type { Angebot, Artikel, Auftrag, ID, Leistung, Phase, Position } from '@core/objects';

export const STATUS_TEXT: Record<Angebot['status'], string> = {
  entwurf: 'Entwurf',
  versendet: 'Versendet',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
  abgelaufen: 'Abgelaufen',
};

export const STATUS_TON: Record<Angebot['status'], 'neutral' | 'aktiv' | 'erfolg' | 'achtung'> = {
  entwurf: 'neutral',
  versendet: 'aktiv',
  angenommen: 'erfolg',
  abgelehnt: 'neutral',
  abgelaufen: 'achtung',
};

export const nachfassenTage = () => einstellung('angebote.nachfassenTage', 7);
export const gueltigTage = () => einstellung('angebote.gueltigTage', 30);

// ------------------------------------------------------------------ Positionen

export function positionAusLeistung(l: Leistung, menge = 1): Position {
  return { id: neueId('p'), art: l.einheit === 'h' ? 'lohn' : 'leistung', text: l.name, menge, einheit: l.einheit, einzelpreis: l.preis, leistungId: l.id };
}

export function positionAusArtikel(a: Artikel, menge = 1): Position {
  return { id: neueId('p'), art: 'material', text: a.name, menge, einheit: a.einheit, einzelpreis: a.vk, artikelId: a.id };
}

export function freiePosition(): Position {
  return { id: neueId('p'), art: 'pauschal', text: '', menge: 1, einheit: 'Psch', einzelpreis: 0 };
}

/** USt-Satz des Betriebs (0 bei Kleinunternehmer) */
export function ustSatz(): number {
  const b = db.betrieb.get('betrieb');
  return b?.kleinunternehmer ? 0 : (b?.ustSatz ?? 19);
}

export function angebotSummen(a: Pick<Angebot, 'positionen' | 'rabattProzent'>, ust = ustSatz()) {
  return summen(a.positionen, ust, a.rabattProzent ?? 0);
}

/** Summe der Bedarfs-/Alternativpositionen (nicht in der Gesamtsumme) */
export function optionalSumme(a: Pick<Angebot, 'positionen'>): number {
  return a.positionen.filter((p) => p.optional && p.art !== 'text').reduce((s, p) => s + Math.round(p.menge * p.einzelpreis), 0);
}

// ------------------------------------------------------------------ Versionen

/** Neueste Version je Angebotsnummer */
export function istAktuelleVersion(a: Angebot, alle: Angebot[]): boolean {
  return !alle.some((x) => x.nummer === a.nummer && x.id !== a.id && x.version > a.version);
}

export function versionen(a: Angebot, alle: Angebot[] = db.angebote.all()): Angebot[] {
  return alle.filter((x) => x.nummer === a.nummer).sort((x, y) => y.version - x.version);
}

// ------------------------------------------------------------------ Regeln (rein)

/**
 * Versendet, seit `tage` Tagen ohne Antwort und noch gültig → nachfassen.
 * Nach dem Nachfassen (`nachgefasstAm`) beginnt die Frist neu.
 */
export function nachfassenFaellig(a: Angebot, tag: string, tage: number, nachgefasstAm: string | undefined = nachgefasst(a.id)): boolean {
  if (a.status !== 'versendet' || !a.versendetAm) return false;
  const seit = [a.versendetAm.slice(0, 10), nachgefasstAm?.slice(0, 10)].filter(Boolean).sort().pop()!;
  return tageZwischen(seit, tag) >= tage && a.gueltigBis >= tag;
}

/** Wann zuletzt nachgefasst wurde (gespeichert als Einstellung, kein Kernfeld) */
export function nachgefasst(angebotId: ID): string | undefined {
  try {
    return einstellung<string | undefined>(`angebote.nachgefasst.${angebotId}`, undefined);
  } catch {
    return undefined;
  }
}

export function alsNachgefasstMarkieren(angebotId: ID) {
  const a = db.angebote.get(angebotId);
  if (!a) return;
  setzeEinstellung(`angebote.nachgefasst.${angebotId}`, new Date().toISOString());
  vermerken({ typ: 'angebote', id: a.id }, 'angebot.nachgefasst', 'Beim Kunden nachgefasst');
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'angebot.nachgefasst', `Zu Angebot ${a.nummer} nachgefasst`);
  db.aufgaben
    .where((x) => !x.erledigt && x.quelle === 'nachfassen' && x.bezug?.typ === 'angebote' && x.bezug.id === a.id)
    .forEach((x) => db.aufgaben.update(x.id, { erledigt: true, erledigtAm: new Date().toISOString() }));
}

/** Versendet und läuft in den nächsten `tage` Tagen ab */
export function laeuftBaldAb(a: Angebot, tag: string, tage = 3): boolean {
  if (a.status !== 'versendet') return false;
  const rest = tageZwischen(tag, a.gueltigBis);
  return rest >= 0 && rest <= tage;
}

export function istAbgelaufen(a: Angebot, tag: string): boolean {
  return a.status === 'versendet' && a.gueltigBis < tag;
}

const PHASEN_REIHE: Phase[] = ['anfrage', 'besichtigung', 'angebot', 'beauftragt', 'in_arbeit', 'abnahme', 'abrechnung', 'erledigt'];
/** Phase nur vorwärts setzen, nie zurück */
export function phaseVor(aktuell: Phase, ziel: Phase): boolean {
  if (aktuell === 'verloren') return true;
  return PHASEN_REIHE.indexOf(ziel) > PHASEN_REIHE.indexOf(aktuell);
}

// ------------------------------------------------------------------ Aktionen

export function standardEinleitung(a?: Auftrag): string {
  return `Vielen Dank für die Anfrage${a ? ` „${a.titel}“` : ''}. Gerne bieten wir folgende Leistungen an:`;
}

export function neuesAngebot(auftragId: ID, positionen?: Position[]): Angebot {
  const a = db.auftraege.get(auftragId);
  if (!a) throw new Error('Auftrag nicht gefunden.');
  const ausLeistungen = (a.leistungIds ?? []).map((id) => db.leistungen.get(id)).filter((l): l is Leistung => !!l).map((l) => positionAusLeistung(l));
  const angebot = db.angebote.create({
    nummer: naechsteNummer('angebot'),
    auftragId: a.id,
    kundeId: a.kundeId,
    titel: a.titel,
    einleitung: standardEinleitung(a),
    positionen: positionen ?? ausLeistungen,
    status: 'entwurf',
    datum: heute(),
    gueltigBis: plusTage(heute(), gueltigTage()),
    version: 1,
  });
  if (phaseVor(a.phase, 'angebot') && a.phase !== 'verloren') db.auftraege.update(a.id, { phase: 'angebot' }, { text: 'Angebot in Arbeit' });
  vermerken({ typ: 'auftraege', id: a.id }, 'angebot.entwurf', `Angebot ${angebot.nummer} angelegt`);
  return angebot;
}

/** Offener Entwurf zum Auftrag (neueste Version) – oder ein neuer */
export function entwurfFuer(auftragId: ID): Angebot {
  const alle = db.angebote.all();
  const e = alle.filter((x) => x.auftragId === auftragId && x.status === 'entwurf' && istAktuelleVersion(x, alle)).sort((x, y) => y.erstelltAm.localeCompare(x.erstelltAm))[0];
  return e ?? neuesAngebot(auftragId);
}

/**
 * Positionen an ein Angebot hängen. `ersetzen`: Positionen, die aus derselben Quelle (Aufmaß, Kalkulation) schon
 * übernommen wurden – sie werden an ihrer Stelle ersetzt statt doppelt angehängt.
 */
export function positionenAnhaengen(angebotId: ID, neu: Position[], ersetzen: ID[] = []): Angebot | undefined {
  const a = db.angebote.get(angebotId);
  if (!a) return undefined;
  const weg = new Set(ersetzen);
  const stelle = a.positionen.findIndex((p) => weg.has(p.id));
  const rest = a.positionen.filter((p) => !weg.has(p.id));
  const positionen = stelle < 0 ? [...rest, ...neu] : [...rest.slice(0, stelle), ...neu, ...rest.slice(stelle)];
  return db.angebote.update(a.id, { positionen }, { text: `${neu.length} Positionen übernommen` });
}

export function neueVersion(id: ID): Angebot | undefined {
  const alt = db.angebote.get(id);
  if (!alt) return undefined;
  const hoechste = Math.max(...versionen(alt).map((v) => v.version));
  const neu = db.angebote.create({
    nummer: alt.nummer,
    auftragId: alt.auftragId,
    kundeId: alt.kundeId,
    titel: alt.titel,
    einleitung: alt.einleitung,
    positionen: alt.positionen.map((p) => ({ ...p, id: neueId('p') })),
    rabattProzent: alt.rabattProzent,
    status: 'entwurf',
    datum: heute(),
    gueltigBis: plusTage(heute(), gueltigTage()),
    version: hoechste + 1,
  });
  vermerken({ typ: 'auftraege', id: alt.auftragId }, 'angebot.version', `Angebot ${alt.nummer}: Version ${neu.version} angelegt`);
  return neu;
}

export function versenden(id: ID, weg: 'email' | 'anders' = 'email'): Angebot | undefined {
  const a = db.angebote.get(id);
  if (!a) return undefined;
  const neu = db.angebote.update(a.id, { status: 'versendet', versendetAm: new Date().toISOString(), datum: a.status === 'entwurf' ? heute() : a.datum }, { text: weg === 'email' ? 'Per E-Mail versendet' : 'Als versendet markiert' });
  const auftrag = db.auftraege.get(a.auftragId);
  if (auftrag && phaseVor(auftrag.phase, 'angebot') && auftrag.phase !== 'verloren') db.auftraege.update(auftrag.id, { phase: 'angebot' });
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'angebot.versendet', `Angebot ${a.nummer} (V${a.version}) versendet`);
  emit({ typ: 'angebot.versendet', sammlung: 'angebote', objekt: neu });
  return neu;
}

/** Arbeitsstunden laut Angebot: Stundenpositionen plus Zeitansatz der Leistungen (auf halbe Stunden gerundet) */
export function angebotStunden(a: Pick<Angebot, 'positionen'>, leistungen: Leistung[] = db.leistungen.all()): number {
  const minuten = a.positionen
    .filter((p) => !p.optional && p.menge > 0)
    .reduce((s, p) => s + (p.einheit === 'h' ? p.menge * 60 : p.menge * (leistungen.find((l) => l.id === p.leistungId)?.minuten ?? 0)), 0);
  return Math.ceil(minuten / 30) / 2;
}

/** Angebot annehmen – egal ob im Büro eingetragen oder vom Kunden im Kundenbereich (`herkunft`) */
export function annehmen(id: ID, herkunft?: { name: string; quelle: 'portal'; text?: string }): Angebot | undefined {
  const a = db.angebote.get(id);
  if (!a) return undefined;
  const zeit = new Date().toISOString();
  const neu = db.angebote.update(a.id, { status: 'angenommen', entschiedenAm: zeit }, { text: herkunft?.text ?? 'Vom Kunden angenommen' });
  const auftrag = db.auftraege.get(a.auftragId);
  if (auftrag && phaseVor(auftrag.phase, 'beauftragt')) {
    // Planung braucht Stunden: aus dem Angebot übernehmen, wenn noch keine geschätzt sind
    const stunden = auftrag.geplanteStunden ? undefined : angebotStunden(a) || undefined;
    db.auftraege.update(auftrag.id, { phase: 'beauftragt', verlorenGrund: undefined, abgeschlossenAm: undefined, ...(stunden ? { geplanteStunden: stunden } : {}) }, { text: `Beauftragt (Angebot ${a.nummer} angenommen)` });
  }
  // ältere offene Versionen sind damit erledigt
  versionen(a)
    .filter((v) => v.id !== a.id && (v.status === 'versendet' || v.status === 'entwurf'))
    .forEach((v) => db.angebote.update(v.id, { status: 'abgelehnt', entschiedenAm: new Date().toISOString() }, { text: `Ersetzt durch Version ${a.version}` }));
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'angebot.angenommen', `Angebot ${a.nummer} angenommen – ${euro(angebotSummen(a).brutto)}`);
  emit({ typ: 'angebot.angenommen', sammlung: 'angebote', objekt: neu, daten: herkunft ? { angebotId: a.id, auftragId: a.auftragId, name: herkunft.name, quelle: herkunft.quelle, zeit } : undefined });
  return neu;
}

export function ablehnen(id: ID, grund?: string): Angebot | undefined {
  const a = db.angebote.get(id);
  if (!a) return undefined;
  const neu = db.angebote.update(a.id, { status: 'abgelehnt', entschiedenAm: new Date().toISOString() }, { text: `Abgelehnt${grund ? ': ' + grund : ''}` });
  const nochOffen = db.angebote.where((x) => x.auftragId === a.auftragId && x.id !== a.id && (x.status === 'versendet' || x.status === 'entwurf' || x.status === 'angenommen'));
  const auftrag = db.auftraege.get(a.auftragId);
  if (auftrag && !nochOffen.length && ['anfrage', 'besichtigung', 'angebot'].includes(auftrag.phase)) {
    db.auftraege.update(auftrag.id, { phase: 'verloren', verlorenGrund: grund || 'Angebot abgelehnt', abgeschlossenAm: new Date().toISOString() }, { text: `Angebot abgelehnt${grund ? ': ' + grund : ''}` });
  }
  return neu;
}

export const ABLEHN_GRUENDE = ['Zu teuer', 'Anderen Betrieb beauftragt', 'Projekt verschoben', 'Keine Rückmeldung', 'Sonstiges'];

// ------------------------------------------------------------------ Versand

export function mailtoLink(a: Angebot): string {
  const k = db.kunden.get(a.kundeId);
  const b = db.betrieb.get('betrieb');
  const s = angebotSummen(a);
  const betreff = `Angebot ${a.nummer}${a.version > 1 ? ` (Version ${a.version})` : ''} – ${a.titel}`;
  const text = [
    `Guten Tag${k ? ' ' + (k.ansprechpartner[0]?.name ?? k.name) : ''},`,
    '',
    `anbei unser Angebot ${a.nummer} für „${a.titel}“.`,
    `Gesamtsumme: ${euro(s.brutto)} (inkl. USt.)`,
    `Gültig bis: ${datum(a.gueltigBis)}`,
    '',
    'Bei Fragen melden Sie sich gern. Wir freuen uns auf Ihren Auftrag.',
    '',
    'Viele Grüße',
    b?.name ?? '',
    b?.telefon ?? '',
  ].join('\n');
  return `mailto:${encodeURIComponent(k?.email ?? '')}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
}
