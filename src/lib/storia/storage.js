import { creaClientAdmin } from "@/lib/supabase/server";

/** Il bucket delle illustrazioni. Creato dalla migration 0006, lettura pubblica. */
const BUCKET = "illustrazioni";

/**
 * Carica l'illustrazione di una pagina su Supabase Storage e ne ritorna l'URL
 * pubblico. Scrive con la service role (le RLS le bypassa): dal browser non ci
 * si arriva. Ogni generazione ha un path unico — così rigenerare non serve una
 * cache-bust e non sovrascrive nulla (i file vecchi restano orfani: pulizia a
 * un giro futuro, non blocca niente).
 *
 * @returns {Promise<string>} l'URL pubblico dell'immagine caricata.
 */
export async function salvaIllustrazione({ storiaId, indice, bytes, mediaType }) {
  const db = creaClientAdmin();
  if (!db) throw new Error("Supabase non è configurato.");

  const estensione = mediaType?.split("/")[1] || "png";
  const percorso = `${storiaId}/pagina-${indice}-${Date.now()}.${estensione}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(percorso, bytes, { contentType: mediaType, upsert: true });
  if (error) throw new Error(`Caricamento illustrazione fallito: ${error.message}`);

  const { data } = db.storage.from(BUCKET).getPublicUrl(percorso);
  return data.publicUrl;
}
