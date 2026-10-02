import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { euro, summen } from '@core/format';
import type { RechnungsArt } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Eingabe, Karte, Leer, Meldung, Meta, Schalter, Segmente, Seite, Stapel, useToast } from '@ui/index';
import { AuftragAuswahl, KundeAuswahl } from '@ui/objekt';
import { angenommenesAngebot, freieRechnung, gueltigeRechnungen, rechnungErstellen, rechnungsVorschau, ART_LABEL } from './logik';
import { KeinZugriff } from './RechnungenListe';

export function RechnungNeu() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const darf = useDarf('geld');
  const [modus, setModus] = useState<'auftrag' | 'frei'>(params.get('kunde') ? 'frei' : 'auftrag');
  const [auftragId, setAuftragId] = useState(params.get('auftrag') ?? '');
  const [kundeId, setKundeId] = useState(params.get('kunde') ?? '');
  const [art, setArt] = useState<RechnungsArt>((params.get('art') as RechnungsArt) || 'rechnung');
  const [prozent, setProzent] = useState(String(einstellung('rechnungen.abschlagProzent', 30)));
  const [aufwand, setAufwand] = useState<boolean | undefined>(undefined);
  const [fehler, setFehler] = useState<string>();
  db.auftraege.use();
  db.rechnungen.use();
  if (!darf) return <KeinZugriff />;

  const angebot = auftragId ? angenommenesAngebot(auftragId) : undefined;
  const nachAufwand = aufwand ?? !angebot;
  const v = auftragId ? rechnungsVorschau(auftragId, art, { nachAufwand, prozent: Number(prozent.replace(',', '.')) || 0 }) : undefined;
  const betriebUst = db.betrieb.get('betrieb')?.ustSatz ?? 19;
  const bisher = auftragId ? gueltigeRechnungen(auftragId) : [];

  const erstellen = () => {
    if (modus === 'frei') {
      if (!kundeId) return setFehler('Wähle einen Kunden.');
      const r = freieRechnung(kundeId);
      toast('Rechnungsentwurf angelegt.');
      return navigate(`/betrieb/rechnungen/${r.id}`, { replace: true });
    }
    if (!auftragId) return setFehler('Wähle einen Auftrag.');
    const r = rechnungErstellen(auftragId, art, { nachAufwand, prozent: Number(prozent.replace(',', '.')) || 0 });
    if (!r) return setFehler('Den Auftrag gibt es nicht mehr.');
    toast(`${ART_LABEL[art]} als Entwurf angelegt.`);
    navigate(`/betrieb/rechnungen/${r.id}`, { replace: true });
  };

  return (
    <Seite titel="Rechnung schreiben" zurueck={{ to: '/betrieb/rechnungen', label: 'Rechnungen' }}>
      <Karte>
        <Stapel abstand={24}>
          <Segmente
            label="Wofür?"
            wert={modus}
            onChange={(m) => {
              setModus(m);
              setFehler(undefined);
            }}
            optionen={[
              { wert: 'auftrag', label: 'Aus einem Auftrag' },
              { wert: 'frei', label: 'Freie Rechnung' },
            ]}
          />
          {modus === 'frei' ? (
            <KundeAuswahl wert={kundeId} onChange={(id) => (setKundeId(id), setFehler(undefined))} />
          ) : (
            <>
              <AuftragAuswahl wert={auftragId} onChange={(id) => (setAuftragId(id), setAufwand(undefined), setFehler(undefined))} nurOffene={false} />
              <Segmente
                label="Art der Rechnung"
                wert={art}
                onChange={setArt}
                optionen={[
                  { wert: 'rechnung', label: 'Rechnung' },
                  { wert: 'abschlag', label: 'Abschlag' },
                  { wert: 'teil', label: 'Teilrechnung' },
                  { wert: 'schluss', label: 'Schlussrechnung' },
                ]}
              />
              {art === 'abschlag' && (
                <Eingabe label="Abschlag in Prozent der Angebotssumme" inputMode="decimal" value={prozent} onChange={(e) => setProzent(e.target.value)} hilfe={angebot ? `Angebot ${angebot.nummer}: ${euro(summen(angebot.positionen, 0, angebot.rabattProzent ?? 0).netto)} netto` : 'Kein angenommenes Angebot – den Betrag trägst du im Entwurf ein.'} />
              )}
              {art !== 'abschlag' && angebot && (
                <Schalter
                  label="Nach Aufwand abrechnen"
                  beschreibung={`Statt der Positionen aus Angebot ${angebot.nummer} werden Zeiten × Stundensatz und Material abgerechnet.`}
                  checked={nachAufwand}
                  onChange={setAufwand}
                />
              )}
            </>
          )}
          {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
          {v && (
            <Karte titel="Das übernimmt Macher" kompakt>
              <Stapel abstand={8}>
                {v.quellen.length ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {v.quellen.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                ) : null}
                <Meta>
                  {v.positionen.length === 1 ? '1 Position' : `${v.positionen.length} Positionen`} · {euro(summen(v.positionen, betriebUst).netto)} netto
                </Meta>
                {bisher.length > 0 && <Meta>Bisher zu diesem Auftrag: {bisher.map((r) => r.nummer || `Entwurf (${ART_LABEL[r.art]})`).join(', ')}</Meta>}
                {v.hinweise.map((h) => (
                  <Meldung key={h} ton="neutral">
                    {h}
                  </Meldung>
                ))}
              </Stapel>
            </Karte>
          )}
          {modus === 'auftrag' && !db.auftraege.all().length ? (
            <Leer titel="Noch keine Aufträge" text="Lege zuerst einen Auftrag an oder schreib eine freie Rechnung." icon="auftraege" />
          ) : null}
          <div>
            <Button onClick={erstellen}>Entwurf erstellen</Button>
          </div>
        </Stapel>
      </Karte>
    </Seite>
  );
}
