import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { ARBEITSWEISEN, GEWERKE, gewerkVorlage } from '@core/gewerke';
import { euro } from '@core/format';
import type { Arbeitsweise, Gewerk } from '@core/objects';
import { einrichten } from '@core/seed';
import { AuswahlKarten, Button, Eingabe, FormRaster, Fortschritt, Kennzahl, Liste, ListenZeile, Meldung, Meta, Oberzeile, Raster, Stapel, Zeile, useBestaetigen, type IconName, DateiFeld } from '@ui/index';
import { betriebEinrichten, gewerkLabel, kundenAusCsv, TEAM, vorbereitet, type Antworten, type CsvErgebnis, type Startdaten, type Teamgroesse } from './daten';
import './onboarding.css';

const SCHRITTE = ['Gewerk', 'Leistungen', 'Arbeitsweise', 'Team', 'Daten', 'Betrieb'] as const;

const AW_ICON: Record<Arbeitsweise, IconName> = { kundendienst: 'werkzeug', baustelle: 'auftraege', werkstatt: 'lager', wartung: 'wiederholen' };

/** Vollbild `/willkommen`: geführte Einrichtung im KI-Check-Muster – eine Frage je Schritt. */
export function Willkommen() {
  const betrieb = db.betrieb.useOne('betrieb');
  const [fertig, setFertig] = useState(false);
  const [neu, setNeu] = useState(false);
  if (fertig) return <Rahmen><Erfolg /></Rahmen>;
  if (betrieb?.onboardingFertig && !neu) return <Rahmen><SchonEingerichtet onNeu={() => setNeu(true)} /></Rahmen>;
  return (
    <Rahmen>
      <Ablauf onFertig={() => setFertig(true)} />
    </Rahmen>
  );
}

function Rahmen({ children }: { children: ReactNode }) {
  return (
    <div className="ob-rahmen">
      <header className="ob-marke">
        <div className="ob-marke-innen">
          <div className="ob-logo">
            <span className="mm-logo-zeichen" aria-hidden>
              M
            </span>
            <span>
              Macher <strong>OS</strong>
            </span>
          </div>
          <p className="ob-marke-statement">Dein Betrieb. Klar geführt.</p>
        </div>
      </header>
      <main className="ob-inhalt" id="inhalt">
        {children}
      </main>
    </div>
  );
}

function Ablauf({ onFertig }: { onFertig: () => void }) {
  const navigate = useNavigate();
  const [schritt, setSchritt] = useState(0);
  const [fehler, setFehler] = useState<string>();
  const [laedt, setLaedt] = useState(false);
  const [csv, setCsv] = useState<CsvErgebnis & { datei?: string }>();
  const [params] = useSearchParams();
  const [a, setA] = useState<Partial<Antworten> & { leistungen: string[]; arbeitsweisen: Arbeitsweise[]; start: Startdaten; betriebName: string; vorname: string; nachname: string }>(() => {
    // Von der Website („Kostenlos testen“) kommt das gewählte Gewerk mit: ?gewerk=elektro
    const g = GEWERKE.find((x) => x.id === params.get('gewerk'));
    return {
      gewerk: g?.id,
      leistungen: g ? g.leistungen.map((l) => l.name) : [],
      arbeitsweisen: g ? g.standardArbeitsweisen : [],
      start: 'beispiele',
      betriebName: params.get('betrieb') ?? '',
      vorname: '',
      nachname: '',
    };
  });
  const set = (patch: Partial<typeof a>) => (setA({ ...a, ...patch }), setFehler(undefined));
  const vorlage = a.gewerk ? gewerkVorlage(a.gewerk) : undefined;

  const pruefen = (): string | undefined => {
    switch (schritt) {
      case 0:
        return a.gewerk ? undefined : 'Wähle dein Gewerk.';
      case 1:
        return a.leistungen.length ? undefined : 'Wähle mindestens eine Leistung. Du kannst sie später ändern.';
      case 2:
        return a.arbeitsweisen.length ? undefined : 'Wähle mindestens eine Arbeitsweise.';
      case 3:
        return a.team ? undefined : 'Wähle, wie groß dein Team ist.';
      case 4:
        if (a.start === 'csv' && !csv?.kunden.length) return 'Lade eine Kundenliste hoch oder starte mit Beispieldaten.';
        return undefined;
      case 5:
        if (!a.betriebName.trim()) return 'Trage den Namen deines Betriebs ein.';
        if (!a.vorname.trim()) return 'Trage deinen Vornamen ein.';
        return undefined;
    }
  };

  const weiter = () => {
    const f = pruefen();
    if (f) return setFehler(f);
    if (schritt < SCHRITTE.length - 1) {
      setSchritt(schritt + 1);
      window.scrollTo?.({ top: 0 });
      return;
    }
    setLaedt(true);
    // kurz rendern lassen, damit „Wird eingerichtet …“ sichtbar ist
    setTimeout(() => {
      try {
        betriebEinrichten({ ...(a as Antworten), kunden: a.start === 'csv' ? csv?.kunden ?? [] : [] });
        onFertig();
      } catch (e) {
        console.error(e);
        setFehler('Dein Betrieb wurde noch nicht eingerichtet. Versuche es erneut.');
        setLaedt(false);
      }
    }, 30);
  };

  const gewerkWaehlen = (g: Gewerk) => {
    const v = gewerkVorlage(g);
    set({ gewerk: g, leistungen: v.leistungen.map((l) => l.name), arbeitsweisen: a.gewerk === g && a.arbeitsweisen.length ? a.arbeitsweisen : v.standardArbeitsweisen });
  };

  const dateiLesen = async (datei: File | undefined) => {
    if (!datei) return;
    try {
      const text = await datei.text();
      setCsv({ ...kundenAusCsv(text), datei: datei.name });
      setFehler(undefined);
    } catch {
      setCsv({ kunden: [], hinweise: [], fehler: 'Die Datei konnte nicht gelesen werden. Speichere sie als CSV und versuche es erneut.', datei: datei.name });
    }
  };

  const schnellstart = () => {
    einrichten({ betriebName: 'Musterbetrieb', gewerk: 'elektro', arbeitsweisen: [], teamgroesse: 5, chefVorname: 'Max', chefNachname: 'Macher', beispiele: true });
    navigate('/heute');
  };

  return (
    <div className="ob-ablauf">
      <Stapel abstand={8}>
        <Oberzeile>
          Schritt {schritt + 1} von {SCHRITTE.length} · {SCHRITTE[schritt]}
        </Oberzeile>
        <Fortschritt wert={schritt + 1} max={SCHRITTE.length} label="Fortschritt der Einrichtung" />
      </Stapel>

      {schritt === 0 && (
        <Frage titel="Was macht ihr?" text="Dein Gewerk bestimmt Leistungen, Material, Qualifikationen und Begriffe. Alles lässt sich später ändern.">
          <AuswahlKarten
            label="Gewerk"
            wert={a.gewerk ?? ('' as Gewerk)}
            onChange={(v) => gewerkWaehlen(v as Gewerk)}
            optionen={GEWERKE.map((g) => ({ wert: g.id, label: g.label, text: g.leistungen.slice(1, 4).map((l) => l.name).join(', ') }))}
          />
        </Frage>
      )}

      {schritt === 1 && vorlage && (
        <Frage titel="Welche Arbeiten bietet ihr an?" text="Macher legt diese Leistungen mit üblichen Richtpreisen an. Wähle ab, was du nicht anbietest – Preise passt du später an.">
          <Zeile zwischen>
            <Meta>
              {a.leistungen.length} von {vorlage.leistungen.length} gewählt
            </Meta>
            <Button variante="tertiaer" klein onClick={() => set({ leistungen: a.leistungen.length === vorlage.leistungen.length ? [] : vorlage.leistungen.map((l) => l.name) })}>
              {a.leistungen.length === vorlage.leistungen.length ? 'Alle abwählen' : 'Alle wählen'}
            </Button>
          </Zeile>
          <AuswahlKarten
            label="Leistungen"
            mehrfach
            wert={a.leistungen}
            onChange={(v) => set({ leistungen: v as string[] })}
            optionen={vorlage.leistungen.map((l) => ({ wert: l.name, label: l.name, text: `${l.kategorie} · Richtpreis ${euro(Math.round(l.preis * 100))} je ${l.einheit}` }))}
          />
        </Frage>
      )}

      {schritt === 2 && (
        <Frage titel="Wie arbeitet ihr?" text="Danach richtet Macher Abläufe, Planung und Erinnerungen ein. Mehrere Antworten sind möglich.">
          <AuswahlKarten
            label="Arbeitsweisen"
            mehrfach
            wert={a.arbeitsweisen}
            onChange={(v) => set({ arbeitsweisen: v as Arbeitsweise[] })}
            optionen={ARBEITSWEISEN.map((w) => ({ wert: w.id, label: w.label, text: w.text, icon: AW_ICON[w.id] }))}
          />
        </Frage>
      )}

      {schritt === 3 && (
        <Frage titel="Wie groß ist euer Team?" text="Davon hängt ab, wie viel Planung und Abstimmung Macher dir anbietet.">
          <AuswahlKarten label="Teamgröße" wert={a.team ?? ('' as Teamgroesse)} onChange={(v) => set({ team: v as Teamgroesse })} optionen={TEAM.map((t) => ({ wert: t.wert, label: t.label, text: t.text, icon: t.zahl === 1 ? 'person' : 'team' }))} />
        </Frage>
      )}

      {schritt === 4 && (
        <Frage titel="Welche Daten gibt es schon?" text="Starte mit Beispieldaten zum Ausprobieren oder bring deine Kundenliste mit.">
          <AuswahlKarten
            label="Startdaten"
            wert={a.start}
            onChange={(v) => set({ start: v as Startdaten })}
            optionen={[
              { wert: 'beispiele', label: 'Mit Beispieldaten starten', text: 'Beispielkunden, Aufträge und Termine – als „Beispiel“ markiert und mit einem Klick entfernbar.', icon: 'stern' },
              { wert: 'csv', label: 'Kundenliste importieren', text: 'CSV-Datei aus Excel oder deinem bisherigen Programm.', icon: 'upload' },
              { wert: 'leer', label: 'Ohne Daten starten', text: 'Du legst Kunden und Aufträge selbst an.', icon: 'plus' },
            ]}
          />
          {a.start === 'csv' && (
            <Stapel abstand={12}>
              <DateiFeld
                label="CSV-Datei"
                accept=".csv,text/csv,text/plain"
                knopf="CSV-Datei wählen"
                hilfe="Erste Zeile mit Überschriften, z. B. Name; Straße; PLZ; Ort; Telefon; E-Mail."
                dateien={csv?.datei ? [{ name: csv.datei }] : []}
                onDateien={([f]) => dateiLesen(f)}
              />
              {csv?.fehler && <Meldung ton="achtung" titel="Import nicht möglich">{csv.fehler}</Meldung>}
              {csv && !csv.fehler && (
                <Meldung ton={csv.kunden.length ? 'erfolg' : 'achtung'} titel={csv.kunden.length === 1 ? '1 Kunde erkannt' : `${csv.kunden.length} Kunden erkannt`}>
                  {csv.hinweise.length ? `${csv.hinweise.length} Zeilen übersprungen: ${csv.hinweise.slice(0, 2).join(' ')}` : `Aus ${csv.datei}. Sie werden beim Einrichten angelegt.`}
                </Meldung>
              )}
              {!!csv?.kunden.length && (
                <Liste>
                  {csv.kunden.slice(0, 3).map((k, i) => (
                    <ListenZeile key={i} titel={k.name} untertitel={[k.adresse ? `${k.adresse.plz} ${k.adresse.ort}`.trim() : undefined, k.telefon].filter(Boolean).join(' · ')} />
                  ))}
                </Liste>
              )}
            </Stapel>
          )}
        </Frage>
      )}

      {schritt === 5 && (
        <Frage titel="Wie heißt dein Betrieb?" text="Der Name erscheint auf Angeboten und Rechnungen. Du bist als Chef angelegt.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              weiter();
            }}
          >
            <FormRaster spalten={1}>
              <Eingabe label="Name des Betriebs" value={a.betriebName} onChange={(e) => set({ betriebName: e.target.value })} autoFocus autoComplete="organization" placeholder="z. B. Elektro Meier GmbH" />
            </FormRaster>
            <div style={{ height: 20 }} />
            <FormRaster>
              <Eingabe label="Dein Vorname" value={a.vorname} onChange={(e) => set({ vorname: e.target.value })} autoComplete="given-name" />
              <Eingabe label="Dein Nachname" value={a.nachname} onChange={(e) => set({ nachname: e.target.value })} autoComplete="family-name" optional />
            </FormRaster>
            <button type="submit" hidden />
          </form>
        </Frage>
      )}

      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}

      <div className="ob-navigation">
        {schritt > 0 ? (
          <Button variante="tertiaer" icon="zurueck" onClick={() => (setSchritt(schritt - 1), setFehler(undefined))} disabled={laedt}>
            Zurück
          </Button>
        ) : (
          <span />
        )}
        <Button icon={schritt === SCHRITTE.length - 1 ? 'check' : 'weiter'} onClick={weiter} laedt={laedt} laedtText="Dein Betrieb wird eingerichtet …">
          {schritt === SCHRITTE.length - 1 ? 'Betrieb einrichten' : 'Weiter'}
        </Button>
      </div>

      {schritt === 0 && (
        <div className="ob-schnell">
          <Meta>Erst mal nur umsehen?</Meta>
          <Button variante="tertiaer" onClick={schnellstart}>
            Beispielbetrieb einrichten
          </Button>
        </div>
      )}
    </div>
  );
}

function Frage({ titel, text, children }: { titel: string; text: string; children: ReactNode }) {
  return (
    <section className="ob-frage" aria-label={titel}>
      <div className="ob-frage-kopf">
        <h1>{titel}</h1>
        <p>{text}</p>
      </div>
      {children}
    </section>
  );
}

function Erfolg() {
  const navigate = useNavigate();
  const b = db.betrieb.get('betrieb');
  const liste = vorbereitet();
  const kunden = db.kunden.all();
  const beispiele = kunden.some((k) => k.beispiel);
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <Oberzeile>Fertig</Oberzeile>
        <h1>Dein Betrieb ist eingerichtet</h1>
        <p>
          {b?.name} ist für {b ? gewerkLabel(b.gewerk) : 'dein Gewerk'} vorbereitet. Das hat Macher für dich angelegt:
        </p>
      </div>
      <Raster min={180}>
        {liste.map((x) => (
          <Kennzahl key={x.label} label={x.label} wert={x.anzahl} />
        ))}
        {kunden.length > 0 && <Kennzahl label={beispiele ? 'Beispielkunden' : 'Kunden importiert'} wert={kunden.length} />}
      </Raster>
      {beispiele && <Meldung>Beispieldaten sind mit „Beispiel“ markiert, damit du sie von echten Daten unterscheidest. Sie lassen sich später gesammelt entfernen.</Meldung>}
      <Meta>Preise, Leistungen und Regeln sind Startwerte. Passe sie an, wann immer du willst.</Meta>
      <div>
        <Button icon="weiter" onClick={() => navigate('/heute', { replace: true })}>
          Zu Heute
        </Button>
      </div>
    </div>
  );
}

function SchonEingerichtet({ onNeu }: { onNeu: () => void }) {
  const navigate = useNavigate();
  const b = db.betrieb.get('betrieb');
  const [fragen, dialog] = useBestaetigen();
  return (
    <div className="ob-ablauf">
      <div className="ob-frage-kopf">
        <h1>{b?.name} ist schon eingerichtet</h1>
        <p>Du kannst direkt weiterarbeiten.</p>
      </div>
      <div className="ob-navigation">
        <Button
          variante="tertiaer"
          onClick={async () => {
            if (await fragen('Neu einrichten?', 'Wenn du die Einrichtung abschließt, werden alle Daten in diesem Browser ersetzt – Kunden, Aufträge, Rechnungen. Das lässt sich nicht rückgängig machen.', 'Alles löschen und neu starten')) onNeu();
          }}
        >
          Neu einrichten
        </Button>
        <Button icon="weiter" onClick={() => navigate('/heute')}>
          Zu Heute
        </Button>
      </div>
      {dialog}
    </div>
  );
}
