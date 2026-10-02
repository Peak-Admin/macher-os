import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@core/db';
import { useDarf } from '@core/session';
import { Auswahl, Button, Eingabe, Karte, Leer, Meldung, Meta, Seite, Stapel, Textfeld, ZweiSpalten, Zeile, useBestaetigen, useToast } from '@ui/index';
import { PLATZHALTER, VORLAGEN_ARTEN, fehlendePlatzhalter, kontextAus, platzhalterErsetzen, standardKontext, vorlagen, type Kontext, type Vorlage, type VorlagenArt } from './daten';

export function VorlageBearbeiten() {
  const { id = '' } = useParams();
  const v = vorlagen.useOne(id);
  if (!v || v.geloeschtAm)
    return (
      <Seite titel="Vorlage nicht gefunden" zurueck={{ to: '/betrieb/vorlagen', label: 'Vorlagen' }}>
        <Leer titel="Diese Vorlage gibt es nicht (mehr)." icon="dokument" />
      </Seite>
    );
  return <Editor key={v.id} vorlage={v} />;
}

/** Beispielkontext aus echten Daten – damit die Vorschau nach etwas Echtem aussieht */
function beispielKontext(art: VorlagenArt): { kontext: Kontext; quelle?: string } {
  const r = db.rechnungen.all().find((x) => x.status !== 'entwurf') ?? db.rechnungen.all()[0];
  const an = db.angebote.all()[0];
  const t = db.termine.all().find((x) => x.kundeId) ?? db.termine.all()[0];
  const a = db.auftraege.all()[0];
  if ((art === 'rechnung' || art === 'mahnung') && r) return { kontext: kontextAus({ rechnungId: r.id }), quelle: `Rechnung ${r.nummer}` };
  if (art === 'angebot' && an) return { kontext: kontextAus({ angebotId: an.id }), quelle: `Angebot ${an.nummer}` };
  if (art === 'termin' && t) return { kontext: kontextAus({ terminId: t.id }), quelle: `Termin „${t.titel}“` };
  if (art === 'email') {
    const k = { ...kontextAus({ angebotId: an?.id }), ...kontextAus({ rechnungId: r?.id }) };
    return { kontext: k, quelle: 'deinen Angeboten und Rechnungen' };
  }
  return a ? { kontext: kontextAus({ auftragId: a.id }), quelle: `Auftrag ${a.nummer}` } : { kontext: {} };
}

function Editor({ vorlage }: { vorlage: Vorlage }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [fragen, dialog] = useBestaetigen();
  const schreiben = useDarf('schreiben');
  const darfLoeschen = useDarf('loeschen');
  const [f, setF] = useState({ titel: vorlage.titel, art: vorlage.art, betreff: vorlage.betreff ?? '', text: vorlage.text });
  const [fehler, setFehler] = useState<string>();
  const cursor = useRef<{ feld: 'text' | 'betreff'; pos: number }>({ feld: 'text', pos: vorlage.text.length });
  const mitBetreff = VORLAGEN_ARTEN.find((a) => a.id === f.art)?.mitBetreff;
  // Vorschau mit echten Beträgen nur für Rollen mit „Preise & Geld“
  const geld = useDarf('geld');
  const { kontext, quelle } = geld ? beispielKontext(f.art) : { kontext: {}, quelle: undefined };
  const voll = { ...standardKontext(), ...kontext };
  const fehlt = fehlendePlatzhalter(`${mitBetreff ? f.betreff : ''} ${f.text}`, voll);
  const geaendert = f.titel !== vorlage.titel || f.art !== vorlage.art || f.betreff !== (vorlage.betreff ?? '') || f.text !== vorlage.text;

  const einfuegen = (name: string) => {
    const { feld, pos } = cursor.current;
    const alt = f[feld];
    const p = Math.min(pos, alt.length);
    const neu = `${alt.slice(0, p)}{${name}}${alt.slice(p)}`;
    setF({ ...f, [feld]: neu });
    cursor.current = { feld, pos: p + name.length + 2 };
  };
  const merken = (feld: 'text' | 'betreff') => (e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    cursor.current = { feld, pos: e.currentTarget.selectionStart ?? e.currentTarget.value.length };
  };

  const speichern = () => {
    if (!f.titel.trim()) return setFehler('Gib der Vorlage einen Namen.');
    setFehler(undefined);
    vorlagen.update(vorlage.id, { titel: f.titel.trim(), art: f.art, betreff: mitBetreff ? f.betreff : undefined, text: f.text });
    toast('Vorlage gespeichert.');
  };

  const loeschen = async () => {
    if (!(await fragen('Vorlage löschen?', `„${vorlage.titel}“ kommt in den Papierkorb. Module, die diese Vorlage nutzen, nehmen dann eine andere mit gleichem Zweck oder ihren Standardtext.`, 'In den Papierkorb'))) return;
    vorlagen.remove(vorlage.id);
    toast('Vorlage liegt im Papierkorb.', { aktion: { label: 'Rückgängig', onClick: () => vorlagen.restore(vorlage.id) } });
    navigate('/betrieb/vorlagen');
  };

  const duplizieren = () => {
    const n = vorlagen.create({ schluessel: vorlage.schluessel, art: f.art, titel: `${f.titel} (Kopie)`, betreff: mitBetreff ? f.betreff : undefined, text: f.text });
    toast('Kopie angelegt.');
    navigate(`/betrieb/vorlagen/${n.id}`);
  };

  return (
    <Seite titel={vorlage.titel} oberzeile={VORLAGEN_ARTEN.find((a) => a.id === vorlage.art)?.label} zurueck={{ to: '/betrieb/vorlagen', label: 'Vorlagen' }}>
      <ZweiSpalten
        haupt={
          <Stapel abstand={24}>
            <Karte>
              <form
                className="mm-stapel"
                style={{ gap: 16 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  speichern();
                }}
              >
                <Eingabe label="Name" value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} fehler={fehler} disabled={!schreiben} />
                <Auswahl label="Wofür?" value={f.art} onChange={(e) => setF({ ...f, art: e.target.value as VorlagenArt })} optionen={VORLAGEN_ARTEN.map((a) => ({ wert: a.id, label: a.label }))} disabled={!schreiben} />
                {mitBetreff && (
                  <Eingabe label="Betreff" value={f.betreff} onChange={(e) => setF({ ...f, betreff: e.target.value })} onSelect={merken('betreff')} onClick={merken('betreff')} onKeyUp={merken('betreff')} disabled={!schreiben} />
                )}
                <Textfeld label="Text" rows={12} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} onSelect={merken('text')} onClick={merken('text')} onKeyUp={merken('text')} disabled={!schreiben} />
                {schreiben && (
                  <Zeile zwischen>
                    <Button type="submit" disabled={!geaendert}>
                      Vorlage speichern
                    </Button>
                    <Zeile>
                      <Button variante="tertiaer" onClick={duplizieren}>
                        Kopie anlegen
                      </Button>
                      {darfLoeschen && (
                        <Button variante="tertiaer" icon="muell" onClick={loeschen}>
                          Löschen
                        </Button>
                      )}
                    </Zeile>
                  </Zeile>
                )}
              </form>
            </Karte>
            <Karte titel="Vorschau" oberzeile={quelle ? `Mit Daten aus ${quelle}` : 'Ohne Beispieldaten'}>
              <Stapel abstand={12}>
                {mitBetreff && f.betreff && <strong>{platzhalterErsetzen(f.betreff, voll)}</strong>}
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{platzhalterErsetzen(f.text, voll) || '–'}</p>
                {fehlt.length > 0 && (
                  <Meldung titel="Noch ohne Wert in der Vorschau">
                    {fehlt.map((x) => `{${x}}`).join(', ')} – wird beim echten Dokument aus Kunde, Auftrag oder Rechnung gefüllt.
                  </Meldung>
                )}
              </Stapel>
            </Karte>
          </Stapel>
        }
        seite={
          <Karte titel="Platzhalter" kompakt>
            <Stapel abstand={8}>
              <Meta>Tippe, um an der Cursorposition einzufügen.</Meta>
              <Zeile abstand={4}>
                {PLATZHALTER.map((p) => (
                  <Button key={p.name} variante="sekundaer" klein onClick={() => einfuegen(p.name)} disabled={!schreiben} title={p.beschreibung}>
                    {`{${p.name}}`}
                  </Button>
                ))}
              </Zeile>
            </Stapel>
          </Karte>
        }
      />
      {vorlage.schluessel && !vorlage.schluessel.startsWith('eigene.') && <Meta>Schlüssel für andere Module: {vorlage.schluessel}</Meta>}
      {dialog}
    </Seite>
  );
}
