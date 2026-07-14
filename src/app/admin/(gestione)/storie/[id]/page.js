import { notFound } from "next/navigation";

import EditorStoria from "@/components/admin/EditorStoria";
import { creaClientServer } from "@/lib/supabase/server";

export default async function Revisione({ params }) {
  // Next 16: params è una Promise.
  const { id } = await params;

  const supabase = await creaClientServer();
  if (!supabase) return null;

  const { data: storia } = await supabase
    .from("storie")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!storia) notFound();

  return <EditorStoria storia={storia} />;
}
