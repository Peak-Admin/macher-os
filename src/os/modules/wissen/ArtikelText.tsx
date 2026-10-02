import { Fragment } from 'react';
import { fettTeile, textBloecke } from './daten';

function Inline({ text }: { text: string }) {
  return (
    <>
      {fettTeile(text).map((t, i) => (t.fett ? <strong key={i}>{t.text}</strong> : <Fragment key={i}>{t.text}</Fragment>))}
    </>
  );
}

/** Zeigt den einfachen Artikeltext (Überschriften, Listen, fett) */
export function ArtikelText({ text }: { text: string }) {
  const bloecke = textBloecke(text);
  return (
    <div className="mm-stapel" style={{ gap: 12, maxWidth: '72ch' }}>
      {bloecke.map((b, i) => {
        switch (b.typ) {
          case 'h1':
            return (
              <h2 key={i} style={{ margin: '8px 0 0' }}>
                <Inline text={b.text} />
              </h2>
            );
          case 'h2':
            return (
              <h3 key={i} style={{ margin: '8px 0 0' }}>
                <Inline text={b.text} />
              </h3>
            );
          case 'p':
            return (
              <p key={i} style={{ margin: 0 }}>
                <Inline text={b.text} />
              </p>
            );
          case 'ul':
          case 'ol': {
            const Liste = b.typ;
            return (
              <Liste key={i} style={{ margin: 0, paddingLeft: 24, display: 'grid', gap: 4 }}>
                {b.punkte.map((p, j) => (
                  <li key={j}>
                    <Inline text={p} />
                  </li>
                ))}
              </Liste>
            );
          }
        }
      })}
    </div>
  );
}
