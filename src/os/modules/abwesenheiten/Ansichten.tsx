import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { db, useDatenstand } from '@core/db';
import { aktionAusfuehren } from '@core/modul';
import { datum, heute, personName, uhrzeit } from '@core/format';
import type { Abwesenheit, AbwesenheitsArt, ID } from '@core/objects';
import { istBuero, useDarf, useIch } from '@core/session';
import { ABWESENHEIT_EMOJI } from '@core/zeichen';
import { BeispielMarke, Button, Emoji, Filter, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, Tabelle, Tabs, Zeile, ZweiSpalten, mitEmoji, useToast } from '@ui/index';
import { ObjektLink, Zeitstrahl } from '@ui/objekt';
import { Person, Personenbild } from '@ui/person';
import { istAktiv, sortiert } from '@modules/mitarbeiter/team';
import { ART_LABEL, STATUS_LABEL, arbeitstage, kollisionen, tageImJahr, tageText, urlaubskonto, zeitraumText } from './daten';
import { AbwesenheitForm } from './AbwesenheitForm';
import { entscheiden, offeneAntraege } from './logik';
import type { Ton } from '@core/modul';

const statusTon: Record<Abwesenheit['status'], Ton> = { beantragt: 'aktiv', genehmigt: 'erfolg', abgelehnt: 'neutral' };

function AbwNav({ aktiv }: { aktiv: 'liste' | 'jahr' }) {
  const navigate = useNavigate();
  const personal = useDarf('personal');
  const ich = useIch();
  if (!personal && !istBuero(ich)) return null;
  return (
    <Tabs
      tabs={[
        { id: 'liste', titel: 'Übersicht' },
        { id: 'jahr', titel: 'Jahresübersicht Team' },
      ]}
      aktiv={aktiv}
      onWechsel={(id) => navigate(id === 'jahr' ? '/betrieb/abwesenheiten/jahr' : '/betrieb/abwesenheiten')}
    />
  );
}

export function AbwesenheitZeile({ a, mitName = true }: { a: Abwesenheit; mitName?: boolean }) {
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const ich = useIch();
  const personal = useDarf('personal');
  const artSichtbar = personal || istBuero(ich) || ich?.id === a.mitarbeiterId;
  return (
    <ListenZeile
      to={artSichtbar ? `/betrieb/abwesenheiten/${a.id}` : undefined}
      links={mitName ? <Personenbild m={m} groesse={40} /> : undefined}
      titel={
        <>
          {mitName ? `${personName(m)} · ` : ''}
          {artSichtbar ? (
            <>
              <Emoji zeichen={ABWESENHEIT_EMOJI[a.art]} />
              {ART_LABEL[a.art]}
            </>
          ) : (
            'Abwesend'
          )} <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      untertitel={`${zeitraumText(a)} · ${tageText(arbeitstage(a.von, a.bis, a.halbtags))}`}
      rechts={<Status ton={statusTon[a.status]}>{STATUS_LABEL[a.status]}</Status>}
    />
  );
}

/**
 * Offener Antrag mit Genehmigen/Ablehnen – auch in Arbeitszeiten („Offene Urlaubsanträge“) genutzt.
 * Zeigt Tage, Resturlaub danach, Notiz und Termine im Zeitraum.
 */
export function AntragKarte({ a }: { a: Abwesenheit }) {
  const toast = useToast();
  const alle = db.abwesenheiten.all();
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const k = m ? urlaubskonto(m, alle, Number(a.von.slice(0, 4))) : undefined;
  const tage = arbeitstage(a.von, a.bis, a.halbtags);
  const betroffen = kollisionen(a, db.termine.all());
  const entscheide = (ja: boolean) => {
    entscheiden(a.id, ja);
    toast(ja ? `${ART_LABEL[a.art]} genehmigt. ${m?.vorname} bekommt Bescheid.` : 'Abgelehnt. Der Mitarbeiter bekommt Bescheid.');
  };
  return (
    <Karte kompakt titel={<Person m={m} groesse={32}>{`${personName(m)} · ${mitEmoji(ABWESENHEIT_EMOJI[a.art], ART_LABEL[a.art])}`}</Person>} oberzeile={zeitraumText(a)}>
      <Stapel abstand={8}>
        <Meta>
          {tageText(tage)}
          {a.art === 'urlaub' && k ? ` · Rest danach ${String(k.rest - tage).replace('.', ',')} Tage` : ''}
          {a.notiz ? ` · „${a.notiz}“` : ''}
        </Meta>
        {betroffen.length > 0 && <Status ton="achtung">{betroffen.length === 1 ? '1 Termin im Zeitraum' : `${betroffen.length} Termine im Zeitraum`}</Status>}
        <Zeile>
          <Button klein icon="check" onClick={() => entscheide(true)}>
            Genehmigen
          </Button>
          <Button klein variante="sekundaer" onClick={() => entscheide(false)}>
            Ablehnen
          </Button>
          <Button klein variante="tertiaer" to={`/betrieb/abwesenheiten/${a.id}`}>
            Details
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}

/** Startansicht: Antrag in Sekunden, eigenes Konto, offene Anträge (Chef), wer ist wann weg */
export function AbwesenheitenSeite() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const buero = istBuero(ich);
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<'demnaechst' | 'vergangen'>('demnaechst');
  const t = heute();
  const jahr = Number(t.slice(0, 4));
  const alle = db.abwesenheiten.all();
  const teamSicht = buero || personal;
  const sichtbar = alle.filter((a) => teamSicht || a.mitarbeiterId === ich?.id);
  const offen = personal ? offeneAntraege(alle, t) : [];
  const kommend = sichtbar.filter((a) => a.bis >= t && a.status !== 'abgelehnt' && !offen.includes(a)).sort((a, b) => a.von.localeCompare(b.von));
  const vergangen = sichtbar.filter((a) => a.bis < t || a.status === 'abgelehnt').sort((a, b) => b.von.localeCompare(a.von));
  const konto = ich ? urlaubskonto(ich, alle, jahr) : undefined;
  // Vorgaben per Link, z. B. aus „Braucht dich“: ?art=frei&ma=<id> (Überstunden abbauen)
  const artParam = params.get('art');
  const vorgabeArt = artParam === 'krank' || artParam === 'frei' || artParam === 'schule' || artParam === 'sonstiges' ? artParam : 'urlaub';
  const vorgabeMa = params.get('ma') ?? undefined;

  return (
    <Seite titel="Urlaub & Krankheit" untertitel="Antrag in Sekunden. Der Chef entscheidet mit einem Tap.">
      <AbwNav aktiv="liste" />
      {konto && (
        <Raster min={170}>
          <Kennzahl label="Dein Resturlaub" wert={`${String(konto.rest).replace('.', ',')} Tage`} zeitraum={String(jahr)} hinweis={`von ${konto.anspruch}`} ton={konto.rest < 0 ? 'achtung' : undefined} />
          <Kennzahl label="Beantragt" wert={`${String(konto.beantragt).replace('.', ',')} Tage`} hinweis="wartet auf Freigabe" />
        </Raster>
      )}
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {offen.length > 0 && (
              <Stapel abstand={8}>
                <strong>Wartet auf deine Entscheidung</strong>
                {offen.map((a) => (
                  <AntragKarte key={a.id} a={a} />
                ))}
              </Stapel>
            )}
            <Stapel abstand={12}>
              <Filter
                label="Zeitraum"
                wert={filter}
                onChange={setFilter}
                optionen={[
                  { wert: 'demnaechst', label: teamSicht ? 'Wer ist wann weg' : 'Demnächst', zaehler: kommend.length },
                  { wert: 'vergangen', label: 'Vergangen', zaehler: vergangen.length },
                ]}
              />
              <Liste
                leer={
                  <Leer
                    titel={filter === 'demnaechst' ? 'Niemand ist abwesend' : 'Noch nichts vergangen'}
                    text={filter === 'demnaechst' ? 'Hier erscheinen Urlaub, Krankheit und Berufsschule, sobald sie eingetragen sind.' : undefined}
                    icon="kalender"
                  />
                }
              >
                {(filter === 'demnaechst' ? kommend : vergangen.slice(0, 30)).map((a) => (
                  <AbwesenheitZeile key={a.id} a={a} mitName={teamSicht} />
                ))}
              </Liste>
            </Stapel>
          </Stapel>
        }
        seite={
          <Karte titel="Abwesenheit eintragen" icon="kalender">
            <AbwesenheitForm key={`${vorgabeArt}:${vorgabeMa ?? ''}`} vorgabeArt={vorgabeArt} vorgabeMa={vorgabeMa} />
          </Karte>
        }
      />
    </Seite>
  );
}

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Jahresübersicht Team: Urlaubskonto je Mitarbeiter und Abwesenheitstage je Monat */
export function JahrSeite() {
  useDatenstand();
  const ich = useIch();
  const personal = useDarf('personal');
  const [jahr, setJahr] = useState(Number(heute().slice(0, 4)));
  if (!personal && !istBuero(ich))
    return (
      <Seite titel="Jahresübersicht" zurueck={{ to: '/betrieb/abwesenheiten', label: 'Urlaub & Krankheit' }}>
        <Leer titel="Nur für Chef und Büro" text="Deine eigenen Abwesenheiten siehst du in der Übersicht." icon="schloss" />
      </Seite>
    );
  const alle = db.abwesenheiten.all();
  const team = sortiert(db.mitarbeiter.where((m) => istAktiv(m) || alle.some((a) => a.mitarbeiterId === m.id && a.von.startsWith(String(jahr)))));
  const monatTage = (maId: ID, monat: number, arten: AbwesenheitsArt[]) =>
    alle
      .filter((a) => a.mitarbeiterId === maId && a.status === 'genehmigt' && arten.includes(a.art))
      .reduce((s, a) => {
        const von = `${jahr}-${String(monat + 1).padStart(2, '0')}-01`;
        const bis = `${jahr}-${String(monat + 1).padStart(2, '0')}-31`;
        const v = a.von > von ? a.von : von;
        const b = a.bis < bis ? a.bis : bis;
        return b >= v ? s + arbeitstage(v, b, a.halbtags) : s;
      }, 0);
  const zeilen = team.map((m) => ({ m, k: urlaubskonto(m, alle, jahr) }));
  return (
    <Seite titel="Urlaub & Krankheit" untertitel={`Jahresübersicht ${jahr} – Arbeitstage, gesetzliche Feiertage berücksichtigt.`}>
      <AbwNav aktiv="jahr" />
      <Zeile>
        <Button klein variante="tertiaer" icon="zurueck" onClick={() => setJahr(jahr - 1)}>
          {String(jahr - 1)}
        </Button>
        <strong>{jahr}</strong>
        <Button klein variante="tertiaer" onClick={() => setJahr(jahr + 1)}>
          {String(jahr + 1)}
        </Button>
      </Zeile>
      <Tabelle
        zeilen={zeilen}
        schluessel={(z) => z.m.id}
        zeilenLink={(z) => `/betrieb/mitarbeiter/${z.m.id}`}
        leer={<Leer titel="Noch niemand im Team" icon="team" />}
        spalten={[
          { titel: 'Mitarbeiter', wert: (z) => <Person m={z.m} />, sortierWert: (z) => z.m.vorname },
          { titel: 'Anspruch', wert: (z) => z.k.anspruch, zahl: true, nebensaechlich: true },
          { titel: 'Genehmigt', wert: (z) => String(z.k.genehmigt).replace('.', ','), zahl: true, nebensaechlich: true },
          { titel: 'Beantragt', wert: (z) => String(z.k.beantragt).replace('.', ','), zahl: true, nebensaechlich: true },
          { titel: 'Rest', wert: (z) => <Status ton={z.k.rest < 0 ? 'achtung' : 'neutral'}>{`${String(z.k.rest).replace('.', ',')} Tage`}</Status>, sortierWert: (z) => z.k.rest },
          ...(personal ? [{ titel: 'Krank', wert: (z: (typeof zeilen)[number]) => String(z.k.kranktage).replace('.', ','), zahl: true, sortierWert: (z: (typeof zeilen)[number]) => z.k.kranktage }] : []),
          ...MONATE.map((titel, i) => ({
            titel,
            zahl: true,
            nebensaechlich: true,
            wert: (z: (typeof zeilen)[number]) => {
              const u = monatTage(z.m.id, i, ['urlaub', 'frei']);
              const k = personal ? monatTage(z.m.id, i, ['krank']) : 0;
              const s = monatTage(z.m.id, i, ['schule', 'schulung', 'sonstiges']);
              const teile = [u ? `U ${u}` : '', k ? `K ${k}` : '', s ? `S ${s}` : ''].filter(Boolean);
              return teile.length ? teile.join(' ').replace(/\./g, ',') : '–';
            },
          })),
        ]}
      />
      <Meta>U = Urlaub/Frei · {personal ? 'K = Krank · ' : ''}S = Berufsschule/Schulung/Sonstiges · Angaben in Arbeitstagen.</Meta>
    </Seite>
  );
}

export function AbwesenheitDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const a = db.abwesenheiten.get(id);
  const ich = useIch();
  const personal = useDarf('personal');
  const toast = useToast();
  const zurueck = { to: '/betrieb/abwesenheiten', label: 'Urlaub & Krankheit' };
  if (!a || a.geloeschtAm)
    return (
      <Seite titel="Abwesenheit nicht gefunden" zurueck={zurueck}>
        <Leer titel="Diese Abwesenheit gibt es nicht (mehr)." icon="kalender" />
      </Seite>
    );
  const m = db.mitarbeiter.get(a.mitarbeiterId);
  const eigene = ich?.id === a.mitarbeiterId;
  if (!eigene && !personal && !istBuero(ich))
    return (
      <Seite titel="Abwesenheit" zurueck={zurueck}>
        <Leer titel="Nur für Chef und Büro" icon="schloss" />
      </Seite>
    );
  const betroffen = kollisionen(a, db.termine.all());
  const dokumente = personal || eigene ? db.dokumente.where((d) => d.bezug?.typ === 'abwesenheiten' && d.bezug.id === a.id) : [];
  const jahr = Number(a.von.slice(0, 4));
  const konto = m ? urlaubskonto(m, db.abwesenheiten.all(), jahr) : undefined;
  const darfStornieren = (eigene && a.status === 'beantragt') || personal;

  return (
    <Seite
      titel={`${ART_LABEL[a.art]} · ${personName(m)}`}
      oberzeile={zeitraumText(a)}
      status={
        <>
          <Status ton={statusTon[a.status]}>{STATUS_LABEL[a.status]}</Status>
          <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={zurueck}
      aktion={
        personal && a.status === 'beantragt' ? (
          <Button icon="check" onClick={() => (entscheiden(a.id, true), toast('Genehmigt.'))}>
            Genehmigen
          </Button>
        ) : undefined
      }
    >
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            {betroffen.length > 0 ? (
              <Stapel abstand={8}>
                <Meldung ton="achtung" titel={`${betroffen.length === 1 ? '1 Termin' : `${betroffen.length} Termine`} im Zeitraum`}>
                  {a.status === 'genehmigt' ? 'Plane die Termine um oder gib sie an Kollegen.' : 'Wird der Antrag genehmigt, müssen diese Termine umgeplant werden.'}
                </Meldung>
                <Liste>
                  {betroffen.map((t) => (
                    <ListenZeile
                      key={t.id}
                      titel={<ObjektLink bezug={{ typ: 'termine', id: t.id }}>{t.titel}</ObjektLink>}
                      untertitel={`${datum(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)}`}
                      rechts={
                        t.auftragId ? (
                          <Button klein variante="sekundaer" onClick={() => aktionAusfuehren('plan.einplanen', { auftragId: t.auftragId })}>
                            Umplanen
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </Liste>
              </Stapel>
            ) : (
              <Meldung ton="erfolg">Keine Termine im Zeitraum betroffen.</Meldung>
            )}
            {dokumente.length > 0 && (
              <Stapel abstand={8}>
                <strong>Krankmeldung</strong>
                {dokumente.map((d) =>
                  d.url && d.mime?.startsWith('image/') ? (
                    <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
                      <img src={d.url} alt={d.titel} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 'var(--mm-radius-card)' }} />
                    </a>
                  ) : (
                    <a key={d.id} href={d.url} download={d.titel}>
                      {d.titel}
                    </a>
                  ),
                )}
              </Stapel>
            )}
            <Stapel abstand={8}>
              <strong>Verlauf</strong>
              <Zeitstrahl bezug={{ typ: 'abwesenheiten', id: a.id }} />
            </Stapel>
          </Stapel>
        }
        seite={
          <>
            <Karte titel="Details" icon="info" kompakt>
              <Stapel abstand={4}>
                <Meta>
                  {datum(a.von)} bis {datum(a.bis)}
                  {a.halbtags ? ' (halbtags)' : ''}
                </Meta>
                <Meta>{tageText(arbeitstage(a.von, a.bis, a.halbtags))}</Meta>
                {a.art === 'urlaub' && konto && <Meta>Resturlaub {jahr}: {String(konto.rest).replace('.', ',')} Tage</Meta>}
                {a.notiz && <Meta>Notiz: {a.notiz}</Meta>}
                <Meta>
                  <ObjektLink bezug={{ typ: 'mitarbeiter', id: a.mitarbeiterId }}>
                    <Person m={m}>Zu {m?.vorname ?? 'Mitarbeiter'}</Person>
                  </ObjektLink>
                </Meta>
              </Stapel>
            </Karte>
            {personal && a.status === 'beantragt' && (
              <Zeile>
                <Button variante="sekundaer" onClick={() => (entscheiden(a.id, false), toast('Abgelehnt.'))}>
                  Ablehnen
                </Button>
              </Zeile>
            )}
            {darfStornieren && (
              <div>
                <Button
                  variante="tertiaer"
                  icon="muell"
                  onClick={() => {
                    db.abwesenheiten.remove(a.id);
                    toast(a.status === 'beantragt' ? 'Antrag zurückgezogen.' : 'Abwesenheit gelöscht.', { aktion: { label: 'Rückgängig', onClick: () => db.abwesenheiten.restore(a.id) } });
                  }}
                >
                  {a.status === 'beantragt' ? 'Antrag zurückziehen' : 'Löschen'}
                </Button>
              </div>
            )}
          </>
        }
      />
    </Seite>
  );
}

/** Tab „Abwesenheiten“ am Mitarbeiter */
export function MitarbeiterAbwesenheitenTab({ id }: { id: ID }) {
  useDatenstand();
  const m = db.mitarbeiter.get(id);
  const ich = useIch();
  const darfPersonal = useDarf('personal');
  const jahr = Number(heute().slice(0, 4));
  if (!m) return null;
  const alle = db.abwesenheiten.all();
  const k = urlaubskonto(m, alle, jahr);
  const eigene = alle.filter((a) => a.mitarbeiterId === id).sort((a, b) => b.von.localeCompare(a.von));
  const personal = darfPersonal || ich?.id === id;
  return (
    <Stapel abstand={16}>
      <Raster min={150}>
        <Kennzahl label="Resturlaub" wert={`${String(k.rest).replace('.', ',')} Tage`} zeitraum={String(jahr)} hinweis={`von ${k.anspruch}`} />
        <Kennzahl label="Beantragt" wert={`${String(k.beantragt).replace('.', ',')} Tage`} />
        {personal && <Kennzahl label="Kranktage" wert={String(eigene.filter((a) => a.art === 'krank').reduce((s, a) => s + tageImJahr(a, jahr), 0)).replace('.', ',')} zeitraum={String(jahr)} />}
      </Raster>
      <Liste leer={<Leer titel="Keine Abwesenheiten" text={`Für ${m.vorname} ist nichts eingetragen.`} icon="kalender" aktion={<Button to="/betrieb/abwesenheiten">Abwesenheit eintragen</Button>} />}>
        {eigene.slice(0, 15).map((a) => (
          <AbwesenheitZeile key={a.id} a={a} mitName={false} />
        ))}
      </Liste>
    </Stapel>
  );
}
