import { Link, useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { pfadZu } from '@core/modul';
import { PHASEN, type ObjektTyp } from '@core/objects';
import { useDarf } from '@core/session';
import { datum, euro, heute } from '@core/format';
import { BeispielMarke, Button, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { intervallText } from '../wiederkehrend/regel';
import { serieAktiv, serien } from '../wiederkehrend/daten';
import { abrechnen, faelligeAbrechnung, kuendigen, kuendigenBis, laufzeitBis, preisMonat, RHYTHMEN, servicevertraege, verlaengern, wartungsauftraegeZu, zustand, ZUSTAND_TEXT } from './daten';

const PHASEN_LABEL = Object.fromEntries(PHASEN.map((p) => [p.id, p.label])) as Record<string, string>;

export function VertragDetail() {
  useDatenstand();
  const { id = '' } = useParams();
  const v = servicevertraege.useOne(id);
  const geld = useDarf('geld');
  const toast = useToast();
  const navigate = useNavigate();
  const [fragen, bestaetigung] = useBestaetigen();

  if (!v || v.geloeschtAm)
    return (
      <Seite titel="Vertrag nicht gefunden" zurueck={{ to: '/auftraege/servicevertraege', label: 'Serviceverträge' }}>
        <Leer titel="Diesen Vertrag gibt es nicht (mehr)." icon="dokument" aktion={<Button to="/auftraege/servicevertraege">Zur Übersicht</Button>} />
      </Seite>
    );

  const t = heute();
  const z = zustand(v, t);
  const zt = ZUSTAND_TEXT[z];
  const k = db.kunden.get(v.kundeId);
  const faellig = faelligeAbrechnung(v, t);
  const wartungen = wartungsauftraegeZu(v);
  const serienZu = serien.where((s) => s.vertragId === v.id || (s.anlageIds ?? []).some((a) => v.anlageIds.includes(a)));
  const laufendeSerie = serienZu.find((s) => serieAktiv(s));

  const jetztAbrechnen = () => {
    const r = abrechnen(v.id);
    if (!r) return toast('Gerade ist keine Abrechnung fällig.', { ton: 'achtung' });
    toast('Rechnungsentwurf erstellt.');
    const p = pfadZu({ typ: 'rechnungen', id: r.rechnungId ?? '' });
    if (p) navigate(p);
  };

  const kuendigung = async () => {
    const ende = laufzeitBis(v, t);
    const ok = await fragen('Kündigung vermerken?', `Der Vertrag endet dann am ${datum(ende)}. Bis dahin plant und berechnet Macher weiter wie vereinbart.`, 'Kündigung vermerken');
    if (!ok) return;
    kuendigen(v.id, t);
    toast(`Kündigung vermerkt – Vertrag endet am ${datum(ende)}.`);
  };

  return (
    <Seite
      titel={v.titel}
      oberzeile={v.nummer}
      status={
        <>
          <Status ton={zt.ton}>{zt.text}</Status>
          <BeispielMarke zeigen={v.beispiel} />
        </>
      }
      untertitel={k ? <ObjektLink bezug={{ typ: 'kunden', id: k.id }}>{k.name}</ObjektLink> : 'Kunde fehlt'}
      zurueck={{ to: '/auftraege/servicevertraege', label: 'Serviceverträge' }}
      aktion={<Button icon="stift" variante="sekundaer" to={`/auftraege/servicevertraege/${v.id}/bearbeiten`}>Bearbeiten</Button>}
    >
      <ZweiSpalten
        haupt={
          <>
            {z === 'frist' && (
              <Meldung ton="achtung" titel={`Kündigungsfrist endet am ${datum(kuendigenBis(v, t))}`}>
                Danach verlängert sich der Vertrag um {v.verlaengerungMonate} Monate. Wenn du den Preis anpassen willst, sprich den Kunden jetzt an.
              </Meldung>
            )}
            {z === 'laeuft_aus' && (
              <Meldung
                ton="achtung"
                titel={`Vertrag läuft am ${datum(laufzeitBis(v, t))} aus`}
                aktion={
                  <Button
                    klein
                    variante="sekundaer"
                    onClick={() => {
                      verlaengern(v.id);
                      toast('Vertrag verlängert.');
                    }}
                  >
                    Verlängern
                  </Button>
                }
              >
                Er verlängert sich nicht automatisch. Biete dem Kunden die Verlängerung an.
              </Meldung>
            )}
            {faellig && geld && (
              <Meldung ton="aktiv" titel={`Abrechnung fällig: ${datum(faellig.von)} – ${datum(faellig.bis)}`} aktion={<Button klein onClick={jetztAbrechnen}>Rechnung erstellen</Button>}>
                {euro(faellig.betrag)} netto. Macher legt einen Abrechnungsauftrag und einen Rechnungsentwurf an – du prüfst und versendest.
              </Meldung>
            )}
            <Karte titel="Enthaltene Leistungen">
              {v.leistungen.length ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {v.leistungen.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              ) : (
                <Meta>Keine Leistungen eingetragen. Ergänze sie unter „Bearbeiten“ – sie erscheinen auf der Rechnung.</Meta>
              )}
            </Karte>
            <Karte titel="Anlagen und Orte">
              <Liste leer={<Meta>Keine Anlagen oder Orte gewählt.</Meta>}>
                {v.anlageIds.map((aid) => {
                  const a = db.anlagen.get(aid);
                  if (!a) return null;
                  return (
                    <ListenZeile
                      key={aid}
                      to={pfadZu({ typ: 'anlagen', id: aid })}
                      titel={`${a.typ}${a.hersteller ? ` – ${a.hersteller}` : ''}`}
                      untertitel={`${db.orte.get(a.ortId)?.bezeichnung ?? ''} · letzte Wartung ${datum(a.letzteWartung)}`}
                      rechts={a.naechsteWartung ? <Status ton={a.naechsteWartung < t ? 'achtung' : 'neutral'}>{`Nächste ${datum(a.naechsteWartung)}`}</Status> : <Status>Kein Termin</Status>}
                    />
                  );
                })}
                {v.anlageIds.length === 0 &&
                  v.ortIds.map((oid) => {
                    const o = db.orte.get(oid);
                    return o ? <ListenZeile key={oid} to={pfadZu({ typ: 'orte', id: oid })} titel={o.bezeichnung} untertitel={`${o.adresse.strasse}, ${o.adresse.ort}`} /> : null;
                  })}
              </Liste>
            </Karte>
            <Karte titel="Wartungsaufträge" aktion={<Meta>im Vertrag enthalten, ohne Berechnung</Meta>}>
              <Liste leer={<Meta>Noch keine. Macher legt sie automatisch vor der nächsten fälligen Wartung an.</Meta>}>
                {wartungen.slice(0, 8).map((a) => (
                  <ListenZeile
                    key={a.id}
                    to={pfadZu({ typ: 'auftraege', id: a.id })}
                    titel={`${a.nummer} · ${a.titel}`}
                    untertitel={datum(a.erstelltAm)}
                    rechts={<Status ton={a.phase === 'erledigt' ? 'erfolg' : 'aktiv'}>{PHASEN_LABEL[a.phase]}</Status>}
                  />
                ))}
              </Liste>
            </Karte>
            {geld && (
              <Karte titel="Abrechnungen">
                <Liste leer={<Meta>Noch nichts abgerechnet.</Meta>}>
                  {[...v.abrechnungen].reverse().map((a) => {
                    const r = db.rechnungen.get(a.rechnungId);
                    return (
                      <ListenZeile
                        key={a.auftragId}
                        to={r ? pfadZu({ typ: 'rechnungen', id: r.id }) : pfadZu({ typ: 'auftraege', id: a.auftragId })}
                        titel={`${datum(a.von)} – ${datum(a.bis)}`}
                        untertitel={r ? `Rechnung ${r.nummer}` : 'Abrechnungsauftrag'}
                        rechts={<span className="mm-number">{euro(a.betrag)}</span>}
                      />
                    );
                  })}
                </Liste>
              </Karte>
            )}
            <Karte titel="Verlauf">
              <Zeitstrahl bezug={{ typ: 'servicevertraege' as ObjektTyp, id: v.id }} max={8} />
            </Karte>
          </>
        }
        seite={
          <>
            <Karte titel="Konditionen" kompakt>
              <Stapel abstand={8}>
                {geld && (
                  <Meta>
                    Preis: {euro(v.preisJahr)} pro Jahr ({euro(preisMonat(v))} pro Monat), netto
                  </Meta>
                )}
                <Meta>Abrechnung: {RHYTHMEN.find((r) => r.wert === v.abrechnung)?.label}</Meta>
                <Meta>Wartung: {intervallText(v.intervallMonate)}</Meta>
                <Meta>Beginn: {datum(v.beginn)}</Meta>
                <Meta>Laufzeit: {v.laufzeitMonate} Monate, läuft bis {datum(laufzeitBis(v, t))}</Meta>
                <Meta>Kündigungsfrist: {v.kuendigungsfristMonate} Monate{v.status === 'aktiv' && v.automatischVerlaengern ? ` (bis ${datum(kuendigenBis(v, t))})` : ''}</Meta>
                <Meta>{v.automatischVerlaengern ? `Verlängert sich automatisch um ${v.verlaengerungMonate} Monate` : 'Keine automatische Verlängerung'}</Meta>
                {v.gekuendigtAm && <Meta>Gekündigt am {datum(v.gekuendigtAm)}</Meta>}
                {v.notiz && <Meta>Notiz: {v.notiz}</Meta>}
              </Stapel>
            </Karte>
            <Karte titel="Wartungstermine" kompakt>
              <Stapel abstand={8}>
                {laufendeSerie ? (
                  <Meta>
                    Läuft als Serie: <Link to={`/plan/wiederkehrend/${laufendeSerie.id}`}>{laufendeSerie.titel}</Link>
                  </Meta>
                ) : (
                  <>
                    <Meta>Feste Termine? Leg eine Serie an – dann stehen alle Wartungen schon im Kalender.</Meta>
                    <div>
                      <Button klein variante="sekundaer" icon="wiederholen" to={`/plan/wiederkehrend/neu?vertragId=${v.id}`}>
                        Termine als Serie planen
                      </Button>
                    </div>
                  </>
                )}
              </Stapel>
            </Karte>
            {z !== 'beendet' && v.status === 'aktiv' && (
              <Zeile>
                {!v.automatischVerlaengern && z !== 'laeuft_aus' && (
                  <Button
                    variante="tertiaer"
                    onClick={() => {
                      verlaengern(v.id);
                      toast('Vertrag verlängert.');
                    }}
                  >
                    Verlängern
                  </Button>
                )}
                <Button variante="tertiaer" onClick={kuendigung}>Kündigung vermerken</Button>
              </Zeile>
            )}
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}
