import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, vermerken } from '@core/db';
import { datum, euro, heute, initialen, personName, telLink } from '@core/format';
import { istBuero, useDarf, useIch } from '@core/session';
import { Avatar, BeispielMarke, Button, Dialog, Eingabe, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, Zeile, ZweiSpalten, useToast } from '@ui/index';
import { ObjektPanels, ObjektTabs, Zeitstrahl } from '@ui/objekt';
import { ROLLE_LABEL, istAktiv } from './team';

export function MitarbeiterDetail() {
  const { id = '' } = useParams();
  const m = db.mitarbeiter.useOne(id);
  const ich = useIch();
  const personal = useDarf('personal');
  const toast = useToast();
  const [austrittOffen, setAustrittOffen] = useState(false);
  const [austritt, setAustritt] = useState(heute());

  if (!m || m.geloeschtAm)
    return (
      <Seite titel="Mitarbeiter nicht gefunden" zurueck={{ to: '/betrieb/mitarbeiter', label: 'Mitarbeiter' }}>
        <Leer titel="Diesen Mitarbeiter gibt es nicht (mehr)." icon="person" />
      </Seite>
    );

  const darfAendern = personal || istBuero(ich);
  const aktiv = istAktiv(m);
  const austrittSpeichern = () => {
    const sofort = austritt <= heute();
    db.mitarbeiter.update(m.id, { austritt, aktiv: sofort ? false : m.aktiv }, { text: `Austritt zum ${datum(austritt)}` });
    vermerken({ typ: 'mitarbeiter', id: m.id }, 'mitarbeiter.austritt', `Austritt zum ${datum(austritt)} eingetragen`);
    setAustrittOffen(false);
    toast(sofort ? `${m.vorname} ist ausgetreten.` : `Austritt zum ${datum(austritt)} eingetragen. Macher stellt ${m.vorname} dann automatisch auf ausgetreten.`, {
      aktion: { label: 'Rückgängig', onClick: () => db.mitarbeiter.update(m.id, { austritt: undefined, aktiv: true }) },
    });
  };
  const reaktivieren = () => {
    db.mitarbeiter.update(m.id, { austritt: undefined, aktiv: true }, { text: 'Wieder im Team' });
    toast(`${m.vorname} ist wieder im Team.`);
  };

  return (
    <Seite
      titel={personName(m)}
      oberzeile={ROLLE_LABEL[m.rolle]}
      status={
        <>
          {!aktiv ? <Status>Ausgetreten</Status> : m.austritt ? <Status ton="achtung">Austritt am {datum(m.austritt)}</Status> : null}
          <BeispielMarke zeigen={m.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/mitarbeiter', label: 'Mitarbeiter' }}
      aktion={
        m.telefon ? (
          <Button icon="telefon" variante="sekundaer" onClick={() => (window.location.href = telLink(m.telefon)!)}>
            Anrufen
          </Button>
        ) : undefined
      }
    >
      <ZweiSpalten
        haupt={<ObjektTabs objekt="mitarbeiter" id={m.id} eigene={[{ id: 'verlauf', titel: 'Verlauf', inhalt: <Zeitstrahl bezug={{ typ: 'mitarbeiter', id: m.id }} /> }]} />}
        seite={
          <>
            <Karte titel="Kontakt" kompakt aktion={<Avatar text={initialen(m)} farbe={m.farbe} titel={personName(m)} />}>
              <Stapel abstand={8}>
                {m.telefon && <a href={telLink(m.telefon)}>{m.telefon}</a>}
                {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                {!m.telefon && !m.email && <Meta>Noch keine Kontaktdaten.</Meta>}
              </Stapel>
            </Karte>
            <Karte
              titel="Beschäftigung"
              kompakt
              aktion={darfAendern ? <Button klein variante="tertiaer" icon="stift" to={`/betrieb/mitarbeiter/${m.id}/bearbeiten`}>Bearbeiten</Button> : undefined}
            >
              <Stapel abstand={4}>
                <Meta>Rolle: {ROLLE_LABEL[m.rolle]}</Meta>
                {m.team && <Meta>Team: {m.team}</Meta>}
                <Meta>{String(m.wochenstunden).replace('.', ',')} Stunden pro Woche</Meta>
                <Meta>{m.urlaubstageJahr} Urlaubstage pro Jahr</Meta>
                {m.eintritt && <Meta>Im Betrieb seit {datum(m.eintritt)}</Meta>}
                {m.austritt && <Meta>Austritt: {datum(m.austritt)}</Meta>}
                {personal && <Meta>Interne Kosten: {m.kostensatz ? `${euro(m.kostensatz)} je Stunde` : 'noch nicht eingetragen'}</Meta>}
              </Stapel>
              {darfAendern && (
                <Zeile>
                  {aktiv && !m.austritt ? (
                    <Button klein variante="tertiaer" onClick={() => setAustrittOffen(true)}>
                      Austritt eintragen
                    </Button>
                  ) : (
                    <Button klein variante="tertiaer" onClick={reaktivieren}>
                      Wieder ins Team holen
                    </Button>
                  )}
                </Zeile>
              )}
            </Karte>
            <ObjektPanels objekt="mitarbeiter" id={m.id} />
          </>
        }
      />
      <Dialog
        offen={austrittOffen}
        onSchliessen={() => setAustrittOffen(false)}
        titel={`Austritt von ${m.vorname} eintragen`}
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setAustrittOffen(false)}>
              Abbrechen
            </Button>
            <Button onClick={austrittSpeichern}>Austritt speichern</Button>
          </>
        }
      >
        <Eingabe label="Letzter Arbeitstag" type="date" value={austritt} onChange={(e) => setAustritt(e.target.value)} />
        <Meldung>Daten, Zeiten und Nachweise bleiben erhalten. Geplante Termine ab dem Austritt zeigt dir Macher unter „Braucht dich“ zum Umplanen.</Meldung>
      </Dialog>
    </Seite>
  );
}
