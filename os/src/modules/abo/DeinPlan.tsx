import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messen } from '@core/messung';
import { datum, euro, plusTage } from '@core/format';
import { useDarf } from '@core/session';
import { Button, Dialog, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Segmente, Seite, Stapel, Status, Textfeld, Zeile, useBestaetigen, useToast } from '@ui/index';
import type { Ton } from '@core/modul';
import { NICHT_VERBUNDEN_TEXT, aboApi } from './api';
import {
  KUENDIGUNGS_GRUENDE,
  LESE_GRUND_TEXT,
  PREISE_VORLAEUFIG,
  STATUS_TEXT,
  abbuchungCent,
  bilanzText,
  buchbar,
  jahresRabattProzent,
  type AboStatus,
  type Intervall,
  type Plan,
} from './regeln';
import { standUebernehmen, useAbo } from './stand';
import './abo.css';

const TON: Record<AboStatus, Ton> = { test: 'aktiv', aktiv: 'erfolg', zahlung_offen: 'achtung', lesemodus: 'achtung', gekuendigt: 'neutral' };

/** Monatspreis als Text, z. B. „89 € im Monat“ */
function preisText(p: Plan, intervall: Intervall) {
  const monat = intervall === 'jahr' ? p.jaehrlichCent : p.monatlichCent;
  return monat == null ? 'Preis auf Anfrage' : `${euro(monat)} im Monat`;
}

export function DeinPlan() {
  const { stand, zustand: z, passend, gebucht, personen, bilanz, heute } = useAbo();
  const admin = useDarf('admin');
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [fragen, bestaetigen] = useBestaetigen();
  const [intervall, setIntervall] = useState<Intervall>(stand.intervall ?? 'monat');
  const [laedt, setLaedt] = useState<'buchen' | 'portal' | 'fortsetzen' | null>(null);
  const [meldung, setMeldung] = useState<{ ton: Ton; titel?: string; text: string } | null>(null);
  const [kuendigen, setKuendigen] = useState(false);
  const zurueck = useRef(params.get('bezahlt') === '1' ? 'bezahlt' : params.get('abgebrochen') === '1' ? 'abgebrochen' : null);

  const plan = gebucht ?? passend;
  const imAbo = z.status === 'aktiv' || z.status === 'zahlung_offen' || z.status === 'gekuendigt';
  const serverAbo = stand.quelle === 'server' && imAbo;

  // Stand vom Server holen (ohne Backend bleibt der lokale Stand – ehrlich beschriftet)
  useEffect(() => {
    let ab = false;
    const holen = async (versuch: number) => {
      const r = await aboApi.stand();
      if (ab || !r.ok) return;
      standUebernehmen(r.daten);
      // Nach dem Bezahlen kann der Webhook ein paar Sekunden brauchen
      if (zurueck.current === 'bezahlt' && r.daten.plan === 'test' && versuch < 4) setTimeout(() => void holen(versuch + 1), 2000);
    };
    void holen(0);
    if (zurueck.current === 'bezahlt') {
      messen('bezahlen.fertig', { plan: plan.id });
      setMeldung({ ton: 'erfolg', titel: 'Danke – dein Plan ist gebucht.', text: 'Die erste Rechnung findest du gleich hier unten. Alles läuft weiter wie bisher.' });
    } else if (zurueck.current === 'abgebrochen') {
      setMeldung({ ton: 'neutral', text: 'Kein Problem – es wurde nichts gebucht.' });
    }
    if (zurueck.current) navigate('/betrieb/abo', { replace: true });
    return () => {
      ab = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nichtVerbunden = () =>
    setMeldung({
      ton: 'neutral',
      titel: NICHT_VERBUNDEN_TEXT.split(' – ')[0] + '.',
      text:
        z.status === 'test'
          ? `Du kannst weiter testen – noch ${z.tageUebrig} ${z.tageUebrig === 1 ? 'Tag' : 'Tage'}. Wir verlängern nichts heimlich und buchen nichts ab.`
          : 'Bis dahin bleibt alles lesbar und exportierbar. Sobald es eingerichtet ist, buchst du hier mit einem Klick.',
    });

  const buchen = async () => {
    if (gebucht && gebucht.id !== passend.id) {
      const ok = await fragen(
        `Plan auf ${passend.name} ändern?`,
        `Dein Team hat jetzt ${personen} aktive ${personen === 1 ? 'Person' : 'Leute'}. Neu: ${preisText(passend, stand.intervall ?? intervall)} statt ${preisText(gebucht, stand.intervall ?? intervall)}. Der Unterschied wird tagesgenau verrechnet.`,
        'Plan ändern',
      );
      if (!ok) return;
    }
    setLaedt('buchen');
    setMeldung(null);
    messen('bezahlen.gestartet', { plan: passend.id, intervall, status: z.status });
    const r = await aboApi.checkout(passend.id, intervall);
    setLaedt(null);
    if (r.ok && r.daten.url) return void location.assign(r.daten.url);
    if (r.ok) {
      const s = await aboApi.stand();
      if (s.ok) standUebernehmen(s.daten);
      return toast(`Plan geändert: ${passend.name}.`);
    }
    if (r.nichtVerbunden) return nichtVerbunden();
    setMeldung({ ton: 'achtung', text: r.fehler });
  };

  const portal = async () => {
    setLaedt('portal');
    const r = await aboApi.portal();
    setLaedt(null);
    if (r.ok) return void location.assign(r.daten.url);
    if (r.nichtVerbunden) return nichtVerbunden();
    setMeldung({ ton: 'achtung', text: r.fehler });
  };

  const fortsetzen = async () => {
    setLaedt('fortsetzen');
    const r = await aboApi.fortsetzen();
    setLaedt(null);
    if (r.ok) {
      standUebernehmen({ ...stand, plan: r.daten.plan });
      return toast('Schön, dass du bleibst. Dein Plan läuft weiter.');
    }
    if (r.nichtVerbunden) return nichtVerbunden();
    setMeldung({ ton: 'achtung', text: r.fehler });
  };

  // genau eine Hauptaktion je Zustand
  const planWechsel = z.status === 'aktiv' && gebucht && gebucht.id !== passend.id;
  const haupt = !admin
    ? null
    : !buchbar(passend) && !imAbo
      ? null
      : z.status === 'test' || z.status === 'lesemodus'
        ? { label: 'Plan buchen', onClick: buchen, laedt: laedt === 'buchen' }
        : z.status === 'zahlung_offen'
          ? { label: 'Zahlungsart ändern', onClick: portal, laedt: laedt === 'portal' }
          : z.status === 'gekuendigt'
            ? { label: 'Kündigung zurücknehmen', onClick: fortsetzen, laedt: laedt === 'fortsetzen' }
            : planWechsel && buchbar(passend)
              ? { label: 'Plan anpassen', onClick: buchen, laedt: laedt === 'buchen' }
              : null;

  const statusZeile =
    z.status === 'test'
      ? `noch ${z.tageUebrig} ${z.tageUebrig === 1 ? 'Tag' : 'Tage'}`
      : z.status === 'zahlung_offen'
        ? `Erinnerung ${z.mahnstufe} von 3`
        : z.status === 'gekuendigt'
          ? `bis ${datum(z.aktivBis)}`
          : undefined;

  const wert = bilanzText(bilanz);

  return (
    <Seite
      titel="Dein Plan"
      untertitel="Ein Preis für deinen Betrieb – alles drin, monatlich kündbar."
      status={<Status ton={TON[z.status]}>{STATUS_TEXT[z.status] + (statusZeile ? ` · ${statusZeile}` : '')}</Status>}
      aktion={
        haupt && (
          <Button onClick={() => void haupt.onClick()} laedt={haupt.laedt} laedtText="Einen Moment …">
            {haupt.label}
          </Button>
        )
      }
    >
      <Stapel abstand={24}>
        {meldung && (
          <Meldung ton={meldung.ton} titel={meldung.titel}>
            {meldung.text}
          </Meldung>
        )}
        {z.status === 'lesemodus' && (
          <Meldung ton="achtung" titel="Gerade kannst du alles lesen, aber nichts Neues anlegen.">
            {LESE_GRUND_TEXT[z.grund ?? 'beendet']} Kundenbereich, offene Rechnungen und Export laufen weiter. Nichts geht verloren.
          </Meldung>
        )}
        {z.status === 'zahlung_offen' && (
          <Meldung ton="achtung" titel="Die letzte Abbuchung hat nicht geklappt.">
            Das passiert – meist ist das Konto kurz nicht gedeckt oder die Karte abgelaufen. Prüf bitte deine Zahlungsart. Alles läuft
            normal weiter bis einschließlich {datum(z.kulanzBis)}.
          </Meldung>
        )}

        {/* 1 · Plan */}
        <Karte oberzeile="Plan" titel={`${plan.name} · ${preisText(plan, stand.intervall ?? intervall)}`}>
          <Stapel abstand={12}>
            <p className="abo-gross">
              {personen} aktive {personen === 1 ? 'Person' : 'Leute'} in deinem Team
              {plan.bis ? ` – ${plan.name} passt bis ${plan.bis} Leute.` : ' – ab 31 Leuten machen wir dir ein Angebot.'}
            </p>
            {planWechsel && (
              <Meldung ton="neutral" titel={`Dein Team ist ${passend.bis && gebucht && gebucht.bis && passend.bis > gebucht.bis ? 'gewachsen' : 'kleiner geworden'}.`}>
                Passend wäre jetzt {passend.name} ({preisText(passend, stand.intervall ?? 'monat')}). Der Preis ändert sich erst, wenn du zustimmst.
              </Meldung>
            )}
            {z.status === 'test' && (
              <p>
                Du testest bis einschließlich <strong>{datum(z.testBis)}</strong> – ohne Zahlungsdaten. Danach bleibt alles lesbar und exportierbar; zum
                Weiterarbeiten buchst du deinen Plan.
              </p>
            )}
            {z.status === 'aktiv' && stand.naechsteAbbuchung && (
              <p>
                Nächste Abbuchung am <strong>{datum(stand.naechsteAbbuchung)}</strong>: {euro(stand.betragCent)} netto
                {stand.intervall === 'jahr' ? ' für ein Jahr' : ''}.
              </p>
            )}
            {z.status === 'gekuendigt' && (
              <p>
                Gekündigt. Dein Plan läuft bis einschließlich <strong>{datum(z.aktivBis)}</strong>, danach bleibt alles lesbar und exportierbar.
              </p>
            )}
            {(z.status === 'test' || z.status === 'lesemodus') && buchbar(passend) && (
              <Segmente
                label="Zahlweise"
                wert={intervall}
                onChange={setIntervall}
                optionen={[
                  { wert: 'monat', label: `Monatlich · ${euro(abbuchungCent(passend, 'monat') ?? 0)}` },
                  { wert: 'jahr', label: `Jährlich · ${euro(abbuchungCent(passend, 'jahr') ?? 0)} (−${jahresRabattProzent(passend)} %)` },
                ]}
              />
            )}
            {wert && (z.status === 'test' || z.status === 'lesemodus') && <p>{wert}.</p>}
            <Meta>
              Alles drin: alle Funktionen, dein ganzes Team, Updates und Support. Netto zzgl. MwSt., monatlich kündbar, Export immer kostenlos.
              {PREISE_VORLAEUFIG && ' Preise vorläufig – vor der ersten Abbuchung bestätigst du den endgültigen Preis.'}
            </Meta>
            {!buchbar(passend) && !imAbo && (
              <Meta>Für Betriebe mit mehr als 30 Leuten gibt es ein persönliches Angebot – schreib uns über die Website unter „Kontakt“.</Meta>
            )}
            {!admin && <Meta>Buchen und kündigen kann, wer das Recht „Einstellungen“ hat.</Meta>}
          </Stapel>
        </Karte>

        {/* 2 · Zahlung & Rechnungen */}
        <Karte
          oberzeile="Zahlung"
          titel="Zahlungsart & Rechnungen"
          aktion={
            serverAbo && admin && z.status !== 'zahlung_offen' ? (
              <Button variante="tertiaer" klein onClick={() => void portal()} laedt={laedt === 'portal'}>
                Ändern
              </Button>
            ) : undefined
          }
        >
          <Stapel abstand={12}>
            <p>
              {stand.zahlungsart
                ? stand.zahlungsart.text
                : imAbo
                  ? 'Zahlungsart wird geladen …'
                  : 'Noch keine. Beim Buchen wählst du SEPA-Lastschrift oder Karte.'}
            </p>
            <Liste
              leer={<Leer icon="dokument" titel="Noch keine Rechnungen" text="Nach jeder Abbuchung liegt die Rechnung hier zum Herunterladen – für dich und deinen Steuerberater." />}
            >
              {(stand.rechnungen ?? []).slice(0, 3).map((r) => (
                <ListenZeile
                  key={r.id}
                  titel={`${r.nummer ?? 'Rechnung'} · ${euro(r.betragCent)}`}
                  untertitel={`${datum(r.datum)} · ${r.status === 'paid' ? 'bezahlt' : r.status === 'open' ? 'offen' : r.status}`}
                  rechts={
                    r.pdf ? (
                      <Button variante="tertiaer" klein icon="download" href={r.pdf} neuerTab>
                        PDF
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </Liste>
            {serverAbo && (stand.rechnungen?.length ?? 0) > 3 && admin && (
              <Button variante="tertiaer" klein onClick={() => void portal()}>
                Alle Rechnungen
              </Button>
            )}
          </Stapel>
        </Karte>

        {/* 3 · Kündigen */}
        <Karte oberzeile="Kündigen" titel={z.status === 'gekuendigt' ? 'Gekündigt' : 'Kündigen'}>
          {z.status === 'aktiv' || z.status === 'zahlung_offen' ? (
            <Zeile zwischen>
              <p>Monatlich kündbar, ohne Frist und ohne Anruf. Deine Daten bleiben lesbar und exportierbar.</p>
              {admin && (
                <Button variante="sekundaer" onClick={() => setKuendigen(true)}>
                  Plan kündigen
                </Button>
              )}
            </Zeile>
          ) : z.status === 'gekuendigt' ? (
            <p>Du hast gekündigt. Du kannst die Kündigung bis zum {datum(z.aktivBis)} mit einem Klick zurücknehmen.</p>
          ) : z.status === 'lesemodus' ? (
            <p>Es läuft kein Plan, also gibt es nichts zu kündigen. Es entstehen keine Kosten, und deine Daten bleiben lesbar und exportierbar.</p>
          ) : (
            <p>Du hast nichts abgeschlossen. Die Testphase endet von selbst – es entstehen keine Kosten.</p>
          )}
        </Karte>
      </Stapel>
      <Kuendigen offen={kuendigen} schliessen={() => setKuendigen(false)} bis={stand.naechsteAbbuchung ? plusTage(stand.naechsteAbbuchung, -1) : heute} planId={plan.id} gekuendigt={(p) => standUebernehmen({ ...stand, plan: p })} nichtVerbunden={nichtVerbunden} />
      {bestaetigen}
    </Seite>
  );
}

/** Kündigen in zwei Klicks: „Plan kündigen“ → ehrliche Frage nach dem Grund (freiwillig) → „Kündigen“ */
function Kuendigen({ offen, schliessen, bis, planId, gekuendigt, nichtVerbunden }: { offen: boolean; schliessen: () => void; bis: string; planId: string; gekuendigt: (plan: string) => void; nichtVerbunden: () => void }) {
  const toast = useToast();
  const [grund, setGrund] = useState<string>('');
  const [text, setText] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState('');

  const los = async () => {
    setLaedt(true);
    setFehler('');
    const r = await aboApi.kuendigen(grund || undefined, text.trim() || undefined);
    setLaedt(false);
    if (r.ok) {
      messen('bezahlen.gekuendigt', { plan: planId, grund: grund || 'keine_angabe' });
      gekuendigt(r.daten.plan);
      schliessen();
      return toast('Gekündigt. Danke für die ehrliche Antwort.');
    }
    if (r.nichtVerbunden) {
      schliessen();
      return nichtVerbunden();
    }
    setFehler(r.fehler);
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={schliessen}
      titel="Plan kündigen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={schliessen}>
            Doch behalten
          </Button>
          <Button variante="gefahr" onClick={() => void los()} laedt={laedt} laedtText="Wird gekündigt …">
            Kündigen
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <p>
          Dein Plan läuft bis zum Ende des bezahlten Zeitraums ({datum(bis)}). Danach kannst du alles lesen und exportieren – nichts wird gelöscht.
        </p>
        <fieldset className="abo-gruende">
          <legend className="mm-label">Was ist der Hauptgrund? (freiwillig – hilft uns, besser zu werden)</legend>
          {KUENDIGUNGS_GRUENDE.map((g) => (
            <label key={g.wert} className="abo-grund">
              <input type="radio" name="grund" value={g.wert} checked={grund === g.wert} onChange={() => setGrund(g.wert)} />
              {g.label}
            </label>
          ))}
        </fieldset>
        <Textfeld label="Magst du uns noch etwas sagen?" optional rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        {fehler && (
          <Meldung ton="achtung" titel="Kündigen hat nicht geklappt">
            {fehler}
          </Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}
