/** Vorschläge für einen Auftrag mit Begründung – Bestätigen legt die Termine an. */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { adresseText, datumKurz, heute, uhrAus, zahl } from '@core/format';
import { BeispielMarke, Button, Eingabe, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, useToast, Zeile } from '@ui/index';
import { Personen } from '@ui/person';
import { finde, kontextAusDb } from './basis';
import { offeneStunden, vorschlaege, vorschlagKurz, vorschlagUebernehmen, type Vorschlag } from './daten';
import { benoetigteQualifikationen } from '../qualifikation-planung/daten';
import { terminPunkt } from '../fahrt/daten';

export function AuftragPlanen() {
  const { auftragId = '' } = useParams();
  const v = useDatenstand();
  const toast = useToast();
  const navigate = useNavigate();
  const [ab, setAb] = useState('');
  const [fehler, setFehler] = useState('');
  const ctx = useMemo(() => kontextAusDb(), [v]);
  const auftrag = finde(ctx.auftraege, auftragId);
  const ergebnis = useMemo(() => vorschlaege(ctx, auftragId, { ab: ab && ab >= ctx.heute ? ab : undefined }), [ctx, auftragId, ab]);

  if (!auftrag || auftrag.geloeschtAm)
    return (
      <Seite titel="Auftrag nicht gefunden" zurueck={{ to: '/plan/autoplanung', label: 'Automatische Planung' }}>
        <Leer titel="Diesen Auftrag gibt es nicht (mehr)." icon="auftraege" />
      </Seite>
    );

  const kunde = finde(ctx.kunden, auftrag.kundeId);
  const ziel = terminPunkt(ctx, { auftragId: auftrag.id });
  const quali = benoetigteQualifikationen(ctx, auftrag).map((q) => finde(ctx.qualifikationen, q)?.name);
  const offen = offeneStunden(ctx, auftrag);
  const auftragPfad = pfadZu({ typ: 'auftraege', id: auftrag.id });

  const uebernehmen = (vs: Vorschlag) => {
    const r = vorschlagUebernehmen(vs);
    if (!r.ok) {
      setFehler(r.grund);
      return;
    }
    setFehler('');
    erledigt('autoplanung.uebernommen', `Eingeplant: ${auftrag.titel}`, { text: vorschlagKurz(ctx, vs), bezug: { typ: 'auftraege', id: auftrag.id }, minuten: 10 });
    toast(r.termine.length === 1 ? 'Termin angelegt.' : `${r.termine.length} Termine angelegt.`, {
      aktion: {
        label: 'Rückgängig',
        onClick: () => r.termine.forEach((t) => db.termine.remove(t.id)),
      },
    });
    navigate(pfadZu({ typ: 'termine', id: r.termine[0].id }) ?? auftragPfad ?? '/plan/autoplanung');
  };

  return (
    <Seite
      titel={auftrag.titel}
      oberzeile={`Einplanen · ${auftrag.nummer}`}
      status={<BeispielMarke zeigen={auftrag.beispiel} />}
      zurueck={{ to: '/plan/autoplanung', label: 'Automatische Planung' }}
      untertitel={[kunde?.name, ziel ? adresseText(ziel.adresse) || ziel.label : undefined].filter(Boolean).join(' · ')}
    >
      <Stapel abstand={16}>
        <Karte kompakt>
          <Zeile abstand={16}>
            <Meta>Noch einzuplanen: {zahl(offen)} h</Meta>
            {auftrag.wunschtermin && <Meta>Kundenwunsch: {auftrag.wunschtermin}</Meta>}
            {quali.length > 0 && <Meta>Braucht: {quali.join(', ')}</Meta>}
            {auftrag.dringend && <Status ton="gefahr">Dringend</Status>}
          </Zeile>
        </Karte>
        <div style={{ maxWidth: 240 }}>
          <Eingabe label="Frühestens ab" type="date" min={heute()} value={ab} onChange={(e) => setAb(e.target.value)} optional />
        </div>
        {fehler && (
          <Meldung ton="achtung" titel="Nicht übernommen">
            {fehler}
          </Meldung>
        )}
        {ergebnis.hinweise.map((h) => (
          <Meldung key={h}>{h}</Meldung>
        ))}
        {ergebnis.vorschlaege.length === 0 ? (
          <Leer
            icon="kalender"
            titel={offen <= 0 ? 'Schon komplett eingeplant' : 'Kein passender Vorschlag'}
            text={offen <= 0 ? 'Alle geschätzten Stunden stehen schon in Terminen.' : 'Ändere das Startdatum oder plane von Hand.'}
            aktion={auftragPfad ? <Button variante="sekundaer" to={auftragPfad}>Auftrag öffnen</Button> : undefined}
          />
        ) : (
          ergebnis.vorschlaege.map((vs, i) => (
            <Karte
              key={i}
              oberzeile={i === 0 ? 'Bester Vorschlag' : `Alternative ${i}`}
              titel={<Personen ids={vs.mitarbeiterIds} groesse={32} namen />}
              aktion={<Status ton={vs.score >= 70 ? 'erfolg' : 'aktiv'}>{vs.score} / 100 Punkte</Status>}
            >
              <Stapel abstand={12}>
                <Stapel abstand={4}>
                  {vs.bloecke.map((b) => (
                    <Meta key={b.datum + b.von}>
                      {datumKurz(b.datum)}, {uhrAus(b.von)}–{uhrAus(b.bis)} Uhr
                    </Meta>
                  ))}
                </Stapel>
                <Stapel abstand={4}>
                  <strong>Warum?</strong>
                  {vs.gruende.slice(1).map((g) => (
                    <Meta key={g}>✓ {g}</Meta>
                  ))}
                  {vs.warnungen.map((w) => (
                    <Meta key={w}>! {w}</Meta>
                  ))}
                </Stapel>
                <div>
                  <Button variante={i === 0 ? 'primaer' : 'sekundaer'} icon="check" onClick={() => uebernehmen(vs)}>
                    {vs.bloecke.length === 1 ? 'Termin anlegen' : `${vs.bloecke.length} Termine anlegen`}
                  </Button>
                </div>
              </Stapel>
            </Karte>
          ))
        )}
      </Stapel>
    </Seite>
  );
}
