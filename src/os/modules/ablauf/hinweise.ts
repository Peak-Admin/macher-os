/** Erinnerungen der Ablauf-Engine für „Braucht dich“ – live berechnet, verschwinden von selbst */
import { db } from '@core/db';
import { datum } from '@core/format';
import { aktionVorhanden, type HinweisVorschlag } from '@core/modul';
import { auftragPfad, schrittFuer } from '@modules/auftraege/daten';
import { istOffen } from '@modules/auftraege/logik';
import { materialKey, standVon, tageSeit } from './daten';
import { einstellung } from '@core/einstellungen';
import { weiterVonHand } from './logik';

type HAktion = NonNullable<HinweisVorschlag['aktionen']>[number];

export function ablaufHinweise(): HinweisVorschlag[] {
  const liste: HinweisVorschlag[] = [];
  for (const a of db.auftraege.all().filter(istOffen)) {
    const st = standVon(a);
    const payload = { auftragId: a.id };
    const bezug = { typ: 'auftraege' as const, id: a.id };
    const kunde = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
    const weiterZu = weiterVonHand(st.ablauf, st);
    const manuell = !!weiterZu;
    const naechste = schrittFuer(a);
    const hauptaktion: HAktion = naechste?.aktion && aktionVorhanden(naechste.aktion) ? { aktion: naechste.aktion, label: naechste.label, payload: naechste.payload } : { aktion: 'auftrag.oeffnen', label: 'Auftrag öffnen', payload };
    const erledigtAktion: HAktion = { aktion: 'ablauf.weiter', label: 'Erledigt', payload };

    // 1. Frist eines Schritts überschritten
    if (st.ueberfaellig) {
      const tage = tageSeit(st.seit);
      liste.push({
        schluessel: `ablauf-frist:${a.id}:${st.schritt.id}`,
        art: 'problem',
        titel: `${a.titel}: ${st.schritt.erinnerung ?? `„${st.schritt.label}“ ist überfällig`}`,
        text: `${kunde} · Schritt „${st.schritt.label}“${tage != null ? ` seit ${tage === 1 ? '1 Tag' : `${tage} Tagen`}` : ''} · fällig war ${datum(st.faellig)}`,
        bezug,
        gewicht: a.dringend ? 70 : 56,
        fuerMitarbeiterId: st.zustaendigId,
        faellig: st.faellig,
        aktionen: manuell ? [{ ...erledigtAktion, primaer: true }, { aktion: 'auftrag.oeffnen', label: 'Auftrag öffnen', payload }] : [{ ...hauptaktion, primaer: true }],
        pfad: auftragPfad(a.id),
      });
      continue;
    }

    // 2. Nach der Zusage: Materialbedarf prüfen
    if (st.schritt.id === 'vorbereitung' && a.phase === 'beauftragt' && !einstellung(materialKey(a.id), false)) {
      const bedarf = aktionVorhanden('material.bedarf-oeffnen');
      liste.push({
        schluessel: `ablauf-material:${a.id}`,
        art: 'entscheidung',
        titel: `${a.titel}: Materialbedarf prüfen`,
        text: `${kunde} hat zugesagt. Ist alles da oder muss etwas bestellt werden?`,
        bezug,
        gewicht: 47,
        fuerMitarbeiterId: st.zustaendigId,
        aktionen: [
          bedarf ? { aktion: 'material.bedarf-oeffnen', label: 'Bedarf ansehen', primaer: true, payload } : { aktion: 'auftrag.oeffnen', label: 'Auftrag öffnen', primaer: true, payload },
          { aktion: 'ablauf.material-geklaert', label: 'Material ist geklärt', payload },
        ],
        pfad: auftragPfad(a.id),
      });
      continue;
    }

    // 3. Abgenommen, aber noch keine Rechnung: vorbereiten vorschlagen
    if (a.phase === 'abrechnung' && aktionVorhanden('rechnung.erstellen') && !db.rechnungen.where((r) => r.auftragId === a.id && r.status !== 'storniert' && r.art !== 'gutschrift').length) {
      liste.push({
        schluessel: `ablauf-rechnung:${a.id}`,
        art: 'entscheidung',
        titel: `${a.titel}: Rechnung vorbereiten`,
        text: `${kunde} · Die Arbeit ist abgenommen. Macher legt den Entwurf aus Angebot, Material und Zeiten an.`,
        bezug,
        gewicht: 60,
        fuerRollen: ['chef', 'buero'],
        aktionen: [{ aktion: 'rechnung.erstellen', label: 'Rechnung erstellen', primaer: true, payload: { auftragId: a.id } }],
        pfad: auftragPfad(a.id),
      });
    }
  }
  return liste;
}
