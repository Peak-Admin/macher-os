import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { euro } from '@core/format';
import { PHASEN } from '@core/objects';
import { Button, Filter, Leer, Meldung, Status, Tabelle, BeispielMarke } from '@ui/index';
import { stundenText } from './basis';
import { kostenUebersicht } from './daten';
import { GeldSeite, useBasis } from './gemeinsam';
import { KostenAuftrag } from './KostenAuftrag';

type Ansicht = 'laufend' | 'alle';
const OFFEN = ['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung'];

export function KostenListe() {
  const b = useBasis();
  const [ansicht, setAnsicht] = useState<Ansicht>('laufend');
  const alle = useMemo(() => kostenUebersicht(b), [b]);
  const phase = (id: string) => b.auftraege.find((a) => a.id === id)?.phase;
  const zeilen = ansicht === 'laufend' ? alle.filter((k) => OFFEN.includes(phase(k.auftragId) ?? '')) : alle;
  const ohneSatz = new Set(alle.flatMap((k) => k.ohneKostensatz));

  return (
    <GeldSeite titel="Kosten" untertitel="Was deine Aufträge tatsächlich kosten – aus Zeiten, verbrauchtem Material und Belegen.">
      {ohneSatz.size > 0 && (
        <Meldung ton="achtung" titel="Kostensatz fehlt">
          Bei {ohneSatz.size === 1 ? 'einem Mitarbeiter' : `${ohneSatz.size} Mitarbeitern`} mit gebuchten Zeiten ist kein Kostensatz hinterlegt. Trag ihn beim Mitarbeiter ein, sonst sind die Lohnkosten zu niedrig.
        </Meldung>
      )}
      <Filter
        label="Aufträge"
        wert={ansicht}
        onChange={setAnsicht}
        optionen={[
          { wert: 'laufend', label: 'Laufend', zaehler: alle.filter((k) => OFFEN.includes(phase(k.auftragId) ?? '')).length },
          { wert: 'alle', label: 'Alle', zaehler: alle.length },
        ]}
      />
      <Tabelle
        zeilen={zeilen}
        schluessel={(k) => k.auftragId}
        zeilenLink={(k) => `/betrieb/kosten/${k.auftragId}`}
        leer={
          <Leer
            titel={ansicht === 'laufend' ? 'Keine laufenden Aufträge mit Kosten' : 'Noch keine Kosten erfasst'}
            text="Kosten entstehen automatisch, sobald dein Team Zeiten auf Aufträge bucht, Material als verbraucht erfasst oder Belege einem Auftrag zuordnet."
            icon="euro"
            aktion={ansicht === 'laufend' && alle.length ? <Button variante="sekundaer" onClick={() => setAnsicht('alle')}>Alle Aufträge zeigen</Button> : undefined}
          />
        }
        spalten={[
          {
            titel: 'Auftrag',
            wert: (k) => {
              const a = b.auftraege.find((x) => x.id === k.auftragId)!;
              const kunde = b.kunden.find((x) => x.id === a.kundeId);
              return (
                <span>
                  <strong>{a.nummer}</strong> {a.titel} <BeispielMarke zeigen={a.beispiel} />
                  <br />
                  <span className="mm-meta">
                    {kunde?.name} · {PHASEN.find((p) => p.id === a.phase)?.label}
                  </span>
                </span>
              );
            },
            sortierWert: (k) => b.auftraege.find((x) => x.id === k.auftragId)?.nummer ?? '',
          },
          { titel: 'Stunden', zahl: true, nebensaechlich: true, wert: (k) => stundenText(k.minuten), sortierWert: (k) => k.minuten },
          { titel: 'Lohn', zahl: true, nebensaechlich: true, wert: (k) => euro(k.lohn), sortierWert: (k) => k.lohn },
          { titel: 'Material', zahl: true, nebensaechlich: true, wert: (k) => euro(k.material), sortierWert: (k) => k.material },
          { titel: 'Belege', zahl: true, nebensaechlich: true, wert: (k) => euro(k.belege), sortierWert: (k) => k.belege },
          { titel: 'Gesamt', zahl: true, wert: (k) => <strong>{euro(k.gesamt)}</strong>, sortierWert: (k) => k.gesamt },
          {
            titel: 'Hinweis',
            wert: (k) =>
              k.ohneKostensatz.length ? <Status ton="achtung">Kostensatz fehlt</Status> : k.unvollstaendig ? <Status ton="achtung">Zeit ohne Ende</Status> : k.laufend ? <Status ton="aktiv">Zeit läuft</Status> : null,
          },
        ]}
      />
    </GeldSeite>
  );
}

export function KostenDetail() {
  const { id = '' } = useParams();
  const a = db.auftraege.useOne(id);
  if (!a) {
    return (
      <GeldSeite titel="Auftrag nicht gefunden" zurueck={{ to: '/betrieb/kosten', label: 'Kosten' }}>
        <Leer titel="Diesen Auftrag gibt es nicht (mehr)" text="Vielleicht wurde er gelöscht. Zurück zur Übersicht." icon="achtung" />
      </GeldSeite>
    );
  }
  const akte = pfadZu({ typ: 'auftraege', id });
  return (
    <GeldSeite
      titel={`Kosten ${a.nummer}`}
      untertitel={`${a.titel} · ${db.kunden.get(a.kundeId)?.name ?? ''}`}
      zurueck={{ to: '/betrieb/kosten', label: 'Kosten' }}
      aktion={
        <Button variante="sekundaer" to={`/betrieb/nachkalkulation/${id}`}>
          Nachkalkulation
        </Button>
      }
      status={akte ? <Button variante="tertiaer" klein to={akte}>Zum Auftrag</Button> : undefined}
    >
      <KostenAuftrag id={id} />
    </GeldSeite>
  );
}
