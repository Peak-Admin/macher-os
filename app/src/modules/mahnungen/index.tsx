import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import { euro, heute } from '@core/format';
import type { ID } from '@core/objects';
import { offenePosten, istUeberfaellig } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';
import { KundeOffenPanel, MahnungDetail, MahnungDruck, MahnungenListe, RechnungMahnungenTab, sendenUndMail } from './Ansichten';
import { STUFE_LABEL, mahnungen, mahnungenZu, pruefen, warten } from './daten';

function taeglichePruefung() {
  if (!db.betrieb.get('betrieb')?.onboardingFertig) return;
  const t = heute();
  setzeEinstellung('mahnungen.letztePruefung', t);
  const { neu, verworfen } = pruefen(t);
  for (const m of neu) {
    const r = rechnungX(m.rechnungId);
    erledigt('mahnungen.pruefen', `${STUFE_LABEL[m.stufe]} vorbereitet: ${r?.nummer}`, {
      text: `${db.kunden.get(r?.kundeId)?.name ?? ''} · offen ${euro(m.offen)} – wartet auf deine Freigabe`,
      bezug: { typ: 'rechnungen', id: m.rechnungId },
    });
  }
  for (const m of verworfen) {
    const r = rechnungX(m.rechnungId);
    erledigt('mahnungen.pruefen', `Mahnung zu ${r?.nummer ?? 'Rechnung'} verworfen – ist bezahlt`, { bezug: { typ: 'rechnungen', id: m.rechnungId }, minuten: 2 });
  }
}

export default defineModul({
  id: 'mahnungen',
  titel: 'Mahnungen',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Erinnert und mahnt überfällige Rechnungen – du gibst nur noch frei.',
  icon: 'mail',
  gewicht: 75,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: MahnungenListe },
    { pfad: ':id', element: MahnungDetail },
  ],
  vollbildRouten: [{ pfad: '/druck/mahnung/:id', element: MahnungDruck }],
  kurzinfo: () => {
    const f = mahnungen.where((m) => m.status === 'vorbereitet' && (!m.wartenBis || m.wartenBis <= heute())).length;
    if (f) return { text: f === 1 ? '1 Schreiben zur Freigabe' : `${f} Schreiben zur Freigabe`, ton: 'achtung' };
    const u = offenePosten().filter((r) => istUeberfaellig(r)).length;
    return u ? { text: u === 1 ? '1 Rechnung überfällig' : `${u} Rechnungen überfällig`, ton: 'aktiv' } : { text: 'Nichts überfällig', ton: 'erfolg' };
  },
  panels: [{ objekt: 'kunden', component: KundeOffenPanel, gewicht: 70 }],
  tabs: [
    {
      objekt: 'rechnungen',
      titel: 'Mahnungen',
      component: RechnungMahnungenTab,
      gewicht: 40,
      zaehler: (id) => mahnungenZu(id).length || undefined,
      sichtbar: (id) => mahnungenZu(id).length > 0,
    },
  ],
  hinweise: () =>
    offenePosten()
      .filter((r) => (r.mahnstufe ?? 0) >= 3 && istUeberfaellig(r))
      .filter((r) => {
        const letzte = mahnungenZu(r.id).filter((m) => m.status === 'versendet' && m.stufe === 3).pop();
        return !letzte || letzte.frist < heute();
      })
      .map((r) => ({
        schluessel: `mahnverfahren:${r.id}`,
        art: 'entscheidung' as const,
        titel: `2. Mahnung ohne Erfolg: ${db.kunden.get(r.kundeId)?.name ?? ''}`,
        text: `${r.nummer} ist trotz zweier Mahnungen offen. Entscheide: gerichtliches Mahnverfahren, Inkasso oder Ratenzahlung.`,
        bezug: { typ: 'rechnungen' as const, id: r.id },
        gewicht: 70,
        fuerRollen: ['chef' as const],
        pfad: `/betrieb/rechnungen/${r.id}`,
      })),
  aktionen: {
    'mahnung.senden': (payload) => {
      const m = sendenUndMail((payload as { mahnungId: ID }).mahnungId);
      return m ? `/betrieb/mahnungen/${m.id}` : undefined;
    },
    'mahnung.warten': (payload) => {
      warten((payload as { mahnungId: ID }).mahnungId);
    },
    'mahnung.ansehen': (payload) => `/betrieb/mahnungen/${(payload as { mahnungId: ID }).mahnungId}`,
  },
  automationen: [
    {
      id: 'mahnungen.pruefen',
      titel: 'Fälligkeiten täglich prüfen und Mahnungen vorbereiten',
      beschreibung: 'Macher prüft jeden Tag die offenen Rechnungen, bereitet Zahlungserinnerung und Mahnungen vor und fragt dich vor dem Versand.',
      standardAn: true,
      minuten: 10,
      start: () => {
        // einmal je Tag – beim Start und stündlich, falls die App über Mitternacht offen ist
        const t = setInterval(() => {
          if (einstellung('mahnungen.letztePruefung', '') !== heute()) taeglichePruefung();
        }, 60 * 60 * 1000);
        return () => clearInterval(t);
      },
      pruefen: taeglichePruefung,
    },
  ],
  seed: () => taeglichePruefung(),
});
