/**
 * Read every page of a paginated API list, within a bound.
 *
 * Its own module, with no `server-only` import, so it can be unit-tested — the
 * services that use it cannot be loaded outside a server runtime, and this is
 * the part with a rule in it.
 *
 * **The rule exists because the obvious alternative is silently wrong.** Every
 * list on this API caps `page_size` at 100. Asking for 1,000 does not return
 * 1,000 rows; it returns **422**, the caller's read reports `unavailable`, and
 * whatever was being built renders complete with the data missing. That is
 * precisely how `sitemap.ts` shipped for a while listing the insights index and
 * not one article.
 */

/** What every list read in this app returns, narrowed to what paging needs. */
export type PagedRead<T> = {
  readonly status: string;
  readonly items?: readonly T[];
  readonly total?: number;
};

export type PaginateOptions = {
  /** The API's own cap. Asking for more is a 422, not a bigger page. */
  readonly pageSize: number;
  /**
   * A ceiling on requests, not on rows.
   *
   * "Until exhausted" is the wrong loop for a public endpoint: it gets slower
   * every time the firm publishes, and a slow sitemap is a crawl-budget problem
   * that nobody notices until rankings move.
   */
  readonly maxPages: number;
};

/**
 * Collect items page by page.
 *
 * Stops on the first read that is not `ok`. A partial list is still a valid
 * sitemap and a valid listing; retrying inside a crawler's request is not, and
 * fabricating the missing rows is never an option (ARCHITECTURE.md §O.18).
 */
export async function readAllPages<T>(
  read: (page: number) => Promise<PagedRead<T>>,
  { pageSize, maxPages }: PaginateOptions,
): Promise<readonly T[]> {
  const collected: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await read(page);
    if (result.status !== "ok" || !result.items) break;

    collected.push(...result.items);

    // Two independent stop conditions, because either one alone can be wrong:
    // `total` is authoritative when the API sends it, and a short page is the
    // only signal when it does not.
    if (typeof result.total === "number" && collected.length >= result.total) break;
    if (result.items.length < pageSize) break;
  }

  return collected;
}
