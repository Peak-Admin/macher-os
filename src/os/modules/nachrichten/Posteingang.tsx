import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { pfadZu } from '@core/modul';
import { relativ, uhrzeit } from '@core/format';
import type { ID } from '@core/objects';
import { useIch } from '@core/session';
import { Button, Filter, Karte, Leer, Liste, ListenZeile, Seite, Stapel, Status, TypIcon } from '@ui/index';
import { AuftragKurz } from '@ui/objekt';
import { KANAL_ICON, KANAL_LABEL, KANAL_TON, istKundenNachricht, threads, type Thread } from './daten';
import { Verlauf } from './Verlauf';

export function threadTitel(t: Thread): { titel: string; untertitel?: string } {
  if (t.typ === 'auftrag') {
    const a = db.auftraege.get(t.id);
    return { titel: a?.titel ?? 'Auftrag', untertitel: [a?.nummer, db.kunden.get(a?.kundeId)?.name].filter(Boolean).join(' · ') };
  }
  if (t.typ === 'kunde') return { titel: db.kunden.get(t.id)?.name ?? 'Kunde', untertitel: 'Ohne Auftrag' };
  return { titel: 'Team intern', untertitel: 'Ohne Auftrag' };
}

export function ThreadZeile({ t }: { t: Thread }) {
  const { titel, untertitel } = threadTitel(t);
  const l = t.letzte;
  const vorschau = `${l.kanal === 'intern' ? 'Intern' : KANAL_LABEL[l.kanal]}: ${l.text.length > 70 ? l.text.slice(0, 69) + '…' : l.text}`;
  return (
    <ListenZeile
      to={t.pfad}
      links={<TypIcon name={KANAL_ICON[l.kanal]} label={KANAL_LABEL[l.kanal]} ton={KANAL_TON[l.kanal]} />}
      titel={titel}
      untertitel={
        <>
          {vorschau}
          <br />
          {[untertitel, `${relativ(l.erstelltAm)}, ${uhrzeit(l.erstelltAm)}`].filter(Boolean).join(' · ')}
        </>
      }
      rechts={t.ungelesenKunde ? <Status ton="achtung">{t.ungelesenKunde === 1 ? 'Kunde wartet' : `${t.ungelesenKunde} vom Kunden`}</Status> : t.ungelesen ? <Status ton="aktiv">{t.ungelesen} neu</Status> : null}
    />
  );
}

type F = 'ungelesen' | 'alle' | 'kunden' | 'intern';

export function Posteingang() {
  const ich = useIch();
  const alle = db.nachrichten.use();
  const liste = threads(alle, ich?.id);
  const ungelesen = liste.filter((t) => t.ungelesen > 0);
  const [filter, setFilter] = useState<F>(ungelesen.length ? 'ungelesen' : 'alle');
  const gefiltert = liste.filter((t) =>
    filter === 'ungelesen' ? t.ungelesen > 0 : filter === 'kunden' ? t.nachrichten.some(istKundenNachricht) : filter === 'intern' ? t.nachrichten.some((n) => n.kanal === 'intern') : true,
  );
  return (
    <Seite titel="Nachrichten" untertitel="Alles, was mit Kunden und im Team besprochen wird – je Auftrag gebündelt." aktion={<Button icon="chat" variante="sekundaer" to="/auftraege/nachrichten/intern">Ans Team schreiben</Button>}>
      <Stapel abstand={16}>
        <Filter
          label="Anzeigen"
          wert={filter}
          onChange={setFilter}
          optionen={[
            { wert: 'ungelesen', label: 'Ungelesen', zaehler: ungelesen.length },
            { wert: 'alle', label: 'Alle', zaehler: liste.length },
            { wert: 'kunden', label: 'Mit Kunden' },
            { wert: 'intern', label: 'Intern' },
          ]}
        />
        <Liste
          leer={
            liste.length ? (
              <Leer titel="Alles gelesen" text="Keine neuen Nachrichten. Gut so." icon="check" />
            ) : (
              <Leer skizze titel="Noch keine Nachrichten" text="Nachrichten entstehen am Auftrag: im Tab „Nachrichten“ schreibst du Kunden oder dem Team." icon="chat" />
            )
          }
        >
          {gefiltert.map((t) => (
            <ThreadZeile key={t.schluessel} t={t} />
          ))}
        </Liste>
      </Stapel>
    </Seite>
  );
}

function VerlaufSeite({ titel, untertitel, link, children }: { titel: string; untertitel?: React.ReactNode; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <Seite titel={titel} untertitel={untertitel} zurueck={{ to: '/auftraege/nachrichten', label: 'Nachrichten' }} aktion={link ? <Button variante="sekundaer" to={link.to}>{link.label}</Button> : undefined}>
      <Karte>{children}</Karte>
    </Seite>
  );
}

export function AuftragVerlauf() {
  const { id = '' } = useParams();
  const a = db.auftraege.useOne(id);
  if (!a) return <NichtDa />;
  const p = pfadZu({ typ: 'auftraege', id });
  return (
    <VerlaufSeite titel={a.titel} untertitel={<AuftragKurz id={id} />} link={p ? { to: p, label: 'Auftrag öffnen' } : undefined}>
      <Verlauf filter={{ auftragId: id }} />
    </VerlaufSeite>
  );
}

export function KundeVerlauf() {
  const { id = '' } = useParams();
  const k = db.kunden.useOne(id);
  if (!k) return <NichtDa />;
  const p = pfadZu({ typ: 'kunden', id });
  return (
    <VerlaufSeite titel={k.name} untertitel="Alle Nachrichten mit diesem Kunden" link={p ? { to: p, label: 'Kunde öffnen' } : undefined}>
      <Verlauf filter={{ kundeId: id }} />
    </VerlaufSeite>
  );
}

export function InternVerlauf() {
  return (
    <VerlaufSeite titel="Team intern" untertitel="Nachrichten ans Team ohne Auftrag">
      <Verlauf filter={{ intern: true }} />
    </VerlaufSeite>
  );
}

/** `/auftraege/nachrichten/:id` – öffnet den Verlauf, zu dem die Nachricht gehört */
export function NachrichtWeiter() {
  const { id = '' } = useParams();
  const n = db.nachrichten.useOne(id);
  if (!n) return <NichtDa />;
  return <Navigate to={n.auftragId ? `/auftraege/nachrichten/auftrag/${n.auftragId}` : n.kundeId ? `/auftraege/nachrichten/kunde/${n.kundeId}` : '/auftraege/nachrichten/intern'} replace />;
}

function NichtDa() {
  return (
    <Seite titel="Nicht gefunden" zurueck={{ to: '/auftraege/nachrichten', label: 'Nachrichten' }}>
      <Leer titel="Diesen Verlauf gibt es nicht (mehr)." icon="chat" />
    </Seite>
  );
}

/** Tab „Nachrichten“ am Auftrag */
export function AuftragNachrichtenTab({ id }: { id: ID }) {
  return <Verlauf filter={{ auftragId: id }} />;
}

/** Tab „Nachrichten“ am Kunden */
export function KundeNachrichtenTab({ id }: { id: ID }) {
  return <Verlauf filter={{ kundeId: id }} />;
}

/** Widget auf der Seite „Aufträge“: nur wenn Kunden auf Antwort warten */
export function NachrichtenWidget() {
  const ich = useIch();
  const alle = db.nachrichten.use();
  const offen = threads(alle, ich?.id).filter((t) => t.ungelesen > 0);
  if (!offen.length) return null;
  return (
    <Karte titel="Neue Nachrichten" icon="chat" aktion={<Button variante="tertiaer" klein to="/auftraege/nachrichten">Alle ansehen</Button>}>
      <Liste>
        {offen.slice(0, 3).map((t) => (
          <ThreadZeile key={t.schluessel} t={t} />
        ))}
      </Liste>
    </Karte>
  );
}
