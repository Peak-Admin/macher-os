import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, useDatenstand, vermerken } from '@core/db';
import { datum, heute, personName, relativ, telLink, uhrzeit, zeitpunkt } from '@core/format';
import type { Rolle } from '@core/objects';
import { ROLLEN, istBuero, useDarf, useIch } from '@core/session';
import { Auswahl, BeispielMarke, Button, Eingabe, Filter, FormRaster, Karte, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Textfeld, Zeile, ZweiSpalten, useBestaetigen, useToast } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { naechsteFarbe } from '@modules/mitarbeiter/team';
import { QUELLE_LABEL, STATUS, STATUS_LABEL, STELLE_LABEL, bewerber, mailtoLink, offen, unbeantwortetTage, vorlagen, wartetZuLange, type Bewerber, type BewerberStatus } from './daten';
import type { Ton } from '@core/modul';

const statusTon: Record<BewerberStatus, Ton> = { neu: 'achtung', gespraech: 'aktiv', probearbeiten: 'aktiv', zusage: 'erfolg', absage: 'neutral' };

function KeinZugriff() {
  return (
    <Seite titel="Bewerber">
      <Leer titel="Nur für Chef und Büro" text="Bewerbungen sind vertraulich." icon="schloss" />
    </Seite>
  );
}

function useDarfBewerber() {
  const ich = useIch();
  const personal = useDarf('personal');
  return personal || istBuero(ich);
}

type Filterwert = 'offen' | BewerberStatus;

export function BewerberSeite() {
  useDatenstand();
  const darf = useDarfBewerber();
  const [filter, setFilter] = useState<Filterwert>('offen');
  if (!darf) return <KeinZugriff />;
  const t = heute();
  const alle = bewerber.all();
  const zahl = (s: Filterwert) => alle.filter((b) => (s === 'offen' ? offen(b) : b.status === s)).length;
  const liste = alle
    .filter((b) => (filter === 'offen' ? offen(b) : b.status === filter))
    .sort((a, b) => Number(wartetZuLange(b, t)) - Number(wartetZuLange(a, t)) || STATUS.findIndex((s) => s.id === a.status) - STATUS.findIndex((s) => s.id === b.status) || b.eingegangenAm.localeCompare(a.eingegangenAm));
  return (
    <Seite titel="Bewerber" untertitel="Gute Leute sind schnell weg – antworte innerhalb von drei Tagen." aktion={<Button icon="plus" to="/betrieb/bewerber/neu">Bewerbung erfassen</Button>}>
      <Filter
        label="Status"
        wert={filter}
        onChange={setFilter}
        optionen={[{ wert: 'offen' as Filterwert, label: 'Offen', zaehler: zahl('offen') }, ...STATUS.map((s) => ({ wert: s.id as Filterwert, label: s.label, zaehler: zahl(s.id) }))]}
      />
      <Liste
        leer={
          <Leer
            titel={filter === 'offen' ? 'Keine offenen Bewerbungen' : `Niemand im Status „${STATUS_LABEL[filter as BewerberStatus]}“`}
            text="Erfasse Bewerbungen in Sekunden – egal ob per Anruf, Mail oder WhatsApp."
            icon="person"
            aktion={<Button to="/betrieb/bewerber/neu">Bewerbung erfassen</Button>}
          />
        }
      >
        {liste.map((b) => {
          const tage = unbeantwortetTage(b, t);
          return (
            <ListenZeile
              key={b.id}
              to={`/betrieb/bewerber/${b.id}`}
              titel={
                <>
                  {b.vorname} {b.nachname} <BeispielMarke zeigen={b.beispiel} />
                </>
              }
              untertitel={[STELLE_LABEL[b.stelle], b.quelle ? QUELLE_LABEL[b.quelle] : undefined, `eingegangen ${relativ(b.eingegangenAm)}`].filter(Boolean).join(' · ')}
              rechts={
                wartetZuLange(b, t) ? (
                  <Status ton="achtung">{`${tage} Tage ohne Antwort`}</Status>
                ) : (
                  <Status ton={statusTon[b.status]} icon={b.status !== 'neu'}>
                    {STATUS_LABEL[b.status]}
                  </Status>
                )
              }
            />
          );
        })}
      </Liste>
    </Seite>
  );
}

/** Schnelle Erfassung: Name + ein Kontaktweg + Stelle reichen */
export function BewerberNeu() {
  const darf = useDarfBewerber();
  const navigate = useNavigate();
  const toast = useToast();
  const [stelle, setStelle] = useState<Rolle>('monteur');
  const [f, setF] = useState({ vorname: '', nachname: '', telefon: '', email: '', quelle: '', eingegangenAm: heute(), notiz: '' });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  if (!darf) return <KeinZugriff />;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const speichern = () => {
    const e: Record<string, string> = {};
    if (!f.vorname.trim() && !f.nachname.trim()) e.vorname = 'Trag mindestens einen Namen ein.';
    if (!f.telefon.trim() && !f.email.trim()) e.telefon = 'Trag Telefon oder E-Mail ein, damit du antworten kannst.';
    setFehler(e);
    if (Object.keys(e).length) return;
    const b = bewerber.create({
      vorname: f.vorname.trim(),
      nachname: f.nachname.trim(),
      telefon: f.telefon.trim() || undefined,
      email: f.email.trim() || undefined,
      stelle,
      quelle: (f.quelle || undefined) as Bewerber['quelle'],
      status: 'neu',
      eingegangenAm: f.eingegangenAm || heute(),
      notiz: f.notiz.trim() || undefined,
    });
    toast('Bewerbung erfasst. Bestätige jetzt kurz den Eingang.');
    navigate(`/betrieb/bewerber/${b.id}`, { replace: true });
  };
  return (
    <Seite titel="Bewerbung erfassen" zurueck={{ to: '/betrieb/bewerber', label: 'Bewerber' }}>
      <Karte>
        <form
          className="mm-stapel"
          style={{ gap: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
        >
          <FormRaster>
            <Eingabe label="Vorname" value={f.vorname} onChange={set('vorname')} fehler={fehler.vorname} autoFocus autoComplete="off" />
            <Eingabe label="Nachname" value={f.nachname} onChange={set('nachname')} optional autoComplete="off" />
            <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} fehler={fehler.telefon} />
            <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} optional />
            <Auswahl label="Stelle" value={stelle} onChange={(e) => setStelle(e.target.value as Rolle)} optionen={ROLLEN.map((r) => ({ wert: r.id, label: STELLE_LABEL[r.id] }))} />
            <Auswahl label="Wie kam die Bewerbung?" optional value={f.quelle} leer="Weiß nicht" onChange={set('quelle')} optionen={Object.entries(QUELLE_LABEL).map(([wert, label]) => ({ wert, label }))} />
            <Eingabe label="Eingegangen am" type="date" max={heute()} value={f.eingegangenAm} onChange={set('eingegangenAm')} />
          </FormRaster>
          <Textfeld label="Notiz" optional value={f.notiz} onChange={set('notiz')} placeholder="z. B. Geselle SHK, 5 Jahre Erfahrung, Führerschein B" />
          <div>
            <Button type="submit">Bewerbung speichern</Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}

export function BewerberDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const darf = useDarfBewerber();
  const ich = useIch();
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigenElement] = useBestaetigen();
  const [termin, setTermin] = useState({ datum: '', uhr: '10:00' });
  const [notiz, setNotiz] = useState<string | null>(null);
  if (!darf) return <KeinZugriff />;
  const b = bewerber.get(id);
  const zurueck = { to: '/betrieb/bewerber', label: 'Bewerber' };
  if (!b || b.geloeschtAm)
    return (
      <Seite titel="Bewerbung nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Bewerbung gibt es nicht (mehr)." icon="person" />
      </Seite>
    );
  const t = heute();
  const name = `${b.vorname} ${b.nachname}`.trim();
  const betrieb = db.betrieb.get('betrieb')?.name ?? 'unser Betrieb';
  const vs = vorlagen(b, betrieb, personName(ich));
  const termine = db.termine.get(b.terminId);
  const ma = db.mitarbeiter.get(b.mitarbeiterId);

  const status = (s: BewerberStatus, text?: string) => {
    bewerber.update(b.id, { status: s }, { text: text ?? `Status: ${STATUS_LABEL[s]}` });
  };
  const beantwortet = (was: string, naechster?: BewerberStatus) => {
    bewerber.update(b.id, { beantwortetAm: new Date().toISOString(), ...(naechster && naechster !== 'zusage' ? { status: naechster } : {}) }, { text: was });
    toast(naechster && naechster !== 'zusage' ? `Vermerkt. Status: ${STATUS_LABEL[naechster]}.` : 'Antwort vermerkt.');
  };
  const terminAnlegen = () => {
    if (!termin.datum) return toast('Wähle ein Datum.', { ton: 'achtung' });
    const art = b.status === 'probearbeiten' ? 'Probearbeiten' : 'Bewerbungsgespräch';
    const dauer = b.status === 'probearbeiten' ? 8 : 1;
    const start = zeitpunkt(termin.datum, termin.uhr);
    const ende = new Date(new Date(start).getTime() + dauer * 3_600_000).toISOString();
    const x = db.termine.create({ art: 'intern', titel: `${art}: ${name}`, start, ende, mitarbeiterIds: ich ? [ich.id] : [], status: 'geplant', notiz: b.telefon ? `Telefon ${b.telefon}` : undefined });
    bewerber.update(b.id, { terminId: x.id, status: b.status === 'neu' ? 'gespraech' : b.status }, { text: `${art} am ${datum(start)} geplant` });
    toast(`${art} steht im Kalender.`);
  };
  const einstellen = async () => {
    if (!(await fragen(`${b.vorname} einstellen?`, `Macher legt ${name} als Mitarbeiter an und erstellt den Einarbeitungsplan. Vertragsdaten (Stunden, Urlaub) prüfst du danach.`, 'Mitarbeiter anlegen'))) return;
    // Vertragswerte vom Team übernehmen (gleiche Rolle zuerst) – werden danach im Formular geprüft
    const vorbild = db.mitarbeiter.where((x) => x.aktiv && x.rolle === b.stelle)[0] ?? db.mitarbeiter.where((x) => x.aktiv && x.rolle !== 'chef')[0];
    const m = db.mitarbeiter.create({
      vorname: b.vorname || name,
      nachname: b.nachname,
      rolle: b.stelle,
      telefon: b.telefon,
      email: b.email,
      wochenstunden: vorbild?.wochenstunden ?? 40,
      urlaubstageJahr: vorbild?.urlaubstageJahr ?? 30,
      kostensatz: 0,
      aktiv: true,
      farbe: naechsteFarbe(),
    });
    bewerber.update(b.id, { status: 'zusage', mitarbeiterId: m.id }, { text: 'Eingestellt – Mitarbeiter angelegt' });
    vermerken({ typ: 'mitarbeiter', id: m.id }, 'bewerber.eingestellt', 'Aus Bewerbung übernommen');
    toast(`${b.vorname} ist angelegt. Prüf jetzt Wochenstunden, Urlaub und Eintritt.`);
    navigate(`/betrieb/mitarbeiter/${m.id}/bearbeiten`);
  };

  return (
    <Seite
      titel={name || 'Bewerbung'}
      oberzeile={STELLE_LABEL[b.stelle]}
      status={
        <>
          <Status ton={statusTon[b.status]}>{STATUS_LABEL[b.status]}</Status>
          <BeispielMarke zeigen={b.beispiel} />
        </>
      }
      zurueck={zurueck}
      aktion={
        b.telefon ? (
          <Button icon="telefon" variante="sekundaer" onClick={() => ((window.location.href = telLink(b.telefon)!), beantwortet('Angerufen'))}>
            Anrufen
          </Button>
        ) : undefined
      }
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {wartetZuLange(b, t) && (
              <Meldung ton="achtung" titel={`Seit ${unbeantwortetTage(b, t)} Tagen ohne Antwort`}>
                Melde dich heute – mit einer Vorlage dauert das eine Minute.
              </Meldung>
            )}
            {b.status === 'zusage' && ma && (
              <Meldung ton="erfolg" titel="Eingestellt">
                <ObjektLink bezug={{ typ: 'mitarbeiter', id: ma.id }}>{personName(ma)} ist jetzt im Team.</ObjektLink>
              </Meldung>
            )}
            {offen(b) && (
              <Stapel abstand={8}>
                <strong>Nächster Schritt</strong>
                <Zeile>
                  {b.status === 'neu' && <Button onClick={() => status('gespraech')}>Zum Gespräch einladen</Button>}
                  {b.status === 'gespraech' && <Button onClick={() => status('probearbeiten')}>Probearbeiten vereinbaren</Button>}
                  {(b.status === 'gespraech' || b.status === 'probearbeiten') && (
                    <Button variante={b.status === 'probearbeiten' ? 'primaer' : 'sekundaer'} icon="check" onClick={einstellen}>
                      Zusage & einstellen
                    </Button>
                  )}
                  <Button variante="tertiaer" onClick={() => status('absage')}>
                    Absagen
                  </Button>
                </Zeile>
              </Stapel>
            )}
            <Stapel abstand={8}>
              <strong>Antworten mit Vorlage</strong>
              {!b.email && <Meta>Keine E-Mail hinterlegt – ruf an oder schreib per WhatsApp. Danach „Als beantwortet markieren“.</Meta>}
              <Liste>
                {vs.map((v) => (
                  <ListenZeile
                    key={v.id}
                    titel={v.label}
                    untertitel={v.betreff}
                    rechts={
                      b.email ? (
                        <a className="mm-btn mm-btn--sekundaer mm-btn--klein" href={mailtoLink(b.email, v)} onClick={() => beantwortet(`Mail „${v.label}“ geschrieben`, v.naechsterStatus)}>
                          E-Mail öffnen
                        </a>
                      ) : (
                        <Button klein variante="tertiaer" onClick={() => (navigator.clipboard?.writeText(v.text), toast('Text kopiert.'))}>
                          Text kopieren
                        </Button>
                      )
                    }
                  />
                ))}
              </Liste>
              {!b.beantwortetAm && (
                <div>
                  <Button klein variante="tertiaer" icon="check" onClick={() => beantwortet('Als beantwortet markiert')}>
                    Als beantwortet markieren
                  </Button>
                </div>
              )}
            </Stapel>
            <Stapel abstand={8}>
              <strong>Verlauf</strong>
              <Zeitstrahl bezug={{ typ: 'bewerber', id: b.id }} max={10} />
            </Stapel>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Kontakt" kompakt>
              <Stapel abstand={8}>
                {b.telefon && <a href={telLink(b.telefon)}>{b.telefon}</a>}
                {b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}
                <Meta>Eingegangen {datum(b.eingegangenAm)}{b.quelle ? ` · ${QUELLE_LABEL[b.quelle]}` : ''}</Meta>
                <Meta>{b.beantwortetAm ? `Zuletzt geantwortet ${relativ(b.beantwortetAm)}` : 'Noch nicht geantwortet'}</Meta>
              </Stapel>
            </Karte>
            {offen(b) && (
              <Karte titel={b.status === 'probearbeiten' ? 'Probearbeiten' : 'Gespräch'} kompakt>
                {termine ? (
                  <Meta>
                    <ObjektLink bezug={{ typ: 'termine', id: termine.id }}>
                      {datum(termine.start)}, {uhrzeit(termine.start)} Uhr
                    </ObjektLink>
                  </Meta>
                ) : (
                  <Stapel abstand={8}>
                    <FormRaster spalten={2}>
                      <Eingabe label="Datum" type="date" min={t} value={termin.datum} onChange={(e) => setTermin({ ...termin, datum: e.target.value })} />
                      <Eingabe label="Uhrzeit" type="time" value={termin.uhr} onChange={(e) => setTermin({ ...termin, uhr: e.target.value })} />
                    </FormRaster>
                    <div>
                      <Button klein variante="sekundaer" icon="kalender" onClick={terminAnlegen}>
                        In Kalender eintragen
                      </Button>
                    </div>
                  </Stapel>
                )}
              </Karte>
            )}
            <Karte titel="Notiz" kompakt>
              <Stapel abstand={8}>
                <Textfeld label="Notiz" value={notiz ?? b.notiz ?? ''} onChange={(e) => setNotiz(e.target.value)} placeholder="Eindruck, Erfahrung, Gehaltswunsch …" />
                {notiz != null && notiz !== (b.notiz ?? '') && (
                  <div>
                    <Button klein onClick={() => (bewerber.update(b.id, { notiz: notiz.trim() || undefined }, { text: 'Notiz geändert' }), setNotiz(null), toast('Notiz gespeichert.'))}>
                      Notiz speichern
                    </Button>
                  </div>
                )}
              </Stapel>
            </Karte>
            {!offen(b) && (
              <div>
                <Button
                  variante="tertiaer"
                  icon="muell"
                  onClick={async () => {
                    if (!(await fragen('Bewerbung löschen?', 'Die Daten kommen in den Papierkorb. Bewerberdaten solltest du nach Abschluss nicht länger als nötig aufbewahren.', 'Löschen'))) return;
                    bewerber.remove(b.id);
                    toast('Bewerbung gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => bewerber.restore(b.id) } });
                    navigate('/betrieb/bewerber');
                  }}
                >
                  Bewerbung löschen
                </Button>
              </div>
            )}
          </>
        }
      />
      {bestaetigenElement}
    </Seite>
  );
}
