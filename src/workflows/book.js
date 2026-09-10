import { FatalError, getWorkflowMetadata } from "workflow";

import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { sendMail } from "@/lib/mail/send";
import { storyInProgressMail } from "@/lib/mail/templates";
import { createAdminSupabase } from "@/lib/supabase/server";
import { AiUnavailable, generateStory, BOOK_PAGES } from "@/lib/story/generate";

/**
 * The birth of a book.
 *
 * The workflow is sandboxed and only orchestrates; everything that touches the
 * network — Supabase, the AI, Resend — lives in the steps, which have full Node.
 * It is the golden rule of the Workflow DevKit: breaking it means spending the
 * day fighting the sandbox.
 *
 * In phase 1 the steps are few. In phase 2 one is added for the character sheet
 * and one per page, and if page 17 fails only that one is regenerated instead of
 * the whole book. That is the only reason the WDK is here.
 */
export async function generateBook(orderId) {
  "use workflow";

  const { order, brand } = await loadOrder(orderId);
  const storyId = await createGeneratingStory(order);

  // The courtesy email must not be able to cost the book: the step retries by
  // itself (the WDK default policy), and if Resend is still down after all
  // attempts we log it and carry on anyway — the story stays in the queue.
  // This try is deliberately separate from the one below: a failure here must
  // *never* take the story to "fallita".
  try {
    await notifyStoryStarted(order, brand);
  } catch (problem) {
    console.error(`Mail "storia in lavorazione" non spedita: ${problem.message}`);
  }

  // From here on the `storie` row exists in state in_generazione: whatever goes
  // wrong has to take it to "fallita", otherwise it stays a ghost stuck forever
  // (no error, invisible both to "da rivedere" and to "fallite").
  try {
    const content = await writeText(order, brand);
    await depositInQueue(storyId, content);
    return { storyId, state: "in_revisione" };
  } catch (problem) {
    await markFailed(storyId, problem.message);
    throw problem;
  }
}

async function loadOrder(orderId) {
  "use step";

  const db = createAdminSupabase();
  if (!db) throw new FatalError("Supabase non è configurato.");

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(`Lettura ordine fallita: ${error.message}`);
  if (!order) throw new FatalError(`Ordine ${orderId} inesistente.`);

  // The brand decides the guide prompt: without it the story loses the
  // merchant's thread.
  let brand = BRAND_DEFAULT;
  if (order.brand_id) {
    const { data: row } = await db
      .from("brands")
      .select("*")
      .eq("id", order.brand_id)
      .maybeSingle();
    brand = brandFromRow(row) ?? BRAND_DEFAULT;
  }

  return { order, brand };
}

async function createGeneratingStory(order) {
  "use step";

  // getWorkflowMetadata() works inside a step too (not only in the workflow):
  // this is the only point that already knows the run_id and can write it
  // together with the row, without the race between `start()` (which returns
  // immediately) and a later insert.
  const { workflowRunId } = getWorkflowMetadata();

  const db = createAdminSupabase();

  const row = {
    order_id: order.id,
    brand_id: order.brand_id,
    email: order.email,
    params: order.params,
    content: {},
    source: "ai",
    state: "in_generazione",
    error: null,
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    run_id: workflowRunId,
  };

  // A regeneration (src/app/admin/stories/actions.js, regenerateStory) relaunches
  // this same workflow on the order of a "fallita" or "rifiutata" story.
  // `storie.ordine_id` is unique (migration 0003): if a row for this order
  // already exists, we reuse it instead of inserting a second one, so the story
  // keeps its id — and that id is what the link in the email already sent to the
  // parent points to, back when the story had reached approval or rejection.
  const { data: existing, error: readError } = await db
    .from("stories")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (readError) throw new Error(`Lettura storia esistente fallita: ${readError.message}`);

  if (existing) {
    const { error } = await db.from("stories").update(row).eq("id", existing.id);
    if (error) throw new Error(`Aggiornamento storia fallito: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await db.from("stories").insert(row).select("id").single();

  if (error) throw new Error(`Creazione storia fallita: ${error.message}`);
  return data.id;
}

async function notifyStoryStarted(order, brand) {
  "use step";

  const { subject, html } = storyInProgressMail({
    name: order.params.name,
    brand,
  });

  await sendMail({ to: order.email, subject, html });
}

async function writeText(order, brand) {
  "use step";

  try {
    // allowFallback: false — whoever paid does not get a template.
    const { story } = await generateStory({
      params: order.params,
      brand,
      pageCount: BOOK_PAGES,
      allowFallback: false,
    });
    return story;
  } catch (problem) {
    // Without AI, retrying is pointless: it is missing configuration, not a hiccup.
    if (problem instanceof AiUnavailable) throw new FatalError(problem.message);
    throw problem;
  }
}

async function depositInQueue(storyId, content) {
  "use step";

  const db = createAdminSupabase();
  const { error } = await db
    .from("stories")
    .update({
      content: content,
      // Written once and never touched again: it is the AI's version, the one to
      // compare the manual corrections against.
      original_content: content,
      state: "in_revisione",
    })
    .eq("id", storyId);

  if (error) throw new Error(`Salvataggio storia fallito: ${error.message}`);
}

async function markFailed(storyId, message) {
  "use step";

  // This step is already inside the workflow's catch: its only job is to write
  // the real error, never to replace it. If the update fails too (DB down,
  // network...) we swallow it here, so the caller always rethrows `problem` —
  // the original reason for the failure — instead of the secondary error.
  try {
    const db = createAdminSupabase();
    await db
      .from("stories")
      .update({ state: "fallita", error: message })
      .eq("id", storyId);
  } catch {
    // Deliberately ignored: see the comment above.
  }
}
