import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { aktionAusfuehren } from '@core/modul';
import { datum, heute, personName } from '@core/format';
import type { ID, Nachweis, Qualifikation } from '@core/objects';
import { istBuero, useIch } from '@core/session';
import { Auswahl, Button, Dialog, Eingabe, Filter, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Tabelle, Textfeld, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { Zeitstrahl } from '@ui/objekt';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { KATEGORIE_LABEL, aktuellerNachweis, nachweisStatus, statusAnzeige } from './daten';
import { NachweisDialog } from './NachweisDialog';

type Ansicht = 'matrix' | 'liste' | 'ablauf';

function kurz(name: string) {
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

/** Wer kann/darf was – Matrix, Liste und „läuft ab“ */
export function QualifikationenSeite() {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const [ansicht, setAnsicht] = useState<Ansicht>('matrix');
  const [neu, setNeu] = useState(false);
  const [nachweis, setNachweis] = useState(false);
  const t = heute();
  const qualis = [...db.qualifikationen.all()].sort((a, b) => a.kategorie.localeCompare(b.kategorie) || a.name.localeCompare(b.name, 'de'));
  const team = sortiert(db.mitarbeiter.where((m) => istAktiv(m)));
  const nachweise = db.nachweise.all();
  const ablaufend = nachweise
    .filter((n) => team.some((m) => m.id === n.mitarbeiterId) && ['laeuft_ab', 'abgelaufen'].includes(nachweisStatus(n, t)))
    .filter((n) => aktuellerNachweis(nachweise, n.mitarbeiterId, n.qualifikationId)?.id === n.id)
    .sort((a, b) => (a.gueltigBis ?? '').localeCompare(b.gueltigBis ?? ''));

  return (
    <Seite
      titel="Qualifikationen"
      untertitel="Wer kann und darf was – und was läuft bald ab."
      aktion={buero ? <Button icon="plus" onClick={() => setNachweis(true)}>Nachweis eintragen</Button> : undefined}
    >
      <Filter
        label="Ansicht"
        wert={ansicht}
        onChange={setAnsicht}
        optionen={[
          { wert: 'matrix', label: 'Matrix' },
          { wert: 'liste', label: 'Qualifikationen', zaehler: qualis.length },
          { wert: 'ablauf', label: 'Läuft ab', zaehler: ablaufend.length },
        ]}
      />
      {ansicht === 'matrix' &&
        (team.length && qualis.length ? (
          <Stapel abstand={8}>
            <Tabelle
              zeilen={team}
              schluessel={(m) => m.id}
              zeilenLink={(m) => `/betrieb/mitarbeiter/${m.id}`}
              spalten={[
                { titel: 'Mitarbeiter', wert: (m) => personName(m), sortierWert: (m) => m.vorname },
                ...qualis.map((q) => ({
                  titel: kurz(q.name),
                  wert: (m: (typeof team)[number]) => {
                    const n = aktuellerNachweis(nachweise, m.id, q.id);
                    if (!n) return <span className="mm-meta">–</span>;
                    const s = statusAnzeige(n, t);
                    return (
                      <Status ton={s.ton} icon={s.ton !== 'erfolg'}>
                        {s.ton === 'erfolg' ? (n.gueltigBis ? `bis ${n.gueltigBis.slice(5, 7)}/${n.gueltigBis.slice(2, 4)}` : 'Ja') : nachweisStatus(n, t) === 'abgelaufen' ? 'Abgelaufen' : 'Läuft ab'}
                      </Status>
                    );
                  },
                })),
              ]}
            />
            <Meta>Tippe auf eine Zeile, um alle Nachweise der Person zu sehen. Auf dem Handy seitlich wischen.</Meta>
          </Stapel>
        ) : (
          <Leer titel="Noch keine Matrix" text="Lege Mitarbeiter und Qualifikationen an, dann siehst du hier, wer was darf." icon="schild" />
        ))}
      {ansicht === 'liste' && (
        <Stapel abstand={12}>
          <Liste leer={<Leer titel="Noch keine Qualifikationen" text="Lege an, was in deinem Betrieb zählt: Fachkraft, Führerschein, Herstellerschulung …" icon="schild" />}>
            {qualis.map((q) => {
              const mit = team.filter((m) => {
                const n = aktuellerNachweis(nachweise, m.id, q.id);
                return n && nachweisStatus(n, t) !== 'abgelaufen';
              }).length;
              const warn = ablaufend.filter((n) => n.qualifikationId === q.id).length;
              return (
                <ListenZeile
                  key={q.id}
                  to={`/betrieb/qualifikationen/${q.id}`}
                  titel={q.name}
                  untertitel={`${KATEGORIE_LABEL[q.kategorie]} · ${q.gueltigMonate ? `gültig ${q.gueltigMonate} Monate` : 'unbefristet'} · ${mit === 1 ? '1 Person' : `${mit} Personen`}`}
                  rechts={warn ? <Status ton="achtung">{warn === 1 ? '1 läuft ab' : `${warn} laufen ab`}</Status> : null}
                />
              );
            })}
          </Liste>
          {buero && (
            <div>
              <Button variante="sekundaer" icon="plus" onClick={() => setNeu(true)}>
                Qualifikation anlegen
              </Button>
            </div>
          )}
        </Stapel>
      )}
      {ansicht === 'ablauf' && (
        <Liste leer={<Leer titel="Alles gültig" text="In den nächsten 60 Tagen läuft kein Nachweis ab." icon="check" />}>
          {ablaufend.map((n) => (
            <AblaufZeile key={n.id} n={n} />
          ))}
        </Liste>
      )}
      <QualiDialog offen={neu} onSchliessen={() => setNeu(false)} />
      <NachweisDialog offen={nachweis} onSchliessen={() => setNachweis(false)} />
    </Seite>
  );
}

function AblaufZeile({ n }: { n: Nachweis }) {
  const m = db.mitarbeiter.get(n.mitarbeiterId);
  const q = db.qualifikationen.get(n.qualifikationId);
  const navigate = useNavigate();
  const s = statusAnzeige(n, heute());
  return (
    <ListenZeile
      titel={`${personName(m)} · ${q?.name ?? 'Qualifikation'}`}
      untertitel={<Status ton={s.ton}>{s.text}</Status>}
      rechts={
        <Button
          klein
          variante="sekundaer"
          onClick={() => {
            const p = aktionAusfuehren('schulung.planen', { qualifikationId: n.qualifikationId, mitarbeiterIds: [n.mitarbeiterId] });
            if (p) navigate(p);
          }}
        >
          Schulung planen
        </Button>
      }
    />
  );
}

/** Qualifikation anlegen oder bearbeiten */
export function QualiDialog({ offen, onSchliessen, quali }: { offen: boolean; onSchliessen: () => void; quali?: Qualifikation }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', kategorie: 'fachlich' as Qualifikation['kategorie'], monate: '', beschreibung: '' });
  const [fehler, setFehler] = useState<string>();
  useEffect(() => {
    if (offen) setF({ name: quali?.name ?? '', kategorie: quali?.kategorie ?? 'fachlich', monate: quali?.gueltigMonate ? String(quali.gueltigMonate) : '', beschreibung: quali?.beschreibung ?? '' });
    setFehler(undefined);
  }, [offen, quali]);
  const speichern = () => {
    if (!f.name.trim()) return setFehler('Gib der Qualifikation einen Namen.');
    const doppelt = db.qualifikationen.all().find((q) => q.id !== quali?.id && q.name.toLowerCase() === f.name.trim().toLowerCase());
    if (doppelt) return setFehler('Diese Qualifikation gibt es schon.');
    const daten = { name: f.name.trim(), kategorie: f.kategorie, gueltigMonate: Number(f.monate) || undefined, beschreibung: f.beschreibung.trim() || undefined };
    if (quali) {
      db.qualifikationen.update(quali.id, daten);
      toast('Qualifikation gespeichert.');
    } else {
      const q = db.qualifikationen.create(daten);
      toast('Qualifikation angelegt.');
      navigate(`/betrieb/qualifikationen/${q.id}`);
    }
    onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={quali ? 'Qualifikation bearbeiten' : 'Qualifikation anlegen'}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Speichern</Button>
        </>
      }
    >
      <Eingabe label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} fehler={fehler} placeholder="z. B. Wärmepumpen-Herstellerschulung" />
      <Auswahl label="Art" value={f.kategorie} onChange={(e) => setF({ ...f, kategorie: e.target.value as Qualifikation['kategorie'] })} optionen={Object.entries(KATEGORIE_LABEL).map(([wert, label]) => ({ wert, label }))} />
      <Eingabe label="Gültig für (Monate)" inputMode="numeric" optional value={f.monate} onChange={(e) => setF({ ...f, monate: e.target.value.replace(/\D/g, '') })} hilfe="Leer lassen, wenn sie nicht abläuft." />
      <Textfeld label="Beschreibung" optional value={f.beschreibung} onChange={(e) => setF({ ...f, beschreibung: e.target.value })} />
    </Dialog>
  );
}

export function QualifikationDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const q = db.qualifikationen.get(id);
  const ich = useIch();
  const buero = istBuero(ich);
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const [bearbeiten, setBearbeiten] = useState(false);
  const [nachweis, setNachweis] = useState(false);
  const zurueck = { to: '/betrieb/qualifikationen', label: 'Qualifikationen' };
  if (!q || q.geloeschtAm)
    return (
      <Seite titel="Qualifikation nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Qualifikation gibt es nicht (mehr)." icon="schild" />
      </Seite>
    );
  const t = heute();
  const nachweise = db.nachweise.where((n) => n.qualifikationId === q.id);
  const team = sortiert(db.mitarbeiter.where((m) => istAktiv(m)));
  const zeilen = team.map((m) => ({ m, n: aktuellerNachweis(nachweise, m.id, q.id) }));
  const ohne = zeilen.filter((z) => !z.n || nachweisStatus(z.n, t) === 'abgelaufen');
  const auftraege = db.auftraege.where((a) => !!a.qualifikationIds?.includes(q.id) && !['erledigt', 'verloren'].includes(a.phase)).length;

  return (
    <Seite
      titel={q.name}
      oberzeile={KATEGORIE_LABEL[q.kategorie]}
      zurueck={zurueck}
      aktion={buero ? <Button icon="plus" onClick={() => setNachweis(true)}>Nachweis eintragen</Button> : undefined}
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={16}>
            <Tabelle
              zeilen={zeilen}
              schluessel={(z) => z.m.id}
              zeilenLink={(z) => `/betrieb/mitarbeiter/${z.m.id}`}
              leer={<Leer titel="Noch niemand im Team" icon="team" />}
              spalten={[
                { titel: 'Mitarbeiter', wert: (z) => personName(z.m), sortierWert: (z) => z.m.vorname },
                {
                  titel: 'Status',
                  wert: (z) => {
                    const s = statusAnzeige(z.n, t);
                    return <Status ton={s.ton}>{s.text}</Status>;
                  },
                  sortierWert: (z) => z.n?.gueltigBis ?? (z.n ? '9999' : '0000'),
                },
                { titel: 'Erworben', wert: (z) => (z.n?.erworbenAm ? datum(z.n.erworbenAm) : '–'), nebensaechlich: true },
                {
                  titel: 'Dokument',
                  nebensaechlich: true,
                  wert: (z) => {
                    const d = db.dokumente.get(z.n?.dokumentId);
                    return d?.url ? (
                      <a href={d.url} download={d.titel} onClick={(e) => e.stopPropagation()}>
                        Ansehen
                      </a>
                    ) : (
                      '–'
                    );
                  },
                },
              ]}
            />
            {buero && ohne.length > 0 && (
              <Meldung
                titel={`${ohne.length === 1 ? '1 Person hat' : `${ohne.length} Personen haben`} keinen gültigen Nachweis`}
                aktion={
                  <Button
                    klein
                    variante="sekundaer"
                    onClick={() => {
                      const p = aktionAusfuehren('schulung.planen', { qualifikationId: q.id, mitarbeiterIds: ohne.map((z) => z.m.id) });
                      if (p) navigate(p);
                    }}
                  >
                    Schulung planen
                  </Button>
                }
              >
                {ohne.map((z) => z.m.vorname).join(', ')}
              </Meldung>
            )}
            <Stapel abstand={8}>
              <strong>Verlauf</strong>
              <Zeitstrahl bezug={{ typ: 'qualifikationen', id: q.id }} max={10} />
            </Stapel>
          </Stapel>
        }
        seite={
          <Karte
            titel="Details"
            kompakt
            aktion={buero ? <Button klein variante="tertiaer" icon="stift" onClick={() => setBearbeiten(true)}>Bearbeiten</Button> : undefined}
          >
            <Stapel abstand={4}>
              <Meta>{q.gueltigMonate ? `Gültig ${q.gueltigMonate} Monate ab Erwerb` : 'Unbefristet gültig'}</Meta>
              {q.beschreibung && <Meta>{q.beschreibung}</Meta>}
              <Meta>{auftraege ? `Wird bei ${auftraege === 1 ? '1 offenen Auftrag' : `${auftraege} offenen Aufträgen`} verlangt.` : 'Kein offener Auftrag verlangt sie gerade.'}</Meta>
            </Stapel>
            {buero && (
              <Zeile>
                <Button
                  klein
                  variante="tertiaer"
                  icon="muell"
                  onClick={async () => {
                    if (!(await fragen('Qualifikation löschen?', `„${q.name}“ und die Matrix-Spalte verschwinden. Die Nachweise bleiben im Papierkorb wiederherstellbar.`, 'Löschen'))) return;
                    db.qualifikationen.remove(q.id);
                    toast('Qualifikation gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.qualifikationen.restore(q.id) } });
                    navigate('/betrieb/qualifikationen');
                  }}
                >
                  Löschen
                </Button>
              </Zeile>
            )}
          </Karte>
        }
      />
      <QualiDialog offen={bearbeiten} onSchliessen={() => setBearbeiten(false)} quali={q} />
      <NachweisDialog offen={nachweis} onSchliessen={() => setNachweis(false)} qualifikationId={q.id} />
      {bestaetigenElement}
    </Seite>
  );
}

/** Tab „Qualifikationen“ am Mitarbeiter */
export function MitarbeiterQualiTab({ id }: { id: ID }) {
  useDatenstand();
  const ich = useIch();
  const buero = istBuero(ich);
  const [offen, setOffen] = useState(false);
  const t = heute();
  const nachweise = db.nachweise.where((n) => n.mitarbeiterId === id);
  const aktuell = nachweise.filter((n) => aktuellerNachweis(nachweise, id, n.qualifikationId)?.id === n.id);
  return (
    <Stapel abstand={16}>
      <Liste leer={<Leer titel="Noch keine Nachweise" text="Trag Führerschein, Fachkraft-Nachweis oder Zertifikate ein." icon="schild" />}>
        {aktuell.map((n) => {
          const q = db.qualifikationen.get(n.qualifikationId);
          const s = statusAnzeige(n, t);
          const d = db.dokumente.get(n.dokumentId);
          return (
            <ListenZeile
              key={n.id}
              to={q ? `/betrieb/qualifikationen/${q.id}` : undefined}
              titel={q?.name ?? 'Qualifikation gelöscht'}
              untertitel={[n.erworbenAm ? `erworben ${datum(n.erworbenAm)}` : undefined, d ? 'Dokument hinterlegt' : undefined].filter(Boolean).join(' · ') || undefined}
              rechts={<Status ton={s.ton}>{s.text}</Status>}
            />
          );
        })}
      </Liste>
      {buero && (
        <Zeile>
          <Button variante="sekundaer" icon="plus" onClick={() => setOffen(true)}>
            Nachweis eintragen
          </Button>
        </Zeile>
      )}
      <NachweisDialog offen={offen} onSchliessen={() => setOffen(false)} mitarbeiterId={id} />
    </Stapel>
  );
}
