import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { datum, euro, heute, telLink } from '@core/format';
import {
  Abschnitt,
  Button,
  Checkbox,
  Eingabe,
  FensterSkizze,
  FormRaster,
  Fortschritt,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Raster,
  Schalter,
  Segmente,
  Stapel,
  Status,
  Tabelle,
  Tabs,
  Auswahl,
  Zeile,
  useToast,
} from '@ui/index';
import { GeldSeite, useBasis } from '../kosten/gemeinsam';
import { abschlussPunkte, einstellungenPruefen, monatsSpanne, zeitraumPruefen, type Buchung, type DatevEinstellungen, type Kontenrahmen } from './daten';
import { exportAusfuehren, exportVorbereiten, herunterladen, K, LEERER_STEUERBERATER, STANDARD_EINSTELLUNGEN, type ExportProtokoll, type Steuerberater } from './speicher';

type Reiter = 'export' | 'abschluss' | 'steuerberater';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monatLabel = (m: string) => `${MONATE[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
export function letzteMonate(n: number, stichtag = heute()): string[] {
  const [j, m] = stichtag.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(j, m - 1 - i, 15);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

export function DatevSeite() {
  const [params] = useSearchParams();
  const [reiter, setReiter] = useState<Reiter>(params.get('reiter') === 'abschluss' ? 'abschluss' : 'export');
  const monat = /^\d{4}-\d{2}$/.test(params.get('monat') ?? '') ? params.get('monat')! : undefined;
  return (
    <GeldSeite titel="Steuerberater & DATEV" untertitel="Rechnungen und Belege sauber an die Buchhaltung übergeben.">
      <Stapel abstand={24}>
        <Tabs
          aktiv={reiter}
          onWechsel={(r) => setReiter(r as Reiter)}
          tabs={[
            { id: 'export', titel: 'Export' },
            { id: 'abschluss', titel: 'Monatsabschluss' },
            { id: 'steuerberater', titel: 'Steuerberater' },
          ]}
        />
        {reiter === 'export' && <Export monatVorschlag={monat} zuEinstellungen={() => setReiter('steuerberater')} />}
        {reiter === 'abschluss' && <Monatsabschluss monatVorschlag={monat} />}
        {reiter === 'steuerberater' && <SteuerberaterForm />}
      </Stapel>
    </GeldSeite>
  );
}

// ------------------------------------------------------------------ Export

function Export({ monatVorschlag, zuEinstellungen }: { monatVorschlag?: string; zuEinstellungen: () => void }) {
  const toast = useToast();
  const [e] = useEinstellung<DatevEinstellungen>(K.einstellungen, STANDARD_EINSTELLUNGEN);
  const [exporte] = useEinstellung<ExportProtokoll[]>(K.exporte, []);
  const start = monatVorschlag ?? letzteMonate(2)[1];
  const [von, setVon] = useState(monatsSpanne(start).von);
  const [bis, setBis] = useState(monatsSpanne(start).bis);
  const [auchExportierte, setAuchExportierte] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const fehlerZeitraum = zeitraumPruefen(von, bis);
  const fehlerEinstellungen = einstellungenPruefen(e);
  const einstellungenOk = !Object.keys(fehlerEinstellungen).length;
  const v = useDatenstand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vorschau = useMemo(() => (fehlerZeitraum ? undefined : exportVorbereiten(von, bis, auchExportierte)), [von, bis, auchExportierte, v, e.rahmen, e.kostenstellen]);
  const doppelt = vorschau ? vorschau.doppelt.rechnungen.length + vorschau.doppelt.belege.length : 0;
  const summe = vorschau?.buchungen.reduce((s, x) => s + (x.quelle.typ === 'rechnungen' ? (x.sh === 'S' ? x.umsatz : -x.umsatz) : 0), 0) ?? 0;
  const ausgaben = vorschau?.buchungen.reduce((s, x) => s + (x.quelle.typ === 'belege' ? x.umsatz : 0), 0) ?? 0;

  function monatWaehlen(m: string) {
    const s = monatsSpanne(m);
    setVon(s.von);
    setBis(s.bis);
  }

  function exportieren() {
    if (!vorschau?.buchungen.length || fehlerZeitraum || !einstellungenOk) return;
    setLaedt(true);
    try {
      const { bytes, name, ergebnis } = exportAusfuehren(von, bis, auchExportierte);
      herunterladen(bytes, name);
      setAuchExportierte(false);
      toast(`${name} ist heruntergeladen. ${ergebnis.rechnungIds.length + ergebnis.belegIds.length} Belege sind als exportiert markiert.`);
    } catch (err) {
      console.error(err);
      toast('Der Export hat nicht geklappt. Bitte versuch es noch einmal.', { ton: 'achtung' });
    } finally {
      setLaedt(false);
    }
  }

  return (
    <Stapel abstand={24}>
      {!einstellungenOk && (
        <Meldung ton="achtung" titel="Berater- und Mandantennummer fehlen" aktion={<Button klein variante="sekundaer" onClick={zuEinstellungen}>Jetzt eintragen</Button>}>
          Ohne diese Nummern kann DATEV den Buchungsstapel nicht zuordnen. Du findest sie in jeder Mail oder Rechnung deines Steuerberaters.
        </Meldung>
      )}
      <Karte titel="Zeitraum" icon="kalender">
        <Stapel abstand={16}>
          <Zeile>
            {letzteMonate(4).map((m) => {
              const s = monatsSpanne(m);
              const an = s.von === von && s.bis === bis;
              return (
                <Button key={m} klein variante={an ? 'primaer' : 'sekundaer'} onClick={() => monatWaehlen(m)} aria-pressed={an}>
                  {monatLabel(m)}
                </Button>
              );
            })}
          </Zeile>
          <FormRaster>
            <Eingabe label="Von" type="date" value={von} onChange={(x) => setVon(x.target.value)} fehler={fehlerZeitraum && von > bis ? fehlerZeitraum : undefined} />
            <Eingabe label="Bis" type="date" value={bis} onChange={(x) => setBis(x.target.value)} fehler={fehlerZeitraum && !(von > bis) ? fehlerZeitraum : undefined} />
          </FormRaster>
          <p className="mm-meta" style={{ margin: 0 }}>
            Kontenrahmen {e.rahmen} · Beraternr. {e.beraterNr || '–'} · Mandantennr. {e.mandantNr || '–'}{' '}
            <Button klein variante="tertiaer" onClick={zuEinstellungen}>
              Ändern
            </Button>
          </p>
        </Stapel>
      </Karte>

      {vorschau && (
        <>
          <Raster min={180}>
            <Karte kompakt icon="dokument" titel={`${vorschau.rechnungIds.length} ${vorschau.rechnungIds.length === 1 ? 'Rechnung' : 'Rechnungen'}`}>
              <span className="mm-meta">Ausgangsrechnungen brutto: {euro(summe)}</span>
            </Karte>
            <Karte kompakt icon="ordner" titel={`${vorschau.belegIds.length} ${vorschau.belegIds.length === 1 ? 'Beleg' : 'Belege'}`}>
              <span className="mm-meta">Eingangsbelege brutto: {euro(ausgaben)}</span>
            </Karte>
          </Raster>

          {doppelt > 0 && (
            <Meldung ton="achtung" titel={`${doppelt} ${doppelt === 1 ? 'Beleg wurde' : 'Belege wurden'} schon exportiert`}>
              <Stapel abstand={8}>
                <span>{auchExportierte ? 'Sie sind diesmal wieder enthalten. Sag deinem Steuerberater Bescheid, damit nichts doppelt gebucht wird.' : 'Sie sind nicht noch einmal enthalten – so wird nichts doppelt gebucht.'}</span>
                <Checkbox label="Trotzdem erneut exportieren (z. B. wenn die Datei verloren gegangen ist)" checked={auchExportierte} onChange={setAuchExportierte} />
              </Stapel>
            </Meldung>
          )}
          {vorschau.uebersprungen > 0 && (
            <Meldung>
              {vorschau.uebersprungen} {vorschau.uebersprungen === 1 ? 'Rechnung ist' : 'Rechnungen sind'} noch Entwurf oder storniert und {vorschau.uebersprungen === 1 ? 'wird' : 'werden'} nicht exportiert.
            </Meldung>
          )}
          {vorschau.warnungen.length > 0 && (
            <Meldung ton="achtung" titel="Bitte prüfen">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {vorschau.warnungen.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Meldung>
          )}

          <Abschnitt
            titel="Buchungen"
            aktion={
              <Button icon="download" onClick={exportieren} laedt={laedt} laedtText="Wird erstellt …" disabled={!vorschau.buchungen.length || !einstellungenOk || !!fehlerZeitraum}>
                Buchungsstapel herunterladen
              </Button>
            }
          >
            <BuchungsTabelle buchungen={vorschau.buchungen} />
          </Abschnitt>
        </>
      )}

      <Abschnitt titel="Bisherige Exporte">
        <Liste leer={<p className="mm-meta">Noch kein Export. Der erste Buchungsstapel erscheint hier.</p>}>
          {exporte.slice(0, 10).map((x) => (
            <ListenZeile
              key={x.id}
              titel={`${datum(x.von)} – ${datum(x.bis)}`}
              untertitel={`${x.rechnungen} Rechnungen, ${x.belege} Belege · ${x.rahmen} · erstellt ${datum(x.zeitpunkt)}${x.erneut ? ' · enthielt bereits exportierte' : ''}`}
              rechts={<Status ton="erfolg">Exportiert</Status>}
            />
          ))}
        </Liste>
      </Abschnitt>

      <Karte titel="DATEV Unternehmen online" aktion={<Status ton="neutral">Geplant</Status>}>
        <div className="mm-fenster-teaser">
          <span className="mm-fenster" aria-hidden>
            <FensterSkizze icon="stecker" />
          </span>
          <p style={{ margin: 0 }}>
            Später schickt Lotte Belege und Buchungen direkt an DATEV – ohne Datei. Bis dahin lädst du den Buchungsstapel herunter und schickst ihn deinem Steuerberater oder lädst ihn in DATEV hoch.
          </p>
        </div>
      </Karte>
    </Stapel>
  );
}

function BuchungsTabelle({ buchungen }: { buchungen: Buchung[] }) {
  return (
    <Tabelle
      zeilen={buchungen}
      schluessel={(b) => `${b.quelle.typ}:${b.quelle.id}`}
      leer={<Leer titel="Nichts zu exportieren" text="Im gewählten Zeitraum gibt es keine versendeten Rechnungen und keine Belege, die noch nicht exportiert sind." icon="check" />}
      spalten={[
        { titel: 'Datum', wert: (b) => datum(b.belegdatum), sortierWert: (b) => b.belegdatum },
        { titel: 'Beleg', wert: (b) => b.belegfeld1 || '–' },
        { titel: 'Text', nebensaechlich: true, wert: (b) => b.text },
        { titel: 'Konto', zahl: true, nebensaechlich: true, wert: (b) => b.konto },
        { titel: 'Gegenkonto', zahl: true, nebensaechlich: true, wert: (b) => `${b.gegenkonto}${b.bu ? ` (BU ${b.bu})` : ''}` },
        { titel: 'Betrag', zahl: true, wert: (b) => `${euro(b.umsatz)} ${b.sh}`, sortierWert: (b) => b.umsatz },
      ]}
    />
  );
}

// ------------------------------------------------------------------ Monatsabschluss

function Monatsabschluss({ monatVorschlag }: { monatVorschlag?: string }) {
  const b = useBasis();
  const toast = useToast();
  const monate = letzteMonate(6);
  const [monat, setMonat] = useState(monatVorschlag && monate.includes(monatVorschlag) ? monatVorschlag : monate[1]);
  const [bestaetigt, setBestaetigt] = useEinstellung<Record<string, boolean>>(K.abschluss(monat), {});
  const [exportiert] = useEinstellung<Record<string, string>>(K.rechnungen, {});
  const punkte = abschlussPunkte(b, monat, bestaetigt, exportiert);
  const fertig = punkte.filter((p) => p.erledigt).length;

  return (
    <Stapel abstand={24}>
      <Auswahl label="Monat" value={monat} onChange={(e) => setMonat(e.target.value)} optionen={monate.map((m) => ({ wert: m, label: monatLabel(m) }))} />
      <Fortschritt wert={fertig} max={punkte.length} label={`${fertig} von ${punkte.length} erledigt`} />
      {fertig === punkte.length && <Meldung ton="erfolg" titel={`${monatLabel(monat)} ist abgeschlossen`}>Alles erfasst und übergeben. Gute Arbeit.</Meldung>}
      <Liste>
        {punkte.map((p) => (
          <ListenZeile
            key={p.id}
            titel={
              p.automatisch ? (
                p.titel
              ) : (
                <Checkbox
                  label={p.titel}
                  checked={p.erledigt}
                  onChange={(an) => {
                    setBestaetigt({ ...bestaetigt, [p.id]: an });
                    if (an) toast(`„${p.titel}“ abgehakt.`);
                  }}
                />
              )
            }
            untertitel={p.text}
            rechts={p.automatisch ? <Status ton={p.erledigt ? 'erfolg' : 'achtung'}>{p.erledigt ? 'Erledigt' : 'Offen'}</Status> : <Status ton={p.erledigt ? 'erfolg' : 'neutral'}>{p.erledigt ? 'Bestätigt' : 'Von dir'}</Status>}
          />
        ))}
      </Liste>
      <p className="mm-meta" style={{ margin: 0 }}>
        Punkte mit „Erledigt/Offen“ prüft Lotte automatisch aus deinen Daten. Punkte „Von dir“ hakst du selbst ab.
      </p>
    </Stapel>
  );
}

// ------------------------------------------------------------------ Steuerberater

function SteuerberaterForm() {
  const toast = useToast();
  const [gespeichertE, setE] = useEinstellung<DatevEinstellungen>(K.einstellungen, STANDARD_EINSTELLUNGEN);
  const [gespeichertS, setS] = useEinstellung<Steuerberater>(K.steuerberater, LEERER_STEUERBERATER);
  const [e, setEForm] = useState(gespeichertE);
  const [s, setSForm] = useState(gespeichertS);
  const [versucht, setVersucht] = useState(false);
  const fehler = einstellungenPruefen(e);
  const mailFehler = s.email && !/^\S+@\S+\.\S+$/.test(s.email) ? 'Bitte eine gültige E-Mail-Adresse eintragen.' : undefined;

  function speichern() {
    setVersucht(true);
    if (Object.keys(fehler).length || mailFehler) {
      toast('Bitte prüf die markierten Felder.', { ton: 'achtung' });
      return;
    }
    setE(e);
    setS(s);
    toast('Steuerberater und DATEV-Daten sind gespeichert.');
  }

  return (
    <Stapel abstand={24}>
      <Karte titel="Dein Steuerberater" icon="person">
        <Stapel abstand={16}>
          <FormRaster>
            <Eingabe label="Ansprechpartner" value={s.name} onChange={(x) => setSForm({ ...s, name: x.target.value })} optional autoComplete="name" />
            <Eingabe label="Kanzlei" value={s.kanzlei} onChange={(x) => setSForm({ ...s, kanzlei: x.target.value })} optional autoComplete="organization" />
            <Eingabe label="Telefon" type="tel" value={s.telefon} onChange={(x) => setSForm({ ...s, telefon: x.target.value })} optional autoComplete="tel" />
            <Eingabe label="E-Mail" type="email" value={s.email} onChange={(x) => setSForm({ ...s, email: x.target.value })} optional fehler={versucht ? mailFehler : undefined} autoComplete="email" />
          </FormRaster>
          {(gespeichertS.telefon || gespeichertS.email) && (
            <Zeile>
              {gespeichertS.telefon && (
                <Button variante="sekundaer" icon="telefon" onClick={() => (window.location.href = telLink(gespeichertS.telefon)!)}>
                  Anrufen
                </Button>
              )}
              {gespeichertS.email && (
                <Button
                  variante="sekundaer"
                  icon="mail"
                  onClick={() => (window.location.href = `mailto:${gespeichertS.email}?subject=${encodeURIComponent('Unterlagen Buchhaltung')}`)}
                >
                  E-Mail schreiben
                </Button>
              )}
            </Zeile>
          )}
        </Stapel>
      </Karte>
      <Karte titel="DATEV-Daten" icon="einstellungen">
        <Stapel abstand={16}>
          <Segmente<Kontenrahmen>
            label="Kontenrahmen"
            wert={e.rahmen}
            onChange={(r) => setEForm({ ...e, rahmen: r })}
            optionen={[
              { wert: 'SKR03', label: 'SKR03' },
              { wert: 'SKR04', label: 'SKR04' },
            ]}
          />
          <p className="mm-meta" style={{ margin: 0 }}>
            Welchen Kontenrahmen dein Steuerberater nutzt, steht in deiner BWA oben rechts. Im Handwerk ist SKR03 am häufigsten.
          </p>
          <FormRaster>
            <Eingabe label="Beraternummer" inputMode="numeric" value={e.beraterNr} onChange={(x) => setEForm({ ...e, beraterNr: x.target.value.trim() })} fehler={versucht ? fehler.beraterNr : undefined} hilfe="4 bis 7 Ziffern" />
            <Eingabe label="Mandantennummer" inputMode="numeric" value={e.mandantNr} onChange={(x) => setEForm({ ...e, mandantNr: x.target.value.trim() })} fehler={versucht ? fehler.mandantNr : undefined} hilfe="1 bis 5 Ziffern" />
          </FormRaster>
          <Schalter
            label="Betriebsbereiche als Kostenstelle mitgeben"
            beschreibung="Belege ohne Auftrag bekommen ihren Bereich (z. B. Fahrzeuge) als Kostenstelle KOST1. Nur einschalten, wenn dein Steuerberater Kostenstellen nutzt."
            checked={!!e.kostenstellen}
            onChange={(an) => setEForm({ ...e, kostenstellen: an })}
          />
        </Stapel>
      </Karte>
      <div>
        <Button onClick={speichern} icon="check">
          Speichern
        </Button>
      </div>
      <Meldung titel="So werden Konten vergeben">
        Erlöse 19 % auf {e.rahmen === 'SKR03' ? '8400' : '4400'}, Material auf {e.rahmen === 'SKR03' ? '3400' : '5400'}, Fahrzeugkosten auf {e.rahmen === 'SKR03' ? '4530' : '6530'}, Werkzeug auf{' '}
        {e.rahmen === 'SKR03' ? '4985' : '6845'}, Sonstiges auf {e.rahmen === 'SKR03' ? '4900' : '6300'}. Kunden bekommen automatisch Debitorennummern ab 10000, Lieferanten Kreditorennummern ab 70000 – jede Nummer bleibt
        dauerhaft gleich. Barbelege ohne Lieferant gehen über die Kasse.
      </Meldung>
    </Stapel>
  );
}
