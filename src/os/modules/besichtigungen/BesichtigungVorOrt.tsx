import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { adresseText, datumKurz, mapsLink, personName, relativ, telLink, uhrzeit } from '@core/format';
import { Auswahl, AuswahlKarten, BeispielMarke, Button, Icon, IconButton, Karte, Leer, Meldung, Meta, Seite, Stapel, Status, Textfeld, ZweiSpalten, useToast, DateiKnopf, bildVerkleinern } from '@ui/index';
import { ObjektLink } from '@ui/objekt';
import { ERGEBNISSE, ergebnisFestlegen, type Ergebnis } from './daten';

const GRUENDE = ['Zu teuer für den Kunden', 'Passt nicht zu unseren Leistungen', 'Kunde will doch nicht', 'Sonstiges'];

export function BesichtigungVorOrt() {
  const { id = '' } = useParams();
  useDatenstand();
  const t = db.termine.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [notiz, setNotiz] = useState('');
  const [ergebnis, setErgebnis] = useState<Ergebnis>();
  const [grund, setGrund] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();

  if (!t || t.geloeschtAm || t.art !== 'besichtigung')
    return (
      <Seite titel="Besichtigung nicht gefunden" zurueck={{ to: '/auftraege/besichtigungen', label: 'Besichtigungen' }}>
        <Leer titel="Diese Besichtigung gibt es nicht (mehr)." icon="ort" aktion={<Button to="/auftraege/besichtigungen">Zur Übersicht</Button>} />
      </Seite>
    );

  const a = db.auftraege.get(t.auftragId);
  const k = db.kunden.get(t.kundeId ?? a?.kundeId);
  const o = db.orte.get(t.ortId ?? a?.ortId);
  const doku = db.dokumente.where((d) => d.bezug?.typ === 'termine' && d.bezug.id === t.id).sort((x, y) => y.erstelltAm.localeCompare(x.erstelltAm));
  const fotos = doku.filter((d) => d.art === 'foto');
  const notizen = doku.filter((d) => d.art === 'notiz');
  const erledigt = t.status === 'erledigt';
  const bezug = { typ: 'termine' as const, id: t.id };

  const notizSpeichern = () => {
    if (!notiz.trim()) return;
    db.dokumente.create({ art: 'notiz', titel: 'Notiz Besichtigung', text: notiz.trim(), auftragId: t.auftragId, bezug });
    setNotiz('');
    toast('Notiz gespeichert.');
  };

  const fotoHinzu = async (files: File[]) => {
    if (!files.length) return;
    setLaedt(true);
    setFehler(undefined);
    try {
      for (const f of files) {
        const b = await bildVerkleinern(f);
        db.dokumente.create({ art: 'foto', titel: f.name || 'Foto Besichtigung', url: b.url, mime: b.mime, groesse: b.bytes, auftragId: t.auftragId, bezug, tags: ['besichtigung'] });
      }
      toast(files.length === 1 ? 'Foto gespeichert.' : `${files.length} Fotos gespeichert.`);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Foto konnte nicht gespeichert werden.');
    } finally {
      setLaedt(false);
    }
  };

  const abschliessen = () => {
    if (!ergebnis) return setFehler('Wähle, wie es weitergeht.');
    if (notiz.trim()) notizSpeichern();
    const ziel = ergebnisFestlegen(t.id, ergebnis, grund);
    toast(ergebnis === 'kein_auftrag' ? 'Besichtigung abgeschlossen, Auftrag abgelegt.' : 'Besichtigung abgeschlossen.');
    navigate(ziel ?? '/auftraege/besichtigungen');
  };

  return (
    <Seite
      titel={a?.titel ?? t.titel}
      oberzeile={`Besichtigung · ${datumKurz(t.start)}, ${uhrzeit(t.start)} Uhr`}
      status={
        <>
          {erledigt ? <Status ton="erfolg">Erledigt</Status> : t.ende < new Date().toISOString() ? <Status ton="achtung">Ergebnis fehlt</Status> : <Status ton="aktiv">Geplant</Status>}
          <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      zurueck={{ to: '/auftraege/besichtigungen', label: 'Besichtigungen' }}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {(t.notiz || a?.beschreibung) && <Meldung titel="Worum geht's?">{[a?.beschreibung, t.notiz].filter(Boolean).join(' – ')}</Meldung>}
            <Karte titel={`Fotos${fotos.length ? ` (${fotos.length})` : ''}`}>
              <Stapel abstand={12}>
                {fotos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                    {fotos.map((f) => (
                      <div key={f.id} style={{ position: 'relative' }}>
                        <img src={f.url} alt={f.titel} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 'var(--mm-radius-control)', display: 'block' }} />
                        <IconButton icon="muell" label="Foto löschen" onClick={() => (db.dokumente.remove(f.id), toast('Foto gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.dokumente.restore(f.id) } }))} style={{ position: 'absolute', top: 4, right: 4, background: 'var(--mm-surface)' }} />
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <DateiKnopf accept="image/*" kamera mehrfach onDateien={fotoHinzu} laedt={laedt} laedtText="Wird gespeichert …">
                    Foto aufnehmen
                  </DateiKnopf>
                </div>
                {!fotos.length && <Meta>Fotos von Zählerschrank, Leitungswegen, Schäden – sie landen automatisch am Auftrag.</Meta>}
              </Stapel>
            </Karte>
            <Karte titel="Notizen">
              <Stapel abstand={12}>
                <Textfeld label="Was ist dir aufgefallen?" value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="Zustand, Maße grob, Wünsche des Kunden, Besonderheiten" rows={4} />
                <div>
                  <Button variante="sekundaer" icon="check" onClick={notizSpeichern} disabled={!notiz.trim()}>
                    Notiz speichern
                  </Button>
                </div>
                {notizen.map((n) => (
                  <div key={n.id} className="mm-karte mm-karte--kompakt" style={{ padding: 12 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{n.text}</p>
                    <Meta>
                      {relativ(n.erstelltAm)}, {uhrzeit(n.erstelltAm)}
                      {n.erstelltVon ? ` · ${personName(db.mitarbeiter.get(n.erstelltVon))}` : ''}
                    </Meta>
                  </div>
                ))}
              </Stapel>
            </Karte>
            {!erledigt && a && !['verloren', 'erledigt'].includes(a.phase) && (
              <Karte titel="Ergebnis: wie geht's weiter?">
                <Stapel abstand={12}>
                  <AuswahlKarten label="Ergebnis" wert={ergebnis ?? ('' as Ergebnis)} onChange={(v) => (setErgebnis(v as Ergebnis), setFehler(undefined))} optionen={ERGEBNISSE} />
                  {ergebnis === 'kein_auftrag' && <Auswahl label="Grund" value={grund} leer="Grund wählen" optional onChange={(e) => setGrund(e.target.value)} optionen={GRUENDE.map((g) => ({ wert: g, label: g }))} />}
                  {fehler && <p className="mm-fehlertext" role="alert">{fehler}</p>}
                  <div>
                    <Button icon="check" variante={ergebnis === 'kein_auftrag' ? 'gefahr' : 'primaer'} onClick={abschliessen}>
                      Besichtigung abschließen
                    </Button>
                  </div>
                </Stapel>
              </Karte>
            )}
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Kunde & Ort" kompakt>
              <Stapel abstand={8}>
                {k ? <ObjektLink bezug={{ typ: 'kunden', id: k.id }}>{k.name}</ObjektLink> : <Meta>Kein Kunde</Meta>}
                {k?.telefon && (
                  <a href={telLink(k.telefon)}>
                    <Icon name="telefon" size={16} /> {k.telefon}
                  </a>
                )}
                {o ? (
                  <a href={mapsLink(o.adresse)} target="_blank" rel="noreferrer">
                    <Icon name="ort" size={16} /> {adresseText(o.adresse)}
                  </a>
                ) : (
                  <Meta>Kein Einsatzort hinterlegt.</Meta>
                )}
                {o?.hinweise && <Meldung ton="achtung">{o.hinweise}</Meldung>}
                {o?.ansprechpartnerVorOrt && (
                  <Meta>
                    Vor Ort: {o.ansprechpartnerVorOrt}
                    {o.telefonVorOrt ? ` · ${o.telefonVorOrt}` : ''}
                  </Meta>
                )}
              </Stapel>
            </Karte>
            <Karte titel="Termin" kompakt>
              <Stapel abstand={8}>
                <Meta>
                  {datumKurz(t.start)}, {uhrzeit(t.start)}–{uhrzeit(t.ende)} Uhr
                </Meta>
                <Meta>{t.mitarbeiterIds.map((m) => personName(db.mitarbeiter.get(m))).join(', ') || 'Niemand eingeteilt'}</Meta>
                {a && pfadZu({ typ: 'auftraege', id: a.id }) && <ObjektLink bezug={{ typ: 'auftraege', id: a.id }}>{`Auftrag ${a.nummer} öffnen`}</ObjektLink>}
                {pfadZu(bezug) && <ObjektLink bezug={bezug}>Im Kalender ansehen</ObjektLink>}
              </Stapel>
            </Karte>
          </>
        }
      />
    </Seite>
  );
}
