/**
 * Terminbuchung: Büro legt buchbare Terminarten mit Zeitfenstern fest, Kunden buchen selbst
 * über einen Link. Eine Buchung erzeugt Termin (`selbstGebucht`) + Anfrage (Auftrag in Phase `anfrage`)
 * und erkennt bestehende Kunden wieder.
 */
import { batch, db, defineCollection, neueId, vermerken } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { emit } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { naechsteNummer } from '@core/nummern';
import { datumKurz, isoDatum, plusTage, uhrzeit, wochenStart } from '@core/format';
import type { Auftrag, Basis, ID, Kunde, Termin, TerminArt } from '@core/objects';
import { freieSlots, geplanteStunden, kontextAusDb, verfuegbar, type PlanKontext, type Slot } from '../verfuegbarkeit/daten';

export interface Buchungsfenster extends Basis {
  /** Name für Kunden, z. B. „Besichtigung vor Ort“ */
  name: string;
  beschreibung?: string;
  art: TerminArt;
  dauerMinuten: number;
  /** buchbare Wochentage 1 = Mo … 7 = So */
  wochentage: number[];
  von: string;
  bis: string;
  /** frühestens so viele Stunden im Voraus */
  vorlaufStunden: number;
  /** höchstens so viele Tage im Voraus */
  horizontTage: number;
  /** Puffer zwischen Terminen (Fahrtzeit) */
  pufferMinuten: number;
  /** wer diese Termine übernimmt; leer = alle aktiven Chefs und Monteure */
  mitarbeiterIds: ID[];
  aktiv: boolean;
}

export const buchungsfenster = defineCollection<Buchungsfenster>('buchungsfenster');

// ------------------------------------------------------------------ Links

export interface BuchungsLink {
  token: string;
  kundeId?: ID;
  erstelltAm: string;
}

const LINKS = 'terminbuchung.links';

export function alleLinks(): Record<string, BuchungsLink> {
  return einstellung<Record<string, BuchungsLink>>(LINKS, {});
}

/** Token für den allgemeinen Link oder den Link eines Kunden – wird bei Bedarf angelegt */
export function buchungsToken(kundeId?: ID): string {
  const links = alleLinks();
  const vorhanden = Object.values(links).find((l) => (l.kundeId ?? '') === (kundeId ?? ''));
  if (vorhanden) return vorhanden.token;
  const token = neueId().replace(/-/g, '').slice(0, 16);
  setzeEinstellung(LINKS, { ...links, [token]: { token, kundeId, erstelltAm: new Date().toISOString() } });
  return token;
}

export function linkAufloesen(token: string | undefined): BuchungsLink | undefined {
  return token ? alleLinks()[token] : undefined;
}

export const buchungsUrl = (token: string) => `${globalThis.location?.origin ?? ''}/buchen/${token}`;

// ------------------------------------------------------------------ Slots

/** Mitarbeiter, die ein Fenster übernehmen können */
export function zustaendige(f: Pick<Buchungsfenster, 'mitarbeiterIds'>, k: PlanKontext): ID[] {
  if (f.mitarbeiterIds.length) return f.mitarbeiterIds.filter((id) => k.mitarbeiter.some((m) => m.id === id && m.aktiv));
  return k.mitarbeiter.filter((m) => m.aktiv && (m.rolle === 'monteur' || m.rolle === 'chef')).map((m) => m.id);
}

/** Buchbare Slots eines Fensters ab jetzt */
export function slotsFuer(f: Buchungsfenster, k: PlanKontext = kontextAusDb(), jetzt = new Date()): Slot[] {
  const ab = new Date(jetzt.getTime() + f.vorlaufStunden * 3_600_000);
  return freieSlots({
    von: isoDatum(ab),
    bis: plusTage(isoDatum(jetzt), f.horizontTage),
    dauerMinuten: f.dauerMinuten,
    mitarbeiterIds: zustaendige(f, k),
    rasterMinuten: f.dauerMinuten >= 60 ? 60 : 30,
    zeitVon: f.von,
    zeitBis: f.bis,
    wochentage: f.wochentage,
    pufferMinuten: f.pufferMinuten,
    ab,
    kontext: k,
  });
}

/** Wer übernimmt einen Slot? Wer in der Woche am wenigsten verplant ist. */
export function mitarbeiterWaehlen(slot: Slot, k: PlanKontext): ID | undefined {
  const w = wochenStart(isoDatum(new Date(slot.start)));
  return [...slot.mitarbeiterIds].sort((a, b) => geplanteStunden(a, w, plusTage(w, 6), k) - geplanteStunden(b, w, plusTage(w, 6), k))[0];
}

// ------------------------------------------------------------------ Kunde erkennen

export const telefonNormal = (t: string | undefined) => {
  const d = (t ?? '').replace(/[^\d+]/g, '').replace(/^\+49/, '0').replace(/^0049/, '0');
  return d.length >= 6 ? d : '';
};

/** Bestehenden Kunden über E-Mail oder Telefonnummer wiedererkennen */
export function kundeErkennen(kunden: Kunde[], angaben: { email?: string; telefon?: string }): Kunde | undefined {
  const mail = angaben.email?.trim().toLowerCase();
  const tel = telefonNormal(angaben.telefon);
  return (
    (mail ? kunden.find((k) => k.email?.trim().toLowerCase() === mail) : undefined) ??
    (tel ? kunden.find((k) => telefonNormal(k.telefon) === tel || k.ansprechpartner.some((a) => telefonNormal(a.telefon) === tel)) : undefined)
  );
}

// ------------------------------------------------------------------ Buchen

export interface BuchungsAngaben {
  token: string;
  fensterId: ID;
  start: string;
  name: string;
  telefon: string;
  email?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  anliegen?: string;
}

export type BuchungsErgebnis = { ok: true; termin: Termin; auftrag: Auftrag; kunde: Kunde; neuerKunde: boolean } | { ok: false; fehler: string };

export function pruefeAngaben(a: Pick<BuchungsAngaben, 'name' | 'telefon' | 'email'>): Partial<Record<'name' | 'telefon' | 'email', string>> {
  const f: Partial<Record<'name' | 'telefon' | 'email', string>> = {};
  if (a.name.trim().length < 2) f.name = 'Bitte gib deinen Namen an.';
  if (!telefonNormal(a.telefon)) f.telefon = 'Bitte gib eine Telefonnummer an, unter der wir dich erreichen.';
  if (a.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) f.email = 'Diese E-Mail-Adresse sieht nicht richtig aus.';
  return f;
}

export function buchen(a: BuchungsAngaben, jetzt = new Date()): BuchungsErgebnis {
  const link = linkAufloesen(a.token);
  if (!link) return { ok: false, fehler: 'Dieser Buchungslink ist nicht mehr gültig.' };
  const f = buchungsfenster.get(a.fensterId);
  if (!f || !f.aktiv || f.geloeschtAm) return { ok: false, fehler: 'Diese Terminart kann gerade nicht gebucht werden.' };
  if (Object.keys(pruefeAngaben(a)).length) return { ok: false, fehler: 'Bitte prüfe deine Angaben.' };

  const k = kontextAusDb();
  // Slot erneut prüfen – vielleicht hat in der Zwischenzeit jemand anderes gebucht
  const slot = slotsFuer(f, k, jetzt).find((s) => s.start === a.start);
  if (!slot) return { ok: false, fehler: 'Dieser Termin ist leider gerade vergeben worden. Bitte wähle einen anderen.' };
  const mitarbeiterId = mitarbeiterWaehlen(slot, k);
  if (!mitarbeiterId || !verfuegbar(mitarbeiterId, slot.start, slot.ende, { kontext: k })) return { ok: false, fehler: 'Dieser Termin ist leider gerade vergeben worden. Bitte wähle einen anderen.' };

  let ergebnis: BuchungsErgebnis | undefined;
  batch(() => {
    const vorgegeben = db.kunden.get(link.kundeId);
    const erkannt = vorgegeben ?? kundeErkennen(db.kunden.all(), a);
    const adresse = a.strasse?.trim() && a.ort?.trim() ? { strasse: a.strasse.trim(), plz: a.plz?.trim() ?? '', ort: a.ort.trim() } : undefined;
    const kunde =
      erkannt ??
      db.kunden.create({
        art: 'privat',
        name: a.name.trim(),
        telefon: a.telefon.trim(),
        email: a.email?.trim() || undefined,
        adresse,
        ansprechpartner: [],
        quelle: 'website',
      });
    // fehlende Kontaktdaten beim erkannten Kunden ergänzen (nichts überschreiben)
    if (erkannt) {
      const patch: Partial<Kunde> = {};
      if (!erkannt.telefon && a.telefon.trim()) patch.telefon = a.telefon.trim();
      if (!erkannt.email && a.email?.trim()) patch.email = a.email.trim();
      if (!erkannt.adresse && adresse) patch.adresse = adresse;
      if (Object.keys(patch).length) db.kunden.update(erkannt.id, patch, { text: 'Kontaktdaten aus Online-Buchung ergänzt' });
    }
    let ort = adresse ? db.orte.all().find((o) => o.kundeId === kunde.id && o.adresse.strasse.toLowerCase() === adresse.strasse.toLowerCase()) : db.orte.all().find((o) => o.kundeId === kunde.id);
    if (!ort && (adresse ?? kunde.adresse)) ort = db.orte.create({ kundeId: kunde.id, bezeichnung: 'Einsatzort', art: 'haus', adresse: (adresse ?? kunde.adresse)! });

    const auftrag = db.auftraege.create({
      nummer: naechsteNummer('auftrag'),
      titel: `${f.name}: ${a.anliegen?.trim() ? a.anliegen.trim().split('\n')[0].slice(0, 60) : kunde.name}`,
      art: f.art === 'wartung' ? 'wartung' : 'kundendienst',
      phase: 'anfrage',
      kundeId: kunde.id,
      ortId: ort?.id,
      beschreibung: a.anliegen?.trim() || undefined,
      quelle: 'website',
      wunschtermin: `${datumKurz(slot.start)}, ${uhrzeit(slot.start)} Uhr (online gebucht)`,
      geplanteStunden: f.dauerMinuten / 60,
    });
    const termin = db.termine.create({
      art: f.art,
      titel: `${f.name} – ${kunde.name}`,
      start: slot.start,
      ende: slot.ende,
      auftragId: auftrag.id,
      kundeId: kunde.id,
      ortId: ort?.id,
      mitarbeiterIds: [mitarbeiterId],
      status: 'geplant',
      selbstGebucht: true,
      notiz: a.anliegen?.trim() || undefined,
    });
    vermerken({ typ: 'auftraege', id: auftrag.id }, 'termin.selbst-gebucht', `Kunde hat online gebucht: ${datumKurz(slot.start)}, ${uhrzeit(slot.start)} Uhr`);
    ergebnis = { ok: true, termin, auftrag, kunde, neuerKunde: !erkannt };
  });
  const r = ergebnis as Extract<BuchungsErgebnis, { ok: true }>;
  emit({ typ: 'anfrage.eingegangen', sammlung: 'auftraege', objekt: r.auftrag, daten: { kanal: 'website', terminId: r.termin.id } });
  benachrichtigen(`Online gebucht: ${r.kunde.name}`, { text: `${f.name} am ${datumKurz(r.termin.start)}, ${uhrzeit(r.termin.start)} Uhr – bitte bestätigen.`, bezug: { typ: 'termine', id: r.termin.id }, wichtig: true });
  erledigt('terminbuchung.buchung', `Online-Buchung aufgenommen: ${r.kunde.name}`, {
    text: `${r.neuerKunde ? 'Kunde angelegt' : 'Kunde wiedererkannt'}, Anfrage ${r.auftrag.nummer} und Termin angelegt.`,
    bezug: { typ: 'auftraege', id: r.auftrag.id },
    minuten: 10,
  });
  return r;
}

/** Selbst gebuchte Termine, die das Büro noch bestätigen muss */
export function zuBestaetigen(termine: Termin[], jetzt = new Date()): Termin[] {
  const j = jetzt.toISOString();
  return termine.filter((t) => t.selbstGebucht && t.status === 'geplant' && !t.geloeschtAm && t.ende >= j).sort((a, b) => a.start.localeCompare(b.start));
}

/** Startwerte: zwei typische Terminarten */
export function standardFenster(): Omit<Buchungsfenster, keyof Basis>[] {
  return [
    { name: 'Besichtigung vor Ort', beschreibung: 'Wir schauen uns alles an und besprechen, was zu tun ist.', art: 'besichtigung', dauerMinuten: 60, wochentage: [1, 2, 3, 4, 5], von: '08:00', bis: '15:00', vorlaufStunden: 24, horizontTage: 21, pufferMinuten: 30, mitarbeiterIds: [], aktiv: true },
    { name: 'Kundendienst / Reparatur', beschreibung: 'Für kleinere Reparaturen und Störungen.', art: 'einsatz', dauerMinuten: 90, wochentage: [1, 2, 3, 4, 5], von: '08:00', bis: '14:00', vorlaufStunden: 24, horizontTage: 14, pufferMinuten: 30, mitarbeiterIds: [], aktiv: true },
  ];
}
