import { defineModul, type HinweisVorschlag } from '@core/modul';
import { datum, euro } from '@core/format';
import { DeinPlan } from './DeinPlan';
import { LesemodusMeldung } from './LesemodusMeldung';
import { LESE_GRUND_TEXT, STATUS_TEXT, bilanzText, buchbar, wertspitze } from './regeln';
import { aktuellerStand, aktuellerZustand, eigeneBilanz, gebuchterPlan, lesemodusEinhaengen, passenderPlan, personen } from './stand';

const PFAD = '/betrieb/abo';
const oeffnen = [{ aktion: 'abo.oeffnen', label: 'Plan wählen', primaer: true }];

function hinweise(): HinweisVorschlag[] {
  const z = aktuellerZustand();
  const plan = passenderPlan();
  const bilanz = bilanzText(eigeneBilanz());
  const preis = plan.monatlichCent != null ? `${plan.name} für ${euro(plan.monatlichCent)} im Monat` : `${plan.name} (Preis auf Anfrage)`;
  const basis = { fuerRollen: ['chef' as const], pfad: PFAD };

  // Wertspitzen: nur an Tag 21, 27 und 30 – mit echten Zahlen aus den eigenen Daten
  const spitze = wertspitze(z);
  if (spitze) {
    const rest = z.tageUebrig === 0 ? 'Heute ist dein letzter Testtag.' : `Noch ${z.tageUebrig} ${z.tageUebrig === 1 ? 'Tag' : 'Tage'} Testphase.`;
    return [
      {
        ...basis,
        schluessel: `abo-wertspitze:${spitze}`,
        art: spitze === 30 ? 'entscheidung' : 'info',
        titel: bilanz ?? rest,
        text: `${bilanz ? rest + ' ' : ''}Dein Plan: ${preis} – alles drin, monatlich kündbar.${spitze === 30 ? ' Ab morgen bleibt alles lesbar, Neues anlegen geht erst wieder mit Plan.' : ''}`,
        gewicht: spitze === 30 ? 70 : spitze === 27 ? 50 : 35,
        aktionen: [{ aktion: 'abo.oeffnen', label: 'Plan ansehen', primaer: true }],
      },
    ];
  }
  if (z.status === 'lesemodus') {
    return [
      {
        ...basis,
        schluessel: `abo-lesemodus:${z.grund}`,
        art: 'problem',
        titel: 'Gerade nur lesen – wähl deinen Plan',
        text: `${LESE_GRUND_TEXT[z.grund ?? 'beendet']}${bilanz ? ` ${bilanz}.` : ''}`,
        gewicht: 85,
        aktionen: oeffnen,
      },
    ];
  }
  if (z.status === 'zahlung_offen') {
    const stufe = z.mahnstufe ?? 1;
    return [
      {
        ...basis,
        schluessel: `abo-zahlung:${z.offenSeit}:${stufe}`,
        art: stufe === 3 ? 'problem' : 'entscheidung',
        titel: stufe === 1 ? 'Die Abbuchung für Macher OS hat nicht geklappt' : stufe === 2 ? 'Erinnerung: Abbuchung für Macher OS noch offen' : 'Letzte Erinnerung: Abbuchung noch offen',
        text: `Prüf bitte deine Zahlungsart. Alles läuft normal weiter bis einschließlich ${datum(z.kulanzBis)}${stufe === 3 ? ', danach nur noch lesen' : ''}.`,
        gewicht: stufe === 3 ? 80 : stufe === 2 ? 60 : 45,
        aktionen: [{ aktion: 'abo.oeffnen', label: 'Zahlungsart prüfen', primaer: true }],
      },
    ];
  }
  // Team gewachsen oder geschrumpft: vor einer Preisänderung fragen
  const gebucht = gebuchterPlan(z);
  if (z.status === 'aktiv' && gebucht && gebucht.id !== plan.id && buchbar(plan)) {
    return [
      {
        ...basis,
        schluessel: `abo-planwechsel:${gebucht.id}:${plan.id}`,
        art: 'entscheidung',
        titel: `${personen()} aktive Leute – passender Plan: ${plan.name}`,
        text: `Bisher ${gebucht.name}. Der Preis ändert sich erst, wenn du zustimmst.`,
        gewicht: 40,
        aktionen: [{ aktion: 'abo.oeffnen', label: 'Plan ansehen', primaer: true }],
      },
    ];
  }
  return [];
}

export default defineModul({
  id: 'abo',
  titel: 'Dein Plan',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Ein Preis je Betrieb nach Teamgröße, alles drin: Testphase, Abbuchung, Rechnungen, kündigen.',
  icon: 'euro',
  gewicht: 45,
  routen: [{ pfad: '', element: DeinPlan }],
  global: LesemodusMeldung,
  init: lesemodusEinhaengen,
  kurzinfo: () => {
    const z = aktuellerZustand();
    if (z.status === 'lesemodus') return { text: 'Nur lesen – Plan wählen', ton: 'achtung' };
    if (z.status === 'zahlung_offen') return { text: 'Abbuchung offen', ton: 'achtung' };
    if (z.status === 'test') return { text: `Testphase bis ${datum(z.testBis)}`, ton: 'aktiv' };
    if (z.status === 'gekuendigt') return { text: `Gekündigt zum ${datum(z.aktivBis)}` };
    const s = aktuellerStand();
    return { text: s.naechsteAbbuchung ? `${STATUS_TEXT.aktiv} · nächste Abbuchung ${datum(s.naechsteAbbuchung)}` : STATUS_TEXT.aktiv, ton: 'erfolg' };
  },
  hinweise,
  aktionen: { 'abo.oeffnen': () => PFAD },
  suche: (q) =>
    /plan|abo|bezahl|kündig|kuendig|testphase|zahlungsart|lastschrift|sepa|preis|macher os rechnung|lesemodus|nur lesen/i.test(q)
      ? [{ typ: 'Einstellung', titel: 'Dein Plan', untertitel: 'Plan, Testphase, Zahlungsart, Rechnungen, kündigen', pfad: PFAD, relevanz: 26 }]
      : [],
});
