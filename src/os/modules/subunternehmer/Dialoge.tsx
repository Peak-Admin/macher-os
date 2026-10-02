import { useState } from 'react';
import { db, neueId } from '@core/db';
import { centAlsEingabe, centAus, heute } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Auswahl, Button, Dialog, Eingabe, FormRaster, Meldung, Meta, Segmente, Stapel, useToast, DateiKnopf, bildVerkleinern, dateiAlsDataUrl } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { istBetrag } from '@modules/leistungen/daten';
import { EINSATZ_STATUS, NACHWEIS_ARTEN, subunternehmer, type NachweisArt, type SubEinsatz } from './daten';
import { subName } from './name';

/** Einsatz eines Subunternehmers an einem Auftrag anlegen oder bearbeiten */
export function EinsatzDialog({ offen, onSchliessen, subId, auftragId, einsatz }: { offen: boolean; onSchliessen: () => void; subId?: ID; auftragId?: ID; einsatz?: SubEinsatz }) {
  const toast = useToast();
  const geld = useDarf('geld');
  const subs = subunternehmer.use((s) => s.aktiv || s.id === subId);
  const [f, setF] = useState({
    subId: subId ?? '',
    auftragId: einsatz?.auftragId ?? auftragId ?? '',
    leistung: einsatz?.leistung ?? '',
    von: einsatz?.von ?? heute(),
    bis: einsatz?.bis ?? '',
    kosten: centAlsEingabe(einsatz?.kosten),
    status: einsatz?.status ?? ('geplant' as SubEinsatz['status']),
  });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const sub = subunternehmer.get(f.subId);

  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.subId) e.subId = 'Wähle einen Subunternehmer.';
    if (!f.auftragId) e.auftragId = 'Wähle einen Auftrag.';
    if (!f.leistung.trim()) e.leistung = 'Was soll gemacht werden?';
    if (f.bis && f.bis < f.von) e.bis = 'Das Ende liegt vor dem Start.';
    if (geld && f.kosten.trim() && !istBetrag(f.kosten)) e.kosten = 'Trage einen Betrag ein, z. B. 1.850,00.';
    setFehler(e);
    if (Object.keys(e).length || !sub) return;
    const neu: SubEinsatz = {
      id: einsatz?.id ?? neueId('se'),
      auftragId: f.auftragId,
      leistung: f.leistung.trim(),
      von: f.von,
      bis: f.bis || undefined,
      kosten: geld ? (f.kosten.trim() ? centAus(f.kosten) : undefined) : einsatz?.kosten,
      status: f.status,
    };
    const einsaetze = einsatz ? sub.einsaetze.map((x) => (x.id === einsatz.id ? neu : x)) : [...sub.einsaetze, neu];
    subunternehmer.update(sub.id, { einsaetze }, { text: einsatz ? `Einsatz geändert: ${neu.leistung}` : `Einsatz geplant: ${neu.leistung}` });
    toast(einsatz ? 'Einsatz gespeichert.' : 'Einsatz angelegt.');
    onSchliessen();
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={einsatz ? 'Einsatz bearbeiten' : 'Subunternehmer einsetzen'}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>{einsatz ? 'Einsatz speichern' : 'Einsatz anlegen'}</Button>
        </>
      }
    >
      <Stapel>
        {!subId && (
          <Auswahl
            label="Subunternehmer"
            value={f.subId}
            leer={subs.length ? 'Subunternehmer wählen' : 'Noch keine Subunternehmer angelegt'}
            fehler={fehler.subId}
            onChange={(e) => setF({ ...f, subId: e.target.value })}
            optionen={subs.map((s) => ({ wert: s.id, label: `${subName(s)} · ${s.gewerk}` }))}
          />
        )}
        {!auftragId && (
          <>
            <AuftragAuswahl wert={f.auftragId} onChange={(id) => setF({ ...f, auftragId: id })} />
            {fehler.auftragId && <Meldung ton="achtung">{fehler.auftragId}</Meldung>}
          </>
        )}
        <Eingabe label="Was macht der Subunternehmer?" value={f.leistung} onChange={(e) => setF({ ...f, leistung: e.target.value })} fehler={fehler.leistung} placeholder="z. B. Gerüst stellen und abbauen" />
        <FormRaster>
          <Eingabe label="Von" type="date" value={f.von} onChange={(e) => setF({ ...f, von: e.target.value })} />
          <Eingabe label="Bis" type="date" optional value={f.bis} onChange={(e) => setF({ ...f, bis: e.target.value })} fehler={fehler.bis} />
          {geld && <Eingabe label="Kosten netto (€)" optional inputMode="decimal" value={f.kosten} onChange={(e) => setF({ ...f, kosten: e.target.value })} fehler={fehler.kosten} hilfe="vereinbart oder erwartet" />}
        </FormRaster>
        <Segmente label="Status" wert={f.status} onChange={(s) => setF({ ...f, status: s })} optionen={EINSATZ_STATUS} />
        {sub && <Meta>Termine im Kalender legst du wie gewohnt am Auftrag an.</Meta>}
      </Stapel>
    </Dialog>
  );
}

/** Nachweis (Freistellung, Unbedenklichkeit …) erfassen – mit Scan/Foto */
export function NachweisDialog({ offen, onSchliessen, subId }: { offen: boolean; onSchliessen: () => void; subId: ID }) {
  const toast = useToast();
  const [art, setArt] = useState<NachweisArt>('freistellung_48b');
  const [gueltigBis, setGueltigBis] = useState('');
  const [dokument, setDokument] = useState<{ url: string; name: string; mime: string } | undefined>();
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const info = NACHWEIS_ARTEN.find((a) => a.id === art);

  const waehlen = async ([d]: File[]) => {
    setFehler(undefined);
    setLaedt(true);
    try {
      if (d.type.startsWith('image/')) setDokument({ url: (await bildVerkleinern(d, { max: 1800 })).url, name: d.name, mime: 'image/jpeg' });
      else if (d.type === 'application/pdf') {
        if (d.size > 1_500_000) throw new Error('Die PDF ist zu groß (max. 1,5 MB). Fotografiere das Dokument stattdessen.');
        setDokument({ url: await dateiAlsDataUrl(d), name: d.name, mime: d.type });
      } else throw new Error('Bitte ein Foto oder eine PDF wählen.');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Die Datei konnte nicht gelesen werden.');
    } finally {
      setLaedt(false);
    }
  };

  const speichern = () => {
    const sub = subunternehmer.get(subId);
    if (!sub) return;
    if (art !== 'sonstiges' && !gueltigBis) return setFehler('Trag ein, bis wann der Nachweis gilt – dann erinnert Macher dich rechtzeitig.');
    const doc = dokument
      ? db.dokumente.create({ art: dokument.mime === 'application/pdf' ? 'pdf' : 'foto', titel: `${info?.label} – ${subName(sub)}`, url: dokument.url, mime: dokument.mime, groesse: Math.round((dokument.url.length * 3) / 4), tags: ['nachweis', 'subunternehmer'] })
      : undefined;
    subunternehmer.update(sub.id, { nachweise: [...sub.nachweise, { id: neueId('sn'), art, gueltigBis: gueltigBis || undefined, dokumentId: doc?.id }] }, { text: `Nachweis erfasst: ${info?.label}` });
    toast('Nachweis gespeichert.');
    setGueltigBis('');
    setDokument(undefined);
    onSchliessen();
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Nachweis erfassen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Nachweis speichern</Button>
        </>
      }
    >
      <Stapel>
        <Auswahl label="Art" value={art} onChange={(e) => setArt(e.target.value as NachweisArt)} optionen={NACHWEIS_ARTEN.map((a) => ({ wert: a.id, label: a.label }))} />
        {info?.text && <Meta>{info.text}</Meta>}
        <Eingabe label="Gültig bis" type="date" value={gueltigBis} onChange={(e) => setGueltigBis(e.target.value)} optional={art === 'sonstiges'} />
        <div>
          <DateiKnopf accept="image/*,application/pdf" icon="kamera" onDateien={waehlen} laedt={laedt} laedtText="Wird gelesen …">
            {dokument ? 'Andere Datei wählen' : 'Foto oder PDF hinzufügen'}
          </DateiKnopf>
        </div>
        {dokument && <Meta>Ausgewählt: {dokument.name}</Meta>}
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      </Stapel>
    </Dialog>
  );
}
