"use server";

import { redirect } from "next/navigation";
import { start } from "workflow/api";

import { resolveBrand } from "@/lib/brand/resolve";
import { orderSchema } from "@/lib/orders/schema";
import { createAdminSupabase } from "@/lib/supabase/server";
import { generateBook } from "@/workflows/book";

/**
 * The checkout: it creates the order and starts the generation. What decides
 * whether a merchant charges is the per-merchant `accetta_pagamenti` flag,
 * managed from the backoffice — no longer a global environment variable.
 *
 * Until Stripe is configured (`STRIPE_SECRET_KEY` absent), every purchase is
 * *simulated*: the order is created with `finto = true`, so the whole chain
 * (order → workflow → queue) is testable end to end without charging anyone. On
 * launch day they are deleted with `delete from ordini where finto`.
 *
 * Security no longer sits in a flag to remember: as soon as
 * `STRIPE_SECRET_KEY` exists, the presence of Stripe alone diverts to the real
 * payment — you can no longer give a book away by mistake to a merchant that
 * sells.
 */
export async function buy(rawData) {
  const parsed = orderSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Dati dell'ordine non validi." };
  }
  const order = parsed.data;

  // The truth about the brand — and therefore about the price — is read here,
  // from the database. `order.params.brand` is only the slug saying WHICH brand
  // to resolve: nothing else the client may have declared about it is trusted (an
  // "I am free" in the payload does not even exist in orderSchema, and if it did
  // it would be ignored anyway). A merchant that does not accept payments gives
  // the book away: fixed format "ebook", price zeroed — but that decision is
  // taken by `brand.acceptsPayments` just read from the DB, never by the format
  // or the price the client sent.
  const brand = await resolveBrand(order.params.brand);

  // Real payments = Stripe configured. It is the only thing that tells a real
  // purchase from a simulated one: no manual environment flag.
  const realPayments = Boolean(process.env.STRIPE_SECRET_KEY);

  // A merchant that sells and has Stripe active should go through the card
  // payment — which does not exist yet. Better a handled error than a book given
  // away by mistake: here, one day, the Stripe session will be born.
  if (brand.acceptsPayments && realPayments) {
    return { error: "Il pagamento con carta non è ancora attivo." };
  }

  const db = createAdminSupabase();
  if (!db) return { error: "Supabase non è configurato." };

  const format = brand.acceptsPayments ? order.format : "ebook";
  const priceCents = brand.acceptsPayments ? order.priceCents : 0;

  const { data: row, error } = await db
    .from("ordini")
    .insert({
      brand_id: brand.id ?? null,
      email: order.email,
      parametri: order.params,
      formato: format,
      prezzo_cents: priceCents,
      stato: "pagato",
      // Simulated until Stripe is here. When it arrives, its webhook will take
      // the same steps with `finto: false` — the queue will not notice.
      finto: !realPayments,
    })
    .select("id")
    .single();

  if (error) return { error: `Ordine non creato: ${error.message}` };

  // The run_id is written by the workflow itself, in the step that creates the
  // `storie` row (createGeneratingStory): start() returns immediately, before
  // that row exists, so an update from here would be a race almost always lost.
  try {
    await start(generateBook, [row.id]);
  } catch (problem) {
    // There is no `storie` row yet: no ghost in the queue. But the order is
    // there, and it stays "pagato" forever without anyone knowing (the backoffice
    // queue shows stories, not orders). We cannot fix it with a state transition
    // — "ordini.stato" only allows 'pagato'/'rimborsato' (migration 0002), there
    // is no room here for a 'fallito' without touching the schema, out of scope
    // for this function. The bare minimum: log it in a searchable way and do not
    // redirect as if everything went fine, so whoever paid retries right away
    // instead of waiting for a book that will never come.
    console.error(`Avvio della generazione fallito per l'ordine ${row.id}:`, problem.message);
    return {
      error:
        "Il tuo ordine è stato registrato, ma non siamo riusciti ad avviare la generazione del libro. Riprova, o scrivici indicando questo riferimento: " +
        row.id,
    };
  }

  redirect("/checkout/in-lavorazione");
}
