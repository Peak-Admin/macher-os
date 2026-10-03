/**
 * Messpunkt `aktivierung.erreicht` (PRD Abschnitt 3): Ein Betrieb ist aktiviert, wenn innerhalb von 14 Tagen
 * ≥ 3 Aufträge angelegt · ≥ 1 Auftrag von der Anfrage bis zur versendeten Rechnung · ≥ 1 Erfassung (Zeit oder Foto)
 * durch einen Monteur am Auftrag · ≥ 1 Rechnung versendet.
 *
 * Reine Funktion – Beispieldaten (Spielwiese) und Papierkorb zählen nie.
 * „Anfrage bis Rechnung“: Jeder Auftrag beginnt in Handwerk OS als Anfrage (Phase `anfrage`); durchgelaufen ist er,
 * sobald eine Rechnung zu ihm versendet ist.
 */
import type { Auftrag, Dokument, Mitarbeiter, Rechnung, Zeiteintrag } from '@core/objects';

export const AKTIVIERUNG_TAGE = 14;
export const MIN_AUFTRAEGE = 3;

type Echt = { beispiel?: boolean; geloeschtAm?: string };

export interface AktivierungsDaten {
  /** Start des Betriebs (ISO), z. B. Einrichtung */
  start: string;
  auftraege: (Pick<Auftrag, 'id' | 'erstelltAm'> & Echt)[];
  rechnungen: (Pick<Rechnung, 'auftragId' | 'status' | 'versendetAm'> & Echt)[];
  zeiten: (Pick<Zeiteintrag, 'mitarbeiterId' | 'auftragId' | 'erstelltAm' | 'erstelltVon'> & Echt)[];
  dokumente: (Pick<Dokument, 'auftragId' | 'erstelltAm' | 'erstelltVon' | 'art'> & Echt)[];
  mitarbeiter: Pick<Mitarbeiter, 'id' | 'rolle'>[];
}

export interface Aktivierung {
  erreicht: boolean;
  /** Zeitpunkt, an dem das letzte Kriterium erfüllt wurde */
  erreichtAm?: string;
  /** Tage seit Start bis zur Aktivierung (aufgerundet) */
  tage?: number;
  kriterien: { auftraege: number; durchgelaufen: boolean; monteurErfasst: boolean; rechnungVersendet: boolean };
}

const echt = (x: Echt) => !x.beispiel && !x.geloeschtAm;
const VERSENDET: Rechnung['status'][] = ['versendet', 'teilbezahlt', 'bezahlt'];
const ERFASSUNG: Dokument['art'][] = ['foto', 'video', 'sprache', 'notiz', 'unterschrift'];

export function aktivierung(d: AktivierungsDaten, tage = AKTIVIERUNG_TAGE): Aktivierung {
  const startMs = Date.parse(d.start);
  const ende = new Date(startMs + tage * 86_400_000).toISOString();
  const imFenster = (iso: string | undefined) => !!iso && iso >= d.start && iso <= ende;
  const frueheste = (liste: (string | undefined)[]) => liste.filter((x): x is string => !!x).sort()[0];

  const auftraege = d.auftraege.filter((a) => echt(a) && imFenster(a.erstelltAm)).sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm));
  const auftragIds = new Set(auftraege.map((a) => a.id));
  const versendet = d.rechnungen.filter((r) => echt(r) && VERSENDET.includes(r.status) && imFenster(r.versendetAm));
  const durch = versendet.filter((r) => !!r.auftragId && auftragIds.has(r.auftragId));

  const monteure = new Set(d.mitarbeiter.filter((m) => m.rolle === 'monteur' || m.rolle === 'azubi').map((m) => m.id));
  const erfassungen = [
    ...d.zeiten.filter((z) => echt(z) && !!z.auftragId && (monteure.has(z.mitarbeiterId) || monteure.has(z.erstelltVon ?? '')) && imFenster(z.erstelltAm)).map((z) => z.erstelltAm),
    ...d.dokumente.filter((x) => echt(x) && !!x.auftragId && ERFASSUNG.includes(x.art) && istMonteur(monteure, x.erstelltVon) && imFenster(x.erstelltAm)).map((x) => x.erstelltAm),
  ];

  const kriterien = { auftraege: auftraege.length, durchgelaufen: durch.length > 0, monteurErfasst: erfassungen.length > 0, rechnungVersendet: versendet.length > 0 };
  const erreicht = kriterien.auftraege >= MIN_AUFTRAEGE && kriterien.durchgelaufen && kriterien.monteurErfasst && kriterien.rechnungVersendet;
  if (!erreicht) return { erreicht, kriterien };
  const erreichtAm = [auftraege[MIN_AUFTRAEGE - 1].erstelltAm, frueheste(durch.map((r) => r.versendetAm)), frueheste(erfassungen), frueheste(versendet.map((r) => r.versendetAm))].sort().at(-1)!;
  return { erreicht, erreichtAm, tage: Math.max(1, Math.ceil((Date.parse(erreichtAm) - startMs) / 86_400_000)), kriterien };
}

function istMonteur(monteure: Set<string>, id: string | undefined) {
  return !!id && monteure.has(id);
}
