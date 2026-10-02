/**
 * Schlichte Ansicht je Takt unter `/macher/takte/<takt>` – dorthin führt die Benachrichtigung.
 * Höchstens drei Blöcke, eine Hauptaktion. Kommt der Link mit `?aktion=…`, wird die Entscheidung
 * sofort ausgeführt (Entscheiden direkt aus der Benachrichtigung).
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDatenstand } from '@core/db';
import { datum as datumText, euro } from '@core/format';
import { messen } from '@core/messung';
import { pfadZu } from '@core/modul';
import { useDarf, useIch } from '@core/session';
import { Abschnitt, Button, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, useToast } from '@ui/index';
import { aktionAusLink, taktAktionAusfuehren, ZEITEN_BESTAETIGEN } from './aktionen';
import { inhaltFuer } from './browser';
import { dauerText, type DeinTagInhalt, type Entscheidung, type TagesbriefInhalt, type WochenbilanzInhalt, type ZeitenInhalt } from './inhalt';
import { taktDef, type TaktId } from './regeln';

const MATERIAL_STATUS: Record<string, string> = { geplant: 'Geplant', bestellt: 'Bestellt', bereit: 'Bereit', verbraucht: 'Verbraucht' };
const kartenLink = (adresse: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;

/** Führt Aktionen aus und zeigt das Ergebnis – für Knöpfe in der Ansicht und Links aus der Benachrichtigung */
function useAusfuehren(takt: TaktId) {
  const toast = useToast();
  const navigate = useNavigate();
  return (aktion: string, payload: unknown, weg: 'benachrichtigung' | 'ansicht', label?: string) => {
    try {
      const ziel = taktAktionAusfuehren(takt, aktion, payload, weg);
      toast(label ? `Erledigt: ${label}.` : 'Erledigt.');
      if (ziel && typeof ziel === 'string') navigate(ziel);
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Das hat nicht geklappt. Versuche es erneut.', { ton: 'achtung' });
      return false;
    }
  };
}

// ------------------------------------------------------------------ Dein Tag

function DeinTag({ i }: { i: DeinTagInhalt }) {
  const e = i.erster;
  if (!e) {
    return (
      <Leer
        icon="kalender"
        titel={i.abwesend ? `Heute: ${i.abwesend}` : 'Heute ist kein Einsatz geplant'}
        text={i.abwesend ? 'Genieß den Tag. Morgen früh kommt dein Tag wieder als Nachricht.' : 'Wenn das Büro dich einplant, steht dein erster Einsatz hier – mit Adresse und Material.'}
        aktion={<Button variante="sekundaer" to="/heute/mein-tag">Mein Tag öffnen</Button>}
      />
    );
  }
  return (
    <>
      <Karte oberzeile={`Erster Einsatz · ${e.zeit}`} titel={e.titel}>
        <Stapel abstand={8}>
          {e.kunde && <Meta>{e.kunde}</Meta>}
          {e.adresse && (
            <div>
              <Button variante="tertiaer" klein icon="route" href={kartenLink(e.adresse)} neuerTab>
                {e.adresse}
              </Button>
            </div>
          )}
          {(e.vorOrt || e.telefon) && (
            <Meta>
              {[e.vorOrt && `Vor Ort: ${e.vorOrt}`, e.telefon].filter(Boolean).join(' · ')}
            </Meta>
          )}
          {i.anzahl > 1 && <Meta>Danach noch {i.anzahl - 1 === 1 ? '1 Termin' : `${i.anzahl - 1} Termine`} – alles unter „Mein Tag“.</Meta>}
        </Stapel>
      </Karte>
      <Abschnitt titel="Material">
        {i.material.length ? (
          <Liste>
            {i.material.map((m, n) => (
              <ListenZeile key={n} titel={`${m.menge} ${m.einheit} ${m.text}`} untertitel={m.auftrag} rechts={<Status ton={m.status === 'bereit' ? 'erfolg' : m.status === 'bestellt' ? 'aktiv' : 'neutral'}>{MATERIAL_STATUS[m.status]}</Status>} />
            ))}
          </Liste>
        ) : (
          <Meta>Für heute ist kein Material eingetragen.</Meta>
        )}
      </Abschnitt>
      {i.hinweise.length > 0 && (
        <Abschnitt titel="Hinweise">
          <Liste>
            {i.hinweise.map((h, n) => (
              <ListenZeile key={n} titel={h} />
            ))}
          </Liste>
        </Abschnitt>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Tagesbrief

function EntscheidungZeile({ e, erste, ausfuehren }: { e: Entscheidung; erste: boolean; ausfuehren: ReturnType<typeof useAusfuehren> }) {
  const [erledigt, setErledigt] = useState(false);
  const pfad = e.pfad;
  return (
    <ListenZeile
      titel={e.titel}
      untertitel={e.text}
      links={<Status ton={e.art === 'problem' ? 'achtung' : 'aktiv'}>{e.art === 'freigabe' ? 'Freigabe' : e.art === 'problem' ? 'Problem' : 'Entscheidung'}</Status>}
      rechts={
        erledigt ? (
          <Status ton="erfolg">Erledigt</Status>
        ) : (
          <>
            {e.aktionen.slice(0, 2).map((a, n) => (
              <Button key={a.aktion} klein variante={erste && n === 0 ? 'primaer' : 'sekundaer'} onClick={() => ausfuehren(a.aktion, a.payload, 'ansicht', a.label) && setErledigt(true)}>
                {a.label}
              </Button>
            ))}
            {!e.aktionen.length && pfad && (
              <Button klein variante="tertiaer" icon="pfeilRechts" to={pfad}>
                Öffnen
              </Button>
            )}
          </>
        )
      }
    />
  );
}

function Tagesbrief({ i, ausfuehren }: { i: TagesbriefInhalt; ausfuehren: ReturnType<typeof useAusfuehren> }) {
  return (
    <>
      <Abschnitt
        titel="Entscheidungen"
        aktion={
          i.weitere > 0 ? (
            <Button variante="tertiaer" klein to="/heute/braucht-dich" icon="pfeilRechts">
              {i.weitere === 1 ? '1 weitere' : `${i.weitere} weitere`}
            </Button>
          ) : undefined
        }
      >
        {i.entscheidungen.length ? (
          <Liste>
            {i.entscheidungen.map((e, n) => (
              <EntscheidungZeile key={e.schluessel} e={e} erste={n === 0} ausfuehren={ausfuehren} />
            ))}
          </Liste>
        ) : (
          <Meldung ton="erfolg" titel="Nichts brennt.">
            Heute wartet keine Entscheidung auf dich. Macher meldet sich, wenn sich das ändert.
          </Meldung>
        )}
      </Abschnitt>
      {i.geld && (
        <Abschnitt titel="Geld">
          <Raster min={180}>
            <Kennzahl label={`Eingänge ${i.geld.seitText}`} wert={i.geld.eingaenge.anzahl ? euro(i.geld.eingaenge.summe) : 'Keine'} hinweis={i.geld.eingaenge.anzahl ? (i.geld.eingaenge.anzahl === 1 ? '1 Zahlung' : `${i.geld.eingaenge.anzahl} Zahlungen`) : undefined} to="/betrieb/zahlungen" />
            <Kennzahl label="Überfällig" wert={i.geld.ueberfaellig.anzahl ? euro(i.geld.ueberfaellig.summe) : 'Nichts'} ton={i.geld.ueberfaellig.anzahl ? 'achtung' : 'erfolg'} hinweis={i.geld.ueberfaellig.anzahl ? (i.geld.ueberfaellig.anzahl === 1 ? '1 Rechnung' : `${i.geld.ueberfaellig.anzahl} Rechnungen`) : undefined} to="/plan/offen" />
          </Raster>
          {i.geld.ueberfaellig.liste.length > 0 && (
            <Liste>
              {i.geld.ueberfaellig.liste.map((p) => (
                <ListenZeile key={p.rechnungId} titel={`${p.nummer} · ${p.kunde}`} untertitel={`seit ${p.tageUeber === 1 ? '1 Tag' : `${p.tageUeber} Tagen`} fällig`} rechts={<Status ton="achtung">{euro(p.offen)}</Status>} to={pfadZu({ typ: 'rechnungen', id: p.rechnungId })} />
              ))}
            </Liste>
          )}
        </Abschnitt>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Zeiten bestätigen

function Zeiten({ i }: { i: ZeitenInhalt }) {
  if (!i.eintraege.length && !i.laeuft) {
    return i.termineOhneZeit.length ? (
      <Abschnitt titel="Termine ohne Zeit">
        <Liste>
          {i.termineOhneZeit.map((t) => (
            <ListenZeile key={t.terminId} titel={t.titel} untertitel={t.zeit} rechts={<Status ton="achtung">Keine Zeit</Status>} />
          ))}
        </Liste>
      </Abschnitt>
    ) : (
      <Leer icon="uhr" titel="Heute keine Zeiten" text="Du hast heute nichts erfasst und keinen Einsatz gehabt. Nichts zu bestätigen." />
    );
  }
  return (
    <>
      {i.bestaetigt && <Meldung ton="erfolg" titel="Bestätigt">Deine Zeiten von heute sind bestätigt. Das Büro gibt sie frei.</Meldung>}
      <Abschnitt titel={`Heute ${dauerText(i.minuten)}`}>
        <Liste>
          {i.eintraege.map((z) => (
            <ListenZeile key={z.id} titel={`${z.start}–${z.ende}`} untertitel={[z.titel, z.pause ? `${z.pause} Min. Pause` : null].filter(Boolean).join(' · ')} rechts={<Meta>{dauerText(z.minuten)}</Meta>} />
          ))}
          {i.laeuft && <ListenZeile titel={`${i.laeuft.start}–jetzt`} untertitel={i.laeuft.titel} rechts={<Status ton="aktiv">Läuft</Status>} />}
        </Liste>
        {i.laeuft && !i.bestaetigt && <Meta>Beim Bestätigen endet die laufende Zeit jetzt.</Meta>}
      </Abschnitt>
      {i.termineOhneZeit.length > 0 && (
        <Abschnitt titel="Ohne Zeit">
          <Liste>
            {i.termineOhneZeit.map((t) => (
              <ListenZeile key={t.terminId} titel={t.titel} untertitel={t.zeit} rechts={<Status ton="achtung">Keine Zeit</Status>} />
            ))}
          </Liste>
        </Abschnitt>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Wochenbilanz

function Wochenbilanz({ i }: { i: WochenbilanzInhalt }) {
  return (
    <>
      <Raster min={200}>
        <Kennzahl label="Umsatz netto" wert={euro(i.umsatz.netto)} hinweis={i.umsatz.anzahl === 1 ? 'aus 1 Rechnung' : `aus ${i.umsatz.anzahl} Rechnungen`} />
        <Kennzahl label="Offene Posten" wert={euro(i.offen.summe)} ton={i.offen.anzahlUeberfaellig ? 'achtung' : undefined} hinweis={i.offen.anzahlUeberfaellig ? `davon ${euro(i.offen.ueberfaellig)} überfällig` : i.offen.anzahl ? 'nichts überfällig' : 'alles bezahlt'} to="/plan/offen" />
        <Kennzahl label="Aufträge fertig" wert={i.auftraege.abgeschlossen} hinweis={`${i.auftraege.neu} neu · ${i.auftraege.laufend} laufen`} to="/auftraege" />
      </Raster>
      <Karte oberzeile="Macher hat erledigt" titel={i.erledigt.anzahl === 1 ? '1 Sache diese Woche' : `${i.erledigt.anzahl} Sachen diese Woche`} aktion={<Button variante="tertiaer" klein to="/heute/erledigt" icon="pfeilRechts">Ansehen</Button>}>
        <Meta>{i.erledigt.minuten > 0 ? `Gesparte Zeit: ca. ${dauerText(i.erledigt.minuten)} (Schätzung je Regel, keine Messung).` : 'Für diese Woche liegt noch keine Zeitschätzung vor.'}</Meta>
      </Karte>
    </>
  );
}

// ------------------------------------------------------------------ Seite

const UNTERTITEL: Record<TaktId, string> = {
  'dein-tag': 'Was heute auf dich wartet.',
  tagesbrief: 'Was du heute entscheiden musst – und dein Geld.',
  zeiten: 'Stimmt alles? Ein Tipp, fertig.',
  wochenbilanz: 'Wo der Betrieb diese Woche steht.',
};

export function TaktSeite() {
  useDatenstand();
  const { takt: roh } = useParams();
  const def = taktDef(roh ?? '');
  const ich = useIch();
  const geld = useDarf('geld');
  const ort = useLocation();
  const navigate = useNavigate();
  const ausfuehren = useAusfuehren((def?.id ?? 'tagesbrief') as TaktId);
  const ausgefuehrt = useRef(false);
  const suche = new URLSearchParams(ort.search);
  const quelle = suche.get('quelle') === 'benachrichtigung' ? 'benachrichtigung' : 'app';

  // Messpunkt: Tagesbrief geöffnet (einmal je Aufruf)
  useEffect(() => {
    if (def?.id === 'tagesbrief') messen('gewohnheit.tagesbrief_geoeffnet', { quelle });
  }, [def?.id, quelle]);

  // Entscheidung direkt aus der Benachrichtigung: einmal ausführen, dann Link bereinigen
  useEffect(() => {
    if (!def || ausgefuehrt.current) return;
    const a = aktionAusLink(suche);
    if (!a) return;
    ausgefuehrt.current = true;
    navigate(ort.pathname, { replace: true });
    ausfuehren(a.aktion, a.payload, 'benachrichtigung');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, ort.search]);

  if (!def) {
    return (
      <Seite titel="Takt nicht gefunden">
        <Leer icon="glocke" titel="Diesen Takt gibt es nicht" text="Die Takte heißen Dein Tag, Tagesbrief, Zeiten bestätigen und Wochenbilanz." aktion={<Button to="/macher/benachrichtigungen/einstellungen">Takte einstellen</Button>} />
      </Seite>
    );
  }
  if (!ich) {
    return (
      <Seite titel={def.titel}>
        <Leer icon="person" titel="Noch niemand angemeldet" text="Richte zuerst deinen Betrieb ein. Danach kommt dein Takt jeden Tag von allein." aktion={<Button to="/willkommen">Betrieb einrichten</Button>} />
      </Seite>
    );
  }
  if (def.id === 'wochenbilanz' && !geld) {
    return (
      <Seite titel={def.titel}>
        <Meldung titel="Nur mit Recht „Preise & Geld“">Die Wochenbilanz zeigt Umsatz und offene Posten. Frag deinen Chef, wenn du sie brauchst.</Meldung>
      </Seite>
    );
  }

  const i = inhaltFuer(def.id, ich);
  const fuerRolle = def.rollen.includes(ich.rolle);
  const hauptaktion =
    i.takt === 'dein-tag' && i.erster ? (
      <Button to={pfadZu({ typ: 'termine', id: i.erster.terminId }) ?? '/heute/mein-tag'} icon="pfeilRechts">
        Einsatz öffnen
      </Button>
    ) : i.takt === 'zeiten' && !i.bestaetigt && (i.eintraege.length || i.laeuft) ? (
      <Button icon="check" onClick={() => ausfuehren(ZEITEN_BESTAETIGEN, { mitarbeiterId: ich.id, datum: i.datum }, 'ansicht', 'Zeiten bestätigt')}>
        Zeiten bestätigen
      </Button>
    ) : i.takt === 'zeiten' && !i.bestaetigt && i.termineOhneZeit.length ? (
      <Button icon="uhr" onClick={() => ausfuehren('zeiten.nachtragen', { datum: i.datum }, 'ansicht')}>
        Zeiten nachtragen
      </Button>
    ) : i.takt === 'wochenbilanz' ? (
      <Button variante="sekundaer" to="/betrieb/auswertung" icon="diagramm">
        Auswertung öffnen
      </Button>
    ) : undefined;

  return (
    <Seite
      titel={def.titel}
      oberzeile={i.takt === 'wochenbilanz' ? `${datumText(i.von)} – ${datumText(i.bis)}` : datumText(i.datum)}
      untertitel={UNTERTITEL[def.id]}
      aktion={hauptaktion}
      zurueck={{ to: '/macher/benachrichtigungen', label: 'Benachrichtigungen' }}
    >
      <Stapel abstand={24}>
        {!fuerRolle && <Meta>Dieser Takt ist für {def.rollen.includes('chef') ? 'Chef und Büro' : 'Monteure'} gedacht. Du siehst ihn trotzdem, weil du ihn geöffnet hast.</Meta>}
        {i.takt === 'dein-tag' && <DeinTag i={i} />}
        {i.takt === 'tagesbrief' && <Tagesbrief i={i} ausfuehren={ausfuehren} />}
        {i.takt === 'zeiten' && <Zeiten i={i} />}
        {i.takt === 'wochenbilanz' && <Wochenbilanz i={i} />}
      </Stapel>
    </Seite>
  );
}
