import { appPfad } from '@core/basis';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, neueId, useDatenstand } from '@core/db';
import { datum, euro, positionSumme, relativ, tageZwischen } from '@core/format';
import type { Einheit, Position } from '@core/objects';
import { pfadZu } from '@core/modul';
import { useDarf } from '@core/session';
import {
  Auswahl,
  BeispielMarke,
  Button,
  Dialog,
  Eingabe,
  FormRaster,
  IconButton,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Schalter,
  Seite,
  Stapel,
  Status,
  Textfeld,
  ZweiSpalten,
  Zeile,
  useBestaetigen,
  useToast,
  GeldEingabe,
} from '@ui/index';
import { ObjektLink, ObjektPanels, ObjektTabs } from '@ui/objekt';
import { VersandDialog } from '@modules/dokumente/VersandDialog';
import { DokumentHistorie } from '@modules/dokumente/Historie';
import { kuerzelFuer } from '@modules/dokumente/nummern';
import {
  ART_LABEL,
  betrieb as aktuellerBetrieb,
  entwurfLoeschen,
  festschreiben,
  korrekturEntwurf,
  nummerArt,
  optionenSetzen,
  offenerBetrag,
  pflichtangabenPruefen,
  pflichtTexte,
  rechnungsSummen,
  stornieren,
  zahlungenZu,
} from './logik';
import { rechnungAendern, rechnungX, type RechnungX } from './typen';
import { MaengelListe, RechnungStatus, SummenListe } from './teile';
import { xrechnungHerunterladen } from './xrechnung';
import { KeinZugriff } from './RechnungenListe';
import { ZahlungDialog } from '../zahlungen/ZahlungDialog';
import { MitMacherVorbereiten } from '@modules/macher-fragen/MitMacher';
import { statusAbgleichen, zahlungLoeschen } from '../zahlungen/logik';

const EINHEITEN: Einheit[] = ['Stk', 'h', 'm', 'm²', 'm³', 'Psch', 'kg', 'l', 'Pkt', 'km'];

export function RechnungDetail() {
  const { id = '' } = useParams();
  useDatenstand();
  const darf = useDarf('geld');
  const r = rechnungX(id);
  if (!darf) return <KeinZugriff />;
  if (!r || r.geloeschtAm)
    return (
      <Seite titel="Rechnung nicht gefunden" zurueck={{ to: '/betrieb/rechnungen', label: 'Rechnungen' }}>
        <Leer titel="Diese Rechnung gibt es nicht (mehr)." text="Entwürfe kann man verwerfen. Festgeschriebene Rechnungen bleiben immer erhalten." icon="euro" />
      </Seite>
    );
  return <RechnungAnsicht r={r} />;
}

function RechnungAnsicht({ r }: { r: RechnungX }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, bestaetigung] = useBestaetigen();
  const [senden, setSenden] = useState(false);
  const [storno, setStorno] = useState(false);
  const [zahlung, setZahlung] = useState(false);
  const b = aktuellerBetrieb();
  const k = db.kunden.get(r.kundeId);
  const s = rechnungsSummen(r, b);
  const entwurf = r.status === 'entwurf';
  const pruefung = pflichtangabenPruefen(r, b, k);
  const offen = offenerBetrag(r);
  const original = r.stornoFuerId ? rechnungX(r.stornoFuerId) : undefined;
  const stornoDoc = r.stornoDurchId ? rechnungX(r.stornoDurchId) : undefined;
  const titelArt = r.stornoFuerId ? 'Stornorechnung' : ART_LABEL[r.art];

  const druck = () => window.open(appPfad(`/druck/rechnung/${r.id}`), '_blank');

  const aktion = entwurf ? (
    <Button icon="mail" onClick={() => setSenden(true)}>
      Prüfen und senden
    </Button>
  ) : offen > 0 ? (
    <Button icon="euro" onClick={() => setZahlung(true)}>
      Zahlung erfassen
    </Button>
  ) : undefined;

  const positionen = entwurf ? <PositionenEditor r={r} /> : <PositionenListe r={r} />;
  const zahlungen = zahlungenZu(r.id);

  return (
    <Seite
      titel={`${titelArt} ${entwurf ? '' : r.nummer}`.trim()}
      oberzeile={entwurf ? 'Entwurf' : `vom ${datum(r.datum)}`}
      status={
        <>
          <RechnungStatus r={r} /> <BeispielMarke zeigen={r.beispiel} />
        </>
      }
      zurueck={{ to: '/betrieb/rechnungen', label: 'Rechnungen' }}
      aktion={aktion}
    >
      {r.vonMacher && entwurf && <Meldung ton="neutral" titel="Von Macher vorbereitet">Prüf die Positionen und schick die Rechnung los.</Meldung>}
      {original && (
        <Meldung ton="neutral">
          Storniert die Rechnung <ObjektLink bezug={{ typ: 'rechnungen', id: original.id }}>{original.nummer}</ObjektLink>.
        </Meldung>
      )}
      {stornoDoc && (
        <Meldung
          ton="neutral"
          titel="Diese Rechnung ist storniert"
          aktion={
            <Button
              klein
              variante="sekundaer"
              onClick={() => {
                const neu = korrekturEntwurf(r.id);
                if (neu) navigate(`/betrieb/rechnungen/${neu.id}`);
              }}
            >
              Korrigierte Rechnung erstellen
            </Button>
          }
        >
          Stornorechnung: <ObjektLink bezug={{ typ: 'rechnungen', id: stornoDoc.id }}>{stornoDoc.nummer}</ObjektLink>
        </Meldung>
      )}
      {entwurf && <MaengelListe maengel={pruefung.pflicht} kundeId={r.kundeId} />}
      <ZweiSpalten
        haupt={
          <ObjektTabs
            objekt="rechnungen"
            id={r.id}
            eigene={[
              { id: 'positionen', titel: 'Positionen', inhalt: positionen },
              ...(entwurf ? [] : [{ id: 'zahlungen', titel: 'Zahlungen', zaehler: zahlungen.length, inhalt: <ZahlungenListe r={r} onNeu={() => setZahlung(true)} /> }]),
              { id: 'verlauf', titel: 'Verlauf', inhalt: <DokumentHistorie bezug={{ typ: 'rechnungen', id: r.id }} /> },
            ]}
          />
        }
        seite={
          <>
            <MitMacherVorbereiten bezug={{ typ: 'rechnungen', id: r.id }} breit />
            <Karte titel="Betrag" kompakt>
              <Stapel abstand={8}>
                <SummenListe s={s} kleinunternehmer={b?.kleinunternehmer} />
                {!entwurf && r.art !== 'gutschrift' && r.status !== 'storniert' && (
                  <Zeile zwischen>
                    <span>Noch offen</span>
                    <strong className="mm-number">{euro(offen)}</strong>
                  </Zeile>
                )}
                {!entwurf && r.art !== 'gutschrift' && <Meta>Fällig {relativ(r.faelligAm)}</Meta>}
              </Stapel>
            </Karte>
            <Karte titel="Kunde & Auftrag" kompakt>
              <Stapel abstand={8}>
                <ObjektLink bezug={{ typ: 'kunden', id: r.kundeId }}>{k?.name ?? 'Kunde fehlt'}</ObjektLink>
                {r.auftragId && <ObjektLink bezug={{ typ: 'auftraege', id: r.auftragId }}>{db.auftraege.get(r.auftragId)?.nummer} · {db.auftraege.get(r.auftragId)?.titel}</ObjektLink>}
                {r.angebotId && <ObjektLink bezug={{ typ: 'angebote', id: r.angebotId }}>Angebot {db.angebote.get(r.angebotId)?.nummer}</ObjektLink>}
              </Stapel>
            </Karte>
            {entwurf && pruefung.empfehlung.length > 0 && <MaengelListe maengel={pruefung.empfehlung} kundeId={r.kundeId} ton="neutral" />}
            <Karte titel="Dokumente" kompakt>
              <Stapel abstand={8}>
                <Button variante="sekundaer" icon="dokument" onClick={druck}>
                  {entwurf ? 'Vorschau ansehen' : 'Drucken / PDF'}
                </Button>
                {!entwurf && (
                  <Button variante="sekundaer" icon="download" onClick={() => (xrechnungHerunterladen(r), toast('XRechnung heruntergeladen.'))}>
                    XRechnung (XML)
                  </Button>
                )}
                {!entwurf && (
                  <Button variante="tertiaer" icon="mail" onClick={() => setSenden(true)}>
                    Erneut senden
                  </Button>
                )}
                <Meta>E-Rechnung: XRechnung (UBL 2.1). ZUGFeRD ist geplant.</Meta>
              </Stapel>
            </Karte>
            {entwurf ? (
              <Button
                variante="tertiaer"
                icon="muell"
                onClick={async () => {
                  if (await fragen('Entwurf verwerfen?', 'Der Entwurf hat noch keine Nummer und kann gelöscht werden. Material wird wieder freigegeben.', 'Entwurf verwerfen')) {
                    entwurfLoeschen(r.id);
                    toast('Entwurf verworfen.');
                    navigate('/betrieb/rechnungen', { replace: true });
                  }
                }}
              >
                Entwurf verwerfen
              </Button>
            ) : (
              r.status !== 'storniert' &&
              !r.stornoFuerId && (
                <Button variante="tertiaer" icon="x" onClick={() => setStorno(true)}>
                  Rechnung stornieren
                </Button>
              )
            )}
            <ObjektPanels objekt="rechnungen" id={r.id} />
          </>
        }
      />
      <VersandDialog
        bezug={{ typ: 'rechnungen', id: r.id }}
        offen={senden}
        onSchliessen={() => setSenden(false)}
        nebenaktion={
          entwurf
            ? {
                label: 'Ich verschicke sie selbst',
                onClick: () => {
                  const e = festschreiben(r.id, { weg: 'selbst' });
                  if (!e.ok) return toast(e.maengel?.[0]?.text ?? 'Es fehlen Pflichtangaben.', { ton: 'achtung' });
                  window.open(appPfad(`/druck/rechnung/${r.id}`), '_blank');
                  toast(`${e.rechnung!.nummer} festgeschrieben. Druck sie aus oder speichere das PDF.`);
                  setSenden(false);
                },
              }
            : undefined
        }
      />
      <StornoDialog r={r} offen={storno} onSchliessen={() => setStorno(false)} />
      <ZahlungDialog rechnungId={r.id} offen={zahlung} onSchliessen={() => setZahlung(false)} />
      {bestaetigung}
    </Seite>
  );
}

// ------------------------------------------------------------------ Positionen

function PositionenListe({ r }: { r: RechnungX }) {
  const texte = [...pflichtTexte(r), r.bemerkung].filter(Boolean) as string[];
  return (
    <Stapel>
      <Meta>
        {r.titel}
        {r.leistungszeitraum ? ` · Leistung: ${r.leistungszeitraum}` : ''}
      </Meta>
      <Liste>
        {r.positionen.map((p, i) => (
          <ListenZeile
            key={p.id}
            titel={`${i + 1}. ${p.text}`}
            untertitel={p.art === 'text' ? undefined : `${String(p.menge).replace('.', ',')} ${p.einheit} × ${euro(p.einzelpreis)}`}
            rechts={p.art === 'text' ? undefined : <span className="mm-number">{euro(positionSumme(p))}</span>}
          />
        ))}
      </Liste>
      {texte.map((t) => (
        <Meta key={t}>{t}</Meta>
      ))}
      <Meta>
        <span>Festgeschrieben – Änderungen nur per Storno und neuer Rechnung (GoBD).</span>
      </Meta>
    </Stapel>
  );
}

function PositionenEditor({ r }: { r: RechnungX }) {
  const k = db.kunden.get(r.kundeId);
  const [mehr, setMehr] = useState(!!(r.einbehaltProzent || r.reverseCharge || r.nummernkreis));
  const setPos = (id: string, patch: Partial<Position>) =>
    rechnungAendern(r.id, { positionen: r.positionen.map((p) => (p.id === id ? { ...p, ...patch } : p)) }, { leise: true });
  const entfernen = (id: string) => rechnungAendern(r.id, { positionen: r.positionen.filter((p) => p.id !== id) }, { leise: true });
  const neu = (art: Position['art']) =>
    rechnungAendern(r.id, { positionen: [...r.positionen, { id: neueId('p'), art, text: '', menge: 1, einheit: art === 'lohn' ? 'h' : 'Stk', einzelpreis: art === 'lohn' ? aktuellerBetrieb()?.stundensatz ?? 0 : 0 }] }, { leise: true });
  const ziel = Math.max(0, tageZwischen(r.datum, r.faelligAm));
  return (
    <Stapel>
      <FormRaster>
        <Eingabe label="Betreff" value={r.titel} onChange={(e) => rechnungAendern(r.id, { titel: e.target.value }, { leise: true })} />
        <Eingabe
          label="Leistungszeitraum"
          value={r.leistungszeitraum ?? ''}
          placeholder="z. B. 12.09.2026 oder September 2026"
          onChange={(e) => rechnungAendern(r.id, { leistungszeitraum: e.target.value }, { leise: true })}
          hilfe="Pflichtangabe. Macher trägt ihn aus Zeiten und Terminen ein."
        />
      </FormRaster>
      {r.positionen.length === 0 && <Leer titel="Noch keine Positionen" text="Füge Leistungen, Material oder Arbeitszeit hinzu." icon="liste" />}
      {r.positionen.map((p, i) => (
        <Karte key={p.id} kompakt>
          <Stapel abstand={8}>
            <Zeile zwischen umbruch={false}>
              <strong>Position {i + 1}</strong>
              <IconButton icon="muell" label={`Position ${i + 1} entfernen`} onClick={() => entfernen(p.id)} />
            </Zeile>
            <Textfeld label="Beschreibung" rows={2} value={p.text} onChange={(e) => setPos(p.id, { text: e.target.value })} />
            {p.art !== 'text' && (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', alignItems: 'end' }}>
                <Eingabe label="Menge" type="number" step="any" value={String(p.menge)} onChange={(e) => setPos(p.id, { menge: Number(e.target.value) || 0 })} />
                <Auswahl label="Einheit" value={p.einheit} onChange={(e) => setPos(p.id, { einheit: e.target.value as Einheit })} optionen={EINHEITEN.map((x) => ({ wert: x, label: x }))} />
                <GeldEingabe label="Einzelpreis netto" wert={p.einzelpreis} onWert={(c) => setPos(p.id, { einzelpreis: c })} />
                <div className="mm-feld">
                  <span className="mm-label">Summe</span>
                  <strong className="mm-number" style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    {euro(positionSumme(p))}
                  </strong>
                </div>
              </div>
            )}
          </Stapel>
        </Karte>
      ))}
      <Zeile>
        <Button variante="sekundaer" icon="plus" onClick={() => neu('leistung')}>
          Leistung
        </Button>
        <Button variante="sekundaer" icon="plus" onClick={() => neu('material')}>
          Material
        </Button>
        <Button variante="sekundaer" icon="plus" onClick={() => neu('lohn')}>
          Arbeitszeit
        </Button>
        <Button variante="tertiaer" icon="plus" onClick={() => neu('text')}>
          Textzeile
        </Button>
      </Zeile>
      <Textfeld label="Bemerkung unter der Rechnung" optional rows={2} value={r.bemerkung ?? ''} onChange={(e) => rechnungAendern(r.id, { bemerkung: e.target.value || undefined }, { leise: true })} />
      <div>
        <Button variante="tertiaer" icon={mehr ? 'x' : 'einstellungen'} aria-expanded={mehr} onClick={() => setMehr(!mehr)}>
          {mehr ? 'Weniger Optionen' : 'Weitere Optionen'}
        </Button>
      </div>
      {mehr && (
        <Stapel>
          <FormRaster>
            <Eingabe label="Zahlungsziel in Tagen" type="number" min={0} value={String(ziel)} onChange={(e) => optionenSetzen(r.id, { zielTage: Math.max(0, Number(e.target.value) || 0) })} />
            <Eingabe
              label="Sicherheitseinbehalt in Prozent"
              optional
              inputMode="decimal"
              value={r.einbehaltProzent != null ? String(r.einbehaltProzent).replace('.', ',') : ''}
              placeholder="z. B. 5"
              onChange={(e) => optionenSetzen(r.id, { einbehaltProzent: Math.min(20, Math.max(0, Number(e.target.value.replace(',', '.')) || 0)) })}
              hilfe="Behält dein Kunde bis zum Ende der Gewährleistung ein. Mindert den Zahlbetrag."
            />
            <Eingabe
              label="Kürzel für die Rechnungsnummer"
              optional
              maxLength={4}
              value={r.nummernkreis ?? ''}
              placeholder={kuerzelFuer(nummerArt(r))}
              onChange={(e) => optionenSetzen(r.id, { nummernkreis: e.target.value.replace(/[^a-zA-Z]/g, '') })}
              hilfe="Nur für einen eigenen Nummernkreis. Standard unter Vorlagen › Nummernkreise."
            />
          </FormRaster>
          {k && k.art !== 'privat' && !aktuellerBetrieb()?.kleinunternehmer && (
            <Schalter
              label="Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)"
              beschreibung="Nur bei Bauleistungen an Betriebe, die selbst Bauleistungen erbringen. Dann ohne USt und mit Pflichthinweis."
              checked={!!r.reverseCharge}
              onChange={(v) => optionenSetzen(r.id, { reverseCharge: v })}
            />
          )}
        </Stapel>
      )}
    </Stapel>
  );
}

// ------------------------------------------------------------------ Zahlungen

function ZahlungenListe({ r, onNeu }: { r: RechnungX; onNeu: () => void }) {
  const liste = zahlungenZu(r.id).sort((a, b) => b.datum.localeCompare(a.datum));
  const toast = useToast();
  const offen = offenerBetrag(r);
  if (!liste.length)
    return (
      <Leer
        titel="Noch keine Zahlung"
        text={r.art === 'gutschrift' ? 'Gutschriften werden nicht bezahlt, sondern erstattet oder verrechnet.' : 'Erfasse die Zahlung hier oder importiere deinen Kontoauszug – Macher ordnet sie zu.'}
        aktion={offen > 0 ? <Button onClick={onNeu}>Zahlung erfassen</Button> : undefined}
        icon="euro"
      />
    );
  return (
    <Liste>
      {liste.map((z) => (
        <ListenZeile
          key={z.id}
          titel={`${euro(z.betrag)}${z.skonto ? ` + ${euro(z.skonto)} Skonto` : ''}`}
          untertitel={`${datum(z.datum)} · ${z.quelle === 'kontoauszug' ? 'aus Kontoauszug' : 'von Hand erfasst'}${z.verwendungszweck ? ` · ${z.verwendungszweck}` : ''}`}
          rechts={
            <IconButton
              icon="muell"
              label="Zahlung entfernen"
              onClick={() => {
                zahlungLoeschen(z.id);
                toast('Zahlung entfernt.', { aktion: { label: 'Rückgängig', onClick: () => (db.zahlungen.restore(z.id), statusAbgleichen(z.rechnungId)) } });
              }}
            />
          }
        />
      ))}
    </Liste>
  );
}

// ------------------------------------------------------------------ Dialoge

function StornoDialog({ r, offen, onSchliessen }: { r: RechnungX; offen: boolean; onSchliessen: () => void }) {
  const [grund, setGrund] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const gezahlt = zahlungenZu(r.id).reduce((s, z) => s + z.betrag, 0);
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`${r.nummer} stornieren`}
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button
            variante="gefahr"
            onClick={() => {
              const s = stornieren(r.id, grund.trim() || undefined);
              if (!s) return;
              toast(`Stornorechnung ${s.nummer} erstellt.`);
              onSchliessen();
              navigate(pfadZu({ typ: 'rechnungen', id: s.id }) ?? `/betrieb/rechnungen/${s.id}`);
            }}
          >
            Stornieren
          </Button>
        </>
      }
    >
      <Stapel>
        <p>Macher erstellt eine Stornorechnung mit eigener Nummer, die alle Beträge aufhebt. Die Originalrechnung bleibt erhalten. Danach kannst du eine korrigierte Rechnung erstellen.</p>
        <Eingabe label="Grund" optional value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z. B. falscher Stundensatz" />
        {gezahlt > 0 && (
          <Meldung ton="achtung">
            Auf diese Rechnung sind schon {euro(gezahlt)} eingegangen. Erstatte den Betrag oder verrechne ihn mit der neuen Rechnung.
          </Meldung>
        )}
        <Status ton="neutral">Stornorechnung wird sofort festgeschrieben</Status>
      </Stapel>
    </Dialog>
  );
}
