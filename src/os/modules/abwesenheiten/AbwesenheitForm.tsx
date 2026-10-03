import { useState } from 'react';
import { db } from '@core/db';
import { ABWESENHEIT_EMOJI } from '@core/zeichen';
import { heute } from '@core/format';
import type { AbwesenheitsArt, ID } from '@core/objects';
import { istBuero, useDarf, useIch } from '@core/session';
import { Button, Checkbox, Eingabe, FormRaster, Meldung, Meta, Segmente, Stapel, Textfeld, useToast, DateiFeld, dateiLesen } from '@ui/index';
import { MitarbeiterAuswahl } from '@ui/objekt';
import { ART_LABEL, arbeitstage, kollisionen, tageText, ueberschneidung, urlaubskonto, zeitraumText } from './daten';
import { eintragen } from './logik';

type Art = Extract<AbwesenheitsArt, 'urlaub' | 'krank' | 'schule' | 'frei' | 'sonstiges'>;

/** Antrag in Sekunden: Urlaub beantragen, krank melden, Berufsschule eintragen */
export function AbwesenheitForm({ fertig, vorgabeArt = 'urlaub', vorgabeMa }: { fertig?: (id: ID) => void; vorgabeArt?: Art; vorgabeMa?: ID }) {
  const ich = useIch();
  const personal = useDarf('personal');
  const buero = istBuero(ich);
  const toast = useToast();
  const [art, setArt] = useState<Art>(vorgabeArt);
  const [maId, setMaId] = useState<ID>(((buero || personal) && vorgabeMa && db.mitarbeiter.get(vorgabeMa)?.id) || ich?.id || '');
  const [von, setVon] = useState(heute());
  const [bis, setBis] = useState(heute());
  const [halbtags, setHalbtags] = useState(false);
  const [notiz, setNotiz] = useState('');
  const [foto, setFoto] = useState<File>();
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);

  const m = db.mitarbeiter.get(maId);
  const tage = bis >= von ? arbeitstage(von, bis, halbtags) : 0;
  const alle = db.abwesenheiten.all();
  const konto = m ? urlaubskonto(m, alle, Number(von.slice(0, 4))) : undefined;
  const betroffen = m ? kollisionen({ mitarbeiterId: m.id, art, von, bis } as never, db.termine.all()) : [];

  const absenden = async () => {
    if (!m) return setFehler('Wähle aus, um wen es geht.');
    if (bis < von) return setFehler('Das Ende liegt vor dem Anfang.');
    if (art === 'urlaub' && tage === 0) return setFehler('Im Zeitraum liegt kein Arbeitstag.');
    const doppelt = ueberschneidung(m.id, von, bis, alle);
    if (doppelt) return setFehler(`Für ${zeitraumText(doppelt)} ist schon ${ART_LABEL[doppelt.art]} eingetragen.`);
    setFehler(undefined);
    setLaedt(true);
    try {
      const a = eintragen({ mitarbeiterId: m.id, art, von, bis, halbtags: halbtags || undefined, notiz: notiz.trim() || undefined }, { direktGenehmigt: personal });
      if (foto) {
        const d = await dateiLesen(foto);
        db.dokumente.create({
          art: d.istBild ? 'foto' : 'pdf',
          titel: `AU ${m.vorname} ${m.nachname} ${zeitraumText(a)}`,
          url: d.url,
          mime: d.mime,
          groesse: d.bytes,
          bezug: { typ: 'abwesenheiten', id: a.id },
          tags: ['au'],
        });
      }
      toast(
        a.status === 'beantragt'
          ? `${ART_LABEL[art]} beantragt. Der Chef bekommt Bescheid.`
          : art === 'krank'
            ? 'Gute Besserung! Chef und Büro wissen Bescheid.'
            : `${ART_LABEL[art]} eingetragen.`,
      );
      setNotiz('');
      setFoto(undefined);
      fertig?.(a.id);
    } catch {
      setFehler('Das Foto konnte nicht gelesen werden. Versuch es ohne Foto oder mit einem kleineren Bild.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <form
      className="mm-stapel"
      style={{ gap: 16 }}
      onSubmit={(e) => {
        e.preventDefault();
        void absenden();
      }}
    >
      {(buero || personal) && <MitarbeiterAuswahl label="Für" wert={maId} onChange={setMaId} />}
      <Segmente<Art>
        label="Was"
        wert={art}
        onChange={(v) => {
          setArt(v);
          if (v === 'krank') {
            setVon(heute());
            setBis(heute());
          }
        }}
        optionen={[
          { wert: 'urlaub', emoji: ABWESENHEIT_EMOJI.urlaub, label: 'Urlaub' },
          { wert: 'krank', emoji: ABWESENHEIT_EMOJI.krank, label: 'Krank' },
          { wert: 'schule', emoji: ABWESENHEIT_EMOJI.schule, label: 'Berufsschule' },
          { wert: 'frei', emoji: ABWESENHEIT_EMOJI.frei, label: 'Frei' },
          { wert: 'sonstiges', emoji: ABWESENHEIT_EMOJI.sonstiges, label: 'Sonstiges' },
        ]}
      />
      <FormRaster spalten={2}>
        <Eingabe
          label="Von"
          type="date"
          value={von}
          onChange={(e) => {
            setVon(e.target.value);
            if (bis < e.target.value) setBis(e.target.value);
          }}
        />
        <Eingabe label={art === 'krank' ? 'Voraussichtlich bis' : 'Bis'} type="date" min={von} value={bis} onChange={(e) => setBis(e.target.value)} />
      </FormRaster>
      <Stapel abstand={8}>
        {art !== 'krank' && <Checkbox label="Nur halbe Tage" checked={halbtags} onChange={setHalbtags} />}
        <Zusammenfassung art={art} tage={tage} rest={konto && art === 'urlaub' ? konto.rest - tage : undefined} />
        {betroffen.length > 0 && (
          <Meldung ton="achtung" titel={`${betroffen.length === 1 ? '1 Termin' : `${betroffen.length} Termine`} im Zeitraum`}>
            {art === 'urlaub' ? 'Der Chef sieht das beim Genehmigen.' : 'Das Büro bekommt einen Hinweis zum Umplanen.'}
          </Meldung>
        )}
      </Stapel>
      {art === 'krank' && (
        <DateiFeld label="Foto der Krankmeldung" optional hilfe="Die AU sehen nur du und der Chef." accept="image/*,application/pdf" kamera knopf="Foto aufnehmen" dateien={foto ? [foto] : []} onDateien={([f]) => setFoto(f)} />
      )}
      <Textfeld label="Notiz" optional rows={2} value={notiz} onChange={(e) => setNotiz(e.target.value)} />
      {fehler && (
        <Meldung ton="achtung" titel="Bitte prüfen">
          {fehler}
        </Meldung>
      )}
      <div>
        <Button type="submit" laedt={laedt} laedtText="Wird gespeichert …">
          {art === 'urlaub' && !personal ? 'Urlaub beantragen' : art === 'krank' ? 'Krankmeldung senden' : 'Eintragen'}
        </Button>
      </div>
    </form>
  );
}

function Zusammenfassung({ art, tage, rest }: { art: Art; tage: number; rest?: number }) {
  if (!tage) return <Meta>Im Zeitraum liegt kein Arbeitstag.</Meta>;
  return (
    <Meta>
      {tageText(tage)}
      {rest != null && ` · danach ${String(rest).replace('.', ',')} Urlaubstage übrig`}
      {art === 'krank' && ' · gilt sofort'}
    </Meta>
  );
}

