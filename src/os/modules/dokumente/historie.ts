/**
 * Versionen & Dokumenthistorie – Teil der Dokumenten-Engine (nur Kern-Abhängigkeiten).
 *
 * Das Dokument selbst (Angebot, Rechnung, Mahnung, Bericht …) bleibt die einzige Quelle. Eine Version hält fest,
 * was zu einem Zeitpunkt nach außen ging (Nummer, Betrag, Empfänger, Betreff) – als Archiv-Nachweis, nicht als
 * zweite Quelle. Die Historie ist Versionen + Zeitstrahl des Objekts.
 */
import { defineCollection, zeitstrahl } from '@core/db';
import type { Basis, Bezug, Cent, Ereignis, ID, Zeitpunkt } from '@core/objects';

export type VersionAnlass = 'erstellt' | 'festgeschrieben' | 'versendet' | 'unterschrieben' | 'storniert';

export interface DokumentVersion extends Basis {
  bezug: Bezug;
  /** Dokumentart aus der Registry, z. B. `schlussrechnung` */
  art: string;
  /** fortlaufend je Dokument, beginnt bei 1 */
  version: number;
  anlass: VersionAnlass;
  nummer?: string;
  titel?: string;
  /** Betrag, den das Dokument zu diesem Zeitpunkt nannte (Zahlbetrag bzw. Gesamt) */
  betrag?: Cent;
  kanal?: 'email' | 'sms' | 'whatsapp' | 'post' | 'selbst';
  an?: string;
  betreff?: string;
  /** Versandstatus: wirklich gesendet oder nur im eigenen Programm geöffnet */
  versandStatus?: 'gesendet' | 'geoeffnet' | 'fehler';
  zeitpunkt: Zeitpunkt;
}

export const dokumentversionen = defineCollection<DokumentVersion>('dokumentversionen');

const gleich = (a: Bezug, b: Bezug) => a.typ === b.typ && a.id === b.id;

export function versionenVon(bezug: Bezug): DokumentVersion[] {
  return dokumentversionen.where((v) => gleich(v.bezug, bezug)).sort((a, b) => a.version - b.version);
}

type VersionDaten = Partial<Omit<DokumentVersion, keyof Basis | 'bezug' | 'art' | 'anlass' | 'version'>>;

/** Neue Version festhalten (Nummer wird je Dokument hochgezählt) */
export function versionFesthalten(bezug: Bezug, art: string, anlass: VersionAnlass, daten: VersionDaten = {}): DokumentVersion {
  const bisher = versionenVon(bezug);
  return dokumentversionen.create(
    {
      bezug,
      art,
      anlass,
      version: (bisher[bisher.length - 1]?.version ?? 0) + 1,
      zeitpunkt: new Date().toISOString(),
      ...daten,
    },
    { leise: true },
  );
}

/**
 * Version festhalten – mehrere Meldungen zum selben Vorgang (z. B. `angebot.versendet` und `dokument.versendet`
 * beim selben Klick) werden zu einer Version zusammengeführt: gleicher Anlass innerhalb weniger Sekunden → ergänzen.
 */
export function versionMerken(bezug: Bezug, art: string, anlass: VersionAnlass, daten: VersionDaten = {}, jetzt = Date.now()): DokumentVersion {
  const letzte = versionenVon(bezug).pop();
  if (letzte && letzte.anlass === anlass && jetzt - new Date(letzte.zeitpunkt).getTime() < 5000) {
    const sauber = Object.fromEntries(Object.entries(daten).filter(([, w]) => w !== undefined)) as VersionDaten;
    return dokumentversionen.update(letzte.id, sauber, { leise: true }) ?? letzte;
  }
  return versionFesthalten(bezug, art, anlass, daten);
}

export interface HistorienEintrag {
  id: ID;
  zeitpunkt: Zeitpunkt;
  text: string;
  version?: number;
  quelle: 'version' | 'zeitstrahl';
}

export const ANLASS_TEXT: Record<VersionAnlass, string> = {
  erstellt: 'Erstellt',
  festgeschrieben: 'Festgeschrieben',
  versendet: 'Versendet',
  unterschrieben: 'Unterschrieben',
  storniert: 'Storniert',
};

/** Versionen und Zeitstrahl eines Dokuments, neueste zuerst */
export function historie(bezug: Bezug, ereignisse: Ereignis[] = zeitstrahl(bezug)): HistorienEintrag[] {
  const v: HistorienEintrag[] = versionenVon(bezug).map((x) => ({
    id: x.id,
    zeitpunkt: x.zeitpunkt,
    version: x.version,
    quelle: 'version',
    text: [`Version ${x.version}: ${ANLASS_TEXT[x.anlass]}`, x.nummer, x.an && `an ${x.an}`, x.versandStatus === 'geoeffnet' && '(im eigenen Programm geöffnet)'].filter(Boolean).join(' · '),
  }));
  const z: HistorienEintrag[] = ereignisse.map((e) => ({ id: e.id, zeitpunkt: e.erstelltAm, text: e.text, quelle: 'zeitstrahl' }));
  return [...v, ...z].sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
}
