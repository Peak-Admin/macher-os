import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDarf } from '@core/session';
import { BeispielMarke, Button, Karte, Leer, Seite, Status, useBestaetigen, useToast } from '@ui/index';
import { AuftragKurz } from '@ui/objekt';
import { arbeitsanweisungen } from './daten';
import { AnweisungAnsicht } from './AnweisungAnsicht';
import { AnweisungFormular } from './AnweisungFormular';

export function AnweisungSeite() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const x = arbeitsanweisungen.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const darfSchreiben = useDarf('schreiben');
  const darfLoeschen = useDarf('loeschen');
  const [fragen, bestaetigung] = useBestaetigen();
  const bearbeiten = params.get('bearbeiten') === '1' && darfSchreiben;
  if (!x || x.geloeschtAm)
    return (
      <Seite titel="Arbeitsanweisung nicht gefunden" zurueck={{ to: '/auftraege/arbeitsanweisungen', label: 'Arbeitsanweisungen' }}>
        <Leer titel="Diese Arbeitsanweisung gibt es nicht (mehr)." icon="wissen" />
      </Seite>
    );
  const zurueck = x.auftragId ? { to: `/auftrag/${x.auftragId}`, label: 'Zum Auftrag' } : { to: '/auftraege/arbeitsanweisungen', label: 'Arbeitsanweisungen' };
  return (
    <Seite
      titel={x.titel}
      oberzeile={x.vorlage ? 'Vorlage Arbeitsanweisung' : 'Arbeitsanweisung'}
      untertitel={x.auftragId ? <AuftragKurz id={x.auftragId} /> : undefined}
      zurueck={zurueck}
      status={
        <>
          {x.vorlage && <Status ton="neutral">Vorlage</Status>}
          <BeispielMarke zeigen={x.beispiel} />
        </>
      }
      aktion={
        !bearbeiten && darfSchreiben ? (
          <Button variante="sekundaer" icon="stift" onClick={() => setParams({ bearbeiten: '1' }, { replace: true })}>
            Bearbeiten
          </Button>
        ) : undefined
      }
    >
      <Karte>{bearbeiten ? <AnweisungFormular key={x.geaendertAm} x={x} onFertig={() => setParams({}, { replace: true })} /> : <AnweisungAnsicht x={x} />}</Karte>
      {!bearbeiten && darfLoeschen && (
        <div>
          <Button
            variante="tertiaer"
            icon="muell"
            onClick={async () => {
              if (!(await fragen('Arbeitsanweisung löschen?', 'Sie landet im Papierkorb.', 'Löschen'))) return;
              arbeitsanweisungen.remove(x.id);
              toast('Arbeitsanweisung gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => arbeitsanweisungen.restore(x.id) } });
              navigate(zurueck.to, { replace: true });
            }}
          >
            Löschen
          </Button>
        </div>
      )}
      {bestaetigung}
    </Seite>
  );
}
