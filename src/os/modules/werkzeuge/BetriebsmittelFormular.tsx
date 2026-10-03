import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { centAlsEingabe, centAus } from '@core/format';
import type { Betriebsmittel, BetriebsmittelArt } from '@core/objects';
import { Auswahl, Button, Eingabe, FormRaster, Karte, Leer, Segmente, Seite, Stapel, Textfeld, useBestaetigen, useToast } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { PRUEFARTEN } from '../pruefungen/daten';
import { ART_LABEL, ART_MODUL, bmx, fahrzeuge, fahrzeugStandort, type BetriebsmittelX } from './daten';

const ARTEN: BetriebsmittelArt[] = ['werkzeug', 'maschine', 'fahrzeug'];

/** Anlegen (`/betrieb/werkzeuge/neu?art=…`) und Bearbeiten (`/betrieb/werkzeuge/:id/bearbeiten`) */
export function BetriebsmittelFormular() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const vorhanden = db.betriebsmittel.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const startArt = (vorhanden?.art ?? (ARTEN.includes(params.get('art') as BetriebsmittelArt) ? params.get('art') : 'werkzeug')) as BetriebsmittelArt;
  const v = vorhanden ? bmx(vorhanden) : undefined;
  const [art, setArt] = useState<BetriebsmittelArt>(startArt);
  const [f, setF] = useState({
    name: v?.name ?? '',
    nummer: (startArt === 'fahrzeug' ? v?.kennzeichen : v?.inventarnummer) ?? '',
    hersteller: v?.hersteller ?? '',
    seriennummer: v?.seriennummer ?? '',
    pruefungArt: v?.pruefungArt ?? '',
    naechstePruefung: v?.naechstePruefung ?? '',
    standort: v?.standort ?? (vorhanden ? '' : 'Lager'),
    mitarbeiterId: v?.mitarbeiterId ?? '',
    anschaffungAm: v?.anschaffungAm ?? '',
    anschaffungspreis: centAlsEingabe(v?.anschaffungspreis),
    kilometerstand: v?.kilometerstand != null ? String(v.kilometerstand) : '',
    notiz: v?.notiz ?? '',
  });
  const [fehler, setFehler] = useState<string>();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  if (id && !vorhanden)
    return (
      <Seite titel="Nicht gefunden" zurueck={{ to: '/betrieb/werkzeuge', label: 'Werkzeuge' }}>
        <Leer titel="Dieses Gerät gibt es nicht (mehr)." icon="werkzeug" />
      </Seite>
    );

  const speichern = () => {
    if (!f.name.trim()) return setFehler('Trage eine Bezeichnung ein.');
    const km = f.kilometerstand ? Number(f.kilometerstand.replace(/\D/g, '')) : undefined;
    const daten: Partial<BetriebsmittelX> = {
      art,
      name: f.name.trim(),
      inventarnummer: art !== 'fahrzeug' ? f.nummer.trim() || undefined : v?.inventarnummer,
      kennzeichen: art === 'fahrzeug' ? f.nummer.trim().toUpperCase() || undefined : undefined,
      hersteller: f.hersteller.trim() || undefined,
      seriennummer: f.seriennummer.trim() || undefined,
      pruefungArt: f.pruefungArt || undefined,
      naechstePruefung: f.naechstePruefung || undefined,
      standort: f.standort.trim() || undefined,
      mitarbeiterId: f.mitarbeiterId || undefined,
      anschaffungAm: f.anschaffungAm || undefined,
      anschaffungspreis: f.anschaffungspreis ? centAus(f.anschaffungspreis) : undefined,
      kilometerstand: art === 'fahrzeug' && Number.isFinite(km) ? km : undefined,
      notiz: f.notiz.trim() || undefined,
    };
    if (vorhanden) {
      const status: Betriebsmittel['status'] =
        vorhanden.status === 'im_einsatz' && !daten.mitarbeiterId ? 'verfuegbar' : vorhanden.status === 'verfuegbar' && daten.mitarbeiterId ? 'im_einsatz' : vorhanden.status;
      db.betriebsmittel.update(vorhanden.id, { ...daten, status });
      toast('Änderungen gespeichert.');
      navigate(`/betrieb/werkzeuge/${vorhanden.id}`, { replace: true });
    } else {
      const neu = db.betriebsmittel.create({ ...(daten as Betriebsmittel), status: daten.mitarbeiterId ? 'im_einsatz' : 'verfuegbar' });
      toast(`${ART_LABEL[art]} angelegt.`);
      navigate(`/betrieb/werkzeuge/${neu.id}`, { replace: true });
    }
  };

  const ausmustern = async () => {
    if (!vorhanden) return;
    if (!(await fragen('Ausmustern?', `${vorhanden.name} taucht dann nicht mehr in Listen und Prüffristen auf. Der Verlauf bleibt erhalten.`, 'Ausmustern'))) return;
    db.betriebsmittel.update(vorhanden.id, { status: 'ausgemustert', mitarbeiterId: undefined }, { text: 'Ausgemustert' });
    toast(`${vorhanden.name} ist ausgemustert.`);
    navigate(ART_MODUL[vorhanden.art], { replace: true });
  };

  const zurueck = vorhanden ? { to: `/betrieb/werkzeuge/${vorhanden.id}`, label: vorhanden.name } : { to: ART_MODUL[art], label: 'Zurück' };
  const orte = ['Lager', 'Werkstatt', ...fahrzeuge().filter((x) => x.id !== vorhanden?.id).map(fahrzeugStandort)];

  return (
    <Seite titel={vorhanden ? `${vorhanden.name} bearbeiten` : `${ART_LABEL[art]} anlegen`} zurueck={zurueck}>
      {bestaetigung}
      <Karte>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <Stapel abstand={24}>
            {!vorhanden && <Segmente label="Art" wert={art} onChange={setArt} optionen={ARTEN.map((a) => ({ wert: a, label: ART_LABEL[a] }))} />}
            <FormRaster>
              <Eingabe label="Bezeichnung" value={f.name} onChange={set('name')} fehler={fehler} autoFocus={!vorhanden} placeholder={art === 'fahrzeug' ? 'z. B. VW Crafter' : art === 'maschine' ? 'z. B. Bohrhammer SDS-max' : 'z. B. Installationstester'} />
              <Eingabe label={art === 'fahrzeug' ? 'Kennzeichen' : 'Inventarnummer'} value={f.nummer} onChange={set('nummer')} optional placeholder={art === 'fahrzeug' ? 'KS-MO 101' : 'W-014'} />
              <Eingabe label="Hersteller" value={f.hersteller} onChange={set('hersteller')} optional />
              <Eingabe label={art === 'fahrzeug' ? 'Fahrgestellnummer' : 'Seriennummer'} value={f.seriennummer} onChange={set('seriennummer')} optional />
              <Auswahl label="Prüfung" value={f.pruefungArt} onChange={set('pruefungArt')} leer="Keine Prüfpflicht" optional optionen={[...new Set([...PRUEFARTEN.map((p) => p.art), ...(f.pruefungArt ? [f.pruefungArt] : [])])].map((p) => ({ wert: p, label: p }))} />
              <Eingabe label="Nächste Prüfung" type="date" value={f.naechstePruefung} onChange={set('naechstePruefung')} optional hilfe="Steht auf der Prüfplakette" />
              <MitarbeiterAuswahl label={art === 'fahrzeug' ? 'Fahrer' : 'Ausgegeben an'} wert={f.mitarbeiterId} onChange={(m) => setF({ ...f, mitarbeiterId: m })} optional />
              {art === 'fahrzeug' ? (
                <Eingabe label="Kilometerstand" inputMode="numeric" value={f.kilometerstand} onChange={set('kilometerstand')} optional />
              ) : (
                <Eingabe label="Standort" vorschlaege={orte} value={f.standort} onChange={set('standort')} optional hilfe="Lager, Werkstatt oder Kennzeichen eines Fahrzeugs" />
              )}
              <Eingabe label="Angeschafft am" type="date" value={f.anschaffungAm} onChange={set('anschaffungAm')} optional />
              <Eingabe label="Anschaffungspreis netto (€)" inputMode="decimal" value={f.anschaffungspreis} onChange={set('anschaffungspreis')} optional />
            </FormRaster>
            <Textfeld label="Notiz" value={f.notiz} onChange={set('notiz')} optional />
            <div className="mm-zeile" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <Button type="submit">{vorhanden ? 'Änderungen speichern' : `${ART_LABEL[art]} speichern`}</Button>
              {vorhanden && (
                <Button variante="tertiaer" icon="muell" onClick={ausmustern}>
                  Ausmustern
                </Button>
              )}
            </div>
          </Stapel>
        </form>
      </Karte>
    </Seite>
  );
}
