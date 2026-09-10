import { notFound } from "next/navigation";

import StoryEditor from "@/components/admin/StoryEditor";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Review({ params }) {
  // Next 16: params is a Promise.
  const { id } = await params;

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!story) notFound();

  return <StoryEditor story={story} />;
}
