import type { Heading } from "../toc";

/**
 * The contents rail beside a long article.
 *
 * **This is where we deliberately improve on the reference site.** Its article
 * body sits in a ~400px column with a large empty right margin at 1440px — the
 * space is there and does nothing. ARCHITECTURE.md §D.3 puts a contents list in
 * it from `xl:`, which is the width at which the rail stops competing with the
 * text for attention.
 *
 * Below `xl` it is not rendered at all, rather than collapsed into an accordion
 * above the article. On a phone the contents of a five-section article are three
 * thumb-flicks away, and a collapsed list is one more thing between the reader
 * and the first sentence.
 *
 * It renders nothing for a short article: a contents list of one entry is
 * furniture.
 */
export function ArticleContents({ headings }: { headings: readonly Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav
      aria-labelledby="article-contents-heading"
      className="hidden xl:sticky xl:top-28 xl:block xl:self-start"
    >
      <h2
        id="article-contents-heading"
        className="text-label-medium text-on-surface-variant uppercase"
      >
        On this page
      </h2>
      <ul className="mt-4 flex flex-col gap-2 border-l border-outline-variant">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={[
                "block border-l-2 border-transparent py-0.5 text-body-small text-on-surface-variant hover:border-outline-variant hover:text-on-surface",
                // A sub-heading is indented rather than given a bullet or a
                // different colour: the indent already says "part of the above".
                heading.level === 3 ? "ps-6" : "ps-4",
              ].join(" ")}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
