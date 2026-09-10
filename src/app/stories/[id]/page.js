import { cache } from "react";

import { notFound } from "next/navigation";

import BrandTheme from "@/components/BrandTheme";
import Footer from "@/components/Footer";
import StoryReader from "@/components/StoryReader";
import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { storyContentSchema } from "@/lib/story/schema";
import { createAdminSupabase } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The link in the "your book is ready" email is the only protection: whoever has
 * the uuid reads, whoever does not cannot guess it (like a Dropbox share link).
 * That is why this page reads with the service role — RLS on `storie` only
 * allows admins to read — and shows ONLY `approvata` stories. A malformed,
 * non-existent or not-yet-approved uuid must be indistinguishable: all three end
 * up in `notFound()`, otherwise the page would become an oracle telling which
 * stories exist.
 *
 * `cache()` dedupes the read between `generateMetadata` and the page component:
 * Next calls both for the same request.
 */
const readApprovedStory = cache(async (id) => {
  if (!UUID_RE.test(id)) return null;

  const db = createAdminSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from("stories")
    .select("*, brands (*)")
    .eq("id", id)
    .eq("state", "approvata")
    .maybeSingle();

  if (error) {
    console.error(`Lettura storia "${id}" fallita:`, error.message);
    return null;
  }

  return data;
});

async function validatedStory(id) {
  const story = await readApprovedStory(id);
  if (!story) return null;

  const content = storyContentSchema.safeParse(story.content);
  if (!content.success) {
    console.error(`Contenuto della storia "${id}" non valido:`, content.error.issues);
    return null;
  }

  return {
    content: content.data,
    name: typeof story.params?.name === "string" ? story.params.name : "",
    brand: brandFromRow(story.brands) ?? BRAND_DEFAULT,
  };
}

export async function generateMetadata({ params }) {
  // Next 16: params is a Promise.
  const { id } = await params;
  const data = await validatedStory(id);
  if (!data) return { title: "Storia non trovata — Amabili Storie" };

  return { title: `${data.content.title} — ${data.brand.name}` };
}

export default async function StoryPage({ params }) {
  const { id } = await params;
  const data = await validatedStory(id);
  if (!data) notFound();

  return (
    <BrandTheme brand={data.brand}>
      <StoryReader story={data.content} name={data.name} />
      <Footer brand={data.brand} />
    </BrandTheme>
  );
}
