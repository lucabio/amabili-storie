"use server";

import { revalidatePath } from "next/cache";
import { start } from "workflow/api";

import { adminUser } from "@/lib/admin/session";
import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { sendMail } from "@/lib/mail/send";
import { storyReadyMail } from "@/lib/mail/templates";
import { generateIllustration } from "@/lib/story/illustrations";
import { storyContentSchema } from "@/lib/story/schema";
import { transitionAllowed } from "@/lib/story/states";
import { saveIllustration } from "@/lib/story/storage";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";
import { generateBook } from "@/workflows/book";

/** None of these actions runs if the caller is not an admin. */
async function requireAdmin() {
  const user = await adminUser();
  if (!user) throw new Error("Non autorizzato.");
  return user;
}

async function readStory(storyId) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("storie")
    .select("*, brands (*)")
    .eq("id", storyId)
    .maybeSingle();
  return data;
}

export async function saveStory(storyId, rawContent) {
  await requireAdmin();

  const story = await readStory(storyId);
  if (!story) return { error: "Storia inesistente." };

  if (story.stato !== "in_revisione") {
    return {
      error: `Una storia "${story.stato}" non si può più correggere: se il libro è già partito, la correzione è un libro nuovo, non una modifica.`,
    };
  }

  const parsed = storyContentSchema.safeParse(rawContent);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from("storie")
    // `contenuto_originale` is never touched: it is the AI's version, and the
    // difference with this one is the diary of what we always correct.
    .update({ contenuto: parsed.data })
    // Constraining the UPDATE to the state just read makes the transition
    // atomic: two concurrent requests cannot both pass the check.
    .eq("id", storyId)
    .eq("stato", story.stato)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) {
    return {
      error: "Qualcun altro ha già modificato questa storia nel frattempo: ricarica la pagina.",
    };
  }

  revalidatePath(`/admin/storie/${storyId}`);
  return { ok: true };
}

export async function approveStory(storyId) {
  const user = await requireAdmin();

  const story = await readStory(storyId);
  if (!story) return { error: "Storia inesistente." };

  if (!transitionAllowed(story.stato, "approvata")) {
    return { error: `Una storia "${story.stato}" non si può approvare.` };
  }

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from("storie")
    .update({
      stato: "approvata",
      revisionata_da: user.id,
      revisionata_il: new Date().toISOString(),
    })
    // Constraining the UPDATE to the state just read makes the transition
    // atomic: two concurrent requests (approve + reject, or two approves) cannot
    // both pass the check — "approvata" is irreversible.
    .eq("id", storyId)
    .eq("stato", story.stato)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) {
    return {
      error: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina.",
    };
  }

  // The email must not be able to cost the approval: if Resend is down, the
  // story stays approved and the email is resent by hand.
  try {
    const brand = brandFromRow(story.brands) ?? BRAND_DEFAULT;
    const { subject, html } = storyReadyMail({
      name: story.parametri.nome,
      brand,
      url: `${process.env.NEXT_PUBLIC_SITO_URL ?? "http://localhost:3000"}/storie/${storyId}`,
    });
    await sendMail({ to: story.email, subject, html });
  } catch (problem) {
    console.error("Mail di approvazione non spedita:", problem.message);
  }

  revalidatePath("/admin/storie");
  return { ok: true };
}

export async function rejectStory(storyId, note) {
  const user = await requireAdmin();

  const cleanNote = typeof note === "string" ? note.trim() : "";
  if (!cleanNote) {
    return { error: "Serve una nota per rifiutare una storia: fra un mese nessuno ricorderà il motivo." };
  }

  const story = await readStory(storyId);
  if (!story) return { error: "Storia inesistente." };

  if (!transitionAllowed(story.stato, "rifiutata")) {
    return { error: `Una storia "${story.stato}" non si può rifiutare.` };
  }

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from("storie")
    .update({
      stato: "rifiutata",
      note_revisione: cleanNote,
      revisionata_da: user.id,
      revisionata_il: new Date().toISOString(),
    })
    // Constraining the UPDATE to the state just read makes the transition
    // atomic: two concurrent requests cannot both pass the check.
    .eq("id", storyId)
    .eq("stato", story.stato)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) {
    return {
      error: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina.",
    };
  }

  revalidatePath("/admin/storie");
  return { ok: true };
}

export async function regenerateStory(storyId) {
  await requireAdmin();

  const story = await readStory(storyId);
  if (!story) return { error: "Storia inesistente." };

  if (!transitionAllowed(story.stato, "in_generazione")) {
    return { error: `Una storia "${story.stato}" non si può rigenerare.` };
  }

  // We restart from the order that generated the story: without it there is
  // nothing to relaunch.
  if (!story.ordine_id) {
    return {
      error: "Questa storia non ha un ordine collegato: non si sa cosa rigenerare.",
    };
  }

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from("storie")
    .update({ stato: "in_generazione", errore: null })
    // Constraining the UPDATE to the state just read makes the transition
    // atomic: two clicks on the same "Rigenera" cannot both pass the check and
    // start two workflows for the same order.
    .eq("id", storyId)
    .eq("stato", story.stato)
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) {
    return {
      error: "Qualcun altro ha già avviato la rigenerazione di questa storia nel frattempo: ricarica la pagina.",
    };
  }

  // The workflow reuses the existing row (see createGeneratingStory in
  // src/workflows/book.js): the story keeps its id, so the link in the email
  // already sent to the parent still points here.
  try {
    await start(generateBook, [story.ordine_id]);
  } catch (problem) {
    // start() did not fire: no workflow will ever take charge of this story, and
    // without a workflow nobody will ever mark it "fallita" (that is its job,
    // see the twin comment in src/workflows/book.js). If we do not do it here,
    // the row stays stuck in "in_generazione" forever — the ghost this function
    // exists to remove, and we would be back to unblocking it with SQL by hand.
    // "fallita" is the right state: from there the admin can regenerate again
    // (TRANSITIONS allows it), and the queue shows the readable error in
    // `errore` right away.
    const message = `Avvio della rigenerazione fallito: ${problem.message}`;

    const { error: recoveryError } = await db
      .from("storie")
      .update({ stato: "fallita", errore: message })
      .eq("id", storyId)
      // If in the meantime the workflow did start and moved on, this UPDATE
      // touches nothing: we do not bury a good book.
      .eq("stato", "in_generazione");

    revalidatePath("/admin/storie");
    revalidatePath(`/admin/storie/${storyId}`);

    // Double failure: neither did the workflow start, nor did we manage to mark
    // it. The story stays in "in_generazione", from which it cannot be
    // regenerated — exactly the ghost. There is nothing else to do but say it
    // out loud, because here the only way out is a human hand.
    if (recoveryError) {
      console.error(
        `Storia ${storyId} bloccata in in_generazione: né avviata né segnata fallita (${recoveryError.message}).`,
      );
      return {
        error: `${message} — e non siamo riusciti a segnarla come fallita: la storia è bloccata, avvisa chi sviluppa.`,
      };
    }

    return { error: message };
  }

  revalidatePath("/admin/storie");
  revalidatePath(`/admin/storie/${storyId}`);
  return { ok: true };
}

/**
 * Generates (or regenerates) the illustration of a single page and saves its URL
 * into the content. Only on an `in_revisione` story: the pictures are reviewed
 * in the backoffice BEFORE approval, one page at a time, with retry.
 *
 * The `scene` comes from the client (the "La scena da illustrare" text the admin
 * has in front of them, even if not saved yet): so we draw what they see, not an
 * older version from the database.
 */
export async function generateStoryIllustration(storyId, index, rawScene) {
  await requireAdmin();

  const story = await readStory(storyId);
  if (!story) return { error: "Storia inesistente." };
  if (story.stato !== "in_revisione") {
    return { error: `Una storia "${story.stato}" non si illustra più: si generano prima dell'approvazione.` };
  }

  const pages = story.contenuto?.pagine;
  if (!Array.isArray(pages) || index < 0 || index >= pages.length) {
    return { error: "Pagina inesistente." };
  }

  const scene = typeof rawScene === "string" ? rawScene.trim() : "";
  if (!scene) {
    return { error: "Serve la descrizione della scena per generare l'illustrazione." };
  }

  let url;
  try {
    const { bytes, mediaType } = await generateIllustration({
      scene,
      params: story.parametri,
    });
    url = await saveIllustration({ storyId, index, bytes, mediaType });
  } catch (problem) {
    return { error: `Illustrazione non generata: ${problem.message}` };
  }

  // Read-modify-write of the JSON: we reread the pages just read, write the URL
  // at the right index, and constrain the UPDATE to the `in_revisione` state
  // (atomic with respect to approval/rejection). With a single reviewer at a
  // time there is no race between pages; if one day there are two, we will move
  // to a jsonb_set.
  const updatedPages = pages.map((page, i) =>
    i === index ? { ...page, illustrazioneUrl: url } : page,
  );

  const db = createAdminSupabase();
  const { data: rows, error } = await db
    .from("storie")
    .update({ contenuto: { ...story.contenuto, pagine: updatedPages } })
    .eq("id", storyId)
    .eq("stato", "in_revisione")
    .select("id");

  if (error) return { error: error.message };
  if (!rows || rows.length === 0) {
    return { error: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina." };
  }

  revalidatePath(`/admin/storie/${storyId}`);
  return { ok: true, url };
}
