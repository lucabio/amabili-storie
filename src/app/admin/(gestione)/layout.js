import { redirect } from "next/navigation";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { supabaseConfigurato } from "@/lib/supabase/server";

/** Tutto ciò che sta in questo gruppo richiede una sessione da amministratore. */
export default async function LayoutGestione({ children }) {
  // Senza Supabase il layout padre mostra già le istruzioni di setup.
  if (!supabaseConfigurato()) return null;

  const utente = await utenteAmministratore();
  if (!utente) redirect("/admin/login");

  return children;
}
