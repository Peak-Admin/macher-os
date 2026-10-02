/** Gesprächsverlauf mit Eingabe – intern und an den Kunden klar getrennt. */
import { useEffect, useState } from 'react';
import { batch, db } from '@core/db';
import { pfadZu } from '@core/modul';
import { personName, relativ, uhrzeit } from '@core/format';
import type { ID, Nachricht } from '@core/objects';
import { useDarf, useIch } from '@core/session';
import { Auswahl, BeispielMarke, Button, Leer, Meldung, Meta, Segmente, Stapel, Status, Textfeld, Zeile, useToast } from '@ui/index';
import { KANAL_LABEL, SCHNELLANTWORTEN_INTERN, SCHNELLANTWORTEN_KUNDE, istUngelesen, verfuegbareKanaele, versandLink, type KundenKanal } from './daten';

export interface VerlaufFilter {
  auftragId?: ID;
  kundeId?: ID;
  /** nur interne Nachrichten ohne Auftrag/Kunde */
  intern?: boolean;
}

export function passtZuVerlauf(n: Nachricht, f: VerlaufFilter): boolean {
  if (f.auftragId) return n.auftragId === f.auftragId;
  if (f.kundeId) return n.kundeId === f.kundeId || db.auftraege.get(n.auftragId)?.kundeId === f.kundeId;
  if (f.intern) return !n.auftragId && !n.kundeId;
  return false;
}

function Blase({ n, ichId, zeigeAuftrag }: { n: Nachricht; ichId?: ID; zeigeAuftrag: boolean }) {
  const eigen = n.richtung === 'aus' || (n.richtung === 'intern' && n.vonMitarbeiterId === ichId);
  const intern = n.kanal === 'intern';
  const von =
    n.richtung === 'ein'
      ? db.kunden.get(n.kundeId ?? db.auftraege.get(n.auftragId)?.kundeId)?.name ?? 'Kunde'
      : personName(db.mitarbeiter.get(n.vonMitarbeiterId ?? n.erstelltVon));
  const auftrag = db.auftraege.get(n.auftragId);
  return (
    <li style={{ display: 'flex', justifyContent: eigen ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: 'min(560px, 92%)',
          padding: '8px 12px',
          borderRadius: 'var(--mm-radius-card)',
          border: `1px solid ${intern ? 'var(--mm-border)' : 'var(--mm-brand)'}`,
          background: intern ? 'var(--mm-canvas)' : 'var(--mm-surface)',
        }}
      >
        <Zeile abstand={8}>
          <Status ton={intern ? 'neutral' : 'aktiv'} icon={false}>
            {intern ? 'Intern' : `${n.richtung === 'ein' ? 'Vom Kunden' : 'An Kunden'} · ${KANAL_LABEL[n.kanal]}`}
          </Status>
          {istUngelesen(n, ichId) && <Status ton="achtung">Neu</Status>}
          <BeispielMarke zeigen={n.beispiel} />
        </Zeile>
        {n.betreff && <strong style={{ display: 'block', marginTop: 4 }}>{n.betreff}</strong>}
        <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{n.text}</p>
        <Meta>
          {von} · {relativ(n.erstelltAm)}, {uhrzeit(n.erstelltAm)}
          {auftrag && zeigeAuftrag ? ` · ${auftrag.nummer}` : ''}
        </Meta>
      </div>
    </li>
  );
}

type Modus = 'kunde' | 'intern' | 'eingang';

export function Verlauf({ filter, kundeId: kundeIdProp }: { filter: VerlaufFilter; kundeId?: ID }) {
  const ich = useIch();
  const toast = useToast();
  const darfSenden = useDarf('veroeffentlichen');
  const liste = db.nachrichten.use((n) => passtZuVerlauf(n, filter), [filter.auftragId, filter.kundeId, filter.intern]);
  const sortiert = [...liste].sort((a, b) => a.erstelltAm.localeCompare(b.erstelltAm));
  const auftrag = db.auftraege.get(filter.auftragId);
  const kundeId = kundeIdProp ?? filter.kundeId ?? auftrag?.kundeId;
  const kunde = db.kunden.get(kundeId);
  const kanaele = verfuegbareKanaele(kunde);
  const [modus, setModus] = useState<Modus>(kunde ? 'kunde' : 'intern');
  const [kanal, setKanal] = useState<KundenKanal>(kanaele[0] ?? 'email');
  const [text, setText] = useState('');
  const [fehler, setFehler] = useState<string>();

  // Beim Öffnen gelten neue Nachrichten als gelesen
  const ungelesenIds = sortiert.filter((n) => istUngelesen(n, ich?.id)).map((n) => n.id);
  useEffect(() => {
    if (!ungelesenIds.length) return;
    const t = setTimeout(() => batch(() => ungelesenIds.forEach((id) => db.nachrichten.update(id, { gelesen: true }, { leise: true }))), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ungelesenIds.join()]);

  const basis = { auftragId: filter.auftragId, kundeId: kundeId, vonMitarbeiterId: ich?.id };

  const senden = () => {
    if (!text.trim()) return setFehler('Schreib zuerst eine Nachricht.');
    if (modus === 'intern') {
      db.nachrichten.create({ ...basis, kundeId: filter.auftragId ? kundeId : filter.kundeId, kanal: 'intern', richtung: 'intern', text: text.trim(), gelesen: false });
      toast('Interne Nachricht gespeichert.');
    } else if (modus === 'eingang') {
      db.nachrichten.create({ ...basis, vonMitarbeiterId: undefined, kanal, richtung: 'ein', text: text.trim(), gelesen: true });
      toast('Kundennachricht eingetragen.');
    } else {
      if (!kunde) return setFehler('Zu diesem Verlauf gibt es keinen Kunden.');
      const betreff = auftrag ? `${auftrag.titel} (${auftrag.nummer})` : undefined;
      const link = versandLink(kanal, kunde, text.trim(), betreff);
      if (!link) return setFehler('Für diesen Weg fehlt beim Kunden die E-Mail-Adresse oder Telefonnummer.');
      db.nachrichten.create({ ...basis, kanal, richtung: 'aus', text: text.trim(), betreff, gelesen: true });
      if (kanal === 'whatsapp') window.open(link, '_blank', 'noopener');
      else window.location.href = link;
      toast(`Im Verlauf gespeichert. Schick die Nachricht jetzt in deiner ${KANAL_LABEL[kanal]}-App ab.`);
    }
    setText('');
    setFehler(undefined);
  };

  const antworten = modus === 'intern' ? SCHNELLANTWORTEN_INTERN : modus === 'kunde' ? SCHNELLANTWORTEN_KUNDE : [];
  const modi: { wert: Modus; label: string }[] = [
    ...(kunde && darfSenden ? [{ wert: 'kunde' as const, label: 'An Kunden' }] : []),
    { wert: 'intern', label: 'Intern' },
    ...(kunde ? [{ wert: 'eingang' as const, label: 'Kunde hat geschrieben' }] : []),
  ];

  return (
    <Stapel abstand={16}>
      {sortiert.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortiert.map((n) => (
            <Blase key={n.id} n={n} ichId={ich?.id} zeigeAuftrag={!filter.auftragId} />
          ))}
        </ul>
      ) : (
        <Leer titel="Noch keine Nachrichten" text={kunde ? 'Schreib dem Kunden oder dem Team. Alles bleibt hier am Auftrag gesammelt.' : 'Schreib dem Team. Alles bleibt hier gesammelt.'} icon="chat" />
      )}
      <form
        className="mm-stapel"
        style={{ gap: 12, borderTop: '1px solid var(--mm-border)', paddingTop: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
      >
        {modi.length > 1 && <Segmente label="Nachricht" wert={modi.some((m) => m.wert === modus) ? modus : 'intern'} onChange={setModus} optionen={modi} />}
        {modus !== 'intern' && kunde && (
          <>
            {modus === 'kunde' && !kanaele.length ? (
              <Meldung ton="achtung" titel="Keine Kontaktdaten">
                Für {kunde.name} ist keine E-Mail-Adresse und keine Telefonnummer hinterlegt.{' '}
                {pfadZu({ typ: 'kunden', id: kunde.id }) && <a href={pfadZu({ typ: 'kunden', id: kunde.id })}>Kunde öffnen</a>}
              </Meldung>
            ) : (
              <Segmente
                label={modus === 'kunde' ? 'Senden über' : 'Kam über'}
                wert={kanal}
                onChange={setKanal}
                optionen={(modus === 'kunde' ? kanaele : (['email', 'whatsapp', 'sms'] as KundenKanal[])).map((k) => ({ wert: k, label: KANAL_LABEL[k] }))}
              />
            )}
          </>
        )}
        {antworten.length > 0 && (
          <Auswahl label="Schnellantwort" optional value="" leer="Vorlage einfügen …" onChange={(e) => e.target.value && (setText(e.target.value), setFehler(undefined))} optionen={antworten.map((a) => ({ wert: a, label: a }))} />
        )}
        <Textfeld
          label={modus === 'intern' ? 'Nachricht ans Team' : modus === 'kunde' ? `Nachricht an ${kunde?.name ?? 'Kunden'}` : 'Was hat der Kunde geschrieben?'}
          value={text}
          fehler={fehler}
          onChange={(e) => (setText(e.target.value), setFehler(undefined))}
          rows={3}
        />
        {modus === 'kunde' && (
          <Meta>Macher OS verschickt nichts selbst: Dein {KANAL_LABEL[kanal]}-Programm öffnet sich mit dem Text, du schickst ab. Hier im Verlauf bleibt die Nachricht gespeichert.</Meta>
        )}
        <div>
          <Button type="submit" icon={modus === 'kunde' ? 'mail' : 'chat'} disabled={modus === 'kunde' && !kanaele.length}>
            {modus === 'intern' ? 'Ans Team schicken' : modus === 'eingang' ? 'Eintragen' : kanal === 'email' ? 'In E-Mail-Programm öffnen' : kanal === 'sms' ? 'In SMS-App öffnen' : 'In WhatsApp öffnen'}
          </Button>
        </div>
      </form>
    </Stapel>
  );
}
