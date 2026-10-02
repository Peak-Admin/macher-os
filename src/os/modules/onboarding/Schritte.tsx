/** Konto erstellen (Signup) vor dem Magic Setup – nur, wenn Konten verbunden sind. */
import { useEffect, useRef, useState } from 'react';
import { cloud } from '@core/cloud';
import { useKontoZustand } from '@core/cloud-supabase';
import { Button, Eingabe, Meldung, Meta, Segmente, Zeile } from '@ui/index';
import { telefonGueltig } from './daten';

// ------------------------------------------------------------------ Konto (Signup)

export type KontoStand =
  | { art: 'lokal' }
  | { art: 'offen' }
  | { art: 'laedt' }
  | { art: 'code'; telefon: string }
  | { art: 'link'; email: string }
  | { art: 'gesichert' };

/**
 * `email` kommt vorausgefüllt von der Website (`/os/willkommen?email=…`), `google` startet die Google-Anmeldung direkt
 * (`?anmeldung=google`) – beides nur, wenn Konten verbunden sind.
 */
export function SchrittKonto({
  konto,
  setKonto,
  email = '',
  google = false,
}: {
  konto: KontoStand;
  setKonto: (k: KontoStand) => void;
  email?: string;
  google?: boolean;
}) {
  const [weg, setWeg] = useState<'email' | 'telefon'>('email');
  const [ziel, setZiel] = useState(email);
  const [code, setCode] = useState('');
  const [fehler, setFehler] = useState<string>();
  const mitGoogle = cloud().mitGoogle;
  const googleGestartet = useRef(false);
  const angemeldet = !!useKontoZustand().konto;

  // Zurück von Google (oder aus dem Anmeldelink): Die Sitzung kommt erst nach dem Laden an.
  useEffect(() => {
    if (angemeldet && (konto.art === 'offen' || konto.art === 'laedt' || konto.art === 'link')) setKonto({ art: 'gesichert' });
  }, [angemeldet, konto.art, setKonto]);

  const googleStarten = async () => {
    if (!mitGoogle) return;
    setFehler(undefined);
    setKonto({ art: 'laedt' });
    const r = await mitGoogle('/willkommen');
    if (!r.ok) {
      setKonto({ art: 'offen' });
      setFehler(r.fehler ?? 'Die Anmeldung mit Google hat nicht geklappt. Versuche es noch einmal.');
    }
  };

  useEffect(() => {
    if (!google || googleGestartet.current || konto.art !== 'offen') return;
    googleGestartet.current = true;
    void googleStarten();
    // nur einmal beim Öffnen von der Website
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google, konto.art]);

  if (konto.art === 'lokal')
    return (
      <Meldung titel="Deine Daten bleiben in diesem Browser">
        Konten sind hier noch nicht verbunden. Alles, was du einrichtest, liegt bis dahin nur auf diesem Gerät. Mach dir unter Betrieb → Einstellungen ab und zu eine Sicherung. Sobald Konten verbunden sind, sicherst du alles mit einem Tipp.
      </Meldung>
    );
  if (konto.art === 'gesichert')
    return (
      <Meldung ton="erfolg" titel="Konto gesichert">
        Du kommst jetzt von jedem Gerät wieder rein. Dein Team bekommt seine Einladung, sobald du fertig bist.
      </Meldung>
    );
  if (konto.art === 'link')
    return (
      <Meldung ton="erfolg" titel="Link ist unterwegs">
        Wir haben dir einen Anmeldelink an {konto.email} geschickt. Öffne ihn auf diesem Gerät – du kannst hier schon fertig machen.
      </Meldung>
    );

  const anfordern = async () => {
    const z = ziel.trim();
    if (weg === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(z)) return setFehler('Trag deine E-Mail-Adresse ein.');
    if (weg === 'telefon' && !telefonGueltig(z)) return setFehler('Trag deine Handynummer ein.');
    setFehler(undefined);
    setKonto({ art: 'laedt' });
    const r = await cloud().anmelden(weg === 'email' ? { email: z } : { telefon: z });
    if (!r.ok) {
      setKonto({ art: 'offen' });
      return setFehler(r.fehler ?? 'Das hat nicht geklappt. Versuche es noch einmal.');
    }
    setKonto(weg === 'email' ? { art: 'link', email: z } : { art: 'code', telefon: z });
  };

  const bestaetigen = async () => {
    if (konto.art !== 'code') return;
    if (!/^\d{6}$/.test(code.trim())) return setFehler('Der Code hat sechs Ziffern.');
    setFehler(undefined);
    const r = await cloud().codeBestaetigen(konto.telefon, code.trim());
    if (!r.ok) return setFehler(r.fehler ?? 'Der Code stimmt nicht.');
    setKonto({ art: 'gesichert' });
  };

  if (konto.art === 'code')
    return (
      <form
        className="ob-block"
        onSubmit={(e) => {
          e.preventDefault();
          void bestaetigen();
        }}
      >
        <Meta>Wir haben dir einen 6-stelligen Code an {konto.telefon} geschickt.</Meta>
        <Eingabe label="Code aus der SMS" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus />
        {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
        <div>
          <Button type="submit" variante="sekundaer" icon="check">
            Code bestätigen
          </Button>
        </div>
      </form>
    );

  return (
    <form
      className="ob-block"
      onSubmit={(e) => {
        e.preventDefault();
        void anfordern();
      }}
    >
      {mitGoogle && (
        <>
          <Zeile>
            <Button type="button" variante="sekundaer" onClick={() => void googleStarten()} disabled={konto.art === 'laedt'}>
              Mit Google anmelden
            </Button>
          </Zeile>
          <Meta>Oder ohne Google:</Meta>
        </>
      )}
      <Segmente
        label="Anmelden mit"
        wert={weg}
        optionen={[
          { wert: 'email', label: 'E-Mail' },
          { wert: 'telefon', label: 'Handynummer' },
        ]}
        onChange={(w) => (setWeg(w), setZiel(''), setFehler(undefined))}
      />
      {weg === 'email' ? (
        <Eingabe label="Deine E-Mail-Adresse" value={ziel} onChange={(e) => setZiel(e.target.value)} inputMode="email" autoComplete="email" />
      ) : (
        <Eingabe label="Deine Handynummer" value={ziel} onChange={(e) => setZiel(e.target.value)} inputMode="tel" autoComplete="tel" />
      )}
      {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
      <Zeile>
        <Button type="submit" variante="sekundaer" laedt={konto.art === 'laedt'} laedtText="Wird geschickt …">
          {weg === 'email' ? 'Anmeldelink schicken' : 'Code per SMS schicken'}
        </Button>
      </Zeile>
      <Meta>Kein Passwort. Du kannst das auch überspringen und später unter Betrieb sichern.</Meta>
    </form>
  );
}
