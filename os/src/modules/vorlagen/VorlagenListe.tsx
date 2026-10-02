import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { passt } from '@core/format';
import { useDarf } from '@core/session';
import { Abschnitt, Auswahl, Button, Dialog, Eingabe, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Suchfeld, useToast, briefkopf } from '@ui/index';
import { VORLAGEN_ARTEN, vorlagen, type VorlagenArt } from './daten';

export function VorlagenListe() {
  const navigate = useNavigate();
  const toast = useToast();
  const schreiben = useDarf('schreiben');
  const [q, setQ] = useState('');
  const [neu, setNeu] = useState(false);
  const [titel, setTitel] = useState('');
  const [art, setArt] = useState<VorlagenArt>('email');
  const [fehler, setFehler] = useState<string>();
  const alle = vorlagen.use((v) => !q || passt(q, v.titel, v.betreff, v.text), [q]);
  const kopf = briefkopf();

  const anlegen = () => {
    if (!titel.trim()) return setFehler('Gib der Vorlage einen Namen.');
    const v = vorlagen.create({ schluessel: `eigene.${Date.now().toString(36)}`, art, titel: titel.trim(), betreff: VORLAGEN_ARTEN.find((a) => a.id === art)?.mitBetreff ? '' : undefined, text: '{anrede},\n\n\n\nViele Grüße\n{betrieb}' });
    toast('Vorlage angelegt.');
    navigate(`/betrieb/vorlagen/${v.id}`);
  };

  return (
    <Seite
      titel="Vorlagen & Formulare"
      untertitel="Texte, die du immer wieder brauchst – Macher setzt Kunde, Betrag und Termin automatisch ein."
      aktion={schreiben ? <Button icon="plus" onClick={() => (setNeu(true), setTitel(''), setFehler(undefined))}>Vorlage anlegen</Button> : undefined}
    >
      <Stapel abstand={24}>
        <Karte
          titel="Briefkopf"
          oberzeile="Für Angebote und Rechnungen"
          to="/betrieb/vorlagen/briefkopf"
        >
          <Meta>{kopf.logo ? 'Mit Logo' : 'Noch ohne Logo'} · {kopf.fusszeilen.length ? kopf.fusszeilen.slice(0, 2).join(' · ') : 'Betriebsdaten fehlen noch'}</Meta>
        </Karte>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Vorlage suchen …" />
        {!alle.length ? (
          q ? (
            <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es keine Vorlage." icon="suche" />
          ) : (
            <Leer titel="Noch keine Vorlagen" text="Lege deine erste Vorlage an, z. B. für die Terminbestätigung." icon="dokument" aktion={schreiben ? <Button onClick={() => setNeu(true)}>Vorlage anlegen</Button> : undefined} />
          )
        ) : (
          VORLAGEN_ARTEN.map((a) => {
            const liste = alle.filter((v) => v.art === a.id).sort((x, y) => x.titel.localeCompare(y.titel, 'de'));
            if (!liste.length) return null;
            return (
              <Abschnitt key={a.id} titel={a.label}>
                <Liste>
                  {liste.map((v) => (
                    <ListenZeile key={v.id} to={`/betrieb/vorlagen/${v.id}`} titel={v.titel} untertitel={(v.betreff || v.text).replace(/\s+/g, ' ').slice(0, 90)} />
                  ))}
                </Liste>
              </Abschnitt>
            );
          })
        )}
      </Stapel>
      <Dialog
        offen={neu}
        onSchliessen={() => setNeu(false)}
        titel="Vorlage anlegen"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setNeu(false)}>
              Abbrechen
            </Button>
            <Button onClick={anlegen}>Vorlage anlegen</Button>
          </>
        }
      >
        <Stapel>
          <Eingabe label="Name" value={titel} onChange={(e) => setTitel(e.target.value)} fehler={fehler} placeholder="z. B. Absage Termin" autoFocus />
          <Auswahl label="Wofür?" value={art} onChange={(e) => setArt(e.target.value as VorlagenArt)} optionen={VORLAGEN_ARTEN.map((a) => ({ wert: a.id, label: a.label }))} />
        </Stapel>
      </Dialog>
    </Seite>
  );
}
