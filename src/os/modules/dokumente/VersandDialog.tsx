/**
 * Senden für alle Geschäftsdokumente: Macher bereitet vor (Empfänger, Betreff, Text, Nummer, Betrag),
 * du siehst die Vorschau und bestätigst. Erst dann wird festgeschrieben bzw. verschickt.
 */
import { useState } from 'react';
import { appPfad } from '@core/basis';
import { cloudAktiv } from '@core/cloud';
import { useEmailUeberServer } from '@core/cloud-versand';
import { euro } from '@core/format';
import type { Bezug } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Dialog, Eingabe, Meldung, Meta, Stapel, useToast } from '@ui/index';
import { versandText } from '@modules/start/daten';
import { artVon } from './arten';
import { standardEmpfaenger, versandAusfuehren, versandVorbereiten } from './versand';
import './dokumente.css';

interface Props {
  bezug: Bezug;
  offen: boolean;
  onSchliessen: () => void;
  onGesendet?: () => void;
  /** zurückhaltende Alternative, z. B. „Ich verschicke sie selbst“ */
  nebenaktion?: { label: string; onClick: () => void };
}

export function VersandDialog(p: Props) {
  // erst beim Öffnen vorbereiten – beim nächsten Öffnen frisch (Empfänger, Nummer, Beträge)
  return p.offen ? <Inhalt {...p} /> : null;
}

function Inhalt({ bezug, offen, onSchliessen, onGesendet, nebenaktion }: Props) {
  const toast = useToast();
  const darfSenden = useDarf('veroeffentlichen');
  const emailServer = useEmailUeberServer();
  const [an, setAn] = useState(() => standardEmpfaenger(bezug));
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState<string[]>([]);
  const e = versandVorbereiten(bezug, an);
  const lokal = e.kanal === 'email' ? !emailServer : !cloudAktiv();
  const druck = artVon(bezug)?.druck(bezug.id);

  const senden = async () => {
    setSendet(true);
    try {
      const r = await versandAusfuehren(e);
      if (r.fehler?.length) return setFehler(r.fehler);
      if (r.ergebnis.status === 'fehler') return setFehler([versandText(r.ergebnis, e.kanal ?? 'email', e.label)]);
      toast(versandText(r.ergebnis, e.kanal ?? 'email', `${e.label}${e.nummer ? ` ${e.nummer}` : ''}`), { ton: r.ergebnis.status === 'gesendet' ? 'erfolg' : 'neutral' });
      onGesendet?.();
      onSchliessen();
    } finally {
      setSendet(false);
    }
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`${e.label} senden`}
      icon="mail"
      breit
      aktionen={
        <>
          {nebenaktion && (
            <Button variante="tertiaer" onClick={nebenaktion.onClick}>
              {nebenaktion.label}
            </Button>
          )}
          <Button icon={e.kanal === 'sms' ? 'chat' : 'mail'} onClick={senden} laedt={sendet} laedtText="Wird gesendet …" disabled={!darfSenden || e.fehler.length > 0}>
            {lokal ? (e.kanal === 'sms' ? 'In der SMS-App öffnen' : 'Im Mailprogramm öffnen') : `Jetzt senden${e.betrag != null ? ` · ${euro(e.betrag)}` : ''}`}
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <Eingabe label="An" value={an} onChange={(x) => setAn(x.target.value)} hilfe="E-Mail-Adresse oder Handynummer deines Kunden." inputMode="email" />
        <div>
          <span className="mm-label">Vorschau</span>
          <div className="mm-dokument-vorschau">
            <strong>{e.betreff || e.label}</strong>
            <p>{e.text}</p>
          </div>
        </div>
        {(e.nummer || e.betrag != null) && (
          <Meta>
            {[e.nummer && `Nummer ${e.nummer}`, e.betrag != null && `Betrag ${euro(e.betrag)}`].filter(Boolean).join(' · ')}
            {druck && (
              <>
                {' · '}
                <a href={appPfad(druck)} target="_blank" rel="noreferrer">
                  PDF-Ansicht öffnen
                </a>
              </>
            )}
          </Meta>
        )}
        {e.folgen.length > 0 && (
          <ul className="mm-meta" style={{ margin: 0, paddingLeft: 18 }}>
            {e.folgen.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {lokal && e.kanal && <Meta>{e.kanal === 'sms' ? 'SMS verschickt Macher noch nicht selbst: Deine SMS-App öffnet sich mit fertigem Text. Du drückst dort auf Senden.' : 'E-Mail-Versand ist noch nicht eingerichtet: Macher öffnet dein Mailprogramm mit fertigem Text. Du drückst dort auf Senden.'}</Meta>}
        {!darfSenden && <Meldung ton="neutral">Deine Rolle darf nichts an Kunden senden. Frag im Büro nach.</Meldung>}
        {[...e.fehler, ...fehler].length > 0 && (
          <Meldung ton="achtung" titel="Das fehlt noch">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {[...new Set([...e.fehler, ...fehler])].map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}
