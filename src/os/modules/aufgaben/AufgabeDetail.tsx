import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { datum } from '@core/format';
import { useDarf } from '@core/session';
import type { Aufgabe } from '@core/objects';
import { BeispielMarke, Button, Checkbox, Eingabe, FormRaster, Karte, Leer, Meta, Seite, Stapel, Status, Textfeld, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { AuftragAuswahl, AuftragKurz, MitarbeiterAuswahl, ObjektLink, Zeitstrahl } from '@ui/objekt';
import { abhaken } from './daten';

export function AufgabeDetail() {
  const { id = '' } = useParams();
  const a = db.aufgaben.useOne(id);
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Aufgabe nicht gefunden" zurueck={{ to: '/auftraege/aufgaben', label: 'Aufgaben' }}>
        <Leer titel="Diese Aufgabe gibt es nicht (mehr)." icon="check" aktion={<Button to="/auftraege/aufgaben">Zu den Aufgaben</Button>} />
      </Seite>
    );
  return <AufgabeBearbeiten key={a.id} a={a} />;
}

function AufgabeBearbeiten({ a }: { a: Aufgabe }) {
  const toast = useToast();
  const navigate = useNavigate();
  const darfLoeschen = useDarf('loeschen');
  const [fragen, bestaetigung] = useBestaetigen();
  const [f, setF] = useState({ titel: a.titel, notiz: a.notiz ?? '', faellig: a.faellig ?? '', zustaendigId: a.zustaendigId ?? '', auftragId: a.auftragId ?? '', wichtig: a.prioritaet === 'hoch' });
  const [fehler, setFehler] = useState<string>();
  const geaendert = f.titel !== a.titel || f.notiz !== (a.notiz ?? '') || f.faellig !== (a.faellig ?? '') || f.zustaendigId !== (a.zustaendigId ?? '') || f.auftragId !== (a.auftragId ?? '') || f.wichtig !== (a.prioritaet === 'hoch');
  const zurueck = a.auftragId ? { to: `/auftrag/${a.auftragId}`, label: 'Zum Auftrag' } : { to: '/auftraege/aufgaben', label: 'Aufgaben' };

  const speichern = () => {
    if (!f.titel.trim()) return setFehler('Die Aufgabe braucht einen Titel.');
    db.aufgaben.update(a.id, {
      titel: f.titel.trim(),
      notiz: f.notiz.trim() || undefined,
      faellig: f.faellig || undefined,
      zustaendigId: f.zustaendigId || undefined,
      auftragId: f.auftragId || undefined,
      prioritaet: f.wichtig ? 'hoch' : 'normal',
    });
    setFehler(undefined);
    toast('Aufgabe gespeichert.');
  };

  return (
    <Seite
      titel={a.titel}
      oberzeile="Aufgabe"
      zurueck={zurueck}
      status={
        <>
          {a.erledigt ? <Status ton="erfolg">Erledigt</Status> : <Status ton="aktiv">Offen</Status>}
          <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      aktion={
        <Button
          icon={a.erledigt ? 'wiederholen' : 'check'}
          variante={a.erledigt ? 'sekundaer' : 'primaer'}
          onClick={() => {
            abhaken(a.id, !a.erledigt);
            toast(a.erledigt ? 'Aufgabe wieder geöffnet.' : 'Aufgabe erledigt.');
          }}
        >
          {a.erledigt ? 'Wieder öffnen' : 'Erledigt'}
        </Button>
      }
    >
      <ZweiSpalten
        haupt={
          <Karte>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                speichern();
              }}
            >
              <Stapel abstand={16}>
                <Eingabe label="Was ist zu tun?" value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} fehler={fehler} />
                <FormRaster>
                  <Eingabe label="Fällig am" type="date" optional value={f.faellig} onChange={(e) => setF({ ...f, faellig: e.target.value })} />
                  <MitarbeiterAuswahl label="Wer kümmert sich?" wert={f.zustaendigId} onChange={(v) => setF({ ...f, zustaendigId: v })} optional />
                </FormRaster>
                <AuftragAuswahl wert={f.auftragId} onChange={(v) => setF({ ...f, auftragId: v })} optional nurOffene={false} />
                <Textfeld label="Notiz" optional value={f.notiz} onChange={(e) => setF({ ...f, notiz: e.target.value })} rows={4} />
                <Checkbox label="Wichtig" checked={f.wichtig} onChange={(v) => setF({ ...f, wichtig: v })} />
                <div>
                  <Button type="submit" variante={geaendert ? 'primaer' : 'sekundaer'} disabled={!geaendert}>
                    Änderungen speichern
                  </Button>
                </div>
              </Stapel>
            </form>
          </Karte>
        }
        seite={
          <>
            {a.auftragId && (
              <Karte titel="Auftrag" kompakt>
                <Stapel abstand={4}>
                  <ObjektLink bezug={{ typ: 'auftraege', id: a.auftragId }}>{db.auftraege.get(a.auftragId)?.titel ?? 'Auftrag öffnen'}</ObjektLink>
                  <AuftragKurz id={a.auftragId} />
                </Stapel>
              </Karte>
            )}
            <Karte titel="Verlauf" kompakt>
              <Stapel abstand={8}>
                <Meta>Angelegt am {datum(a.erstelltAm)}{a.quelle && a.quelle !== 'manuell' ? ` · automatisch (${a.quelle})` : ''}</Meta>
                <Zeitstrahl bezug={{ typ: 'aufgaben', id: a.id }} max={10} />
              </Stapel>
            </Karte>
            {darfLoeschen && (
              <Button
                variante="tertiaer"
                icon="muell"
                onClick={async () => {
                  if (!(await fragen('Aufgabe löschen?', 'Die Aufgabe landet im Papierkorb.', 'Löschen'))) return;
                  db.aufgaben.remove(a.id);
                  toast('Aufgabe gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.aufgaben.restore(a.id) } });
                  navigate(zurueck.to, { replace: true });
                }}
              >
                Aufgabe löschen
              </Button>
            )}
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}
