"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { adminUser } from "@/lib/admin/session";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { WHIM_IDS } from "@/lib/domain/whims";
import { createServerSupabase } from "@/lib/supabase/server";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Serve un colore in formato #rrggbb");

const brandFormSchema = z.object({
  id: z.uuid().nullable(),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9_-]+$/, "Solo minuscole, numeri, trattini e underscore"),
  name: z.string().trim().min(1, "Serve il nome del merchant"),
  active: z.boolean(),
  theme: z.object({
    accent: hexColor,
    accentSoft: hexColor,
    dark: hexColor,
  }),
  logoUrl: z.union([z.url(), z.literal("")]).nullable(),
  hero: z.object({
    eyebrow: z.string().trim().min(1),
    title: z.string().trim().min(1),
    titleAccent: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    cta: z.string().trim().min(1),
  }),
  guidePrompt: z.string().trim().nullable(),
  /** Empty = all whims. */
  whims: z.array(z.enum(WHIM_IDS)).nullable(),
  showPrices: z.boolean(),
  acceptsPayments: z.boolean(),
});

function text(formData, field) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveBrand(_previousState, formData) {
  const user = await adminUser();
  if (!user) redirect("/admin/login");

  const chosenWhims = formData.getAll("whims").filter(Boolean);

  const parsed = brandFormSchema.safeParse({
    id: text(formData, "id") || null,
    slug: text(formData, "slug"),
    name: text(formData, "name"),
    active: formData.get("active") === "on",
    theme: {
      accent: text(formData, "accent"),
      accentSoft: text(formData, "accentSoft"),
      dark: text(formData, "dark"),
    },
    logoUrl: text(formData, "logoUrl") || null,
    hero: {
      eyebrow: text(formData, "eyebrow"),
      title: text(formData, "title"),
      titleAccent: text(formData, "titleAccent"),
      subtitle: text(formData, "subtitle"),
      cta: text(formData, "cta"),
    },
    guidePrompt: text(formData, "guidePrompt") || null,
    whims: chosenWhims.length > 0 ? chosenWhims : null,
    showPrices: formData.get("showPrices") === "on",
    acceptsPayments: formData.get("acceptsPayments") === "on",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  // The main site is never disabled from the backoffice: it is the home page.
  // The Server Action is an endpoint reachable directly (a button hidden in the
  // UI is not enough), so the check has to be redone here, looking at the slug
  // that is really on Supabase — not the one declared by the form, which could
  // have been tampered with.
  let isMainSite = false;
  if (data.id) {
    const { data: existingRow } = await supabase
      .from("brands")
      .select("slug")
      .eq("id", data.id)
      .maybeSingle();
    isMainSite = existingRow?.slug === BRAND_DEFAULT.slug;
  }

  const row = {
    // The main site is not renamed. `resolveBrand(null)` looks up the home by
    // slug: changing it would make it silently fall back to BRAND_DEFAULT — the
    // home would keep working, but it would stop being editable from here, and
    // nobody would understand why.
    slug: isMainSite ? BRAND_DEFAULT.slug : data.slug,
    name: data.name,
    active: isMainSite ? true : data.active,
    theme: data.theme,
    logo_url: data.logoUrl || null,
    hero: data.hero,
    guide_prompt: data.guidePrompt,
    whims: data.whims,
    // A price list nobody can pay is inconsistent: we never write
    // `mostra_prezzi: true` together with `accetta_pagamenti: false`. This
    // Server Action is an HTTP endpoint reachable directly (a form disabled in
    // the UI is not enough), so we correct it here, the same way `brandSchema`
    // corrects it on read — two sides of the same rule, not two different rules.
    show_prices: data.acceptsPayments && data.showPrices,
    accepts_payments: data.acceptsPayments,
  };

  const { error } = data.id
    ? await supabase.from("brands").update(row).eq("id", data.id)
    : await supabase.from("brands").insert(row);

  if (error) {
    const message =
      error.code === "23505"
        ? `Lo slug "${data.slug}" è già usato da un altro merchant.`
        : error.message;
    return { errors: { general: [message] } };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteBrand(formData) {
  const user = await adminUser();
  if (!user) redirect("/admin/login");

  const id = text(formData, "id");
  if (!id) return;

  const supabase = await createServerSupabase();

  // Same story as saveBrand: the main site is not deleted, and the check has to
  // be done on the slug that is on Supabase, not on what arrives from the client.
  const { data: row } = await supabase.from("brands").select("slug").eq("id", id).maybeSingle();
  if (row?.slug === BRAND_DEFAULT.slug) {
    redirect("/admin");
  }

  await supabase.from("brands").delete().eq("id", id);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
