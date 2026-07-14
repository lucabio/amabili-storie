import Link from "next/link";
import { redirect } from "next/navigation";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { supabaseConfigurato } from "@/lib/supabase/server";

const VOCI_NAV = [
  { href: "/admin", testo: "Merchant" },
  { href: "/admin/storie", testo: "Storie" },
];

/** Tutto ciò che sta in questo gruppo richiede una sessione da amministratore. */
export default async function LayoutGestione({ children }) {
  // Senza Supabase il layout padre mostra già le istruzioni di setup.
  if (!supabaseConfigurato()) return null;

  const utente = await utenteAmministratore();
  if (!utente) redirect("/admin/login");

  return (
    <div>
      <nav className="mb-8 flex gap-2">
        {VOCI_NAV.map((voce) => (
          <Link
            key={voce.href}
            href={voce.href}
            className="rounded-full border border-bordo bg-white px-4 py-2 text-sm font-bold text-inchiostro-soft"
          >
            {voce.testo}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
