/**
 * Kontext am Auftrag: alle Geschäftsdokumente dieses Auftrags in einer Liste (eine Sicht, keine Kopie)
 * und „Dokument erstellen“ – Macher schlägt passend zur Phase vor.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Abschnitt, AuswahlKarten, BeispielMarke, Button, Dialog, Liste, ListenZeile, Meta, Stapel, Status, TypIcon, useToast } from '@ui/index';
import { DOKUMENTART_ICON, DOKUMENTGRUPPE_TON, dokumenteZumAuftrag, erstellbareArten, type DokumentArtId } from './arten';

export function DokumentErstellenDialog({ auftragId, offen, onSchliessen }: { auftragId: ID; offen: boolean; onSchliessen: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const geld = useDarf('geld');
  const a = db.auftraege.useOne(auftragId);
  const arten = a ? erstellbareArten(a, geld) : [];
  const [wahl, setWahl] = useState<DokumentArtId | undefined>(undefined);
  if (!a || !offen) return null;
  const gewaehlt = arten.find((x) => x.art.id === (wahl ?? arten.find((y) => y.vorschlag)?.art.id ?? arten[0]?.art.id))?.art;
  const erstellen = () => {
    if (!gewaehlt?.erzeugen) return;
    const pfad = gewaehlt.erzeugen(auftragId);
    if (!pfad) return toast('Das hat nicht geklappt. Gibt es den Auftrag noch?', { ton: 'achtung' });
    toast(`${gewaehlt.label} vorbereitet.`);
    onSchliessen();
    navigate(pfad);
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Dokument erstellen"
      icon="dokument"
      breit
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={erstellen} disabled={!gewaehlt}>
            {gewaehlt ? `${gewaehlt.label} erstellen` : 'Erstellen'}
          </Button>
        </>
      }
    >
      <Stapel abstand={12}>
        <Meta>Macher füllt Kunde, Auftrag, Positionen, Material und Zeiten selbst ein. Vorgeschlagen ist, was jetzt passt.</Meta>
        <AuswahlKarten
          label="Welches Dokument?"
          wert={gewaehlt?.id ?? ''}
          onChange={(v) => setWahl(v as DokumentArtId)}
          optionen={arten.map(({ art, vorschlag }) => ({ wert: art.id, label: art.label, text: vorschlag ? `Passt jetzt. ${art.text}` : art.text, icon: DOKUMENTART_ICON[art.id] }))}
        />
      </Stapel>
    </Dialog>
  );
}

/** Abschnitt „Schreiben & Nachweise“ im Bereich Unterlagen › Dokumente des Auftrags */
export function DokumenteAmAuftrag({ auftragId }: { auftragId: ID }) {
  useDatenstand();
  const geld = useDarf('geld');
  const schreiben = useDarf('schreiben');
  const [offen, setOffen] = useState(false);
  const liste = dokumenteZumAuftrag(auftragId, geld);
  const sichtbar = liste.slice(0, 6);
  return (
    <Abschnitt
      titel="Schreiben & Nachweise"
      aktion={
        schreiben ? (
          <Button variante="sekundaer" klein icon="plus" onClick={() => setOffen(true)}>
            Dokument erstellen
          </Button>
        ) : undefined
      }
    >
      {liste.length ? (
        <Liste>
          {sichtbar.map((d) => (
            <ListenZeile
              key={`${d.bezug.typ}:${d.bezug.id}`}
              to={d.pfad}
              links={<TypIcon name={DOKUMENTART_ICON[d.art.id]} label={d.art.label} ton={DOKUMENTGRUPPE_TON[d.art.gruppe]} />}
              titel={
                <>
                  {d.label}
                  {d.nummer ? ` ${d.nummer}` : ''} <BeispielMarke zeigen={d.beispiel} />
                </>
              }
              untertitel={`${d.titel} · ${datum(d.datum)}`}
              rechts={<Status ton={d.status.ton}>{d.status.text}</Status>}
            />
          ))}
        </Liste>
      ) : (
        <Meta>Noch keine Dokumente. Auftragsbestätigung, Lieferschein, Bericht oder Prüfprotokoll erstellst du hier mit einem Klick.</Meta>
      )}
      {liste.length > sichtbar.length && <Meta>{`und ${liste.length - sichtbar.length} weitere – alle stehen in den Tabs Angebote, Rechnungen, Berichte und Abnahme.`}</Meta>}
      <DokumentErstellenDialog auftragId={auftragId} offen={offen} onSchliessen={() => setOffen(false)} />
    </Abschnitt>
  );
}
