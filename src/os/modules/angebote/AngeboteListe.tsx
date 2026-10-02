import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { datum, euro, heute, passt, relativ } from '@core/format';
import { useDarf } from '@core/session';
import type { Angebot, ID } from '@core/objects';
import { useEinstellung } from '@core/einstellungen';
import { Auswahl, BeispielMarke, Button, Dialog, Filter, FormRaster, Kennzahl, Leer, Liste, ListenZeile, Meta, Raster, Seite, Segmente, Stapel, Status, Suchfeld, useToast } from '@ui/index';
import { AuftragAuswahl } from '@ui/objekt';
import { STATUS_TEXT, STATUS_TON, angebotSummen, istAktuelleVersion, laeuftBaldAb, nachfassenFaellig, nachfassenTage, neuesAngebot } from './daten';
import { KeinGeldRecht } from './AngebotDetail';
import { aktiveFilter, BETRAG_EINSTELLUNG, imZeitraum, istZeitraum, ZEITRAEUME, type BetragArt, type Zeitraum } from './liste';

type Sicht = 'offen' | 'entwurf' | 'angenommen' | 'erledigt' | 'alle';

export function AngebotZeile({ a, ohneKunde, betrag = 'brutto' }: { a: Angebot; ohneKunde?: boolean; betrag?: BetragArt }) {
  const tag = heute();
  const k = db.kunden.get(a.kundeId);
  const hinweis = nachfassenFaellig(a, tag, nachfassenTage()) ? 'Nachfassen' : laeuftBaldAb(a, tag) ? `Läuft ${relativ(a.gueltigBis)} ab` : undefined;
  return (
    <ListenZeile
      to={`/auftraege/angebote/${a.id}`}
      titel={
        <>
          {a.titel} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={[a.nummer + (a.version > 1 ? ` V${a.version}` : ''), ohneKunde ? null : k?.name, a.status === 'versendet' && a.versendetAm ? `versendet ${relativ(a.versendetAm)}` : datum(a.datum)].filter(Boolean).join(' · ')}
      rechts={
        <>
          <span className="mm-number">{euro(angebotSummen(a)[betrag])}</span>
          {hinweis ? <Status ton="achtung">{hinweis}</Status> : <Status ton={STATUS_TON[a.status]}>{STATUS_TEXT[a.status]}</Status>}
        </>
      }
    />
  );
}

const SICHTEN: Sicht[] = ['offen', 'entwurf', 'angenommen', 'erledigt', 'alle'];
const istSicht = (w: string | null): w is Sicht => SICHTEN.includes(w as Sicht);

/** Handy oder Desktop? Zusatzfilter stehen auf dem Handy hinter „Filter“. */
function useBreit(): boolean {
  const q = '(min-width: 768px)';
  return useSyncExternalStore(
    (f) => {
      const m = globalThis.matchMedia?.(q);
      m?.addEventListener('change', f);
      return () => m?.removeEventListener('change', f);
    },
    () => globalThis.matchMedia?.(q).matches ?? true,
    () => true,
  );
}

export function AngeboteListe() {
  useDatenstand();
  const geld = useDarf('geld');
  const breit = useBreit();
  const [q, setQ] = useState('');
  const [params, setParams] = useSearchParams();
  const [neuOffen, setNeuOffen] = useState(false);
  const [filterOffen, setFilterOffen] = useState(false);
  const [betragArt, setBetragArt] = useEinstellung<BetragArt>(BETRAG_EINSTELLUNG, 'brutto');
  const neuParam = params.get('neu') === '1';
  useEffect(() => {
    if (neuParam) setNeuOffen(true);
  }, [neuParam]);
  if (!geld) return <KeinGeldRecht />;

  // Filter aus der URL – teilbar, und „Zurück“ landet wieder in derselben Ansicht
  const statusParam = params.get('status');
  const zeitParam = params.get('zeit');
  const sicht: Sicht = istSicht(statusParam) ? statusParam : 'offen';
  const zeit: Zeitraum = istZeitraum(zeitParam) ? zeitParam : 'alle';
  const auftragId = params.get('auftrag') || undefined;
  const setzeFilter = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) n.set(k, v);
      else n.delete(k);
    }
    setParams(n, { replace: true });
  };

  const tag = heute();
  const alle = db.angebote.all();
  const aktuelle = alle.filter((a) => istAktuelleVersion(a, alle));
  const betrag = (a: Angebot) => angebotSummen(a)[betragArt];
  const imRahmen = (a: Angebot) => imZeitraum(a.datum, zeit, tag) && (!auftragId || a.auftragId === auftragId);
  const passend = (a: Angebot) => !q || passt(q, a.titel, a.nummer, db.kunden.get(a.kundeId)?.name);
  const nach: Record<Sicht, (a: Angebot) => boolean> = {
    offen: (a) => a.status === 'versendet',
    entwurf: (a) => a.status === 'entwurf',
    angenommen: (a) => a.status === 'angenommen',
    erledigt: (a) => a.status === 'abgelehnt' || a.status === 'abgelaufen',
    alle: () => true,
  };
  const gerahmt = aktuelle.filter(imRahmen);
  const liste = gerahmt.filter(nach[sicht]).filter(passend).sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm));
  const summeListe = liste.reduce((s, a) => s + betrag(a), 0);
  const offen = aktuelle.filter(nach.offen);
  const nachfassen = offen.filter((a) => nachfassenFaellig(a, tag, nachfassenTage()));
  const summeOffen = offen.reduce((s, a) => s + betrag(a), 0);
  const seit90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const entschieden = aktuelle.filter((a) => (a.status === 'angenommen' || a.status === 'abgelehnt') && (a.entschiedenAm ?? '') >= seit90);
  const quote = entschieden.length >= 3 ? Math.round((entschieden.filter((a) => a.status === 'angenommen').length / entschieden.length) * 100) : undefined;

  // Nur Aufträge mit Angeboten; der gewählte bleibt in der Auswahl
  const auftragIds = new Set(aktuelle.map((a) => a.auftragId));
  if (auftragId) auftragIds.add(auftragId);
  const auftraege = [...auftragIds]
    .map((id) => db.auftraege.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .sort((a, b) => b.nummer.localeCompare(a.nummer));
  const zusatz = aktiveFilter({ zeit, auftragId });
  const gefiltert = !!q || zusatz > 0;

  return (
    <Seite titel="Angebote" untertitel="Schreiben, versenden, nachfassen – bis zum Auftrag." aktion={<Button icon="plus" onClick={() => setNeuOffen(true)}>Angebot erstellen</Button>}>
      <Stapel>
        <Raster min={200}>
          <Kennzahl label="Offen beim Kunden" wert={euro(summeOffen)} hinweis={`${offen.length === 1 ? '1 Angebot' : `${offen.length} Angebote`} · ${betragArt}`} />
          <Kennzahl label="Nachfassen fällig" wert={nachfassen.length} ton={nachfassen.length ? 'achtung' : undefined} hinweis={`ohne Antwort seit ${nachfassenTage()} Tagen`} />
          <Kennzahl label="Annahmequote" wert={quote != null ? `${quote} %` : null} zeitraum="letzte 90 Tage" hinweis={quote == null ? 'ab 3 Entscheidungen' : `${entschieden.length} entschieden`} />
        </Raster>
        <Stapel abstand={12}>
          <Filter
            label="Status"
            wert={sicht}
            onChange={(s) => setzeFilter({ status: s === 'offen' ? undefined : s })}
            optionen={[
              { wert: 'offen', label: 'Versendet', zaehler: gerahmt.filter(nach.offen).length },
              { wert: 'entwurf', label: 'Entwürfe', zaehler: gerahmt.filter(nach.entwurf).length },
              { wert: 'angenommen', label: 'Angenommen' },
              { wert: 'erledigt', label: 'Abgelehnt & abgelaufen' },
              { wert: 'alle', label: 'Alle' },
            ]}
          />
          <div className="mm-zeile" style={{ gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Suchfeld wert={q} onChange={setQ} platzhalter="Kunde, Titel, Nummer …" />
            </div>
            {!breit && (
              <Button variante="sekundaer" icon="filter" onClick={() => setFilterOffen(!filterOffen)} aria-expanded={filterOffen} aria-controls="angebote-zusatzfilter">
                {zusatz ? `Filter (${zusatz})` : 'Filter'}
              </Button>
            )}
          </div>
          {(breit || filterOffen) && (
            <div id="angebote-zusatzfilter">
              <FormRaster spalten={3}>
                <Auswahl label="Zeitraum" value={zeit} onChange={(e) => setzeFilter({ zeit: e.target.value === 'alle' ? undefined : e.target.value })} optionen={ZEITRAEUME} />
                <Auswahl
                  label="Projekt"
                  value={auftragId ?? ''}
                  leer="Alle Projekte"
                  onChange={(e) => setzeFilter({ auftrag: e.target.value || undefined })}
                  optionen={auftraege.map((a) => ({ wert: a.id, label: `${a.nummer} · ${a.titel}` }))}
                />
                <Segmente
                  label="Beträge"
                  wert={betragArt}
                  onChange={setBetragArt}
                  optionen={[
                    { wert: 'netto', label: 'Netto' },
                    { wert: 'brutto', label: 'Brutto' },
                  ]}
                />
              </FormRaster>
            </div>
          )}
        </Stapel>
        <Stapel abstand={8}>
          {liste.length > 0 && (
            <div className="mm-zeile" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Meta>{liste.length === 1 ? '1 Angebot' : `${liste.length} Angebote`}</Meta>
              <Meta>
                Summe {betragArt}: <strong className="mm-number">{euro(summeListe)}</strong>
              </Meta>
            </div>
          )}
          <Liste
            leer={
              gefiltert ? (
                <Leer
                  titel="Keine Treffer"
                  text="Mit diesen Filtern gibt es kein Angebot."
                  icon="suche"
                  aktion={
                    <Button variante="sekundaer" onClick={() => (setQ(''), setzeFilter({ zeit: undefined, auftrag: undefined }))}>
                      Filter zurücksetzen
                    </Button>
                  }
                />
              ) : (
                <Leer
                  titel={sicht === 'offen' ? 'Kein Angebot wartet auf Antwort' : 'Hier ist nichts'}
                  text="Angebote entstehen aus einer Anfrage, einem Aufmaß oder einer Kalkulation – oder direkt hier."
                  aktion={<Button onClick={() => setNeuOffen(true)}>Angebot erstellen</Button>}
                  icon="dokument"
                />
              )
            }
          >
            {liste.map((a) => (
              <AngebotZeile key={a.id} a={a} betrag={betragArt} />
            ))}
          </Liste>
        </Stapel>
      </Stapel>
      <NeuDialog offen={neuOffen} onSchliessen={() => setNeuOffen(false)} />
    </Seite>
  );
}

function NeuDialog({ offen, onSchliessen }: { offen: boolean; onSchliessen: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [auftragId, setAuftragId] = useState<ID>();
  const [fehler, setFehler] = useState<string>();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Angebot erstellen"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!auftragId) return setFehler('Wähle den Auftrag oder die Anfrage, zu der das Angebot gehört.');
              const a = neuesAngebot(auftragId);
              toast('Angebotsentwurf angelegt.');
              onSchliessen();
              navigate(`/auftraege/angebote/${a.id}`);
            }}
          >
            Entwurf anlegen
          </Button>
        </>
      }
    >
      <AuftragAuswahl wert={auftragId} onChange={(id) => (setAuftragId(id || undefined), setFehler(undefined))} label="Zu Auftrag oder Anfrage" />
      {fehler && (
        <p className="mm-fehlertext" role="alert">
          {fehler}
        </p>
      )}
      <p className="mm-meta">
        Neuer Kunde? Erfasse zuerst die <Link to="/auftraege/anfragen/neu" onClick={onSchliessen}>Anfrage</Link> – der Kunde wird dabei automatisch angelegt.
      </p>
    </Dialog>
  );
}

/** Tab „Angebote“ in der Auftragsakte und beim Kunden */
export function AngeboteTab({ id, kunde }: { id: ID; kunde?: boolean }) {
  useDatenstand();
  const geld = useDarf('geld');
  const navigate = useNavigate();
  const toast = useToast();
  if (!geld) return <Leer titel="Preise siehst du mit deiner Rolle nicht." icon="schloss" />;
  const alle = db.angebote.all();
  const liste = alle.filter((a) => (kunde ? a.kundeId === id : a.auftragId === id)).sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
  const erstellen = () => {
    const a = neuesAngebot(id);
    toast('Angebotsentwurf angelegt.');
    navigate(`/auftraege/angebote/${a.id}`);
  };
  return (
    <Stapel abstand={12}>
      <Liste leer={<Leer titel="Noch kein Angebot" text={kunde ? 'Angebote entstehen am Auftrag.' : 'Schreib das Angebot direkt aus diesem Auftrag.'} aktion={kunde ? undefined : <Button icon="plus" onClick={erstellen}>Angebot erstellen</Button>} icon="dokument" />}>
        {liste.map((a) => (
          <AngebotZeile key={a.id} a={a} ohneKunde={!kunde} />
        ))}
      </Liste>
      {!kunde && liste.length > 0 && (
        <div>
          <Button variante="sekundaer" icon="plus" onClick={erstellen}>
            Weiteres Angebot
          </Button>
        </div>
      )}
    </Stapel>
  );
}
