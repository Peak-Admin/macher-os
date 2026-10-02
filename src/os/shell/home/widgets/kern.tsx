/**
 * Die vier Kern-Widgets des Home: Dein nächster Schritt · Deine Arbeit · Dein Ansprechpartner · Neu für dich.
 * Bewusst verdichtet: Onboarding + Next Best Action, Aufgaben + Freigaben + Urlaubsaufgaben,
 * persönlicher Kontakt + Support, News + Workshops + Produktneuigkeiten.
 */
import { Link } from 'react-router-dom';
import { Avatar, BeispielMarke, Button, Icon, Status } from '@ui/index';
import { Skelett, LadeFehler } from '../Rahmen';
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
          <Icon name="check" />
        </span>
        <div className="mm-home-naechster-text">
          <h3 className="mm-home-naechster-titel">Alles eingerichtet.</h3>
          <p>Du bist startklar. Gerade wartet nichts Dringendes auf dich.</p>
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
          <Icon name={a.icon} />
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

// ------------------------------------------------------------------ Dein Ansprechpartner

const initialenAus = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function Support({ url, klick }: { url: string; klick: () => void }) {
  return (
    <div className="mm-home-kontakt-support">
      <span>Brauchst du technische Hilfe?</span>
      <Button variante="tertiaer" klein href={url} icon="pfeilRechts" onClick={klick}>
        Zum Support
      </Button>
    </div>
  );
}

export function AnsprechpartnerWidget({ groesse }: WidgetProps) {
  const z = useLaden('ansprechpartner', () => homeInhalte().ansprechpartner());
  if (z.status === 'laedt') return <Skelett avatar zeilen={3} />;
  if (z.status === 'fehler') return <LadeFehler text="Dein Ansprechpartner konnte nicht geladen werden." nochmal={z.nochmal} />;
  const p = z.daten;
  const klick = (ziel: string) => homeMessen('home_contact_clicked', { ziel });
  if (!p) {
    return (
      <div className="mm-home-kontakt">
        <p className="mm-home-leer-titel">Wir sind für dich da.</p>
        <p>Unser Team hilft dir bei Fragen weiter.</p>
        <div className="mm-home-kontakt-aktionen">
          <Button variante="sekundaer" klein href="/kontakt" icon="chat" onClick={() => klick('nachricht')}>
            Nachricht schreiben
          </Button>
        </div>
        <Support url="/hilfe-center" klick={() => klick('support')} />
      </div>
    );
  }
  return (
    <div className={`mm-home-kontakt${groesse === 'gross' ? ' mm-home-kontakt--breit' : ''}`}>
      {/* Echtes Teamfoto von Mission Mittelstand: Hinter dem Ansprechpartner steht ein ganzes Team */}
      <figure className="mm-home-kontakt-team">
        <img src="/bilder/mission-mittelstand/team.webp" alt="Das Team von Mission Mittelstand bei einer Besprechung" loading="lazy" decoding="async" />
        <figcaption>Das Team von Mission Mittelstand</figcaption>
      </figure>
      <div className="mm-home-kontakt-person">
        {p.avatarUrl ? <img src={p.avatarUrl} alt="" width={56} height={56} className="mm-home-kontakt-foto" /> : <Avatar text={initialenAus(p.name)} groesse={56} />}
        <div>
          <p className="mm-home-kontakt-name">
            {p.name} <BeispielMarke zeigen={p.beispiel} />
          </p>
          <p className="mm-meta">
            {p.role} · {p.company}
          </p>
        </div>
      </div>
      {p.zitat && <p className="mm-home-kontakt-zitat">„{p.zitat}“</p>}
      <div className="mm-home-kontakt-aktionen">
        {p.messageUrl && (
          <Button variante="sekundaer" klein href={p.messageUrl} icon="chat" onClick={() => klick('nachricht')}>
            Nachricht schreiben
          </Button>
        )}
        {p.bookingUrl && (
          <Button variante="tertiaer" klein href={p.bookingUrl} icon="kalender" onClick={() => klick('termin')}>
            Termin buchen
          </Button>
        )}
      </div>
      {p.supportUrl && (
        <Support url={p.supportUrl} klick={() => klick('support')} />
      )}
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
        <Icon name={NEWS_ICON[n.type]} size={18} />
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
