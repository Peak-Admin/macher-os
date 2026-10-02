/**
 * Zusatzleistungen (Nachträge) – eigene Sammlung `zusatzleistungen`.
 * Text und Preis werden beim Erfassen festgehalten, weil der Kunde genau diesen Stand freigibt
 * (wie eine Angebotsposition). Leistung, Fotos, Unterschrift und Rechnung sind nur Verweise.
 */
import { defineCollection, vermerken } from '@core/db';
import { euro } from '@core/format';
import type { Auftrag, Basis, Cent, Einheit, ID, Position, Rechnung, Zeitpunkt } from '@core/objects';
import type { HinweisVorschlag } from '@core/modul';
import { rechnungAendern, type RechnungX } from '@modules/rechnungen/typen';
import { unterschriftSpeichern, type UnterschriftDaten } from '@modules/abnahme/unterschrift';
import type { UnterschriftEingabe } from '@ui/index';

export type Berechnung = 'leistung' | 'stunden' | 'pauschal';

export interface Zusatzleistung extends Basis {
  auftragId: ID;
  /** Was wurde zusätzlich gemacht? */
  text: string;
  berechnung: Berechnung;
  leistungId?: ID;
  menge: number;
  einheit: Einheit;
  /** Einzelpreis netto in Cent */
  einzelpreis: Cent;
  notiz?: string;
  fotoIds: ID[];
  status: 'offen' | 'freigegeben' | 'abgelehnt' | 'abgerechnet';
  freigabe?: UnterschriftDaten;
  /** Zustimmung ohne Unterschrift, z. B. „per E-Mail am 12.05.“ */
  freigabeAnders?: string;
  freigegebenAm?: Zeitpunkt;
  ablehnGrund?: string;
  rechnungId?: ID;
}

export const zusatzleistungen = defineCollection<Zusatzleistung>('zusatzleistungen');

export const STATUS_TEXT: Record<Zusatzleistung['status'], string> = {
  offen: 'Wartet auf Freigabe',
  freigegeben: 'Freigegeben, abrechenbar',
  abgelehnt: 'Abgelehnt',
  abgerechnet: 'Abgerechnet',
};

export const betrag = (z: Pick<Zusatzleistung, 'menge' | 'einzelpreis'>): Cent => Math.round(z.menge * z.einzelpreis);
export const abrechenbar = (z: Zusatzleistung) => z.status === 'freigegeben' && !z.rechnungId;

export function alsPosition(z: Zusatzleistung): Position {
  return {
    id: `zl-${z.id}`,
    art: z.berechnung === 'stunden' ? 'lohn' : z.berechnung === 'leistung' ? 'leistung' : 'pauschal',
    text: `Zusatzleistung: ${z.text}`,
    menge: z.menge,
    einheit: z.einheit,
    einzelpreis: z.einzelpreis,
    leistungId: z.leistungId,
  };
}

/** Darf diese Rechnung Nachträge aufnehmen? (kein Abschlag, keine Gutschrift, nur Entwurf) */
export function rechnungNimmtNachtraege(r: Pick<Rechnung, 'auftragId' | 'status' | 'art'>): boolean {
  return !!r.auftragId && r.status === 'entwurf' && (r.art === 'rechnung' || r.art === 'schluss' || r.art === 'teil');
}

/** Positionen anhängen – ohne Doppelte (gleiche Positions-ID) */
export function positionenAnhaengen(vorhanden: Position[], liste: Zusatzleistung[]): Position[] {
  const ids = new Set(vorhanden.map((p) => p.id));
  return [...vorhanden, ...liste.filter(abrechenbar).map(alsPosition).filter((p) => !ids.has(p.id))];
}

/** Offener Rechnungsentwurf zum Auftrag, der Nachträge aufnehmen kann */
export function passenderEntwurf(auftragId: ID, rechnungen: Rechnung[]): Rechnung | undefined {
  return rechnungen.find((r) => r.auftragId === auftragId && rechnungNimmtNachtraege(r));
}

export function zusatzHinweise(liste: Zusatzleistung[], auftraege: Auftrag[], rechnungen: Rechnung[] = []): HinweisVorschlag[] {
  const out: HinweisVorschlag[] = [];
  const nachAuftrag = new Map<ID, Zusatzleistung[]>();
  for (const z of liste) nachAuftrag.set(z.auftragId, [...(nachAuftrag.get(z.auftragId) ?? []), z]);
  for (const [auftragId, zs] of nachAuftrag) {
    const a = auftraege.find((x) => x.id === auftragId);
    if (!a) continue;
    const offen = zs.filter((z) => z.status === 'offen');
    if (offen.length)
      out.push({
        schluessel: `zusatz-freigabe:${auftragId}`,
        art: 'freigabe',
        titel: offen.length === 1 ? `Nachtrag freigeben lassen: ${offen[0].text}` : `${offen.length} Nachträge freigeben lassen: ${a.titel}`,
        text: `Ohne Freigabe des Kunden bekommst du die Zusatzarbeit oft nicht bezahlt (zusammen ${euro(offen.reduce((s, z) => s + betrag(z), 0))} netto).`,
        bezug: { typ: 'auftraege', id: auftragId },
        gewicht: 62,
        pfad: offen.length === 1 ? `/auftraege/zusatzleistungen/${offen[0].id}` : `/auftraege/zusatzleistungen?auftrag=${auftragId}`,
      });
    const offenAbzurechnen = zs.filter(abrechenbar);
    const entwurf = passenderEntwurf(auftragId, rechnungen);
    if (offenAbzurechnen.length && (entwurf || a.phase === 'abrechnung' || a.phase === 'erledigt'))
      out.push({
        schluessel: `zusatz-abrechnen:${auftragId}`,
        art: 'entscheidung',
        titel: `Freigegebene Nachträge abrechnen: ${a.titel}`,
        text: `${offenAbzurechnen.length === 1 ? '1 Nachtrag ist' : `${offenAbzurechnen.length} Nachträge sind`} freigegeben, aber in keiner Rechnung (${euro(offenAbzurechnen.reduce((s, z) => s + betrag(z), 0))} netto).`,
        bezug: { typ: 'auftraege', id: auftragId },
        gewicht: 70,
        aktionen: entwurf
          ? [{ aktion: 'zusatzleistungen.uebernehmen', label: `In Entwurf ${entwurf.nummer} übernehmen`, primaer: true, payload: { auftragId } }]
          : [{ aktion: 'rechnung.erstellen', label: 'Rechnung erstellen', primaer: true, payload: { auftragId } }],
        pfad: `/auftraege/zusatzleistungen?auftrag=${auftragId}`,
      });
  }
  return out;
}

// ------------------------------------------------------------------ Schreiben

export function freigeben(id: ID, e: UnterschriftEingabe) {
  const z = zusatzleistungen.get(id);
  if (!z || z.status !== 'offen') return;
  const sig = unterschriftSpeichern(z.auftragId, `Freigabe Nachtrag – ${z.text}`, e);
  zusatzleistungen.update(id, { status: 'freigegeben', freigabe: sig, freigegebenAm: sig.zeitpunkt }, { text: `Vom Kunden freigegeben (${sig.name})` });
  vermerken({ typ: 'auftraege', id: z.auftragId }, 'zusatzleistung.freigegeben', `Nachtrag „${z.text}“ (${euro(betrag(z))} netto) vom Kunden freigegeben`);
}

export function freigebenAnders(id: ID, wie: string) {
  const z = zusatzleistungen.get(id);
  if (!z || z.status !== 'offen') return;
  zusatzleistungen.update(id, { status: 'freigegeben', freigabeAnders: wie.trim(), freigegebenAm: new Date().toISOString() }, { text: `Freigegeben: ${wie.trim()}` });
  vermerken({ typ: 'auftraege', id: z.auftragId }, 'zusatzleistung.freigegeben', `Nachtrag „${z.text}“ freigegeben (${wie.trim()})`);
}

export function ablehnen(id: ID, grund: string) {
  const z = zusatzleistungen.get(id);
  if (!z || z.status !== 'offen') return;
  zusatzleistungen.update(id, { status: 'abgelehnt', ablehnGrund: grund.trim() || undefined }, { text: 'Vom Kunden abgelehnt' });
}

/** Freigegebene, noch nicht abgerechnete Nachträge eines Auftrags */
export const abrechenbareZu = (auftragId: ID) => zusatzleistungen.where((z) => z.auftragId === auftragId && abrechenbar(z));

/** Nachträge als abgerechnet in Rechnung `rechnung` markieren (nur noch abrechenbare) */
export function alsAbgerechnetMarkieren(ids: ID[], rechnung: Pick<Rechnung, 'id' | 'nummer'>): number {
  let n = 0;
  for (const id of ids) {
    const z = zusatzleistungen.get(id);
    if (!z || z.geloeschtAm || !abrechenbar(z)) continue;
    zusatzleistungen.update(id, { status: 'abgerechnet', rechnungId: rechnung.id }, { text: rechnung.nummer ? `In Rechnung ${rechnung.nummer} übernommen` : 'In Rechnungsentwurf übernommen' });
    n++;
  }
  return n;
}

/** An neue Rechnung hängen (Automation) – gibt die Anzahl zurück */
export function anRechnungHaengen(r: Rechnung): number {
  if (!rechnungNimmtNachtraege(r)) return 0;
  const offen = abrechenbareZu(r.auftragId!);
  if (!offen.length) return 0;
  const vorher = (r as RechnungX).zusatzleistungIds ?? [];
  rechnungAendern(
    r.id,
    { positionen: positionenAnhaengen(r.positionen, offen), zusatzleistungIds: [...vorher, ...offen.map((z) => z.id).filter((id) => !vorher.includes(id))] },
    { text: `${offen.length} freigegebene Nachträge übernommen` },
  );
  return alsAbgerechnetMarkieren(
    offen.map((z) => z.id),
    r,
  );
}

/** Rechnung storniert oder gelöscht → Nachträge wieder abrechenbar */
export function vonRechnungLoesen(rechnungId: ID): number {
  const betroffen = zusatzleistungen.where((z) => z.rechnungId === rechnungId);
  for (const z of betroffen) zusatzleistungen.update(z.id, { status: 'freigegeben', rechnungId: undefined }, { text: 'Rechnung storniert – wieder abrechenbar' });
  return betroffen.length;
}
