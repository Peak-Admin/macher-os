import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand, vermerken } from '@core/db';
import { datum, euro, heute, passt } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import {
  Auswahl,
  BeispielMarke,
  Button,
  Eingabe,
  Filter,
  FormRaster,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Zeile,
  Meldung,
  Meta,
  Seite,
  Stapel,
  Status,
  Suchfeld,
  ZweiSpalten,
  useBestaetigen,
  useToast,
  GeldEingabe,
  DateiKnopf,
} from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { belegAendern, type BelegX } from '../rechnungen/typen';
import { ART_LABEL, KATEGORIEN, alleBelege, belegX, belegeCsv, brutto, dateiAblegen, lieferantName, naechsteFrist, passtZuordnung, type ZuordnungFilter } from './logik';
import { betriebsbereiche, zuAuftrag, zuBereich } from './bereiche';
import { herunterladen } from '../rechnungen/xrechnung';
import { BelegFormular, ZuordnungFelder, LieferantenListe, Vorschau, belegAusWerten, leereWerte, lieferantAus, type FormularWerte } from './Formular';

const STATUS = { neu: { text: 'Neu', ton: 'aktiv' }, geprueft: { text: 'Geprüft', ton: 'neutral' }, bezahlt: { text: 'Bezahlt', ton: 'erfolg' } } as const;

export function BelegStatus({ b }: { b: BelegX }) {
  const f = naechsteFrist(b);
  if (f && f.tage < 0) return <Status ton="achtung">{`Seit ${-f.tage} ${-f.tage === 1 ? 'Tag' : 'Tagen'} fällig`}</Status>;
  if (f && f.art === 'skonto' && f.tage <= 3) return <Status ton="achtung">{f.tage === 0 ? 'Skonto nur noch heute' : `Skonto noch ${f.tage} ${f.tage === 1 ? 'Tag' : 'Tage'}`}</Status>;
  if (f && f.art === 'faellig' && f.tage <= 3) return <Status ton="achtung">{f.tage === 0 ? 'Heute fällig' : `Fällig in ${f.tage} ${f.tage === 1 ? 'Tag' : 'Tagen'}`}</Status>;
  const s = STATUS[b.status];
  return <Status ton={s.ton}>{s.text}</Status>;
}

type F = 'alle' | 'neu' | 'offen' | 'bezahlt';

export function BelegeListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const toast = useToast();
  const [filter, setFilter] = useState<F>('alle');
  const [zuordnung, setZuordnung] = useState<ZuordnungFilter>('');
  const [q, setQ] = useState('');
  const alle = alleBelege();
  const bereiche = betriebsbereiche();
  const zeigen = alle
    .filter((b) => (filter === 'offen' ? b.status !== 'bezahlt' : filter === 'neu' ? b.status === 'neu' : filter === 'bezahlt' ? b.status === 'bezahlt' : true))
    .filter((b) => passtZuordnung(b, zuordnung))
    .filter((b) => !q || passt(q, lieferantName(b), b.nummer, b.kategorie, b.bereich, db.auftraege.get(b.auftragId)?.nummer))
    .sort((a, b) => (naechsteFrist(a)?.datum ?? '9999').localeCompare(naechsteFrist(b)?.datum ?? '9999') || b.datum.localeCompare(a.datum));
  const gefiltert = !!(q || zuordnung || filter !== 'alle');
  const csv = () => {
    herunterladen(`belege-${heute()}.csv`, belegeCsv(zeigen), 'text/csv');
    toast(zeigen.length === 1 ? '1 Beleg als CSV heruntergeladen.' : `${zeigen.length} Belege als CSV heruntergeladen.`);
  };
  return (
    <Seite titel="Eingangsrechnungen & Belege" aktion={<Button icon="plus" to="/betrieb/belege/neu">Rechnung hinzufügen</Button>}>
      <Stapel abstand={12}>
        <Filter
          label="Belege filtern"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'alle', label: 'Alle' },
            { wert: 'neu', label: 'Zu prüfen', zaehler: alle.filter((b) => b.status === 'neu').length },
            { wert: 'offen', label: 'Unbezahlt', zaehler: alle.filter((b) => b.status !== 'bezahlt').length },
            { wert: 'bezahlt', label: 'Bezahlt' },
          ]}
        />
        <FormRaster>
          <Auswahl
            label="Zuordnung"
            value={zuordnung}
            leer="Alle Aufträge und Bereiche"
            onChange={(e) => setZuordnung(e.target.value)}
            optionen={[
              { wert: 'auftrag', label: 'Zu einem Auftrag' },
              ...bereiche.map((b) => ({ wert: b, label: b })),
              { wert: 'ohne', label: `Noch nicht zugeordnet (${alle.filter((b) => passtZuordnung(b, 'ohne')).length})` },
            ]}
          />
        </FormRaster>
        <Suchfeld wert={q} onChange={setQ} platzhalter="Lieferant, Nummer, Auftrag …" />
      </Stapel>
      <Liste
        leer={
          gefiltert ? (
            <Leer titel="Keine Belege gefunden" text="Ändere den Filter oder die Suche." icon="suche" />
          ) : (
            <Leer
              titel="Noch keine Belege"
              text="Fotografiere Lieferantenrechnungen und Quittungen oder lade das PDF hoch – Macher schlägt Auftrag oder Betriebsbereich vor."
              aktion={<Button to="/betrieb/belege/neu">Rechnung hinzufügen</Button>}
              icon="kamera"
            />
          )
        }
      >
        {zeigen.map((b) => {
          const a = db.auftraege.get(b.auftragId);
          const f = naechsteFrist(b);
          return (
            <ListenZeile
              key={b.id}
              to={`/betrieb/belege/${b.id}`}
              titel={
                <>
                  {lieferantName(b)}
                  {geld ? ` · ${euro(brutto(b))}` : ''} <BeispielMarke zeigen={b.beispiel} />
                </>
              }
              untertitel={[ART_LABEL[b.art], datum(b.datum), a ? a.nummer : b.bereich ?? 'nicht zugeordnet', f ? `${f.art === 'skonto' ? 'Skonto bis' : 'zahlen bis'} ${datum(f.datum)}` : null].filter(Boolean).join(' · ')}
              rechts={<BelegStatus b={b} />}
            />
          );
        })}
      </Liste>
      {geld && zeigen.length > 0 && (
        <Zeile zwischen>
          <Meta>{zeigen.length === 1 ? '1 Beleg in dieser Ansicht' : `${zeigen.length} Belege in dieser Ansicht`}</Meta>
          <Button variante="sekundaer" icon="download" onClick={csv}>
            Herunterladen
          </Button>
        </Zeile>
      )}
    </Seite>
  );
}

export function BelegNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const [werte, setWerte] = useState<FormularWerte>(leereWerte());
  const [datei, setDatei] = useState<{ url: string; mime?: string; id: ID }>();
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    if (werte.brutto <= 0 && !datei) return setFehler('Trag den Betrag ein oder fotografiere den Beleg.');
    const b = db.belege.create(belegAusWerten(werte, datei?.id) as Parameters<typeof db.belege.create>[0]);
    if (datei) db.dokumente.update(datei.id, { bezug: { typ: 'belege', id: b.id }, auftragId: b.auftragId }, { leise: true });
    toast('Beleg gespeichert.');
    navigate(`/betrieb/belege/${b.id}`, { replace: true });
  };
  return (
    <Seite titel="Rechnung hinzufügen" zurueck={{ to: '/betrieb/belege', label: 'Belege' }}>
      <Karte>
        <Stapel abstand={24}>
          <BelegFormular werte={werte} setWerte={(w) => (setWerte(w), setFehler(undefined))} datei={datei} setDatei={setDatei} fehler={fehler} />
          <div>
            <Button onClick={speichern}>Beleg speichern</Button>
          </div>
        </Stapel>
      </Karte>
    </Seite>
  );
}

/** Schnell erfassen: Foto + Betrag, fertig */
export function BelegSchnell({ fertig, auftragId }: { fertig: () => void; auftragId?: ID }) {
  const toast = useToast();
  const [werte, setWerte] = useState<FormularWerte>(leereWerte(auftragId));
  const [datei, setDatei] = useState<{ url: string; mime?: string; id: ID }>();
  const [fehler, setFehler] = useState<string>();
  return (
    <Stapel>
      <BelegFormular werte={werte} setWerte={(w) => (setWerte(w), setFehler(undefined))} datei={datei} setDatei={setDatei} fehler={fehler} kompakt />
      <Button
        breit
        onClick={() => {
          if (werte.brutto <= 0 && !datei) return setFehler('Fotografiere den Beleg oder trag den Betrag ein.');
          const b = db.belege.create({ ...belegAusWerten(werte, datei?.id), art: 'quittung' } as Parameters<typeof db.belege.create>[0]);
          if (datei) db.dokumente.update(datei.id, { bezug: { typ: 'belege', id: b.id }, auftragId: b.auftragId }, { leise: true });
          toast('Beleg gespeichert. Das Büro prüft ihn.');
          fertig();
        }}
      >
        Beleg speichern
      </Button>
    </Stapel>
  );
}

export function BelegDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const navigate = useNavigate();
  const toast = useToast();
  const geld = useDarf('geld');
  const [fragen, bestaetigung] = useBestaetigen();
  const b = belegX(id);
  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Beleg nicht gefunden" zurueck={{ to: '/betrieb/belege', label: 'Belege' }}>
        <Leer titel="Diesen Beleg gibt es nicht (mehr)." icon="dokument" />
      </Seite>
    );
  const dok = db.dokumente.get(b.dokumentId);
  const f = naechsteFrist(b);
  const set = (patch: Partial<BelegX>) => belegAendern(b.id, patch, { leise: true });
  const status = (s: BelegX['status'], text: string) => {
    belegAendern(b.id, { status: s }, { text });
    vermerken({ typ: 'belege', id: b.id }, `beleg.${s}`, text);
    toast(text + '.');
  };
  const aktion =
    b.status === 'neu' ? (
      <Button icon="check" onClick={() => status('geprueft', 'Als geprüft markiert')}>
        Als geprüft markieren
      </Button>
    ) : b.status === 'geprueft' && geld ? (
      <Button icon="euro" onClick={() => status('bezahlt', 'Als bezahlt markiert')}>
        Als bezahlt markieren
      </Button>
    ) : undefined;
  const skontoBetrag = f?.art === 'skonto' && f.betrag ? f.betrag : undefined;

  return (
    <Seite
      titel={lieferantName(b)}
      oberzeile={`${ART_LABEL[b.art]}${b.nummer ? ` ${b.nummer}` : ''}`}
      status={
        <>
          <BelegStatus b={b} /> <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/belege', label: 'Belege' }}
      aktion={aktion}
    >
      {f && f.art === 'skonto' && f.tage <= 3 && (
        <Meldung ton="achtung" titel={`Skonto sichern bis ${datum(f.datum)}`}>
          {skontoBetrag ? `Zahlst du rechtzeitig, sparst du ${euro(skontoBetrag)}.` : 'Zahl rechtzeitig, dann darfst du Skonto abziehen.'}
        </Meldung>
      )}
      {b.zuordnungGrund && (b.auftragId || b.bereich) && <Meldung ton="neutral" titel="Von Macher zugeordnet">{b.zuordnungGrund}</Meldung>}
      <ZweiSpalten
        haupt={
          <Karte>
            <Stapel>
              <LieferantenListe />
              <FormRaster>
                <Eingabe
                  label="Lieferant"
                  list="geld-lieferanten"
                  defaultValue={lieferantName(b) === 'Unbekannter Lieferant' ? '' : lieferantName(b)}
                  onBlur={(e) => set(lieferantAus(e.target.value))}
                />
                <Eingabe label="Rechnungsnummer" optional value={b.nummer ?? ''} onChange={(e) => set({ nummer: e.target.value || undefined })} />
                <Eingabe label="Belegdatum" type="date" value={b.datum} onChange={(e) => set({ datum: e.target.value })} />
                <Auswahl label="Kategorie" value={b.kategorie ?? ''} leer="Keine" onChange={(e) => set({ kategorie: e.target.value || undefined })} optionen={KATEGORIEN.map((k) => ({ wert: k, label: k }))} />
                {geld && <GeldEingabe label="Netto (€)" wert={b.netto} onWert={(c) => set({ netto: c })} />}
                {geld && <GeldEingabe label="USt (€)" wert={b.ust} onWert={(c) => set({ ust: c })} hilfe={`Brutto ${euro(brutto(b))}`} />}
                {geld && <Eingabe label="Zahlen bis" type="date" optional value={b.faelligAm ?? ''} onChange={(e) => set({ faelligAm: e.target.value || undefined })} />}
                {geld && <Eingabe label="Skonto bis" type="date" optional value={b.skontoBis ?? ''} onChange={(e) => set({ skontoBis: e.target.value || undefined })} />}
                {geld && (
                  <Eingabe
                    label="Skonto (%)"
                    optional
                    inputMode="decimal"
                    value={b.skontoProzent != null ? String(b.skontoProzent).replace('.', ',') : ''}
                    onChange={(e) => set({ skontoProzent: e.target.value ? Number(e.target.value.replace(',', '.')) || 0 : undefined })}
                  />
                )}
              </FormRaster>
              <ZuordnungFelder
                beleg={b}
                onAuftrag={(aid) => {
                  belegAendern(b.id, zuAuftrag(aid), { text: aid ? `Auftrag ${db.auftraege.get(aid)?.nummer ?? ''} zugeordnet` : 'Auftrag entfernt' });
                  if (b.dokumentId) db.dokumente.update(b.dokumentId, { auftragId: aid }, { leise: true });
                  if (aid) toast('Auftrag zugeordnet.');
                }}
                onBereich={(bereich) => {
                  belegAendern(b.id, zuBereich(bereich), { text: bereich ? `Bereich ${bereich} zugeordnet` : 'Bereich entfernt' });
                  if (bereich && b.dokumentId && b.auftragId) db.dokumente.update(b.dokumentId, { auftragId: undefined }, { leise: true });
                  if (bereich) toast(`Bereich ${bereich} zugeordnet.`);
                }}
              />
            </Stapel>
          </Karte>
        }
        seite={
          <>
            <Karte titel="Beleg" kompakt>
              <Stapel abstand={8}>
                {dok?.url ? <Vorschau url={dok.url} mime={dok.mime} /> : <Meta>Noch kein Foto.</Meta>}
                <DateiKnopf
                  accept="image/*,application/pdf"
                  kamera
                  onDateien={async ([file]) => {
                    try {
                      const d = await dateiAblegen(file, { auftragId: b.auftragId });
                      db.dokumente.update(d.id, { bezug: { typ: 'belege', id: b.id } }, { leise: true });
                      set({ dokumentId: d.id });
                      toast('Foto gespeichert.');
                    } catch {
                      toast('Das Foto konnte nicht gespeichert werden.', { ton: 'achtung' });
                    }
                  }}
                >
                  {dok ? 'Foto ersetzen' : 'Beleg fotografieren'}
                </DateiKnopf>
              </Stapel>
            </Karte>
            {b.auftragId && (
              <Karte titel="Auftrag" kompakt>
                <ObjektLink bezug={{ typ: 'auftraege', id: b.auftragId }}>
                  {db.auftraege.get(b.auftragId)?.nummer} · {db.auftraege.get(b.auftragId)?.titel}
                </ObjektLink>
              </Karte>
            )}
            <Karte titel="Verlauf" kompakt>
              <Zeitstrahl bezug={{ typ: 'belege', id: b.id }} max={8} />
            </Karte>
            {b.status !== 'neu' && (
              <Button variante="tertiaer" onClick={() => status('neu', 'Wieder auf „neu“ gesetzt')}>
                Status zurücksetzen
              </Button>
            )}
            <Button
              variante="tertiaer"
              icon="muell"
              onClick={async () => {
                if (await fragen('Beleg löschen?', 'Der Beleg kommt in den Papierkorb und lässt sich wiederherstellen.', 'Beleg löschen')) {
                  db.belege.remove(b.id);
                  toast('Beleg gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.belege.restore(b.id) } });
                  navigate('/betrieb/belege', { replace: true });
                }
              }}
            >
              Beleg löschen
            </Button>
          </>
        }
      />
      {bestaetigung}
    </Seite>
  );
}

/** Tab „Belege“ in der Auftragsakte: Kosten, die am Auftrag hängen */
export function AuftragBelegeTab({ id }: { id: ID }) {
  useDatenstand();
  const geld = useDarf('geld');
  const liste = alleBelege().filter((b) => b.auftragId === id);
  if (!liste.length)
    return <Leer titel="Keine Belege" text="Fotografiere Quittungen und Lieferscheine direkt am Auftrag." aktion={<Button variante="sekundaer" to="/betrieb/belege/neu">Beleg fotografieren</Button>} icon="kamera" />;
  return (
    <Stapel>
      {geld && <Meta>Summe netto: {euro(liste.reduce((s, b) => s + b.netto, 0))}</Meta>}
      <Liste>
        {liste.map((b) => (
          <ListenZeile key={b.id} to={`/betrieb/belege/${b.id}`} titel={`${lieferantName(b)}${geld ? ` · ${euro(brutto(b))}` : ''}`} untertitel={`${ART_LABEL[b.art]} · ${datum(b.datum)}`} rechts={<BelegStatus b={b} />} />
        ))}
      </Liste>
    </Stapel>
  );
}

