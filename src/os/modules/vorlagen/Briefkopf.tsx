import { useState } from 'react';
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { useDarf } from '@core/session';
import { Button, Karte, Leer, Meldung, Meta, Schalter, Seite, Stapel, Textfeld, Zeile, useToast, DateiKnopf, bildVerkleinern, BRIEFKOPF_KEY, BRIEFKOPF_STANDARD, briefkopf, type BriefkopfEinstellung } from '@ui/index';

export function Briefkopf() {
  const toast = useToast();
  const admin = useDarf('admin');
  const [e, setE] = useEinstellung<BriefkopfEinstellung>(BRIEFKOPF_KEY, BRIEFKOPF_STANDARD);
  const betrieb = db.betrieb.useOne('betrieb');
  const [zusatz, setZusatz] = useState(e.zusatz ?? '');
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string>();
  const kopf = briefkopf(e);
  const fehlt = [!betrieb?.adresse?.strasse && 'Adresse', !betrieb?.telefon && 'Telefon', !betrieb?.iban && 'IBAN', !betrieb?.steuernummer && !betrieb?.ustId && 'Steuernummer oder USt-IdNr.'].filter(Boolean);

  const logoWaehlen = async ([f]: File[]) => {
    setFehler(undefined);
    setLaedt(true);
    try {
      const { url: logo } = await bildVerkleinern(f, { max: 600, maxHoehe: 240, qualitaet: 0.82, pngBehalten: true });
      setE({ ...e, logo });
      toast('Logo gespeichert.');
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Das Logo konnte nicht gespeichert werden.');
    } finally {
      setLaedt(false);
    }
  };

  return (
    <Seite titel="Briefkopf" untertitel="Logo und Fußzeile für Angebote, Rechnungen und Mahnungen." zurueck={{ to: '/betrieb/vorlagen', label: 'Vorlagen' }}>
      <Stapel abstand={24}>
        {!admin && <Meldung>Ändern darf nur, wer das Recht „Einstellungen“ hat.</Meldung>}
        {fehlt.length > 0 && (
          <Meldung ton="achtung" titel="Für korrekte Rechnungen fehlt noch etwas" aktion={<Button variante="sekundaer" klein to="/betrieb/einstellungen">Betriebsdaten ergänzen</Button>}>
            {fehlt.join(', ')}
          </Meldung>
        )}
        <Karte titel="Logo">
          <Stapel>
            {e.logo ? <img src={e.logo} alt="Dein Logo" style={{ maxWidth: 240, maxHeight: 96, objectFit: 'contain', alignSelf: 'flex-start' }} /> : <Leer titel="Noch kein Logo" text="Lade dein Logo als PNG oder JPG hoch. Macher verkleinert es automatisch." icon="kamera" />}
            {fehler && <Meldung ton="achtung">{fehler}</Meldung>}
            {admin && (
              <Zeile>
                <DateiKnopf accept="image/png,image/jpeg,image/webp" onDateien={logoWaehlen} laedt={laedt} laedtText="Wird verkleinert …">
                  {e.logo ? 'Anderes Logo hochladen' : 'Logo hochladen'}
                </DateiKnopf>
                {e.logo && (
                  <Button variante="tertiaer" icon="muell" onClick={() => (setE({ ...e, logo: undefined }), toast('Logo entfernt.'))}>
                    Logo entfernen
                  </Button>
                )}
              </Zeile>
            )}
          </Stapel>
        </Karte>
        <Karte titel="Fußzeile">
          <Stapel>
            <Schalter label="Bankverbindung zeigen" checked={e.zeigeBank} onChange={(v) => setE({ ...e, zeigeBank: v })} disabled={!admin} />
            <Schalter label="Steuernummer und USt-IdNr. zeigen" checked={e.zeigeSteuer} onChange={(v) => setE({ ...e, zeigeSteuer: v })} disabled={!admin} />
            <Textfeld label="Zusätzliche Zeile" optional value={zusatz} onChange={(ev) => setZusatz(ev.target.value)} hilfe="z. B. Inhaber, Handwerkskammer, Registergericht" rows={2} disabled={!admin} />
            {admin && zusatz !== (e.zusatz ?? '') && (
              <div>
                <Button onClick={() => (setE({ ...e, zusatz: zusatz.trim() || undefined }), toast('Fußzeile gespeichert.'))}>Fußzeile speichern</Button>
              </div>
            )}
            <Meta>Name, Adresse, Bank und Steuer kommen aus deinen Betriebsdaten – ändern unter Einstellungen.</Meta>
          </Stapel>
        </Karte>
        <Karte titel="Vorschau" oberzeile="So sieht ein Dokument aus">
          <div style={{ border: '1px solid var(--mm-border)', borderRadius: 'var(--mm-radius-card)', padding: 'var(--mm-space-6)', display: 'grid', gap: 'var(--mm-space-6)', background: 'var(--mm-surface)' }}>
            <Zeile zwischen>
              <Meta>{kopf.absenderzeile || 'Dein Betrieb · Adresse'}</Meta>
              {kopf.logo && <img src={kopf.logo} alt="" style={{ maxWidth: 160, maxHeight: 64, objectFit: 'contain' }} />}
            </Zeile>
            <div style={{ minHeight: 80 }}>
              <Meta>Empfänger, Betreff, Positionen …</Meta>
            </div>
            <div style={{ borderTop: '1px solid var(--mm-border)', paddingTop: 'var(--mm-space-3)' }}>
              {kopf.fusszeilen.length ? kopf.fusszeilen.map((z) => <Meta key={z}>{z}</Meta>) : <Meta>Noch keine Angaben für die Fußzeile.</Meta>}
            </div>
          </div>
        </Karte>
      </Stapel>
    </Seite>
  );
}
