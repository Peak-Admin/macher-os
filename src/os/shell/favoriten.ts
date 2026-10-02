/**
 * Deine Seitenleiste als Hook: laden, bereinigen, speichern – je Mitarbeiter.
 * Unter den vier Hauptbereichen richtet sich jeder selbst ein, was er sehen will (Module, Smart Views, Seiten, Ordner).
 * Der Stern im Modulverzeichnis unter „Betrieb“ legt ein Modul in die Leiste oder nimmt es heraus.
 * Die Regeln stehen in `seitenleiste.ts`.
 */
import { useMemo } from 'react';
import { einstellung, setzeEinstellung, useEinstellung } from '@core/einstellungen';
import { useIch } from '@core/session';
import { modul, type ModulDef } from '@core/modul';
import type { Mitarbeiter } from '@core/objects';
import { modulVerzeichnis } from './struktur';
import { bereinigen, flach, modulDrin, modulEintrag, modulUmschalten, standardLeiste, voll, type Leiste } from './seitenleiste';

const schluessel = (mitarbeiterId: string | undefined) => `navigation.seitenleiste.${mitarbeiterId ?? 'alle'}`;
/** frühere Favoriten (höchstens drei Module) – werden beim ersten Laden übernommen */
const alterSchluessel = (mitarbeiterId: string | undefined) => `navigation.favoriten.${mitarbeiterId ?? 'alle'}`;
/** Layout einer Smart View (Bausteine wie auf „Heute“) */
export const ansichtSchluessel = (id: string) => `ansicht.layout.${id}`;

/** Module, die dieser Nutzer im Verzeichnis sehen darf */
export function sichtbareModulIds(ich: Mitarbeiter | undefined): Set<string> {
  return new Set(modulVerzeichnis(ich).flatMap((g) => g.module.map((m) => m.id)));
}

/** Startzustand: frühere Favoriten, sonst die Auswahl der Rolle */
function anfang(ich: Mitarbeiter | undefined): Leiste {
  const alt = einstellung<string[] | null>(alterSchluessel(ich?.id), null);
  if (Array.isArray(alt)) return { version: 1, eintraege: alt.map((id) => ({ ...modulEintrag(id), id: `std-${id}` })) };
  return standardLeiste(ich?.rolle);
}

export function useLeiste() {
  const ich = useIch();
  const [gespeichert, setzen] = useEinstellung<Leiste | null>(schluessel(ich?.id), null);
  const sichtbar = [...sichtbareModulIds(ich)].join(',');
  const leiste = useMemo(
    () => {
      const ids = new Set(sichtbar.split(','));
      return bereinigen(gespeichert ?? anfang(ich), (id) => ids.has(id));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gespeichert, ich?.id, ich?.rolle, sichtbar],
  );
  return {
    leiste,
    voll: voll(leiste),
    /** Änderung anwenden und sofort speichern */
    aendern: (f: (l: Leiste) => Leiste) => {
      const neu = f(leiste);
      if (neu !== leiste) setzen(neu);
    },
  };
}

/** Smart View löschen: auch ihre Bausteine vergessen */
export function ansichtVergessen(id: string) {
  setzeEinstellung(ansichtSchluessel(id), null);
}

/** Module in der Leiste (für den Stern im Verzeichnis, das Profilmenü am Handy und das Widget „Deine Favoriten“) */
export function useFavoriten() {
  const { leiste, voll: istVoll, aendern } = useLeiste();
  const module = flach(leiste.eintraege)
    .filter((e) => e.art === 'modul')
    .map((e) => modul(e.modulId!))
    .filter((m): m is ModulDef => !!m);
  return {
    module,
    voll: istVoll,
    istFavorit: (id: string) => modulDrin(leiste, id),
    umschalten: (id: string) => aendern((l) => modulUmschalten(l, id)),
  };
}
