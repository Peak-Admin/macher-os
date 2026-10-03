/**
 * Deine Seitenleiste – der persönliche Teil unter den vier Hauptbereichen (nach Peak One).
 * Hier richtet sich jeder ein, was er sehen will: Module, Smart Views, gemerkte Seiten und Ordner.
 *
 * - „+“ öffnet das Menü zum Hinzufügen (Modul · Smart View · Diese Seite merken · Ordner).
 * - Jeder Eintrag hat ein Menü „…“ (Umbenennen, nach oben/unten, in einen Ordner, entfernen). Es erscheint beim
 *   Überfahren und ist mit „Anpassen“ dauerhaft sichtbar – keine Aktion nur per Hover oder Ziehen.
 * - Einträge lassen sich jederzeit ziehen: vor oder hinter einen anderen Eintrag oder mitten auf einen Ordner.
 * Eingeklappt bleiben nur die Icons der Einträge.
 */
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useEinstellung } from '@core/einstellungen';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { modul, modulPfad } from '@core/modul';
import { useIch } from '@core/session';
import { passt } from '@core/format';
import { Button, Dialog, Icon, Status, Suchfeld, ThemenIcon, useBestaetigen, type IconName } from '@ui/index';
import { ansichtVergessen, useLeiste } from './favoriten';
import { seitenTitel } from './SeitenStern';
import { modulVerzeichnis } from './struktur';
import {
  aendern,
  einordnen,
  entfernen,
  finden,
  flach,
  hinzufuegen,
  kannSchieben,
  modulDrin,
  modulEintrag,
  neueId,
  schieben,
  verschieben,
  ziele,
  type Leiste,
  type LeistenEintrag,
} from './seitenleiste';
import { ziehBild } from '@ui/ziehen';

const ZIEH_TYP = 'text/x-macher-leiste';

/** Wohin führt ein Eintrag, wie heißt er, welches Icon? Ordner führen nirgendwohin. */
export function eintragZiel(e: LeistenEintrag): { titel: string; icon: IconName; pfad?: string } {
  if (e.art === 'modul') {
    const m = modul(e.modulId!);
    return { titel: e.titel || m?.titel || 'Modul', icon: m?.icon ?? 'stern', pfad: m ? modulPfad(m) : undefined };
  }
  if (e.art === 'smart') return { titel: e.titel, icon: 'macher', pfad: `/ansicht/${e.id}` };
  if (e.art === 'seite') return { titel: e.titel, icon: 'link', pfad: e.pfad };
  return { titel: e.titel, icon: 'ordner' };
}

/** Alle Einträge mit Ziel, flach – für die eingeklappte Leiste und das Profilmenü am Handy */
export function useLeistenZiele() {
  const { leiste } = useLeiste();
  return flach(leiste.eintraege)
    .filter((e) => e.art !== 'ordner')
    .map((e) => ({ id: e.id, ...eintragZiel(e) }))
    .filter((z): z is { id: string; titel: string; icon: IconName; pfad: string } => !!z.pfad);
}

const istAktiv = (pfad: string, ziel?: string) => !!ziel && (pfad === ziel.split('?')[0] || pfad.startsWith(`${ziel.split('?')[0]}/`));

type Menue = { anker: DOMRect; art: 'neu'; ordner: string | null } | { anker: DOMRect; art: 'eintrag'; id: string } | null;

export function DeineLeiste({ eingeklappt }: { eingeklappt: boolean }) {
  const { leiste, aendern: aendere, voll } = useLeiste();
  const pfad = useLocation().pathname;
  const navigate = useNavigate();
  const [menue, setMenue] = useState<Menue>(null);
  const [anpassen, setAnpassen] = useState(false);
  const [umbenennen, setUmbenennen] = useState<string | null>(null);
  const [modulDialog, setModulDialog] = useState<{ ordner: string | null } | null>(null);
  const [fragen, bestaetigung] = useBestaetigen();
  const zieleFlach = useLeistenZiele();
  const ich = useIch();
  const [zu, setZu] = useEinstellung<boolean>(`navigation.favoritenZu.${ich?.id ?? 'alle'}`, false);

  useEffect(() => setMenue(null), [pfad]);

  const neu = (e: LeistenEintrag, ordner: string | null, benennen = false) => {
    aendere((l) => hinzufuegen(l, e, ordner));
    if (benennen) setUmbenennen(e.id);
    setMenue(null);
  };

  if (eingeklappt)
    return (
      <nav className="mm-leiste-eigene" aria-label="Deine Seitenleiste">
        <ul className="mm-nav-liste">
          {zieleFlach.map((z) => (
            <li key={z.id}>
              <Link to={z.pfad} className={`mm-nav-favorit ${istAktiv(pfad, z.pfad) ? 'mm-nav-favorit--an' : ''}`} aria-current={istAktiv(pfad, z.pfad) ? 'page' : undefined} data-tipp={z.titel}>
                <ThemenIcon name={z.icon} size={24} strichGroesse={18} />
                <span className="sr-only">{z.titel}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );

  return (
    <nav className={`mm-leiste-eigene ${anpassen ? 'mm-leiste-eigene--anpassen' : ''}`} aria-labelledby="mm-leiste-eigene-titel">
      <div className="mm-leiste-eigene-kopf">
        {/* Favoriten lassen sich zuklappen – die Wahl bleibt je Mitarbeiter gespeichert */}
        <h2 id="mm-leiste-eigene-titel" className="mm-nav-titel">
          <button type="button" className="mm-leiste-gruppe-knopf" aria-expanded={!zu} onClick={() => setZu(!zu)}>
            <Icon name={zu ? 'weiter' : 'runter'} size={16} />
            Favoriten
          </button>
        </h2>
        <button
          type="button"
          className="mm-leiste-knopf"
          aria-pressed={anpassen}
          data-tipp={anpassen ? 'Anpassen beenden' : 'Seitenleiste anpassen'}
          onClick={() => (setAnpassen(!anpassen), setUmbenennen(null))}
        >
          {anpassen ? 'Fertig' : 'Anpassen'}
        </button>
        <button
          type="button"
          className="mm-leiste-knopf mm-leiste-knopf--icon"
          aria-label="Zur Seitenleiste hinzufügen"
          data-tipp={voll ? 'Deine Seitenleiste ist voll' : 'Zur Seitenleiste hinzufügen'}
          aria-haspopup="menu"
          disabled={voll}
          onClick={(e) => setMenue({ anker: e.currentTarget.getBoundingClientRect(), art: 'neu', ordner: null })}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>

      {!zu && (
      <Baum
        leiste={leiste}
        aendere={aendere}
        pfad={pfad}
        anpassen={anpassen}
        umbenennen={umbenennen}
        setUmbenennen={setUmbenennen}
        setMenue={setMenue}
      />
      )}
      {!zu && leiste.eintraege.length === 0 && (
        <p className="mm-nav-leer">Leg dir hier ab, was du oft brauchst: Module, eigene Ansichten oder Seiten. Tippe auf das Plus.</p>
      )}

      {menue && (
        <Schwebemenue anker={menue.anker} onSchliessen={() => setMenue(null)} label={menue.art === 'neu' ? 'Hinzufügen' : 'Eintrag bearbeiten'}>
          {menue.art === 'neu' ? (
            <NeuMenue
              onModul={() => (setModulDialog({ ordner: menue.ordner }), setMenue(null))}
              onSmart={() => {
                const e: LeistenEintrag = { id: neueId(), art: 'smart', titel: 'Neue Ansicht' };
                neu(e, menue.ordner);
                navigate(`/ansicht/${e.id}`);
              }}
              onSeite={() => {
                const titel = seitenTitel(pfad);
                neu({ id: neueId(), art: 'seite', titel, pfad: pfad + window.location.search }, menue.ordner, true);
              }}
              onOrdner={() => neu({ id: neueId(), art: 'ordner', titel: 'Neuer Ordner', offen: true, kinder: [] }, menue.ordner, true)}
            />
          ) : (
            <EintragMenue
              id={menue.id}
              leiste={leiste}
              aendere={aendere}
              onHierHinzufuegen={(anker) => setMenue({ anker, art: 'neu', ordner: menue.id })}
              onUmbenennen={() => (setUmbenennen(menue.id), setMenue(null))}
              onEntfernen={async () => {
                const e = finden(leiste.eintraege, menue.id);
                setMenue(null);
                if (!e) return;
                const name = eintragZiel(e).titel;
                const inhalt = (e.kinder?.length ?? 0) > 0;
                if (inhalt || e.art === 'smart') {
                  const text = inhalt ? `„${name}“ und alles darin verschwindet aus deiner Seitenleiste. Deine Daten bleiben erhalten.` : `Die Ansicht „${name}“ wird gelöscht. Deine Daten bleiben erhalten.`;
                  if (!(await fragen(`${name} entfernen?`, text, 'Entfernen'))) return;
                }
                flach([e]).forEach((x) => x.art === 'smart' && ansichtVergessen(x.id));
                aendere((l) => entfernen(l, e.id));
                if (e.art === 'smart' && pfad === `/ansicht/${e.id}`) navigate('/heute');
              }}
              onFertig={() => setMenue(null)}
            />
          )}
        </Schwebemenue>
      )}

      <ModulDialog
        offen={!!modulDialog}
        leiste={leiste}
        onSchliessen={() => setModulDialog(null)}
        onWaehlen={(id) => {
          aendere((l) => hinzufuegen(l, modulEintrag(id), modulDialog?.ordner ?? null));
          setModulDialog(null);
        }}
      />
      {bestaetigung}
    </nav>
  );
}

// ------------------------------------------------------------------ Baum

interface BaumProps {
  leiste: Leiste;
  aendere: (f: (l: Leiste) => Leiste) => void;
  pfad: string;
  anpassen: boolean;
  umbenennen: string | null;
  setUmbenennen: (id: string | null) => void;
  setMenue: (m: Menue) => void;
}

function Baum(props: BaumProps) {
  const [ablage, setAblage] = useState<string | null>(null);
  const zieht = (e: DragEvent) => e.dataTransfer.types.includes(ZIEH_TYP);
  return (
    <div
      className={`mm-leiste-baum ${ablage === 'oben' ? 'mm-leiste-baum--ablage' : ''}`}
      onDragOver={(e) => zieht(e) && (e.preventDefault(), setAblage('oben'))}
      onDragLeave={(e) => e.currentTarget === e.target && setAblage(null)}
      onDrop={(e) => {
        const id = e.dataTransfer.getData(ZIEH_TYP);
        setAblage(null);
        if (!id) return;
        e.preventDefault();
        props.aendere((l) => verschieben(l, id, null));
      }}
    >
      <Zweig {...props} eintraege={props.leiste.eintraege} tiefe={0} ablage={ablage} setAblage={setAblage} />
    </div>
  );
}

function Zweig({ eintraege, tiefe, ablage, setAblage, ...props }: BaumProps & { eintraege: LeistenEintrag[]; tiefe: number; ablage: string | null; setAblage: (id: string | null) => void }) {
  return (
    <ul className="mm-nav-liste" role={tiefe === 0 ? 'tree' : 'group'} aria-label={tiefe === 0 ? 'Deine Seitenleiste' : undefined}>
      {eintraege.map((e) => {
        const { titel, icon, pfad } = eintragZiel(e);
        const ordner = e.art === 'ordner';
        const offen = e.offen !== false;
        const an = istAktiv(props.pfad, pfad);
        const auf = () => props.aendere((l) => aendern(l, e.id, { offen: !offen }));
        /** Wohin fällt der Eintrag? Obere Hälfte davor, untere dahinter, bei Ordnern die Mitte hinein */
        const stelle = (ev: DragEvent<HTMLDivElement>): 'vor' | 'nach' | 'in' => {
          const r = ev.currentTarget.getBoundingClientRect();
          const y = (ev.clientY - r.top) / (r.height || 1);
          if (ordner && y > 0.25 && y < 0.75) return 'in';
          return y < 0.5 ? 'vor' : 'nach';
        };
        const inhalt = (
          <>
            {ordner ? (
              <span className="mm-leiste-pfeil" aria-hidden>
                <Icon name={offen ? 'runter' : 'weiter'} size={16} />
              </span>
            ) : null}
            <ThemenIcon name={ordner ? 'ordner' : icon} size={24} strichGroesse={18} />
            <span className="mm-leiste-text">{titel}</span>
          </>
        );
        return (
          <li key={e.id} role="treeitem" aria-expanded={ordner ? offen : undefined} aria-selected={an}>
            <div
              className={`mm-leiste-zeile-eigen ${ablage?.endsWith(`:${e.id}`) ? `mm-leiste-zeile-eigen--${ablage.split(':')[0] === 'in' ? 'ablage' : ablage.split(':')[0]}` : ''}`}
              draggable={props.umbenennen !== e.id}
              onDragStart={(ev) => {
                ev.stopPropagation();
                ziehBild(ev);
                ev.dataTransfer.setData(ZIEH_TYP, e.id);
                ev.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(ev) => {
                if (!ev.dataTransfer.types.includes(ZIEH_TYP)) return;
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'move';
                setAblage(`${stelle(ev)}:${e.id}`);
              }}
              onDragEnd={() => setAblage(null)}
              onDrop={(ev) => {
                const id = ev.dataTransfer.getData(ZIEH_TYP);
                if (!id) return;
                ev.preventDefault();
                ev.stopPropagation();
                setAblage(null);
                const wo = stelle(ev);
                props.aendere((l) => (wo === 'in' ? verschieben(l, id, e.id) : einordnen(l, id, e.id, wo)));
              }}
            >
              {props.umbenennen === e.id ? (
                <Umbenennen
                  titel={titel}
                  onFertig={(wert) => {
                    if (wert !== null) props.aendere((l) => aendern(l, e.id, { titel: wert }));
                    props.setUmbenennen(null);
                  }}
                />
              ) : pfad ? (
                <Link to={pfad} className={`mm-nav-favorit ${an ? 'mm-nav-favorit--an' : ''}`} aria-current={an ? 'page' : undefined}>
                  {inhalt}
                </Link>
              ) : (
                <button type="button" className="mm-nav-favorit" onClick={auf} aria-label={`${titel}, Ordner ${offen ? 'zuklappen' : 'aufklappen'}`}>
                  {inhalt}
                </button>
              )}
              {props.umbenennen !== e.id && (
                <button
                  type="button"
                  className="mm-leiste-mehr"
                  aria-label={`${titel} bearbeiten`}
                  data-tipp={`${titel} bearbeiten`}
                  aria-haspopup="menu"
                  onClick={(ev) => props.setMenue({ anker: ev.currentTarget.getBoundingClientRect(), art: 'eintrag', id: e.id })}
                >
                  <Icon name="mehr" size={18} />
                </button>
              )}
            </div>
            {ordner && offen && (e.kinder?.length ?? 0) > 0 && <Zweig {...props} eintraege={e.kinder!} tiefe={tiefe + 1} ablage={ablage} setAblage={setAblage} />}
            {ordner && offen && !e.kinder?.length && (
              <p className="mm-leiste-ordner-leer mm-leiste-ordner-leer--eingerueckt">
                Noch leer
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Umbenennen({ titel, onFertig }: { titel: string; onFertig: (wert: string | null) => void }) {
  const [wert, setWert] = useState(titel);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const fertig = () => onFertig(wert.trim() ? wert : null);
  return (
    <input
      ref={ref}
      value={wert}
      maxLength={40}
      aria-label="Name"
      className="mm-leiste-eingabe"
      onChange={(e) => setWert(e.target.value)}
      onBlur={fertig}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          fertig();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onFertig(null);
        }
      }}
    />
  );
}

// ------------------------------------------------------------------ Menüs

/** Ein schwebendes Menü neben dem Knopf, der es geöffnet hat. Escape oder Klick daneben schließt. */
function Schwebemenue({ anker, onSchliessen, label, children }: { anker: DOMRect; onSchliessen: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const schliessen = useRef(onSchliessen);
  useEffect(() => {
    schliessen.current = onSchliessen;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const breite = Math.min(288, window.innerWidth - 16);
    const hoehe = el.offsetHeight;
    el.style.width = `${breite}px`;
    el.style.left = `${Math.max(8, Math.min(anker.right + 8, window.innerWidth - breite - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(anker.top, window.innerHeight - hoehe - 8))}px`;
    el.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    const weg = (e: KeyboardEvent) => e.key === 'Escape' && schliessen.current();
    window.addEventListener('keydown', weg);
    return () => window.removeEventListener('keydown', weg);
  }, [anker]);
  return (
    <>
      <div className="mm-schleier-unsichtbar" onClick={onSchliessen} />
      <div ref={ref} className="mm-menue mm-leiste-menue" role="menu" aria-label={label}>
        {children}
      </div>
    </>
  );
}

function NeuMenue({ onModul, onSmart, onSeite, onOrdner }: { onModul: () => void; onSmart: () => void; onSeite: () => void; onOrdner: () => void }) {
  return (
    <>
      <button type="button" role="menuitem" onClick={onModul}>
        <Icon name="stern" /> Modul hinzufügen
      </button>
      <button type="button" role="menuitem" onClick={onSmart}>
        <Icon name="macher" />
        <span className="mm-leiste-menue-text">
          Smart View anlegen
          <span className="mm-meta">Eigene Seite aus Bausteinen</span>
        </span>
      </button>
      <button type="button" role="menuitem" onClick={onSeite}>
        <Icon name="link" /> Diese Seite merken
      </button>
      <button type="button" role="menuitem" onClick={onOrdner}>
        <Icon name="ordner" /> Ordner anlegen
      </button>
    </>
  );
}

function EintragMenue({
  id,
  leiste,
  aendere,
  onHierHinzufuegen,
  onUmbenennen,
  onEntfernen,
  onFertig,
}: {
  id: string;
  leiste: Leiste;
  aendere: (f: (l: Leiste) => Leiste) => void;
  onHierHinzufuegen: (anker: DOMRect) => void;
  onUmbenennen: () => void;
  onEntfernen: () => void;
  onFertig: () => void;
}) {
  const e = finden(leiste.eintraege, id);
  if (!e) return null;
  const orte = ziele(leiste, id);
  const oben = leiste.eintraege.some((x) => x.id === id);
  const tun = (f: (l: Leiste) => Leiste) => (aendere(f), onFertig());
  return (
    <>
      {e.art === 'ordner' && (
        <button type="button" role="menuitem" onClick={(ev) => onHierHinzufuegen(ev.currentTarget.getBoundingClientRect())}>
          <Icon name="plus" /> Hier etwas hineinlegen
        </button>
      )}
      <button type="button" role="menuitem" onClick={onUmbenennen}>
        <Icon name="stift" /> Umbenennen
      </button>
      <button type="button" role="menuitem" disabled={!kannSchieben(leiste, id, -1)} onClick={() => aendere((l) => schieben(l, id, -1))}>
        <Icon name="hoch" /> Nach oben
      </button>
      <button type="button" role="menuitem" disabled={!kannSchieben(leiste, id, 1)} onClick={() => aendere((l) => schieben(l, id, 1))}>
        <Icon name="runter" /> Nach unten
      </button>
      {(orte.length > 0 || !oben) && (
        <>
          <p className="mm-nav-titel mm-menue-titel">Verschieben nach</p>
          {!oben && (
            <button type="button" role="menuitem" onClick={() => tun((l) => verschieben(l, id, null))}>
              <Icon name="pfeil" /> Oberste Ebene
            </button>
          )}
          {orte.map((o) => (
            <button key={o.id} type="button" role="menuitem" onClick={() => tun((l) => verschieben(l, id, o.id))}>
              <Icon name="ordner" /> <span className="mm-leiste-text">{o.pfad}</span>
            </button>
          ))}
        </>
      )}
      <hr className="mm-leiste-menue-linie" />
      <button type="button" role="menuitem" onClick={onEntfernen}>
        <Icon name="muell" /> Aus der Seitenleiste nehmen
      </button>
    </>
  );
}

/** Jedes Modul, das du sehen darfst – mit Suche, gruppiert wie unter „Betrieb“ */
function ModulDialog({ offen, leiste, onSchliessen, onWaehlen }: { offen: boolean; leiste: Leiste; onSchliessen: () => void; onWaehlen: (id: string) => void }) {
  const ich = useIch();
  const [q, setQ] = useState('');
  const gruppen = modulVerzeichnis(ich)
    .map((g) => ({ ...g, module: g.module.filter((m) => passt(q, m.titel, m.beschreibung, g.titel)) }))
    .filter((g) => g.module.length);
  return (
    <Dialog offen={offen} onSchliessen={() => (setQ(''), onSchliessen())} titel="Modul hinzufügen">
      <div className="mm-leiste-dialog">
        <Suchfeld wert={q} onChange={setQ} platzhalter="Modul finden, z. B. Rechnungen" autoFocus />
        {!gruppen.length && <p className="mm-meta">Kein Modul passt zu „{q}“.</p>}
        {gruppen.map((g) => (
          <section key={g.id} className="mm-leiste-dialog-gruppe" aria-label={g.titel}>
            <p className="mm-oberzeile">{g.titel}</p>
            <ul className="mm-liste">
              {g.module.map((m) => {
                const drin = modulDrin(leiste, m.id);
                return (
                  <li key={m.id} className="mm-leiste-dialog-eintrag">
                    <span className="mm-verzeichnis-icon" aria-hidden>
                      <ThemenIcon name={m.icon ?? 'info'} size={36} />
                    </span>
                    <span className="mm-listenzeile-text">
                      <span className="mm-listenzeile-titel">{m.titel}</span>
                      <span className="mm-meta">{m.beschreibung}</span>
                    </span>
                    {drin ? (
                      <Status ton="erfolg">Schon drin</Status>
                    ) : (
                      <Button variante="sekundaer" klein icon="plus" onClick={() => (setQ(''), onWaehlen(m.id))} aria-label={`${m.titel} hinzufügen`}>
                        Hinzufügen
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
