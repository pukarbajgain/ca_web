import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A source-level guard for one specific, silent Tailwind v4 failure.
 *
 * `text-[var(--x)]` is **ambiguous**: Tailwind cannot tell whether the value is
 * a colour or a font size, and resolves it as `font-size`. The class compiles,
 * the build passes, the colour never applies — and the element renders in the
 * inherited colour instead. On this site that meant near-black text on the
 * near-black hero ground: invisible, and caught only by the axe contrast check
 * at the very end of the pipeline.
 *
 * The fix is the data-type hint, `text-[color:var(--x)]`. This test makes that a
 * fast unit failure rather than a slow end-to-end one. `bg-`, `border-` and
 * `fill-` are unambiguous and need no hint.
 */

const AMBIGUOUS = /text-\[var\(/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(path) && !path.endsWith(".test.ts") ? [path] : [];
  });
}

describe("Tailwind arbitrary values", () => {
  it("never uses an un-hinted text-[var(...)], which silently compiles to font-size", () => {
    const offenders = sourceFiles("src").filter((file) =>
      AMBIGUOUS.test(readFileSync(file, "utf8")),
    );
    expect(
      offenders,
      `Use text-[color:var(--x)] instead of text-[var(--x)] in:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
