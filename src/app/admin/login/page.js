import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import { adminSession } from "@/lib/admin/session";

const ERRORS = {
  link: "Il link non è più valido. Chiedi un codice nuovo: funziona sempre.",
  scaduto: "Il link è scaduto. Chiedi un codice nuovo.",
};

export default async function AdminLogin({ searchParams }) {
  // Next 16: searchParams is a Promise.
  const params = await searchParams;

  // Every bounce of the backoffice lands here: the (gestione) layout and the
  // Server Actions all send to /admin/login when `adminUser()` says no. But that
  // "no" has two different meanings, and without telling them apart someone who
  // just entered the right code sees the email form again as if nothing had
  // happened.
  const { user, isAdmin } = await adminSession();

  // A valid admin session: there is nothing to do on this page.
  if (isAdmin) redirect("/admin");

  return (
    <LoginForm
      initialError={
        user
          ? `Hai fatto l'accesso con ${user.email}, ma questo indirizzo non è fra gli amministratori del backoffice. Chiedi a chi lo gestisce di abilitarlo.`
          : (ERRORS[params?.errore] ?? null)
      }
    />
  );
}
