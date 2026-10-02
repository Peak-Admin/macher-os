/** Gemeinsamer Rahmen jedes Widgets: Titel, Inhalt, optional „Alle ansehen“. Fehler bleiben im Widget. */
import { Component, useId, type ReactNode } from 'react';
import { Button, SkizzenKachel } from '@ui/index';
import { homeMessen } from './messen';
import type { WidgetDefinition } from './typen';

class Fehlergrenze extends Component<{ children: ReactNode; name: string }, { fehler: boolean; versuch: number }> {
  state = { fehler: false, versuch: 0 };
  static getDerivedStateFromError() {
    return { fehler: true };
  }
  render() {
    if (this.state.fehler)
      return (
        <div className="mm-home-fehler" role="alert">
          <p>„{this.props.name}“ konnte gerade nicht geladen werden. Der Rest deiner Seite funktioniert.</p>
          <div>
            <Button variante="sekundaer" klein icon="wiederholen" onClick={() => this.setState((s) => ({ fehler: false, versuch: s.versuch + 1 }))}>
              Erneut versuchen
            </Button>
          </div>
        </div>
      );
    return <div key={this.state.versuch} className="mm-home-widget-inhalt">{this.props.children}</div>;
  }
}

export function WidgetRahmen({ def, children, kopfRechts }: { def: WidgetDefinition; children: ReactNode; kopfRechts?: ReactNode }) {
  const id = useId();
  return (
    <section className={`mm-home-widget mm-home-widget--${def.id}`} aria-labelledby={def.ohneTitel ? undefined : id} aria-label={def.ohneTitel ? def.name : undefined}>
      {!def.ohneTitel && (
        <header className="mm-home-widget-kopf">
          <span className="mm-home-widget-titelzeile">
            {/* Widgets mit Bild zeigen die kleine Fenster-Skizze ihres Themas (früher ein Objektfoto) */}
            {def.objekt && <SkizzenKachel icon={def.icon} groesse="klein" />}
            <h2 id={id} className="mm-home-widget-titel">
              {def.name}
            </h2>
          </span>
          {kopfRechts}
        </header>
      )}
      <Fehlergrenze name={def.name}>{children}</Fehlergrenze>
      {def.alle && (
        <footer className="mm-home-widget-fuss">
          <Button variante="tertiaer" klein to={def.alle.pfad} icon="pfeilRechts" onClick={() => homeMessen('home_widget_clicked', { widget: def.id, ziel: 'alle' })}>
            {def.alle.label}
          </Button>
        </footer>
      )}
    </section>
  );
}

/** Platzhalter beim Laden – feste Höhe, damit nichts springt */
export function Skelett({ zeilen = 3, avatar }: { zeilen?: number; avatar?: boolean }) {
  return (
    <div className="mm-home-skelett" aria-busy="true" aria-label="Wird geladen">
      {avatar && <span className="mm-home-skelett-avatar" />}
      {Array.from({ length: zeilen }, (_, i) => (
        <span key={i} className="mm-home-skelett-zeile" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function LadeFehler({ text, nochmal }: { text: string; nochmal: () => void }) {
  return (
    <div className="mm-home-fehler" role="alert">
      <p>{text}</p>
      <div>
        <Button variante="sekundaer" klein icon="wiederholen" onClick={nochmal}>
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}
