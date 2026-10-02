/** Aufgelöste Inhalte eines Berichts – identisch auf dem Bildschirm und im Druck. */
import { db, useDatenstand } from '@core/db';
import { personName, zahl } from '@core/format';
import { Meta } from '@ui/index';
import { minuten, stundenText, type Bericht } from './daten';

export function useBerichtInhalt(b: Bericht | undefined) {
  useDatenstand();
  const zeiten = (b?.zeitIds ?? []).map((id) => db.zeiten.get(id)).filter((x) => !!x && !x.geloeschtAm).map((x) => x!);
  const material = (b?.materialIds ?? []).map((id) => db.material.get(id)).filter((x) => !!x && !x.geloeschtAm).map((x) => x!);
  const fotos = (b?.fotoIds ?? []).map((id) => db.dokumente.get(id)).filter((x) => !!x && !x.geloeschtAm).map((x) => x!);
  const aufgaben = (b?.aufgabeIds ?? []).map((id) => db.aufgaben.get(id)).filter((x) => !!x && !x.geloeschtAm).map((x) => x!);
  const summeMin = zeiten.reduce((s, z) => s + minuten(z), 0);
  return { zeiten, material, fotos, aufgaben, summeMin };
}

export function ZeitenTabelle({ b }: { b: Bericht }) {
  const { zeiten, summeMin } = useBerichtInhalt(b);
  if (!zeiten.length) return <Meta>Keine Zeiten für diesen Tag gebucht.</Meta>;
  return (
    <div className="mm-tabelle-rahmen">
      <table className="mm-tabelle">
        <thead>
          <tr>
            <th>Wer</th>
            <th>Von – bis</th>
            <th className="num">Pause</th>
            <th className="num">Stunden</th>
          </tr>
        </thead>
        <tbody>
          {zeiten.map((z) => (
            <tr key={z.id}>
              <td>{personName(db.mitarbeiter.get(z.mitarbeiterId))}</td>
              <td>
                {z.start} – {z.ende ?? 'läuft'}
              </td>
              <td className="num">{z.pauseMinuten} min</td>
              <td className="num">{stundenText(minuten(z))}</td>
            </tr>
          ))}
          <tr>
            <th colSpan={3}>Summe</th>
            <th className="num">{stundenText(summeMin)}</th>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function MaterialTabelle({ b }: { b: Bericht }) {
  const { material } = useBerichtInhalt(b);
  if (!material.length) return <Meta>Kein Material für diesen Tag gebucht.</Meta>;
  return (
    <div className="mm-tabelle-rahmen">
      <table className="mm-tabelle">
        <thead>
          <tr>
            <th>Material</th>
            <th className="num">Menge</th>
          </tr>
        </thead>
        <tbody>
          {material.map((m) => (
            <tr key={m.id}>
              <td>{m.text}</td>
              <td className="num">
                {zahl(m.menge)} {m.einheit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AufgabenListe({ b }: { b: Bericht }) {
  const { aufgaben } = useBerichtInhalt(b);
  if (!aufgaben.length) return <Meta>Keine Aufgaben an diesem Tag erledigt.</Meta>;
  return (
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {aufgaben.map((a) => (
        <li key={a.id}>{a.titel}</li>
      ))}
    </ul>
  );
}
