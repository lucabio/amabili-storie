import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { customerUser } from "@/lib/customer/session";
import { generateBookPdf } from "@/lib/story/pdf";
import { storyContentSchema } from "@/lib/story/schema";
import { createServerSupabase } from "@/lib/supabase/server";

// @react-pdf only runs on Node.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /area/storie/<id>/pdf — the customer downloads the PDF of one of their
 * stories again.
 *
 * Double lock: they must be logged in (customerUser) AND the read goes through
 * RLS with their session, which only returns the stories with their email. On
 * top of that we demand the `approvata` state: a story that is not ready yet is
 * not downloaded.
 */
export async function GET(_request, { params }) {
  const user = await customerUser();
  if (!user) return new Response("Non autorizzato.", { status: 401 });

  // Next 16: params is a Promise.
  const { id } = await params;

  const supabase = await createServerSupabase();
  if (!supabase) return new Response("Supabase non è configurato.", { status: 503 });

  const { data: story } = await supabase
    .from("storie")
    .select("*, brands (*)")
    .eq("id", id)
    .eq("stato", "approvata")
    .maybeSingle();

  if (!story) return new Response("Storia non trovata.", { status: 404 });

  const content = storyContentSchema.safeParse(story.contenuto);
  if (!content.success) return new Response("Il contenuto della storia non è valido.", { status: 422 });

  const brand = brandFromRow(story.brands) ?? BRAND_DEFAULT;

  let pdf;
  try {
    pdf = await generateBookPdf({ content: content.data, brand });
  } catch (problem) {
    console.error(`PDF cliente della storia "${id}" non generato:`, problem.message);
    return new Response("Non siamo riusciti a comporre il PDF.", { status: 500 });
  }

  const fileName = `${(content.data.titolo || "storia")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "storia"}.pdf`;

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
