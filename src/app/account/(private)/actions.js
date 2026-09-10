"use server";

import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";

/** Leaves the area and goes back to the login. */
export async function signOut() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/account/login");
}
