import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { relativ, uhrzeit } from '@core/format';
import { pfadZu } from '@core/modul';
import { useIch } from '@core/session';
import { Button, Leer, Liste, ListenZeile, Stapel, Status, Tabs, Zeile, useToast } from '@ui/index';
import { alleGelesen, archivieren, fuerMich, meldungsGruppen, zurueckholen, type Ablage, type MeldungsGruppe } from './daten';

/** Punkt für Ungelesenes – der Text („Neu“) steht zusätzlich rechts, nie nur Farbe */
function Punkt({ an }: { an: boolean }) {
  return <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: an ? 'var(--mm-brand)' : 'transparent', flexShrink: 0 }} />;
}

/**
 * Posteingang wie in Notion – im Glocken-Overlay und auf der Seite gleich.
 * Beim Öffnen gilt alles als gelesen (bleibt aber für diesen Besuch als „Neu“ markiert).
 * Mehrere Meldungen zum selben Objekt erscheinen als ein Eintrag mit Zähler.
 */
export function BenachrichtigungsListe({ onNavigiert }: { onNavigiert?: () => void }) {
  const ich = useIch();
  const navigate = useNavigate();
  const toast = useToast();
  const alle = fuerMich(db.benachrichtigungen.use(), ich?.id);
  const [ablage, setAblage] = useState<Ablage>('posteingang');
  // Was beim Öffnen neu war, bleibt in diesem Besuch markiert – gespeichert wird es sofort als gelesen
  const [warNeu] = useState(() => new Set(alle.filter((b) => !b.gelesen && !b.archiviert).map((b) => b.id)));
  useEffect(() => {
    alleGelesen(db.benachrichtigungen.where((b) => warNeu.has(b.id)));
  }, [warNeu]);

  const posteingang = meldungsGruppen(alle, 'posteingang', warNeu);
  const archiv = meldungsGruppen(alle, 'archiv');
  const gruppen = ablage === 'posteingang' ? posteingang : archiv.slice(0, 50);

  const oeffnen = (g: MeldungsGruppe) => {
    alleGelesen(g.eintraege);
    const pfad = pfadZu(g.neueste.bezug);
    if (pfad) {
      onNavigiert?.();
      navigate(pfad);
    }
  };

  const zeile = (g: MeldungsGruppe) => {
    const b = g.neueste;
    const n = g.eintraege.length;
    const neu = ablage === 'posteingang' && g.ungelesen;
    return (
      <ListenZeile
        key={g.schluessel}
        titel={b.titel}
        untertitel={[b.text, n > 1 ? `${n} Meldungen` : undefined, `${relativ(b.erstelltAm)}, ${uhrzeit(b.erstelltAm)} Uhr`].filter(Boolean).join(' · ')}
        links={<Punkt an={neu} />}
        rechts={neu ? <Status ton={g.wichtig ? 'achtung' : 'aktiv'}>{g.wichtig ? 'Wichtig' : 'Neu'}</Status> : undefined}
        onClick={() => oeffnen(g)}
        aktion={
          ablage === 'posteingang' ? (
            <Button variante="tertiaer" klein icon="check" aria-label={`„${b.titel}“ archivieren`} onClick={() => archivieren(g.eintraege)}>
              Archivieren
            </Button>
          ) : (
            <Button variante="tertiaer" klein icon="zurueck" aria-label={`„${b.titel}“ zurückholen`} onClick={() => zurueckholen(g.eintraege)}>
              Zurückholen
            </Button>
          )
        }
      />
    );
  };

  return (
    <Stapel abstand={16}>
      <Zeile zwischen>
        <Tabs
          aktiv={ablage}
          onWechsel={(id) => setAblage(id as Ablage)}
          tabs={[
            { id: 'posteingang', titel: 'Posteingang', zaehler: posteingang.length },
            { id: 'archiv', titel: 'Archiv' },
          ]}
        />
        {ablage === 'posteingang' && posteingang.length > 0 && (
          <Button
            variante="tertiaer"
            klein
            icon="check"
            onClick={() => {
              const n = posteingang.length;
              archivieren(posteingang.flatMap((g) => g.eintraege));
              toast(n === 1 ? 'Eine Meldung archiviert.' : `${n} Meldungen archiviert.`);
            }}
          >
            Alle archivieren
          </Button>
        )}
      </Zeile>
      <Liste
        leer={
          ablage === 'posteingang' ? (
            <Leer
              icon="glocke"
              titel="Dein Posteingang ist leer"
              text="Macher meldet sich nur, wenn du reagieren solltest: neue Anfrage, Kundennachricht, Urlaubsantrag, angenommenes Angebot, Zahlungseingang oder eine Aufgabe für dich."
              aktion={archiv.length ? <Button variante="sekundaer" onClick={() => setAblage('archiv')}>Archiv ansehen</Button> : undefined}
            />
          ) : (
            <Leer icon="glocke" titel="Noch nichts archiviert" text="Was du im Posteingang archivierst, findest du hier wieder." />
          )
        }
      >
        {gruppen.map(zeile)}
      </Liste>
    </Stapel>
  );
}
