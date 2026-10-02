import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { relativ } from '@core/format';
import { useEinstellung } from '@core/einstellungen';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Abschnitt, Button, Dialog, Eingabe, Karte, Kennzahl, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Segmente, Stapel, Status, Tabs, Textfeld, Zeile, useToast } from '@ui/index';
import { KundeAuswahl, ObjektLink } from '@ui/objekt';
import {
  LINK_KEY,
  ZUFRIEDENHEIT,
  anfrageSenden,
  anfrageText,
  anfrageVerwerfen,
  bewertungen,
  empfehlerRangliste,
  empfehlungErfassen,
  zufriedenheitLabel,
  type Bewertung,
  type SendenErgebnis,
} from './daten';

export const FEHLER_TEXT: Record<Exclude<SendenErgebnis, { ok: true }>['grund'], string> = {
  kein_link: 'Trag zuerst deinen Google-Bewertungslink ein.',
  kein_kontakt: 'Beim Kunden fehlt E-Mail und Telefon. Trag eins davon ein.',
  unbekannt: 'Auftrag oder Kunde gibt es nicht mehr.',
};

export function BewertungenSeite() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'anfragen';
  const alle = bewertungen.use();
  const anfragen = alle.filter((b) => b.art === 'anfrage');
  const vorbereitet = anfragen.filter((b) => b.status === 'vorbereitet');
  const [link] = useEinstellung(LINK_KEY, '');
  const kunden = db.kunden.use();
  const ohneEmpfehler = kunden.filter((k) => k.quelle === 'empfehlung' && !alle.some((b) => b.art === 'empfehlung' && b.kundeId === k.id));

  return (
    <Seite titel="Bewertungen & Empfehlungen" untertitel="Nach erledigter Arbeit fragt Macher für dich nach einer Bewertung. Du gibst nur frei.">
      <Stapel abstand={24}>
        {!link && tab !== 'einstellung' && (
          <Meldung ton="achtung" titel="Google-Bewertungslink fehlt" aktion={<Button klein variante="sekundaer" onClick={() => setParams({ tab: 'einstellung' })}>Eintragen</Button>}>
            Ohne Link kann Macher keine Anfragen verschicken.
          </Meldung>
        )}
        <Tabs
          aktiv={tab}
          onWechsel={(t) => setParams({ tab: t })}
          tabs={[
            { id: 'anfragen', titel: 'Anfragen', zaehler: vorbereitet.length },
            { id: 'empfehlungen', titel: 'Empfehlungen', zaehler: ohneEmpfehler.length },
            { id: 'einstellung', titel: 'Einstellung' },
          ]}
        />
        {tab === 'anfragen' && <Anfragen liste={anfragen} />}
        {tab === 'empfehlungen' && <Empfehlungen ohneEmpfehler={ohneEmpfehler.map((k) => k.id)} />}
        {tab === 'einstellung' && <Einstellung />}
      </Stapel>
    </Seite>
  );
}

function Anfragen({ liste }: { liste: Bewertung[] }) {
  const toast = useToast();
  const darf = useDarf('veroeffentlichen');
  const [zufrieden, setZufrieden] = useState<Bewertung | null>(null);
  const [, setParams] = useSearchParams();
  const auftraege = db.auftraege.use();
  const kunden = db.kunden.use();
  const vorbereitet = liste.filter((b) => b.status === 'vorbereitet');
  const gesendet = liste.filter((b) => b.status === 'gesendet').sort((a, b) => (b.gesendetAm ?? '').localeCompare(a.gesendetAm ?? ''));
  const mitZufriedenheit = liste.filter((b) => b.zufriedenheit);
  const schnitt = mitZufriedenheit.length ? mitZufriedenheit.reduce((s, b) => s + (b.zufriedenheit ?? 0), 0) / mitZufriedenheit.length : undefined;

  const senden = (auftragId: ID) => {
    const r = anfrageSenden(auftragId);
    if (r.ok) toast(`Bewertungsanfrage ist raus (${r.kanal === 'email' ? 'E-Mail' : 'SMS'}).`);
    else {
      toast(FEHLER_TEXT[r.grund], { ton: 'achtung' });
      if (r.grund === 'kein_link') setParams({ tab: 'einstellung' });
    }
  };

  const zeile = (b: Bewertung, rechts: React.ReactNode) => {
    const a = auftraege.find((x) => x.id === b.auftragId);
    const k = kunden.find((x) => x.id === b.kundeId);
    return (
      <ListenZeile
        key={b.id}
        titel={k?.name ?? 'Kunde'}
        untertitel={[a ? `${a.nummer} · ${a.titel}` : null, b.gesendetAm ? `gefragt ${relativ(b.gesendetAm)}` : a?.abgeschlossenAm ? `erledigt ${relativ(a.abgeschlossenAm)}` : null, b.zufriedenheit ? zufriedenheitLabel(b.zufriedenheit) : null]
          .filter(Boolean)
          .join(' · ')}
        rechts={rechts}
      />
    );
  };

  return (
    <Stapel abstand={24}>

      <Abschnitt titel="Freigeben" hinweis="Vorbereitet nach erledigten Aufträgen. Reklamationen und unzufriedene Kunden lässt Macher aus.">
        <Liste leer={<Leer titel="Nichts freizugeben" text="Sobald ein Auftrag erledigt ist, bereitet Macher die Bewertungsanfrage hier vor." icon="check" />}>
          {vorbereitet.map((b) =>
            zeile(
              b,
              <Zeile abstand={4}>
                <Button klein icon="check" disabled={!darf} onClick={() => b.auftragId && senden(b.auftragId)}>
                  Anfrage senden
                </Button>
                <Button
                  klein
                  variante="tertiaer"
                  onClick={() => {
                    if (b.auftragId) anfrageVerwerfen(b.auftragId);
                    toast('Verstanden. Diesen Kunden fragen wir nicht.');
                  }}
                >
                  Nicht fragen
                </Button>
              </Zeile>,
            ),
          )}
        </Liste>
      </Abschnitt>

      <Abschnitt titel="Gefragt" hinweis="Hat der Kunde sich gemeldet? Trag ein, wie zufrieden er war – nur intern, wird nirgends veröffentlicht.">
        <Liste leer={<Leer titel="Noch niemand gefragt" text="Gesendete Anfragen erscheinen hier." icon="stern" />}>
          {gesendet.map((b) =>
            zeile(
              b,
              <Button klein variante={b.zufriedenheit ? 'tertiaer' : 'sekundaer'} onClick={() => setZufrieden(b)}>
                {b.zufriedenheit ? 'Ändern' : 'Rückmeldung eintragen'}
              </Button>,
            ),
          )}
        </Liste>
      </Abschnitt>
      <Raster min={160}>
        <Kennzahl label="Warten auf Freigabe" wert={vorbereitet.length} />
        <Kennzahl label="Gefragt" wert={gesendet.length} zeitraum="bisher" />
        <Kennzahl label="Zufriedenheit (intern)" wert={schnitt != null ? `${schnitt.toFixed(1).replace('.', ',')} von 5` : '–'} hinweis={mitZufriedenheit.length ? `aus ${mitZufriedenheit.length} Rückmeldungen` : 'Noch keine Rückmeldung erfasst'} />
      </Raster>
      {zufrieden && <ZufriedenheitDialog b={zufrieden} onSchliessen={() => setZufrieden(null)} />}
    </Stapel>
  );
}

export function ZufriedenheitDialog({ b, onSchliessen }: { b: Bewertung; onSchliessen: () => void }) {
  const toast = useToast();
  const [wert, setWert] = useState<string>(String(b.zufriedenheit ?? 5));
  const [notiz, setNotiz] = useState(b.zufriedenheitNotiz ?? '');
  return (
    <Dialog
      offen
      titel="Wie zufrieden war der Kunde?"
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              bewertungen.update(b.id, { zufriedenheit: Number(wert) as Bewertung['zufriedenheit'], zufriedenheitNotiz: notiz.trim() || undefined });
              toast('Rückmeldung ist gespeichert.');
              onSchliessen();
            }}
          >
            Speichern
          </Button>
        </>
      }
    >
      <Stapel abstand={16}>
        <Meta>Nur eintragen, was der Kunde selbst gesagt oder geschrieben hat.</Meta>
        <Segmente label="Zufriedenheit" wert={wert} onChange={setWert} optionen={ZUFRIEDENHEIT.map((z) => ({ wert: String(z.wert), label: z.label }))} />
        <Textfeld label="Was hat er gesagt?" value={notiz} onChange={(e) => setNotiz(e.target.value)} optional rows={2} />
      </Stapel>
    </Dialog>
  );
}

function Empfehlungen({ ohneEmpfehler }: { ohneEmpfehler: ID[] }) {
  const alle = bewertungen.use((b) => b.art === 'empfehlung');
  const kunden = db.kunden.use();
  const toast = useToast();
  const [zuordnen, setZuordnen] = useState<ID | null>(null);
  const rangliste = empfehlerRangliste(alle);
  const name = (id: ID) => kunden.find((k) => k.id === id)?.name ?? 'Unbekannt';
  return (
    <Stapel abstand={24}>
      {ohneEmpfehler.length > 0 && (
        <Abschnitt titel="Wer hat empfohlen?" hinweis="Diese Kunden kamen über eine Empfehlung. Trag ein, von wem – dann kannst du dich bedanken.">
          <Liste>
            {ohneEmpfehler.map((id) => (
              <ListenZeile key={id} titel={<ObjektLink bezug={{ typ: 'kunden', id }}>{name(id)}</ObjektLink>} rechts={<Button klein variante="sekundaer" onClick={() => setZuordnen(id)}>Empfehler eintragen</Button>} />
            ))}
          </Liste>
        </Abschnitt>
      )}
      <Abschnitt titel="Eure Empfehler">
        <Liste leer={<Leer titel="Noch keine Empfehlungen erfasst" text="Wenn ein neuer Kunde sagt „Familie X hat euch empfohlen“, trag es beim Anlegen unter „Wie ist der Kunde auf euch gekommen?“ ein." icon="team" />}>
          {rangliste.map((r) => {
            const offenerDank = alle.filter((e) => e.empfohlenVonKundeId === r.kundeId && !e.bedanktAm);
            return (
              <ListenZeile
                key={r.kundeId}
                titel={<ObjektLink bezug={{ typ: 'kunden', id: r.kundeId }}>{name(r.kundeId)}</ObjektLink>}
                untertitel={`hat empfohlen: ${r.kundeIds.map(name).join(', ')}`}
                rechts={
                  offenerDank.length ? (
                    <Button
                      klein
                      variante="sekundaer"
                      onClick={() => {
                        const zeit = new Date().toISOString();
                        offenerDank.forEach((e) => bewertungen.update(e.id, { bedanktAm: zeit }));
                        toast(`Notiert: bei ${name(r.kundeId)} bedankt.`);
                      }}
                    >
                      Bedankt
                    </Button>
                  ) : (
                    <Status ton="erfolg">{r.anzahl === 1 ? '1 Kunde' : `${r.anzahl} Kunden`}</Status>
                  )
                }
              />
            );
          })}
        </Liste>
      </Abschnitt>
      {zuordnen && <EmpfehlerDialog kundeId={zuordnen} onSchliessen={() => setZuordnen(null)} />}
    </Stapel>
  );
}

export function EmpfehlerDialog({ kundeId, onSchliessen }: { kundeId: ID; onSchliessen: () => void }) {
  const toast = useToast();
  const [von, setVon] = useState<ID>('');
  const [fehler, setFehler] = useState<string>();
  return (
    <Dialog
      offen
      titel={`Wer hat ${db.kunden.get(kundeId)?.name ?? 'den Kunden'} empfohlen?`}
      onSchliessen={onSchliessen}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!von) return setFehler('Wähle den Kunden, der euch empfohlen hat.');
              try {
                empfehlungErfassen(kundeId, von);
                if (db.kunden.get(kundeId)?.quelle !== 'empfehlung') db.kunden.update(kundeId, { quelle: 'empfehlung' });
                toast('Empfehlung ist eingetragen.');
                onSchliessen();
              } catch (e) {
                setFehler((e as Error).message);
              }
            }}
          >
            Speichern
          </Button>
        </>
      }
    >
      <Stapel abstand={8}>
        <KundeAuswahl label="Empfohlen von" wert={von} onChange={(id) => (setVon(id), setFehler(undefined))} />
        {fehler && (
          <p className="mm-fehlertext" role="alert">
            {fehler}
          </p>
        )}
      </Stapel>
    </Dialog>
  );
}

function Einstellung() {
  const [link, setLink] = useEinstellung(LINK_KEY, '');
  const [wert, setWert] = useState(link);
  const [fehler, setFehler] = useState<string>();
  const toast = useToast();
  const darf = useDarf('admin');
  const betrieb = db.betrieb.useOne('betrieb');
  return (
    <Stapel abstand={24}>
      <Karte titel="Google-Bewertungslink">
        <form
          className="mm-stapel"
          style={{ gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            const v = wert.trim();
            if (v && !/^https:\/\/\S+\.\S+/.test(v)) return setFehler('Der Link muss mit https:// beginnen.');
            setLink(v);
            setFehler(undefined);
            toast(v ? 'Link ist gespeichert.' : 'Link ist entfernt.');
          }}
        >
          <Eingabe
            label="Link zu deinem Google-Unternehmensprofil"
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            fehler={fehler}
            placeholder="https://g.page/r/…/review"
            hilfe="Findest du im Google-Unternehmensprofil unter „Nach Rezensionen fragen“."
            disabled={!darf}
            inputMode="url"
          />
          <div>
            <Button type="submit" disabled={!darf}>
              Speichern
            </Button>
          </div>
          {!darf && <Meta>Den Link kann nur der Chef ändern.</Meta>}
        </form>
      </Karte>
      <Karte titel="So sieht die Anfrage aus">
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{anfrageText({ name: 'Familie Muster', art: 'privat', ansprechpartner: [] }, betrieb, link || '[dein Google-Link]')}</pre>
      </Karte>
      <Meldung titel="Keine erfundenen Bewertungen">Macher fragt nur echte Kunden nach echter Arbeit. Bewertungen werden nie automatisch geschrieben oder geschönt.</Meldung>
    </Stapel>
  );
}

