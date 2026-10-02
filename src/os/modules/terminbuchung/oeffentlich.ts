/**
 * Terminbuchung für echte Kunden: öffentliche Sicht (freie Termine je Terminart) und Verarbeitung der Buchung.
 * Infrastruktur (Sichten, Eingaben, Laden/Senden) liegt in `@modules/kundenbereich/oeffentlich`.
 */
import { db } from '@core/db';
import { benachrichtigen } from '@core/macher';
import { datumKurz, uhrzeit } from '@core/format';
import type { ID, Zeitpunkt } from '@core/objects';
import { betriebKopf, sichtSpeichern, type BetriebKopf, type OeffentlicheEingabe } from '@modules/kundenbereich/oeffentlich';
import { anfrageAnlegen } from '@modules/anfragen/daten';
import { kontextAusDb } from '../verfuegbarkeit/daten';
import { alleLinks, buchen, buchungsfenster, kundeErkennen, linkAufloesen, slotsFuer, type BuchungsAngaben, type BuchungsLink } from './daten';

export interface BuchungsSicht {
  stand: Zeitpunkt;
  betrieb: BetriebKopf;
  /** Vorbelegung, wenn der Link zu einem Kunden gehört */
  kunde?: { name: string; telefon?: string; email?: string; hatAdresse: boolean };
  fenster: { id: ID; name: string; beschreibung?: string; dauerMinuten: number; slots: { start: string; ende: string }[] }[];
}

/** Freie Termine je aktiver Terminart – dieselbe Berechnung wie auf der lokalen Buchungsseite */
export function buchungsSicht(link: BuchungsLink, jetzt = new Date()): BuchungsSicht {
  const k = kontextAusDb();
  const kunde = db.kunden.get(link.kundeId);
  return {
    stand: jetzt.toISOString(),
    betrieb: betriebKopf(),
    kunde: kunde ? { name: kunde.name, telefon: kunde.telefon, email: kunde.email, hatAdresse: !!kunde.adresse } : undefined,
    fenster: buchungsfenster
      .all()
      .filter((f) => f.aktiv)
      .map((f) => ({ id: f.id, name: f.name, beschreibung: f.beschreibung, dauerMinuten: f.dauerMinuten, slots: slotsFuer(f, k, jetzt).map((s) => ({ start: s.start, ende: s.ende })) })),
  };
}

export function buchungSichtenVeroeffentlichen(jetzt = new Date()): number {
  let n = 0;
  for (const link of Object.values(alleLinks())) n += Number(sichtSpeichern('buchung', link.token, buchungsSicht(link, jetzt)));
  return n;
}

/**
 * Buchung vom Kundengerät übernehmen. Ist der Termin inzwischen vergeben, geht nichts verloren:
 * Macher legt eine Anfrage mit dem Wunschtermin an und meldet sich beim Büro.
 */
export function buchungEingabe(e: OeffentlicheEingabe, jetzt = new Date()): string {
  if (e.typ === 'geoeffnet') return 'geöffnet';
  if (e.typ !== 'buchung') return 'unbekannt';
  const d = e.daten as Partial<BuchungsAngaben>;
  const angaben: BuchungsAngaben = {
    token: e.token,
    fensterId: String(d.fensterId ?? ''),
    start: String(d.start ?? ''),
    name: String(d.name ?? ''),
    telefon: String(d.telefon ?? ''),
    email: d.email || undefined,
    strasse: d.strasse || undefined,
    plz: d.plz || undefined,
    ort: d.ort || undefined,
    anliegen: d.anliegen || undefined,
  };
  const r = buchen(angaben, jetzt);
  if (r.ok) return `Termin ${r.termin.id} gebucht`;
  const link = linkAufloesen(e.token);
  const fenster = buchungsfenster.get(angaben.fensterId);
  const wunsch = angaben.start ? `${datumKurz(angaben.start)}, ${uhrzeit(angaben.start)} Uhr` : undefined;
  const erkannt = db.kunden.get(link?.kundeId) ?? kundeErkennen(db.kunden.all(), angaben);
  const { auftrag } = anfrageAnlegen({
    kundeId: erkannt?.id,
    neuerKunde: erkannt ? undefined : { name: angaben.name, telefon: angaben.telefon, email: angaben.email, adresse: angaben.strasse && angaben.ort ? { strasse: angaben.strasse, plz: angaben.plz ?? '', ort: angaben.ort } : undefined },
    titel: `${fenster?.name ?? 'Online-Termin'}: ${angaben.anliegen?.split('\n')[0].slice(0, 60) || angaben.name}`,
    beschreibung: angaben.anliegen,
    quelle: 'website',
    wunschtermin: wunsch ? `${wunsch} (online gewünscht, war nicht mehr frei)` : undefined,
  });
  benachrichtigen(`Online-Buchung ohne freien Termin: ${angaben.name}`, {
    text: `${wunsch ?? 'Wunschtermin'} war nicht mehr frei (${r.fehler}). Bitte ${angaben.telefon} anrufen und einen Termin finden.`,
    bezug: { typ: 'auftraege', id: auftrag.id },
    art: 'anfrage.rueckruf',
  });
  return `Als Anfrage angelegt (${r.fehler})`;
}
