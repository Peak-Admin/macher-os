import { useNavigate, useParams } from 'react-router-dom';
import { useDarf } from '@core/session';
import { Button, Leer, Seite, Status, Stapel, useBestaetigen, useToast, BeispielMarke } from '@ui/index';
import { AuftragKurz } from '@ui/objekt';
import { checklisten, stand } from './daten';
import { ChecklisteAnsicht } from './ChecklisteAnsicht';

export function ChecklisteSeite() {
  const { id = '' } = useParams();
  const c = checklisten.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const darfLoeschen = useDarf('loeschen');
  const [fragen, bestaetigung] = useBestaetigen();
  if (!c || c.geloeschtAm)
    return (
      <Seite titel="Checkliste nicht gefunden" zurueck={{ to: '/auftraege/checklisten', label: 'Checklisten' }}>
        <Leer titel="Diese Checkliste gibt es nicht (mehr)." icon="liste" />
      </Seite>
    );
  const s = stand(c);
  return (
    <Seite
      titel={c.titel}
      oberzeile="Checkliste"
      untertitel={<AuftragKurz id={c.auftragId} />}
      zurueck={{ to: `/auftrag/${c.auftragId}`, label: 'Zum Auftrag' }}
      status={
        <>
          {s.fertig ? <Status ton="erfolg">Fertig</Status> : <Status ton="aktiv">{`${s.erledigt}/${s.gesamt}`}</Status>}
          <BeispielMarke zeigen={c.beispiel} />
        </>
      }
    >
      <Stapel abstand={24}>
        <ChecklisteAnsicht c={c} />
        {darfLoeschen && (
          <div>
            <Button
              variante="tertiaer"
              icon="muell"
              onClick={async () => {
                if (!(await fragen('Checkliste entfernen?', 'Die Checkliste landet im Papierkorb. Fotos bleiben am Auftrag.', 'Entfernen'))) return;
                checklisten.remove(c.id);
                toast('Checkliste entfernt.', { aktion: { label: 'Rückgängig', onClick: () => checklisten.restore(c.id) } });
                navigate(`/auftrag/${c.auftragId}`, { replace: true });
              }}
            >
              Checkliste entfernen
            </Button>
          </div>
        )}
      </Stapel>
      {bestaetigung}
    </Seite>
  );
}
