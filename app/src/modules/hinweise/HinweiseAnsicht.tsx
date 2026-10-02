import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { setzeEinstellung } from '@core/einstellungen';
import { relativ } from '@core/format';
import { hinweisAusblenden, hinweisErledigen, offeneHinweise, type OffenerHinweis } from '@core/macher';
import { aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { istBuero, useIch } from '@core/session';
import { Abschnitt, Button, Filter, Karte, Leer, Liste, ListenZeile, Meta, Segmente, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { ARTEN, artInfo, erledigteSeit, filtern, zaehlen, zielPfad, type ArtFilter } from './daten';

export function HinweiseAnsicht() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const [art, setArt] = useState<ArtFilter>('alle');
  const [wer, setWer] = useState<'mich' | 'alle'>('mich');
  const basis = offeneHinweise(wer === 'mich' || !buero ? (ich ? { rolle: ich.rolle, mitarbeiterId: ich.id } : undefined) : undefined);
  const z = zaehlen(basis);
  const liste = filtern(basis, art);
  const erledigt = erledigteSeit(7);

  return (
    <Seite titel="Hinweise & Freigaben" untertitel="Hier holt Macher dich dazu – nur wenn eine Entscheidung, Freigabe oder ein Problem ansteht.">
      <Stapel abstand={12}>
        {buero && <Segmente label="Zeigen" wert={wer} onChange={setWer} optionen={[{ wert: 'mich', label: 'Für mich' }, { wert: 'alle', label: 'Alle im Betrieb' }]} />}
        <Filter label="Art" wert={art} onChange={setArt} optionen={[{ wert: 'alle' as ArtFilter, label: 'Alle', zaehler: z.alle }, ...ARTEN.map((a) => ({ wert: a.wert as ArtFilter, label: a.label, zaehler: z[a.wert] }))]} />
      </Stapel>

      {liste.length ? (
        <Stapel abstand={12}>
          {liste.map((h) => (
            <HinweisKarte key={h.schluessel} h={h} />
          ))}
        </Stapel>
      ) : basis.length ? (
        <Leer icon="filter" titel="Keine Treffer" text="Zu diesem Filter gibt es keine offenen Punkte. Passe die Auswahl an." aktion={<Button variante="sekundaer" onClick={() => setArt('alle')}>Alle zeigen</Button>} />
      ) : (
        <Leer icon="check" titel="Alles erledigt" text="Gerade braucht dich nichts. Macher meldet sich, sobald eine Entscheidung oder Freigabe ansteht." />
      )}

      {erledigt.length > 0 && (
        <Abschnitt titel="Erledigt in den letzten 7 Tagen">
          <Liste>
            {erledigt.map((h) => (
              <ListenZeile
                key={h.id}
                titel={h.titel}
                untertitel={`erledigt ${relativ(h.erledigtAm ?? h.geaendertAm)}`}
                rechts={
                  <Button variante="tertiaer" klein onClick={() => db.hinweise.update(h.id, { status: 'offen', erledigtAm: undefined })}>
                    Wieder öffnen
                  </Button>
                }
              />
            ))}
          </Liste>
        </Abschnitt>
      )}
    </Seite>
  );
}

function HinweisKarte({ h }: { h: OffenerHinweis }) {
  const navigate = useNavigate();
  const toast = useToast();
  const info = artInfo(h.art);
  const ziel = zielPfad(h);
  const aktionen = (h.aktionen ?? []).filter((a) => aktionVorhanden(a.aktion)).sort((a, b) => Number(!!b.primaer) - Number(!!a.primaer));

  const ausfuehren = (aktion: string, payload: unknown, label: string) => {
    try {
      const pfad = aktionAusfuehren(aktion, payload);
      if (pfad) navigate(pfad);
      else toast(`„${label}“ ist erledigt.`);
    } catch (e) {
      console.error(e);
      toast('Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
    }
  };

  const ausblenden = () => {
    hinweisAusblenden(h.schluessel, 7);
    toast('Für 7 Tage ausgeblendet.', { aktion: { label: 'Rückgängig', onClick: () => setzeEinstellung(`hinweis.aus.${h.schluessel}`, undefined) } });
  };

  const erledigen = () => {
    if (!h.hinweisId) return;
    const id = h.hinweisId;
    hinweisErledigen(id);
    toast('Als erledigt markiert.', { aktion: { label: 'Rückgängig', onClick: () => db.hinweise.update(id, { status: 'offen', erledigtAm: undefined }) } });
  };

  return (
    <Karte kompakt>
      <Stapel abstand={12}>
        <Zeile zwischen>
          <Status ton={info.ton}>{info.label}</Status>
          {h.faellig && <Meta>fällig {relativ(h.faellig)}</Meta>}
        </Zeile>
        <div>
          <strong>{h.titel}</strong>
          {h.text && <Meta>{h.text}</Meta>}
        </div>
        <Zeile>
          {aktionen.map((a, i) => (
            <Button key={a.aktion + i} variante={i === 0 ? 'primaer' : 'sekundaer'} klein onClick={() => ausfuehren(a.aktion, a.payload, a.label)}>
              {a.label}
            </Button>
          ))}
          {ziel && (
            <Button variante={aktionen.length ? 'tertiaer' : 'sekundaer'} klein icon="pfeilRechts" onClick={() => navigate(ziel)}>
              Öffnen
            </Button>
          )}
          {h.hinweisId && (
            <Button variante="tertiaer" klein icon="check" onClick={erledigen}>
              Erledigt
            </Button>
          )}
          <Button variante="tertiaer" klein onClick={ausblenden}>
            7 Tage ausblenden
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}
