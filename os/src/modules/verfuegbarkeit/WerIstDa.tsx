/** „Wer ist wann da?“ – Anwesenheit der Woche plus freie Zeit finden (z. B. während ein Kunde am Telefon ist). */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { datumKurz, heute, isoDatum, kalenderwoche, personName, plusTage, tage, uhrzeit, wochenStart, zahl } from '@core/format';
import { BUNDESLAENDER, STANDARD_ARBEITSTAGE } from '@core/kalender';
import { useDarf } from '@core/session';
import { Auswahl, Button, Checkbox, Dialog, IconButton, Karte, Leer, Liste, ListenZeile, Meta, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { useSchmal } from '../kalender/hooks';
import { TerminFormular, type TerminVorgabe } from '../kalender/TerminFormular';
import '../kalender/plan.css';
import { anwesenheit, freieSlots, geplanteStunden, kontextAusDb, type Anwesenheit, type Slot } from './daten';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const ton = (a: Anwesenheit) => (a.status === 'da' ? 'erfolg' : a.status === 'abwesend' ? 'achtung' : a.status === 'beantragt' ? 'aktiv' : 'neutral');

export function WerIstDa() {
  useDatenstand();
  const [sp, setSp] = useSearchParams();
  const schmal = useSchmal();
  const woche = wochenStart(sp.get('woche') ?? heute());
  const [tag, setTag] = useState(heute());
  const [einstellen, setEinstellen] = useState(false);
  const k = kontextAusDb();
  const mitarbeiter = k.mitarbeiter.filter((m) => m.aktiv);
  const sichtbar = tage(woche, plusTage(woche, 6)).filter((_, i) => k.arbeitstage.includes(i + 1) || i < 5);
  const darfPlanen = useDarf('planen');

  const geheZu = (w: string) => setSp(w === wochenStart(heute()) ? {} : { woche: w }, { replace: true });

  return (
    <Seite
      titel="Wer ist wann da?"
      untertitel={`Arbeitszeit ${k.arbeitsbeginn}–${k.arbeitsende} Uhr, ${k.arbeitstage.map((d) => WOCHENTAGE[d - 1]).join(', ')}. Urlaub, Krankheit und Berufsschule sind berücksichtigt.`}
      aktion={darfPlanen ? <Button variante="sekundaer" icon="einstellungen" onClick={() => setEinstellen(true)}>Arbeitstage & Feiertage</Button> : undefined}
      breit
    >
      {!mitarbeiter.length ? (
        <Leer titel="Noch kein Team angelegt" text="Leg Mitarbeiter an, dann siehst du hier, wer wann da ist." icon="team" />
      ) : schmal ? (
        <Stapel>
          <div className="pl-navi">
            <IconButton icon="pfeilLinks" label="Vortag" onClick={() => setTag(plusTage(tag, -1))} />
            <Button variante="tertiaer" onClick={() => setTag(heute())}>
              Heute
            </Button>
            <IconButton icon="pfeilRechts" label="Nächster Tag" onClick={() => setTag(plusTage(tag, 1))} />
            <span className="pl-zeitraum">{datumKurz(tag)}</span>
          </div>
          <Liste>
            {mitarbeiter.map((m) => {
              const a = anwesenheit(m.id, tag, k);
              const h = geplanteStunden(m.id, tag, tag, k);
              return <ListenZeile key={m.id} titel={personName(m)} untertitel={h ? `${zahl(h)} h verplant` : a.status === 'da' ? 'Noch nichts verplant' : undefined} rechts={<Status ton={ton(a)}>{a.text}</Status>} />;
            })}
          </Liste>
        </Stapel>
      ) : (
        <Stapel abstand={8}>
          <div className="pl-navi">
            <IconButton icon="pfeilLinks" label="Vorige Woche" onClick={() => geheZu(plusTage(woche, -7))} />
            <Button variante="tertiaer" onClick={() => geheZu(wochenStart(heute()))}>
              Diese Woche
            </Button>
            <IconButton icon="pfeilRechts" label="Nächste Woche" onClick={() => geheZu(plusTage(woche, 7))} />
            <span className="pl-zeitraum">
              KW {kalenderwoche(woche)} · {datumKurz(woche)} – {datumKurz(plusTage(woche, 6))}
            </span>
          </div>
          <div className="pl-tafel-rahmen">
            <div className="pl-tafel pl-anwesend" style={{ gridTemplateColumns: `200px repeat(${sichtbar.length}, minmax(110px, 1fr))` }}>
              <div className="pl-tafel-kopf">Mitarbeiter</div>
              {sichtbar.map((d) => (
                <div key={d} className={`pl-tafel-kopf ${d === heute() ? 'pl-tafel-kopf--heute' : ''}`}>
                  {datumKurz(d)}
                </div>
              ))}
              {mitarbeiter.map((m) => [
                <div key={m.id} className="pl-tafel-name">
                  <strong>{personName(m)}</strong>
                  <span className="mm-meta">{m.wochenstunden} h/Woche</span>
                </div>,
                ...sichtbar.map((d) => {
                  const a = anwesenheit(m.id, d, k);
                  const h = geplanteStunden(m.id, d, d, k);
                  return (
                    <div key={m.id + d} className={`pl-zelle ${a.status !== 'da' ? 'pl-zelle--abwesend' : ''}`} style={{ minHeight: 64 }}>
                      <Status ton={ton(a)}>{a.status === 'da' ? 'Da' : a.text}</Status>
                      {h > 0 && <span className="mm-meta">{zahl(h)} h verplant</span>}
                    </div>
                  );
                }),
              ])}
            </div>
          </div>
        </Stapel>
      )}

      {mitarbeiter.length > 0 && <FreieZeitFinden />}
      <ArbeitstageDialog offen={einstellen} onSchliessen={() => setEinstellen(false)} />
    </Seite>
  );
}

function FreieZeitFinden() {
  const [dauer, setDauer] = useState('60');
  const [ma, setMa] = useState('');
  const [ergebnis, setErgebnis] = useState<Slot[]>();
  const [vorgabe, setVorgabe] = useState<TerminVorgabe>();
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  const darfPlanen = useDarf('planen');

  const suchen = () =>
    setErgebnis(
      freieSlots({ von: heute(), bis: plusTage(heute(), 21), dauerMinuten: Number(dauer), mitarbeiterIds: ma ? [ma] : undefined, rasterMinuten: 30, max: 60 })
        // je Tag höchstens 2 Vorschläge, damit die Liste übersichtlich bleibt
        .filter((s, i, alle) => alle.slice(0, i).filter((x) => x.start.slice(0, 10) === s.start.slice(0, 10)).length < 2)
        .slice(0, 6),
    );

  return (
    <Karte titel="Freie Zeit finden" oberzeile="Für Rückfragen am Telefon">
      <Stapel>
        <div className="pl-kopfleiste">
          <Auswahl
            label="Dauer"
            value={dauer}
            onChange={(e) => setDauer(e.target.value)}
            optionen={[
              { wert: '30', label: '30 Minuten' },
              { wert: '60', label: '1 Stunde' },
              { wert: '90', label: '1,5 Stunden' },
              { wert: '120', label: '2 Stunden' },
              { wert: '240', label: 'Halber Tag (4 h)' },
              { wert: '480', label: 'Ganzer Tag (8 h)' },
            ]}
          />
          <Auswahl label="Wer" value={ma} onChange={(e) => setMa(e.target.value)} leer="Egal wer" optionen={mitarbeiter.map((m) => ({ wert: m.id, label: personName(m) }))} />
          <div>
            <Button icon="suche" onClick={suchen}>
              Freie Zeit suchen
            </Button>
          </div>
        </div>
        {ergebnis &&
          (ergebnis.length ? (
            <Liste>
              {ergebnis.map((s) => (
                <ListenZeile
                  key={s.start}
                  titel={`${datumKurz(s.start)}, ${uhrzeit(s.start)}–${uhrzeit(s.ende)} Uhr`}
                  untertitel={`Frei: ${s.mitarbeiterIds.map((id) => personName(db.mitarbeiter.get(id))).join(', ')}`}
                  rechts={
                    darfPlanen ? (
                      <Button
                        klein
                        variante="sekundaer"
                        onClick={() => setVorgabe({ datum: isoDatum(new Date(s.start)), von: uhrzeit(s.start), bis: uhrzeit(s.ende), mitarbeiterIds: s.mitarbeiterIds.slice(0, 1) })}
                      >
                        Termin anlegen
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </Liste>
          ) : (
            <Meta>In den nächsten 3 Wochen ist dafür niemand frei. Versuch es mit einer kürzeren Dauer.</Meta>
          ))}
      </Stapel>
      <TerminFormular offen={!!vorgabe} onSchliessen={() => setVorgabe(undefined)} vorgabe={vorgabe} />
    </Karte>
  );
}

function ArbeitstageDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const [arbeitstage, setArbeitstage] = useEinstellung<number[]>('plan.arbeitstage', STANDARD_ARBEITSTAGE);
  const [bundesland, setBundesland] = useEinstellung<string>('plan.bundesland', '');
  const toast = useToast();
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Arbeitstage & Feiertage" aktionen={<Button onClick={onSchliessen}>Fertig</Button>}>
      <Meta>An diesen Tagen plant Macher Einsätze und bietet Kunden Termine an. Gesetzliche Feiertage sind automatisch frei. Die Uhrzeiten stellst du in den Betriebs-Einstellungen ein.</Meta>
      <Auswahl
        label="Bundesland"
        hilfe="Für die Feiertage deines Landes, z. B. Fronleichnam oder Reformationstag."
        value={bundesland}
        leer="Nur bundesweite Feiertage"
        optionen={BUNDESLAENDER}
        onChange={(e) => {
          setBundesland(e.target.value);
          toast('Feiertage aktualisiert.');
        }}
      />
      <Zeile>
        {WOCHENTAGE.map((w, i) => (
          <Checkbox
            key={w}
            label={w}
            checked={arbeitstage.includes(i + 1)}
            onChange={(an) => {
              const neu = an ? [...arbeitstage, i + 1].sort() : arbeitstage.filter((x) => x !== i + 1);
              if (!neu.length) return toast('Mindestens ein Arbeitstag muss bleiben.', { ton: 'achtung' });
              setArbeitstage(neu);
            }}
          />
        ))}
      </Zeile>
    </Dialog>
  );
}
