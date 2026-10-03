import { defineModul, pfadZu, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { automationAn, erledigt } from '@core/macher';
import { datum, datumKurz, heute, plusTage } from '@core/format';
import type { Auftrag, ID } from '@core/objects';
import { Kennzahl, Raster, Abschnitt } from '@ui/index';
import { useDatenstand } from '@core/db';
import { vertragFuerAuftrag } from '../servicevertraege/daten';
import { WartungUebersicht } from './WartungUebersicht';
import { AnlageWartungPanel, WartungTab } from './WartungTab';
import {
  einordnen,
  geradeAbgeschlossen,
  kundeBenachrichtigen,
  kundeBenachrichtigt,
  offenerWartungsauftrag,
  REGEL_ANLEGEN,
  REGEL_FORTSCHREIBEN,
  terminVorschlagen,
  wartungenAnlegen,
  wartungFortschreiben,
  wartungsauftragAnlegen,
  wartungsTermin,
} from './logik';

/** Mehrere Änderungen kurz abwarten (z. B. beim Einrichten), dann einmal prüfen */
function entprellt(fn: () => void, ms = 1500) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (t) clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}

function anlegen() {
  if (!db.betrieb.get('betrieb')?.onboardingFertig) return;
  wartungenAnlegen();
}

/** Kleines Widget auf der Aufträge-Seite – nur wenn etwas ansteht */
function WartungWidget() {
  useDatenstand();
  const t = heute();
  const anlagen = db.anlagen.all().filter((a) => !!a.naechsteWartung);
  const ueber = anlagen.filter((a) => einordnen(a.naechsteWartung!, t) === 'ueberfaellig').length;
  const woche = anlagen.filter((a) => einordnen(a.naechsteWartung!, t) === 'woche').length;
  if (!ueber && !woche) return null;
  return (
    <Abschnitt titel="Wartung">
      <Raster min={180}>
        {ueber > 0 && <Kennzahl label="Wartungen überfällig" wert={ueber} ton="gefahr" to="/auftraege/wartung" />}
        {woche > 0 && <Kennzahl label="Wartungen diese Woche" wert={woche} to="/auftraege/wartung" />}
      </Raster>
    </Abschnitt>
  );
}

export default defineModul({
  id: 'wartung',
  titel: 'Wartung & Service',
  bereich: 'auftraege',
  beschreibung: 'Fällige Wartungen im Blick – Aufträge, Prüfpunkte und Kundeninfo legt Macher an.',
  icon: 'werkzeug',
  gewicht: 60,
  routen: [{ pfad: '', element: WartungUebersicht }],
  hubWidget: WartungWidget,
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Wartung',
      component: WartungTab,
      gewicht: 85,
      sichtbar: (id) => db.auftraege.get(id)?.art === 'wartung',
      zaehler: (id) => db.aufgaben.where((t) => t.auftragId === id && t.quelle === 'wartung' && !t.erledigt).length || undefined,
    },
  ],
  panels: [{ objekt: 'anlagen', component: AnlageWartungPanel, gewicht: 80 }],
  kurzinfo: () => {
    const t = heute();
    const n = db.anlagen.where((a) => !!a.naechsteWartung && a.naechsteWartung < t).length;
    return n ? { text: n === 1 ? '1 Wartung überfällig' : `${n} Wartungen überfällig`, ton: 'gefahr' } : undefined;
  },
  automationen: [
    {
      id: REGEL_ANLEGEN,
      titel: 'Wartungsaufträge anlegen',
      beschreibung: 'Legt vor fälligen Wartungen Aufträge an, bündelt Anlagen am selben Ort und setzt Prüfpunkte als Aufgaben.',
      standardAn: true,
      minuten: 15,
      start: () => {
        const pruefe = entprellt(anlegen);
        const aus = on('anlagen.*', pruefe);
        const t = setInterval(anlegen, 6 * 60 * 60 * 1000);
        return () => {
          aus();
          clearInterval(t);
        };
      },
      pruefen: anlegen,
    },
    {
      id: REGEL_FORTSCHREIBEN,
      titel: 'Nächste Wartung eintragen',
      beschreibung: 'Ist ein Wartungsauftrag fertig, trägt Macher die Wartung an den Anlagen ein und rechnet die nächste aus. Wartungen aus Verträgen gehen ohne Rechnung auf erledigt.',
      standardAn: true,
      minuten: 3,
      start: () =>
        on('auftraege.updated', (e) => {
          const neu = e.objekt as Auftrag | undefined;
          const vorher = e.vorher as Auftrag | undefined;
          if (!neu || neu.art !== 'wartung') return;
          if (geradeAbgeschlossen(vorher, neu)) {
            const am = (neu.abgeschlossenAm ?? new Date().toISOString()).slice(0, 10);
            const n = wartungFortschreiben(neu.id, am);
            if (n) {
              const naechste = (neu.anlageIds ?? []).map((x) => db.anlagen.get(x)?.naechsteWartung).filter(Boolean).sort()[0];
              erledigt(REGEL_FORTSCHREIBEN, `Wartung an ${n === 1 ? '1 Anlage' : `${n} Anlagen`} eingetragen`, {
                text: naechste ? `Nächste Wartung: ${datum(naechste)}.` : undefined,
                bezug: { typ: 'auftraege', id: neu.id },
              });
            }
          }
          // Wartung aus Servicevertrag: nichts abzurechnen
          if (neu.phase === 'abrechnung' && vorher?.phase !== 'abrechnung') {
            const v = vertragFuerAuftrag(neu);
            if (v) {
              db.auftraege.update(neu.id, { phase: 'erledigt', abgeschlossenAm: neu.abgeschlossenAm ?? new Date().toISOString() }, { text: `Im Servicevertrag ${v.nummer} enthalten – keine Rechnung nötig` });
              erledigt(REGEL_FORTSCHREIBEN, `${neu.nummer} ohne Rechnung abgeschlossen`, { text: `Im Servicevertrag ${v.nummer} enthalten.`, bezug: { typ: 'auftraege', id: neu.id } });
            }
          }
        }),
    },
  ],
  aktionen: {
    'wartung.auftragAnlegen': (p) => {
      const { anlageId } = p as { anlageId: ID };
      const a = db.anlagen.get(anlageId);
      if (!a) return;
      const vorhanden = offenerWartungsauftrag(anlageId);
      const auftrag = vorhanden ?? wartungsauftragAnlegen([a]);
      return pfadZu({ typ: 'auftraege', id: auftrag.id });
    },
    'wartung.terminVorschlagen': (p) => terminVorschlagen((p as { auftragId: ID }).auftragId),
    'wartung.kundeBenachrichtigen': (p) => {
      const { auftragId } = p as { auftragId: ID };
      if (!kundeBenachrichtigt(auftragId)) kundeBenachrichtigen(auftragId);
    },
  },
  hinweise: () => {
    const t = heute();
    const out: HinweisVorschlag[] = [];
    // Überfällig ohne Auftrag (z. B. Automation aus oder Anlage gerade erst erfasst)
    const autoAn = automationAn(REGEL_ANLEGEN);
    for (const a of db.anlagen.where((x) => !!x.naechsteWartung && x.naechsteWartung < t && !offenerWartungsauftrag(x.id))) {
      if (autoAn && a.naechsteWartung! >= plusTage(t, -1)) continue; // Macher legt gleich selbst an
      const k = db.kunden.get(a.kundeId);
      out.push({
        schluessel: `wartung-ueberfaellig:${a.id}:${a.naechsteWartung}`,
        art: 'problem',
        titel: `Wartung überfällig: ${a.typ} bei ${k?.name ?? 'Kunde'}`,
        text: `Fällig seit ${datum(a.naechsteWartung)}. Noch kein Wartungsauftrag.`,
        bezug: { typ: 'anlagen', id: a.id },
        gewicht: 70,
        faellig: a.naechsteWartung,
        pfad: '/auftraege/wartung',
        aktionen: [{ aktion: 'wartung.auftragAnlegen', label: 'Wartungsauftrag anlegen', primaer: true, payload: { anlageId: a.id } }],
      });
    }
    for (const a of db.auftraege.where((x) => x.art === 'wartung' && ['anfrage', 'beauftragt'].includes(x.phase))) {
      const k = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
      const faellig = (a.anlageIds ?? []).map((x) => db.anlagen.get(x)?.naechsteWartung).filter(Boolean).sort()[0];
      const termin = wartungsTermin(a.id);
      if (!termin) {
        if (faellig && faellig > plusTage(t, 21)) continue;
        out.push({
          schluessel: `wartung-termin:${a.id}`,
          art: 'entscheidung',
          titel: `Wartung einplanen: ${k}`,
          text: `${a.titel}${faellig ? `, fällig ${datum(faellig)}` : ''}. Noch kein Termin.`,
          bezug: { typ: 'auftraege', id: a.id },
          gewicht: faellig && faellig < t ? 66 : 60,
          faellig,
          aktionen: [{ aktion: 'wartung.terminVorschlagen', label: 'Termin vorschlagen', primaer: true, payload: { auftragId: a.id } }],
        });
      } else if (!kundeBenachrichtigt(a.id) && !termin.selbstGebucht) {
        out.push({
          schluessel: `wartung-kunde:${a.id}:${termin.start}`,
          art: 'freigabe',
          titel: `Kunde über Wartung informieren: ${k}`,
          text: `Termin ${datumKurz(termin.start)} – Nachricht ist vorbereitet – prüfen und freigeben.`,
          bezug: { typ: 'auftraege', id: a.id },
          gewicht: 45,
          faellig: termin.start.slice(0, 10),
          fuerRollen: ['chef', 'buero'],
          aktionen: [{ aktion: 'wartung.kundeBenachrichtigen', label: 'Nachricht senden', primaer: true, payload: { auftragId: a.id } }],
        });
      }
    }
    return out;
  },
  seed: () => {
    // erst nach den anderen Modulen (Serviceverträge, Serien) anlegen, damit Bezüge stimmen
    if (automationAn(REGEL_ANLEGEN)) setTimeout(anlegen, 0);
  },
});
