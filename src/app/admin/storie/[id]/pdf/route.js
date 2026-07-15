import { utenteAmministratore } from "@/lib/admin/sessione";
import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { generaPdfLibro } from "@/lib/storia/pdf";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { creaClientAdmin } from "@/lib/supabase/server";

// @react-pdf gira solo su Node (font, stream), non sull'edge.
export const runtime = "nodejs";
// Comporre il PDF e scaricare le immagini costa: oltre i 10s di default.
export const maxDuration = 60;

/**
 * GET /admin/storie/<id>/pdf — scarica il libro in PDF.
 *
 * Solo amministratori: `storie` ha le RLS e nessuna policy di scrittura, e qui
 * si legge con la service role — quindi il gate di autorizzazione è tutto in
 * questo controllo, non in una policy. A differenza di /storie/<uuid> (che
 * mostra solo le storie approvate al genitore), qui si scarica in qualunque
 * stato: serve rivedere il PDF prima di approvare.
 */
export async function GET(_request, { params }) {
  const utente = await utenteAmministratore();
  if (!utente) return new Response("Non autorizzato.", { status: 401 });

  // Next 16: params è una Promise.
  const { id } = await params;

  const db = creaClientAdmin();
  if (!db) return new Response("Supabase non è configurato.", { status: 503 });

  const { data: storia, error } = await db
    .from("storie")
    .select("*, brands (*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return new Response("Lettura fallita.", { status: 500 });
  if (!storia) return new Response("Storia inesistente.", { status: 404 });

  const contenuto = contenutoStoriaSchema.safeParse(storia.contenuto);
  if (!contenuto.success) {
    return new Response("Il contenuto della storia non è valido.", { status: 422 });
  }

  const brand = brandDaRiga(storia.brands) ?? BRAND_DEFAULT;

  let pdf;
  try {
    pdf = await generaPdfLibro({ contenuto: contenuto.data, brand });
  } catch (problema) {
    console.error(`PDF della storia "${id}" non generato:`, problema.message);
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
