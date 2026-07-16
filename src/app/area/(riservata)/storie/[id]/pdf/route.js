import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { utenteCliente } from "@/lib/cliente/sessione";
import { generaPdfLibro } from "@/lib/storia/pdf";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { creaClientServer } from "@/lib/supabase/server";

// @react-pdf gira solo su Node.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /area/storie/<id>/pdf — il cliente riscarica il PDF di una sua storia.
 *
 * Doppia serratura: dev'essere loggato (utenteCliente) E la lettura passa dalle
 * RLS con la sua sessione, che restituiscono solo le storie con la sua email.
 * In più esigiamo lo stato `approvata`: una storia non ancora pronta non si
 * scarica.
 */
export async function GET(_request, { params }) {
  const utente = await utenteCliente();
  if (!utente) return new Response("Non autorizzato.", { status: 401 });

  // Next 16: params è una Promise.
  const { id } = await params;

  const supabase = await creaClientServer();
  if (!supabase) return new Response("Supabase non è configurato.", { status: 503 });

  const { data: storia } = await supabase
    .from("storie")
    .select("*, brands (*)")
    .eq("id", id)
    .eq("stato", "approvata")
    .maybeSingle();

  if (!storia) return new Response("Storia non trovata.", { status: 404 });

  const contenuto = contenutoStoriaSchema.safeParse(storia.contenuto);
  if (!contenuto.success) return new Response("Il contenuto della storia non è valido.", { status: 422 });

  const brand = brandDaRiga(storia.brands) ?? BRAND_DEFAULT;

  let pdf;
  try {
    pdf = await generaPdfLibro({ contenuto: contenuto.data, brand });
  } catch (problema) {
    console.error(`PDF cliente della storia "${id}" non generato:`, problema.message);
    return new Response("Non siamo riusciti a comporre il PDF.", { status: 500 });
  }

  const nomeFile = `${(contenuto.data.titolo || "storia")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "storia"}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeFile}"`,
    },
  });
}
