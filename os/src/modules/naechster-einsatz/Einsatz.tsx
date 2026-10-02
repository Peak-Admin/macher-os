import { useParams, useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, datumKurz, datumVon, heute, mapsLink, personName, telLink } from '@core/format';
import { aktionAusfuehren, aktionVorhanden, pfadZu } from '@core/modul';
import { istBuero, useIch } from '@core/session';
import type { Termin } from '@core/objects';
import { ErfassenKnopf, ObjektPanels, erfassenAktion } from '@ui/objekt';
import { AktionsMenue, BeispielMarke, Button, Icon, Karte, Leer, Liste, Meldung, Meta, Seite, Stapel, Status, useToast, Zeile, type MenueAktion } from '@ui/index';
import { AufgabeZeile } from '@modules/mein-tag/teile';
import { TERMIN_ART_LABEL, TERMIN_STATUS_LABEL, zeitText } from '@modules/mein-tag/logik';
import { einsatzBeenden, einsatzLosfahren, einsatzStarten, laeuft, naechsterEinsatz, telefonFuer } from './logik';

function wannText(t: Termin) {
  const tag = datumVon(t.start);
  const d = tag === heute() ? 'Heute' : datumKurz(tag);
  return `${d}, ${zeitText(t)}`;
}

/** Die eine zustandsabhängige Hauptaktion: Losfahren → Arbeit starten → Arbeit abschließen */
export function hauptaktion(t: Termin): { label: string; icon: string; fn: () => string | void; erfolg: string } | undefined {
  if (t.status === 'geplant' || t.status === 'bestaetigt') return { label: 'Losfahren', icon: 'auto', fn: () => einsatzLosfahren(t.id), erfolg: 'Gute Fahrt. Status: unterwegs.' };
  if (t.status === 'unterwegs') return { label: 'Arbeit starten', icon: 'start', fn: () => einsatzStarten(t.id), erfolg: 'Du bist vor Ort. Die Arbeit läuft.' };
  if (t.status === 'vor_ort') return { label: 'Arbeit abschließen', icon: 'stop', fn: () => einsatzBeenden(t.id), erfolg: 'Einsatz abgeschlossen.' };
  return undefined;
}

function useAusfuehren() {
  const toast = useToast();
  const navigate = useNavigate();
  return (fn: () => string | void, erfolg: string) => {
    try {
      const ziel = fn();
      toast(erfolg);
      if (ziel) navigate(ziel);
    } catch {
      toast('Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
    }
  };
}

function oberzeile(t: Termin) {
  if (t.status === 'vor_ort') {
    const z = db.zeiten.all().find((x) => x.terminId === t.id && x.art === 'arbeit' && !x.ende);
    return z ? `Arbeit läuft seit ${z.start} Uhr` : 'Arbeit läuft';
  }
  if (t.status === 'unterwegs') return 'Du bist unterwegs';
  return `Dein nächster Einsatz · ${wannText(t)}`;
}

/** Kompakt für „Heute“: Kunde, Aufgabe, Ort, Zugang – und genau eine Hauptaktion. */
export function EinsatzKurz({ t }: { t: Termin }) {
  useDatenstand();
  const ausfuehren = useAusfuehren();
  const auftrag = db.auftraege.get(t.auftragId);
  const ort = db.orte.get(t.ortId ?? auftrag?.ortId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId ?? ort?.kundeId);
  const adresse = ort?.adresse ?? kunde?.adresse;
  const karte = mapsLink(adresse);
  const haupt = hauptaktion(t);
  return (
    <section className="mm-einsatz" aria-labelledby={`einsatz-${t.id}`}>
      <p className="mm-oberzeile">{oberzeile(t)}</p>
      <h2 id={`einsatz-${t.id}`} className="mm-einsatz-kunde">
        {kunde?.name ?? t.titel} <BeispielMarke zeigen={t.beispiel} />
      </h2>
      {kunde && <p className="mm-einsatz-aufgabe">{t.titel}</p>}
      {adresse && (
        <p className="mm-meta">
          {adresseText(adresse)}
          {ort?.hinweise ? <> · <strong>{ort.hinweise}</strong></> : null}
          {karte && (
            <>
              {' · '}
              <a href={karte} target="_blank" rel="noreferrer">
                Route
              </a>
            </>
          )}
        </p>
      )}
      <Zeile abstand={8}>
        {haupt && (
          <Button icon={haupt.icon} onClick={() => ausfuehren(haupt.fn, haupt.erfolg)}>
            {haupt.label}
          </Button>
        )}
        <Button variante="tertiaer" to={`/heute/naechster-einsatz/${t.id}`} icon="pfeilRechts">
          Details
        </Button>
      </Zeile>
    </section>
  );
}

/** Der Einsatz vollständig: Ort, Zugang, Anrufen, Arbeit – eine Hauptaktion, zwei direkte Aktionen, wenige weitere. */
export function EinsatzKarte({ t }: { t: Termin }) {
  useDatenstand();
  const ausfuehren = useAusfuehren();
  const auftrag = db.auftraege.get(t.auftragId);
  const ort = db.orte.get(t.ortId ?? auftrag?.ortId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId ?? ort?.kundeId);
  const tel = telefonFuer(t);
  const karte = mapsLink(ort?.adresse ?? kunde?.adresse);
  const ich = useIch();
  const buero = istBuero(ich);
  // Monteure sehen am Einsatz nur ihre und nicht zugewiesene Aufgaben, Büro sieht alle
  const aufgaben = auftrag ? db.aufgaben.where((a) => a.auftragId === auftrag.id && !a.erledigt && (buero || !a.zustaendigId || a.zustaendigId === ich?.id)) : [];
  const team = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter(Boolean);
  const laufend = laeuft(t);
  const offen = t.status === 'geplant' || t.status === 'bestaetigt';
  const haupt = hauptaktion(t);
  const bericht = aktionVorhanden('bericht.erstellen') && auftrag;

  const weitere: MenueAktion[] = [
    ...(offen ? [{ label: 'Direkt mit der Arbeit starten', icon: 'start', onClick: () => ausfuehren(() => einsatzStarten(t.id), 'Einsatz gestartet.') }] : []),
    ...erfassenAktion('material', auftrag?.id),
    ...erfassenAktion('zeit', auftrag?.id),
    ...(bericht && t.status === 'vor_ort' ? [{ label: 'Bericht schreiben', icon: 'dokument', onClick: () => ausfuehren(() => aktionAusfuehren('bericht.erstellen', { auftragId: auftrag.id, terminId: t.id }), 'Bericht angelegt.') }] : []),
    ...erfassenAktion('mangel', auftrag?.id),
  ];

  return (
    <Karte
      oberzeile={laufend ? (t.status === 'vor_ort' ? 'Arbeit läuft' : 'Unterwegs') : `${TERMIN_ART_LABEL[t.art]} · ${wannText(t)}`}
      titel={
        <>
          {kunde?.name ?? t.titel} <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      aktion={<Status ton={laufend ? 'aktiv' : 'neutral'}>{TERMIN_STATUS_LABEL[t.status]}</Status>}
    >
      <Stapel abstand={16}>
        <Stapel abstand={4}>
          {kunde && <strong>{t.titel}</strong>}
          <Meta>
            {wannText(t)}
            {auftrag ? ` · Auftrag ${auftrag.nummer}` : ''}
          </Meta>
          {(ort || kunde?.adresse) && <Meta>{adresseText(ort?.adresse ?? kunde?.adresse)}</Meta>}
          <Zeile abstand={16}>
            {karte && (
              <a className="mm-textlink" href={karte} target="_blank" rel="noreferrer">
                <Icon name="route" size={16} /> Navigation starten
              </a>
            )}
            {tel && (
              <a className="mm-textlink" href={telLink(tel.nummer)!}>
                <Icon name="telefon" size={16} /> {tel.wer} anrufen
              </a>
            )}
          </Zeile>
        </Stapel>

        {ort?.hinweise && (
          <Meldung ton="achtung" titel="Zugang & Hinweise vor Ort">
            {ort.hinweise}
            {ort.ansprechpartnerVorOrt ? ` Ansprechpartner: ${ort.ansprechpartnerVorOrt}.` : ''}
          </Meldung>
        )}

        <Zeile abstand={8}>
          {haupt && (
            <Button icon={haupt.icon} onClick={() => ausfuehren(haupt.fn, haupt.erfolg)}>
              {haupt.label}
            </Button>
          )}
          <ErfassenKnopf aktion="foto" auftragId={auftrag?.id} />
          <ErfassenKnopf aktion="notiz" auftragId={auftrag?.id} variante="tertiaer" />
          <AktionsMenue aktionen={weitere} />
        </Zeile>

        {(auftrag?.beschreibung || t.notiz) && (
          <Stapel abstand={4}>
            <strong>Was zu tun ist</strong>
            {t.notiz && <p>{t.notiz}</p>}
            {auftrag?.beschreibung && <p>{auftrag.beschreibung}</p>}
          </Stapel>
        )}

        {aufgaben.length > 0 && (
          <Stapel abstand={8}>
            <strong>Offene Aufgaben ({aufgaben.length})</strong>
            <Liste>
              {aufgaben.slice(0, 20).map((a) => (
                <AufgabeZeile key={a.id} a={a} />
              ))}
            </Liste>
          </Stapel>
        )}

        {team.length > 1 && <Meta>Mit dabei: {team.map((m) => personName(m)).join(', ')}</Meta>}

        {auftrag && (
          <div>
            <Button variante="tertiaer" to={pfadZu({ typ: 'auftraege', id: auftrag.id }) ?? `/auftrag/${auftrag.id}`} icon="auftraege">
              Ganzen Auftrag öffnen
            </Button>
          </div>
        )}
      </Stapel>
    </Karte>
  );
}

/** Hub-Widget: nur der eine Einsatz, um den es jetzt geht. */
export function NaechsterEinsatzWidget() {
  useDatenstand();
  const ich = useIch();
  const t = naechsterEinsatz(ich?.id);
  if (!ich) return null;
  if (!t) {
    // Chef/Büro ohne eigenen Einsatz: kein leerer Block auf „Heute“
    if (ich.rolle === 'chef' || ich.rolle === 'buero') return null;
    return <Leer icon="auto" titel="Kein Einsatz geplant" text="In den nächsten zwei Wochen ist für dich kein Einsatz eingeplant." />;
  }
  return <EinsatzKurz t={t} />;
}

function EinsatzSeiteInhalt({ t }: { t: Termin }) {
  return (
    <Stapel abstand={24}>
      <EinsatzKarte t={t} />
      <ObjektPanels objekt="termine" id={t.id} />
    </Stapel>
  );
}

/** /heute/naechster-einsatz – mein nächster Einsatz in voller Größe */
export function NaechsterEinsatzSeite() {
  useDatenstand();
  const ich = useIch();
  const t = naechsterEinsatz(ich?.id);
  return (
    <Seite titel="Nächster Einsatz" untertitel="Alles für den Einsatz auf einen Blick.">
      {t ? (
        <EinsatzSeiteInhalt t={t} />
      ) : (
        <Leer
          icon="auto"
          titel="Kein Einsatz geplant"
          text="In den nächsten zwei Wochen ist für dich kein Einsatz eingeplant."
          aktion={
            <Button variante="sekundaer" to="/heute/mein-tag">
              Mein Tag öffnen
            </Button>
          }
        />
      )}
    </Seite>
  );
}

/** /heute/naechster-einsatz/:id – ein bestimmter Einsatz (aus Mein Tag oder Braucht dich) */
export function EinsatzSeite() {
  const { id } = useParams();
  const t = db.termine.useOne(id);
  if (!t || t.geloeschtAm)
    return (
      <Seite titel="Einsatz" zurueck={{ to: '/heute/mein-tag', label: 'Mein Tag' }}>
        <Leer icon="achtung" titel="Diesen Einsatz gibt es nicht mehr" text="Er wurde verschoben oder gelöscht. Schau in deinem Tag nach dem aktuellen Stand." aktion={<Button to="/heute/mein-tag">Mein Tag öffnen</Button>} />
      </Seite>
    );
  return (
    <Seite titel="Einsatz" zurueck={{ to: '/heute/mein-tag', label: 'Mein Tag' }}>
      {t.status === 'erledigt' && <Meldung ton="erfolg" titel="Dieser Einsatz ist erledigt." />}
      {t.status === 'abgesagt' && <Meldung ton="achtung" titel="Dieser Einsatz wurde abgesagt." />}
      <EinsatzSeiteInhalt t={t} />
    </Seite>
  );
}
