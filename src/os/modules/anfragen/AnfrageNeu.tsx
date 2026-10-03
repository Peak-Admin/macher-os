import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import type { ID, Kanal } from '@core/objects';
import { Auswahl, Button, Checkbox, Eingabe, FormRaster, Karte, Meldung, Seite, Stapel, Textfeld, useToast } from '@ui/index';
import { OrtAuswahl } from '@ui/objekt';
import { KANAL_EMOJI, KANAL_TEXT, anfrageAnlegen } from './daten';
import { KundenVorschlaege } from './KundenVorschlaege';
import { QualiAuswahl } from './Qualifizieren';

const QUELLEN: Kanal[] = ['telefon', 'email', 'website', 'whatsapp', 'empfehlung', 'vor_ort', 'sonstiges'];

export function AnfrageNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ name: '', telefon: '', email: '', strasse: '', plz: '', ort: '', titel: '', beschreibung: '', wunschtermin: '' });
  const [quelle, setQuelle] = useState<Kanal>('telefon');
  const [dringend, setDringend] = useState(false);
  const [kundeId, setKundeId] = useState<ID>();
  const [ortId, setOrtId] = useState<ID>();
  const [fehler, setFehler] = useState<{ name?: string; titel?: string }>({});
  const [angelegt, setAngelegt] = useState<{ auftragId: ID; kundeNeu: boolean }>();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const speichern = () => {
    const fe: typeof fehler = {};
    if (!kundeId && !f.name.trim()) fe.name = 'Trage ein, wer anfragt.';
    if (!f.titel.trim()) fe.titel = 'Beschreibe kurz, worum es geht.';
    setFehler(fe);
    if (fe.name || fe.titel) return;
    const r = anfrageAnlegen({
      kundeId,
      neuerKunde: kundeId ? undefined : { name: f.name, telefon: f.telefon, email: f.email, adresse: { strasse: f.strasse.trim(), plz: f.plz.trim(), ort: f.ort.trim() } },
      titel: f.titel,
      beschreibung: f.beschreibung,
      quelle,
      dringend,
      wunschtermin: f.wunschtermin,
      ortId,
    });
    toast(r.kundeNeu ? 'Anfrage erfasst, Kunde neu angelegt.' : 'Anfrage erfasst.');
    setAngelegt({ auftragId: r.auftrag.id, kundeNeu: r.kundeNeu });
  };

  if (angelegt) {
    const a = db.auftraege.get(angelegt.auftragId);
    return (
      <Seite titel="Wie geht's weiter?" zurueck={{ to: '/auftraege/anfragen', label: 'Anfragen' }}>
        <Stapel>
          <Meldung ton="erfolg" titel={`Anfrage ${a?.nummer ?? ''} ist erfasst.`}>
            {angelegt.kundeNeu ? 'Der Kunde wurde neu angelegt.' : 'Sie hängt am bestehenden Kunden.'} Entscheide jetzt den nächsten Schritt – oder später in der Anfragen-Liste.
          </Meldung>
          <Karte>
            <QualiAuswahl
              auftragId={angelegt.auftragId}
              onFertig={() => navigate('/auftraege/anfragen')}
              abbrechen={
                <Button variante="tertiaer" onClick={() => navigate('/auftraege/anfragen')}>
                  Später entscheiden
                </Button>
              }
            />
          </Karte>
          {a && pfadZu({ typ: 'auftraege', id: a.id }) && (
            <div>
              <Button variante="sekundaer" to={pfadZu({ typ: 'auftraege', id: a.id })}>
                Auftragsakte öffnen
              </Button>
            </div>
          )}
        </Stapel>
      </Seite>
    );
  }

  return (
    <Seite titel="Anfrage aufnehmen" untertitel="Wer, was, wie dringend – den Rest erledigt Lotte." zurueck={{ to: '/auftraege/anfragen', label: 'Anfragen' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          speichern();
        }}
      >
        <Stapel abstand={24}>
          <Karte titel="Wer fragt an?" icon="person">
            <Stapel>
              {!kundeId && (
                <FormRaster>
                  <Eingabe label="Name oder Firma" value={f.name} onChange={set('name')} fehler={fehler.name} autoFocus autoComplete="off" />
                  <Eingabe label="Telefon" type="tel" value={f.telefon} onChange={set('telefon')} optional autoComplete="off" />
                  <Eingabe label="E-Mail" type="email" value={f.email} onChange={set('email')} optional autoComplete="off" />
                </FormRaster>
              )}
              <KundenVorschlaege e={{ name: f.name, telefon: f.telefon, email: f.email }} gewaehlt={kundeId} onWahl={(id) => (setKundeId(id), setOrtId(undefined))} />
              {kundeId ? (
                <OrtAuswahl kundeId={kundeId} wert={ortId} onChange={setOrtId} optional />
              ) : (
                <FormRaster spalten={3}>
                  <Eingabe label="Straße und Hausnummer" value={f.strasse} onChange={set('strasse')} optional />
                  <Eingabe label="PLZ" value={f.plz} onChange={set('plz')} optional inputMode="numeric" />
                  <Eingabe label="Ort" value={f.ort} onChange={set('ort')} optional />
                </FormRaster>
              )}
            </Stapel>
          </Karte>
          <Karte titel="Worum geht's?" icon="notiz">
            <Stapel>
              <FormRaster>
                <Eingabe label="Anliegen in Kürze" value={f.titel} onChange={set('titel')} fehler={fehler.titel} placeholder="z. B. Steckdosen im Keller nachrüsten" />
                <Auswahl label="Kanal" value={quelle} onChange={(e) => setQuelle(e.target.value as Kanal)} optionen={QUELLEN.map((q) => ({ wert: q, label: KANAL_TEXT[q], emoji: KANAL_EMOJI[q] }))} />
              </FormRaster>
              <Textfeld label="Details" value={f.beschreibung} onChange={set('beschreibung')} optional placeholder="Was genau, seit wann, was hat der Kunde schon versucht?" />
              <FormRaster>
                <Eingabe label="Wunschtermin" value={f.wunschtermin} onChange={set('wunschtermin')} optional placeholder="z. B. nächste Woche vormittags" />
              </FormRaster>
              <Checkbox label="Dringend – Kunde wartet oder es ist etwas kaputt" checked={dringend} onChange={setDringend} />
            </Stapel>
          </Karte>
          <div>
            <Button type="submit" icon="check">
              Anfrage speichern
            </Button>
          </div>
        </Stapel>
      </form>
    </Seite>
  );
}
