import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { adresseText, heute, personName, plusTage, uhrzeit, zeitpunkt } from '@core/format';
import { useIch } from '@core/session';
import type { ID } from '@core/objects';
import { naechsteArbeitstage } from '@core/kalender';
import { Button, Eingabe, FormRaster, Karte, Meldung, Meta, Segmente, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { AuftragAuswahl, MitarbeiterAuswahl } from '@ui/objekt';
import { abwesend, besichtigungPlanen, konflikte } from './daten';

const DAUER = [
  { wert: '30', label: '30 Min.' },
  { wert: '60', label: '1 Std.' },
  { wert: '90', label: '1,5 Std.' },
  { wert: '120', label: '2 Std.' },
];

export function BesichtigungPlanen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const ich = useIch();
  const [auftragId, setAuftragId] = useState<ID | undefined>(params.get('auftrag') ?? undefined);
  const [tag, setTag] = useState(() => naechsteArbeitstage(plusTage(heute(), 1), 1)[0] ?? plusTage(heute(), 1));
  const [uhr, setUhr] = useState('15:00');
  const [dauer, setDauer] = useState('60');
  const [wer, setWer] = useState<ID | undefined>(ich?.id);
  const [notiz, setNotiz] = useState('');
  const [fehler, setFehler] = useState<{ auftrag?: string; zeit?: string; wer?: string }>({});
  db.termine.use();

  const a = db.auftraege.get(auftragId);
  const kunde = db.kunden.get(a?.kundeId);
  const ort = db.orte.get(a?.ortId);
  let start = '';
  let ende = '';
  try {
    start = tag && uhr ? zeitpunkt(tag, uhr) : '';
    ende = start ? new Date(new Date(start).getTime() + Number(dauer) * 60_000).toISOString() : '';
  } catch {
    start = '';
  }
  const kollision = wer && start ? konflikte([wer], start, ende, db.termine.all()) : [];
  const weg = wer && tag ? abwesend(wer, tag) : false;

  const speichern = () => {
    const fe: typeof fehler = {};
    if (!auftragId) fe.auftrag = 'Wähle den Auftrag oder die Anfrage.';
    if (!start) fe.zeit = 'Datum und Uhrzeit fehlen.';
    if (!wer) fe.wer = 'Wer fährt hin?';
    setFehler(fe);
    if (fe.auftrag || fe.zeit || fe.wer) return;
    const t = besichtigungPlanen({ auftragId: auftragId!, start, ende, mitarbeiterIds: [wer!], notiz });
    toast('Besichtigung eingeplant.');
    navigate(`/auftraege/besichtigungen/${t.id}`, { replace: true });
  };

  return (
    <Seite titel="Besichtigung planen" zurueck={{ to: '/auftraege/besichtigungen', label: 'Besichtigungen' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <Stapel abstand={24}>
          <Karte titel="Wo?">
            <Stapel abstand={12}>
              <AuftragAuswahl wert={auftragId} onChange={(id) => setAuftragId(id || undefined)} label="Auftrag oder Anfrage" />
              {fehler.auftrag && <p className="mm-fehlertext" role="alert">{fehler.auftrag}</p>}
              {a && (
                <Meta>
                  {kunde?.name}
                  {ort ? ` · ${adresseText(ort.adresse)}` : ' · noch kein Einsatzort hinterlegt'}
                  {a.wunschtermin ? ` · Wunsch: ${a.wunschtermin}` : ''}
                </Meta>
              )}
            </Stapel>
          </Karte>
          <Karte titel="Wann und wer?">
            <Stapel>
              <FormRaster>
                <Eingabe label="Datum" type="date" value={tag} onChange={(e) => setTag(e.target.value)} fehler={fehler.zeit} />
                <Eingabe label="Uhrzeit" type="time" value={uhr} onChange={(e) => setUhr(e.target.value)} step={900} />
              </FormRaster>
              <Segmente label="Dauer" wert={dauer} onChange={setDauer} optionen={DAUER} />
              <MitarbeiterAuswahl label="Wer fährt hin?" wert={wer} onChange={setWer} />
              {fehler.wer && <p className="mm-fehlertext" role="alert">{fehler.wer}</p>}
              {weg && <Meldung ton="achtung">{personName(db.mitarbeiter.get(wer))} ist an dem Tag abwesend.</Meldung>}
              {kollision.length > 0 && (
                <Meldung ton="achtung" titel="Überschneidung">
                  {kollision.map((t) => `${uhrzeit(t.start)}–${uhrzeit(t.ende)} ${t.titel}`).join(' · ')}
                </Meldung>
              )}
              <Textfeld label="Notiz für vor Ort" value={notiz} onChange={(e) => setNotiz(e.target.value)} optional placeholder="z. B. Zählerschrank ansehen, Fotos vom Bad machen" />
            </Stapel>
          </Karte>
          <div>
            <Button type="submit" icon="kalender">
              Besichtigung einplanen
            </Button>
          </div>
        </Stapel>
      </form>
    </Seite>
  );
}
