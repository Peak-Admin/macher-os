import { useMemo } from 'react';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, Liste, ListenZeile, Meldung, Status } from '@ui/index';
import { GRUND_TEXT, findeKunden } from './daten';

/** Bestehende Kunden zu Name/Telefon/E-Mail finden (React) */
export function useKundenKandidaten(e: { name?: string; telefon?: string; email?: string }) {
  const kunden = db.kunden.use();
  return useMemo(() => findeKunden(e, kunden), [kunden, e.name, e.telefon, e.email]);
}

/**
 * Zeigt mögliche Dubletten und lässt den passenden Kunden übernehmen.
 * Ist ein Kunde gewählt, zeigt es ihn mit „Anderer Kunde“.
 */
export function KundenVorschlaege({
  e,
  gewaehlt,
  onWahl,
}: {
  e: { name?: string; telefon?: string; email?: string };
  gewaehlt?: ID;
  onWahl: (id: ID | undefined) => void;
}) {
  const kandidaten = useKundenKandidaten(e);
  const kunde = db.kunden.useOne(gewaehlt);

  if (kunde) {
    return (
      <Meldung
        ton="erfolg"
        titel={`Bestehender Kunde: ${kunde.name}`}
        aktion={
          <Button variante="tertiaer" klein onClick={() => onWahl(undefined)}>
            Anderer Kunde
          </Button>
        }
      >
        {[kunde.telefon, kunde.email, kunde.adresse ? `${kunde.adresse.plz} ${kunde.adresse.ort}` : ''].filter(Boolean).join(' · ') || 'Keine Kontaktdaten hinterlegt.'}
      </Meldung>
    );
  }
  if (!kandidaten.length) return null;
  const sicher = kandidaten[0].sicherheit >= 100;
  return (
    <div className="mm-stapel" style={{ gap: 8 }}>
      <p className="mm-meta">
        <strong>{sicher ? 'Diesen Kunden gibt es schon:' : 'Meinst du einen dieser Kunden?'}</strong> Übernimm ihn, damit nichts doppelt angelegt wird.
      </p>
      <Liste>
        {kandidaten.map((c) => (
          <ListenZeile
            key={c.kunde.id}
            onClick={() => onWahl(c.kunde.id)}
            titel={c.kunde.name}
            untertitel={[c.kunde.telefon, c.kunde.email, c.kunde.adresse?.ort].filter(Boolean).join(' · ')}
            rechts={<Status ton={c.sicherheit >= 100 ? 'aktiv' : 'neutral'}>{GRUND_TEXT[c.grund]}</Status>}
          />
        ))}
      </Liste>
    </div>
  );
}
