import { redirect } from "next/navigation";

import { utenteCliente } from "@/lib/cliente/sessione";

/**
 * Tutto ciò che sta sotto `(riservata)` pretende un utente loggato. `/area/login`
 * sta fuori dal gruppo, quindi non passa di qui. Il controllo vero è server-side:
 * un utente non autenticato viene rimandato al login prima di vedere qualsiasi
 * cosa.
 */
export default async function LayoutRiservata({ children }) {
  const utente = await utenteCliente();
  if (!utente) redirect("/area/login");

  return children;
}
