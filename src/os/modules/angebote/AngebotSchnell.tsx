/**
 * Angebot in drei Minuten – EIN Bildschirm: Kunde · Positionen · Senden.
 * Kopfdaten, Kalkulation, Aufmaß und Optionen gibt es erst nach Aufklappen (im ausführlichen Angebot).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudAktiv } from '@core/cloud';
import { db } from '@core/db';
import { euro, heute, plusTage, relativ } from '@core/format';
import { useDarf } from '@core/session';
import type { Position } from '@core/objects';
import { Button, Dialog, Eingabe, Karte, Meldung, Meta, Seite, Stapel, Textfeld, ZahlEingabe, useToast } from '@ui/index';
import { kontaktArt, versandText, type SendeErgebnis } from '@modules/start/daten';
import { KundeBlock, LEERER_KUNDE, PositionenSchnell, SchrittKopf, type KundeWahl } from '@modules/start/teile';
import { AngebotBrief } from './AngebotDruck';
import { KeinGeldRecht } from './AngebotDetail';
import { angebotSummen, gueltigTage, nachfassenTage, standardEinleitung, ustSatz } from './daten';
import { angebotSenden, kundeSichern, schnellAngebotAnlegen, titelAus } from './erstwert';

interface Kopf {
  titel: string;
  gueltigBis: string;
  rabattProzent?: number;
  einleitung: string;
}

export function AngebotSchnell() {
  const geld = useDarf('geld');
  const darfSenden = useDarf('veroeffentlichen');
  const navigate = useNavigate();
  const toast = useToast();
  const [beginn, setBeginn] = useState(() => Date.now());
  const [kunde, setKunde] = useState<KundeWahl>(LEERER_KUNDE);
  const [positionen, setPositionen] = useState<Position[]>([]);
  const [kopf, setKopf] = useState<Kopf>({ titel: '', gueltigBis: plusTage(heute(), gueltigTage()), einleitung: '' });
  const [vorschau, setVorschau] = useState(false);
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<{ kunde?: string; kontakt?: string; positionen?: string }>({});
  const [ergebnis, setErgebnis] = useState<{ angebotId: string; r: SendeErgebnis; kanal: 'email' | 'sms' }>();
  db.leistungen.use();

  if (!geld) return <KeinGeldRecht />;
  if (ergebnis)
    return (
      <Raus
        {...ergebnis}
        onNeu={() => {
          setErgebnis(undefined);
          setKunde(LEERER_KUNDE);
          setPositionen([]);
          setKopf({ titel: '', gueltigBis: plusTage(heute(), gueltigTage()), einleitung: '' });
          setBeginn(Date.now());
        }}
      />
    );

  const kanal = kontaktArt(kunde.kontakt);
  const summe = angebotSummen({ positionen, rabattProzent: kopf.rabattProzent });
  const lokal = !cloudAktiv();
  const sendenLabel = !lokal ? 'Angebot senden' : kanal === 'sms' ? 'In der SMS-App öffnen' : 'Im Mailprogramm öffnen';

  const pruefen = () => {
    const f: typeof fehler = {};
    if (!kunde.kundeId && kunde.name.trim().length < 2) f.kunde = 'Wie heißt dein Kunde?';
    if (!kanal) f.kontakt = kunde.kontakt.trim() ? 'Bitte eine gültige E-Mail oder Telefonnummer.' : 'Wohin soll das Angebot? Telefon oder E-Mail reicht.';
    if (!positionen.some((p) => p.art !== 'text' && p.text.trim())) f.positionen = 'Füge mindestens eine Position hinzu.';
    setFehler(f);
    return !Object.keys(f).length;
  };

  /** Kunde sichern (neu oder Kontakt ergänzen) und im Zustand merken */
  const kundeId = () => {
    const k = kundeSichern(kunde);
    setKunde({ ...kunde, kundeId: k.id, name: k.name });
    return k.id;
  };

  const anlegen = () => schnellAngebotAnlegen(kundeId(), positionen, { ...kopf, einleitung: kopf.einleitung || undefined });

  const senden = async () => {
    if (!pruefen() || !kanal) return;
    setSendet(true);
    try {
      const a = anlegen();
      const r = await angebotSenden(a.id, kunde.kontakt, kanal, { sekunden: (Date.now() - beginn) / 1000 });
      if (r.status === 'fehler') {
        toast(versandText(r, kanal, 'Das Angebot'), { ton: 'achtung' });
        navigate(`/auftraege/angebote/${a.id}`);
        return;
      }
      setErgebnis({ angebotId: a.id, r, kanal });
    } finally {
      setSendet(false);
    }
  };

  const ausfuehrlich = () => {
    if (kunde.kundeId || (kunde.name.trim().length >= 2 && kanal)) {
      const a = anlegen();
      navigate(`/auftraege/angebote/${a.id}`);
    } else setFehler({ kunde: 'Wähl zuerst den Kunden – dann geht es ausführlich weiter.' });
  };

  const oeffneVorschau = () => {
    if (!kunde.kundeId && kunde.name.trim().length >= 2) kundeId();
    setVorschau(true);
  };

  return (
    <Seite titel="Angebot schreiben" oberzeile="In drei Minuten raus" zurueck={{ to: '/start', label: 'Start' }}>
      <Stapel abstand={24}>
        <Karte>
          <SchrittKopf nr={1} titel="Kunde" />
          <KundeBlock wert={kunde} onChange={(k) => (setKunde(k), setFehler({ ...fehler, kunde: undefined, kontakt: undefined }))} fehler={fehler.kontakt} />
          {fehler.kunde && (
            <div style={{ marginTop: 12 }}>
              <Meldung ton="achtung">{fehler.kunde}</Meldung>
            </div>
          )}
        </Karte>

        <Karte>
          <SchrittKopf nr={2} titel="Positionen" />
          <Stapel abstand={16}>
            <PositionenSchnell positionen={positionen} onChange={(p) => (setPositionen(p), setFehler({ ...fehler, positionen: undefined }))} />
            {fehler.positionen && <Meldung ton="achtung">{fehler.positionen}</Meldung>}
            {positionen.length > 0 && (
              <div className="mm-schnell-summe">
                <span>Gesamt inkl. {ustSatz()} % USt.</span>
                <span className="mm-number">{euro(summe.brutto)}</span>
              </div>
            )}
            <details className="mm-mehr">
              <summary>Mehr: Titel, Gültigkeit, Rabatt, Kalkulation, Aufmaß</summary>
              <Stapel abstand={12}>
                <Eingabe label="Titel" value={kopf.titel} placeholder={titelAus(positionen)} onChange={(e) => setKopf({ ...kopf, titel: e.target.value })} optional />
                <div className="mm-formraster mm-formraster--2">
                  <Eingabe label="Gültig bis" type="date" value={kopf.gueltigBis} onChange={(e) => e.target.value && setKopf({ ...kopf, gueltigBis: e.target.value })} />
                  <ZahlEingabe label="Rabatt in %" wert={kopf.rabattProzent} onWert={(n) => setKopf({ ...kopf, rabattProzent: n && n > 0 ? Math.min(n, 100) : undefined })} optional />
                </div>
                <Textfeld label="Einleitung" value={kopf.einleitung} placeholder={standardEinleitung()} onChange={(e) => setKopf({ ...kopf, einleitung: e.target.value })} optional />
                <div>
                  <Button variante="tertiaer" icon="weiter" onClick={ausfuehrlich}>
                    Ausführlich weiter (Kalkulation, Aufmaß, Optionen)
                  </Button>
                </div>
              </Stapel>
            </details>
          </Stapel>
        </Karte>

        <Karte>
          <SchrittKopf nr={3} titel="Senden" />
          <Stapel abstand={12}>
            {kanal ? (
              <Meta>
                Geht {kanal === 'email' ? 'per E-Mail' : 'per SMS'} an {kunde.kontakt.trim()} – mit Link zu deinem Kundenbereich. Dort sieht dein Kunde das Angebot als Briefbogen und nimmt es mit einem Klick an.
              </Meta>
            ) : (
              <Meta>Trag oben Telefon oder E-Mail ein – dahin geht das Angebot mit Link zum Annehmen.</Meta>
            )}
            {lokal && <Meta>Dein Konto ist noch nicht verbunden: Macher öffnet dein {kanal === 'sms' ? 'SMS-Programm' : 'Mailprogramm'} mit fertigem Text und Link. Du drückst dort auf Senden.</Meta>}
            {!darfSenden && <Meldung ton="neutral">Deine Rolle darf nichts an Kunden senden. Frag im Büro nach.</Meldung>}
            <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button icon={kanal === 'sms' ? 'chat' : 'mail'} onClick={senden} laedt={sendet} laedtText="Wird gesendet …" disabled={!darfSenden}>
                {sendenLabel}
              </Button>
              <Button variante="sekundaer" icon="dokument" onClick={oeffneVorschau} disabled={!positionen.length}>
                Vorschau
              </Button>
            </div>
          </Stapel>
        </Karte>
      </Stapel>

      <Dialog offen={vorschau} onSchliessen={() => setVorschau(false)} titel="So sieht dein Kunde das Angebot" breit aktionen={<Button onClick={() => setVorschau(false)}>Zurück zum Angebot</Button>}>
        <div className="mm-vorschau">
          <AngebotBrief
            a={{
              kundeId: kunde.kundeId ?? '',
              auftragId: '',
              titel: kopf.titel.trim() || titelAus(positionen),
              nummer: 'wird beim Senden vergeben',
              version: 1,
              datum: heute(),
              gueltigBis: kopf.gueltigBis,
              einleitung: kopf.einleitung.trim() || standardEinleitung(),
              positionen,
              rabattProzent: kopf.rabattProzent,
            }}
          />
        </div>
      </Dialog>
    </Seite>
  );
}

/** Nach dem Senden: ehrlich sagen, was passiert ist – und live zeigen, wenn der Kunde öffnet. */
function Raus({ angebotId, r, kanal, onNeu }: { angebotId: string; r: SendeErgebnis; kanal: 'email' | 'sms'; onNeu: () => void }) {
  const a = db.angebote.useOne(angebotId);
  const kunde = db.kunden.useOne(a?.kundeId ?? '');
  const geoeffnet = a?.geoeffnetAm;
  const echt = r.status === 'gesendet';
  return (
    <Seite titel={echt ? 'Dein Angebot ist raus' : 'Fast geschafft'} oberzeile={a ? `Angebot ${a.nummer}` : 'Angebot'} aktion={<Button to={`/auftraege/angebote/${angebotId}`}>Zum Angebot</Button>}>
      <Stapel abstand={16}>
        <Meldung ton={echt ? 'erfolg' : 'neutral'} titel={versandText(r, kanal, 'Dein Angebot')}>
          {a && `${a.titel} · ${euro(angebotSummen(a).brutto)} an ${kunde?.name ?? 'deinen Kunden'}.`} Nach {nachfassenTage()} Tagen ohne Antwort erinnert dich Macher ans Nachfassen.
        </Meldung>
        {geoeffnet ? (
          <Meldung ton="erfolg" titel={`${kunde?.name ?? 'Dein Kunde'} hat dein Angebot geöffnet (${relativ(geoeffnet)}).`}>
            Jetzt ist ein guter Moment für einen kurzen Anruf.
          </Meldung>
        ) : (
          <Karte kompakt>
            <Meta>
              {cloudAktiv()
                ? `Sobald ${kunde?.name ?? 'dein Kunde'} das Angebot öffnet, sagt Macher dir Bescheid.`
                : 'Sobald dein Konto verbunden ist, meldet Macher dir, wenn der Kunde das Angebot öffnet. Bis dahin öffnet der Link nur auf diesem Gerät.'}
            </Meta>
          </Karte>
        )}
        <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Button variante="tertiaer" icon="plus" onClick={onNeu}>
            Noch ein Angebot schreiben
          </Button>
          <Button variante="tertiaer" icon="heute" to="/heute">
            Zu Heute
          </Button>
        </div>
      </Stapel>
    </Seite>
  );
}
