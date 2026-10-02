/**
 * Druck-/PDF-Ansichten: ein Rahmen und ein Briefbogen für Angebote, Rechnungen, Mahnungen und Protokolle –
 * dazu die gemeinsamen Bausteine der Dokumenten-Engine: Positionstabelle und Summenblock.
 * Absender, Logo und Fußzeile kommen aus `db.betrieb` und der Einstellung „Briefkopf“ (Vorlagen) –
 * nichts wird kopiert. Über „Drucken → Als PDF speichern“ entsteht das PDF.
 */
import type { ReactNode } from 'react';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { adresseText, euro, positionSumme, zahl } from '@core/format';
import type { ID, Position } from '@core/objects';
import { BeispielMarke, Button, Leer, Meta } from './index';
import './druck.css';

// ------------------------------------------------------------------ Briefkopf (Daten)

export interface BriefkopfEinstellung {
  /** Logo als verkleinerte Data-URL */
  logo?: string;
  /** zusätzliche Zeile in der Fußzeile, z. B. Handwerkskammer, Geschäftsführer */
  zusatz?: string;
  zeigeBank: boolean;
  zeigeSteuer: boolean;
}

export const BRIEFKOPF_KEY = 'vorlagen.briefkopf';
export const BRIEFKOPF_STANDARD: BriefkopfEinstellung = { zeigeBank: true, zeigeSteuer: true };

export function ibanFormat(iban: string) {
  return iban.replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
}

/** Briefkopf aus den Betriebsdaten – immer aktuell, nichts kopiert */
export function briefkopf(e: BriefkopfEinstellung = einstellung(BRIEFKOPF_KEY, BRIEFKOPF_STANDARD)) {
  const b = db.betrieb.get('betrieb');
  const adresse = b?.adresse?.strasse ? adresseText(b.adresse) : '';
  const fusszeilen = [
    [b?.name, adresse].filter(Boolean).join(' · '),
    [b?.telefon && `Tel. ${b.telefon}`, b?.email].filter(Boolean).join(' · '),
    e.zeigeBank && b?.iban ? [`IBAN ${ibanFormat(b.iban)}`, b.bic && `BIC ${b.bic}`].filter(Boolean).join(' · ') : '',
    e.zeigeSteuer ? [b?.steuernummer && `Steuernr. ${b.steuernummer}`, b?.ustId && `USt-IdNr. ${b.ustId}`].filter(Boolean).join(' · ') : '',
    e.zusatz?.trim() ?? '',
  ].filter(Boolean);
  return { logo: e.logo, absenderzeile: [b?.name, adresse].filter(Boolean).join(' · '), fusszeilen };
}

// ------------------------------------------------------------------ Rahmen

/**
 * Hülle einer Druckansicht (ohne App-Rahmen): Leiste mit Zurück/Schließen und Drucken, darunter das Blatt.
 * Ohne `zurueck` schließt der Knopf das Fenster (Druckansicht in neuem Tab).
 */
export function Druckrahmen({ zurueck, children }: { zurueck?: string; children: ReactNode }) {
  return (
    <div className="mm-druck-huelle">
      <div className="mm-druck-leiste mm-nicht-drucken">
        {zurueck ? (
          <Button variante="tertiaer" icon="zurueck" to={zurueck}>
            Zurück
          </Button>
        ) : (
          <Button variante="tertiaer" onClick={() => window.close()}>
            Schließen
          </Button>
        )}
        <Button icon="download" onClick={() => window.print()}>
          Drucken oder als PDF speichern
        </Button>
      </div>
      <p className="mm-meta mm-druck-hinweis mm-nicht-drucken">Für ein PDF wählst du im Druckdialog „Als PDF speichern“.</p>
      <article className="mm-druck">{children}</article>
    </div>
  );
}

export function DruckNichtGefunden({ was, zurueck }: { was: string; zurueck?: string }) {
  return (
    <div className="mm-druck-huelle">
      <div className="mm-druck">
        <Leer titel={`${was} nicht gefunden`} text="Vielleicht wurde es gelöscht." aktion={zurueck ? <Button to={zurueck}>Zurück</Button> : undefined} icon="dokument" />
      </div>
    </div>
  );
}

/** Anschrift eines Kunden für das Adressfeld */
function Empfaenger({ kundeId }: { kundeId: ID }) {
  const k = db.kunden.useOne(kundeId);
  if (!k) return null;
  const firma = k.firma && k.firma !== k.name;
  return (
    <address className="mm-druck-empfaenger">
      <strong>{k.firma || k.name}</strong>
      {firma ? <div>{k.ansprechpartner[0] ? `z. Hd. ${k.ansprechpartner[0].name}` : k.name}</div> : null}
      {k.adresse?.strasse && <div>{k.adresse.strasse}</div>}
      {(k.adresse?.plz || k.adresse?.ort) && (
        <div>
          {k.adresse?.plz} {k.adresse?.ort}
        </div>
      )}
    </address>
  );
}

/** Informationsblock (Nummer, Datum, Kundennummer …) – im Brief rechts neben der Anschrift */
function Datenblock({ block }: { block: [string, ReactNode][] }) {
  return (
    <table className="mm-druck-daten">
      <tbody>
        {block.map(([l, w]) => (
          <tr key={l}>
            <td>{l}</td>
            <td>{w}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Briefbogen: Logo und Absender, optional Empfänger, Titel mit Datenblock, Inhalt, Fußzeile.
 * Für Protokolle ohne Empfänger einfach `kundeId` weglassen.
 */
export function Briefbogen({
  titel,
  nummer,
  kundeId,
  daten = [],
  beispiel,
  zurueck,
  children,
}: {
  titel: ReactNode;
  /** kleine Zeile unter dem Titel, z. B. Protokollnummer */
  nummer?: string;
  /** Empfänger im Adressfeld */
  kundeId?: ID;
  /** Datenblock neben/unter dem Titel; leere Werte werden ausgelassen */
  daten?: [string, ReactNode][];
  beispiel?: boolean;
  zurueck?: string;
  children: ReactNode;
}) {
  const b = db.betrieb.useOne('betrieb');
  const kopf = briefkopf();
  const block = daten.filter(([, w]) => w != null && w !== '');
  return (
    <Druckrahmen zurueck={zurueck}>
      <header className="mm-druck-kopf">
        <div>
          {kopf.logo ? <img className="mm-druck-logo" src={kopf.logo} alt={b?.name ?? 'Logo'} /> : <strong className="mm-druck-firma">{b?.name ?? 'Dein Betrieb'}</strong>}
        </div>
        {b && (
          <div className="mm-druck-absender">
            {kopf.logo && <strong>{b.name}</strong>}
            {b.adresse?.strasse && <div>{adresseText(b.adresse)}</div>}
            {b.telefon && <div>Tel. {b.telefon}</div>}
            {b.email && <div>{b.email}</div>}
          </div>
        )}
      </header>
      {kundeId ? (
        <>
          <div className="mm-druck-anschrift">
            <div>
              {kopf.absenderzeile && <div className="mm-druck-absenderzeile">{kopf.absenderzeile}</div>}
              <Empfaenger kundeId={kundeId} />
            </div>
            {block.length > 0 && <Datenblock block={block} />}
          </div>
          <h1 className="mm-druck-titel">
            {titel} <BeispielMarke zeigen={beispiel} />
          </h1>
          {nummer && <Meta>{nummer}</Meta>}
        </>
      ) : (
        <>
          <h1 className="mm-druck-titel">
            {titel} <BeispielMarke zeigen={beispiel} />
          </h1>
          {nummer && <Meta>{nummer}</Meta>}
          {block.length > 0 && <Datenblock block={block} />}
        </>
      )}
      {children}
      <div className="mm-druck-abstand" aria-hidden />
      {kopf.fusszeilen.length > 0 && (
        <footer className="mm-druck-fuss">
          {kopf.fusszeilen.map((z) => (
            <div key={z}>{z}</div>
          ))}
        </footer>
      )}
    </Druckrahmen>
  );
}

// ------------------------------------------------------------------ Gemeinsame Bausteine der Geschäftsdokumente

/**
 * Positionstabelle für alle Geschäftsdokumente (Angebot, Auftragsbestätigung, Lieferschein, Rechnungen).
 * Textzeilen ohne Nummer, Bedarfspositionen in Klammern. `preise={false}` für Lieferscheine.
 */
export function DruckPositionen({ positionen, preise = true }: { positionen: Position[]; preise?: boolean }) {
  let nr = 0;
  return (
    <div className="mm-druck-tabelle-rahmen">
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Beschreibung</th>
            <th className="num">Menge</th>
            {preise && <th className="num mm-nebensaechlich">Einzelpreis</th>}
            {preise && <th className="num">Gesamt</th>}
          </tr>
        </thead>
        <tbody>
          {!positionen.length && (
            <tr>
              <td />
              <td colSpan={preise ? 4 : 2}>Keine Positionen.</td>
            </tr>
          )}
          {positionen.map((p) => {
            if (p.art === 'text' || p.art === 'zwischensumme')
              return (
                <tr key={p.id}>
                  <td />
                  <td colSpan={preise ? 4 : 2} style={{ whiteSpace: 'pre-wrap' }}>
                    {p.text}
                  </td>
                </tr>
              );
            nr++;
            return (
              <tr key={p.id}>
                <td>{nr}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>
                  {p.text}
                  {p.optional && <div className="mm-druck-klein">Bedarfs-/Alternativposition – nicht in der Summe enthalten</div>}
                </td>
                <td className="num">
                  {zahl(p.menge)} {p.einheit}
                </td>
                {preise && <td className="num mm-nebensaechlich">{euro(p.einzelpreis)}</td>}
                {preise && <td className="num">{p.optional ? `(${euro(Math.round(p.menge * p.einzelpreis))})` : euro(positionSumme(p))}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export interface SummenZeile {
  label: ReactNode;
  wert: string;
  /** Gesamt- oder Zahlbetrag: fett mit Linie */
  gesamt?: boolean;
  /** kleine Zusatzzeile unter dem Label */
  klein?: ReactNode;
}

/** Summenblock rechtsbündig – Netto, USt, Abzüge, Zahlbetrag */
export function DruckSummen({ zeilen }: { zeilen: SummenZeile[] }) {
  return (
    <table className="mm-druck-summen">
      <tbody>
        {zeilen.map((z, i) => (
          <tr key={i} className={z.gesamt ? 'mm-druck-gesamt' : undefined}>
            <td>
              {z.label}
              {z.klein && <div className="mm-druck-klein">{z.klein}</div>}
            </td>
            <td className="num">{z.wert}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
