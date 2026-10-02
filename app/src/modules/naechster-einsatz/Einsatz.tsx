import { useParams, useNavigate } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { adresseText, datumKurz, datumVon, heute, mapsLink, personName, telLink } from '@core/format';
import { aktionAusfuehren, pfadZu } from '@core/modul';
import { oeffne } from '@core/overlay';
import { istBuero, useIch } from '@core/session';
import type { Termin } from '@core/objects';
import { ObjektPanels } from '@ui/objekt';
import { BeispielMarke, Button, Icon, Karte, Leer, Liste, Meldung, Meta, Seite, Stapel, Status, useToast, Zeile } from '@ui/index';
import { AufgabeZeile } from '@modules/mein-tag/teile';
import { TERMIN_ART_LABEL, TERMIN_STATUS_LABEL, zeitText } from '@modules/mein-tag/logik';
import { aktionVorhanden, einsatzBeenden, einsatzLosfahren, einsatzStarten, laeuft, naechsterEinsatz, telefonFuer } from './logik';

/** Link-Button für externe Ziele (Karten-App, Telefon) – `Button to` kann nur interne Pfade. */
function LinkKnopf({ href, icon, children, primaer }: { href: string; icon: string; children: string; primaer?: boolean }) {
  return (
    <a className={`mm-btn mm-btn--${primaer ? 'primaer' : 'sekundaer'}`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      <Icon name={icon} />
      <span>{children}</span>
    </a>
  );
}

function wannText(t: Termin) {
  const tag = datumVon(t.start);
  const d = tag === heute() ? 'Heute' : datumKurz(tag);
  return `${d}, ${zeitText(t)}`;
}

/** Der Einsatz kompakt und vollständig: Ort, Zugang, Anrufen, Arbeit, Start/Ende. */
export function EinsatzKarte({ t, kompakt }: { t: Termin; kompakt?: boolean }) {
  useDatenstand();
  const toast = useToast();
  const navigate = useNavigate();
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
  const bericht = aktionVorhanden('bericht.erstellen') && auftrag;

  const ausfuehren = (fn: () => string | void, erfolg: string) => {
    try {
      const ziel = fn();
      toast(erfolg);
      if (ziel) navigate(ziel);
    } catch {
      toast('Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
    }
  };

  return (
    <Karte
      oberzeile={laufend ? (t.status === 'vor_ort' ? 'Läuft gerade' : 'Unterwegs') : `Nächster Einsatz · ${TERMIN_ART_LABEL[t.art]}`}
      titel={
        <>
          {t.titel} <BeispielMarke zeigen={t.beispiel} />
        </>
      }
      aktion={<Status ton={laufend ? 'aktiv' : 'neutral'}>{TERMIN_STATUS_LABEL[t.status]}</Status>}
    >
      <Stapel abstand={16}>
        <Stapel abstand={4}>
          <Meta>
            <strong>{wannText(t)}</strong>
            {kunde ? ` · ${kunde.name}` : ''}
            {auftrag ? ` · ${auftrag.nummer}` : ''}
          </Meta>
          {(ort || kunde?.adresse) && <Meta>{adresseText(ort?.adresse ?? kunde?.adresse)}</Meta>}
        </Stapel>

        {ort?.hinweise && (
          <Meldung ton="achtung" titel="Zugang & Hinweise vor Ort">
            {ort.hinweise}
            {ort.ansprechpartnerVorOrt ? ` Ansprechpartner: ${ort.ansprechpartnerVorOrt}.` : ''}
          </Meldung>
        )}

        <Zeile abstand={8}>
          {karte && <LinkKnopf href={karte} icon="route">Navigation starten</LinkKnopf>}
          {tel && <LinkKnopf href={telLink(tel.nummer)!} icon="telefon">{`${tel.wer} anrufen`}</LinkKnopf>}
        </Zeile>

        {!kompakt && (auftrag?.beschreibung || t.notiz) && (
          <Stapel abstand={4}>
            <strong>Was zu tun ist</strong>
            {t.notiz && <p>{t.notiz}</p>}
            {auftrag?.beschreibung && <p>{auftrag.beschreibung}</p>}
          </Stapel>
        )}
        {kompakt && (auftrag?.beschreibung || t.notiz) && <Meta>{(t.notiz || auftrag?.beschreibung || '').slice(0, 140)}{(t.notiz || auftrag?.beschreibung || '').length > 140 ? ' …' : ''}</Meta>}

        {aufgaben.length > 0 && (
          <Stapel abstand={8}>
            <strong>Offene Aufgaben ({aufgaben.length})</strong>
            <Liste>
              {aufgaben.slice(0, kompakt ? 3 : 20).map((a) => (
                <AufgabeZeile key={a.id} a={a} />
              ))}
            </Liste>
          </Stapel>
        )}

        {!kompakt && team.length > 1 && <Meta>Mit dabei: {team.map((m) => personName(m)).join(', ')}</Meta>}

        <Zeile abstand={8}>
          {offen && (
            <Button icon="start" onClick={() => ausfuehren(() => einsatzStarten(t.id), 'Einsatz gestartet.')}>
              Einsatz starten
            </Button>
          )}
          {t.status === 'unterwegs' && (
            <Button icon="start" onClick={() => ausfuehren(() => einsatzStarten(t.id), 'Du bist vor Ort. Einsatz läuft.')}>
              Bin vor Ort
            </Button>
          )}
          {t.status === 'vor_ort' && (
            <Button icon="stop" onClick={() => ausfuehren(() => einsatzBeenden(t.id), 'Einsatz beendet.')}>
              Einsatz beenden
            </Button>
          )}
          {offen && (
            <Button variante="sekundaer" icon="auto" onClick={() => ausfuehren(() => einsatzLosfahren(t.id), 'Gute Fahrt. Status: unterwegs.')}>
              Losfahren
            </Button>
          )}
          <Button variante="sekundaer" icon="kamera" onClick={() => oeffne('schnell', { auftragId: auftrag?.id })}>
            Erfassen
          </Button>
          {bericht && t.status === 'vor_ort' && (
            <Button variante="tertiaer" icon="notiz" onClick={() => ausfuehren(() => aktionAusfuehren('bericht.erstellen', { auftragId: auftrag.id, terminId: t.id }), 'Bericht angelegt.')}>
              Bericht schreiben
            </Button>
          )}
          {kompakt ? (
            <Button variante="tertiaer" to={`/heute/naechster-einsatz/${t.id}`} icon="pfeilRechts">
              Details
            </Button>
          ) : (
            auftrag && (
              <Button variante="tertiaer" to={pfadZu({ typ: 'auftraege', id: auftrag.id }) ?? `/auftrag/${auftrag.id}`} icon="auftraege">
                Zum Auftrag
              </Button>
            )
          )}
        </Zeile>
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
  return <EinsatzKarte t={t} kompakt />;
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
