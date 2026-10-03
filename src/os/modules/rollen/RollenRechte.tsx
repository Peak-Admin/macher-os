import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import { BEREICHE, BETRIEB_GRUPPEN, moduleIn } from '@core/modul';
import { personName } from '@core/format';
import type { Rolle } from '@core/objects';
import { RECHTE, ROLLEN, STANDARD_RECHTE, setzeIch, useDarf, useIch } from '@core/session';
import { useEinstellung } from '@core/einstellungen';
import { Button, Checkbox, Karte, Liste, ListenZeile, Meldung, Meta, Segmente, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { Icon } from '@ui/index';
import { ROLLEN_ICON } from '@modules/mitarbeiter/team';
import { FESTE_ROLLE, RECHT_TEXT, bereinigen, gleich, rechtSetzen, type Matrix } from './daten';

export function RollenRechte() {
  const toast = useToast();
  const navigate = useNavigate();
  const admin = useDarf('admin');
  const ich = useIch();
  const [gespeichert, setMatrix] = useEinstellung<Matrix>('rollen.rechte', STANDARD_RECHTE);
  const matrix = bereinigen({ ...STANDARD_RECHTE, ...gespeichert }, RECHTE.map((r) => r.id));
  const [vorschau, setVorschau] = useState<Rolle>('monteur');
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv);
  const standard = gleich(matrix, STANDARD_RECHTE);

  const umschalten = (rolle: Rolle, recht: (typeof RECHTE)[number]['id'], an: boolean) => {
    if (!admin) return;
    setMatrix(rechtSetzen(matrix, rolle, recht, an));
  };

  const rechteVorschau = matrix[vorschau] ?? [];
  const sichtbareModule = BEREICHE.flatMap((b) =>
    moduleIn(b.id).filter((m) => m.routen?.length && m.navigation !== 'versteckt' && (!m.rollen || m.rollen.includes(vorschau))).map((m) => ({ m, bereich: b.titel })),
  );
  const person = mitarbeiter.find((m) => m.rolle === vorschau);

  return (
    <Seite titel="Rollen & Rechte" untertitel="Wer im Betrieb was sehen und ändern darf. Macher hält sich an dieselben Rechte wie der Mensch, für den es arbeitet.">
      <Stapel abstand={24}>
        {!admin && <Meldung titel="Nur ansehen">Rechte ändern darf nur, wer das Recht „Einstellungen“ hat.</Meldung>}
        <Karte
          titel="Rechte je Rolle"
          icon="schloss"
          aktion={
            admin && !standard ? (
              <Button variante="tertiaer" klein icon="wiederholen" onClick={() => (setMatrix(STANDARD_RECHTE), toast('Standardrechte wiederhergestellt.'))}>
                Auf Standard zurücksetzen
              </Button>
            ) : undefined
          }
        >
          <Stapel>
            <Liste>
              {RECHTE.map((r) => (
                <li key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--mm-border)' }}>
                  <Stapel abstand={8}>
                    <div>
                      <strong>{r.label}</strong>
                      <Meta>{RECHT_TEXT[r.id].kann}</Meta>
                    </div>
                    <Zeile abstand={16}>
                      {ROLLEN.map((rolle) => (
                        <Checkbox
                          key={rolle.id}
                          label={rolle.label}
                          checked={matrix[rolle.id]?.includes(r.id) ?? false}
                          disabled={!admin || rolle.id === FESTE_ROLLE}
                          onChange={(an) => umschalten(rolle.id, r.id, an)}
                        />
                      ))}
                    </Zeile>
                  </Stapel>
                </li>
              ))}
            </Liste>
            <Meta>Änderungen gelten sofort. Der Chef hat immer alle Rechte. Ohne „Ansehen“ sind alle anderen Rechte aus.</Meta>
          </Stapel>
        </Karte>

        <Karte titel="Was sieht eine Rolle?" icon="person" oberzeile="Vorschau">
          <Stapel abstand={24}>
            <Segmente label="Rolle" wert={vorschau} onChange={setVorschau} optionen={ROLLEN.map((r) => ({ wert: r.id, label: r.label, icon: ROLLEN_ICON[r.id] }))} />
            <Stapel abstand={8}>
              {RECHTE.map((r) => {
                const hat = rechteVorschau.includes(r.id);
                return (
                  <Zeile key={r.id} abstand={8} umbruch={false}>
                    <Icon name={hat ? 'check' : 'x'} size={18} aria-hidden />
                    <span>
                      {hat ? RECHT_TEXT[r.id].kann : RECHT_TEXT[r.id].kannNicht}
                    </span>
                  </Zeile>
                );
              })}
            </Stapel>
            <Stapel abstand={8}>
              <strong>Bereiche in der Navigation</strong>
              <Liste>
                {BEREICHE.map((b) => {
                  const ms = sichtbareModule.filter((x) => x.bereich === b.titel);
                  return (
                    <ListenZeile
                      key={b.id}
                      titel={b.titel}
                      untertitel={
                        ms.length
                          ? b.id === 'betrieb'
                            ? BETRIEB_GRUPPEN.map((g) => ms.filter((x) => x.m.gruppe === g.id).map((x) => x.m.titel).join(', ')).filter(Boolean).join(' · ')
                            : ms.map((x) => x.m.titel).join(', ')
                          : 'Keine Module'
                      }
                    />
                  );
                })}
              </Liste>
              <Meta>Inhalte wie Preise oder Personaldaten blenden die Module je nach Recht zusätzlich aus.</Meta>
            </Stapel>
            {vorschau !== ich?.rolle && (
              person ? (
                <div>
                  <Button
                    variante="sekundaer"
                    icon="person"
                    onClick={() => {
                      setzeIch(person.id);
                      toast(`Du siehst Macher jetzt als ${personName(person)}. Zurück wechselst du unten links in der Navigation.`);
                      navigate('/heute');
                    }}
                  >
                    {`Als ${personName(person)} ansehen`}
                  </Button>
                </div>
              ) : (
                <Status>Im Team gibt es noch niemanden mit dieser Rolle.</Status>
              )
            )}
          </Stapel>
        </Karte>
      </Stapel>
    </Seite>
  );
}
