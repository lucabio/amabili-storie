"use server";

import { redirect } from "next/navigation";

import { creaClientServer } from "@/lib/supabase/server";

/** Esce dall'area e torna al login. */
export async function esci() {
  const supabase = await creaClientServer();
  if (supabase) await supabase.auth.signOut();
  redirect("/area/login");
}
