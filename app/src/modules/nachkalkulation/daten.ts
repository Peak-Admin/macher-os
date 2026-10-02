/**
 * Nachkalkulation: Soll (angenommenes Angebot, geplante Stunden, Kalkulation) gegen Ist
 * (Zeiten, Material, Belege) – mit Erklärung in Worten und Lerneffekt über erledigte Aufträge.
 */
import { euro, summen } from '@core/format';
import type { Angebot, Auftrag, Cent, ID, Position, Rechnung } from '@core/objects';
import type { Basisdaten } from '../kosten/basis';
import { prozentText, stundenText } from '../kosten/basis';
import { auftragKosten, type AuftragKosten } from '../kosten/daten';
import { rechnungZaehlt, umsatzJeAuftrag } from '../ertrag/daten';
import type { SollKalkulation } from './kalkulation';

/** Abweichungen innerhalb dieser Spanne gelten als „im Plan“ */
export const TOLERANZ = 0.1;

export function angenommenesAngebot(auftragId: ID, angebote: Angebot[]): Angebot | undefined {
  return angebote
    .filter((a) => a.auftragId === auftragId && a.status === 'angenommen')
    .sort((x, y) => y.version - x.version || (y.entschiedenAm ?? '').localeCompare(x.entschiedenAm ?? ''))[0];
}

function zaehlt(p: Position) {
  return !p.optional && p.art !== 'text' && p.art !== 'zwischensumme';
}

/** Arbeitsminuten aus Positionen: Leistung × Minuten je Einheit, Lohnpositionen in Stunden */
export function positionsMinuten(positionen: Position[], b: Pick<Basisdaten, 'leistungen'>) {
  const jeLeistung = new Map<ID, number>();
  let gesamt = 0;
  for (const p of positionen) {
    if (!zaehlt(p)) continue;
    const l = p.leistungId ? b.leistungen.find((x) => x.id === p.leistungId) : undefined;
    if (l?.minuten) {
      const min = p.menge * l.minuten;
      gesamt += min;
      jeLeistung.set(l.id, (jeLeistung.get(l.id) ?? 0) + min);
    } else if (p.art === 'lohn' && p.einheit === 'h') {
      gesamt += p.menge * 60;
    }
  }
  return { gesamt, jeLeistung };
}

/** Material-EK aus Positionen: Materialpositionen und Material der Leistungen */
export function positionsMaterial(positionen: Position[], b: Pick<Basisdaten, 'leistungen' | 'artikel'>): Cent | undefined {
  let summe = 0;
  let gefunden = false;
  const ek = (id: ID) => b.artikel.find((a) => a.id === id)?.ek;
  for (const p of positionen) {
    if (!zaehlt(p)) continue;
    if (p.artikelId && ek(p.artikelId) != null) {
      summe += Math.round(p.menge * ek(p.artikelId)!);
      gefunden = true;
    }
    const l = p.leistungId ? b.leistungen.find((x) => x.id === p.leistungId) : undefined;
    for (const m of l?.material ?? []) {
      const preis = ek(m.artikelId);
      if (preis == null) continue;
      summe += Math.round(m.menge * p.menge * preis);
      gefunden = true;
    }
  }
  return gefunden ? summe : undefined;
}

export interface Soll {
  angebotId?: ID;
  /** Netto-Angebotssumme bzw. Verkaufspreis laut Kalkulation */
  umsatz?: Cent;
  minuten?: number;
  minutenQuelle?: 'kalkulation' | 'angebot' | 'auftrag';
  material?: Cent;
  materialQuelle?: 'kalkulation' | 'angebot';
  kosten?: Cent;
  kostenQuelle?: 'kalkulation' | 'geschaetzt';
}

export const QUELLE_TEXT = {
  kalkulation: 'aus der Kalkulation',
  angebot: 'aus dem angenommenen Angebot',
  auftrag: 'aus den geplanten Stunden am Auftrag',
  geschaetzt: 'Soll-Stunden × Ø-Kostensatz + Soll-Material',
} as const;

/** Durchschnittlicher Kostensatz: aus den gebuchten Zeiten, sonst aus dem aktiven Team */
export function durchschnittKostensatz(ist: AuftragKosten | undefined, b: Pick<Basisdaten, 'mitarbeiter'>): Cent | undefined {
  const mitSatz = (ist?.lohnZeilen ?? []).filter((z) => z.kostensatz > 0 && z.minuten > 0);
  const min = mitSatz.reduce((s, z) => s + z.minuten, 0);
  if (min > 0) return Math.round(mitSatz.reduce((s, z) => s + z.kostensatz * z.minuten, 0) / min);
  const team = b.mitarbeiter.filter((m) => m.aktiv && m.rolle !== 'buero' && m.kostensatz > 0);
  if (!team.length) return undefined;
  return Math.round(team.reduce((s, m) => s + m.kostensatz, 0) / team.length);
}

export function sollFuer(auftrag: Auftrag, b: Basisdaten, kalkulation?: SollKalkulation, ist?: AuftragKosten): Soll {
  const s: Soll = {};
  const angebot = angenommenesAngebot(auftrag.id, b.angebote);
  if (angebot) {
    s.angebotId = angebot.id;
    s.umsatz = summen(angebot.positionen, 0, angebot.rabattProzent ?? 0).netto;
  }
  if (kalkulation?.netto != null) s.umsatz ??= kalkulation.netto;

  if (kalkulation?.stunden != null) {
    s.minuten = Math.round(kalkulation.stunden * 60);
    s.minutenQuelle = 'kalkulation';
  } else if (auftrag.geplanteStunden) {
    // bewusst gesetzt – zuverlässiger als die Summe der Leistungsminuten (die oft unvollständig gepflegt sind)
    s.minuten = Math.round(auftrag.geplanteStunden * 60);
    s.minutenQuelle = 'auftrag';
  } else if (angebot && positionsMinuten(angebot.positionen, b).gesamt > 0) {
    s.minuten = Math.round(positionsMinuten(angebot.positionen, b).gesamt);
    s.minutenQuelle = 'angebot';
  }

  if (kalkulation?.material != null) {
    s.material = kalkulation.material;
    s.materialQuelle = 'kalkulation';
  } else if (angebot) {
    const m = positionsMaterial(angebot.positionen, b);
    if (m != null) {
      s.material = m;
      s.materialQuelle = 'angebot';
    }
  }

  if (kalkulation?.kosten != null) {
    s.kosten = kalkulation.kosten;
    s.kostenQuelle = 'kalkulation';
  } else if (s.minuten != null) {
    const satz = durchschnittKostensatz(ist, b);
    if (satz != null) {
      s.kosten = Math.round((s.minuten / 60) * satz) + (s.material ?? 0);
      s.kostenQuelle = 'geschaetzt';
    }
  }
  return s;
}

export interface Vergleich {
  bereich: 'stunden' | 'material' | 'kosten';
  titel: string;
  /** Minuten bei Stunden, sonst Cent */
  soll?: number;
  ist: number;
  /** ist / soll − 1 */
  abweichung?: number;
}

export interface Nachkalkulation {
  auftragId: ID;
  soll: Soll;
  ist: AuftragKosten;
  /** abgerechneter Umsatz netto (Rechnungen) */
  umsatz?: Cent;
  db?: Cent;
  vergleiche: Vergleich[];
  saetze: string[];
  bewertung: { ton: 'neutral' | 'erfolg' | 'achtung'; text: string };
  hatSoll: boolean;
  hatIst: boolean;
}

/** Abweichung nur, wenn es Soll und Ist gibt – „0 h statt 3 h“ ist keine Abweichung, sondern fehlende Daten */
const abw = (soll: number | undefined, ist: number) => (soll && ist ? ist / soll - 1 : undefined);

function mehrWeniger(diff: number, format: (n: number) => string) {
  return diff > 0 ? `${format(diff)} mehr` : `${format(-diff)} weniger`;
}

export function nachkalkulation(auftrag: Auftrag, b: Basisdaten, kalkulation?: SollKalkulation, jetzt = new Date()): Nachkalkulation {
  const ist = auftragKosten(auftrag.id, b, jetzt);
  const soll = sollFuer(auftrag, b, kalkulation, ist);
  const umsatz = umsatzJeAuftrag(b).get(auftrag.id)?.netto;
  const istMaterial = ist.material + ist.belege;

  const vergleiche: Vergleich[] = [
    { bereich: 'stunden', titel: 'Stunden', soll: soll.minuten, ist: ist.minuten, abweichung: abw(soll.minuten, ist.minuten) },
    { bereich: 'material', titel: 'Material & Belege', soll: soll.material, ist: istMaterial, abweichung: abw(soll.material, istMaterial) },
    { bereich: 'kosten', titel: 'Gesamtkosten', soll: soll.kosten, ist: ist.gesamt, abweichung: abw(soll.kosten, ist.gesamt) },
  ];

  const hatSoll = soll.minuten != null || soll.material != null || soll.kosten != null;
  const hatIst = ist.hatDaten;
  const saetze: string[] = [];

  if (hatIst) {
    if (soll.minuten && ist.minuten) {
      const d = ist.minuten - soll.minuten;
      const a = d / soll.minuten;
      saetze.push(
        Math.abs(a) <= TOLERANZ
          ? `Ihr habt ${stundenText(ist.minuten)} gebraucht, geplant waren ${stundenText(soll.minuten)} – das passt zum Plan.`
          : `Ihr habt ${stundenText(ist.minuten)} gebraucht, geplant waren ${stundenText(soll.minuten)} – ${mehrWeniger(d, stundenText)} (${prozentText(a)}).`,
      );
    } else if (ist.minuten) {
      saetze.push(`Bisher ${stundenText(ist.minuten)} erfasst. Es sind keine Soll-Stunden hinterlegt.`);
    } else if (soll.minuten) {
      saetze.push(`Geplant sind ${stundenText(soll.minuten)}, es wurden aber noch keine Zeiten auf den Auftrag gebucht.`);
    }
    if (ist.fahrtMinuten) saetze.push(`Davon ${stundenText(ist.fahrtMinuten)} Fahrtzeit.`);

    if (soll.material != null && istMaterial) {
      const d = istMaterial - soll.material;
      const a = abw(soll.material, istMaterial) ?? 0;
      saetze.push(
        Math.abs(a) <= TOLERANZ
          ? `Material und Belege: ${euro(istMaterial)} – wie kalkuliert (${euro(soll.material)}).`
          : `Material und Belege: ${euro(istMaterial)} statt ${euro(soll.material)} kalkuliert – ${mehrWeniger(d, euro)} (${prozentText(a)}).`,
      );
    } else if (istMaterial) {
      saetze.push(`Material und Belege: ${euro(istMaterial)}. Dafür gab es kein Soll.`);
    }
    if (ist.belege) saetze.push(`Davon ${euro(ist.belege)} aus Eingangsbelegen am Auftrag.`);

    if (soll.kosten != null) {
      const d = ist.gesamt - soll.kosten;
      const a = abw(soll.kosten, ist.gesamt) ?? 0;
      saetze.push(
        Math.abs(a) <= TOLERANZ
          ? `Gesamtkosten ${euro(ist.gesamt)} – im Plan.`
          : `Gesamtkosten ${euro(ist.gesamt)} – ${euro(Math.abs(d))} ${d > 0 ? 'über' : 'unter'} Plan (${prozentText(a)}).`,
      );
    }
  }
  if (umsatz != null) {
    const db = umsatz - ist.gesamt;
    saetze.push(
      `Abgerechnet: ${euro(umsatz)} netto. Deckungsbeitrag ${euro(db)}${umsatz > 0 ? ` (${Math.round((db / umsatz) * 100)} % vom Umsatz)` : ''}.`,
    );
  } else if (soll.umsatz != null && hatIst) {
    saetze.push(`Noch nicht abgerechnet. Das Angebot lag bei ${euro(soll.umsatz)} netto.`);
  }
  if (ist.ohneKostensatz.length) {
    saetze.push(
      `Bei ${ist.ohneKostensatz.length === 1 ? 'einem Mitarbeiter' : `${ist.ohneKostensatz.length} Mitarbeitern`} fehlt der Kostensatz – die Lohnkosten sind dadurch zu niedrig.`,
    );
  }
  if (ist.unvollstaendig) {
    saetze.push(`${ist.unvollstaendig === 1 ? 'Eine Zeit' : `${ist.unvollstaendig} Zeiten`} ohne Ende wurde${ist.unvollstaendig === 1 ? '' : 'n'} nicht gezählt.`);
  }

  const leit = vergleiche.find((v) => v.bereich === 'kosten' && v.abweichung != null) ?? vergleiche.find((v) => v.bereich === 'stunden' && v.abweichung != null && v.ist > 0);
  let bewertung: Nachkalkulation['bewertung'];
  if (!hatIst) bewertung = { ton: 'neutral', text: 'Noch keine Ist-Daten' };
  else if (!leit || leit.abweichung == null) bewertung = { ton: 'neutral', text: 'Kein Soll hinterlegt' };
  else if (leit.abweichung > TOLERANZ) bewertung = { ton: 'achtung', text: `Über Plan (${prozentText(leit.abweichung)})` };
  else if (leit.abweichung < -TOLERANZ) bewertung = { ton: 'erfolg', text: `Unter Plan (${prozentText(leit.abweichung)})` };
  else bewertung = { ton: 'erfolg', text: 'Im Plan' };

  return {
    auftragId: auftrag.id,
    soll,
    ist,
    umsatz,
    db: umsatz != null ? umsatz - ist.gesamt : undefined,
    vergleiche,
    saetze,
    bewertung,
    hatSoll,
    hatIst,
  };
}

// ------------------------------------------------------------------ Lerneffekt

/** Leistungsminuten eines Auftrags: aus dem angenommenen Angebot, sonst aus den Rechnungen */
export function leistungsMinutenFuer(auftragId: ID, b: Basisdaten) {
  const angebot = angenommenesAngebot(auftragId, b.angebote);
  const positionen: Position[] = angebot
    ? angebot.positionen
    : b.rechnungen.filter((r: Rechnung) => r.auftragId === auftragId && rechnungZaehlt(r) && r.art !== 'gutschrift').flatMap((r) => r.positionen);
  return positionsMinuten(positionen, b);
}

export interface Lerneffekt {
  leistungId: ID;
  name: string;
  minutenAlt: number;
  minutenNeu: number;
  /** 0.3 = dauert 30 % länger */
  abweichung: number;
  auftraege: number;
}

/**
 * Über alle erledigten Aufträge: Wie stark weicht die tatsächliche Zeit von den kalkulierten
 * Leistungsminuten ab? Zeiten sind nicht je Leistung erfasst – deshalb wird die Abweichung eines
 * Auftrags anteilig (nach Soll-Minuten) auf seine Leistungen verteilt. Fahrtzeit zählt nicht mit.
 */
export function lerneffekte(b: Basisdaten, opts: { minAuftraege?: number; schwelle?: number } = {}, jetzt = new Date()): Lerneffekt[] {
  const minAuftraege = opts.minAuftraege ?? 2;
  const schwelle = opts.schwelle ?? 0.15;
  const acc = new Map<ID, { soll: number; ist: number; n: number }>();
  for (const a of b.auftraege) {
    if (a.phase !== 'erledigt') continue;
    const { gesamt, jeLeistung } = leistungsMinutenFuer(a.id, b);
    if (!gesamt || !jeLeistung.size) continue;
    const k = auftragKosten(a.id, b, jetzt);
    const istMin = k.minuten - k.fahrtMinuten;
    if (istMin <= 0) continue;
    const faktor = istMin / gesamt;
    for (const [id, min] of jeLeistung) {
      const x = acc.get(id) ?? { soll: 0, ist: 0, n: 0 };
      x.soll += min;
      x.ist += min * faktor;
      x.n++;
      acc.set(id, x);
    }
  }
  const ergebnis: Lerneffekt[] = [];
  for (const [id, x] of acc) {
    const l = b.leistungen.find((y) => y.id === id);
    if (!l?.minuten || x.n < minAuftraege || !x.soll) continue;
    const abweichung = x.ist / x.soll - 1;
    if (Math.abs(abweichung) < schwelle) continue;
    ergebnis.push({
      leistungId: id,
      name: l.name,
      minutenAlt: l.minuten,
      minutenNeu: Math.max(1, Math.round(l.minuten * (1 + abweichung))),
      abweichung,
      auftraege: x.n,
    });
  }
  return ergebnis.sort((p, q) => Math.abs(q.abweichung) - Math.abs(p.abweichung));
}

export function lerneffektSatz(l: Lerneffekt): string {
  const p = Math.abs(Math.round(l.abweichung * 100));
  return `„${l.name}“ dauert im Schnitt ${p} % ${l.abweichung > 0 ? 'länger' : 'kürzer'} als kalkuliert`;
}

// ------------------------------------------------------------------ laufende Aufträge

export const LAUFEND: Auftrag['phase'][] = ['beauftragt', 'in_arbeit', 'abnahme'];

/** Laufende Aufträge, bei denen die erfassten Stunden das Soll schon überschreiten */
export function ueberPlan(b: Basisdaten, kalk: (id: ID) => SollKalkulation | undefined = () => undefined, jetzt = new Date()) {
  return b.auftraege
    .filter((a) => LAUFEND.includes(a.phase))
    .map((a) => nachkalkulation(a, b, kalk(a.id), jetzt))
    .filter((n) => n.soll.minuten && n.ist.minuten > n.soll.minuten);
}
