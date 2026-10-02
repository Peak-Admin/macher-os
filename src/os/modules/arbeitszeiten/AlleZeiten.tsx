import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, datumKurz, heute, personName } from '@core/format';
import type { ID, Zeiteintrag } from '@core/objects';
import { istBuero, useDarf, useIch } from '@core/session';
import { Auswahl, Button, Dialog, Eingabe, Filter, FormRaster, IconButton, Leer, Meldung, Meta, Seite, Stapel, Status, Tabelle, Zeile, useToast } from '@ui/index';
import { useSchmal } from '@modules/kalender/hooks';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { dateiname, filterAnzahl, filterAus, filterZu, istAktuell, summeMinuten, verschieben, zeitenFiltern, zeitraumText, zeitraumWechseln, type ZeitArt, type ZeitenFilter, type ZeitraumArt } from './alle';
import { ART_LABEL, csvExport, dauer, herunterladen, stunden } from './daten';
import { ZeitDialog } from './ZeitDialog';
import { ZeitenNav } from './ZeitenNav';

const auftragText = (id: ID | undefined) => {
  const a = db.auftraege.get(id);
  return a ? `${a.nummer} · ${a.titel}` : '';
};

/**
 * Alle Zeiten (Chef/Büro): jede erfasste Zeit im gewählten Zeitraum mit Summe, Filter in der URL,
 * Download als CSV für Excel. Offene Urlaubsanträge stehen oben als ruhiger Hinweis (Exception-First).
 */
export function AlleZeiten() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const buero = istBuero(ich) || personal;
  const toast = useToast();
  const schmal = useSchmal();
  const [params, setParams] = useSearchParams();
  const [filterOffen, setFilterOffen] = useState(false);
  const [dialog, setDialog] = useState<{ eintrag?: Zeiteintrag } | null>(null);
  const t = heute();
  const f = filterAus(params, t);
  const setze = (neu: ZeitenFilter) => setParams(filterZu(neu, t), { replace: true });

  if (!buero)
    return (
      <Seite titel="Alle Zeiten">
        <ZeitenNav aktiv="alle" />
        <Leer titel="Das macht das Büro" text="Die Zeiten aller Mitarbeiter sehen Chef und Büro. Deine eigenen Zeiten siehst du in der Woche." icon="schloss" aktion={<Button to="/betrieb/arbeitszeiten/woche">Zu meiner Woche</Button>} />
      </Seite>
    );

  const imZeitraum = zeitenFiltern(db.zeiten.all(), { ...f, ma: '', auftrag: '', art: '' });
  const liste = zeitenFiltern(imZeitraum, f);
  const summe = summeMinuten(liste);
  const laufen = liste.filter((z) => !z.ende).length;
  const antraege = personal ? db.abwesenheiten.where((a) => a.status === 'beantragt' && a.bis >= t).length : 0;
  const gleichesJahr = f.von.slice(0, 4) === f.bis.slice(0, 4);

  const leute = sortiert(db.mitarbeiter.where((m) => istAktiv(m) || m.id === f.ma || imZeitraum.some((z) => z.mitarbeiterId === m.id)));
  const auftragIds = [...new Set([...imZeitraum.map((z) => z.auftragId), f.auftrag].filter((x): x is ID => !!x))];
  const auftraege = auftragIds
    .map((id) => ({ wert: id, label: auftragText(id) }))
    .filter((a) => a.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));

  const zeitEintragen = () => setDialog({});
  const vorgabe = { datum: istAktuell(f, t) ? t : f.bis < t ? f.bis : t, mitarbeiterId: f.ma || ich?.id, auftragId: f.auftrag || undefined };

  const laden = () => {
    const fertig = liste.filter((z) => z.ende);
    if (!fertig.length) return toast('In dieser Auswahl gibt es keine abgeschlossenen Zeiten.', { ton: 'achtung' });
    herunterladen(dateiname(f), csvExport(fertig, (id) => db.mitarbeiter.get(id), auftragText));
    toast(`${fertig.length === 1 ? '1 Zeit' : `${fertig.length} Zeiten`} heruntergeladen. Die Datei öffnet sich direkt in Excel.`, { ton: 'erfolg' });
  };

  const felder = (
    <FilterFelder f={f} setze={setze} leute={leute.map((m) => ({ wert: m.id, label: personName(m) }))} auftraege={auftraege} schmal={schmal} />
  );
  const anzahl = filterAnzahl(f);
  const herunterladenKnopf = (
    <Button variante="sekundaer" klein icon="download" onClick={laden}>
      Herunterladen
    </Button>
  );

  return (
    <Seite titel="Alle Zeiten" untertitel={zeitraumText(f)} aktion={<Button icon="plus" onClick={zeitEintragen}>Zeit eintragen</Button>}>
      <ZeitenNav aktiv="alle" />

      {antraege > 0 && (
        <Meldung titel={antraege === 1 ? '1 offener Urlaubsantrag' : `${antraege} offene Urlaubsanträge`}>
          <Stapel abstand={8}>
            <span>Genehmigen oder ablehnen geht mit einem Tap.</span>
            <div>
              <Button klein variante="sekundaer" to="/betrieb/abwesenheiten">
                Anträge ansehen
              </Button>
            </div>
          </Stapel>
        </Meldung>
      )}

      <Stapel abstand={12}>
        <Zeile zwischen>
          <Zeile abstand={12}>
            {!schmal && <ZeitraumWahl f={f} setze={setze} />}
            {f.zeitraum !== 'frei' && (
              <Zeile abstand={4} umbruch={false}>
                <IconButton icon="zurueck" label={f.zeitraum === 'woche' ? 'Woche davor' : 'Monat davor'} onClick={() => setze(verschieben(f, -1))} />
                <Button klein variante="tertiaer" disabled={istAktuell(f, t)} onClick={() => setze(zeitraumWechseln({ ...f, von: t, bis: t }, f.zeitraum, t))}>
                  {f.zeitraum === 'woche' ? 'Diese Woche' : 'Dieser Monat'}
                </Button>
                <IconButton icon="weiter" label={f.zeitraum === 'woche' ? 'Woche danach' : 'Monat danach'} onClick={() => setze(verschieben(f, 1))} />
              </Zeile>
            )}
          </Zeile>
          <Zeile abstand={8}>
            {schmal && (
              <Button variante="sekundaer" klein icon="filter" onClick={() => setFilterOffen(true)}>
                {anzahl ? `Filter (${anzahl})` : 'Filter'}
              </Button>
            )}
            {herunterladenKnopf}
          </Zeile>
        </Zeile>
        {!schmal && felder}
      </Stapel>

      <Stapel abstand={8}>
        <Zeile zwischen>
          <strong>{liste.length === 1 ? '1 Eintrag' : `${liste.length} Einträge`}</strong>
          <strong>Summe {stunden(summe)}</strong>
        </Zeile>
        <Tabelle
          zeilen={liste}
          schluessel={(z) => z.id}
          onZeile={(z) => setDialog({ eintrag: z })}
          leer={
            <Leer
              titel="Keine Zeiten für diese Auswahl"
              text={anzahl ? 'Nimm einen Filter heraus oder wähle einen anderen Zeitraum.' : 'In diesem Zeitraum hat noch niemand Zeit erfasst.'}
              icon="uhr"
              aktion={
                anzahl ? (
                  <Button variante="sekundaer" onClick={() => setze({ ...f, ma: '', auftrag: '', art: '' })}>
                    Filter zurücksetzen
                  </Button>
                ) : undefined
              }
            />
          }
          spalten={[
            { titel: 'Datum', wert: (z) => (gleichesJahr ? datumKurz(z.datum) : datum(z.datum)), sortierWert: (z) => z.datum + z.start },
            { titel: 'Mitarbeiter', wert: (z) => personName(db.mitarbeiter.get(z.mitarbeiterId)), sortierWert: (z) => personName(db.mitarbeiter.get(z.mitarbeiterId)) },
            { titel: 'Auftrag', wert: (z) => auftragText(z.auftragId) || '–', nebensaechlich: true, sortierWert: (z) => auftragText(z.auftragId) },
            { titel: 'Art', wert: (z) => ART_LABEL[z.art], nebensaechlich: true, sortierWert: (z) => ART_LABEL[z.art] },
            {
              titel: 'Dauer',
              wert: (z) => (z.ende ? stunden(dauer(z)) : <Status ton="aktiv">Läuft</Status>),
              zahl: true,
              sortierWert: (z) => dauer(z),
            },
          ]}
        />
        {liste.length > 0 && (
          <Meta>
            Dauer ohne eingetragene Pausen.{laufen ? ' Laufende Zeiten zählen erst nach dem Stoppen.' : ''} Den automatischen Pausenabzug nach Arbeitszeitgesetz findest du in Monat & Lohn.
          </Meta>
        )}
      </Stapel>

      <Dialog
        offen={schmal && filterOffen}
        onSchliessen={() => setFilterOffen(false)}
        titel="Filter"
        aktionen={
          <>
            {anzahl > 0 && (
              <Button variante="tertiaer" onClick={() => setze({ ...f, ma: '', auftrag: '', art: '' })}>
                Zurücksetzen
              </Button>
            )}
            <Button onClick={() => setFilterOffen(false)}>{liste.length === 0 ? 'Fertig' : liste.length === 1 ? '1 Eintrag zeigen' : `${liste.length} Einträge zeigen`}</Button>
          </>
        }
      >
        {felder}
      </Dialog>
      <ZeitDialog offen={!!dialog} onSchliessen={() => setDialog(null)} eintrag={dialog?.eintrag} vorgabe={dialog?.eintrag ? undefined : vorgabe} />
    </Seite>
  );
}

function ZeitraumWahl({ f, setze }: { f: ZeitenFilter; setze: (f: ZeitenFilter) => void }) {
  return (
    <Filter<ZeitraumArt>
      label="Zeitraum"
      wert={f.zeitraum}
      onChange={(z) => setze(zeitraumWechseln(f, z))}
      optionen={[
        { wert: 'woche', label: 'Woche' },
        { wert: 'monat', label: 'Monat' },
        { wert: 'frei', label: 'Frei wählen' },
      ]}
    />
  );
}

/** Filterfelder: auf dem Desktop unter der Zeitraumzeile, auf dem Handy im Dialog „Filter“ (dort mit Zeitraum) */
function FilterFelder({
  f,
  setze,
  leute,
  auftraege,
  schmal,
}: {
  f: ZeitenFilter;
  setze: (f: ZeitenFilter) => void;
  leute: { wert: string; label: string }[];
  auftraege: { wert: string; label: string }[];
  schmal: boolean;
}) {
  return (
    <Stapel abstand={12}>
      {schmal && <ZeitraumWahl f={f} setze={setze} />}
      {f.zeitraum === 'frei' && (
        <FormRaster spalten={2}>
          <Eingabe label="Von" type="date" value={f.von} onChange={(e) => e.target.value && setze({ ...f, von: e.target.value })} />
          <Eingabe label="Bis" type="date" value={f.bis} onChange={(e) => e.target.value && setze({ ...f, bis: e.target.value })} />
        </FormRaster>
      )}
      <FormRaster spalten={schmal ? 1 : 3}>
        <Auswahl label="Mitarbeiter" leer="Alle" value={f.ma} onChange={(e) => setze({ ...f, ma: e.target.value })} optionen={leute} />
        <Auswahl label="Auftrag" leer="Alle" value={f.auftrag} onChange={(e) => setze({ ...f, auftrag: e.target.value })} optionen={auftraege} />
        <Auswahl
          label="Art"
          leer="Alle"
          value={f.art}
          onChange={(e) => setze({ ...f, art: e.target.value as ZeitArt | '' })}
          optionen={(Object.keys(ART_LABEL) as ZeitArt[]).map((a) => ({ wert: a, label: ART_LABEL[a] }))}
        />
      </FormRaster>
    </Stapel>
  );
}
