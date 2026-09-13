import { notFound, redirect } from "next/navigation";

import StoryEditor from "@/components/admin/StoryEditor";
import { adminSession } from "@/lib/admin/session";
import { characterSheet } from "@/lib/story/prompt";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Review({ params }) {
  // Next 16: params is a Promise.
  const { id } = await params;

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data: story, error } = await supabase
    .from("stories")
    .select("*, guide_prompt_versions!stories_guide_prompt_version_id_fkey (version, content)")
    .eq("id", id)
    .maybeSingle();

  // A read that failed is not a story that does not exist. Confusing the two is
  // how a rotated token, or one hiccup on the way to Postgres, becomes a 404 in
  // the face of whoever is editing — and `saveStory` revalidates this very path,
  // so the refetch lands right after a save that did work. Say what happened.
  if (error) {
    console.error(`Lettura della storia ${id} fallita:`, error.message);
    const { user } = await adminSession();
    if (!user) redirect("/admin/login");
    throw new Error(`Lettura della storia fallita: ${error.message}`);
  }

  if (!story) notFound();

  // Built here, not in the editor: prompt.js carries the whole Method, and it has
  // no business in the browser bundle.
  return <StoryEditor story={story} defaultCharacterSheet={characterSheet(story.params)} />;
}
