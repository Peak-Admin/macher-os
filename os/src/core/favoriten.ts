/**
 * Favoriten: Jeder Nutzer markiert Module mit dem Stern. Sie stehen dann zusätzlich in der Navigation
 * (flach, ein Klick). Gespeichert je Mitarbeiter – so passt jede Rolle die Navigation für sich an.
 */
import { alleModule, type ModulDef } from './modul';
import { useEinstellung } from './einstellungen';
import { useIch } from './session';
import type { Mitarbeiter } from './objects';

const schluessel = (mitarbeiterId: string | undefined) => `navigation.favoriten.${mitarbeiterId ?? 'alle'}`;

/** Darf dieser Nutzer das Modul sehen und hat es eine eigene Ansicht? */
export function modulSichtbar(m: ModulDef, ich: Mitarbeiter | undefined): boolean {
  return !!m.routen?.length && m.navigation !== 'versteckt' && (!m.rollen || !ich || m.rollen.includes(ich.rolle));
}

export function useFavoriten() {
  const ich = useIch();
  const [ids, setzen] = useEinstellung<string[]>(schluessel(ich?.id), []);
  const module = ids.map((id) => alleModule().find((m) => m.id === id)).filter((m): m is ModulDef => !!m && modulSichtbar(m, ich));
  return {
    module,
    istFavorit: (id: string) => ids.includes(id),
    umschalten: (id: string) => setzen(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
  };
}
