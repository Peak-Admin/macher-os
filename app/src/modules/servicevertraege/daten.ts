/**
 * Serviceverträge: regelmäßige Leistungen gegen festen Preis.
 * Eigene Sammlung `servicevertraege`; Kunde, Orte, Anlagen, Aufträge und Rechnungen
 * werden nur per ID verwiesen.
 */
import { batch, db, defineCollection, vermerken } from '@core/db';
import { aktionAusfuehren, alleModule } from '@core/modul';
import { datum, heute, plusTage, plusMonate } from '@core/format';
import { naechsteNummer } from '@core/nummern';
import type { Auftrag, Basis, Cent, Datum, ID, Position } from '@core/objects';
import { vorkommen } from '../wiederkehrend/regel';

export type Rhythmus = 'monatlich' | 'quartal' | 'halbjahr' | 'jahr';

export const RHYTHMEN: { wert: Rhythmus; label: string; monate: number }[] = [
  { wert: 'monatlich', label: 'Monatlich', monate: 1 },
  { wert: 'quartal', label: 'Vierteljährlich', monate: 3 },
  { wert: 'halbjahr', label: 'Halbjährlich', monate: 6 },
  { wert: 'jahr', label: 'Jährlich', monate: 12 },
];
export const rhythmusMonate = (r: Rhythmus) => RHYTHMEN.find((x) => x.wert === r)?.monate ?? 12;

export interface Abrechnung {
  von: Datum;
  /** letzter Tag (inklusive) */
  bis: Datum;
  betrag: Cent;
  auftragId: ID;
  rechnungId?: ID;
}

export interface Servicevertrag extends Basis {
  nummer: string;
  titel: string;
  kundeId: ID;
  ortIds: ID[];
  anlageIds: ID[];
  /** enthaltene Leistungen, je Eintrag eine Zeile */
  leistungen: string[];
  /** Wartungsintervall in Monaten */
  intervallMonate: number;
  /** Preis netto pro Jahr */
  preisJahr: Cent;
  abrechnung: Rhythmus;
  beginn: Datum;
  laufzeitMonate: number;
  kuendigungsfristMonate: number;
  automatischVerlaengern: boolean;
  /** um so viele Monate verlängert sich der Vertrag */
  verlaengerungMonate: number;
  status: 'aktiv' | 'gekuendigt';
  gekuendigtAm?: Datum;
  /** letzter Vertragstag nach Kündigung */
  endeAm?: Datum;
  /** nächste Abrechnungsperiode beginnt an diesem Tag */
  abgerechnetBis?: Datum;
  abrechnungen: Abrechnung[];
  notiz?: string;
}

export const servicevertraege = defineCollection<Servicevertrag>('servicevertraege');

// ------------------------------------------------------------------ Laufzeit & Fristen

/** Ende (exklusiv) der k-ten Laufzeitperiode */
const periodenEnde = (v: Servicevertrag, k: number) =>
  plusMonate(v.beginn, v.laufzeitMonate + k * Math.max(1, v.verlaengerungMonate || 12));

/**
 * Nächstes mögliches Vertragsende (letzter Tag, inklusive) – also das Ende,
 * zu dem man heute noch fristgerecht kündigen könnte.
 */
export function laufzeitBis(v: Servicevertrag, stichtag: Datum = heute()): Datum {
  if (v.status === 'gekuendigt' && v.endeAm) return v.endeAm;
  if (!v.automatischVerlaengern) return plusTage(periodenEnde(v, 0), -1);
  for (let k = 0; k < 200; k++) {
    const ende = periodenEnde(v, k);
    const fristEnde = plusMonate(ende, -v.kuendigungsfristMonate);
    if (fristEnde > stichtag) return plusTage(ende, -1);
  }
  return plusTage(periodenEnde(v, 0), -1);
}

/** Letzter Tag, an dem eine Kündigung zum nächsten Ende noch fristgerecht ist */
export function kuendigenBis(v: Servicevertrag, stichtag: Datum = heute()): Datum {
  const ende = plusTage(laufzeitBis(v, stichtag), 1);
  return plusTage(plusMonate(ende, -v.kuendigungsfristMonate), -1);
}

/** Läuft der Vertrag an diesem Tag? */
export function vertragLaeuft(v: Servicevertrag, stichtag: Datum = heute()): boolean {
  if (v.geloeschtAm) return false;
  if (v.beginn > stichtag) return false;
  return laufzeitBis(v, stichtag) >= stichtag;
}

export type VertragsZustand = 'aktiv' | 'frist' | 'laeuft_aus' | 'gekuendigt' | 'beendet' | 'startet';

/** Zustand für Listen und Hinweise */
export function zustand(v: Servicevertrag, stichtag: Datum = heute()): VertragsZustand {
  if (v.beginn > stichtag) return 'startet';
  const bis = laufzeitBis(v, stichtag);
  if (bis < stichtag) return 'beendet';
  if (v.status === 'gekuendigt') return 'gekuendigt';
  if (!v.automatischVerlaengern && bis <= plusTage(stichtag, 60)) return 'laeuft_aus';
  if (v.automatischVerlaengern && kuendigenBis(v, stichtag) <= plusTage(stichtag, 30)) return 'frist';
  return 'aktiv';
}

export const ZUSTAND_TEXT: Record<VertragsZustand, { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' | 'achtung' }> = {
  aktiv: { text: 'Läuft', ton: 'erfolg' },
  frist: { text: 'Kündigungsfrist naht', ton: 'achtung' },
  laeuft_aus: { text: 'Läuft aus', ton: 'achtung' },
  gekuendigt: { text: 'Gekündigt', ton: 'neutral' },
  beendet: { text: 'Beendet', ton: 'neutral' },
  startet: { text: 'Startet bald', ton: 'aktiv' },
};

// ------------------------------------------------------------------ Abrechnung

/** Beginn der Periode, die auf `von` folgt (am Vertragsbeginn ausgerichtet) */
function naechsteGrenze(v: Servicevertrag, von: Datum): Datum {
  const m = rhythmusMonate(v.abrechnung);
  for (let n = 1; n < 1200; n++) {
    const g = plusMonate(v.beginn, n * m);
    if (g > von) return g;
  }
  return plusMonate(von, m);
}

/** Nächste fällige Abrechnung (Vorauszahlung zu Periodenbeginn) oder `undefined` */
export function faelligeAbrechnung(v: Servicevertrag, stichtag: Datum = heute()): { von: Datum; bis: Datum; betrag: Cent } | undefined {
  if (v.geloeschtAm || !v.preisJahr) return undefined;
  const von = v.abgerechnetBis ?? v.beginn;
  if (von > stichtag) return undefined;
  const ende = laufzeitBis(v, stichtag);
  if (von > ende) return undefined;
  const bisExkl = naechsteGrenze(v, von);
  let bis = plusTage(bisExkl, -1);
  if (bis > ende && v.status === 'gekuendigt') bis = ende;
  const betrag = Math.round((v.preisJahr * rhythmusMonate(v.abrechnung)) / 12);
  return { von, bis, betrag };
}

/** Betrag pro Monat (Anzeige) */
export const preisMonat = (v: Pick<Servicevertrag, 'preisJahr'>) => Math.round(v.preisJahr / 12);

function rechnungErstellenRegistriert() {
  return alleModule().some((m) => !!m.aktionen?.['rechnung.erstellen']);
}

/**
 * Legt einen Abrechnungsauftrag für die fällige Periode an und lässt daraus einen
 * Rechnungsentwurf erstellen (`rechnung.erstellen`). Gibt die neuen IDs zurück.
 */
export function abrechnen(vertragId: ID, stichtag: Datum = heute()): { auftragId: ID; rechnungId?: ID } | undefined {
  const v = servicevertraege.get(vertragId);
  if (!v) return undefined;
  const f = faelligeAbrechnung(v, stichtag);
  if (!f) return undefined;
  const zeitraum = `${datum(f.von)} – ${datum(f.bis)}`;
  const auftrag = db.auftraege.create({
    nummer: naechsteNummer('auftrag'),
    titel: `${v.titel}: Abrechnung ${zeitraum}`,
    art: 'kundendienst',
    phase: 'abrechnung',
    kundeId: v.kundeId,
    ortId: v.ortIds[0],
    anlageIds: v.anlageIds.length ? [...v.anlageIds] : undefined,
    beschreibung: `Abrechnung Servicevertrag ${v.nummer} für ${zeitraum}.`,
    beispiel: v.beispiel,
  });
  const positionen: Position[] = [
    { id: 'sv1', art: 'pauschal', text: `Servicevertrag ${v.nummer} – ${v.titel}`, menge: 1, einheit: 'Psch', einzelpreis: f.betrag },
  ];
  if (v.leistungen.length) positionen.push({ id: 'sv2', art: 'text', text: `Enthalten: ${v.leistungen.join(', ')}`, menge: 0, einheit: 'Psch', einzelpreis: 0 });

  if (rechnungErstellenRegistriert()) {
    aktionAusfuehren('rechnung.erstellen', { auftragId: auftrag.id, art: 'rechnung' });
  }
  let rechnung = db.rechnungen.where((r) => r.auftragId === auftrag.id).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
  if (rechnung) {
    // Abrechnungsauftrag hat keine Leistungen – Vertragsposition ergänzen, wenn leer
    if (!rechnung.positionen.some((p) => p.einzelpreis > 0)) {
      rechnung = db.rechnungen.update(rechnung.id, { positionen, leistungszeitraum: zeitraum })!;
    }
  } else {
    const kunde = db.kunden.get(v.kundeId);
    const ziel = kunde?.zahlungszielTage ?? db.betrieb.get('betrieb')?.zahlungszielTage ?? 14;
    rechnung = db.rechnungen.create({
      nummer: naechsteNummer('rechnung'),
      art: 'rechnung',
      auftragId: auftrag.id,
      kundeId: v.kundeId,
      titel: `${v.titel} (${v.nummer})`,
      positionen,
      status: 'entwurf',
      datum: stichtag,
      leistungszeitraum: zeitraum,
      faelligAm: plusTage(stichtag, ziel),
      mahnstufe: 0,
      beispiel: v.beispiel,
    });
  }
  batch(() => {
    servicevertraege.update(v.id, {
      abgerechnetBis: plusTage(f.bis, 1),
      abrechnungen: [...v.abrechnungen, { ...f, auftragId: auftrag.id, rechnungId: rechnung?.id }],
    }, { text: `Abgerechnet: ${zeitraum}${rechnung ? ` (Rechnung ${rechnung.nummer})` : ''}` });
  });
  vermerken({ typ: 'auftraege', id: auftrag.id }, 'servicevertrag.abrechnung', `Aus Servicevertrag ${v.nummer} angelegt`);
  return { auftragId: auftrag.id, rechnungId: rechnung?.id };
}

// ------------------------------------------------------------------ Bezug zu Anlagen & Aufträgen

/** Laufender Vertrag, der diese Anlage (direkt oder über ihren Ort) abdeckt */
export function vertragFuerAnlage(anlageId: ID, stichtag: Datum = heute()): Servicevertrag | undefined {
  const a = db.anlagen.get(anlageId);
  return servicevertraege
    .all()
    .find((v) => vertragLaeuft(v, stichtag) && (v.anlageIds.includes(anlageId) || (!!a && v.anlageIds.length === 0 && v.ortIds.includes(a.ortId))));
}

/** Wartungsauftrag ist im Vertrag enthalten (kein Preis) */
export function vertragFuerAuftrag(a: Auftrag | undefined, stichtag: Datum = heute()): Servicevertrag | undefined {
  if (!a || a.art !== 'wartung') return undefined;
  for (const id of a.anlageIds ?? []) {
    const v = vertragFuerAnlage(id, stichtag);
    if (v) return v;
  }
  if (a.ortId) return servicevertraege.all().find((v) => vertragLaeuft(v, stichtag) && v.anlageIds.length === 0 && v.ortIds.includes(a.ortId!));
  return undefined;
}

/** Wartungsaufträge, die zu diesem Vertrag gehören */
export function wartungsauftraegeZu(v: Servicevertrag): Auftrag[] {
  return db.auftraege
    .where((a) => a.art === 'wartung' && ((a.anlageIds ?? []).some((id) => v.anlageIds.includes(id)) || (!!a.ortId && v.anlageIds.length === 0 && v.ortIds.includes(a.ortId))))
    .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
}

/** Anlagen im Vertrag bekommen das Vertragsintervall, falls bei ihnen noch keins steht */
export function anlagenAbstimmen(v: Servicevertrag, stichtag: Datum = heute()) {
  batch(() => {
    for (const id of v.anlageIds) {
      const a = db.anlagen.get(id);
      if (!a) continue;
      const patch: Partial<typeof a> = {};
      if (!a.wartungMonate) patch.wartungMonate = v.intervallMonate;
      if (!a.naechsteWartung) {
        const monate = a.wartungMonate ?? v.intervallMonate;
        patch.naechsteWartung = a.letzteWartung
          ? plusMonate(a.letzteWartung, monate)
          : vorkommen(v.beginn, { art: 'monate', alle: monate }, stichtag, plusMonate(stichtag, monate + 1))[0];
      }
      if (Object.keys(patch).length) db.anlagen.update(a.id, patch, { text: `Wartung aus Servicevertrag ${v.nummer} übernommen` });
    }
  });
}

export function kuendigen(vertragId: ID, stichtag: Datum = heute()) {
  const v = servicevertraege.get(vertragId);
  if (!v) return;
  const endeAm = laufzeitBis(v, stichtag);
  servicevertraege.update(v.id, { status: 'gekuendigt', gekuendigtAm: stichtag, endeAm }, { text: `Kündigung vermerkt – endet am ${datum(endeAm)}` });
  return endeAm;
}

/** Vertrag ohne automatische Verlängerung um eine Laufzeit verlängern */
export function verlaengern(vertragId: ID) {
  const v = servicevertraege.get(vertragId);
  if (!v) return;
  servicevertraege.update(v.id, {
    laufzeitMonate: v.laufzeitMonate + Math.max(1, v.verlaengerungMonate || 12),
    status: 'aktiv',
    endeAm: undefined,
    gekuendigtAm: undefined,
  }, { text: 'Laufzeit verlängert' });
}

export function naechsteVertragsnummer(jahr = new Date().getFullYear()) {
  const start = `SV-${jahr}-`;
  const max = servicevertraege
    .allMitGeloeschten()
    .map((v) => v.nummer)
    .filter((n) => n?.startsWith(start))
    .map((n) => Number(n.slice(start.length)))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${start}${String(max + 1).padStart(3, '0')}`;
}
