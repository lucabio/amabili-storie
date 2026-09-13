import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// The keys of a page are read in eight places and written in two. When a rename
// misses one of the written ones nothing goes red: the value lands under a name
// nobody reads, the UI keeps showing the old state, and a reload quietly fixes
// it. That is exactly how "generate every illustration" ended up counting 22
// missing pages after drawing all 22 of them.
//
// So: no Italian content key may appear as a string literal or a property access
// anywhere under src/. The schema in schema.js is the only source of truth.
const STALE =
  /["'](illustrazioneUrl|illustrazione|testo|titolo|pagine|fraseAncora|guidaGenitori|impaginazione|contenuto|parametri)["']|\.(illustrazioneUrl|fraseAncora|guidaGenitori|impaginazione)\b/g;

function sources(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, found);
    else if (/\.jsx?$/.test(entry)) found.push(path);
  }
  return found;
}

describe("the keys of a story's content", () => {
  it("are never written in Italian", () => {
    const guilty = sources("src")
      .filter((path) => !path.endsWith("content-keys.test.js"))
      .flatMap((path) =>
        [...readFileSync(path, "utf8").matchAll(STALE)].map((hit) => `${path}: ${hit[0]}`),
      );

    expect(guilty).toEqual([]);
  });
});
