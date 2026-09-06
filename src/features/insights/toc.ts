/**
 * Pull a table of contents out of an article body, and give its headings ids.
 *
 * **Why this is string work and not DOM work.** The body is rendered on the
 * server into static HTML; there is no DOM at that point, and shipping a parser
 * to the browser to re-derive something the server already knows would be a
 * client bundle for nothing. The input is also not arbitrary HTML: the backend
 * sanitises it with a strict `nh3` allowlist on write, so the tags that can
 * appear are a known, small set. That is what makes a regex defensible here —
 * it is reading output we control, not parsing the open web.
 *
 * **Ids are derived from the text, not the position.** `#how-is-residency-decided`
 * survives an editor inserting a paragraph above it; `#heading-3` would not, and
 * a shared link would silently start pointing at the wrong section.
 */

export type Heading = {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
};

const HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

/** Strip tags and decode the few entities the sanitiser can emit. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}

export type ArticleContents = {
  /** The body with `id` attributes added to every h2/h3. */
  readonly html: string;
  readonly headings: readonly Heading[];
};

export function buildContents(bodyHtml: string): ArticleContents {
  const headings: Heading[] = [];
  const used = new Map<string, number>();

  const html = bodyHtml.replace(
    HEADING,
    (match, levelRaw, attrs: string | undefined, inner: string) => {
      const text = plainText(inner);
      if (!text) return match;

      const base = slugifyHeading(text);
      if (!base) return match;

      // Two sections legitimately share a title ("Example"), and two elements
      // cannot share an id — the second anchor would jump to the first.
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen + 1}`;

      const level = Number(levelRaw) as 2 | 3;
      headings.push({ id, text, level });

      // An id the editor typed themselves wins: they may be maintaining an
      // existing anchor that something already links to.
      if (attrs && /\sid\s*=/i.test(attrs)) return match;
      return `<h${levelRaw}${attrs ?? ""} id="${id}">${inner}</h${levelRaw}>`;
    },
  );

  return { html, headings };
}
