/** Büro-Ansicht: selbst gebuchte Termine bestätigen, Buchungslink teilen, Terminarten pflegen. */
import { useEffect, useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { datumKurz, uhrzeit } from '@core/format';
import type { TerminArt } from '@core/objects';
import { useDarf } from '@core/session';
import {
  Abschnitt,
  Auswahl,
  Button,
  Checkbox,
  Dialog,
  Eingabe,
  FensterSkizze,
  FormRaster,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meta,
  Schalter,
  Seite,
  Stapel,
  Status,
  Textfeld,
  Zeile,
  useBestaetigen,
  useToast,
} from '@ui/index';
import { Person, Personen } from '@ui/person';
import { TERMINART_LABEL } from '../kalender/daten';
import { buchungsfenster, buchungsToken, buchungsUrl, slotsFuer, zuBestaetigen, type Buchungsfenster } from './daten';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const terminPfad = (id: string) => `/plan/kalender/termin/${id}`;

/** Link in die Zwischenablage – mit Rückmeldung, auch wenn der Browser es nicht erlaubt */
export function useLinkKopieren() {
  const toast = useToast();
  return async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link kopiert. Du kannst ihn jetzt per E-Mail, WhatsApp oder auf deiner Website teilen.');
    } catch {
      toast(`Kopieren nicht möglich. Dein Link: ${url}`, { ton: 'achtung' });
    }
  };
}

function wochentageText(w: number[]) {
  const s = [...w].sort();
  if (s.join() === '1,2,3,4,5') return 'Mo–Fr';
  if (s.join() === '1,2,3,4,5,6') return 'Mo–Sa';
  return s.map((d) => WOCHENTAGE[d - 1]).join(', ');
}

export function Terminbuchung() {
  useDatenstand();
  const toast = useToast();
  const kopieren = useLinkKopieren();
  const darfPlanen = useDarf('planen');
  const [bearbeiten, setBearbeiten] = useState<Buchungsfenster | 'neu'>();
  const fenster = buchungsfenster.all().sort((a, b) => Number(b.aktiv) - Number(a.aktiv) || a.name.localeCompare(b.name, 'de'));
  const offen = zuBestaetigen(db.termine.all());
  const [link, setLink] = useState('');
  // Token erst nach dem Rendern anlegen (schreibt eine Einstellung)
  useEffect(() => setLink(buchungsUrl(buchungsToken())), []);

  return (
    <Seite
      titel="Terminbuchung"
      untertitel="Kunden buchen freie Termine selbst. Du bestätigst nur noch."
      aktion={darfPlanen ? <Button icon="plus" onClick={() => setBearbeiten('neu')}>Terminart anlegen</Button> : undefined}
    >
      <Abschnitt titel={offen.length ? `Bitte bestätigen (${offen.length})` : 'Bitte bestätigen'}>
        <Liste leer={<Meta>Keine offenen Buchungen. Neue Online-Buchungen erscheinen hier und unter „Braucht dich“.</Meta>}>
          {offen.map((t) => (
            <ListenZeile
              key={t.id}
              to={terminPfad(t.id)}
              titel={t.titel}
              untertitel={
                <>
                  {datumKurz(t.start)}, {uhrzeit(t.start)}–{uhrzeit(t.ende)} Uhr · {t.mitarbeiterIds.length ? <Personen ids={t.mitarbeiterIds} namen /> : 'Noch niemand'}
                </>
              }
              rechts={<Status ton="aktiv">Vom Kunden gebucht</Status>}
            />
          ))}
        </Liste>
        {offen.length > 0 && darfPlanen && (
          <div>
            <Button
              variante="sekundaer"
              icon="check"
              onClick={() => {
                offen.forEach((t) => db.termine.update(t.id, { status: 'bestaetigt' }, { text: 'Bestätigt' }));
                toast(offen.length === 1 ? 'Termin bestätigt.' : `${offen.length} Termine bestätigt.`);
              }}
            >
              Alle bestätigen
            </Button>
          </div>
        )}
      </Abschnitt>

      <Karte titel="Dein Buchungslink" oberzeile="Für Website, E-Mail-Signatur und WhatsApp">
        <Stapel abstand={12}>
          <span className="mm-fenster" aria-hidden>
            <FensterSkizze icon="kalender" rahmen="handy" />
          </span>
          <Meta>Über diesen Link sehen Kunden freie Termine und buchen selbst. Neue Kunden legt Macher automatisch an, bekannte erkennt es an Telefon oder E-Mail.</Meta>
          <code style={{ wordBreak: 'break-all', fontSize: 14 }}>{link}</code>
          <Zeile>
            <Button icon="link" onClick={() => kopieren(link)}>
              Link kopieren
            </Button>
            <a className="mm-btn mm-btn--tertiaer" href={link} target="_blank" rel="noreferrer">
              Wie Kunden es sehen
            </a>
          </Zeile>
          <Meta>Für einen bestimmten Kunden kopierst du den Link direkt beim Kunden – dann muss er seine Daten nicht eintippen.</Meta>
        </Stapel>
      </Karte>

      <Abschnitt titel="Buchbare Terminarten">
        <Liste
          leer={
            <Leer
              titel="Noch keine Terminart"
              text="Leg fest, was Kunden buchen dürfen – z. B. Besichtigung, 60 Minuten, Mo–Fr 8–15 Uhr."
              icon="kalender"
              aktion={darfPlanen ? <Button onClick={() => setBearbeiten('neu')}>Terminart anlegen</Button> : undefined}
            />
          }
        >
          {fenster.map((f) => {
            const naechster = f.aktiv ? slotsFuer(f)[0] : undefined;
            return (
              <ListenZeile
                key={f.id}
                onClick={darfPlanen ? () => setBearbeiten(f) : undefined}
                titel={f.name}
                untertitel={[
                  `${f.dauerMinuten} min`,
                  `${wochentageText(f.wochentage)} ${f.von}–${f.bis} Uhr`,
                  f.aktiv ? (naechster ? `nächster freier Termin ${datumKurz(naechster.start)}, ${uhrzeit(naechster.start)} Uhr` : 'gerade nichts frei') : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                rechts={f.aktiv ? <Status ton="erfolg">Buchbar</Status> : <Status>Pausiert</Status>}
              />
            );
          })}
        </Liste>
      </Abschnitt>

      <Dialog offen={!!bearbeiten} onSchliessen={() => setBearbeiten(undefined)} titel={bearbeiten === 'neu' ? 'Terminart anlegen' : 'Terminart bearbeiten'} breit>
        <FensterFormular fenster={bearbeiten === 'neu' ? undefined : bearbeiten} onFertig={() => setBearbeiten(undefined)} />
      </Dialog>
    </Seite>
  );
}

function FensterFormular({ fenster, onFertig }: { fenster?: Buchungsfenster; onFertig: () => void }) {
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  const [f, setF] = useState(() => ({
    name: fenster?.name ?? '',
    beschreibung: fenster?.beschreibung ?? '',
    art: fenster?.art ?? ('besichtigung' as TerminArt),
    dauerMinuten: fenster?.dauerMinuten ?? 60,
    wochentage: fenster?.wochentage ?? [1, 2, 3, 4, 5],
    von: fenster?.von ?? '08:00',
    bis: fenster?.bis ?? '15:00',
    vorlaufStunden: fenster?.vorlaufStunden ?? 24,
    horizontTage: fenster?.horizontTage ?? 21,
    pufferMinuten: fenster?.pufferMinuten ?? 30,
    mitarbeiterIds: fenster?.mitarbeiterIds ?? [],
    aktiv: fenster?.aktiv ?? true,
  }));
  const [fehler, setFehler] = useState<{ name?: string; zeit?: string; tage?: string }>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const speichern = () => {
    const neu: typeof fehler = {};
    if (!f.name.trim()) neu.name = 'Gib der Terminart einen Namen, z. B. „Besichtigung“.';
    if (f.bis <= f.von) neu.zeit = '„Bis“ muss nach „Von“ liegen.';
    if (!f.wochentage.length) neu.tage = 'Wähle mindestens einen Tag.';
    setFehler(neu);
    if (Object.keys(neu).length) return;
    const daten = { ...f, name: f.name.trim(), beschreibung: f.beschreibung.trim() || undefined };
    if (fenster) buchungsfenster.update(fenster.id, daten);
    else buchungsfenster.create(daten);
    toast(fenster ? 'Terminart gespeichert.' : 'Terminart angelegt. Kunden können sie jetzt buchen.');
    onFertig();
  };

  const zahlAuswahl = (label: string, k: 'dauerMinuten' | 'vorlaufStunden' | 'horizontTage' | 'pufferMinuten', optionen: [number, string][], hilfe?: string) => (
    <Auswahl label={label} hilfe={hilfe} value={String(f[k])} onChange={(e) => set(k, Number(e.target.value))} optionen={optionen.map(([w, l]) => ({ wert: String(w), label: l }))} />
  );

  return (
    <form
      className="mm-stapel"
      style={{ gap: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        speichern();
      }}
    >
      <FormRaster>
        <Eingabe label="Name für Kunden" value={f.name} onChange={(e) => set('name', e.target.value)} fehler={fehler.name} placeholder="z. B. Besichtigung vor Ort" />
        <Auswahl label="Art im Kalender" value={f.art} onChange={(e) => set('art', e.target.value as TerminArt)} optionen={(['besichtigung', 'einsatz', 'wartung'] as TerminArt[]).map((a) => ({ wert: a, label: TERMINART_LABEL[a] }))} />
      </FormRaster>
      <Textfeld label="Kurze Beschreibung" optional value={f.beschreibung} onChange={(e) => set('beschreibung', e.target.value)} />
      <FormRaster>
        {zahlAuswahl('Dauer', 'dauerMinuten', [[30, '30 Minuten'], [60, '1 Stunde'], [90, '1,5 Stunden'], [120, '2 Stunden'], [180, '3 Stunden']])}
        {zahlAuswahl('Puffer für Fahrt', 'pufferMinuten', [[0, 'Kein Puffer'], [15, '15 Minuten'], [30, '30 Minuten'], [60, '1 Stunde']], 'Abstand zu anderen Terminen')}
      </FormRaster>
      <div className="mm-feld">
        <span className="mm-label">Buchbare Tage</span>
        <Zeile>
          {WOCHENTAGE.map((w, i) => (
            <Checkbox key={w} label={w} checked={f.wochentage.includes(i + 1)} onChange={(an) => set('wochentage', an ? [...f.wochentage, i + 1].sort() : f.wochentage.filter((x) => x !== i + 1))} />
          ))}
        </Zeile>
        {fehler.tage && <p className="mm-fehlertext">{fehler.tage}</p>}
      </div>
      <FormRaster>
        <Eingabe label="Von" type="time" step={900} value={f.von} onChange={(e) => set('von', e.target.value)} fehler={fehler.zeit} />
        <Eingabe label="Bis" type="time" step={900} value={f.bis} onChange={(e) => set('bis', e.target.value)} hilfe="Innerhalb deiner Betriebsarbeitszeit" />
        {zahlAuswahl('Frühestens', 'vorlaufStunden', [[2, '2 Stunden vorher'], [24, '1 Tag vorher'], [48, '2 Tage vorher'], [72, '3 Tage vorher']])}
        {zahlAuswahl('Höchstens', 'horizontTage', [[7, '1 Woche im Voraus'], [14, '2 Wochen im Voraus'], [21, '3 Wochen im Voraus'], [28, '4 Wochen im Voraus'], [56, '8 Wochen im Voraus']])}
      </FormRaster>
      <div className="mm-feld">
        <span className="mm-label">Wer übernimmt diese Termine?</span>
        <Meta>Nichts gewählt = alle Monteure und der Chef. Macher nimmt, wer in der Woche am wenigsten verplant ist.</Meta>
        {mitarbeiter.map((m) => (
          <Checkbox key={m.id} label={<Person m={m} />} checked={f.mitarbeiterIds.includes(m.id)} onChange={(an) => set('mitarbeiterIds', an ? [...f.mitarbeiterIds, m.id] : f.mitarbeiterIds.filter((x) => x !== m.id))} />
        ))}
      </div>
      <Schalter label="Online buchbar" beschreibung="Aus = Terminart pausiert, der Link zeigt sie nicht an." checked={f.aktiv} onChange={(v) => set('aktiv', v)} />
      <Zeile zwischen>
        {fenster ? (
          <Button
            variante="gefahr"
            icon="muell"
            onClick={async () => {
              if (!(await fragen('Terminart löschen?', `„${fenster.name}“ kann danach nicht mehr gebucht werden. Bereits gebuchte Termine bleiben.`, 'Löschen'))) return;
              buchungsfenster.remove(fenster.id);
              toast('Terminart gelöscht.', { ton: 'neutral', aktion: { label: 'Rückgängig', onClick: () => buchungsfenster.restore(fenster.id) } });
              onFertig();
            }}
          >
            Löschen
          </Button>
        ) : (
          <span />
        )}
        <Zeile>
          <Button variante="tertiaer" onClick={onFertig}>
            Abbrechen
          </Button>
          <Button type="submit">{fenster ? 'Speichern' : 'Terminart anlegen'}</Button>
        </Zeile>
      </Zeile>
      {bestaetigung}
    </form>
  );
}

/** Panel am Kunden: persönlichen Buchungslink kopieren */
export function KundenBuchungPanel({ id }: { id: string }) {
  const kopieren = useLinkKopieren();
  const aktiv = buchungsfenster.use((f) => f.aktiv).length > 0;
  if (!aktiv) return null;
  return (
    <Karte titel="Online-Termin" kompakt>
      <Stapel abstand={8}>
        <Meta>Schick dem Kunden seinen Link – er sieht freie Termine und bucht selbst.</Meta>
        <div>
          <Button variante="sekundaer" icon="link" klein onClick={() => kopieren(buchungsUrl(buchungsToken(id)))}>
            Buchungslink kopieren
          </Button>
        </div>
      </Stapel>
    </Karte>
  );
}
