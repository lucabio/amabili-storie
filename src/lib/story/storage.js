import { createAdminSupabase } from "@/lib/supabase/server";

/** The illustrations bucket. Created by migration 0006, public read. */
const BUCKET = "illustrazioni";

/**
 * Uploads a page's illustration to Supabase Storage and returns its public URL.
 * It writes with the service role (which bypasses RLS): there is no way in from
 * the browser. Every generation gets a unique path — so regenerating needs no
 * cache-bust and overwrites nothing (old files stay orphaned: cleanup is a
 * future round, it blocks nothing).
 *
 * @returns {Promise<string>} the public URL of the uploaded image.
 */
export async function saveIllustration({ storyId, index, bytes, mediaType }) {
  const db = createAdminSupabase();
  if (!db) throw new Error("Supabase non è configurato.");

  const extension = mediaType?.split("/")[1] || "png";
  const path = `${storyId}/pagina-${index}-${Date.now()}.${extension}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mediaType, upsert: true });
  if (error) throw new Error(`Caricamento illustrazione fallito: ${error.message}`);

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
