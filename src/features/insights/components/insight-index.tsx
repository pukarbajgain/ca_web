import Link from "next/link";

import { Section } from "@/components/layout/section";
import { routes } from "@/lib/routes";

import type { ArticleListRead, ArticleSummary } from "../service";

/**
 * The insights register.
 *
 * **A ruled list, not a third card grid.** The homepage already carries one and
 * `/services` deliberately avoids a second (CLAUDE.md §3.8b); a third would make
 * the site read as one template with the nouns swapped. A list is also the
 * honest shape for this content: these are documents of varying length, read one
 * at a time, and a grid of equal tiles claims they are equally weighted.
 *
 * Each row gives a reader the four things they decide on — what it is about,
 * roughly how long it is, when it was written, and who stands behind it. The
 * byline is on the row rather than the detail page alone because on tax guidance
 * the author's credentials are part of whether it is worth reading.
 */
function ArticleRow({ article }: { article: ArticleSummary }) {
  return (
    <li>
      <Link
        href={routes.article(article.slug)}
        className="group grid gap-x-8 gap-y-2 border-t border-outline-variant py-6 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none md:grid-cols-[10rem_minmax(0,1fr)] md:py-8"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 text-label-medium text-on-surface-variant md:flex-col md:gap-y-1">
          {article.category ? (
            <span className="text-tertiary uppercase">{article.category.name}</span>
          ) : null}
          {article.publishedAt ? (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          ) : null}
          {article.readingMinutes ? <span>{article.readingMinutes} min read</span> : null}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-headline-small text-on-surface group-hover:underline">
            {article.title}
          </h3>
          {article.standfirst ? (
            <p className="max-w-prose-measure text-body-medium text-on-surface-variant">
              {article.standfirst}
            </p>
          ) : null}
          {article.author ? (
            <p className="text-body-small text-on-surface-variant">
              {article.author.name}
              {article.author.postNominals ? `, ${article.author.postNominals}` : ""}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function InsightIndex({ read }: { read: ArticleListRead }) {
  /**
   * Three outcomes, kept distinct (CLAUDE.md §3.8c).
   *
   * "No articles yet" when the API is down is a lie, and on a firm's own
   * knowledge page it is the lie that makes the firm look inactive. An outage
   * says so and offers the reference; an empty-but-working list says the firm
   * has not published yet.
   */
  if (read.status === "unavailable") {
    return (
      <Section labelledBy="insights-heading" ground="surface">
        <h2 id="insights-heading" className="sr-only">
          Insights
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          We could not load the articles just now. Please try again in a moment.
          {read.reference ? (
            <span className="mt-2 block font-[family-name:var(--font-mono)] text-body-small">
              Reference {read.reference}
            </span>
          ) : null}
        </p>
      </Section>
    );
  }

  if (read.items.length === 0) {
    return (
      <Section labelledBy="insights-heading" ground="surface">
        <h2 id="insights-heading" className="sr-only">
          Insights
        </h2>
        <p className="max-w-prose-measure text-body-large text-on-surface-variant">
          Nothing published yet. Notes on tax, audit and compliance will appear here.
        </p>
      </Section>
    );
  }

  return (
    <Section labelledBy="insights-heading" ground="surface" index="01">
      <h2 id="insights-heading" className="sr-only">
        Insights
      </h2>
      {/* The bottom rule closes the register, so the last row is not left
          hanging — the rules are the structure here, not decoration. */}
      <ul className="flex flex-col border-b border-outline-variant">
        {read.items.map((article) => (
          <ArticleRow key={article.slug} article={article} />
        ))}
      </ul>
    </Section>
  );
}
