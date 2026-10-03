import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { datum, heute, uhrzeit, relativ } from '@core/format';
import type { Anlage, ID } from '@core/objects';
import { Button, Checkbox, Fortschritt, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Stapel, Status, Textfeld, Zeile, useToast } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { intervallText } from '../wiederkehrend/regel';
import { serien, serieAktiv } from '../wiederkehrend/daten';
import { vertragFuerAuftrag } from '../servicevertraege/daten';
import { benachrichtigungsText, kundeBenachrichtigen, kundeBenachrichtigt, offenerWartungsauftrag, terminVorschlagen, wartungAbschliessen, wartungsauftragAnlegen, wartungsTermin } from './logik';

const FERTIG = ['abnahme', 'abrechnung', 'erledigt', 'verloren'];

/** Tab „Wartung“ in der Auftragsakte */
export function WartungTab({ id }: { id: ID }) {
  useDatenstand();
  const a = db.auftraege.useOne(id);
  const toast = useToast();
  const navigate = useNavigate();
  const [text, setText] = useState<string>();
  if (!a) return null;
  const anlagen = (a.anlageIds ?? []).map((x) => db.anlagen.get(x)).filter(Boolean) as Anlage[];
  const vertrag = vertragFuerAuftrag(a);
  const punkte = db.aufgaben.where((t) => t.auftragId === a.id && t.quelle === 'wartung').sort((x, y) => (x.reihenfolge ?? 0) - (y.reihenfolge ?? 0));
  const erledigtN = punkte.filter((p) => p.erledigt).length;
  const termin = wartungsTermin(a.id);
  const informiert = kundeBenachrichtigt(a.id);
  const fertig = FERTIG.includes(a.phase);
  const serie = serien.where((s) => serieAktiv(s) && (s.anlageIds ?? []).some((x) => (a.anlageIds ?? []).includes(x)))[0];

  const abschliessen = () => {
    wartungAbschliessen(a.id);
    const naechste = anlagen.map((x) => db.anlagen.get(x.id)?.naechsteWartung).filter(Boolean).sort()[0];
    toast(naechste ? `Wartung erledigt. Nächste Wartung am ${datum(naechste)} ist eingetragen.` : 'Wartung erledigt.');
  };

  return (
    <Stapel>
      {vertrag && (
        <Meldung ton="erfolg" titel={`Im Servicevertrag ${vertrag.nummer} enthalten`}>
          Diese Wartung wird nicht extra berechnet. Nur Zusatzarbeiten außerhalb des Vertrags abrechnen.
        </Meldung>
      )}

      <Karte titel="Anlagen">
        <Liste leer={<Meta>Keine Anlage am Auftrag. Wartungsaufträge entstehen normalerweise aus einer Anlage.</Meta>}>
          {anlagen.map((x) => (
            <ListenZeile
              key={x.id}
              titel={<ObjektLink bezug={{ typ: 'anlagen', id: x.id }}>{`${x.typ}${x.hersteller ? ` – ${x.hersteller}` : ''}${x.modell ? ` ${x.modell}` : ''}`}</ObjektLink>}
              untertitel={[x.seriennummer ? `SN ${x.seriennummer}` : undefined, x.baujahr ? `Baujahr ${x.baujahr}` : undefined, `letzte Wartung ${datum(x.letzteWartung)}`, intervallText(x.wartungMonate)].filter(Boolean).join(' · ')}
              rechts={x.naechsteWartung ? <Status ton={x.naechsteWartung < heute() && !fertig ? 'achtung' : 'neutral'}>{`fällig ${datum(x.naechsteWartung)}`}</Status> : undefined}
            />
          ))}
        </Liste>
      </Karte>

      <Karte titel="Prüfpunkte" aktion={punkte.length ? <Meta>{`${erledigtN} von ${punkte.length}`}</Meta> : undefined}>
        {punkte.length ? (
          <Stapel abstand={12}>
            <Fortschritt wert={erledigtN} max={punkte.length} label="Erledigt" />
            {punkte.map((p) => (
              <Checkbox
                key={p.id}
                label={p.titel}
                checked={p.erledigt}
                disabled={fertig}
                onChange={(an) => db.aufgaben.update(p.id, { erledigt: an, erledigtAm: an ? new Date().toISOString() : undefined })}
              />
            ))}
          </Stapel>
        ) : (
          <Leer titel="Keine Prüfpunkte" text="Macher legt Prüfpunkte je Anlagentyp an, wenn der Wartungsauftrag automatisch entsteht." icon="liste" />
        )}
      </Karte>

      {!fertig && (
        <Karte titel="Termin und Kunde">
          <Stapel>
            {termin ? (
              <Meta>
                Termin: {datum(termin.start)}, {uhrzeit(termin.start)} Uhr ({relativ(termin.start)}){termin.serieId ? ' – aus der Serie' : ''}
              </Meta>
            ) : (
              <Zeile>
                <Meta>Noch kein Termin.</Meta>
                <Button
                  klein
                  variante="sekundaer"
                  icon="kalender"
                  onClick={() => {
                    const p = terminVorschlagen(a.id);
                    if (p) navigate(p);
                    else toast('Die Planung ist noch nicht eingerichtet. Leg den Termin im Kalender an.', { ton: 'achtung' });
                  }}
                >
                  Termin vorschlagen
                </Button>
              </Zeile>
            )}
            {informiert ? (
              <Status ton="erfolg">Kunde ist informiert</Status>
            ) : (
              <>
                <Textfeld label="Nachricht an den Kunden" rows={7} value={text ?? benachrichtigungsText(a.id)} onChange={(e) => setText(e.target.value)} hilfe="Von Macher vorbereitet – prüfen, anpassen, freigeben." />
                <div>
                  <Button
                    variante="sekundaer"
                    icon="mail"
                    onClick={() => {
                      kundeBenachrichtigen(a.id, text ?? benachrichtigungsText(a.id));
                      toast('Nachricht an den Kunden gesendet.');
                    }}
                  >
                    Kunde benachrichtigen
                  </Button>
                </div>
              </>
            )}
          </Stapel>
        </Karte>
      )}

      {!serie && anlagen.length > 0 && (
        <Meta>
          Kommt jedes Jahr wieder? <SeriePlanenKnopf anlageId={anlagen[0].id} />
        </Meta>
      )}

      {!fertig ? (
        <div>
          <Button icon="check" onClick={abschliessen}>
            Wartung abschließen
          </Button>
          <Meta>Trägt die Wartung an den Anlagen ein und berechnet die nächste Fälligkeit.</Meta>
        </div>
      ) : (
        <Status ton="erfolg">Wartung abgeschlossen</Status>
      )}
    </Stapel>
  );
}

function SeriePlanenKnopf({ anlageId }: { anlageId: ID }) {
  const navigate = useNavigate();
  return (
    <Button klein variante="tertiaer" icon="wiederholen" onClick={() => navigate(`/plan/wiederkehrend/neu?anlageId=${anlageId}`)}>
      Als Serie planen
    </Button>
  );
}

/** Panel an der Anlage: letzte/nächste Wartung + offener Auftrag */
export function AnlageWartungPanel({ id }: { id: ID }) {
  useDatenstand();
  const a = db.anlagen.useOne(id);
  const toast = useToast();
  const navigate = useNavigate();
  if (!a) return null;
  const auftrag = offenerWartungsauftrag(a.id);
  const ueber = !!a.naechsteWartung && a.naechsteWartung < heute();
  return (
    <Karte titel="Wartung" kompakt>
      <Stapel abstand={8}>
        <Meta>Intervall: {intervallText(a.wartungMonate)}</Meta>
        <Meta>Letzte Wartung: {datum(a.letzteWartung)}</Meta>
        <div>
          {a.naechsteWartung ? (
            <Status ton={ueber ? 'gefahr' : 'neutral'}>{`${ueber ? 'Überfällig seit' : 'Nächste'} ${datum(a.naechsteWartung)}`}</Status>
          ) : (
            <Status>Kein Datum eingetragen</Status>
          )}
        </div>
        {auftrag ? (
          <Meta>
            Offener Auftrag: <ObjektLink bezug={{ typ: 'auftraege', id: auftrag.id }}>{auftrag.nummer}</ObjektLink>
          </Meta>
        ) : (
          <div>
            <Button
              klein
              variante="sekundaer"
              onClick={() => {
                const n = wartungsauftragAnlegen([a]);
                toast(`Wartungsauftrag ${n.nummer} angelegt.`);
                const p = pfadZu({ typ: 'auftraege', id: n.id });
                if (p) navigate(p);
              }}
            >
              Wartungsauftrag anlegen
            </Button>
          </div>
        )}
      </Stapel>
    </Karte>
  );
}
