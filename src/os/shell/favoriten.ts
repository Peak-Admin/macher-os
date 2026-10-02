/**
 * Favoriten: Jeder Nutzer markiert unter „Betrieb“ bis zu drei Module mit dem Stern. Sie stehen dann unter den
 * vier Hauptbereichen in der Navigation – flach, ein Klick. Gespeichert je Mitarbeiter, so stellt sich jede Rolle
 * ihre Abkürzungen selbst zusammen. Die vier Hauptbereiche bleiben immer gleich.
 */
import { useEinstellung } from '@core/einstellungen';
import { useIch } from '@core/session';
import type { ModulDef } from '@core/modul';
import type { Mitarbeiter, Rolle } from '@core/objects';
import { modulVerzeichnis } from './struktur';

/** Mehr als drei Abkürzungen machen die Navigation wieder unruhig */
export const FAVORITEN_MAX = 3;

/** Startauswahl je Rolle, solange der Nutzer seine Favoriten noch nicht selbst angepasst hat */
export const STANDARD_FAVORITEN: Record<Rolle, string[]> = {
  chef: ['angebote', 'rechnungen', 'auswertung'],
  buero: ['anfragen', 'angebote', 'rechnungen'],
  monteur: ['arbeitszeiten', 'abwesenheiten', 'werkzeuge'],
  azubi: ['arbeitszeiten', 'abwesenheiten', 'schulungen'],
};

const schluessel = (mitarbeiterId: string | undefined) => `navigation.favoriten.${mitarbeiterId ?? 'alle'}`;

/** Gespeicherte IDs → Module, die dieser Nutzer im Verzeichnis sehen darf (höchstens drei) */
export function favoritenModule(ids: string[], ich: Mitarbeiter | undefined): ModulDef[] {
  const sichtbar = new Map(modulVerzeichnis(ich).flatMap((g) => g.module.map((m) => [m.id, m] as const)));
  return ids.map((id) => sichtbar.get(id)).filter((m): m is ModulDef => !!m).slice(0, FAVORITEN_MAX);
}

export function useFavoriten() {
  const ich = useIch();
  const [ids, setzen] = useEinstellung<string[]>(schluessel(ich?.id), (ich && STANDARD_FAVORITEN[ich.rolle]) ?? []);
  const module = favoritenModule(ids, ich);
  const aktiv = module.map((m) => m.id);
  return {
    module,
    voll: aktiv.length >= FAVORITEN_MAX,
    istFavorit: (id: string) => aktiv.includes(id),
    umschalten: (id: string) => {
      if (aktiv.includes(id)) setzen(aktiv.filter((x) => x !== id));
      else if (aktiv.length < FAVORITEN_MAX) setzen([...aktiv, id]);
    },
  };
}
