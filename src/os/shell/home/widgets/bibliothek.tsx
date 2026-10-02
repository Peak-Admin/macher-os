/**
 * Weitere Widgets für die Bibliothek. Alle lesen echte Daten über die bestehenden Module –
 * nichts wird kopiert, nichts erfunden. Leere Zustände nennen immer einen konkreten nächsten Schritt.
 */
import { useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { datumKurz, euro, heute, plusTage, personName, relativ, tageZwischen, wochentag } from '@core/format';
import { offeneHinweise } from '@core/macher';
import { modul, modulPfad, pfadZu } from '@core/modul';
import type { ID } from '@core/objects';
import { darf, istBuero } from '@core/session';
import { Button, Icon, Liste, ListenZeile, Meta, Status, Textfeld } from '@ui/index';
import { ErfassenKnopf } from '@ui/objekt';
import { HinweisZeile } from '@modules/braucht-dich/BrauchtDich';
import { EinsatzKurz } from '@modules/naechster-einsatz/Einsatz';
import { naechsterEinsatz } from '@modules/naechster-einsatz/logik';
import { aufgabenFuer, termineAm } from '@modules/mein-tag/logik';
import { AufgabeZeile, TerminZeile } from '@modules/mein-tag/teile';
import { AnfrageZeile } from '@modules/anfragen/AnfragenListe';
import { offeneAnfragen } from '@modules/anfragen/daten';
import { QualiDialog } from '@modules/anfragen/Qualifizieren';
import { useOffen, OffenEintraege } from '@modules/offen/OffenListe';
import { ThreadZeile } from '@modules/nachrichten/Posteingang';
import { threads } from '@modules/nachrichten/daten';
import { istUeberfaellig, offenePosten, offenerBetrag } from '@modules/rechnungen/logik';
import { useKennzahlen } from '@modules/auswertung/AuswertungSeite';
import { ART_LABEL as ABWESENHEIT_LABEL } from '@modules/abwesenheiten/daten';
import { ErledigtZeile } from '@modules/erledigt/Erledigt';
import { erledigungenIm, minutenText, zusammenfassen } from '@modules/erledigt/logik';
import { einordnen } from '@modules/wartung/logik';
import { useAuslastung } from '@modules/auslastung/Auslastung';
import { teamWoche } from '@modules/auslastung/daten';
import { useFavoriten } from '../../favoriten';
import type { WidgetProps } from '../typen';

const anzahl = (groesse: WidgetProps['groesse'], klein = 3, gross = 6) => (groesse === 'gross' ? gross : klein);

/** Kleine Zahlenzeilen statt verschachtelter Karten */
type Wert = { label: string; wert: string; hinweis?: string; ton?: 'achtung' };

function Werte({ werte }: { werte: Wert[] }) {
  return (
    <dl className="mm-home-werte">
      {werte.map((w) => (
        <div key={w.label} className={w.ton ? `mm-home-wert mm-home-wert--${w.ton}` : 'mm-home-wert'}>
          <dt>{w.label}</dt>
          <dd className="mm-number">{w.wert}</dd>
          {w.hinweis && <dd className="mm-meta">{w.hinweis}</dd>}
        </div>
      ))}
    </dl>
  );
}

// ------------------------------------------------------------------ Tag & Planung

export function DeinTagWidget({ groesse, ich }: WidgetProps) {
  useDatenstand();
  const tag = heute();
  const max = anzahl(groesse);
  const termine = termineAm(tag, ich.id).filter((t) => t.status !== 'erledigt' && t.status !== 'abgesagt');
  const aufgaben = aufgabenFuer(ich.id, tag);
  if (!termine.length && !aufgaben.length) return <Meta>Heute steht für dich nichts an. Genieß den ruhigen Tag – oder plan die Woche.</Meta>;
  return (
    <Liste>
      {termine.slice(0, max).map((t) => (
        <TerminZeile key={t.id} t={t} />
      ))}
      {aufgaben.slice(0, Math.max(0, max - termine.length)).map((a) => (
        <AufgabeZeile key={a.id} a={a} tag={tag} />
      ))}
    </Liste>
  );
}

export function EinsatzWidget({ ich }: WidgetProps) {
  useDatenstand();
  const t = naechsterEinsatz(ich.id);
  if (!t)
    return (
      <div className="mm-home-karte-innen">
        <p className="mm-home-widget-titel">Dein nächster Einsatz</p>
        <Meta>In den nächsten zwei Wochen ist für dich nichts eingeplant. Frag im Büro, wenn du etwas erwartest.</Meta>
      </div>
    );
  return <EinsatzKurz t={t} />;
}

export function BetriebHeuteWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const alle = termineAm(heute()).filter((t) => t.status !== 'abgesagt');
  const unbesetzt = alle.filter((t) => t.art !== 'intern' && t.mitarbeiterIds.length === 0);
  const laufen = alle.filter((t) => t.status === 'vor_ort' || t.status === 'unterwegs');
  const zeigen = [...unbesetzt, ...alle.filter((t) => !unbesetzt.includes(t))].slice(0, anzahl(groesse));
  if (!alle.length) return <Meta>Heute sind keine Termine im Betrieb geplant.</Meta>;
  return (
    <>
      <Meta>
        {alle.length === 1 ? '1 Termin' : `${alle.length} Termine`} · {laufen.length} {laufen.length === 1 ? 'läuft' : 'laufen'} gerade
        {unbesetzt.length ? ` · ${unbesetzt.length} ohne Mitarbeiter` : ''}
      </Meta>
      <Liste>
        {zeigen.map((t) => (
          <TerminZeile key={t.id} t={t} mitNamen />
        ))}
      </Liste>
    </>
  );
}

const WOCHENTAG = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WocheWidget({ groesse, ich }: WidgetProps) {
  useDatenstand();
  const start = heute();
  const fuerAlle = darf('planen', ich);
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(start, i)).filter((d) => groesse === 'gross' || wochentag(d) <= 6);
  return (
    <ul className="mm-home-woche">
      {tage.map((d) => {
        const termine = termineAm(d, fuerAlle ? undefined : ich.id).filter((t) => t.status !== 'abgesagt');
        return (
          <li key={d} className={d === start ? 'heute' : undefined}>
            <span className="mm-home-woche-tag">
              {d === start ? 'Heute' : WOCHENTAG[wochentag(d)]} <span className="mm-meta mm-number">{datumKurz(d)}</span>
            </span>
            <span className="mm-home-woche-inhalt">
              {termine.length ? (
                <>
                  <strong className="mm-number">{termine.length === 1 ? '1 Termin' : `${termine.length} Termine`}</strong>
                  {groesse === 'gross' && <span className="mm-meta"> · {termine.slice(0, 2).map((t) => t.titel).join(', ')}</span>}
                </>
              ) : (
                <span className="mm-meta">frei</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function EinplanenWidget({ groesse }: WidgetProps) {
  const offen = useOffen();
  if (!offen.length) return <Meta>Alles ist eingeplant. Jeder beauftragte Auftrag hat einen Termin.</Meta>;
  return (
    <>
      <Meta>{offen.length === 1 ? '1 Auftrag wartet auf einen Termin' : `${offen.length} Aufträge warten auf einen Termin`}</Meta>
      <OffenEintraege eintraege={offen} max={anzahl(groesse)} />
    </>
  );
}

export function AbwesendWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const tag = heute();
  const weg = db.abwesenheiten.where((a) => a.status === 'genehmigt' && a.von <= tag && a.bis >= tag);
  const aktive = db.mitarbeiter.where((m) => m.aktiv).length;
  if (!weg.length) return <Meta>Heute sind alle da{aktive ? ` – ${aktive} im Team` : ''}.</Meta>;
  return (
    <Liste>
      {weg.slice(0, anzahl(groesse, 4, 8)).map((a) => {
        const m = db.mitarbeiter.get(a.mitarbeiterId);
        return (
          <ListenZeile
            key={a.id}
            to={pfadZu({ typ: 'abwesenheiten', id: a.id })}
            titel={personName(m)}
            untertitel={a.bis === tag ? 'zurück morgen' : `bis ${datumKurz(a.bis)}`}
            rechts={<Status>{ABWESENHEIT_LABEL[a.art]}</Status>}
          />
        );
      })}
    </Liste>
  );
}

// ------------------------------------------------------------------ Eingang & Entscheidungen

export function EntscheidungenWidget({ groesse, ich }: WidgetProps) {
  useDatenstand();
  const liste = offeneHinweise({ rolle: ich.rolle, mitarbeiterId: ich.id });
  if (!liste.length) return <Meta>Nichts brennt. Macher meldet sich hier, sobald etwas deine Entscheidung braucht.</Meta>;
  return (
    <Liste>
      {liste.slice(0, anzahl(groesse)).map((h) => (
        <HinweisZeile key={h.schluessel} h={h} kompakt />
      ))}
    </Liste>
  );
}

export function AnfragenWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const offen = offeneAnfragen();
  const [wahl, setWahl] = useState<ID>();
  return (
    <>
      {offen.length ? (
        <Liste>
          {offen.slice(0, anzahl(groesse)).map((a) => (
            <AnfrageZeile key={a.id} a={a} onWahl={setWahl} />
          ))}
        </Liste>
      ) : (
        <Meta>Keine neuen Anfragen. Ein Anruf kommt rein? Nimm ihn direkt auf.</Meta>
      )}
      {!offen.length && (
        <div>
          <Button variante="sekundaer" klein icon="telefon" to="/auftraege/anfragen/neu">
            Anfrage aufnehmen
          </Button>
        </div>
      )}
      {wahl && <QualiDialog auftragId={wahl} onSchliessen={() => setWahl(undefined)} />}
    </>
  );
}

export function NachrichtenWidget({ groesse, ich }: WidgetProps) {
  const alle = db.nachrichten.use();
  const offen = threads(alle, ich.id).filter((t) => t.ungelesen > 0);
  if (!offen.length) return <Meta>Keine ungelesenen Nachrichten.</Meta>;
  return (
    <Liste>
      {offen.slice(0, anzahl(groesse)).map((t) => (
        <ThreadZeile key={t.schluessel} t={t} />
      ))}
    </Liste>
  );
}

// ------------------------------------------------------------------ Geld

export function AngeboteWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const tag = heute();
  const offen = db.angebote.where((a) => a.status === 'versendet').sort((a, b) => (a.versendetAm ?? '').localeCompare(b.versendetAm ?? ''));
  const entwuerfe = db.angebote.where((a) => a.status === 'entwurf').length;
  if (!offen.length && !entwuerfe)
    return (
      <>
        <Meta>Gerade wartet kein Angebot auf Antwort.</Meta>
        <div>
          <Button variante="sekundaer" klein icon="dokument" to="/start/angebot">
            Angebot schreiben
          </Button>
        </div>
      </>
    );
  return (
    <>
      <Meta>
        {offen.length === 1 ? '1 Angebot wartet auf Antwort' : `${offen.length} Angebote warten auf Antwort`}
        {entwuerfe ? ` · ${entwuerfe} ${entwuerfe === 1 ? 'Entwurf' : 'Entwürfe'}` : ''}
      </Meta>
      {offen.length > 0 && (
        <Liste>
          {offen.slice(0, anzahl(groesse)).map((a) => {
            const tage = a.versendetAm ? tageZwischen(a.versendetAm.slice(0, 10), tag) : 0;
            return (
              <ListenZeile
                key={a.id}
                to={pfadZu({ typ: 'angebote', id: a.id })}
                titel={a.titel}
                untertitel={[db.kunden.get(a.kundeId)?.name, a.geoeffnetAm ? 'vom Kunden geöffnet' : 'noch nicht geöffnet'].filter(Boolean).join(' · ')}
                rechts={<Status ton={tage >= 7 ? 'achtung' : 'neutral'}>{tage === 0 ? 'heute raus' : tage === 1 ? 'seit 1 Tag' : `seit ${tage} Tagen`}</Status>}
              />
            );
          })}
        </Liste>
      )}
    </>
  );
}

export function OffenePostenWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const posten = offenePosten();
  if (!posten.length) return <Meta>Alles bezahlt. Keine offenen Rechnungen.</Meta>;
  const ueber = posten.filter((r) => istUeberfaellig(r));
  const summe = posten.reduce((s, r) => s + offenerBetrag(r), 0);
  const sortiert = [...ueber, ...posten.filter((r) => !ueber.includes(r))];
  return (
    <>
      <Werte
        werte={[
          { label: 'Offen', wert: euro(summe), hinweis: posten.length === 1 ? '1 Rechnung' : `${posten.length} Rechnungen` },
          ...(ueber.length ? [{ label: 'Überfällig', wert: euro(ueber.reduce((s, r) => s + offenerBetrag(r), 0)), hinweis: ueber.length === 1 ? '1 Rechnung' : `${ueber.length} Rechnungen`, ton: 'achtung' as const }] : []),
        ]}
      />
      <Liste>
        {sortiert.slice(0, anzahl(groesse)).map((r) => (
          <ListenZeile
            key={r.id}
            to={pfadZu({ typ: 'rechnungen', id: r.id })}
            titel={`${r.nummer} · ${db.kunden.get(r.kundeId)?.name ?? r.titel}`}
            untertitel={`fällig ${relativ(r.faelligAm)}`}
            rechts={
              <span className="mm-home-betrag">
                <span className="mm-number">{euro(offenerBetrag(r))}</span>
                {istUeberfaellig(r) && <Status ton="achtung">Überfällig</Status>}
              </span>
            }
          />
        ))}
      </Liste>
    </>
  );
}

export function ZahlenWidget({ groesse }: WidgetProps) {
  const k = useKennzahlen('monat');
  const leer = 'Noch keine Daten';
  const werte: Wert[] = [
    { label: 'Umsatz netto', wert: k.umsatz.anzahl ? euro(k.umsatz.netto) : leer, hinweis: k.zeitraum.label },
    { label: 'Offene Posten', wert: euro(k.offen.summe), hinweis: k.offen.ueberfaellig ? `${euro(k.offen.ueberfaellig)} überfällig` : 'nichts überfällig', ton: k.offen.ueberfaellig ? 'achtung' : undefined },
  ];
  if (groesse === 'gross')
    werte.push(
      { label: 'Auftragsbestand', wert: k.bestand.anzahl ? euro(k.bestand.summe) : leer, hinweis: k.bestand.anzahl ? `${k.bestand.anzahl} ${k.bestand.anzahl === 1 ? 'Auftrag' : 'Aufträge'}` : undefined },
      { label: 'Angebotsquote', wert: k.quote ? `${Math.round(k.quote.anteil * 100)} %` : leer, hinweis: k.quote ? `${k.quote.angenommen} von ${k.quote.entschieden} angenommen` : undefined },
    );
  return <Werte werte={werte} />;
}

// ------------------------------------------------------------------ Team & Betrieb

export function AuslastungWidget() {
  const daten = useAuslastung();
  if (!daten.length) return <Meta>Noch keine Monteure mit Arbeitszeiten. Leg dein Team unter Betrieb an.</Meta>;
  const w = [teamWoche(daten, 0), teamWoche(daten, 1)];
  const ueber = daten.filter((m) => m.wochen[0].bewertung === 'ueberlast').length;
  const text = (x: (typeof w)[number]) => (x.verfuegbar ? `${Math.round(x.quote * 100)} %` : 'Niemand da');
  return (
    <Werte
      werte={[
        { label: 'Diese Woche', wert: text(w[0]), hinweis: ueber ? `${ueber} überlastet` : `${w[0].geplant} von ${w[0].verfuegbar} h verplant`, ton: ueber ? 'achtung' : undefined },
        { label: 'Nächste Woche', wert: text(w[1]), hinweis: `${w[1].geplant} von ${w[1].verfuegbar} h verplant` },
      ]}
    />
  );
}

export function WartungWidget({ groesse }: WidgetProps) {
  useDatenstand();
  const t = heute();
  const anlagen = db.anlagen
    .where((a) => !!a.naechsteWartung && ['ueberfaellig', 'woche', 'monat'].includes(einordnen(a.naechsteWartung, t)))
    .sort((a, b) => a.naechsteWartung!.localeCompare(b.naechsteWartung!));
  if (!anlagen.length) return <Meta>In diesem Monat ist keine Wartung fällig.</Meta>;
  return (
    <Liste>
      {anlagen.slice(0, anzahl(groesse)).map((a) => {
        const z = einordnen(a.naechsteWartung!, t);
        return (
          <ListenZeile
            key={a.id}
            to={pfadZu({ typ: 'anlagen', id: a.id })}
            titel={`${a.typ}${a.hersteller ? ` · ${a.hersteller}` : ''}`}
            untertitel={db.kunden.get(a.kundeId)?.name}
            rechts={<Status ton={z === 'ueberfaellig' ? 'achtung' : 'neutral'}>{z === 'ueberfaellig' ? 'Überfällig' : `fällig ${relativ(a.naechsteWartung)}`}</Status>}
          />
        );
      })}
    </Liste>
  );
}

export function ErledigtWidget({ groesse, ich }: WidgetProps) {
  useDatenstand();
  const liste = erledigungenIm('woche', ich);
  const s = zusammenfassen(liste);
  if (!liste.length) return <Meta>Diese Woche hat Macher noch nichts für dich erledigt. Alles, was automatisch passiert, steht hier.</Meta>;
  return (
    <>
      <Meta>
        Diese Woche {s.anzahl === 1 ? '1 Sache' : `${s.anzahl} Sachen`} erledigt{s.minuten > 0 ? ` · ${minutenText(s.minuten)} gespart (Schätzung)` : ''}
      </Meta>
      <Liste>
        {liste.slice(0, anzahl(groesse)).map((e) => (
          <ErledigtZeile key={e.id} e={e} />
        ))}
      </Liste>
    </>
  );
}

// ------------------------------------------------------------------ Abkürzungen

export function SchnellWidget({ ich }: WidgetProps) {
  const geld = darf('geld', ich);
  const buero = istBuero(ich);
  return (
    <div className="mm-home-schnell">
      {geld && (
        <Button variante="sekundaer" klein icon="dokument" to="/start/angebot">
          Angebot schreiben
        </Button>
      )}
      {geld && (
        <Button variante="sekundaer" klein icon="euro" to="/start/rechnung">
          Rechnung schreiben
        </Button>
      )}
      {buero && (
        <Button variante="sekundaer" klein icon="telefon" to="/auftraege/anfragen/neu">
          Anfrage aufnehmen
        </Button>
      )}
      {modul('fotos') && <ErfassenKnopf aktion="foto" variante="sekundaer" klein />}
      {modul('arbeitszeiten') && <ErfassenKnopf aktion="zeit" variante="sekundaer" klein />}
      {modul('abwesenheiten') && <ErfassenKnopf aktion="abwesenheit" variante="sekundaer" klein />}
    </div>
  );
}

export function FavoritenWidget() {
  const { module } = useFavoriten();
  if (!module.length) return <Meta>Markiere unter Betrieb bis zu drei Module mit dem Stern – sie erscheinen dann hier.</Meta>;
  return (
    <ul className="mm-home-favoriten">
      {module.map((m) => (
        <li key={m.id}>
          <Button variante="tertiaer" to={modulPfad(m)} icon={m.icon ?? 'stern'}>
            {m.titel}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function NotizWidget({ ich }: WidgetProps) {
  const [gespeichert, speichern] = useEinstellung<string>(`home.notiz.${ich.id}`, '');
  const [text, setText] = useState(gespeichert);
  const [status, setStatus] = useState<'' | 'gespeichert'>('');
  return (
    <div className="mm-home-notiz">
      <Textfeld
        label="Nur für dich sichtbar"
        value={text}
        rows={4}
        placeholder="z. B. Freitag Material bei Großhändler abholen"
        onChange={(e) => {
          setText(e.target.value);
          setStatus('');
        }}
        onBlur={() => {
          if (text !== gespeichert) {
            speichern(text);
            setStatus('gespeichert');
          }
        }}
      />
      <p className="mm-meta" aria-live="polite">
        {status === 'gespeichert' ? (
          <>
            <Icon name="check" size={14} /> Gespeichert
          </>
        ) : (
          'Wird beim Verlassen des Feldes gespeichert.'
        )}
      </p>
    </div>
  );
}
