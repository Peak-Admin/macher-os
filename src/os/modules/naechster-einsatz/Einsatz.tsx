import { useParams, useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, datumKurz, datumVon, heute, mapsLink, telLink } from '@core/format';
import { pfadZu } from '@core/modul';
import { istBuero, useIch } from '@core/session';
import type { Termin } from '@core/objects';
import { ObjektPanels, erfassen } from '@ui/objekt';
import { Personen } from '@ui/person';
import { BeispielMarke, Button, Icon, Karte, Leer, Liste, Meldung, Meta, Seite, Stapel, Status, useToast, Zeile, oberzeileKlasse, type IconName } from '@ui/index';
import { AufgabeZeile } from '@modules/mein-tag/teile';
import { TERMIN_ART_LABEL, TERMIN_STATUS_LABEL, zeitText } from '@modules/mein-tag/logik';
import { einsatzLosfahren, einsatzStarten, laeuft, naechsterEinsatz, telefonFuer } from './logik';
import { abschlussPfad, FeldAktionen, SyncStand } from './Feld';

function wannText(t: Termin) {
  const tag = datumVon(t.start);
  const d = tag === heute() ? 'Heute' : datumKurz(tag);
  return `${d}, ${zeitText(t)}`;
}

/**
 * Die eine zustandsabhängige Hauptaktion: Arbeit starten → Einsatz abschließen.
 * Losfahren steckt im Knopf „Navigation“ (Status „unterwegs“, Kunde bekommt „Wir sind unterwegs“).
 * „Einsatz abschließen“ führt zum Sprachbericht – dort wird einmal alles gebucht.
 */
export function hauptaktion(t: Termin): { label: string; icon: IconName; fn: () => string | void; erfolg: string } | undefined {
  if (t.status === 'geplant' || t.status === 'bestaetigt' || t.status === 'unterwegs') return { label: 'Arbeit starten', icon: 'start', fn: () => einsatzStarten(t.id), erfolg: 'Du bist vor Ort. Die Arbeit läuft.' };
  if (t.status === 'vor_ort') return { label: 'Einsatz abschließen', icon: 'mikro', fn: () => abschlussPfad(t.id), erfolg: 'Sag kurz, was du gemacht hast.' };
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
  return `Nächster Einsatz · ${wannText(t)}`;
}

/** Kunde, Ort, Adresse eines Termins (aufgelöst, nichts kopiert) */
function einsatzDaten(t: Termin) {
  const auftrag = db.auftraege.get(t.auftragId);
  const ort = db.orte.get(t.ortId ?? auftrag?.ortId);
  const kunde = db.kunden.get(t.kundeId ?? auftrag?.kundeId ?? ort?.kundeId);
  const adresse = ort?.adresse ?? kunde?.adresse;
  return { auftrag, ort, kunde, adresse, karte: mapsLink(adresse) };
}

/** „Navigation“: Karte öffnen – vor dem Start gilt das als Losfahren (Status „unterwegs“) */
function NavigationKnopf({ t, karte }: { t: Termin; karte: string }) {
  const losfahren = () => {
    if (t.status === 'geplant' || t.status === 'bestaetigt') {
      try {
        einsatzLosfahren(t.id);
      } catch {
        /* die Karte öffnet trotzdem */
      }
    }
  };
  return (
    <Button variante="sekundaer" icon="route" className="ne-gross" href={karte} neuerTab onClick={losfahren}>
      Navigation
    </Button>
  );
}

/**
 * Kompakt für „Heute“: Kunde, Adresse, Uhrzeit, Arbeit – [Navigation] [Arbeit starten].
 * Läuft die Arbeit, stehen Kamera und Sprache gleich daneben.
 */
export function EinsatzKurz({ t }: { t: Termin }) {
  useDatenstand();
  const ausfuehren = useAusfuehren();
  const { auftrag, ort, kunde, adresse, karte } = einsatzDaten(t);
  const haupt = hauptaktion(t);
  const vorOrt = t.status === 'vor_ort';
  return (
    <section className="mm-einsatz" aria-labelledby={`einsatz-${t.id}`}>
      <p className={oberzeileKlasse(oberzeile(t))}>{oberzeile(t)}</p>
      <h2 id={`einsatz-${t.id}`} className="mm-einsatz-kunde">
        {kunde?.name ?? t.titel} <BeispielMarke zeigen={t.beispiel} />
      </h2>
      {adresse && <p className="mm-einsatz-aufgabe">{adresse.strasse ? `${adresse.strasse}, ${adresse.ort}` : adresseText(adresse)}</p>}
      <p className="mm-meta">
        {zeitText(t)} Uhr{kunde ? ` · ${t.titel}` : ''}
        {ort?.hinweise ? (
          <>
            {' · '}
            <strong>{ort.hinweise}</strong>
          </>
        ) : null}
      </p>
      <div className="ne-aktionen">
        {!vorOrt && karte && <NavigationKnopf t={t} karte={karte} />}
        {haupt && (
          <Button icon={haupt.icon} className="ne-gross" onClick={() => ausfuehren(haupt.fn, haupt.erfolg)}>
            {haupt.label}
          </Button>
        )}
      </div>
      <Zeile abstand={8}>
        {vorOrt && (
          <>
            <Button variante="sekundaer" icon="kamera" className="ne-gross" onClick={() => erfassen('foto', auftrag?.id)}>
              Foto
            </Button>
            <Button variante="sekundaer" icon="mikro" className="ne-gross" onClick={() => erfassen('sprachnotiz', auftrag?.id)}>
              Sprache
            </Button>
          </>
        )}
        <Button variante="tertiaer" to={`/heute/naechster-einsatz/${t.id}`} icon="pfeilRechts">
          {vorOrt ? 'Alles zum Einsatz' : 'Details'}
        </Button>
      </Zeile>
      <SyncStand />
    </section>
  );
}

/**
 * Der Einsatz vollständig. Vor dem Start: Ort, Zugang, Anrufen, [Navigation] [Arbeit starten].
 * Vor Ort: „Einsatz abschließen“ und große Kacheln (Fotos, Sprache, Material, Checkliste, Problem, Unterschrift).
 */
export function EinsatzKarte({ t }: { t: Termin }) {
  useDatenstand();
  const ausfuehren = useAusfuehren();
  const { auftrag, ort, kunde, adresse, karte } = einsatzDaten(t);
  const tel = telefonFuer(t);
  const ich = useIch();
  const buero = istBuero(ich);
  // Monteure sehen am Einsatz nur ihre und nicht zugewiesene Aufgaben, Büro sieht alle
  const aufgaben = auftrag ? db.aufgaben.where((a) => a.auftragId === auftrag.id && !a.erledigt && (buero || !a.zustaendigId || a.zustaendigId === ich?.id)) : [];
  const team = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter(Boolean);
  const laufend = laeuft(t);
  const vorOrt = t.status === 'vor_ort';
  const haupt = hauptaktion(t);

  return (
    <Karte
      oberzeile={laufend ? (vorOrt ? 'Arbeit läuft' : 'Unterwegs') : `${TERMIN_ART_LABEL[t.art]} · ${wannText(t)}`}
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
          {adresse && <Meta>{adresseText(adresse)}</Meta>}
          <Zeile abstand={16}>
            {karte && vorOrt && (
              <a className="mm-textlink" href={karte} target="_blank" rel="noreferrer">
                <Icon name="route" size={16} /> Navigation
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

        {vorOrt ? (
          <FeldAktionen t={t} />
        ) : (
          haupt && (
            <div className="ne-aktionen">
              {karte && <NavigationKnopf t={t} karte={karte} />}
              <Button icon={haupt.icon} className="ne-gross" onClick={() => ausfuehren(haupt.fn, haupt.erfolg)}>
                {haupt.label}
              </Button>
            </div>
          )
        )}
        <SyncStand />

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

        {team.length > 1 && (
          <Meta>
            Mit dabei: <Personen ids={t.mitarbeiterIds} groesse={20} namen />
          </Meta>
        )}

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
