/** Tab „Termine“ in der Auftragsakte: was ist geplant, was war – und direkt einplanen. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { aktionAusfuehren } from '@core/modul';
import { datumKurz, uhrzeit } from '@core/format';
import { useDarf } from '@core/session';
import { TERMINART_ICON, TERMINART_TON } from '@core/zeichen';
import { Abschnitt, Button, Leer, Liste, ListenZeile, Stapel, Status, TypIcon, Zeile, type IconName } from '@ui/index';
import { Personen } from '@ui/person';
import { kontextAusDb, terminKonflikte } from '../verfuegbarkeit/daten';
import { TERMINART_LABEL, TERMINSTATUS } from './daten';
import { TerminFormular } from './TerminFormular';
import { terminPfad } from './Kalender';

export function AuftragTermine({ id }: { id: string }) {
  const navigate = useNavigate();
  const darfPlanen = useDarf('planen');
  const [neu, setNeu] = useState(false);
  const termine = db.termine.use((t) => t.auftragId === id, [id]);
  const jetzt = new Date().toISOString();
  const kommend = termine.filter((t) => t.ende >= jetzt && t.status !== 'abgesagt').sort((a, b) => a.start.localeCompare(b.start));
  const vergangen = termine.filter((t) => !(t.ende >= jetzt && t.status !== 'abgesagt')).sort((a, b) => b.start.localeCompare(a.start));
  const k = kontextAusDb();

  const zeile = (t: (typeof termine)[number]) => {
    const st = TERMINSTATUS[t.status];
    const konflikt = terminKonflikte(t, k).length > 0;
    return (
      <ListenZeile
        key={t.id}
        to={terminPfad(t.id)}
        links={<TypIcon name={TERMINART_ICON[t.art] as IconName} label={TERMINART_LABEL[t.art]} ton={TERMINART_TON[t.art]} />}
        titel={`${datumKurz(t.start)}, ${t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}`}
        untertitel={
          <>
            {TERMINART_LABEL[t.art]} · {t.mitarbeiterIds.length ? <Personen ids={t.mitarbeiterIds} groesse={20} namen /> : 'Noch niemand eingeplant'}
          </>
        }
        rechts={
          <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {konflikt && <Status ton="achtung">Konflikt</Status>}
            <Status ton={st.ton}>{st.label}</Status>
          </span>
        }
      />
    );
  };

  return (
    <Stapel>
      {darfPlanen && (
        <Zeile>
          <Button icon="kalender" onClick={() => navigate((aktionAusfuehren('plan.einplanen', { auftragId: id }) as string) ?? '/plan/einsatzplanung')}>
            In der Plantafel einplanen
          </Button>
          <Button variante="sekundaer" icon="plus" onClick={() => setNeu(true)}>
            Termin anlegen
          </Button>
        </Zeile>
      )}
      {!termine.length ? (
        <Leer titel="Noch kein Termin" text="Plane den Auftrag ein – Lotte zeigt dir, wer wann frei ist." icon="kalender" />
      ) : (
        <>
          <Abschnitt titel="Geplant">
            <Liste leer={<Leer titel="Kein kommender Termin" text="Der Auftrag steht unter „Offen einzuplanen“, bis er wieder einen Termin hat." icon="kalender" />}>
              {kommend.map(zeile)}
            </Liste>
          </Abschnitt>
          {vergangen.length > 0 && (
            <Abschnitt titel="Vergangen und abgesagt">
              <Liste>{vergangen.map(zeile)}</Liste>
            </Abschnitt>
          )}
        </>
      )}
      <TerminFormular offen={neu} onSchliessen={() => setNeu(false)} vorgabe={{ auftragId: id }} />
    </Stapel>
  );
}
