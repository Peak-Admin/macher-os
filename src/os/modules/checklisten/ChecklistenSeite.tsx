import { db } from '@core/db';
import { Abschnitt, Button, Leer, Liste, ListenZeile, Seite, Status } from '@ui/index';
import { checklistePfad, checklisten, checklistenVorlagen, stand, vorlagePfad } from './daten';
import { ART_LABEL } from '../auftraege/logik';

/** Übersicht: offene Checklisten an laufenden Aufträgen + Vorlagen pflegen */
export function ChecklistenSeite() {
  const offene = checklisten
    .use()
    .filter((c) => {
      const a = db.auftraege.get(c.auftragId);
      return a && !a.geloeschtAm && a.phase !== 'erledigt' && a.phase !== 'verloren' && !stand(c).fertig;
    });
  const vorlagen = checklistenVorlagen.use().sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return (
    <Seite titel="Checklisten" untertitel="Wiederkehrende Schritte, damit vor Ort nichts vergessen wird." aktion={<Button icon="plus" to="/auftraege/checklisten/vorlage/neu">Vorlage anlegen</Button>}>
      <Abschnitt titel="Offen an laufenden Aufträgen">
        <Liste leer={<Leer titel="Alles abgehakt" text="An laufenden Aufträgen ist keine Checkliste offen." icon="check" />}>
          {offene.map((c) => {
            const a = db.auftraege.get(c.auftragId)!;
            const s = stand(c);
            return (
              <ListenZeile
                key={c.id}
                to={checklistePfad(c.id)}
                titel={c.titel}
                untertitel={`${a.nummer} · ${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? ''}`}
                rechts={s.offenePflicht ? <Status ton="achtung">{`${s.offenePflicht} Pflicht offen`}</Status> : <Status ton="aktiv">{`${s.erledigt}/${s.gesamt}`}</Status>}
              />
            );
          })}
        </Liste>
      </Abschnitt>
      <Abschnitt titel="Vorlagen" hinweis="Vorlagen mit „automatisch“ hängt Macher an jeden passenden Auftrag, sobald er beauftragt ist.">
        <Liste leer={<Leer titel="Noch keine Vorlagen" text="Leg deine erste Checkliste an – zum Beispiel für Kundendienst oder Baustellenabschluss." icon="liste" aktion={<Button to="/auftraege/checklisten/vorlage/neu">Vorlage anlegen</Button>} />}>
          {vorlagen.map((v) => (
            <ListenZeile
              key={v.id}
              to={vorlagePfad(v.id)}
              titel={v.name}
              untertitel={`${v.punkte.length} Punkte · ${v.arten.map((x) => ART_LABEL[x]).join(', ')}`}
              rechts={!v.aktiv ? <Status ton="neutral">Pausiert</Status> : v.automatisch ? <Status ton="aktiv">Automatisch</Status> : <Status ton="neutral">Von Hand</Status>}
            />
          ))}
        </Liste>
      </Abschnitt>
    </Seite>
  );
}
