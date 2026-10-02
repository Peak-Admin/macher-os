import { defineModul } from '@core/modul';
import { automationAn } from '@core/macher';
import type { ID } from '@core/objects';
import { ich } from '@core/session';
import { uhrzeit } from '@core/format';
import { EinsatzSeite, NaechsterEinsatzSeite, NaechsterEinsatzWidget } from './Einsatz';
import { einsatzBeenden, einsatzStarten, laeuft, naechsterEinsatz, setzeTerminStatus, type StatusPayload } from './logik';
import { einsatzHinweise } from './hinweise';
import { STATUS_ID, terminstatusAutomation, terminstatusNachziehen } from './automationen';
import { UNTERWEGS_AKTION, unterwegsAutomation, unterwegsSenden } from './unterwegs';
import { ErfassenSeite } from './Erfassen';

const terminId = (p: unknown) => (p as { terminId?: ID } | undefined)?.terminId;

export default defineModul({
  id: 'naechster-einsatz',
  titel: 'Nächster Einsatz',
  bereich: 'heute',
  beschreibung: 'Dein nächster Auftrag mit Ort, Zugang, Kunde, Arbeit und Start-Knopf.',
  icon: 'auto',
  gewicht: 90,
  routen: [
    { pfad: '', element: NaechsterEinsatzSeite },
    { pfad: ':id', element: EinsatzSeite },
    // Monteur-App: Tab „Erfassen“
    { pfad: '/erfassen', element: ErfassenSeite },
  ],
  hubWidget: NaechsterEinsatzWidget,
  kurzinfo: () => {
    const t = naechsterEinsatz(ich()?.id);
    if (!t) return { text: 'Kein Einsatz geplant' };
    return laeuft(t) ? { text: `Läuft: ${t.titel}`, ton: 'aktiv' } : { text: `${uhrzeit(t.start)} · ${t.titel}` };
  },
  hinweise: () => einsatzHinweise(),
  aktionen: {
    'heute.einsatz.starten': (p) => {
      const id = terminId(p);
      if (id) return einsatzStarten(id);
    },
    'heute.einsatz.beenden': (p) => {
      const id = terminId(p);
      if (id) return einsatzBeenden(id);
    },
    /** Vorschlag „Wir sind unterwegs“ (ohne verbundenen Versand) */
    [UNTERWEGS_AKTION]: (p) => {
      const id = terminId(p);
      if (id) void unterwegsSenden(id);
    },
    /** Rückgängig für „Termin abgeschlossen“ */
    'heute.termin.status': (p) => {
      const x = p as StatusPayload | undefined;
      if (x?.terminId && x.status) setzeTerminStatus(x.terminId, x.status, 'Automatischen Abschluss rückgängig gemacht');
    },
  },
  automationen: [terminstatusAutomation, unterwegsAutomation],
  seed: () => {
    if (automationAn(STATUS_ID)) terminstatusNachziehen();
  },
});
