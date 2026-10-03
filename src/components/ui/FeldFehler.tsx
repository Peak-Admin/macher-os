import { Icon } from "./Icon";

/** Eigene Fehlermeldung unter einem Formularfeld (statt der Browser-Blase). Mit `aria-describedby` am Feld verknüpfen. */
export function FeldFehler({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-danger">
      <Icon name="achtung" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
