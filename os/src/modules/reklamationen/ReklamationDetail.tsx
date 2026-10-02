import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { datum, heute, relativ } from '@core/format';
import { PHASEN } from '@core/objects';
import { Auswahl, BeispielMarke, Button, Dialog, Eingabe, FormRaster, Karte, Leer, Meta, Seite, Segmente, Stapel, Status, Textfeld, Zeile, ZweiSpalten, useToast, DateiKnopf } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { BEWERTUNG_TEXT, fotosZu, GRUNDLAGEN, nacharbeitAnlegen, offen, pruefen, reklamationen, reklamationErledigen, type Bewertung, type Grundlage } from './daten';
import { Pruefbox } from './Pruefbox';
import { ReklamationStatus } from './ReklamationListe';
import { fotosSpeichern } from './ReklamationNeu';

const PHASE = Object.fromEntries(PHASEN.map((p) => [p.id, p.label])) as Record<string, string>;

export function ReklamationDetail() {
  useDatenstand();
  const { id = '' } = useParams();
  const r = reklamationen.useOne(id);
  const toast = useToast();
  const navigate = useNavigate();
  const [ablehnen, setAblehnen] = useState(false);
  const [grund, setGrund] = useState('');
  const [laedt, setLaedt] = useState(false);

  if (!r || r.geloeschtAm)
    return (
      <Seite titel="Reklamation nicht gefunden" zurueck={{ to: '/auftraege/reklamationen', label: 'Reklamationen' }}>
        <Leer titel="Diese Reklamation gibt es nicht (mehr)." icon="schild" aktion={<Button to="/auftraege/reklamationen">Zur Übersicht</Button>} />
      </Seite>
    );

  const p = pruefen(r);
  const kunde = db.kunden.get(r.kundeId);
  const ursprung = db.auftraege.get(r.auftragId);
  const anlage = db.anlagen.get(r.anlageId);
  const nacharbeit = db.auftraege.get(r.nacharbeitAuftragId);
  const nacharbeitTermin = nacharbeit ? db.termine.where((t) => t.auftragId === nacharbeit.id && t.status !== 'abgesagt').sort((a, b) => a.start.localeCompare(b.start))[0] : undefined;
  const fotos = fotosZu(r.id);
  const istOffen = offen(r);
  const aendern = (patch: Partial<typeof r>, text?: string) => reklamationen.update(r.id, patch, { text });

  const fotoHinzu = async (dateien: File[]) => {
    if (!dateien.length) return;
    setLaedt(true);
    try {
      await fotosSpeichern(dateien, r.id, r.nacharbeitAuftragId ?? r.auftragId, r.beispiel);
      toast(dateien.length === 1 ? 'Foto gespeichert.' : `${dateien.length} Fotos gespeichert.`);
    } catch {
      toast('Foto konnte nicht gespeichert werden.', { ton: 'achtung' });
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Seite
      titel={r.titel}
      oberzeile={r.nummer}
      status={
        <>
          <ReklamationStatus r={r} />
          <BeispielMarke zeigen={r.beispiel} />
        </>
      }
      untertitel={
        <>
          {kunde ? <ObjektLink bezug={{ typ: 'kunden', id: kunde.id }}>{kunde.name}</ObjektLink> : 'Kunde fehlt'} · gemeldet {relativ(r.gemeldetAm)}
        </>
      }
      zurueck={{ to: '/auftraege/reklamationen', label: 'Reklamationen' }}
      aktion={
        istOffen ? (
          <Button
            icon="check"
            onClick={() => {
              reklamationErledigen(r.id);
              toast('Reklamation erledigt.');
            }}
          >
            Als erledigt markieren
          </Button>
        ) : undefined
      }
    >
      <ZweiSpalten
        haupt={
          <>
            <Karte titel="Gewährleistung">
              <Stapel abstand={16}>
                <Pruefbox p={p} />
                <Segmente
                  label="Entscheidung"
                  wert={r.bewertung}
                  onChange={(v: Bewertung) => {
                    aendern({ bewertung: v }, `Entscheidung: ${BEWERTUNG_TEXT[v]}`);
                    toast(`Entscheidung: ${BEWERTUNG_TEXT[v]}.`);
                  }}
                  optionen={(['gewaehrleistung', 'kostenpflichtig', 'kulanz', 'offen'] as Bewertung[]).map((b) => ({ wert: b, label: BEWERTUNG_TEXT[b] }))}
                />
                <FormRaster>
                  <Auswahl label="Grundlage" value={r.grundlage} onChange={(e) => aendern({ grundlage: e.target.value as Grundlage })} optionen={GRUNDLAGEN.map((g) => ({ wert: g.wert, label: `${g.label} (${g.jahre} Jahre)` }))} />
                  <Eingabe label="Abnahme / Abschluss am" type="date" value={r.abnahmeAm ?? p.ab ?? ''} onChange={(e) => aendern({ abnahmeAm: e.target.value || undefined })} />
                  <Eingabe label="Frist zur Beseitigung bis" type="date" value={r.fristBis ?? ''} onChange={(e) => aendern({ fristBis: e.target.value || undefined })} disabled={!istOffen} />
                </FormRaster>
                {p.ergebnis !== 'unklar' && r.bewertung !== p.ergebnis && r.bewertung !== 'kulanz' && (
                  <Meta>Hinweis: Deine Entscheidung weicht von der Prüfung ab ({BEWERTUNG_TEXT[p.ergebnis]}).</Meta>
                )}
              </Stapel>
            </Karte>

            <Karte titel="Nacharbeit">
              {nacharbeit ? (
                <Stapel abstand={12}>
                  <Zeile zwischen>
                    <ObjektLink bezug={{ typ: 'auftraege', id: nacharbeit.id }}>{`${nacharbeit.nummer} · ${nacharbeit.titel}`}</ObjektLink>
                    <Status ton={nacharbeit.phase === 'erledigt' ? 'erfolg' : 'aktiv'}>{PHASE[nacharbeit.phase]}</Status>
                  </Zeile>
                  <Meta>{nacharbeitTermin ? `Termin: ${datum(nacharbeitTermin.start)}` : 'Noch kein Termin.'}</Meta>
                  {istOffen && (
                    <Zeile>
                      {!nacharbeitTermin && aktionVorhanden('plan.einplanen') && (
                        <Button klein variante="sekundaer" icon="kalender" onClick={() => {
                          const z = aktionAusfuehren('plan.einplanen', { auftragId: nacharbeit.id });
                          if (z) navigate(z);
                        }}>
                          Einplanen
                        </Button>
                      )}
                      {r.bewertung === 'kostenpflichtig' && aktionVorhanden('angebot.erstellen') && (
                        <Button klein variante="sekundaer" onClick={() => {
                          const z = aktionAusfuehren('angebot.erstellen', { auftragId: nacharbeit.id });
                          if (z) navigate(z);
                        }}>
                          Angebot erstellen
                        </Button>
                      )}
                    </Zeile>
                  )}
                </Stapel>
              ) : istOffen ? (
                <Stapel abstand={12}>
                  <Meta>{r.bewertung === 'offen' ? 'Erst entscheiden, dann legt Macher den Nacharbeitsauftrag an.' : 'Noch kein Nacharbeitsauftrag.'}</Meta>
                  <div>
                    <Button
                      variante="sekundaer"
                      icon="plus"
                      onClick={() => {
                        const a = nacharbeitAnlegen(r.id);
                        if (!a) return;
                        toast(`Nacharbeitsauftrag ${a.nummer} angelegt.`);
                      }}
                    >
                      Nacharbeitsauftrag anlegen
                    </Button>
                  </div>
                </Stapel>
              ) : (
                <Meta>Keine Nacharbeit.</Meta>
              )}
            </Karte>

            <Karte titel="Fotos" aktion={<Meta>{fotos.length ? `${fotos.length}` : ''}</Meta>}>
              <Stapel abstand={12}>
                {fotos.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {fotos.map((d) => (
                      <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
                        <img src={d.url} alt={d.titel} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--mm-radius-control, 4px)', display: 'block' }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <Meta>Noch keine Fotos. Fotos sichern dich ab, wenn es später Streit gibt.</Meta>
                )}
                <div>
                  <DateiKnopf accept="image/*" kamera mehrfach onDateien={fotoHinzu} laedt={laedt} laedtText="Wird gespeichert …">
                    Foto hinzufügen
                  </DateiKnopf>
                </div>
              </Stapel>
            </Karte>

            {r.beschreibung && (
              <Karte titel="Beschreibung">
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.beschreibung}</p>
              </Karte>
            )}

            <Karte titel="Verlauf">
              <Zeitstrahl bezug={{ typ: 'reklamationen', id: r.id }} max={10} />
            </Karte>
          </>
        }
        seite={
          <>
            <Karte titel="Bezug" kompakt>
              <Stapel abstand={8}>
                <Meta>Gemeldet: {datum(r.gemeldetAm)}</Meta>
                {r.fristBis && <Meta>Frist: {relativ(r.fristBis) === datum(r.fristBis) ? datum(r.fristBis) : `${datum(r.fristBis)} (${relativ(r.fristBis)})`}</Meta>}
                {ursprung && (
                  <Meta>
                    Auftrag: <ObjektLink bezug={{ typ: 'auftraege', id: ursprung.id }}>{`${ursprung.nummer} · ${ursprung.titel}`}</ObjektLink>
                  </Meta>
                )}
                {anlage && (
                  <Meta>
                    Anlage: <ObjektLink bezug={{ typ: 'anlagen', id: anlage.id }}>{anlage.typ}</ObjektLink>
                  </Meta>
                )}
                {r.erledigtAm && <Meta>Erledigt: {datum(r.erledigtAm)}</Meta>}
                {r.grund && <Meta>Abgelehnt: {r.grund}</Meta>}
              </Stapel>
            </Karte>
            {istOffen && (
              <div>
                <Button variante="tertiaer" onClick={() => setAblehnen(true)}>Reklamation ablehnen</Button>
              </div>
            )}
          </>
        }
      />
      <Dialog
        offen={ablehnen}
        onSchliessen={() => setAblehnen(false)}
        titel="Reklamation ablehnen"
        aktionen={
          <>
            <Button variante="tertiaer" onClick={() => setAblehnen(false)}>Abbrechen</Button>
            <Button
              variante="gefahr"
              disabled={!grund.trim()}
              onClick={() => {
                aendern({ status: 'abgelehnt', grund: grund.trim(), erledigtAm: heute() }, `Abgelehnt: ${grund.trim()}`);
                const a = db.auftraege.get(r.nacharbeitAuftragId);
                if (a && !['erledigt', 'verloren'].includes(a.phase)) db.auftraege.update(a.id, { phase: 'verloren', verlorenGrund: `Reklamation abgelehnt: ${grund.trim()}` });
                setAblehnen(false);
                toast('Reklamation abgelehnt.');
              }}
            >
              Ablehnen
            </Button>
          </>
        }
      >
        <Textfeld label="Grund" value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z. B. Kein Mangel – Bedienfehler, Fremdeinwirkung" hilfe="Steht im Verlauf – wichtig, falls der Kunde nachfragt." />
      </Dialog>
    </Seite>
  );
}


