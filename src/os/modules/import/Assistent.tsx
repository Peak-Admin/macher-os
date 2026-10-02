/**
 * Daten übernehmen: Datei wählen → Macher erkennt den Inhalt → Zuordnung bestätigen → Vorschau → übernehmen.
 * Kein technisches Mapping-Tool: Macher schlägt vor, du bestätigst. Korrigieren nur auf Wunsch.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { datum, uhrzeit, zahl } from '@core/format';
import { useDarf } from '@core/session';
import {
  Auswahl,
  Button,
  DateiKnopf,
  FensterSkizze,
  Karte,
  Laden,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Seite,
  Stapel,
  Status,
  Tabelle,
  Zeile,
  useBestaetigen,
  useToast,
} from '@ui/index';
import { ARTEN, artDef, artErkennen, zuordnungAus, zuordnungVorschlagen, type ImportArt, type SpaltenVorschlag, type Tabelle as DatenTabelle } from './erkennen';
import { ZIEL_PFAD, dateiLesen, fehlerTexte, importAusfuehren, importRueckgaengig, importe, pruefen, zusammenfassung, type ImportLauf, type Vorschau, type VorschauZeile } from './daten';

type Schritt = 'datei' | 'zuordnung' | 'vorschau' | 'fertig';

const ZEIGEN = 5;

export function Assistent() {
  useDatenstand();
  const toast = useToast();
  const [params] = useSearchParams();
  const vorgabe = ARTEN.find((a) => a.id === params.get('art'))?.id;
  const darfGeld = useDarf('geld');
  const darfPersonal = useDarf('personal');
  const darfSchreiben = useDarf('schreiben');
  const [schritt, setSchritt] = useState<Schritt>('datei');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const [dateiname, setDateiname] = useState('');
  const [tabelle, setTabelle] = useState<DatenTabelle>();
  const [art, setArt] = useState<ImportArt>(vorgabe ?? 'kunden');
  const [erkannt, setErkannt] = useState(false);
  const [spalten, setSpalten] = useState<SpaltenVorschlag[]>([]);
  const [korrigieren, setKorrigieren] = useState(false);
  const [vorschau, setVorschau] = useState<Vorschau>();
  const [lauf, setLauf] = useState<ImportLauf>();

  const erlaubt = (a: ImportArt) => {
    const d = artDef(a);
    return (!d.geld || darfGeld) && (!d.personal || darfPersonal);
  };
  const arten = ARTEN.filter((a) => erlaubt(a.id));

  const neuStarten = () => {
    setSchritt('datei');
    setTabelle(undefined);
    setVorschau(undefined);
    setLauf(undefined);
    setFehler(undefined);
    setKorrigieren(false);
  };

  const dateiGewaehlt = async (f: File | undefined) => {
    if (!f) return;
    setLaedt(true);
    setFehler(undefined);
    const r = await dateiLesen(f);
    setLaedt(false);
    if (!r.ok) {
      setFehler(r.fehler);
      return;
    }
    const treffer = artErkennen(r.tabelle, f.name).filter((t) => erlaubt(t.art));
    const gewaehlt = vorgabe && erlaubt(vorgabe) ? vorgabe : (treffer[0]?.art ?? 'kunden');
    setDateiname(f.name);
    setTabelle(r.tabelle);
    setArt(gewaehlt);
    setErkannt(!vorgabe && (treffer[0]?.punkte ?? 0) > 3);
    setSpalten(zuordnungVorschlagen(gewaehlt, r.tabelle));
    setKorrigieren(false);
    setSchritt('zuordnung');
  };

  const artWechseln = (a: ImportArt) => {
    setArt(a);
    setErkannt(false);
    if (tabelle) setSpalten(zuordnungVorschlagen(a, tabelle));
  };

  const zurVorschau = () => {
    if (!tabelle) return;
    setVorschau(pruefen(art, tabelle, zuordnungAus(spalten)));
    setSchritt('vorschau');
  };

  const uebernehmen = () => {
    if (!vorschau) return;
    try {
      const l = importAusfuehren(vorschau, { dateiname });
      setLauf(l);
      setSchritt('fertig');
      toast(`${zahl(l.angelegt.length + l.geaendert.length)} Einträge übernommen.`);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Übernahme hat nicht geklappt. Es wurde nichts geändert.');
    }
  };

  const def = artDef(art);

  if (!darfSchreiben)
    return (
      <Seite titel="Daten übernehmen">
        <Meldung ton="achtung" titel="Dafür fehlt dir ein Recht">Daten übernehmen darf, wer Einträge bearbeiten darf. Frag deinen Chef.</Meldung>
      </Seite>
    );

  return (
    <Seite
      titel="Daten übernehmen"
      untertitel="Kunden, Artikel, Preise oder offene Rechnungen aus Excel oder einem anderen Programm übernehmen."
      zurueck={{ to: '/betrieb/einstellungen/daten', label: 'Einstellungen' }}
    >
      <Stapel abstand={24}>
        {fehler && (
          <Meldung ton="achtung" titel="Das hat nicht geklappt">
            {fehler}
          </Meldung>
        )}

        {schritt === 'datei' && (
          <>
            <Karte titel={vorgabe ? `${artDef(vorgabe).label} aus Excel übernehmen` : 'Welche Datei möchtest du übernehmen?'}>
              {laedt ? (
                <Laden text="Macher liest die Datei …" />
              ) : (
                <Stapel>
                  <span className="mm-fenster" aria-hidden>
                    <FensterSkizze icon="import" />
                  </span>
                  <Meta>Excel (.xlsx) oder CSV. Die erste Zeile braucht Überschriften, darunter steht je Zeile ein Eintrag. Macher erkennt selbst, was drinsteht.</Meta>
                  <div>
                    <DateiKnopf variante="primaer" accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onDateien={([f]) => dateiGewaehlt(f)}>
                      Datei auswählen
                    </DateiKnopf>
                  </div>
                  <Meta>Das geht: {arten.map((a) => a.label).join(', ')}.</Meta>
                </Stapel>
              )}
            </Karte>
            <LetzteImporte />
          </>
        )}

        {schritt === 'zuordnung' && tabelle && (
          <>
            <Karte titel={erkannt ? `Macher hat ${def.label} erkannt` : `Die Datei enthält ${def.label}`} oberzeile={dateiname}>
              <Stapel>
                <Meta>
                  {zahl(tabelle.zeilen.length)} Zeilen, {zahl(tabelle.kopf.length)} Spalten. Prüf kurz, ob die Spalten richtig verstanden wurden.
                </Meta>
                <Auswahl label="Was steht in der Datei?" value={art} onChange={(e) => artWechseln(e.target.value as ImportArt)} optionen={arten.map((a) => ({ wert: a.id, label: `${a.label} – ${a.text}` }))} />
              </Stapel>
            </Karte>
            <Karte
              titel="So übernimmt Macher die Spalten"
              aktion={
                <Button klein variante="tertiaer" icon="stift" onClick={() => setKorrigieren(!korrigieren)}>
                  {korrigieren ? 'Fertig' : 'Zuordnung ändern'}
                </Button>
              }
            >
              <SpaltenListe spalten={spalten} art={art} korrigieren={korrigieren} onChange={setSpalten} />
            </Karte>
            {!spalten.some((s) => s.feld) && <Meldung ton="achtung" titel="Keine Spalte passt">Wähl oben eine andere Art oder ordne die Spalten selbst zu.</Meldung>}
            <Zeile>
              <Button onClick={zurVorschau} disabled={!spalten.some((s) => s.feld)}>
                Stimmt so – Vorschau zeigen
              </Button>
              <Button variante="tertiaer" onClick={neuStarten}>
                Andere Datei wählen
              </Button>
            </Zeile>
          </>
        )}

        {schritt === 'vorschau' && vorschau && (
          <VorschauAnsicht
            vorschau={vorschau}
            onZurueck={() => setSchritt('zuordnung')}
            onUebernehmen={uebernehmen}
          />
        )}

        {schritt === 'fertig' && lauf && vorschau && <Ergebnis lauf={lauf} vorschau={vorschau} onNochmal={neuStarten} />}
      </Stapel>
    </Seite>
  );
}

function SpaltenListe({ spalten, art, korrigieren, onChange }: { spalten: SpaltenVorschlag[]; art: ImportArt; korrigieren: boolean; onChange: (s: SpaltenVorschlag[]) => void }) {
  const def = artDef(art);
  const optionen = def.felder.map((f) => ({ wert: f.id, label: f.label }));
  return (
    <Liste>
      {spalten.map((s) => {
        const ziel = def.felder.find((f) => f.id === s.feld);
        return (
          <ListenZeile
            key={s.spalte}
            titel={
              <>
                {s.kopf} {ziel ? <>→ {ziel.label}</> : null}
              </>
            }
            untertitel={
              korrigieren ? (
                <span style={{ display: 'block', maxWidth: 360, marginTop: 4 }}>
                  <Auswahl
                    label={`Spalte „${s.kopf}“ übernehmen als`}
                    value={s.feld ?? ''}
                    leer="Nicht übernehmen"
                    optionen={optionen}
                    onChange={(e) => {
                      const feld = e.target.value || undefined;
                      onChange(spalten.map((x) => (x.spalte === s.spalte ? { ...x, feld, grund: feld ? 'name' : 'keine', satz: feld ? 'Von dir zugeordnet' : 'Wird nicht übernommen' } : feld && x.feld === feld ? { ...x, feld: undefined, grund: 'keine', satz: 'Wird nicht übernommen' } : x)));
                    }}
                  />
                </span>
              ) : (
                [s.satz, s.beispiel ? `z. B. „${s.beispiel}“` : ''].filter(Boolean).join(' · ')
              )
            }
            rechts={ziel ? <Status ton="erfolg">Wird übernommen</Status> : <Status>Nicht übernommen</Status>}
          />
        );
      })}
    </Liste>
  );
}

const STATUS_TEXT: Record<VorschauZeile['status'], { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' | 'achtung' }> = {
  neu: { text: 'Neu', ton: 'erfolg' },
  aktualisieren: { text: 'Wird ergänzt', ton: 'aktiv' },
  doppelt: { text: 'Doppelt', ton: 'neutral' },
  fehler: { text: 'Fehler', ton: 'achtung' },
};

function VorschauAnsicht({ vorschau, onZurueck, onUebernehmen }: { vorschau: Vorschau; onZurueck: () => void; onUebernehmen: () => void }) {
  const [alleFehler, setAlleFehler] = useState(false);
  const [alleDoppelt, setAlleDoppelt] = useState(false);
  const def = artDef(vorschau.art);
  const anzahl = vorschau.neu + vorschau.aktualisieren;
  const fehler = fehlerTexte(vorschau);
  const doppelt = vorschau.zeilen.filter((z) => z.status === 'doppelt');
  const ersteZeilen = useMemo(() => vorschau.zeilen.slice(0, ZEIGEN), [vorschau]);
  const mehrzahl = def.label.replace(/^Offene /, '');
  return (
    <>
      <Karte titel={zusammenfassung(vorschau)}>
        <Stapel>
          <Meta>
            {anzahl
              ? `${zahl(anzahl)} ${anzahl === 1 ? def.einzahl : mehrzahl} ${vorschau.art === 'preise' || vorschau.art === 'ansprechpartner' ? 'werden ergänzt' : 'werden neu angelegt'}.`
              : 'Es gibt nichts Neues zu übernehmen.'}
            {vorschau.doppelt ? ` ${vorschau.doppelt === 1 ? 'Eine doppelte Zeile' : `${zahl(vorschau.doppelt)} doppelte Zeilen`} lässt Macher weg.` : ''}
            {vorschau.fehler ? ` ${vorschau.fehler === 1 ? 'Eine Zeile mit Fehler wird' : `${zahl(vorschau.fehler)} Zeilen mit Fehler werden`} übersprungen – du kannst sie später nachtragen.` : ''}
            {vorschau.neueKunden ? ` Dafür legt Macher ${zahl(vorschau.neueKunden)} Kunden neu an.` : ''}
          </Meta>
          <Tabelle
            zeilen={ersteZeilen}
            schluessel={(z) => String(z.zeile)}
            spalten={[
              { titel: 'Zeile', wert: (z) => z.zeile, zahl: true },
              { titel: def.einzahl, wert: (z) => <strong>{z.titel}</strong> },
              { titel: 'Angaben', wert: (z) => z.info ?? '–', nebensaechlich: true },
              { titel: 'Stand', wert: (z) => <Status ton={STATUS_TEXT[z.status].ton}>{STATUS_TEXT[z.status].text}</Status> },
            ]}
          />
          {vorschau.zeilen.length > ZEIGEN && <Meta>Die ersten {ZEIGEN} von {zahl(vorschau.zeilen.length)} Zeilen.</Meta>}
        </Stapel>
      </Karte>

      {fehler.length > 0 && (
        <Karte titel={fehler.length === 1 ? '1 Zeile mit Fehler' : `${zahl(fehler.length)} Zeilen mit Fehler`}>
          <Stapel abstand={8}>
            {(alleFehler ? fehler : fehler.slice(0, ZEIGEN)).map((f) => (
              <Meta key={f}>{f}</Meta>
            ))}
            {fehler.length > ZEIGEN && (
              <div>
                <Button klein variante="tertiaer" onClick={() => setAlleFehler(!alleFehler)}>
                  {alleFehler ? 'Weniger zeigen' : `Alle ${zahl(fehler.length)} zeigen`}
                </Button>
              </div>
            )}
          </Stapel>
        </Karte>
      )}

      {doppelt.length > 0 && (
        <Karte titel={`${zahl(doppelt.length)} doppelt – werden weggelassen`}>
          <Stapel abstand={8}>
            {(alleDoppelt ? doppelt : doppelt.slice(0, ZEIGEN)).map((z) => (
              <Meta key={z.zeile}>
                Zeile {z.zeile}: {z.titel} – {z.hinweis}
              </Meta>
            ))}
            {doppelt.length > ZEIGEN && (
              <div>
                <Button klein variante="tertiaer" onClick={() => setAlleDoppelt(!alleDoppelt)}>
                  {alleDoppelt ? 'Weniger zeigen' : `Alle ${zahl(doppelt.length)} zeigen`}
                </Button>
              </div>
            )}
          </Stapel>
        </Karte>
      )}

      <Zeile>
        <Button onClick={onUebernehmen} disabled={!anzahl}>
          {anzahl ? `${zahl(anzahl)} ${anzahl === 1 ? def.einzahl : mehrzahl} übernehmen` : 'Nichts zu übernehmen'}
        </Button>
        <Button variante="tertiaer" onClick={onZurueck}>
          Zurück zur Zuordnung
        </Button>
      </Zeile>
      <Meta>Du kannst den ganzen Import danach mit einem Klick rückgängig machen.</Meta>
    </>
  );
}

function Ergebnis({ lauf, vorschau, onNochmal }: { lauf: ImportLauf; vorschau: Vorschau; onNochmal: () => void }) {
  const toast = useToast();
  const [fragen, bestaetigen] = useBestaetigen();
  const aktuell = importe.useOne(lauf.id) ?? lauf;
  const def = artDef(lauf.art);
  const fehler = fehlerTexte(vorschau);
  const zurueck = async () => {
    if (!(await fragen('Import rückgängig machen?', 'Alles, was dieser Import angelegt hat, kommt in den Papierkorb. Geänderte Preise und Ansprechpartner bekommen ihren alten Stand zurück.', 'Rückgängig machen'))) return;
    const r = importRueckgaengig(lauf.id);
    toast(`Import rückgängig gemacht: ${zahl(r.entfernt + r.zurueck)} Einträge zurückgenommen.`);
  };
  return (
    <>
      {aktuell.rueckgaengigAm ? (
        <Meldung titel="Import rückgängig gemacht">Die übernommenen Einträge liegen im Papierkorb.</Meldung>
      ) : (
        <Meldung ton="erfolg" titel={`${zahl(lauf.angelegt.length + lauf.geaendert.length)} Einträge übernommen`}>
          {lauf.angelegt.length ? `${zahl(lauf.angelegt.length)} neu angelegt. ` : ''}
          {lauf.geaendert.length ? `${zahl(lauf.geaendert.length)} ergänzt. ` : ''}
          {lauf.doppelt ? `${zahl(lauf.doppelt)} ${lauf.doppelt === 1 ? 'doppelte Zeile' : 'doppelte Zeilen'} weggelassen. ` : ''}
          {lauf.fehler ? `${zahl(lauf.fehler)} ${lauf.fehler === 1 ? 'Zeile' : 'Zeilen'} mit Fehler übersprungen.` : ''}
        </Meldung>
      )}
      {fehler.length > 0 && !aktuell.rueckgaengigAm && (
        <Karte titel="Diese Zeilen fehlen noch">
          <Stapel abstand={8}>
            {fehler.slice(0, 20).map((f) => (
              <Meta key={f}>{f}</Meta>
            ))}
            {fehler.length > 20 && <Meta>… und {zahl(fehler.length - 20)} weitere.</Meta>}
            <Meta>Korrigier die Zeilen in deiner Datei und übernimm sie noch einmal – was schon da ist, erkennt Macher als doppelt.</Meta>
          </Stapel>
        </Karte>
      )}
      <Zeile>
        <Button to={ZIEL_PFAD[lauf.art]}>{def.label.replace(/^Offene /, '')} ansehen</Button>
        {!aktuell.rueckgaengigAm && (
          <Button variante="sekundaer" icon="wiederholen" onClick={zurueck}>
            Rückgängig machen
          </Button>
        )}
        <Button variante="tertiaer" onClick={onNochmal}>
          Weitere Datei übernehmen
        </Button>
      </Zeile>
      {bestaetigen}
    </>
  );
}

function LetzteImporte() {
  const toast = useToast();
  const [fragen, bestaetigen] = useBestaetigen();
  const liste = [...importe.use()].sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm)).slice(0, 3);
  if (!liste.length)
    return <Leer skizze icon="upload" titel="Noch nichts übernommen" text="Hier siehst du später, was du übernommen hast – und kannst es mit einem Klick zurücknehmen." />;
  const zurueck = async (l: ImportLauf) => {
    if (!(await fragen('Import rückgängig machen?', 'Alles, was dieser Import angelegt hat, kommt in den Papierkorb. Geänderte Einträge bekommen ihren alten Stand zurück.', 'Rückgängig machen'))) return;
    const r = importRueckgaengig(l.id);
    toast(`Import rückgängig gemacht: ${zahl(r.entfernt + r.zurueck)} Einträge zurückgenommen.`);
  };
  return (
    <Karte titel="Zuletzt übernommen">
      <Liste>
        {liste.map((l) => (
          <ListenZeile
            key={l.id}
            titel={`${artDef(l.art).label}: ${zahl(l.angelegt.length + l.geaendert.length)} Einträge`}
            untertitel={[l.dateiname, `${datum(l.erstelltAm)}, ${uhrzeit(l.erstelltAm)}`].filter(Boolean).join(' · ')}
            rechts={
              l.rueckgaengigAm ? (
                <Status>Rückgängig gemacht</Status>
              ) : (
                <Button klein variante="tertiaer" onClick={() => zurueck(l)}>
                  Rückgängig
                </Button>
              )
            }
          />
        ))}
      </Liste>
      {bestaetigen}
    </Karte>
  );
}
