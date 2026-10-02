import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, Karte, Liste, ListenZeile, Meta, Status, Stapel, useToast } from '@ui/index';
import { checklisteAnlegen, checklistePfad, checklisten, checklistenVorlagen, passendeVorlagen, stand } from './daten';

/** Für den Monteur am Termin: Checklisten zum Auftrag, direkt abhakbar */
export function ChecklistenTerminPanel({ id }: { id: ID }) {
  const toast = useToast();
  const t = db.termine.useOne(id);
  const liste = checklisten.use((c) => !!t?.auftragId && c.auftragId === t.auftragId, [t?.auftragId]);
  const vorlagen = checklistenVorlagen.use((v) => v.aktiv);
  if (!t?.auftragId) return null;
  const a = db.auftraege.get(t.auftragId);
  const passend = a ? passendeVorlagen(vorlagen, db.betrieb.get('betrieb')?.gewerk, a.art) : [];
  if (!liste.length && !passend.length) return null;
  return (
    <Karte titel="Checklisten" kompakt>
      <Stapel abstand={8}>
        {liste.length ? (
          <Liste>
            {liste.map((c) => {
              const s = stand(c);
              return <ListenZeile key={c.id} to={checklistePfad(c.id)} titel={c.titel} rechts={<Status ton={s.fertig ? 'erfolg' : s.offenePflicht ? 'achtung' : 'aktiv'}>{`${s.erledigt}/${s.gesamt}`}</Status>} />;
            })}
          </Liste>
        ) : (
          <>
            <Meta>Für diesen Einsatz passt „{passend[0].name}“.</Meta>
            <div>
              <Button
                variante="sekundaer"
                klein
                icon="liste"
                onClick={() => {
                  checklisteAnlegen(passend[0].id, t.auftragId!, t.id);
                  toast('Checkliste gestartet.');
                }}
              >
                Checkliste starten
              </Button>
            </div>
          </>
        )}
      </Stapel>
    </Karte>
  );
}
