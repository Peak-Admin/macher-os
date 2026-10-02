import { LoginForm } from "@/components/auth/LoginForm";
import { pageMeta } from "@/lib/metadata";

export const metadata = {
  ...pageMeta({
    title: "Anmelden",
    description: "Melde dich bei Macher OS an.",
    path: "/login",
  }),
  robots: { index: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
