import { adminUser } from "@/lib/admin/session";
import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { generateBookPdf } from "@/lib/story/pdf";
import { storyContentSchema } from "@/lib/story/schema";
import { createAdminSupabase } from "@/lib/supabase/server";

// @react-pdf only runs on Node (fonts, streams), not on the edge.
export const runtime = "nodejs";
// Composing the PDF and downloading the images costs: past the 10s default.
export const maxDuration = 60;

/**
 * GET /admin/stories/<id>/pdf — download the book as a PDF.
 *
 * Admins only: `storie` has RLS and no write policy, and here we read with the
 * service role — so the authorization gate is entirely in this check, not in a
 * policy. Unlike /stories/<uuid> (which only shows approved stories to the
 * parent), here it downloads in any state: you need to review the PDF before
 * approving.
 */
export async function GET(_request, { params }) {
  const user = await adminUser();
  if (!user) return new Response("Non autorizzato.", { status: 401 });

  // Next 16: params is a Promise.
  const { id } = await params;

  const db = createAdminSupabase();
  if (!db) return new Response("Supabase non è configurato.", { status: 503 });

  const { data: story, error } = await db
    .from("storie")
    .select("*, brands (*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return new Response("Lettura fallita.", { status: 500 });
  if (!story) return new Response("Storia inesistente.", { status: 404 });

  const content = storyContentSchema.safeParse(story.contenuto);
  if (!content.success) {
    return new Response("Il contenuto della storia non è valido.", { status: 422 });
  }

  const brand = brandFromRow(story.brands) ?? BRAND_DEFAULT;

  let pdf;
  try {
    pdf = await generateBookPdf({ content: content.data, brand });
  } catch (problem) {
    console.error(`PDF della storia "${id}" non generato:`, problem.message);
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
