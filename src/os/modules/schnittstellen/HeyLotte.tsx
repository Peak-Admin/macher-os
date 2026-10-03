import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { supabaseCloud } from '@core/cloud-supabase';
import { db } from '@core/db';
import { datum, personName, uhrzeit } from '@core/format';
import { useDarf } from '@core/session';
import { Abschnitt, Auswahl, Button, Checkbox, Dialog, Eingabe, Karte, Laden, Leer, Liste, ListenZeile, Meldung, Meta, Raster, Seite, Stapel, Status, Zeile, useBestaetigen, useToast } from '@ui/index';
import { urlPruefen } from './webhooks';
import {
  EREIGNISSE,
  aktionLabel,
  aufrufStatus,
  ereignisText,
  fehlerText,
  nutzerIdPruefen,
  ok,
  schluesselAnzeige,
  verbindung,
  workspacePruefen,
  ZUSTAND_TEXT,
  zustellungLabel,
  zustellungStand,
  type PartnerStand,
  type PartnerZugang,
  type ServerAntwort,
  zustandMerken,
} from './heylotte';

const ZURUECK = { to: '/betrieb/schnittstellen', label: 'Schnittstellen' };
const TITEL = 'HeyLotte';
const UNTERTITEL = 'HeyLotte versteht, Handwerk OS entscheidet und führt aus.';
/** Konto-Seite („Daten sichern & Team einladen“), siehe `KONTO_PFAD` im Modul konto */
const KONTO_PFAD = '/macher/konto';

/** Einmal angezeigte Geheimnisse (Schlüssel, Webhook-Geheimnis) */
interface Einmalig {
  titel: string;
  eintraege: { label: string; wert: string; hilfe: string }[];
}

const zeit = (iso: string | null | undefined) => (iso ? `${datum(iso)}, ${uhrzeit(iso)} Uhr` : '–');

const kopieren = async (wert: string) => {
  try {
    await navigator.clipboard.writeText(wert);
    return true;
  } catch {
    return false;
  }
};

/** Stand der Verbindung von `/api/cloud/partner` holen (ohne Netz: Status 0) */
async function standHolen(): Promise<ServerAntwort<PartnerStand> | undefined> {
  try {
    return await supabaseCloud()?.serverAnfrage<PartnerStand>('partner', { aktion: 'stand' });
  } catch {
    return { status: 0 };
  }
}

/** HeyLotte verbinden: Zugang, Schlüssel, Webhook, Nutzer-Zuordnung, letzte Aufrufe – nur für den Chef. */
export function HeyLotte() {
  const admin = useDarf('admin');
  if (!admin)
    return (
      <Seite titel={TITEL} zurueck={ZURUECK}>
        <Leer titel="Nur mit dem Recht „Einstellungen“" text="HeyLotte verbindet, wer die Einstellungen verwalten darf – meist der Chef." icon="schloss" />
      </Seite>
    );
  if (!supabaseCloud())
    return (
      <Seite titel={TITEL} untertitel={UNTERTITEL} zurueck={ZURUECK}>
        <Leer
          skizze
          icon="stecker"
          titel="Erst Daten sichern"
          text="HeyLotte spricht mit deinem Betrieb in der Cloud. Leg dafür zuerst dein Konto an: „Daten sichern & Team einladen“. Danach kannst du HeyLotte hier verbinden."
          aktion={<Button to={KONTO_PFAD}>Daten sichern</Button>}
        />
      </Seite>
    );
  return <HeyLotteVerbindung />;
}

function HeyLotteVerbindung() {
  const toast = useToast();
  const [fragen, bestaetigen] = useBestaetigen();
  const [stand, setStand] = useState<PartnerStand>();
  const [ladeFehler, setLadeFehler] = useState<string>();
  const [laedt, setLaedt] = useState(true);
  const [beschaeftigt, setBeschaeftigt] = useState<string>();
  const [einmalig, setEinmalig] = useState<Einmalig>();
  const [dialog, setDialog] = useState<'verbinden' | 'workspace' | 'webhook'>();

  /** Eine Aktion an `/api/cloud/partner` – Fehler als Toast, Ergebnis bei Erfolg */
  const anfrage = useCallback(
    async <T,>(body: Record<string, unknown>): Promise<T | undefined> => {
      let a: ServerAntwort<T> | undefined;
      try {
        a = await supabaseCloud()?.serverAnfrage<T>('partner', body);
      } catch {
        a = { status: 0 };
      }
      if (a && ok(a.status)) return a.daten as T;
      toast(fehlerText(a), { ton: 'achtung' });
      return undefined;
    },
    [toast],
  );

  /** Antwort auf `stand` übernehmen */
  const uebernehmen = useCallback((a: ServerAntwort<PartnerStand> | undefined) => {
    if (a && ok(a.status) && a.daten && 'zugaenge' in a.daten) {
      setStand(a.daten);
      zustandMerken(a.daten.zugaenge);
      setLadeFehler(undefined);
    } else setLadeFehler(fehlerText(a));
    setLaedt(false);
  }, []);

  const laden = useCallback(() => standHolen().then(uebernehmen), [uebernehmen]);

  useEffect(() => {
    let aktiv = true;
    void standHolen().then((a) => aktiv && uebernehmen(a));
    return () => {
      aktiv = false;
    };
  }, [uebernehmen]);

  const neuLaden = () => {
    setLaedt(true);
    void laden();
  };

  /** Aktion mit Ladezustand am Knopf und anschließendem Neuladen */
  const ausfuehren = async <T,>(name: string, body: Record<string, unknown>, danach?: (d: T) => void) => {
    setBeschaeftigt(name);
    const d = await anfrage<T>(body);
    setBeschaeftigt(undefined);
    if (d === undefined) return false;
    danach?.(d);
    await laden();
    return true;
  };

  if (laedt && !stand)
    return (
      <Seite titel={TITEL} untertitel={UNTERTITEL} zurueck={ZURUECK}>
        <Laden text="Verbindung zu HeyLotte wird geladen …" />
      </Seite>
    );

  if (!stand)
    return (
      <Seite titel={TITEL} untertitel={UNTERTITEL} zurueck={ZURUECK}>
        <Meldung ton="achtung" titel="HeyLotte konnte nicht geladen werden" aktion={<Button klein variante="sekundaer" onClick={neuLaden}>Erneut versuchen</Button>}>
          {ladeFehler}
        </Meldung>
      </Seite>
    );

  const v = verbindung(stand.zugaenge);
  const z = v.zugang;

  const schluesselErneuern = async (zg: PartnerZugang) => {
    if (!(await fragen('Schlüssel erneuern?', 'Der alte Schlüssel funktioniert sofort nicht mehr. Trag den neuen Schlüssel danach gleich bei HeyLotte ein, sonst kann Lotte nichts mehr in Handwerk OS erledigen.', 'Schlüssel erneuern'))) return;
    await ausfuehren<{ schluessel: string }>('schluessel', { aktion: 'schluessel_erneuern', zugang_id: zg.id }, (d) =>
      setEinmalig({ titel: 'Neuer Schlüssel', eintraege: [{ label: 'API-Schlüssel', wert: d.schluessel, hilfe: 'Bei HeyLotte unter Handwerk OS eintragen.' }] }),
    );
  };

  const geheimnisErneuern = async (zg: PartnerZugang) => {
    if (!(await fragen('Geheimnis erneuern?', 'Das alte Geheimnis gilt sofort nicht mehr. Bis du das neue bei HeyLotte einträgst, lehnt Lotte die Benachrichtigungen ab.', 'Geheimnis erneuern'))) return;
    await ausfuehren<{ webhook_geheimnis: string }>('geheimnis', { aktion: 'geheimnis_erneuern', zugang_id: zg.id }, (d) =>
      setEinmalig({ titel: 'Neues Webhook-Geheimnis', eintraege: [{ label: 'Webhook-Geheimnis', wert: d.webhook_geheimnis, hilfe: 'Damit prüft HeyLotte, dass die Nachricht wirklich von Handwerk OS kommt.' }] }),
    );
  };

  const trennen = async (zg: PartnerZugang) => {
    if (!(await fragen('Verbindung zu HeyLotte trennen?', 'Der Schlüssel wird sofort ungültig. Lotte kann danach nichts mehr in Handwerk OS lesen oder anlegen, und Benachrichtigungen werden nicht mehr verschickt. Das lässt sich nicht rückgängig machen – du kannst aber später neu verbinden.', 'Verbindung trennen'))) return;
    await ausfuehren('trennen', { aktion: 'widerrufen', zugang_id: zg.id }, () => toast('Verbindung getrennt.'));
  };

  const testen = async (zg: PartnerZugang) => {
    setBeschaeftigt('test');
    const d = await anfrage<{ ok: boolean; code?: number; fehler?: string }>({ aktion: 'test_ereignis', zugang_id: zg.id });
    setBeschaeftigt(undefined);
    if (!d) return;
    if (d.ok) toast('Test-Ereignis zugestellt. HeyLotte hat geantwortet.', { ton: 'erfolg' });
    else toast(`Test-Ereignis nicht zugestellt${d.code ? ` (Antwort ${d.code})` : ''}${d.fehler ? `: ${d.fehler}` : ''}.`, { ton: 'achtung' });
    await laden();
  };

  const webhookEntfernen = async (zg: PartnerZugang) => {
    if (!(await fragen('Adresse entfernen?', 'HeyLotte bekommt danach keine Benachrichtigungen mehr. Die Verbindung selbst bleibt bestehen.', 'Adresse entfernen'))) return;
    await ausfuehren('webhook', { aktion: 'aendern', zugang_id: zg.id, webhook_url: null }, () => toast('Adresse entfernt.'));
  };

  const nutzerEntfernen = async (zg: PartnerZugang, partnerNutzerId: string) => {
    if (!(await fragen('Zuordnung entfernen?', `Der Lotte-Nutzer „${partnerNutzerId}“ kann danach nichts mehr in Handwerk OS erledigen.`, 'Entfernen'))) return;
    await ausfuehren(`nutzer:${partnerNutzerId}`, { aktion: 'nutzer_entfernen', zugang_id: zg.id, partner_nutzer_id: partnerNutzerId }, () => toast('Zuordnung entfernt.'));
  };

  return (
    <Seite titel={TITEL} untertitel={UNTERTITEL} zurueck={ZURUECK} status={<Status ton={ZUSTAND_TEXT[v.zustand].ton}>{ZUSTAND_TEXT[v.zustand].text}</Status>}>
      <Stapel abstand={24}>
        <Meldung titel="So arbeitet Lotte">
          Lotte arbeitet immer mit den Rechten des Mitarbeiters, dem du den Lotte-Nutzer zuordnest. Was dieser Mitarbeiter nicht darf, darf Lotte auch nicht.
        </Meldung>
        {ladeFehler && (
          <Meldung ton="achtung" titel="Stand nicht aktuell" aktion={<Button klein variante="sekundaer" laedt={laedt} onClick={neuLaden}>Erneut laden</Button>}>
            {ladeFehler}
          </Meldung>
        )}

        {!z && (
          <>
            {v.getrennt && (
              <Meldung titel="Verbindung getrennt">
                Getrennt am {zeit(v.getrennt.widerrufen_am)}. Der alte Schlüssel ({schluesselAnzeige(v.getrennt.schluessel_ende)}) funktioniert nicht mehr.
              </Meldung>
            )}
            <Leer
              skizze
              icon="stecker"
              titel={v.getrennt ? 'Neu verbinden' : 'HeyLotte ist noch nicht verbunden'}
              text="Beim Verbinden bekommst du einen Schlüssel. Den trägst du einmal bei HeyLotte ein – danach kann Lotte Kunden finden, Kunden anlegen und Aufgaben anlegen."
              aktion={<Button onClick={() => setDialog('verbinden')}>Verbinden</Button>}
            />
          </>
        )}

        {z && (
          <>
            <Raster min={280}>
              <Karte titel="Verbindung" icon="link">
                <Stapel abstand={16}>
                  <Angaben
                    eintraege={[
                      ['Zustand', <Status key="s" ton="erfolg">Verbunden</Status>],
                      ['Schlüssel', schluesselAnzeige(z.schluessel_ende)],
                      ['Workspace-ID', z.partner_workspace_id || 'Nicht eingetragen'],
                      ['Verbunden seit', zeit(z.erstellt_am)],
                      ['Zuletzt genutzt', z.zuletzt_genutzt_am ? zeit(z.zuletzt_genutzt_am) : 'Noch nie'],
                    ]}
                  />
                  <Zeile>
                    <Button klein variante="sekundaer" laedt={beschaeftigt === 'schluessel'} laedtText="Wird erneuert …" onClick={() => void schluesselErneuern(z)}>
                      Schlüssel erneuern
                    </Button>
                    <Button klein variante="tertiaer" onClick={() => setDialog('workspace')}>
                      Workspace-ID ändern
                    </Button>
                  </Zeile>
                </Stapel>
              </Karte>

              <Karte titel="Benachrichtigungen an Lotte" icon="glocke">
                <Stapel abstand={16}>
                  <Angaben
                    eintraege={[
                      ['Zustellung', <Status key="s" ton={zustellungStand(z).ton}>{zustellungLabel(z)}</Status>],
                      ['Adresse', z.webhook_url ? <span style={{ overflowWrap: 'anywhere' }}>{z.webhook_url}</span> : 'Keine Adresse eingetragen'],
                      ...(z.webhook_url ? ([['Ereignisse', ereignisText(z.ereignisse)]] as [string, ReactNode][]) : []),
                    ]}
                  />
                  {z.webhook_url ? (
                    <Meta>
                      {zustellungStand(z).text}
                      {z.auslieferungen.letzter_fehler ? `. Letzter Fehler: ${z.auslieferungen.letzter_fehler}` : '.'}
                    </Meta>
                  ) : (
                    <Meta>Trag die Adresse von HeyLotte ein, damit Lotte sofort erfährt, wenn z. B. ein Kunde angelegt wird.</Meta>
                  )}
                  <Zeile>
                    {z.webhook_url && (
                      <Button klein variante="sekundaer" laedt={beschaeftigt === 'test'} laedtText="Wird gesendet …" onClick={() => void testen(z)}>
                        Test-Ereignis senden
                      </Button>
                    )}
                    <Button klein variante={z.webhook_url ? 'tertiaer' : 'sekundaer'} onClick={() => setDialog('webhook')}>
                      {z.webhook_url ? 'Adresse ändern' : 'Adresse eintragen'}
                    </Button>
                    {z.webhook_url && (
                      <Button klein variante="tertiaer" laedt={beschaeftigt === 'geheimnis'} laedtText="Wird erneuert …" onClick={() => void geheimnisErneuern(z)}>
                        Geheimnis erneuern
                      </Button>
                    )}
                    {z.webhook_url && (
                      <Button klein variante="tertiaer" laedt={beschaeftigt === 'webhook'} onClick={() => void webhookEntfernen(z)}>
                        Adresse entfernen
                      </Button>
                    )}
                  </Zeile>
                </Stapel>
              </Karte>
            </Raster>

            <Abschnitt titel="Wer mit Lotte spricht" hinweis="Jeder Lotte-Nutzer handelt als ein Mitarbeiter aus Handwerk OS – mit dessen Rechten.">
              <Stapel>
                <Liste leer={<Leer titel="Noch niemand zugeordnet" text="Ordne unten einen Lotte-Nutzer einem Mitarbeiter zu. Vorher lehnt Handwerk OS jeden Auftrag von Lotte ab." icon="person" />}>
                  {z.nutzer.map((n) => {
                    const m = db.mitarbeiter.get(n.mitarbeiter_id);
                    return (
                      <ListenZeile
                        key={n.partner_nutzer_id}
                        titel={m ? personName(m) : 'Unbekannter Mitarbeiter'}
                        untertitel={`Lotte-Nutzer: ${n.partner_nutzer_id}${m && !m.aktiv ? ' · Mitarbeiter nicht aktiv' : ''}`}
                        aktion={
                          <Button klein variante="tertiaer" laedt={beschaeftigt === `nutzer:${n.partner_nutzer_id}`} onClick={() => void nutzerEntfernen(z, n.partner_nutzer_id)}>
                            Entfernen
                          </Button>
                        }
                      />
                    );
                  })}
                </Liste>
                <NutzerZuordnen
                  zugang={z}
                  onZuordnen={(partnerNutzerId, mitarbeiterId) =>
                    ausfuehren('zuordnen', { aktion: 'nutzer_zuordnen', zugang_id: z.id, partner_nutzer_id: partnerNutzerId, mitarbeiter_id: mitarbeiterId }, () => toast('Lotte-Nutzer zugeordnet.', { ton: 'erfolg' }))
                  }
                  laedt={beschaeftigt === 'zuordnen'}
                />
              </Stapel>
            </Abschnitt>

            <Abschnitt titel="Verbindung trennen" hinweis="Lotte kann danach nichts mehr in Handwerk OS erledigen. Der Schlüssel wird sofort ungültig.">
              <Zeile>
                <Button variante="gefahr" laedt={beschaeftigt === 'trennen'} laedtText="Wird getrennt …" onClick={() => void trennen(z)}>
                  Verbindung trennen
                </Button>
              </Zeile>
            </Abschnitt>
          </>
        )}

        <Abschnitt titel="Letzte Aufrufe" hinweis="Was Lotte zuletzt in Handwerk OS erledigen wollte.">
          <Liste leer={<Leer titel="Noch keine Aufrufe" text="Sobald Lotte etwas in Handwerk OS erledigt, siehst du es hier – mit Zeit, Aktion und Ergebnis." icon="liste" />}>
            {stand.aufrufe.map((a, i) => {
              const s = aufrufStatus(a);
              const m = a.mitarbeiter_id ? db.mitarbeiter.get(a.mitarbeiter_id) : undefined;
              const wer = m ? personName(m) : a.partner_nutzer_id ? `Lotte-Nutzer ${a.partner_nutzer_id}` : undefined;
              return <ListenZeile key={`${a.zeit}-${i}`} titel={aktionLabel(a.aktion)} untertitel={[zeit(a.zeit), wer].filter(Boolean).join(' · ')} rechts={<Status ton={s.ton}>{s.text}</Status>} />;
            })}
          </Liste>
        </Abschnitt>
      </Stapel>

      {bestaetigen}

      <VerbindenDialog
        offen={dialog === 'verbinden'}
        laedt={beschaeftigt === 'anlegen'}
        onSchliessen={() => setDialog(undefined)}
        onVerbinden={(workspaceId, webhookUrl) =>
          ausfuehren<{ zugang_id: string; schluessel: string; webhook_geheimnis: string | null }>('anlegen', { aktion: 'anlegen', workspace_id: workspaceId, webhook_url: webhookUrl }, (d) => {
            setDialog(undefined);
            setEinmalig({
              titel: 'HeyLotte verbunden',
              eintraege: [
                { label: 'API-Schlüssel', wert: d.schluessel, hilfe: 'Bei HeyLotte unter Handwerk OS eintragen.' },
                ...(d.webhook_geheimnis ? [{ label: 'Webhook-Geheimnis', wert: d.webhook_geheimnis, hilfe: 'Damit prüft HeyLotte, dass die Nachricht wirklich von Handwerk OS kommt.' }] : []),
              ],
            });
          })
        }
      />
      {z && (
        <WorkspaceDialog
          key={`ws-${z.id}-${dialog === 'workspace'}`}
          offen={dialog === 'workspace'}
          wert={z.partner_workspace_id ?? ''}
          laedt={beschaeftigt === 'workspace'}
          onSchliessen={() => setDialog(undefined)}
          onSpeichern={(workspaceId) =>
            ausfuehren('workspace', { aktion: 'aendern', zugang_id: z.id, workspace_id: workspaceId }, () => {
              setDialog(undefined);
              toast('Workspace-ID gespeichert.', { ton: 'erfolg' });
            })
          }
        />
      )}
      {z && (
        <WebhookDialog
          key={`wh-${z.id}-${dialog === 'webhook'}`}
          offen={dialog === 'webhook'}
          zugang={z}
          laedt={beschaeftigt === 'webhook'}
          onSchliessen={() => setDialog(undefined)}
          onSpeichern={(url, ereignisse) =>
            ausfuehren<{ ok: true; webhook_geheimnis?: string }>('webhook', { aktion: 'aendern', zugang_id: z.id, webhook_url: url, ereignisse }, (d) => {
              setDialog(undefined);
              if (d.webhook_geheimnis)
                setEinmalig({ titel: 'Adresse gespeichert', eintraege: [{ label: 'Webhook-Geheimnis', wert: d.webhook_geheimnis, hilfe: 'Damit prüft HeyLotte, dass die Nachricht wirklich von Handwerk OS kommt.' }] });
              else toast('Adresse gespeichert.', { ton: 'erfolg' });
            })
          }
        />
      )}
      <EinmaligDialog einmalig={einmalig} onSchliessen={() => setEinmalig(undefined)} />
    </Seite>
  );
}

/** Beschriftete Angaben untereinander (Beschriftung oben, Wert darunter) */
function Angaben({ eintraege }: { eintraege: [string, ReactNode][] }) {
  return (
    <dl className="mm-stapel" style={{ gap: 12, margin: 0 }}>
      {eintraege.map(([label, wert]) => (
        <div key={label}>
          <dt className="mm-label" style={{ marginBottom: 0 }}>
            {label}
          </dt>
          <dd style={{ margin: 0 }}>{wert}</dd>
        </div>
      ))}
    </dl>
  );
}

function NutzerZuordnen({ zugang, onZuordnen, laedt }: { zugang: PartnerZugang; onZuordnen: (partnerNutzerId: string, mitarbeiterId: string) => Promise<boolean>; laedt: boolean }) {
  const mitarbeiter = db.mitarbeiter.use((m) => m.aktiv && !m.geloeschtAm);
  const [nutzerId, setNutzerId] = useState('');
  const [mitarbeiterId, setMitarbeiterId] = useState('');
  const [fehler, setFehler] = useState<{ nutzer?: string; mitarbeiter?: string }>({});

  const zuordnen = async () => {
    const f = { nutzer: nutzerIdPruefen(nutzerId, zugang.nutzer.map((n) => n.partner_nutzer_id)), mitarbeiter: mitarbeiterId ? undefined : 'Wähl den Mitarbeiter, als der Lotte handeln soll.' };
    setFehler(f);
    if (f.nutzer || f.mitarbeiter) return;
    if (await onZuordnen(nutzerId.trim(), mitarbeiterId)) {
      setNutzerId('');
      setMitarbeiterId('');
    }
  };

  return (
    <Karte titel="Lotte-Nutzer zuordnen" icon="person">
      <Stapel>
        <Eingabe
          label="Lotte-Nutzer-ID"
          hilfe="Steht bei HeyLotte im Profil des Nutzers, z. B. lotte_user_928."
          placeholder="lotte_user_928"
          autoComplete="off"
          spellCheck={false}
          value={nutzerId}
          onChange={(e) => setNutzerId(e.target.value)}
          fehler={fehler.nutzer}
        />
        {mitarbeiter.length ? (
          <Auswahl
            label="Handelt als Mitarbeiter"
            leer="Mitarbeiter wählen"
            optionen={mitarbeiter.map((m) => ({ wert: m.id, label: personName(m) }))}
            value={mitarbeiterId}
            onChange={(e) => setMitarbeiterId(e.target.value)}
            fehler={fehler.mitarbeiter}
          />
        ) : (
          <Meldung ton="achtung">Es gibt noch keinen aktiven Mitarbeiter. Leg zuerst unter Team einen Mitarbeiter an.</Meldung>
        )}
        <Zeile>
          <Button variante="sekundaer" laedt={laedt} laedtText="Wird zugeordnet …" disabled={!mitarbeiter.length} onClick={() => void zuordnen()}>
            Zuordnen
          </Button>
        </Zeile>
      </Stapel>
    </Karte>
  );
}

function VerbindenDialog({ offen, laedt, onSchliessen, onVerbinden }: { offen: boolean; laedt: boolean; onSchliessen: () => void; onVerbinden: (workspaceId?: string, webhookUrl?: string) => Promise<boolean> }) {
  const [workspace, setWorkspace] = useState('');
  const [url, setUrl] = useState('');
  const [fehler, setFehler] = useState<{ workspace?: string; url?: string }>({});

  const verbinden = async () => {
    const f = { workspace: workspacePruefen(workspace), url: url.trim() ? urlPruefen(url) : undefined };
    setFehler(f);
    if (f.workspace || f.url) return;
    if (await onVerbinden(workspace.trim() || undefined, url.trim() || undefined)) {
      setWorkspace('');
      setUrl('');
    }
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="HeyLotte verbinden"
      icon="link"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button laedt={laedt} laedtText="Wird verbunden …" onClick={() => void verbinden()}>
            Verbinden
          </Button>
        </>
      }
    >
      <Stapel>
        <Meta>Du bekommst gleich einen Schlüssel. Er wird nur einmal angezeigt – halte HeyLotte offen, um ihn direkt einzutragen.</Meta>
        <Eingabe label="Workspace-ID bei HeyLotte" optional hilfe="Steht bei HeyLotte in den Einstellungen deines Workspace." autoComplete="off" spellCheck={false} value={workspace} onChange={(e) => setWorkspace(e.target.value)} fehler={fehler.workspace} />
        <Eingabe label="Adresse für Benachrichtigungen" optional type="url" inputMode="url" placeholder="https://" hilfe="Kannst du auch später eintragen." value={url} onChange={(e) => setUrl(e.target.value)} fehler={fehler.url} />
      </Stapel>
    </Dialog>
  );
}

function WorkspaceDialog({ offen, wert, laedt, onSchliessen, onSpeichern }: { offen: boolean; wert: string; laedt: boolean; onSchliessen: () => void; onSpeichern: (workspaceId: string | null) => Promise<boolean> }) {
  const [workspace, setWorkspace] = useState(wert);
  const [fehler, setFehler] = useState<string>();
  const speichern = () => {
    const f = workspacePruefen(workspace);
    setFehler(f);
    if (!f) void onSpeichern(workspace.trim() || null);
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel="Workspace-ID ändern"
      icon="stift"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button laedt={laedt} laedtText="Wird gespeichert …" onClick={speichern}>
            Speichern
          </Button>
        </>
      }
    >
      <Eingabe label="Workspace-ID bei HeyLotte" optional hilfe="Leer lassen, wenn HeyLotte keine Workspace-ID braucht." autoComplete="off" spellCheck={false} value={workspace} onChange={(e) => setWorkspace(e.target.value)} fehler={fehler} autoFocus />
    </Dialog>
  );
}

function WebhookDialog({ offen, zugang, laedt, onSchliessen, onSpeichern }: { offen: boolean; zugang: PartnerZugang; laedt: boolean; onSchliessen: () => void; onSpeichern: (url: string, ereignisse: string[]) => Promise<boolean> }) {
  const [url, setUrl] = useState(zugang.webhook_url ?? '');
  const [gewaehlt, setGewaehlt] = useState<string[]>(zugang.ereignisse.length ? zugang.ereignisse : ['*']);
  const [fehler, setFehler] = useState<{ url?: string; ereignisse?: string }>({});
  const alle = gewaehlt.includes('*');
  const umschalten = (typ: string, an: boolean) => setGewaehlt((g) => (an ? [...g.filter((x) => x !== '*'), typ] : g.filter((x) => x !== typ)));

  const speichern = () => {
    const f = { url: urlPruefen(url), ereignisse: gewaehlt.length ? undefined : 'Wähl mindestens ein Ereignis.' };
    setFehler(f);
    if (!f.url && !f.ereignisse) void onSpeichern(url.trim(), gewaehlt);
  };

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={zugang.webhook_url ? 'Adresse ändern' : 'Adresse eintragen'}
      icon="glocke"
      aktionen={
        <>
          <Button variante="tertiaer" onClick={onSchliessen}>
            Abbrechen
          </Button>
          <Button laedt={laedt} laedtText="Wird gespeichert …" onClick={speichern}>
            Speichern
          </Button>
        </>
      }
    >
      <Stapel>
        <Eingabe label="Adresse von HeyLotte" type="url" inputMode="url" placeholder="https://" hilfe="Bekommst du von HeyLotte. Beim ersten Eintragen erhältst du ein Geheimnis." value={url} onChange={(e) => setUrl(e.target.value)} fehler={fehler.url} autoFocus />
        <Stapel abstand={8}>
          <strong>Worüber soll Lotte Bescheid bekommen?</strong>
          {fehler.ereignisse && <Meldung ton="achtung">{fehler.ereignisse}</Meldung>}
          <Checkbox label="Alle Ereignisse" checked={alle} onChange={(an) => setGewaehlt(an ? ['*'] : [])} />
          {EREIGNISSE.map((e) => (
            <Checkbox key={e.typ} label={e.titel} checked={alle || gewaehlt.includes(e.typ)} disabled={alle} onChange={(an) => umschalten(e.typ, an)} />
          ))}
        </Stapel>
      </Stapel>
    </Dialog>
  );
}

/** Schlüssel und Geheimnisse – nur dieses eine Mal sichtbar */
function EinmaligDialog({ einmalig, onSchliessen }: { einmalig?: Einmalig; onSchliessen: () => void }) {
  const toast = useToast();
  const [kopiert, setKopiert] = useState<string[]>([]);
  const schliessen = () => {
    setKopiert([]);
    onSchliessen();
  };
  return (
    <Dialog
      offen={!!einmalig}
      onSchliessen={schliessen}
      titel={einmalig?.titel ?? ''}
      icon="schloss"
      aktionen={<Button onClick={schliessen}>Ich habe alles gespeichert</Button>}
    >
      <Stapel>
        <Meldung ton="achtung" titel="Jetzt kopieren">
          Das wird nur dieses eine Mal angezeigt. Schließt du das Fenster, musst du es neu erzeugen.
        </Meldung>
        {einmalig?.eintraege.map((e) => (
          <Stapel key={e.label} abstand={8}>
            <span className="mm-label">{e.label}</span>
            <code style={{ overflowWrap: 'anywhere', wordBreak: 'break-all', padding: 12, borderRadius: 8, background: 'var(--mm-surface-subtle)', border: '1px solid var(--mm-border)' }}>{e.wert}</code>
            <Meta>{e.hilfe}</Meta>
            <Zeile>
              <Button
                klein
                variante="sekundaer"
                icon={kopiert.includes(e.label) ? 'check' : undefined}
                onClick={async () => {
                  if (await kopieren(e.wert)) {
                    setKopiert((k) => [...k, e.label]);
                    toast(`${e.label} kopiert.`);
                  } else toast('Kopieren ging nicht. Markiere den Text und kopiere ihn von Hand.', { ton: 'achtung' });
                }}
              >
                {kopiert.includes(e.label) ? 'Kopiert' : 'Kopieren'}
              </Button>
            </Zeile>
          </Stapel>
        ))}
      </Stapel>
    </Dialog>
  );
}
