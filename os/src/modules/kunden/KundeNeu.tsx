import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@core/db';
import type { ID } from '@core/objects';
import { Button, Karte, Liste, ListenZeile, Meldung, Seite, Stapel, useToast } from '@ui/index';
import { KundeAuswahl } from '@ui/objekt';
import { empfehlungErfassen } from '@modules/bewertungen/daten';
import { aehnlicheKunden, naechsteKundennummer } from './daten';
import { KundeFelder, kundenDatenAus, leererEntwurf, pruefeEntwurf, type KundeEntwurf } from './KundeFelder';

export function KundeNeu() {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState<KundeEntwurf>(leererEntwurf);
  const [fehler, setFehler] = useState<ReturnType<typeof pruefeEntwurf>>({});
  const [empfohlenVon, setEmpfohlenVon] = useState<ID>('');
  const kunden = db.kunden.use();

  const aehnlich = useMemo(() => {
    const d = kundenDatenAus(f);
    if (!d.name && !d.telefon && !d.email) return [];
    return aehnlicheKunden({ name: d.name ?? '', telefon: d.telefon, email: d.email, adresse: d.adresse, ansprechpartner: [] }, kunden);
  }, [f, kunden]);

  const speichern = () => {
    const e = pruefeEntwurf(f);
    setFehler(e);
    if (Object.keys(e).length) return;
    const k = db.kunden.create({
      ...kundenDatenAus(f),
      nummer: naechsteKundennummer(),
      ansprechpartner: [],
    } as Parameters<typeof db.kunden.create>[0]);
    if (f.quelle === 'empfehlung' && empfohlenVon) empfehlungErfassen(k.id, empfohlenVon);
    toast(`${k.name} ist angelegt.`);
    navigate(`/auftraege/kunden/${k.id}`, { replace: true });
  };

  return (
    <Seite titel="Kunde anlegen" zurueck={{ to: '/auftraege/kunden', label: 'Kunden' }}>
      <Karte>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            speichern();
          }}
          className="mm-stapel"
          style={{ gap: 24 }}
          noValidate
        >
          <KundeFelder wert={f} onChange={setF} fehler={fehler} />
          {f.quelle === 'empfehlung' && <KundeAuswahl label="Wer hat euch empfohlen?" optional wert={empfohlenVon} onChange={setEmpfohlenVon} />}
          {aehnlich.length > 0 && (
            <Meldung ton="achtung" titel="Gibt es diesen Kunden schon?">
              <Stapel abstand={8}>
                <span>Diese Kunden sehen ähnlich aus. Öffne den passenden, statt einen doppelten anzulegen.</span>
                <Liste>
                  {aehnlich.slice(0, 3).map((k) => (
                    <ListenZeile key={k.id} to={`/auftraege/kunden/${k.id}`} titel={k.name} untertitel={[k.adresse?.ort, k.telefon, k.email].filter(Boolean).join(' · ')} />
                  ))}
                </Liste>
              </Stapel>
            </Meldung>
          )}
          <div>
            <Button type="submit" icon="check">
              {aehnlich.length ? 'Trotzdem neu anlegen' : 'Kunde speichern'}
            </Button>
          </div>
        </form>
      </Karte>
    </Seite>
  );
}
