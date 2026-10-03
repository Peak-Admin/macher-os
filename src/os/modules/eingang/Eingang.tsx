/**
 * Eingang fürs Büro: Anfragen, Kundennachrichten und Freigaben an EINEM Ort – neueste oben,
 * je Eintrag genau eine Hauptaktion. Darunter das Anfrage-Postfach (Weiterleitungsadresse).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudAktiv } from '@core/cloud';
import { getVersion, useDatenstand } from '@core/db';
import { aktionAusfuehren } from '@core/modul';
import { relativ } from '@core/format';
import { useIch } from '@core/session';
import type { Mitarbeiter } from '@core/objects';
import { Button, Filter, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, TypIcon, Zeile, useToast } from '@ui/index';
import { anfragePostfach, ART_ICON, ART_LABEL, ART_TON, eingangsEintraege, type EingangsArt, type EingangsEintrag } from './daten';

type F = 'alle' | EingangsArt;

export function EingangSeite() {
  const stand = useDatenstand();
  const ich = useIch();
  const eintraege = useMemo(() => eingangsEintraege(ich), [stand, ich]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filter, setFilter] = useState<F>('alle');
  const zahl = (a: EingangsArt) => eintraege.filter((e) => e.art === a).length;
  const sichtbar = filter === 'alle' ? eintraege : eintraege.filter((e) => e.art === filter);

  return (
    <Seite titel="Eingang" untertitel="Alles Neue an einem Ort: Anfragen, Kundennachrichten und Freigaben. Neueste oben.">
      <Stapel abstand={24}>
        {eintraege.length > 0 && (
          <Filter
            label="Anzeigen"
            wert={filter}
            onChange={setFilter}
            optionen={[
              { wert: 'alle', label: 'Alle', zaehler: eintraege.length },
              { wert: 'anfrage', label: 'Anfragen', zaehler: zahl('anfrage') },
              { wert: 'nachricht', label: 'Nachrichten', zaehler: zahl('nachricht') },
              { wert: 'freigabe', label: 'Freigaben', zaehler: zahl('freigabe') },
            ]}
          />
        )}
        <Liste
          leer={
            <Leer
              titel={eintraege.length ? 'Hier ist gerade nichts' : 'Alles erledigt'}
              text={eintraege.length ? 'Wähle oben „Alle“, um den ganzen Eingang zu sehen.' : 'Neue Anfragen, Nachrichten von Kunden und Freigaben landen hier – auch die aus deinem Anfrage-Postfach und der Online-Terminbuchung.'}
              icon="check"
            />
          }
        >
          {sichtbar.map((e) => (
            <EintragZeile key={e.schluessel} e={e} />
          ))}
        </Liste>
        <Postfach />
      </Stapel>
    </Seite>
  );
}

function EintragZeile({ e }: { e: EingangsEintrag }) {
  const navigate = useNavigate();
  const toast = useToast();
  const ausfuehren = () => {
    if (e.aktion.id) {
      try {
        const ziel = aktionAusfuehren(e.aktion.id, e.aktion.payload);
        if (ziel) return navigate(ziel);
        toast('Erledigt.');
        return;
      } catch {
        if (!e.aktion.pfad) return toast('Das hat nicht geklappt. Öffne den Eintrag und versuche es dort.', { ton: 'achtung' });
      }
    }
    if (e.aktion.pfad) navigate(e.aktion.pfad);
  };
  return (
    <ListenZeile
      links={<TypIcon name={ART_ICON[e.art]} label={ART_LABEL[e.art]} ton={ART_TON[e.art]} />}
      titel={
        <Zeile abstand={8}>
          <span>{e.titel}</span>
          {e.dringend && <Status ton="gefahr">Dringend</Status>}
        </Zeile>
      }
      untertitel={[ART_LABEL[e.art], e.kanal, relativ(e.zeit), e.text].filter(Boolean).join(' · ')}
      rechts={
        <Button klein variante="sekundaer" onClick={ausfuehren}>
          {e.aktion.label}
        </Button>
      }
    />
  );
}

function Postfach() {
  const toast = useToast();
  const adresse = anfragePostfach();
  const verbunden = cloudAktiv();
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(adresse);
      toast('Adresse kopiert. Richte bei deinem bisherigen Postfach eine Weiterleitung dorthin ein.');
    } catch {
      toast(`Kopieren nicht möglich. Deine Adresse: ${adresse}`, { ton: 'achtung' });
    }
  };
  return (
    <Karte titel="Anfrage-Postfach" icon="mail" kompakt aktion={verbunden ? <Status ton="erfolg">Bereit</Status> : <Status ton="neutral">Nach Verbinden aktiv</Status>}>
      <Stapel abstand={8}>
        <input className="mm-input" readOnly value={adresse} aria-label="Weiterleitungsadresse für Anfragen" onFocus={(ev) => ev.target.select()} />
        <Meta>
          {verbunden
            ? 'Leite Anfragen von deiner bisherigen Adresse hierhin weiter. Jede E-Mail wird eine Anfrage mit Kunde – bekannte Kunden erkennt Lotte wieder.'
            : 'Diese Adresse funktioniert, sobald Handwerk OS mit dem Server verbunden ist. Bis dahin nimmst du Anfragen unter „Anfragen“ auf.'}
        </Meta>
        <div>
          <Button klein variante="tertiaer" icon="mail" onClick={kopieren}>
            Adresse kopieren
          </Button>
        </div>
      </Stapel>
    </Karte>
  );
}

/** Zähler für die Navigation (Chef/Büro): nur neu rechnen, wenn sich Daten geändert haben */
const zwischenspeicher: { version?: number; ichId?: string; zahl: number } = { zahl: 0 };
function eingangsZahl(ich: Mitarbeiter, version: number): number {
  if (zwischenspeicher.version !== version || zwischenspeicher.ichId !== ich.id) Object.assign(zwischenspeicher, { version, ichId: ich.id, zahl: eingangsEintraege(ich).length });
  return zwischenspeicher.zahl;
}

export function useEingangsZahl(): number {
  useDatenstand();
  const ich = useIch();
  if (!ich || (ich.rolle !== 'chef' && ich.rolle !== 'buero')) return 0;
  return eingangsZahl(ich, getVersion());
}
