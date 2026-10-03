import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@core/db';
import { heute, passt } from '@core/format';
import { useIch } from '@core/session';
import { Abschnitt, Button, Dialog, Filter, Leer, Liste, Seite, Stapel, Suchfeld } from '@ui/index';
import { AufgabeFormular } from './AufgabeFormular';
import { AufgabeZeile } from './AufgabeZeile';
import { GRUPPEN_LABEL, gruppiere } from './logik';

type Sicht = 'meine' | 'alle' | 'erledigt';

export function AufgabenSeite() {
  const ich = useIch();
  const [params, setParams] = useSearchParams();
  const [sicht, setSicht] = useState<Sicht>('meine');
  const [q, setQ] = useState('');
  const neu = params.get('neu') === '1';
  const setNeu = (v: boolean) => setParams(v ? { neu: '1' } : {}, { replace: true });

  const alle = db.aufgaben.use();
  const offen = alle.filter((a) => !a.erledigt);
  const meine = offen.filter((a) => a.zustaendigId === ich?.id || (!a.zustaendigId && ich?.rolle === 'chef'));
  const basis = sicht === 'meine' ? meine : sicht === 'alle' ? offen : alle.filter((a) => a.erledigt && a.erledigtAm && a.erledigtAm >= new Date(Date.now() - 14 * 86_400_000).toISOString());
  const liste = basis.filter((a) => !q || passt(q, a.titel, a.notiz, db.auftraege.get(a.auftragId)?.titel, db.auftraege.get(a.auftragId)?.nummer));
  const gruppen = gruppiere(liste, heute());

  return (
    <Seite titel="Aufgaben" untertitel="Was zu tun ist – am Auftrag oder einfach so." aktion={<Button icon="plus" onClick={() => setNeu(true)}>Aufgabe anlegen</Button>}>
      <Stapel abstand={12}>
        <Filter<Sicht>
          label="Welche Aufgaben"
          wert={sicht}
          onChange={setSicht}
          optionen={[
            { wert: 'meine', label: 'Meine', zaehler: meine.length },
            { wert: 'alle', label: 'Alle offenen', zaehler: offen.length },
            { wert: 'erledigt', label: 'Zuletzt erledigt' },
          ]}
        />
        <Suchfeld wert={q} onChange={setQ} platzhalter="Aufgabe oder Auftrag suchen …" />
      </Stapel>
      {gruppen.length ? (
        gruppen.map((g) => (
          <Abschnitt key={g.gruppe} titel={`${GRUPPEN_LABEL[g.gruppe]} · ${g.aufgaben.length}`}>
            <Liste>
              {g.aufgaben.map((a) => (
                <AufgabeZeile key={a.id} a={a} />
              ))}
            </Liste>
          </Abschnitt>
        ))
      ) : q ? (
        <Leer titel="Keine Treffer" text="Zu dieser Suche gibt es keine Aufgaben." icon="suche" />
      ) : sicht === 'erledigt' ? (
        <Leer titel="In den letzten 14 Tagen nichts erledigt" text="Abgehakte Aufgaben erscheinen hier." icon="check" />
      ) : (
        <Leer
          titel={sicht === 'meine' ? 'Du hast nichts offen' : 'Keine offenen Aufgaben'}
          text="Gut gemacht. Neue Aufgaben legst du hier, am Auftrag oder über „Schnell erfassen“ an."
          icon="check"
          aktion={<Button variante="sekundaer" onClick={() => setNeu(true)}>Aufgabe anlegen</Button>}
        />
      )}
      <Dialog offen={neu} onSchliessen={() => setNeu(false)} titel="Aufgabe anlegen" icon="plus">
        <AufgabeFormular onFertig={() => setNeu(false)} />
      </Dialog>
    </Seite>
  );
}
