import { Suspense } from "react";
import { SignupFlow } from "@/components/auth/SignupFlow";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Kostenlos testen",
    description: "Teste Macher OS kostenlos – in wenigen Schritten für dein Gewerk eingerichtet. Keine Kreditkarte nötig.",
    path: "/signup",
  }),
  robots: { index: false },
};

function Lade() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-10 sm:px-6" aria-busy="true">
      <div className="h-4 w-32 rounded bg-line" />
      <div className="mt-8 h-96 rounded-xl border border-line bg-white" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Lade />}>
      <SignupFlow />
    </Suspense>
  );
}
