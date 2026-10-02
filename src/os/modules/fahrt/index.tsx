import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { benachrichtigen, erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { datumKurz, datumVon, minutenVon, plusTage, personName, uhrAus, uhrzeit, zeitpunkt } from '@core/format';
import type { ID } from '@core/objects';
import { kontextAusDb } from '../autoplanung/basis';
import { planbareMitarbeiter } from '../verfuegbarkeit/daten';
import { pufferMinuten, tagesroute, uebergaengeAm } from './daten';
import { RouteHeute } from './RouteHeute';

const ROUTE_AUTOMATION = 'fahrt.route-morgens';

export default defineModul({
  id: 'fahrt',
  titel: 'Fahrt & Route',
  bereich: 'plan',
  beschreibung: 'Fahrzeiten zwischen Einsätzen prüfen und die Tagesroute direkt in Google Maps öffnen.',
  icon: 'route',
  gewicht: 55,
  navigation: 'hub',
  routen: [{ pfad: '', element: RouteHeute }],
  hinweise: () => {
    const ctx = kontextAusDb();
    const puffer = pufferMinuten();
    const r: HinweisVorschlag[] = [];
    for (let i = 0; i <= 7; i++) {
      const d = plusTage(ctx.heute, i);
      for (const m of planbareMitarbeiter(ctx, ctx.heute)) {
        for (const u of uebergaengeAm(ctx, m.id, d, puffer)) {
          if (u.pruefung.ergebnis !== 'problem' || u.nach.status === 'erledigt') continue;
          const schluessel = `fahrt-knapp:${u.von.id}:${u.nach.id}`;
          if (r.some((x) => x.schluessel === schluessel)) continue;
          const neuStart = minutenVon(u.von.ende) + u.strecke.minuten + puffer;
          r.push({
            schluessel,
            art: 'problem',
            titel: `Fahrzeit reicht nicht: ${personName(m)}, ${datumKurz(d)}`,
            text: `${u.pruefung.text} ${u.pruefung.loesung ?? ''}`.trim(),
            bezug: { typ: 'termine', id: u.nach.id },
            gewicht: i <= 1 ? 64 : 50,
            faellig: d,
            pfad: pfadZu({ typ: 'termine', id: u.nach.id }),
            aktionen:
              neuStart < 24 * 60
                ? [{ aktion: 'fahrt.schieben', label: `Auf ${uhrAus(neuStart)} Uhr schieben`, primaer: true, payload: { terminId: u.nach.id, start: uhrAus(neuStart) } }]
                : undefined,
          });
        }
      }
    }
    return r;
  },
  aktionen: {
    /** Termin auf neue Uhrzeit schieben, Dauer bleibt gleich */
    'fahrt.schieben': (payload) => {
      const { terminId, start } = (payload ?? {}) as { terminId?: ID; start?: string };
      const t = db.termine.get(terminId);
      if (!t || !start) return;
      const dauer = new Date(t.ende).getTime() - new Date(t.start).getTime();
      const neu = zeitpunkt(datumVon(t.start), start);
      db.termine.update(t.id, { start: neu, ende: new Date(new Date(neu).getTime() + dauer).toISOString() }, { text: `Wegen Fahrzeit auf ${start} Uhr verschoben` });
      erledigt('fahrt.geschoben', `Termin verschoben: ${t.titel}`, { text: `Von ${uhrzeit(t.start)} auf ${start} Uhr, damit die Fahrzeit reicht.`, bezug: { typ: 'termine', id: t.id }, minuten: 5 });
      return pfadZu({ typ: 'termine', id: t.id });
    },
  },
  automationen: [
    {
      id: ROUTE_AUTOMATION,
      titel: 'Tagesroute morgens an Monteure',
      beschreibung: 'Wer heute mehrere Einsätze hat, bekommt morgens seine Route mit Google-Maps-Link.',
      standardAn: true,
      minuten: 5,
      start: () => () => {},
      pruefen: () => {
        const ctx = kontextAusDb();
        const key = `fahrt.route.gesendet.${ctx.heute}`;
        const gesendet = einstellung<ID[]>(key, []);
        const neu: string[] = [];
        for (const m of planbareMitarbeiter(ctx, ctx.heute)) {
          if (gesendet.includes(m.id)) continue;
          const r = tagesroute(ctx, m.id, ctx.heute);
          if (r.stopps.length < 2 || !r.mapsLink) continue;
          benachrichtigen(`Deine Route heute: ${r.stopps.length} Stopps`, {
            text: `${r.geschaetzt ? 'ca. ' : ''}${Math.round(r.kmGesamt)} km, ${r.minutenGesamt} min Fahrt. Route: ${r.mapsLink}`,
            fuer: m.id,
            art: 'tag.route',
            grund: 'Du fährst heute die Einsätze.',
          });
          gesendet.push(m.id);
          neu.push(personName(m));
        }
        if (neu.length) {
          setzeEinstellung(key, gesendet);
          erledigt(ROUTE_AUTOMATION, `Tagesroute verschickt an ${neu.join(', ')}`, { minuten: 5 * neu.length });
        }
      },
    },
  ],
});
