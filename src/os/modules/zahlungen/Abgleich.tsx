import { useEffect, useState } from 'react';
import { db, useDatenstand } from '@core/db';
import { automationAn } from '@core/macher';
import { datum, euro } from '@core/format';
import type { ID } from '@core/objects';
import { useDarf } from '@core/session';
import { Abschnitt, Auswahl, BeispielMarke, Button, Checkbox, Dialog, Leer, Liste, ListenZeile, Meldung, Meta, Seite, Stapel, Status, Zeile, useToast } from '@ui/index';
import { offenePosten, offenerBetrag } from '../rechnungen/logik';
import { rechnungX } from '../rechnungen/typen';
import { KeinZugriff } from '../rechnungen/RechnungenListe';
import { abgleichen, AUTOMATION_ABGLEICH, ergebnisText, ignorieren, wiederOeffnen, zuordnen, zuordnungAufheben, zuordnungVorschau } from './abgleich';
import { bankumsaetze, brauchtDich, type Bankumsatz } from './daten';

const rechnungLabel = (id: ID | undefined) => {
  const r = rechnungX(id);
  return r ? `${r.nummer} · ${db.kunden.get(r.kundeId)?.name ?? ''} · offen ${euro(offenerBetrag(r))}` : '';
};

/** Zahlungen zuordnen, die Lotte nicht eindeutig zuordnen konnte */
export function Abgleich() {
  useDatenstand();
  const darf = useDarf('geld');
  const toast = useToast();
  const [dialog, setDialog] = useState<Bankumsatz>();

  // Ist der automatische Abgleich aus, werden neue Umsätze hier als Vorschlag aufbereitet
  useEffect(() => {
    if (darf && bankumsaetze.where((u) => u.status === 'neu').length) abgleichen({ automatisch: automationAn(AUTOMATION_ABGLEICH) });
  }, [darf]);

  if (!darf) return <KeinZugriff />;

  const offen = bankumsaetze.where(brauchtDich).sort((a, b) => b.datum.localeCompare(a.datum));
  const automatisch = bankumsaetze.where((u) => u.status === 'zugeordnet' && !!u.automatisch).sort((a, b) => (b.bearbeitetAm ?? '').localeCompare(a.bearbeitetAm ?? ''));
  const ignoriert = bankumsaetze.where((u) => u.status === 'ignoriert').sort((a, b) => b.datum.localeCompare(a.datum));

  const schnellZuordnen = (u: Bankumsatz, rechnungId: ID) => {
    const v = zuordnungVorschau(u.id, rechnungId);
    if (!v) return;
    // Skonto nur von Hand bestätigen – bei Differenz den Dialog zeigen
    if (v.art === 'skonto' || v.art === 'mehr') return setDialog(u);
    if (zuordnen(u.id, rechnungId)) {
      toast(`Zugeordnet: ${v.rechnung.nummer} ist ${ergebnisText({ ...v, betrag: v.art }, false)}.`, { ton: 'erfolg', aktion: { label: 'Rückgängig', onClick: () => zuordnungAufheben(u.id) } });
    }
  };

  return (
    <Seite titel="Zahlungen zuordnen" untertitel="Eingänge, die Lotte nicht sicher einer Rechnung zuordnen konnte." zurueck={{ to: '/betrieb/zahlungen', label: 'Zahlungen' }}>
      <Stapel abstand={24}>
        {offen.length ? (
          <Liste>
            {offen.map((u) => {
              const vorschlag = u.vorschlagIds?.find((id) => (rechnungX(id) ? offenerBetrag(rechnungX(id)!) > 0 : false));
              return (
                <ListenZeile
                  key={u.id}
                  titel={
                    <>
                      {euro(u.betrag)} · {u.name || 'ohne Namen'} <BeispielMarke zeigen={u.beispiel} />
                    </>
                  }
                  untertitel={
                    <>
                      {datum(u.datum)} · „{u.zweck || 'ohne Verwendungszweck'}“
                      <br />
                      {vorschlag ? `Passt wahrscheinlich zu ${rechnungLabel(vorschlag)}` : 'Keine passende Rechnung gefunden'}
                      {u.grund && vorschlag ? ` – ${u.grund}` : ''}
                    </>
                  }
                  rechts={
                    <Zeile abstand={8}>
                      {vorschlag ? (
                        <Button klein variante="sekundaer" onClick={() => schnellZuordnen(u, vorschlag)}>
                          Zuordnen
                        </Button>
                      ) : null}
                      <Button klein variante={vorschlag ? 'tertiaer' : 'sekundaer'} onClick={() => setDialog(u)}>
                        {vorschlag ? 'Andere Rechnung' : 'Rechnung wählen'}
                      </Button>
                    </Zeile>
                  }
                />
              );
            })}
          </Liste>
        ) : (
          <Leer
            titel="Alles zugeordnet"
            text="Jeder Zahlungseingang gehört zu einer Rechnung. Neue Umsätze holst du über den Kontoauszug."
            icon="check"
            aktion={<Button variante="sekundaer" to="/betrieb/zahlungen/import">Kontoauszug importieren</Button>}
          />
        )}

        {automatisch.length > 0 && (
          <Abschnitt titel="Von Lotte zugeordnet" hinweis="Falsch zugeordnet? Mit „Lösen“ ist die Rechnung wieder offen und die Zahlung wartet hier.">
            <Liste>
              {automatisch.slice(0, 3).map((u) => {
                const z = db.zahlungen.get(u.zahlungIds?.[0]);
                return (
                  <ListenZeile
                    key={u.id}
                    titel={`${euro(u.betrag)} · ${u.name || 'ohne Namen'}`}
                    untertitel={`${datum(u.datum)} → ${rechnungLabel(z?.rechnungId).split(' · offen')[0]} · ${u.grund ?? ''}`}
                    rechts={
                      <Button klein variante="tertiaer" onClick={() => (zuordnungAufheben(u.id), toast('Zuordnung gelöst. Die Zahlung wartet jetzt oben.'))}>
                        Lösen
                      </Button>
                    }
                  />
                );
              })}
            </Liste>
            {automatisch.length > 3 && <Meta>Alle automatischen Zuordnungen stehen unter „Erledigt“ – dort lassen sie sich auch rückgängig machen.</Meta>}
          </Abschnitt>
        )}

        {ignoriert.length > 0 && (
          <Abschnitt titel="Ohne Rechnung">
            <Liste>
              {ignoriert.slice(0, 3).map((u) => (
                <ListenZeile
                  key={u.id}
                  titel={`${euro(u.betrag)} · ${u.name || 'ohne Namen'}`}
                  untertitel={`${datum(u.datum)} · „${u.zweck || '–'}“`}
                  rechts={
                    <Button klein variante="tertiaer" onClick={() => wiederOeffnen(u.id)}>
                      Doch zuordnen
                    </Button>
                  }
                />
              ))}
            </Liste>
          </Abschnitt>
        )}
      </Stapel>
      <ZuordnenDialog key={dialog?.id ?? 'zu'} umsatz={dialog} onSchliessen={() => setDialog(undefined)} />
    </Seite>
  );
}

/** Rechnung wählen, Ergebnis sehen (bezahlt / teilweise / Skonto / zu viel), bestätigen */
function ZuordnenDialog({ umsatz, onSchliessen }: { umsatz: Bankumsatz | undefined; onSchliessen: () => void }) {
  const toast = useToast();
  const posten = offenePosten();
  const start = umsatz?.vorschlagIds?.find((id) => posten.some((r) => r.id === id)) ?? '';
  // Zustand startet je Umsatz neu (der Dialog bekommt `key={umsatz.id}`)
  const [rechnungId, setRechnungId] = useState<string>(start);
  const [skonto, setSkonto] = useState(true);
  const [fehler, setFehler] = useState<string>();
  if (!umsatz) return null;
  const v = rechnungId ? zuordnungVorschau(umsatz.id, rechnungId) : undefined;
  // Vorschläge zuerst, dann nach Fälligkeit
  const sortiert = [...posten].sort((a, b) => Number(!!umsatz.vorschlagIds?.includes(b.id)) - Number(!!umsatz.vorschlagIds?.includes(a.id)));

  const ok = () => {
    if (!rechnungId) return setFehler('Wähl die Rechnung, zu der die Zahlung gehört.');
    if (!zuordnen(umsatz.id, rechnungId, { skonto: v?.art === 'skonto' && skonto })) return setFehler('Die Zahlung konnte nicht zugeordnet werden. Ist die Rechnung noch offen?');
    const r = rechnungX(rechnungId);
    toast(`Zugeordnet zu ${r?.nummer}.`, { ton: 'erfolg', aktion: { label: 'Rückgängig', onClick: () => zuordnungAufheben(umsatz.id) } });
    onSchliessen();
  };

  const keineRechnung = () => {
    ignorieren(umsatz.id);
    toast('Als „ohne Rechnung“ abgelegt.');
    onSchliessen();
  };

  return (
    <Dialog
      offen={!!umsatz}
      onSchliessen={onSchliessen}
      titel={`Zahlung ${euro(umsatz.betrag)} zuordnen`}
      icon="link"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={keineRechnung}>
            Gehört zu keiner Rechnung
          </Button>
          <Button onClick={ok} disabled={!posten.length}>
            Zuordnen
          </Button>
        </>
      }
    >
      <Stapel>
        <Meta>
          {datum(umsatz.datum)} · {umsatz.name || 'ohne Namen'}
          {umsatz.iban ? ` · ${umsatz.iban}` : ''} · „{umsatz.zweck || 'ohne Verwendungszweck'}“
        </Meta>
        {posten.length ? (
          <Auswahl
            label="Rechnung"
            value={rechnungId}
            leer="Bitte wählen"
            onChange={(e) => (setRechnungId(e.target.value), setFehler(undefined))}
            optionen={sortiert.map((r) => ({ wert: r.id, label: rechnungLabel(r.id) }))}
            fehler={fehler}
          />
        ) : (
          <Meldung>Es gibt keine offene Rechnung. Leg die Zahlung als „ohne Rechnung“ ab.</Meldung>
        )}
        {v && v.art === 'gleich' && <Status ton="erfolg">Die Rechnung ist danach bezahlt.</Status>}
        {v && v.art === 'teil' && <Status ton="aktiv">Teilzahlung – danach sind noch {euro(v.differenz)} offen.</Status>}
        {v && v.art === 'skonto' && (
          <Stapel abstand={8}>
            <Checkbox label={`Differenz von ${euro(v.differenz)} als Skonto ausbuchen`} checked={skonto} onChange={setSkonto} />
            <Meta>{skonto ? 'Die Rechnung gilt dann als bezahlt.' : `Ohne Haken bleibt die Rechnung teilbezahlt, ${euro(v.differenz)} bleiben offen.`}</Meta>
          </Stapel>
        )}
        {v && v.art === 'mehr' && (
          <Meldung ton="achtung">Der Kunde hat {euro(-v.differenz)} mehr überwiesen als offen. Die Rechnung gilt als bezahlt – prüf, ob du etwas zurückzahlen musst.</Meldung>
        )}
      </Stapel>
    </Dialog>
  );
}
