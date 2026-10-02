import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { pfadZu } from '@core/modul';
import { datum, datumKurz, heute, relativ } from '@core/format';
import type { Anlage } from '@core/objects';
import { Auswahl, Button, Filter, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Raster, Seite, Status, Zeile, useToast } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { intervallText } from '../wiederkehrend/regel';
import { vertragFuerAnlage, vertragFuerAuftrag } from '../servicevertraege/daten';
import { einordnen, faelligeAnlagen, kundeBenachrichtigt, offenerWartungsauftrag, wartungenAnlegen, wartungsauftragAnlegen, wartungsTermin, type Zeitraum } from './logik';

type F = Zeitraum | 'alle';

export function WartungUebersicht() {
  useDatenstand();
  const toast = useToast();
  const navigate = useNavigate();
  const [vorlauf, setVorlauf] = useEinstellung<number>('wartung.vorlaufWochen', 4);
  const t = heute();
  const mitDatum = db.anlagen.use((a) => !!a.naechsteWartung).sort((a, b) => a.naechsteWartung!.localeCompare(b.naechsteWartung!));
  const ohneDatum = db.anlagen.use((a) => !!a.wartungMonate && !a.naechsteWartung);
  const gruppen: Record<Zeitraum, Anlage[]> = { ueberfaellig: [], woche: [], monat: [], spaeter: [] };
  for (const a of mitDatum) gruppen[einordnen(a.naechsteWartung!, t)].push(a);
  const [filter, setFilter] = useState<F>(gruppen.ueberfaellig.length ? 'ueberfaellig' : gruppen.woche.length ? 'woche' : 'monat');
  const liste = filter === 'alle' ? mitDatum : gruppen[filter];
  const offeneAuftraege = db.auftraege.use((a) => a.art === 'wartung' && !['erledigt', 'verloren'].includes(a.phase));
  const anlegbar = faelligeAnlagen(t, vorlauf * 7);

  const alleAnlegen = () => {
    const neu = wartungenAnlegen(t, false);
    toast(neu.length === 1 ? '1 Wartungsauftrag angelegt.' : `${neu.length} Wartungsaufträge angelegt.`);
  };

  const einzeln = (a: Anlage) => {
    const auftrag = wartungsauftragAnlegen([a], t);
    toast(`Wartungsauftrag ${auftrag.nummer} angelegt.`);
    const p = pfadZu({ typ: 'auftraege', id: auftrag.id });
    if (p) navigate(p);
  };

  return (
    <Seite
      titel="Wartung & Service"
      untertitel={`Was fällig ist. Macher legt Wartungsaufträge ${vorlauf} Wochen vorher an und bündelt Anlagen am selben Ort.`}
      aktion={anlegbar.length ? <Button icon="plus" onClick={alleAnlegen}>{anlegbar.length === 1 ? 'Fällige Wartung anlegen' : `${anlegbar.length} fällige Wartungen anlegen`}</Button> : undefined}
    >
      <Raster min={160}>
        <Kennzahl label="Überfällig" wert={gruppen.ueberfaellig.length} ton={gruppen.ueberfaellig.length ? 'achtung' : undefined} />
        <Kennzahl label="Diese Woche" wert={gruppen.woche.length} />
        <Kennzahl label="Diesen Monat" wert={gruppen.monat.length} hinweis="nach dieser Woche" />
        <Kennzahl label="Offene Wartungsaufträge" wert={offeneAuftraege.length} />
      </Raster>

      {ohneDatum.length > 0 && (
        <Meldung ton="neutral" titel={ohneDatum.length === 1 ? '1 Anlage ohne nächstes Wartungsdatum' : `${ohneDatum.length} Anlagen ohne nächstes Wartungsdatum`}>
          {ohneDatum.map((a) => `${a.typ} (${db.kunden.get(a.kundeId)?.name ?? 'Kunde'})`).join(', ')}. Trag an der Anlage die letzte oder nächste Wartung ein, dann plant Macher mit.
        </Meldung>
      )}

      {mitDatum.length === 0 ? (
        <Leer
          titel="Noch keine Wartungen geplant"
          text="Trag an deinen Anlagen das Wartungsintervall und die nächste Wartung ein. Macher legt die Aufträge dann rechtzeitig an."
          aktion={<Button to="/auftraege">Zu den Aufträgen</Button>}
          icon="werkzeug"
        />
      ) : (
        <>
          <Filter
            label="Fälligkeit"
            wert={filter}
            onChange={setFilter}
            optionen={[
              { wert: 'ueberfaellig', label: 'Überfällig', zaehler: gruppen.ueberfaellig.length },
              { wert: 'woche', label: 'Diese Woche', zaehler: gruppen.woche.length },
              { wert: 'monat', label: 'Diesen Monat', zaehler: gruppen.monat.length },
              { wert: 'spaeter', label: 'Später', zaehler: gruppen.spaeter.length },
              { wert: 'alle', label: 'Alle', zaehler: mitDatum.length },
            ]}
          />
          <Liste leer={<Leer titel="Nichts fällig in diesem Zeitraum" text="Gut so. Schau in die anderen Zeiträume." icon="check" />}>
            {liste.map((a) => {
              const auftrag = offenerWartungsauftrag(a.id);
              const vertrag = vertragFuerAnlage(a.id, t);
              const kunde = db.kunden.get(a.kundeId);
              const ort = db.orte.get(a.ortId);
              const ueber = a.naechsteWartung! < t;
              const p = auftrag ? pfadZu({ typ: 'auftraege', id: auftrag.id }) : undefined;
              return (
                <ListenZeile
                  key={a.id}
                  titel={
                    <>
                      <ObjektLink bezug={{ typ: 'anlagen', id: a.id }}>{a.typ}</ObjektLink> · {kunde?.name ?? 'Kunde fehlt'}
                    </>
                  }
                  untertitel={[
                    `${ueber ? 'überfällig seit' : 'fällig'} ${relativ(a.naechsteWartung)}`,
                    ort ? `${ort.bezeichnung}, ${ort.adresse.ort}` : undefined,
                    intervallText(a.wartungMonate),
                    vertrag ? `Vertrag ${vertrag.nummer}` : undefined,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  rechts={
                    auftrag ? (
                      <Zeile abstand={8}>
                        {ueber && <Status ton="achtung">Überfällig</Status>}
                        <Status ton="aktiv">{`Auftrag ${auftrag.nummer}`}</Status>
                        {p && <Button klein variante="tertiaer" to={p}>Öffnen</Button>}
                      </Zeile>
                    ) : (
                      <Zeile abstand={8}>
                        {ueber && <Status ton="achtung">Überfällig</Status>}
                        <Button klein variante={ueber ? 'primaer' : 'sekundaer'} onClick={() => einzeln(a)}>
                          Auftrag anlegen
                        </Button>
                      </Zeile>
                    )
                  }
                />
              );
            })}
          </Liste>
        </>
      )}

      <Karte titel="Laufende Wartungsaufträge">
        <Liste leer={<Leer titel="Keine offenen Wartungsaufträge" text="Sobald eine Wartung fällig wird, steht der Auftrag hier." icon="werkzeug" />}>
          {offeneAuftraege
            .sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm))
            .map((a) => {
              const termin = wartungsTermin(a.id);
              const v = vertragFuerAuftrag(a, t);
              const status = !termin ? (
                <Status ton="achtung">Termin fehlt</Status>
              ) : !kundeBenachrichtigt(a.id) ? (
                <Status ton="aktiv">{`Termin ${datumKurz(termin.start)} – Kunde noch nicht informiert`}</Status>
              ) : (
                <Status ton="erfolg">{`Termin ${datumKurz(termin.start)}`}</Status>
              );
              return (
                <ListenZeile
                  key={a.id}
                  to={pfadZu({ typ: 'auftraege', id: a.id })}
                  titel={`${a.nummer} · ${db.kunden.get(a.kundeId)?.name ?? ''}`}
                  untertitel={[a.titel, v ? 'im Vertrag enthalten' : undefined, `seit ${datum(a.erstelltAm)}`].filter(Boolean).join(' · ')}
                  rechts={status}
                />
              );
            })}
        </Liste>
      </Karte>

      <Karte titel="So arbeitet Macher für dich" kompakt>
        <Auswahl
          label="Wartungsaufträge anlegen"
          value={String(vorlauf)}
          onChange={(e) => {
            setVorlauf(Number(e.target.value));
            toast('Vorlauf gespeichert.');
          }}
          optionen={[2, 3, 4, 6, 8].map((w) => ({ wert: String(w), label: `${w} Wochen vor der Fälligkeit` }))}
          hilfe="Je Auftrag: Prüfpunkte je Anlage als Aufgaben, Terminvorschlag und vorbereitete Nachricht an den Kunden zur Freigabe."
        />
      </Karte>
    </Seite>
  );
}
