import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { passt, zahl } from '@core/format';
import type { ID } from '@core/objects';
import { BeispielMarke, Button, Filter, Leer, Liste, ListenZeile, Meldung, Seite, Stapel, Status, Suchfeld, Zeile } from '@ui/index';
import { BuchenDialog } from './BuchenDialog';
import { artikelAmOrt, bestandJeOrt, bewegungenNachArtikel, lagerorte, lagerortName, unterMindestbestand, type LagerortId } from './daten';

export function LagerBestand() {
  useDatenstand();
  const [params, setParams] = useSearchParams();
  const orte = lagerorte();
  const ortParam = params.get('ort');
  const ort: LagerortId | 'alle' = ortParam && orte.some((o) => o.id === ortParam) ? ortParam : 'alle';
  const [q, setQ] = useState('');
  const [buchen, setBuchen] = useState<{ artikelId?: ID } | null>(null);
  const nach = bewegungenNachArtikel();
  const liste = artikelAmOrt(ort)
    .filter((a) => !q || passt(q, a.name, a.nummer, a.ean, a.kategorie))
    .map((a) => ({ a, je: bestandJeOrt(a, nach.get(a.id) ?? []) }))
    .sort((x, y) => Number(unterMindestbestand(y.a)) - Number(unterMindestbestand(x.a)) || x.a.name.localeCompare(y.a.name, 'de'));
  const unter = db.artikel.where(unterMindestbestand);
  const hatLager = artikelAmOrt('alle').length > 0;

  return (
    <Seite
      titel="Lager"
      aktion={
        <Button icon="liste" to={`/betrieb/lager/inventur${ort !== 'alle' ? `?ort=${encodeURIComponent(ort)}` : ''}`}>
          Inventur starten
        </Button>
      }
    >
      <BuchenDialog offen={!!buchen} onSchliessen={() => setBuchen(null)} artikelId={buchen?.artikelId} ort={ort !== 'alle' ? ort : undefined} />
      <Stapel>
        {unter.length > 0 && (
          <Meldung ton="achtung" titel={`${unter.length} ${unter.length === 1 ? 'Artikel' : 'Artikel'} unter Mindestbestand`} aktion={<Button klein variante="sekundaer" to="/betrieb/bedarf">Zum Bedarf</Button>}>
            Macher rechnet die Nachbestellung im Bedarf mit ein.
          </Meldung>
        )}
        <Zeile zwischen>
          <Filter
            label="Lagerort"
            wert={ort}
            onChange={(o) => setParams(o === 'alle' ? {} : { ort: o }, { replace: true })}
            optionen={[{ wert: 'alle' as string, label: 'Alle Lagerorte' }, ...orte.map((o) => ({ wert: o.id, label: o.name }))]}
          />
          <Zeile>
            <Button variante="sekundaer" icon="plus" onClick={() => setBuchen({})}>
              Material buchen
            </Button>
            <Button variante="tertiaer" to="/betrieb/lager/bewegungen">
              Bewegungen
            </Button>
          </Zeile>
        </Zeile>
        {hatLager && <Suchfeld wert={q} onChange={setQ} platzhalter="Artikel, Nummer, EAN …" />}
        <Liste
          leer={
            !hatLager ? (
              <Leer titel="Noch kein Lagerbestand" text="Buche einen Zugang oder trag beim Artikel einen Bestand ein. Dann siehst du hier, was im Hauptlager und in jedem Fahrzeug liegt." icon="lager" aktion={<Button onClick={() => setBuchen({})}>Zugang buchen</Button>} />
            ) : q ? (
              <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es nichts im Lager." icon="suche" />
            ) : (
              <Leer titel={`Im ${lagerortName(ort)} liegt nichts`} text="Buche Material per Umbuchung hierher oder zähle bei der Inventur, was wirklich da ist." icon="lager" aktion={<Button variante="sekundaer" onClick={() => setBuchen({})}>Material buchen</Button>} />
            )
          }
        >
          {liste.map(({ a, je }) => {
            const menge = ort === 'alle' ? (a.bestand ?? 0) : (je[ort] ?? 0);
            const aufteilung = Object.entries(je)
              .map(([o, m]) => `${lagerortName(o)} ${zahl(m)}`)
              .join(' · ');
            return (
              <ListenZeile
                key={a.id}
                onClick={() => setBuchen({ artikelId: a.id })}
                titel={
                  <>
                    {a.name} <BeispielMarke zeigen={a.beispiel} />
                  </>
                }
                untertitel={[a.nummer, ort === 'alle' ? aufteilung : null, a.mindestbestand ? `Mindestbestand ${zahl(a.mindestbestand)}` : null].filter(Boolean).join(' · ')}
                rechts={
                  <Zeile abstand={8}>
                    {unterMindestbestand(a) && <Status ton="achtung">Nachbestellen</Status>}
                    {menge < 0 && <Status ton="achtung">Bestand prüfen</Status>}
                    <strong className="mm-number">
                      {zahl(menge)} {a.einheit}
                    </strong>
                  </Zeile>
                }
              />
            );
          })}
        </Liste>
      </Stapel>
    </Seite>
  );
}
