import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { relativ, uhrzeit } from '@core/format';
import { pfadZu } from '@core/modul';
import type { Erledigung } from '@core/objects';
import { useDarf, useIch } from '@core/session';
import { Abschnitt, Button, Filter, Kennzahl, Leer, Liste, ListenZeile, Meta, Raster, Seite, Status, useToast } from '@ui/index';
import { ZEITRAUM_LABEL, erledigungenIm, kannRueckgaengig, minutenText, rueckgaengigAm, rueckgaengigMachen, zusammenfassen, type Zeitraum } from './logik';

const WIDGET_MAX = 3;

function ErledigtZeile({ e }: { e: Erledigung }) {
  const toast = useToast();
  const navigate = useNavigate();
  const pfad = pfadZu(e.bezug);
  const zurueck = rueckgaengigAm(e.id);
  // Beträge nur mit Recht „Preise & Geld“
  const geld = useDarf('geld');
  const text = geld || !e.text?.includes('€') ? e.text : undefined;
  const unter = [`${relativ(e.erstelltAm)}, ${uhrzeit(e.erstelltAm)}`, text, e.minutenGespart ? `${minutenText(e.minutenGespart)} gespart (Schätzung)` : null].filter(Boolean).join(' · ');
  return (
    <ListenZeile
      links={<Status ton={zurueck ? 'neutral' : 'erfolg'}>{zurueck ? 'Rückgängig' : 'Erledigt'}</Status>}
      titel={e.titel}
      untertitel={unter}
      rechts={
        <>
          {kannRueckgaengig(e) && (
            <Button
              klein
              variante="sekundaer"
              icon="wiederholen"
              onClick={() => {
                try {
                  const ziel = rueckgaengigMachen(e);
                  toast('Rückgängig gemacht.');
                  if (ziel) navigate(ziel);
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
                }
              }}
            >
              Rückgängig
            </Button>
          )}
          {pfad && (
            <Button klein variante="tertiaer" to={pfad} icon="pfeilRechts">
              Öffnen
            </Button>
          )}
        </>
      }
    />
  );
}

/** Hub-Widget: kurze Zusammenfassung von heute */
export function ErledigtWidget() {
  useDatenstand();
  const ich = useIch();
  const liste = erledigungenIm('heute', ich);
  const s = zusammenfassen(liste);
  return (
    <Abschnitt
      titel="Macher hat erledigt"
      aktion={
        <Button variante="tertiaer" klein to="/heute/erledigt" icon="pfeilRechts">
          Woche ansehen
        </Button>
      }
    >
      {liste.length ? (
        <>
          <Meta>
            Heute {s.anzahl === 1 ? '1 Sache' : `${s.anzahl} Sachen`} erledigt
            {s.minuten > 0 ? ` · ${minutenText(s.minuten)} gespart (Schätzung)` : ''}
          </Meta>
          <Liste>
            {liste.slice(0, WIDGET_MAX).map((e) => (
              <ErledigtZeile key={e.id} e={e} />
            ))}
          </Liste>
        </>
      ) : (
        <Meta>Heute hat Macher noch nichts für dich erledigt. Alles, was automatisch passiert, steht hier – mit Rückgängig, wo es geht.</Meta>
      )}
    </Abschnitt>
  );
}

/** Ganze Liste: Heute / Woche / 30 Tage, mit Zusammenfassung und Rückgängig */
export function ErledigtSeite() {
  useDatenstand();
  const ich = useIch();
  const [z, setZ] = useState<Zeitraum>('heute');
  const liste = erledigungenIm(z, ich);
  const s = zusammenfassen(liste);
  return (
    <Seite titel="Erledigt" untertitel="Was Macher für dich erledigt hat. Prüfen, öffnen, rückgängig machen.">
      <Filter
        label="Zeitraum"
        wert={z}
        onChange={setZ}
        optionen={(Object.keys(ZEITRAUM_LABEL) as Zeitraum[]).map((w) => ({ wert: w, label: ZEITRAUM_LABEL[w] }))}
      />
      <Raster min={220}>
        <Kennzahl label="Erledigt" wert={s.anzahl} zeitraum={ZEITRAUM_LABEL[z]} />
        <Kennzahl
          label="Gesparte Zeit"
          wert={s.minuten > 0 ? minutenText(s.minuten) : 'Noch keine Daten'}
          zeitraum={ZEITRAUM_LABEL[z]}
          hinweis={s.minuten > 0 ? `Schätzung aus ${s.mitSchaetzung} ${s.mitSchaetzung === 1 ? 'Eintrag' : 'Einträgen'}` : undefined}
        />
      </Raster>
      <Liste
        leer={
          <Leer
            icon="macher"
            titel={z === 'heute' ? 'Heute noch nichts erledigt' : 'In diesem Zeitraum nichts erledigt'}
            text="Sobald Macher etwas automatisch erledigt, steht es hier. Welche Automationen laufen, stellst du unter „Automatisch erledigen“ ein."
            aktion={z === 'heute' ? <Button variante="sekundaer" onClick={() => setZ('woche')}>Diese Woche ansehen</Button> : undefined}
          />
        }
      >
        {liste.map((e) => (
          <ErledigtZeile key={e.id} e={e} />
        ))}
      </Liste>
      <Meta>Die gesparte Zeit ist eine Schätzung je Regel, keine Messung.</Meta>
    </Seite>
  );
}
