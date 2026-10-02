/**
 * Die Kern-Widgets des Home: Dein nächster Schritt · Erste Schritte · Deine Arbeit · Hilfe & Ansprechpartner · Neu für dich.
 * Bewusst verdichtet: Next Best Action, Einrichtung als Checkliste, Aufgaben + Freigaben + Urlaubsaufgaben,
 * persönlicher Kontakt + Hilfe, News + Workshops + Produktneuigkeiten.
 */
import { Link } from 'react-router-dom';
import { Avatar, BeispielMarke, Button, Icon, Status, ThemenIcon } from '@ui/index';
import { useDatenstand } from '@core/db';
import { oeffne } from '@core/overlay';
import { Skelett, LadeFehler } from '../Rahmen';
import { ANSPRECHPARTNER, ansprechpartnerAnzeige, SUPPORT } from '../quellen/ansprechpartner';
import { ERSTE_SCHRITTE_AUS, ersteSchritteJetzt } from '../quellen/ersteSchritte';
import { homeMessen } from '../messen';
import { bezugKennung, useArbeit, useNaechsteAktionen } from '../quellen/hooks';
import { homeInhalte, useLaden } from '../quellen/inhalte';
import { STATUS_TEXT } from '../quellen/arbeit';
import type { NewsItem, NewsTyp, WidgetProps, WorkItem } from '../typen';
import { darf } from '@core/session';
import { setzeEinstellung } from '@core/einstellungen';

// ------------------------------------------------------------------ Dein nächster Schritt

export function NaechsterSchrittWidget({ groesse, ich }: WidgetProps) {
  const aktionen = useNaechsteAktionen(ich);
  const a = aktionen[0];
  if (!a) {
    return (
      <div className="mm-home-naechster mm-home-naechster--fertig">
        <span className="mm-home-kachel" aria-hidden>
          <ThemenIcon name="check" size={44} />
        </span>
        <div className="mm-home-naechster-text">
          <h3 className="mm-home-naechster-titel">Gerade wartet nichts auf dich.</h3>
          <p>Neue Anfragen, Angebote und Rechnungen erscheinen hier, sobald etwas zu tun ist.</p>
        </div>
        {darf('schreiben', ich) && (
          <div className="mm-home-naechster-aktion">
            <Button variante="sekundaer" to="/auftraege/auftraege/neu" icon="auftraege">
              Auftrag anlegen
            </Button>
          </div>
        )}
      </div>
    );
  }
  const danach = aktionen.slice(1, groesse === 'gross' ? 4 : 3);
  const p = a.progress;
  return (
    <div className="mm-home-naechster">
      <div className="mm-home-naechster-kopf">
        <span className="mm-home-kachel" aria-hidden>
          <ThemenIcon name={a.icon} size={44} />
        </span>
        <div className="mm-home-naechster-text">
          <h3 className="mm-home-naechster-titel">{a.title}</h3>
          <p>{a.description}</p>
        </div>
      </div>
      {p && (
        <div className="mm-home-fortschritt">
          <div className="mm-home-fortschritt-balken" role="progressbar" aria-valuenow={p.erledigt} aria-valuemin={0} aria-valuemax={p.gesamt} aria-label="Einrichtung">
            <span style={{ width: `${Math.round((p.erledigt / p.gesamt) * 100)}%` }} />
          </div>
          <span className="mm-meta mm-number">
            {p.erledigt} von {p.gesamt} Schritten erledigt
          </span>
          {p.schritte && (
            <ul className={`mm-home-schritte${groesse === 'gross' ? ' mm-home-schritte--zwei' : ''}`}>
              {p.schritte.map((s) => (
                <li key={s.titel} className={s.erledigt ? 'erledigt' : undefined}>
                  <span className={`mm-home-haken${s.erledigt ? ' mm-home-haken--an' : ''}`} aria-hidden>
                    {s.erledigt && <Icon name="check" size={14} />}
                  </span>
                  {s.titel}
                  <span className="sr-only">{s.erledigt ? ' – erledigt' : ' – offen'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mm-home-naechster-aktion">
        <Button to={a.actionUrl} icon="pfeilRechts" onClick={() => homeMessen('home_next_action_clicked', { typ: a.type })}>
          {a.actionLabel}
        </Button>
        {a.ausblenden && (
          <Button variante="tertiaer" onClick={() => (setzeEinstellung(a.ausblenden!, true), homeMessen('home_next_action_hidden', { typ: a.type }))}>
            Ausblenden
          </Button>
        )}
      </div>
      {danach.length > 0 && (
        <div className="mm-home-danach">
          <p className="mm-meta">Danach</p>
          <ul>
            {danach.map((d) => (
              <li key={d.id}>
                <Link to={d.actionUrl} onClick={() => homeMessen('home_next_action_clicked', { typ: d.type, rang: 'danach' })}>
                  <Icon name={d.icon} size={18} />
                  <span>{d.title}</span>
                  <Icon name="weiter" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Deine Arbeit

const STATUS_TON: Record<WorkItem['status'], 'neutral' | 'aktiv' | 'erfolg' | 'achtung'> = {
  to_do: 'neutral',
  in_progress: 'aktiv',
  waiting: 'neutral',
  ready: 'erfolg',
  completed: 'erfolg',
};

export function ArbeitWidget({ groesse, ich }: WidgetProps) {
  const oben = useNaechsteAktionen(ich)[0];
  const posten = useArbeit(ich, bezugKennung(oben));
  const max = groesse === 'gross' ? 8 : 4;
  if (!posten.length) {
    return (
      <div className="mm-home-leer">
        <p className="mm-home-leer-titel">Alles erledigt 🎉</p>
        <p>Aktuell wartet nichts auf deine Bearbeitung.</p>
      </div>
    );
  }
  return (
    <>
      <ul className={`mm-home-posten${groesse === 'gross' ? ' mm-home-posten--zwei' : ''}`}>
        {posten.slice(0, max).map((w) => (
          <li key={w.id} className="mm-home-posten-zeile">
            <div className="mm-home-posten-text">
              <span className="mm-home-posten-titel">
                {w.title} <BeispielMarke zeigen={w.beispiel} />
              </span>
              <span className="mm-meta">{w.description}</span>
              <span>
                {w.ueberfaellig ? <Status ton="achtung">Überfällig</Status> : <Status ton={STATUS_TON[w.status]}>{STATUS_TEXT[w.status]}</Status>}
              </span>
            </div>
            <Button variante={w === posten[0] ? 'sekundaer' : 'tertiaer'} klein to={w.actionUrl} onClick={() => homeMessen('home_work_item_clicked', { typ: w.type })}>
              {w.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
      {posten.length > max && <p className="mm-meta">und {posten.length - max} weitere</p>}
    </>
  );
}

// ------------------------------------------------------------------ Erste Schritte

export function ErsteSchritteWidget({ ich }: WidgetProps) {
  useDatenstand();
  const schritte = ersteSchritteJetzt(ich);
  const erledigt = schritte.filter((x) => x.erledigt).length;
  const naechster = schritte.find((x) => !x.erledigt);
  if (!naechster) {
    return (
      <div className="mm-home-leer">
        <p className="mm-home-leer-titel">Alle ersten Schritte erledigt.</p>
        <p>Dieser Baustein blendet sich auf deinem Home jetzt von selbst aus.</p>
      </div>
    );
  }
  return (
    <div className="mm-home-fortschritt">
      <div className="mm-home-fortschritt-balken" role="progressbar" aria-valuenow={erledigt} aria-valuemin={0} aria-valuemax={schritte.length} aria-label="Erste Schritte">
        <span style={{ width: `${Math.round((erledigt / schritte.length) * 100)}%` }} />
      </div>
      <span className="mm-meta mm-number">
        {erledigt} von {schritte.length} erledigt
      </span>
      <ul className="mm-home-schritte">
        {schritte.map((x) => (
          <li key={x.id} className={x.erledigt ? 'erledigt' : undefined}>
            <span className={`mm-home-haken${x.erledigt ? ' mm-home-haken--an' : ''}`} aria-hidden>
              {x.erledigt && <Icon name="check" size={14} />}
            </span>
            {x.titel}
            <span className="sr-only">{x.erledigt ? ' – erledigt' : ' – offen'}</span>
          </li>
        ))}
      </ul>
      <div className="mm-home-kontakt-aktionen">
        <Button variante="sekundaer" klein to={naechster.aktion.pfad} icon="pfeilRechts" onClick={() => homeMessen('home_widget_clicked', { widget: 'erste-schritte', ziel: naechster.id })}>
          {naechster.aktion.label}
        </Button>
        <Button variante="tertiaer" klein onClick={() => (setzeEinstellung(ERSTE_SCHRITTE_AUS, true), homeMessen('home_next_action_hidden', { typ: 'erste-schritte' }))}>
          Ausblenden
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Hilfe & Ansprechpartner

export function AnsprechpartnerWidget({ groesse }: WidgetProps) {
  const p = ansprechpartnerAnzeige(ANSPRECHPARTNER);
  const klick = (ziel: string) => homeMessen('home_contact_clicked', { ziel });
  return (
    <div className={`mm-home-kontakt${groesse === 'gross' ? ' mm-home-kontakt--breit' : ''}`}>
      {p ? (
        <div className="mm-home-kontakt-person">
          {p.foto ? <img src={p.foto} alt="" width={56} height={56} className="mm-home-kontakt-foto" /> : <Avatar text={p.initialen} groesse={56} />}
          <div>
            <p className="mm-home-kontakt-name">{p.name}</p>
            <p className="mm-meta">{p.rolle}</p>
            {(p.telefon || p.email) && <p className="mm-meta">{[p.telefon?.text, p.email?.text].filter(Boolean).join(' · ')}</p>}
          </div>
        </div>
      ) : (
        <div>
          <p className="mm-home-leer-titel">Wir helfen dir weiter.</p>
          <p>Kommst du nicht weiter, schreib uns. Sobald dein persönlicher Ansprechpartner eingetragen ist, steht er hier.</p>
        </div>
      )}
      <div className="mm-home-kontakt-aktionen">
        {p?.telefon && (
          <Button variante="sekundaer" klein href={p.telefon.href} icon="telefon" aria-label={`${p.name} anrufen`} onClick={() => klick('anrufen')}>
            Anrufen
          </Button>
        )}
        <Button variante={p?.telefon ? 'tertiaer' : 'sekundaer'} klein href={p?.email?.href ?? `mailto:${SUPPORT.email}`} icon="mail" onClick={() => klick('email')}>
          E-Mail schreiben
        </Button>
      </div>
      <div className="mm-home-kontakt-support">
        <Button variante="tertiaer" klein icon="macher" onClick={() => (klick('macher'), oeffne('macher'))}>
          Macher fragen
        </Button>
        <Button variante="tertiaer" klein href={SUPPORT.hilfe} neuerTab icon="wissen" onClick={() => klick('hilfe')}>
          Anleitungen
        </Button>
        <Button variante="tertiaer" klein href={SUPPORT.kontakt} neuerTab icon="chat" onClick={() => klick('support')}>
          Kontakt & Support
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Neu für dich

const NEWS_LABEL: Record<NewsTyp, string> = {
  news: 'Neuigkeit',
  workshop: 'Workshop',
  product_update: 'Neu in Macher OS',
  template: 'Vorlage',
  guide: 'Anleitung',
};

const NEWS_ICON: Record<NewsTyp, string> = { news: 'info', workshop: 'kalender', product_update: 'macher', template: 'dokument', guide: 'wissen' };
const kurzDatum = (d: string) => d.split('-').reverse().slice(0, 2).join('.') + '.';

function NewsZeile({ n }: { n: NewsItem }) {
  const klick = () => homeMessen('home_news_clicked', { typ: n.type, id: n.id });
  return (
    <li className="mm-home-news">
      <span className="mm-home-news-icon" aria-hidden>
        <ThemenIcon name={NEWS_ICON[n.type]} size={32} strichGroesse={18} />
      </span>
      <div className="mm-home-news-text">
        <span className="mm-meta">
          {NEWS_LABEL[n.type]}
          {n.eventDate ? ` · ${kurzDatum(n.eventDate)}` : ''} <BeispielMarke zeigen={n.beispiel} />
        </span>
        <span className="mm-home-news-titel">{n.title}</span>
        {!n.extern ? (
          <Link to={n.actionUrl} onClick={klick} className="mm-home-textlink">
            {n.actionLabel}
          </Link>
        ) : (
          <a href={n.actionUrl} onClick={klick} className="mm-home-textlink">
            {n.actionLabel}
          </a>
        )}
      </div>
    </li>
  );
}

export function NeuWidget({ groesse, ich }: WidgetProps) {
  const z = useLaden(`neuigkeiten:${ich.rolle}`, () => homeInhalte().neuigkeiten(ich.rolle));
  if (z.status === 'laedt') return <Skelett zeilen={4} />;
  if (z.status === 'fehler') return <LadeFehler text="Neuigkeiten konnten nicht geladen werden." nochmal={z.nochmal} />;
  const liste = z.daten.slice(0, groesse === 'gross' ? 6 : 3);
  if (!liste.length) return <p className="mm-meta">Aktuell gibt es keine neuen Meldungen.</p>;
  return <ul className={`mm-home-newsliste${groesse === 'gross' ? ' mm-home-newsliste--zwei' : ''}`}>{liste.map((n) => <NewsZeile key={n.id} n={n} />)}</ul>;
}
