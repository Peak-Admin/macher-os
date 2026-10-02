/**
 * Modul „Konto & Geräte“ (Paket Fundament).
 *
 * Wird NUR registriert, wenn Backend-Schlüssel gesetzt sind (siehe `src/main.tsx`) – ohne Schlüssel bleibt die App
 * unverändert. Die Datei heißt bewusst nicht `index.tsx`, damit die automatische Modulsuche sie nicht einsammelt.
 * Kernwunsch: `konto` in `src/shell/struktur.ts` unter Heute › kontext eintragen, dann kann es normal geladen werden.
 */
import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { kontoZustand } from '@core/cloud-supabase';
import { passt } from '@core/format';
import { AnmeldenSeite, BeitretenSeite } from './Anmelden';
import { KontoSeite } from './KontoSeite';

export const KONTO_PFAD = '/macher/konto';

export default defineModul({
  id: 'konto',
  titel: 'Konto & Geräte',
  bereich: 'macher',
  beschreibung: 'Daten sichern, auf mehreren Geräten arbeiten und das Team mitnehmen – Anmeldung ohne Passwort.',
  icon: 'schloss',
  gewicht: 40,
  navigation: 'versteckt',
  routen: [{ pfad: '', element: KontoSeite }],
  vollbildRouten: [
    { pfad: '/anmelden', element: AnmeldenSeite },
    { pfad: '/beitreten/:token', element: BeitretenSeite },
  ],

  hinweise: () => {
    const z = kontoZustand();
    if (!z.konfiguriert || z.konto?.betriebId || z.phase === 'verbinde') return [];
    if (!db.betrieb.get('betrieb')?.onboardingFertig) return [];
    return [
      {
        schluessel: 'konto:sichern',
        art: 'info',
        titel: 'Daten sichern & Team einladen',
        text: 'Deine Daten liegen nur in diesem Browser. Mit einem Konto sind sie gesichert und dein Team arbeitet auf seinen Handys mit.',
        gewicht: 30,
        fuerRollen: ['chef', 'buero'],
        pfad: KONTO_PFAD,
        aktionen: [{ aktion: 'konto.oeffnen', label: 'Konto anlegen', primaer: true }],
      },
    ];
  },

  aktionen: {
    'konto.oeffnen': () => KONTO_PFAD,
  },

  suche: (q) =>
    passt(q, 'konto anmelden abmelden login geräte handy sichern sicherung team einladen benachrichtigungen push sync abgleich')
      ? [{ titel: 'Konto & Geräte', untertitel: 'Anmelden, Daten sichern, Benachrichtigungen', pfad: KONTO_PFAD, typ: 'Funktion', relevanz: 20 }]
      : [],
});
