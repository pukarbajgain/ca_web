/**
 * Normalise a URL path into the form the backend's targeting compares against.
 *
 * Its own module, with no `server-only` import, for a reason worth stating: the
 * rest of this feature's read path is server-only by construction, and a
 * `server-only` module cannot be loaded by Vitest at all. This is the one piece
 * of the read path with a rule in it rather than a fetch, so it is the piece
 * that has to be testable — putting it here is what makes that possible without
 * weakening the import guard on `service.ts`.
 */

/**
 * Segments from a parallel-route optional catch-all → the path to target on.
 *
 * Trailing slashes disappear because `/services/` and `/services` are the same
 * page to a reader and must be the same page to a targeting rule. The root
 * stays `/`, which is the value that means "the home page"; the empty string
 * means nothing and would match nothing.
 */
export function pathFromSegments(segments: readonly string[] | undefined): string {
  const joined = (segments ?? []).filter(Boolean).join("/");
  return joined === "" ? "/" : `/${joined}`;
}
