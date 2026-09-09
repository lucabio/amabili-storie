import { redirect } from "next/navigation";

import ModuloLogin from "@/components/admin/ModuloLogin";
import { sessioneAdmin } from "@/lib/admin/sessione";

const ERRORI = {
  link: "Il link non è più valido. Chiedi un codice nuovo: funziona sempre.",
  scaduto: "Il link è scaduto. Chiedi un codice nuovo.",
};

export default async function Login({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const parametri = await searchParams;

  // Qui atterra ogni rimbalzo del backoffice: il layout di (gestione) e le
  // Server Action mandano tutti su /admin/login quando `utenteAmministratore()`
  // dice di no. Ma quel "no" ha due significati diversi, e senza distinguerli
  // chi ha appena inserito il codice giusto rivede il modulo email come se non
  // fosse successo niente.
  const { utente, amministratore } = await sessioneAdmin();

  // Sessione valida da amministratore: non c'è niente da fare su questa pagina.
  if (amministratore) redirect("/admin");

  return (
    <ModuloLogin
      erroreIniziale={
        utente
          ? `Hai fatto l'accesso con ${utente.email}, ma questo indirizzo non è fra gli amministratori del backoffice. Chiedi a chi lo gestisce di abilitarlo.`
          : (ERRORI[parametri?.errore] ?? null)
      }
    />
  );
}
