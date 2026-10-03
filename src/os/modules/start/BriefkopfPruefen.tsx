/**
 * Briefkopf just in time: erst wenn das erste Angebot oder die erste Rechnung rausgehen soll, fragt Lotte nach
 * dem, was im Briefkopf noch fehlt – mit Begründung im Moment, in dem sie einleuchtet. Vorhandenes steht mit ✓ da.
 */
import { useState, type ReactNode } from 'react';
import { db } from '@core/db';
import { messen } from '@core/messung';
import { Button, Dialog, Eingabe, Icon, Meldung, Meta, Stapel } from '@ui/index';
import { briefkopfVorSenden, PLATZHALTER_NAME, type BriefkopfLuecke } from './daten';
import './start.css';

type Was = 'Angebot' | 'Rechnung';

/** `[pruefen, dialog]`: `pruefen(weiter)` sendet sofort, wenn alles da ist – sonst erst nach dem Ergänzen. */
export function useBriefkopfVorSenden(was: Was): [(weiter: () => void) => void, ReactNode] {
  const [offen, setOffen] = useState<{ weiter: () => void; luecken: BriefkopfLuecke[] }>();
  const pruefen = (weiter: () => void) => {
    const luecken = briefkopfVorSenden(db.betrieb.get('betrieb'), PLATZHALTER_NAME);
    if (!luecken.length) return weiter();
    messen('briefkopf.vor_senden', { was, fehlt: luecken.map((l) => l.feld).join(',') });
    setOffen({ weiter, luecken });
  };
  const dialog = offen ? <BriefkopfDialog was={was} luecken={offen.luecken} onSchliessen={() => setOffen(undefined)} onWeiter={() => (setOffen(undefined), offen.weiter())} /> : null;
  return [pruefen, dialog];
}

function BriefkopfDialog({ was, luecken, onSchliessen, onWeiter }: { was: Was; luecken: BriefkopfLuecke[]; onSchliessen: () => void; onWeiter: () => void }) {
  const b = db.betrieb.get('betrieb');
  const fehlt = new Set(luecken.map((l) => l.feld));
  const [name, setName] = useState(b?.name && b.name !== PLATZHALTER_NAME ? b.name : '');
  const [strasse, setStrasse] = useState(b?.adresse?.strasse ?? '');
  const [plz, setPlz] = useState(b?.adresse?.plz ?? '');
  const [ort, setOrt] = useState(b?.adresse?.ort ?? '');
  const [steuer, setSteuer] = useState('');
  const [fehler, setFehler] = useState<string>();
  const dasDokument = was === 'Angebot' ? 'das Angebot' : 'die Rechnung';

  const speichern = () => {
    if (fehlt.has('name') && !name.trim()) return setFehler('Wie heißt dein Betrieb?');
    if (fehlt.has('adresse') && (!strasse.trim() || !/^\d{5}$/.test(plz.trim()) || !ort.trim())) return setFehler('Trag Straße, fünfstellige PLZ und Ort ein.');
    if (fehlt.has('steuer') && !steuer.trim()) return setFehler(was === 'Rechnung' ? 'Ohne Steuernummer oder USt-IdNr. ist eine Rechnung nicht gültig.' : 'Trag deine Steuernummer oder USt-IdNr. ein.');
    const s = steuer.replace(/\s/g, '').toUpperCase();
    const istUstId = /^DE\d{9}$/.test(s);
    db.betrieb.update('betrieb', {
      ...(fehlt.has('name') ? { name: name.trim() } : {}),
      ...(fehlt.has('adresse') ? { adresse: { ...b?.adresse, strasse: strasse.trim(), plz: plz.trim(), ort: ort.trim() } } : {}),
      ...(fehlt.has('steuer') ? (istUstId ? { ustId: s } : { steuernummer: steuer.trim() }) : {}),
    });
    messen('briefkopf.ergaenzt', { was, felder: luecken.map((l) => l.feld).join(',') });
    onWeiter();
  };

  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={`Kurz prüfen, bevor wir ${dasDokument} verschicken`}
      icon="dokument"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button icon="mail" onClick={speichern}>
            {`Speichern und ${was} senden`}
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <Meta>Das steht als Briefkopf auf {was === 'Angebot' ? 'deinem Angebot' : 'deiner Rechnung'}. Du ergänzt es einmal, danach geht es immer direkt raus.</Meta>
        <ul className="mm-briefkopf-liste">
          <Punkt ok={!fehlt.has('name')}>{fehlt.has('name') ? 'Name des Betriebs fehlt' : b?.name}</Punkt>
          <Punkt ok={!fehlt.has('adresse')}>{fehlt.has('adresse') ? 'Anschrift fehlt' : `${b?.adresse.strasse}, ${b?.adresse.plz} ${b?.adresse.ort}`}</Punkt>
          <Punkt ok={!fehlt.has('steuer')}>{fehlt.has('steuer') ? 'Steuernummer oder USt-IdNr. fehlt' : b?.ustId ? `USt-IdNr. ${b.ustId}` : `Steuernummer ${b?.steuernummer}`}</Punkt>
        </ul>
        {fehlt.has('name') && <Eingabe label="Name des Betriebs" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" placeholder="z. B. Maler Müller GmbH" autoFocus />}
        {fehlt.has('adresse') && (
          <>
            <Eingabe label="Straße und Hausnummer" value={strasse} onChange={(e) => setStrasse(e.target.value)} autoComplete="street-address" />
            <div className="mm-briefkopf-plz-ort">
              <Eingabe label="PLZ" value={plz} onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" autoComplete="postal-code" />
              <Eingabe label="Ort" value={ort} onChange={(e) => setOrt(e.target.value)} autoComplete="address-level2" />
            </div>
          </>
        )}
        {fehlt.has('steuer') && <Eingabe label="Steuernummer oder USt-IdNr." value={steuer} onChange={(e) => setSteuer(e.target.value)} placeholder="z. B. 257/123/45678 oder DE123456789" />}
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      </Stapel>
    </Dialog>
  );
}

function Punkt({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={ok ? undefined : 'mm-briefkopf-fehlt'}>
      <span className="mm-briefkopf-icon" aria-hidden>
        <Icon name={ok ? 'check' : 'achtung'} size={16} />
      </span>
      <span>
        {children}
        <span className="sr-only">{ok ? ' – vorhanden' : ' – fehlt'}</span>
      </span>
    </li>
  );
}
