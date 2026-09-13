import { createAdminSupabase } from "@/lib/supabase/server";

/**
 * The illustrations bucket. Created by migration 0006, public read.
 *
 * The name stays Italian: it is baked into every public URL already stored in
 * `content.pages[].illustrationUrl`, and renaming the bucket would break the
 * images of the stories that already exist.
 */
const BUCKET = "illustrazioni";

/** The merchants' place photos (ASD-10). Created by migration 0012, public read. */
const PLACE_PHOTOS_BUCKET = "place-photos";

/**
 * Writes with the service role (which bypasses RLS): there is no way in from the
 * browser. Every file gets a unique path — so regenerating needs no cache-bust and
 * overwrites nothing (old files stay orphaned: cleanup is a future round, it
 * blocks nothing).
 */
async function upload(bucket, prefix, bytes, mediaType) {
  const db = createAdminSupabase();
  if (!db) throw new Error("Supabase non è configurato.");

  const extension = mediaType?.split("/")[1] || "png";
  const path = `${prefix}-${Date.now()}.${extension}`;

  const { error } = await db.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mediaType, upsert: true });
  if (error) throw new Error(`Caricamento dell'immagine fallito: ${error.message}`);

  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Uploads an illustration — a page (`page-3`) or the character sheet
 * (`character-sheet`) — and returns its public URL.
 *
 * @returns {Promise<string>} the public URL of the uploaded image.
 */
export function saveIllustration({ storyId, name, bytes, mediaType }) {
  return upload(BUCKET, `${storyId}/${name}`, bytes, mediaType);
}

/**
 * Uploads a merchant's place photo and returns its public URL. Size and type are
 * enforced by the bucket itself (migration 0012).
 *
 * @returns {Promise<string>} the public URL of the uploaded photo.
 */
export function savePlacePhoto({ brandId, bytes, mediaType }) {
  return upload(PLACE_PHOTOS_BUCKET, `${brandId}/place`, bytes, mediaType);
}

/**
 * Removes a place photo from Storage, given the public URL `savePlacePhoto`
 * returned. The caller must have checked the URL is one of the brand's photos.
 */
export async function removePlacePhoto(url) {
  const db = createAdminSupabase();
  if (!db) throw new Error("Supabase non è configurato.");

  const path = url.split(`/object/public/${PLACE_PHOTOS_BUCKET}/`)[1];
  if (!path) throw new Error("Non è una foto dei luoghi.");

  const { error } = await db.storage.from(PLACE_PHOTOS_BUCKET).remove([decodeURIComponent(path)]);
  if (error) throw new Error(`Eliminazione della foto fallita: ${error.message}`);
}
