import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, relativ } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import {
  BeispielMarke,
  Button,
  Dialog,
  Eingabe,
  FormRaster,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Schalter,
  Seite,
  Stapel,
  Status,
  ZweiSpalten,
  Zeile,
  useToast,
} from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { istUeberfaellig, offenFuerKunde, offenePosten, tageUeberfaellig } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';
import { KeinZugriff } from '../rechnungen/RechnungenListe';
import { GeldEingabe } from '../rechnungen/teile';
import { Briefbogen } from '../rechnungen/Druck';
import {
  STUFE_LABEL,
  kulanzSetzen,
  mahntext,
  mahnungMailto,
  mahnungen,
  mahnungenZu,
  naechsteStufeAm,
  pruefen,
  regeln,
  regelnSetzen,
  senden,
  verwerfen,
  warten,
  type Mahnung,
} from './daten';

const statusTon = (m: Mahnung) => (m.status === 'vorbereitet' ? 'achtung' : m.status === 'versendet' ? 'aktiv' : 'neutral');
const statusLabel = (m: Mahnung) =>
  m.status === 'vorbereitet' ? (m.wartenBis && m.wartenBis > heute() ? `Wartet bis ${datum(m.wartenBis)}` : 'Wartet auf Freigabe') : m.status === 'versendet' ? `Versendet ${relativ(m.versendetAm)}` : 'Verworfen';

/** Mahnung senden: Status setzen + E-Mail öffnen */
export function sendenUndMail(id: ID) {
  const m = senden(id);
  if (!m) return;
  const k = db.kunden.get(rechnungX(m.rechnungId)?.kundeId);
  if (k?.email && typeof window !== 'undefined') window.location.href = mahnungMailto(m);
  return m;
}

export function MahnungenListe() {
  useDatenstand();
  const darf = useDarf('geld');
  const toast = useToast();
  const [regelnOffen, setRegelnOffen] = useState(false);
  if (!darf) return <KeinZugriff />;
  const alle = mahnungen.all().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const freigabe = alle.filter((m) => m.status === 'vorbereitet');
  const versendet = alle.filter((m) => m.status === 'versendet').slice(0, 20);
  const mitMahnung = new Set(freigabe.map((m) => m.rechnungId));
  const ueberfaellig = offenePosten().filter((r) => istUeberfaellig(r) && !mitMahnung.has(r.id));

  const zeile = (m: Mahnung) => {
    const r = rechnungX(m.rechnungId);
    return (
      <ListenZeile
        key={m.id}
        to={`/betrieb/mahnungen/${m.id}`}
        titel={
          <>
            {STUFE_LABEL[m.stufe]} · {db.kunden.get(r?.kundeId)?.name} <BeispielMarke zeigen={m.beispiel} />
          </>
        }
        untertitel={`${r?.nummer} · offen ${euro(m.offen)}${m.gebuehr + m.zinsen ? ` + ${euro(m.gebuehr + m.zinsen)} Gebühr/Zinsen` : ''}`}
        rechts={<Status ton={statusTon(m)}>{statusLabel(m)}</Status>}
      />
    );
  };

  return (
    <Seite
      titel="Mahnungen"
      untertitel="Macher prüft jeden Tag die Fälligkeiten und bereitet die Schreiben vor. Raus geht nur, was du freigibst."
      aktion={
        <Button variante="sekundaer" icon="einstellungen" onClick={() => setRegelnOffen(true)}>
          Regeln einstellen
        </Button>
      }
    >
      <Karte titel="Wartet auf deine Freigabe" aktion={<Button klein variante="tertiaer" icon="wiederholen" onClick={() => { const e = pruefen(); toast(e.neu.length ? `${e.neu.length === 1 ? '1 Schreiben' : `${e.neu.length} Schreiben`} vorbereitet.` : 'Alles geprüft – nichts Neues.'); }}>Jetzt prüfen</Button>}>
        <Liste leer={<Leer titel="Nichts freizugeben" text="Sobald eine Rechnung lange genug überfällig ist, liegt hier das fertige Schreiben." icon="check" />}>{freigabe.map(zeile)}</Liste>
      </Karte>
      {ueberfaellig.length > 0 && (
        <Karte titel="Überfällig – noch in der Frist">
          <Liste>
            {ueberfaellig.map((r) => {
              const am = naechsteStufeAm(r);
              const stufe = Math.min(3, (r.mahnstufe ?? 0) + 1) as 1 | 2 | 3;
              return (
                <ListenZeile
                  key={r.id}
                  to={`/betrieb/rechnungen/${r.id}`}
                  titel={`${db.kunden.get(r.kundeId)?.name} · ${r.nummer}`}
                  untertitel={`seit ${tageUeberfaellig(r)} Tagen überfällig${r.mahnstufe ? ` · zuletzt ${STUFE_LABEL[r.mahnstufe as 1 | 2 | 3]}` : ''}`}
                  rechts={<Status ton="neutral">{r.mahnstufe >= 3 ? 'Mahnverfahren prüfen' : am ? `${STUFE_LABEL[stufe]} ${relativ(am)}` : '–'}</Status>}
                />
              );
            })}
          </Liste>
        </Karte>
      )}
      <Karte titel="Zuletzt versendet">
        <Liste leer={<Meta>Noch keine Mahnung versendet.</Meta>}>{versendet.map(zeile)}</Liste>
      </Karte>
      <RegelnDialog offen={regelnOffen} onSchliessen={() => setRegelnOffen(false)} />
    </Seite>
  );
}

export function MahnungDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const darf = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  const m = mahnungen.get(id);
  if (!darf) return <KeinZugriff />;
  if (!m)
    return (
      <Seite titel="Mahnung nicht gefunden" zurueck={{ to: '/betrieb/mahnungen', label: 'Mahnungen' }}>
        <Leer titel="Dieses Schreiben gibt es nicht (mehr)." icon="mail" />
      </Seite>
    );
  const r = rechnungX(m.rechnungId);
  const k = db.kunden.get(r?.kundeId);
  const t = mahntext(m);
  const offen = m.status === 'vorbereitet';
  return (
    <Seite
      titel={`${STUFE_LABEL[m.stufe]} · ${k?.name ?? ''}`}
      oberzeile={r?.nummer}
      status={
        <>
          <Status ton={statusTon(m)}>{statusLabel(m)}</Status> <BeispielMarke zeigen={m.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/mahnungen', label: 'Mahnungen' }}
      aktion={
        offen ? (
          <Button
            icon="mail"
            onClick={() => {
              sendenUndMail(m.id);
              toast(k?.email ? 'Als versendet markiert. Dein E-Mail-Programm öffnet sich.' : 'Als versendet markiert. Drucke das Schreiben und schick es per Post.');
            }}
          >
            Senden
          </Button>
        ) : undefined
      }
    >
      {offen && !k?.email && <Meldung ton="neutral">Für {k?.name} ist keine E-Mail-Adresse hinterlegt. Drucke das Schreiben und schick es per Post.</Meldung>}
      <ZweiSpalten
        haupt={
          <Karte titel={t.betreff}>
            <Stapel abstand={12}>
              <p>{t.anrede}</p>
              {t.absaetze.map((a) => (
                <p key={a}>{a}</p>
              ))}
              {t.posten.length > 1 && (
                <Stapel abstand={4}>
                  {t.posten.map(([l, c]) => (
                    <Zeile key={l} zwischen>
                      <span>{l}</span>
                      <span className="mm-number">{euro(c)}</span>
                    </Zeile>
                  ))}
                  <Zeile zwischen>
                    <strong>Gesamt</strong>
                    <strong className="mm-number">{euro(t.gesamt)}</strong>
                  </Zeile>
                </Stapel>
              )}
              <p>
                {t.gruss[0]}
                <br />
                {t.gruss[1]}
              </p>
            </Stapel>
          </Karte>
        }
        seite={
          <>
            <Karte titel="Rechnung" kompakt>
              <Stapel abstand={8}>
                {r && <ObjektLink bezug={{ typ: 'rechnungen', id: r.id }}>{r.nummer} · {r.titel}</ObjektLink>}
                {r && <Meta>fällig seit {datum(r.faelligAm)}</Meta>}
                {k && <ObjektLink bezug={{ typ: 'kunden', id: k.id }}>{k.name}</ObjektLink>}
              </Stapel>
            </Karte>
            {offen && m.stufe > 1 && (
              <Karte kompakt>
                <Schalter label="Ohne Gebühr und Zinsen" beschreibung="Für Stammkunden oder wenn du kulant sein willst." checked={!!m.kulanz} onChange={(v) => kulanzSetzen(m.id, v)} />
              </Karte>
            )}
            <Karte kompakt>
              <Stapel abstand={8}>
                <Button variante="sekundaer" icon="dokument" onClick={() => window.open(`/druck/mahnung/${m.id}`, '_blank')}>
                  Drucken / PDF
                </Button>
                {offen && (
                  <>
                    <Button variante="sekundaer" onClick={() => (warten(m.id), toast('Macher fragt in 7 Tagen wieder.'))}>
                      Noch warten (7 Tage)
                    </Button>
                    <Button variante="tertiaer" icon="x" onClick={() => (verwerfen(m.id), toast('Schreiben verworfen.'), navigate('/betrieb/mahnungen'))}>
                      Verwerfen
                    </Button>
                  </>
                )}
              </Stapel>
            </Karte>
            <Karte titel="Verlauf" kompakt>
              <Zeitstrahl bezug={{ typ: 'mahnungen' as never, id: m.id }} max={8} />
            </Karte>
          </>
        }
      />
    </Seite>
  );
}

export function MahnungDruck() {
  const { id = '' } = useParams();
  const m = mahnungen.get(id);
  if (!m) return <Leer titel="Mahnung nicht gefunden" icon="mail" />;
  const r = rechnungX(m.rechnungId);
  const t = mahntext(m);
  return (
    <Briefbogen
      kundeId={r?.kundeId ?? ''}
      titel={t.betreff}
      daten={[
        ['Datum', datum(m.datum)],
        ['Rechnung', `${r?.nummer} vom ${datum(r?.datum)}`],
        ['Kundennummer', db.kunden.get(r?.kundeId)?.nummer ?? ''],
      ]}
    >
      <p>{t.anrede}</p>
      {t.absaetze.map((a) => (
        <p key={a}>{a}</p>
      ))}
      {t.posten.length > 1 && (
        <table style={{ width: 'auto', margin: '16px 0' }}>
          <tbody>
            {t.posten.map(([l, c]) => (
              <tr key={l}>
                <td>{l}</td>
                <td className="num">{euro(c)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Gesamt</strong>
              </td>
              <td className="num">
                <strong>{euro(t.gesamt)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <p>
        {t.gruss[0]}
        <br />
        {t.gruss[1]}
      </p>
    </Briefbogen>
  );
}

function RegelnDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(regeln());
  useEffect(() => {
    if (offen) setF(regeln());
  }, [offen]);
  const zahl = (k: 'erinnerungTage' | 'mahnung1Tage' | 'mahnung2Tage' | 'fristTage') => ({
    value: String(f[k]),
    type: 'number',
    min: 0,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) }),
  });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Regeln fürs Mahnen"
      breit
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={() => (regelnSetzen(f), toast('Regeln gespeichert.'), onSchliessen())}>Regeln speichern</Button>
        </>
      }
    >
      <Stapel>
        <FormRaster>
          <Eingabe label="Zahlungserinnerung … Tage nach Fälligkeit" {...zahl('erinnerungTage')} />
          <Eingabe label="1. Mahnung … Tage nach der Erinnerung" {...zahl('mahnung1Tage')} />
          <Eingabe label="2. Mahnung … Tage nach der 1. Mahnung" {...zahl('mahnung2Tage')} />
          <Eingabe label="Neue Zahlungsfrist im Schreiben (Tage)" {...zahl('fristTage')} />
          <GeldEingabe label="Mahngebühr 1. Mahnung (€)" wert={f.gebuehr1} onWert={(c) => setF({ ...f, gebuehr1: c })} />
          <GeldEingabe label="Mahngebühr 2. Mahnung (€)" wert={f.gebuehr2} onWert={(c) => setF({ ...f, gebuehr2: c })} />
          <Eingabe
            label="Basiszinssatz (%)"
            inputMode="decimal"
            value={String(f.basiszins).replace('.', ',')}
            onChange={(e) => setF({ ...f, basiszins: Number(e.target.value.replace(',', '.')) || 0 })}
            hilfe="Ändert sich zum 1. Januar und 1. Juli (Deutsche Bundesbank). Verzugszinsen: Verbraucher +5, Unternehmen +9 Prozentpunkte."
          />
        </FormRaster>
        <Schalter label="40-€-Pauschale bei Unternehmen" beschreibung="§ 288 Abs. 5 BGB – wird bei der 1. Mahnung an Firmenkunden aufgeschlagen." checked={f.pauschale40} onChange={(v) => setF({ ...f, pauschale40: v })} />
        <Meta>Die Zahlungserinnerung ist immer kostenlos. Gebühren und Zinsen kommen ab der 1. Mahnung dazu.</Meta>
      </Stapel>
    </Dialog>
  );
}

/** Seitenblock beim Kunden: offene Posten – Kunde ist sichtbar markiert */
export function KundeOffenPanel({ id }: { id: ID }) {
  useDatenstand();
  const darf = useDarf('geld');
  if (!darf) return null;
  const o = offenFuerKunde(id);
  if (!o.liste.length) return null;
  const stufe = Math.max(0, ...o.liste.map((r) => r.mahnstufe ?? 0));
  return (
    <Karte titel="Offene Posten" kompakt>
      <Stapel abstand={8}>
        {o.ueberfaellig.length ? <Status ton="achtung">{`${euro(o.ueberfaelligSumme)} überfällig`}</Status> : <Status ton="aktiv">{`${euro(o.summe)} offen`}</Status>}
        {stufe > 0 && <Meta>Zuletzt: {STUFE_LABEL[stufe as 1 | 2 | 3]}</Meta>}
        <Liste>
          {o.liste.map((r) => (
            <ListenZeile key={r.id} to={`/betrieb/rechnungen/${r.id}`} titel={r.nummer} untertitel={`fällig ${relativ(r.faelligAm)}`} />
          ))}
        </Liste>
      </Stapel>
    </Karte>
  );
}

/** Tab „Mahnungen“ an der Rechnung (nur wenn es welche gibt) */
export function RechnungMahnungenTab({ id }: { id: ID }) {
  useDatenstand();
  const liste = mahnungenZu(id);
  return (
    <Liste leer={<Leer titel="Keine Mahnungen" icon="mail" />}>
      {liste.map((m) => (
        <ListenZeile key={m.id} to={`/betrieb/mahnungen/${m.id}`} titel={`${STUFE_LABEL[m.stufe]} vom ${datum(m.datum)}`} untertitel={`offen ${euro(m.offen)}${m.gebuehr + m.zinsen ? ` + ${euro(m.gebuehr + m.zinsen)}` : ''}`} rechts={<Status ton={statusTon(m)}>{statusLabel(m)}</Status>} />
      ))}
    </Liste>
  );
}
