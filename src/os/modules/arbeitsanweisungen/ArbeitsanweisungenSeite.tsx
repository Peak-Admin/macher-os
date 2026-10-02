import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { Abschnitt, Button, Leer, Liste, ListenZeile, Seite, Status, useToast } from '@ui/index';
import { anweisungPfad, arbeitsanweisungen } from './daten';

export function ArbeitsanweisungenSeite() {
  const navigate = useNavigate();
  const toast = useToast();
  const alle = arbeitsanweisungen.use();
  const vorlagen = alle.filter((x) => x.vorlage).sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
  const laufend = alle.filter((x) => {
    const a = db.auftraege.get(x.auftragId);
    return !x.vorlage && a && a.phase !== 'erledigt' && a.phase !== 'verloren';
  });
  const vorlageAnlegen = () => {
    const v = arbeitsanweisungen.create({ titel: 'Neue Vorlage', vorlage: true, schritte: [], sicherheit: [] });
    toast('Vorlage angelegt. Jetzt Schritte eintragen.');
    navigate(anweisungPfad(v.id, true));
  };
  return (
    <Seite titel="Arbeitsanweisungen" untertitel="Was vor Ort zu tun ist – kurz, klar, mit Fotos und Sicherheit." aktion={<Button icon="plus" onClick={vorlageAnlegen}>Vorlage anlegen</Button>}>
      <Abschnitt titel="An laufenden Aufträgen" hinweis="Anweisungen für einen Auftrag legst du direkt in der Auftragsakte an.">
        <Liste leer={<Leer titel="Keine Anweisungen an laufenden Aufträgen" text="Öffne einen Auftrag und leg im Tab „Arbeitsanweisung“ fest, was vor Ort zu tun ist." icon="wissen" aktion={<Button variante="sekundaer" to="/auftraege/auftraege">Zu den Aufträgen</Button>} />}>
          {laufend.map((x) => {
            const a = db.auftraege.get(x.auftragId)!;
            return (
              <ListenZeile
                key={x.id}
                to={anweisungPfad(x.id)}
                titel={x.titel}
                untertitel={`${a.nummer} · ${db.kunden.get(a.kundeId)?.name ?? ''} · ${x.schritte.length} Schritte`}
                rechts={x.gelesen?.length ? <Status ton="erfolg">{`${x.gelesen.length}× gelesen`}</Status> : <Status ton="neutral">Ungelesen</Status>}
              />
            );
          })}
        </Liste>
      </Abschnitt>
      <Abschnitt titel="Vorlagen">
        <Liste leer={<Leer titel="Noch keine Vorlagen" text="Vorlagen sparen dir Schreibarbeit bei wiederkehrenden Arbeiten." icon="wissen" aktion={<Button variante="sekundaer" onClick={vorlageAnlegen}>Vorlage anlegen</Button>} />}>
          {vorlagen.map((x) => (
            <ListenZeile key={x.id} to={anweisungPfad(x.id)} titel={x.titel} untertitel={`${x.schritte.length} Schritte${x.sicherheit.length ? ` · ${x.sicherheit.length} Sicherheitshinweise` : ''}`} />
          ))}
        </Liste>
      </Abschnitt>
    </Seite>
  );
}
