import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, useDatenstand } from "@core/db";
import { alleModule, pfadZu } from "@core/modul";
import {
  adresseText,
  datum,
  datumKurz,
  euro,
  mapsLink,
  personName,
  summen,
  telLink,
  uhrzeit,
} from "@core/format";
import { useDarf, useIch, istBuero } from "@core/session";
import { hauptaktion } from "@modules/naechster-einsatz/Einsatz";
import { WoStehtDerAuftrag } from "@modules/ablauf/WoSteht";
import { begriff } from "@modules/ablauf/daten";
import type { Auftrag } from "@core/objects";
import { nummerAnzeige } from "@core/nummern";
import {
  AktionsMenue,
  BeispielMarke,
  Button,
  Karte,
  Leer,
  Liste,
  ListenZeile,
  Meldung,
  Meta,
  Seite,
  Stapel,
  Status,
  ZweiSpalten,
  Zeile,
  useToast,
} from "@ui/index";
import { ErfassenKnopf, ObjektLink, ObjektPanels, ObjektTabs, Zeitstrahl } from "@ui/objekt";
import { Person, Personen, Personenbild } from "@ui/person";
import {
  ART_LABEL,
  kommendeEinsaetze,
  phaseLabel,
  phaseTon,
} from "./logik";
import { schrittAusfuehren, schrittFuer } from "./daten";
import {
  BearbeitenDialog,
  PhaseDialog,
  VerlorenDialog,
} from "./AuftragDialoge";
import "./auftraege.css";

/** Die Auftragsakte: alles zu einem Auftrag an einer Stelle */
export function AuftragAkte() {
  const { id = "" } = useParams();
  useDatenstand();
  const a = db.auftraege.useOne(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [dialog, setDialog] = useState<
    "bearbeiten" | "phase" | "verloren" | null
  >(null);
  const darfSchreiben = useDarf("schreiben");
  const ich = useIch();

  if (!a || a.geloeschtAm)
    return (
      <Seite
        titel="Auftrag nicht gefunden"
        zurueck={{ to: "/auftraege/auftraege", label: "Aufträge" }}
      >
        <Leer
          titel="Diesen Auftrag gibt es nicht (mehr)."
          text="Vielleicht wurde er gelöscht. Such ihn über die Suche oder in der Übersicht."
          icon="auftraege"
          aktion={<Button to="/auftraege/auftraege">Zur Übersicht</Button>}
        />
      </Seite>
    );

  const schritt = schrittFuer(a);
  // Läuft gerade ein Einsatz an diesem Auftrag? Dann ist „Arbeit abschließen“ die Hauptaktion.
  const laufend = db.termine.all().find((t) => t.auftragId === a.id && t.status === "vor_ort" && (!ich || t.mitarbeiterIds.includes(ich.id)));
  const haupt = laufend ? hauptaktion(laufend) : undefined;
  const einsatzAusfuehren = (fn: () => string | void, erfolg: string) => {
    try {
      const ziel = fn();
      toast(erfolg);
      if (ziel) navigate(ziel);
    } catch {
      toast("Das hat nicht geklappt. Versuch es noch einmal.", { ton: "achtung" });
    }
  };
  const ausfuehren = () => {
    if (!schritt) return;
    try {
      const r = schrittAusfuehren(a, schritt);
      if (r.meldung) toast(r.meldung);
      if (r.pfad) navigate(r.pfad);
    } catch (e) {
      console.error(e);
      toast("Das hat nicht geklappt. Versuch es noch einmal.", {
        ton: "achtung",
      });
    }
  };

  return (
    <Seite
      breit
      titel={a.titel}
      oberzeile={ART_LABEL[a.art]}
      untertitel={nummerAnzeige(a.nummer)}
      status={
        <>
          <Status ton={phaseTon(a.phase)}>{phaseLabel(a.phase)}</Status>
          {a.dringend && <Status ton="achtung">Dringend</Status>}
          <BeispielMarke zeigen={a.beispiel} />
        </>
      }
      zurueck={{ to: "/auftraege/auftraege", label: "Aufträge" }}
      aktion={
        laufend && haupt ? (
          <Button icon={haupt.icon} onClick={() => einsatzAusfuehren(haupt.fn, haupt.erfolg)}>
            {haupt.label}
          </Button>
        ) : schritt && darfSchreiben ? (
          <Button icon={schritt.icon} onClick={ausfuehren}>
            {schritt.label}
          </Button>
        ) : undefined
      }
    >
      <Stapel abstand={12}>
        {a.phase === "verloren" ? (
          <Meldung ton="neutral" titel="Nicht zustande gekommen">
            {a.verlorenGrund ?? "Kein Grund angegeben."}
          </Meldung>
        ) : (
          <WoStehtDerAuftrag
            auftrag={a}
            naechstes={
              laufend ? (
                <Meta>
                  <strong>Arbeit läuft</strong> · {laufend.titel}
                  {schritt ? ` · Danach: ${schritt.label}` : ""}
                </Meta>
              ) : schritt ? (
                <Meta>
                  <strong>Als Nächstes:</strong> {schritt.text}
                </Meta>
              ) : (
                <Meta>
                  Alles erledigt.{" "}
                  {a.abgeschlossenAm
                    ? `Abgeschlossen am ${datum(a.abgeschlossenAm)}.`
                    : ""}
                </Meta>
              )
            }
          />
        )}
        {darfSchreiben && (
          <Zeile abstand={8}>
            <ErfassenKnopf aktion="foto" auftragId={a.id} klein />
            <ErfassenKnopf aktion="notiz" auftragId={a.id} klein variante="tertiaer" />
            <AktionsMenue
              klein
              aktionen={[
                { label: "Bearbeiten", icon: "stift", onClick: () => setDialog("bearbeiten") },
                { label: "Phase ändern", icon: "wiederholen", onClick: () => setDialog("phase") },
                ...(laufend && schritt ? [{ label: schritt.label, icon: schritt.icon ?? "pfeilRechts", onClick: ausfuehren }] : []),
                ...(a.phase !== "verloren" && a.phase !== "erledigt"
                  ? [{ label: "Als verloren markieren", icon: "x", onClick: () => setDialog("verloren") }]
                  : []),
              ]}
            />
          </Zeile>
        )}
      </Stapel>

      <ZweiSpalten
        haupt={
          <ObjektTabs
            key={a.id}
            objekt="auftraege"
            id={a.id}
            eigene={[
              {
                id: "ueberblick",
                titel: "Überblick",
                inhalt: (
                  <Ueberblick
                    a={a}
                    onBearbeiten={() => setDialog("bearbeiten")}
                  />
                ),
              },
              {
                id: "zeiten",
                titel: "Zeit",
                inhalt: <ZeitenAmAuftrag auftragId={a.id} />,
              },
              {
                id: "verlauf",
                titel: "Verlauf",
                inhalt: (
                  <Zeitstrahl bezug={{ typ: "auftraege", id: a.id }} max={50} />
                ),
              },
            ]}
          />
        }
        seite={
          <>
            <Kopf a={a} />
            <ObjektPanels objekt="auftraege" id={a.id} />
          </>
        }
      />

      {dialog === "bearbeiten" && (
        <BearbeitenDialog a={a} offen onSchliessen={() => setDialog(null)} />
      )}
      {dialog === "phase" && (
        <PhaseDialog a={a} offen onSchliessen={() => setDialog(null)} />
      )}
      {dialog === "verloren" && (
        <VerlorenDialog a={a} offen onSchliessen={() => setDialog(null)} />
      )}
    </Seite>
  );
}

/** Kopf: Kunde, Ort mit Navigation und Zugang, Eckdaten */
function Kopf({ a }: { a: Auftrag }) {
  const k = db.kunden.get(a.kundeId);
  const o = db.orte.get(a.ortId);
  const v = db.mitarbeiter.get(a.verantwortlichId);
  const naechster = kommendeEinsaetze(
    db.termine.where((t) => t.auftragId === a.id),
  )[0];
  const tel = o?.telefonVorOrt ?? k?.telefon;
  // Das Orte-Modul zeigt den Einsatzort samt Navigation und Zugang schon als Panel – nicht doppelt
  const ortPanel = alleModule().some(
    (m) => m.id === "orte" && m.panels?.some((p) => p.objekt === "auftraege"),
  );
  return (
    <>
      <Karte kompakt oberzeile="Kunde">
        <div className="akte-info">
          {k ? (
            <ObjektLink bezug={{ typ: "kunden", id: k.id }}>
              <strong>{k.name}</strong>
            </ObjektLink>
          ) : (
            <Meta>Kein Kunde hinterlegt.</Meta>
          )}
          {k?.ansprechpartner[0] && (
            <Meta>
              {k.ansprechpartner[0].name}
              {k.ansprechpartner[0].funktion
                ? `, ${k.ansprechpartner[0].funktion}`
                : ""}
            </Meta>
          )}
          {k?.email && <a href={`mailto:${k.email}`}>{k.email}</a>}
          {tel && (
            <div style={{ marginTop: 8 }}>
              <Button
                variante="sekundaer"
                klein
                icon="telefon"
                onClick={() => (window.location.href = telLink(tel)!)}
              >
                {o?.telefonVorOrt
                  ? `${o.ansprechpartnerVorOrt ?? "Vor Ort"} anrufen`
                  : "Anrufen"}
              </Button>
            </div>
          )}
        </div>
      </Karte>
      {!ortPanel && (
        <Karte kompakt oberzeile={begriff("einsatzort")}>
          <div className="akte-info">
            {o ? (
              <>
                <ObjektLink bezug={{ typ: "orte", id: o.id }}>
                  <strong>{o.bezeichnung}</strong>
                </ObjektLink>
                <span>{adresseText(o.adresse)}</span>
                {(o.adresse.zusatz || o.adresse.land) && (
                  <Meta>{[o.adresse.zusatz, o.adresse.land].filter(Boolean).join(" · ")}</Meta>
                )}
                {o.hinweise && (
                  <Meta>
                    <strong>Zugang:</strong> {o.hinweise}
                  </Meta>
                )}
                {o.ansprechpartnerVorOrt && (
                  <Meta>Vor Ort: {o.ansprechpartnerVorOrt}</Meta>
                )}
                <div style={{ marginTop: 8 }}>
                  <a
                    className="mm-btn mm-btn--sekundaer mm-btn--klein"
                    href={mapsLink(o.adresse)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Navigation starten
                  </a>
                </div>
              </>
            ) : (
              <Meta>Noch nicht hinterlegt. Trag die Adresse über „Bearbeiten“ ein.</Meta>
            )}
          </div>
        </Karte>
      )}
      <Karte kompakt oberzeile="Eckdaten">
        <div className="akte-info">
          <span>Verantwortlich: {v ? <Person m={v} /> : "niemand"}</span>
          {!!a.mitarbeiterIds?.length && (
            <span>Team: {a.mitarbeiterIds.map((id) => personName(db.mitarbeiter.get(id))).join(", ")}</span>
          )}
          {naechster ? (
            <span>
              Nächster Einsatz:{" "}
              <ObjektLink bezug={{ typ: "termine", id: naechster.id }}>
                {datumKurz(naechster.start)}, {uhrzeit(naechster.start)} Uhr
              </ObjektLink>
            </span>
          ) : (
            <span>Kein Einsatz geplant</span>
          )}
          {a.wunschtermin && <span>Wunsch: {a.wunschtermin}</span>}
          {a.geplanteStunden != null && (
            <span>
              Geplant: {String(a.geplanteStunden).replace(".", ",")} Std.
            </span>
          )}
          <Meta>Angelegt am {datum(a.erstelltAm)}</Meta>
        </div>
      </Karte>
    </>
  );
}

function Ueberblick({
  a,
  onBearbeiten,
}: {
  a: Auftrag;
  onBearbeiten: () => void;
}) {
  const darfGeld = useDarf("geld");
  const termine = db.termine
    .where((t) => t.auftragId === a.id && t.status !== "abgesagt")
    .sort((x, y) => x.start.localeCompare(y.start));
  const angebote = db.angebote.where((x) => x.auftragId === a.id);
  const rechnungen = db.rechnungen.where(
    (x) => x.auftragId === a.id && x.status !== "storniert",
  );
  const offeneAufgaben = db.aufgaben.where(
    (x) => x.auftragId === a.id && !x.erledigt,
  ).length;
  const ust = db.betrieb.get("betrieb")?.ustSatz ?? 19;
  return (
    <Stapel abstand={24}>
      <Karte titel="Worum es geht" kompakt>
        {a.beschreibung ? (
          <p style={{ whiteSpace: "pre-wrap" }}>{a.beschreibung}</p>
        ) : (
          <Zeile zwischen>
            <Meta>Noch keine Beschreibung.</Meta>
            <Button variante="tertiaer" klein onClick={onBearbeiten}>
              Beschreibung ergänzen
            </Button>
          </Zeile>
        )}
        {offeneAufgaben > 0 && (
          <Meta>
            {offeneAufgaben === 1
              ? "1 offene Aufgabe"
              : `${offeneAufgaben} offene Aufgaben`}{" "}
            – siehe „Aufgaben & Checklisten“.
          </Meta>
        )}
      </Karte>

      <Stapel abstand={8}>
        <h3>Termine</h3>
        <Liste leer={<Meta>Noch keine Termine an diesem Auftrag.</Meta>}>
          {termine.slice(-6).map((t) => (
            <ListenZeile
              key={t.id}
              to={pfadZu({ typ: "termine", id: t.id })}
              titel={`${datumKurz(t.start)}, ${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`}
              untertitel={
                t.titel || t.mitarbeiterIds.length > 0 ? (
                  <>
                    {t.titel}
                    {t.titel && t.mitarbeiterIds.length > 0 && " · "}
                    <Personen ids={t.mitarbeiterIds} namen />
                  </>
                ) : undefined
              }
              rechts={
                <Status
                  ton={
                    t.status === "erledigt"
                      ? "erfolg"
                      : t.status === "vor_ort" || t.status === "unterwegs"
                        ? "aktiv"
                        : "neutral"
                  }
                >
                  {TERMIN_STATUS[t.status]}
                </Status>
              }
            />
          ))}
        </Liste>
      </Stapel>

      {darfGeld && (angebote.length > 0 || rechnungen.length > 0) && (
        <Stapel abstand={8}>
          <h3>Angebote und Rechnungen</h3>
          <Liste>
            {angebote.map((x) => (
              <ListenZeile
                key={x.id}
                to={pfadZu({ typ: "angebote", id: x.id })}
                titel={`Angebot ${x.nummer}`}
                untertitel={`${datum(x.datum)} · ${euro(summen(x.positionen, ust, x.rabattProzent).brutto)} brutto`}
                rechts={
                  <Status
                    ton={
                      x.status === "angenommen"
                        ? "erfolg"
                        : x.status === "abgelehnt" || x.status === "abgelaufen"
                          ? "neutral"
                          : "aktiv"
                    }
                  >
                    {ANGEBOT_STATUS[x.status]}
                  </Status>
                }
              />
            ))}
            {rechnungen.map((r) => (
              <ListenZeile
                key={r.id}
                to={pfadZu({ typ: "rechnungen", id: r.id })}
                titel={`Rechnung ${r.nummer}`}
                untertitel={`${datum(r.datum)} · ${euro(summen(r.positionen, ust).brutto)} brutto`}
                rechts={
                  <Status
                    ton={
                      r.status === "bezahlt"
                        ? "erfolg"
                        : r.status === "entwurf"
                          ? "neutral"
                          : "aktiv"
                    }
                  >
                    {RECHNUNG_STATUS[r.status]}
                  </Status>
                }
              />
            ))}
          </Liste>
        </Stapel>
      )}
    </Stapel>
  );
}

const TERMIN_STATUS: Record<string, string> = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  unterwegs: "Unterwegs",
  vor_ort: "Vor Ort",
  erledigt: "Erledigt",
  abgesagt: "Abgesagt",
};
const ANGEBOT_STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Versendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  abgelaufen: "Abgelaufen",
};
const RECHNUNG_STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  versendet: "Offen",
  teilbezahlt: "Teilweise bezahlt",
  bezahlt: "Bezahlt",
  storniert: "Storniert",
};

/** Zeiten an diesem Auftrag – Monteure sehen ihre eigenen, Büro und Chef alle */
function ZeitenAmAuftrag({ auftragId }: { auftragId: string }) {
  useDatenstand();
  const ich = useIch();
  const alle = istBuero(ich);
  const zeiten = db.zeiten
    .where((z) => z.auftragId === auftragId && (alle || z.mitarbeiterId === ich?.id))
    .sort((x, y) => (y.datum + y.start).localeCompare(x.datum + x.start));
  return (
    <Stapel abstand={12}>
      <div>
        <ErfassenKnopf aktion="zeit" auftragId={auftragId} />
      </div>
      <Liste leer={<Leer icon="uhr" titel="Noch keine Zeiten" text="Starte die Zeit hier oder mit „Arbeit starten“ am Einsatz." />}>
        {zeiten.slice(0, 30).map((z) => (
          <ListenZeile
            key={z.id}
            links={<Personenbild m={z.mitarbeiterId} groesse={40} />}
            titel={`${datumKurz(z.datum)}, ${z.start}–${z.ende ?? "läuft"}`}
            untertitel={[personName(db.mitarbeiter.get(z.mitarbeiterId)), z.art === "fahrt" ? "Fahrt" : "Arbeit", z.notiz].filter(Boolean).join(" · ")}
            rechts={!z.ende ? <Status ton="aktiv">Läuft</Status> : undefined}
          />
        ))}
      </Liste>
    </Stapel>
  );
}
