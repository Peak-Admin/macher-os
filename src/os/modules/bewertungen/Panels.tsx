import { useState } from 'react';
import { db } from '@core/db';
import { relativ } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Karte, Meta, Stapel, Status, Zeile, useToast } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { anfrageFuerAuftrag, anfrageSenden, anfrageVorbereiten, bewertungen, empfehlerRangliste, empfehlungFuer, zufriedenheitLabel } from './daten';
import { EmpfehlerDialog, FEHLER_TEXT, ZufriedenheitDialog } from './Bewertungen';

/** Am Auftrag: Bewertung nach Abschluss */
export function BewertungPanelAuftrag({ id }: { id: ID }) {
  const a = db.auftraege.useOne(id);
  bewertungen.use();
  const toast = useToast();
  const darf = useDarf('veroeffentlichen');
  const [zufrieden, setZufrieden] = useState(false);
  if (!a || a.phase !== 'erledigt') return null;
  const b = anfrageFuerAuftrag(a.id);
  const senden = () => {
    const r = anfrageSenden(a.id);
    toast(r.ok ? 'Bewertungsanfrage ist raus.' : FEHLER_TEXT[r.grund], { ton: r.ok ? 'erfolg' : 'achtung' });
  };
  return (
    <Karte titel="Bewertung" icon="stern" kompakt>
      <Stapel abstand={8}>
        {!b || b.status === 'vorbereitet' ? (
          <>
            <Meta>{b ? 'Lotte hat eine Bewertungsanfrage vorbereitet.' : 'Der Auftrag ist erledigt. Frag den Kunden nach einer Bewertung.'}</Meta>
            <Zeile abstand={4}>
              <Button klein icon="stern" disabled={!darf} onClick={senden}>
                Anfrage senden
              </Button>
              {!b && (
                <Button klein variante="tertiaer" onClick={() => (anfrageVorbereiten(a), toast('Zur Freigabe vorgemerkt.'))}>
                  Später
                </Button>
              )}
            </Zeile>
          </>
        ) : b.status === 'verworfen' ? (
          <Meta>Bewusst nicht nach einer Bewertung gefragt.</Meta>
        ) : (
          <>
            <Status ton="erfolg">Gefragt {b.gesendetAm ? relativ(b.gesendetAm) : ''}</Status>
            <Meta>{b.zufriedenheit ? `Rückmeldung: ${zufriedenheitLabel(b.zufriedenheit)}` : 'Noch keine Rückmeldung eingetragen.'}</Meta>
            <div>
              <Button klein variante="tertiaer" onClick={() => setZufrieden(true)}>
                {b.zufriedenheit ? 'Rückmeldung ändern' : 'Rückmeldung eintragen'}
              </Button>
            </div>
          </>
        )}
      </Stapel>
      {zufrieden && b && <ZufriedenheitDialog b={b} onSchliessen={() => setZufrieden(false)} />}
    </Karte>
  );
}

/** Am Kunden: Empfehlungen und Zufriedenheit */
export function EmpfehlungPanelKunde({ id }: { id: ID }) {
  const kunde = db.kunden.useOne(id);
  const alle = bewertungen.use();
  const [dialog, setDialog] = useState(false);
  if (!kunde) return null;
  const von = empfehlungFuer(id);
  const hat = empfehlerRangliste(alle).find((r) => r.kundeId === id);
  const letzte = alle.filter((b) => b.kundeId === id && b.zufriedenheit).sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))[0];
  if (!von && !hat && !letzte && kunde.quelle !== 'empfehlung') return null;
  return (
    <Karte titel="Empfehlung & Zufriedenheit" icon="stern" kompakt>
      <Stapel abstand={8}>
        {von?.empfohlenVonKundeId ? (
          <Meta>
            Empfohlen von <ObjektLink bezug={{ typ: 'kunden', id: von.empfohlenVonKundeId }}>{db.kunden.get(von.empfohlenVonKundeId)?.name ?? 'Unbekannt'}</ObjektLink>
          </Meta>
        ) : kunde.quelle === 'empfehlung' ? (
          <Zeile abstand={8}>
            <Meta>Kam über eine Empfehlung.</Meta>
            <Button klein variante="sekundaer" onClick={() => setDialog(true)}>
              Von wem?
            </Button>
          </Zeile>
        ) : null}
        {hat && <Status ton="erfolg">{hat.anzahl === 1 ? 'Hat 1 Kunden empfohlen' : `Hat ${hat.anzahl} Kunden empfohlen`}</Status>}
        {letzte?.zufriedenheit && <Meta>Zuletzt: {zufriedenheitLabel(letzte.zufriedenheit)}</Meta>}
      </Stapel>
      {dialog && <EmpfehlerDialog kundeId={id} onSchliessen={() => setDialog(false)} />}
    </Karte>
  );
}
