import { useMemo, useState } from 'react';
import { useDatenstand } from '@core/db';
import { adresseText } from '@core/format';
import type { Kunde } from '@core/objects';
import { useDarf } from '@core/session';
import { Button, Karte, Leer, Meta, Raster, Segmente, Seite, Stapel, Status, Zeile, useBestaetigen, useToast } from '@ui/index';
import { aktuelleDubletten, keineDublette, kundenZusammenfuehren, verweiseAufKunde, type Dublette } from './daten';

export function Dubletten() {
  const v = useDatenstand();
  const liste = useMemo(() => aktuelleDubletten(), [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Seite titel="Doppelte Kunden" untertitel="Macher prüft Name, Telefon, E-Mail und Adresse. Du entscheidest, welcher Kunde bleibt." zurueck={{ to: '/auftraege/kunden', label: 'Kunden' }}>
      {liste.length ? (
        <Stapel abstand={16}>
          {liste.map((d) => (
            <DublettenKarte key={`${d.a.id}|${d.b.id}`} d={d} />
          ))}
        </Stapel>
      ) : (
        <Leer titel="Keine doppelten Kunden" text="Alles sauber. Macher prüft weiter, sobald neue Kunden dazukommen." icon="check" aktion={<Button variante="sekundaer" to="/auftraege/kunden">Zu den Kunden</Button>} />
      )}
    </Seite>
  );
}

function kurz(k: Kunde) {
  const v = verweiseAufKunde(k.id);
  return [`${v.auftraege} Aufträge`, `${v.orte} Orte`, `${v.rechnungen} Rechnungen`].join(' · ');
}

function DublettenKarte({ d }: { d: Dublette }) {
  const toast = useToast();
  const darf = useDarf('schreiben');
  const [fragen, dialog] = useBestaetigen();
  // Standard: der ältere Kunde mit mehr Verweisen bleibt
  const standard = verweiseAufKunde(d.a.id).auftraege >= verweiseAufKunde(d.b.id).auftraege ? d.a.id : d.b.id;
  const [bleibt, setBleibt] = useState(standard);
  const ziel = bleibt === d.a.id ? d.a : d.b;
  const quelle = bleibt === d.a.id ? d.b : d.a;

  const zusammenfuehren = async () => {
    const ok = await fragen(
      'Kunden zusammenführen?',
      `${ziel.name} bleibt. Alle Aufträge, Orte, Anlagen, Rechnungen und Nachrichten von „${quelle.name}“ werden dorthin umgehängt. Fehlende Kontaktdaten werden ergänzt. „${quelle.name}“ kommt in den Papierkorb.`,
      'Zusammenführen',
    );
    if (!ok) return;
    try {
      const n = kundenZusammenfuehren(ziel.id, quelle.id);
      toast(n ? `Zusammengeführt. ${n} Verweise zeigen jetzt auf ${ziel.name}.` : `Zusammengeführt. ${ziel.name} bleibt.`);
    } catch (e) {
      toast((e as Error).message, { ton: 'achtung' });
    }
  };

  return (
    <Karte titel={`${d.a.name} und ${d.b.name}`} oberzeile="Vermutlich doppelt">
      <Stapel abstand={16}>
        <Zeile abstand={8}>
          {d.gruende.map((g) => (
            <Status key={g} ton="achtung">
              {g}
            </Status>
          ))}
        </Zeile>
        <Raster min={220}>
          {[d.a, d.b].map((k) => (
            <Karte key={k.id} kompakt to={`/auftraege/kunden/${k.id}`} titel={k.name} oberzeile={k.nummer}>
              <Meta>{[k.telefon, k.email, adresseText(k.adresse)].filter(Boolean).join(' · ') || 'Keine Kontaktdaten'}</Meta>
              <Meta>{kurz(k)}</Meta>
            </Karte>
          ))}
        </Raster>
        <Segmente
          label="Welcher Kunde bleibt?"
          wert={bleibt}
          onChange={setBleibt}
          optionen={[
            { wert: d.a.id, label: d.a.name },
            { wert: d.b.id, label: d.b.name },
          ]}
        />
        <Zeile>
          <Button icon="check" onClick={zusammenfuehren} disabled={!darf}>
            Zusammenführen
          </Button>
          <Button
            variante="tertiaer"
            onClick={() => {
              keineDublette(d.a.id, d.b.id);
              toast('Verstanden. Macher fragt bei diesen beiden nicht mehr.');
            }}
          >
            Sind verschiedene Kunden
          </Button>
        </Zeile>
      </Stapel>
      {dialog}
    </Karte>
  );
}
