import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { euro } from '@core/format';
import { BeispielMarke, Button, Filter, Karte, Leer, Liste, ListenZeile, Meldung, Stapel, Status, Tabelle, useToast } from '@ui/index';
import { prozentText, stundenText } from '../kosten/basis';
import { GeldSeite, useBasis } from '../kosten/gemeinsam';
import { KostenAuftrag } from '../kosten/KostenAuftrag';
import { LAUFEND, lerneffekte, lerneffektSatz, nachkalkulation, QUELLE_TEXT, type Lerneffekt, type Vergleich } from './daten';
import { kalkulationFuer } from './kalkulation';
import { useNachkalkulation } from './NachkalkulationKurz';
import { minutenAnpassen } from './aktionen';

type Ansicht = 'erledigt' | 'laufend';

export function NachkalkulationListe() {
  const b = useBasis();
  const [ansicht, setAnsicht] = useState<Ansicht>('erledigt');
  const alle = useMemo(
    () =>
      b.auftraege
        .filter((a) => a.phase === 'erledigt' || a.phase === 'abrechnung' || LAUFEND.includes(a.phase))
        .map((a) => ({ a, n: nachkalkulation(a, b, kalkulationFuer(a.id)) }))
        .filter(({ n }) => n.hatIst || n.hatSoll),
    [b],
  );
  const lernen = useMemo(() => lerneffekte(b), [b]);
  const erledigt = alle.filter(({ a }) => a.phase === 'erledigt' || a.phase === 'abrechnung');
  const laufend = alle.filter(({ a }) => LAUFEND.includes(a.phase));
  const zeilen = (ansicht === 'erledigt' ? erledigt : laufend).sort((x, y) => (y.a.abgeschlossenAm ?? y.a.geaendertAm).localeCompare(x.a.abgeschlossenAm ?? x.a.geaendertAm));

  return (
    <GeldSeite titel="Nachkalkulation" untertitel="Geplant gegen tatsächlich – und was du daraus für die nächste Kalkulation lernst.">
      <Stapel abstand={24}>
        <Lernen liste={lernen} />
        <div>
          <Filter
            label="Aufträge"
            wert={ansicht}
            onChange={setAnsicht}
            optionen={[
              { wert: 'erledigt', label: 'Abgeschlossen', zaehler: erledigt.length },
              { wert: 'laufend', label: 'Laufend', zaehler: laufend.length },
            ]}
          />
        </div>
        <Tabelle
          zeilen={zeilen}
          schluessel={(z) => z.a.id}
          zeilenLink={(z) => `/betrieb/nachkalkulation/${z.a.id}`}
          leer={
            <Leer skizze
              titel={ansicht === 'erledigt' ? 'Noch keine abgeschlossenen Aufträge mit Daten' : 'Keine laufenden Aufträge mit Daten'}
              text="Für eine Nachkalkulation braucht es ein Soll (angenommenes Angebot oder geplante Stunden) und gebuchte Zeiten, Material oder Belege."
              icon="diagramm"
            />
          }
          spalten={[
            {
              titel: 'Auftrag',
              wert: ({ a }) => (
                <span>
                  <strong>{a.nummer}</strong> {a.titel} <BeispielMarke zeigen={a.beispiel} />
                  <br />
                  <span className="mm-meta">{b.kunden.find((k) => k.id === a.kundeId)?.name}</span>
                </span>
              ),
              sortierWert: ({ a }) => a.nummer,
            },
            { titel: 'Stunden Soll', zahl: true, nebensaechlich: true, wert: ({ n }) => (n.soll.minuten != null ? stundenText(n.soll.minuten) : '–') },
            { titel: 'Stunden Ist', zahl: true, wert: ({ n }) => stundenText(n.ist.minuten), sortierWert: ({ n }) => n.ist.minuten },
            { titel: 'Kosten Soll', zahl: true, nebensaechlich: true, wert: ({ n }) => euro(n.soll.kosten) },
            { titel: 'Kosten Ist', zahl: true, nebensaechlich: true, wert: ({ n }) => euro(n.ist.gesamt), sortierWert: ({ n }) => n.ist.gesamt },
            { titel: 'Ergebnis', wert: ({ n }) => <Status ton={n.bewertung.ton}>{n.bewertung.text}</Status> },
          ]}
        />
      </Stapel>
    </GeldSeite>
  );
}

function Lernen({ liste }: { liste: Lerneffekt[] }) {
  const toast = useToast();
  if (!liste.length) {
    return (
      <Meldung titel="Daraus lernen">
        Sobald mindestens zwei abgeschlossene Aufträge mit derselben Leistung vorliegen, zeigt Lotte hier, welche Leistungen regelmäßig länger oder kürzer dauern als kalkuliert.
      </Meldung>
    );
  }
  return (
    <Karte titel="Daraus lernen" icon="wissen" oberzeile="Aus abgeschlossenen Aufträgen">
      <Liste>
        {liste.map((l) => (
          <ListenZeile
            key={l.leistungId}
            titel={lerneffektSatz(l)}
            untertitel={`Aus ${l.auftraege} Aufträgen: kalkuliert ${l.minutenAlt} min je Einheit, tatsächlich etwa ${l.minutenNeu} min. Geschätzt aus der Gesamtzeit der Aufträge.`}
            rechts={
              <Button
                klein
                variante="sekundaer"
                onClick={() => {
                  minutenAnpassen({ leistungId: l.leistungId, minuten: l.minutenNeu });
                  toast(`„${l.name}“ ist jetzt mit ${l.minutenNeu} min kalkuliert.`);
                }}
              >
                Auf {l.minutenNeu} min anpassen
              </Button>
            }
          />
        ))}
      </Liste>
    </Karte>
  );
}

function wert(v: Vergleich, x: number | undefined) {
  if (x == null) return '–';
  return v.bereich === 'stunden' ? stundenText(x) : euro(x);
}

export function NachkalkulationDetail() {
  const { id = '' } = useParams();
  const a = db.auftraege.useOne(id);
  const n = useNachkalkulation(id);
  if (!a || !n) {
    return (
      <GeldSeite titel="Auftrag nicht gefunden" zurueck={{ to: '/betrieb/nachkalkulation', label: 'Nachkalkulation' }}>
        <Leer titel="Diesen Auftrag gibt es nicht (mehr)" text="Vielleicht wurde er gelöscht." icon="achtung" />
      </GeldSeite>
    );
  }
  const akte = pfadZu({ typ: 'auftraege', id });
  const s = n.soll;
  return (
    <GeldSeite
      titel={`Nachkalkulation ${a.nummer}`}
      untertitel={`${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? ''}`}
      zurueck={{ to: '/betrieb/nachkalkulation', label: 'Nachkalkulation' }}
      status={<Status ton={n.bewertung.ton}>{n.bewertung.text}</Status>}
      aktion={akte ? <Button variante="sekundaer" to={akte}>Zum Auftrag</Button> : undefined}
    >
      <Stapel abstand={24}>
        {!n.hatIst && !n.hatSoll ? (
          <Leer skizze titel="Noch keine Daten" text="Es fehlen sowohl ein Soll (angenommenes Angebot oder geplante Stunden) als auch gebuchte Zeiten, Material oder Belege." icon="diagramm" />
        ) : (
          <>
            <Karte titel="Was ist passiert" icon="diagramm">
              <Stapel abstand={8}>
                {n.saetze.length ? n.saetze.map((t) => <p key={t} style={{ margin: 0 }}>{t}</p>) : <p style={{ margin: 0 }}>Noch keine Ist-Daten. Sobald Zeiten gebucht sind, erscheint hier der Vergleich.</p>}
              </Stapel>
            </Karte>
            <Tabelle
              zeilen={n.vergleiche}
              schluessel={(v) => v.bereich}
              spalten={[
                { titel: 'Bereich', wert: (v) => v.titel },
                { titel: 'Soll', zahl: true, wert: (v) => (v.soll == null ? 'kein Soll' : wert(v, v.soll)) },
                { titel: 'Ist', zahl: true, wert: (v) => wert(v, v.ist) },
                {
                  titel: 'Abweichung',
                  zahl: true,
                  wert: (v) =>
                    v.abweichung == null ? '–' : <Status ton={v.abweichung > 0.1 ? 'achtung' : v.abweichung < -0.1 ? 'erfolg' : 'neutral'}>{prozentText(v.abweichung)}</Status>,
                },
              ]}
            />
            <Meldung titel="Grundlage">
              Soll-Stunden {s.minutenQuelle ? QUELLE_TEXT[s.minutenQuelle] : '– keine hinterlegt'}. Soll-Material {s.materialQuelle ? QUELLE_TEXT[s.materialQuelle] : '– keins hinterlegt'}. Soll-Kosten{' '}
              {s.kostenQuelle ? QUELLE_TEXT[s.kostenQuelle] : '– nicht berechenbar'}. Ist: gebuchte Zeiten × Kostensatz, verbrauchtes Material zum EK und zugeordnete Belege (netto).
              {s.umsatz != null && ` Angebot: ${euro(s.umsatz)} netto.`}
            </Meldung>
          </>
        )}
        <KostenAuftrag id={id} />
      </Stapel>
    </GeldSeite>
  );
}
