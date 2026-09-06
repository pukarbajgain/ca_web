import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { AssetImage } from "@/components/media/asset-image";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { assets, withAlt, type AssetDescriptor } from "@/lib/assets";
import { formatDate, toDateTimeAttr } from "@/lib/format";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Latest insights (§D.6 row 11): demonstrated technical depth, and proof the
 * firm is active. A CA site whose newest article is two years old says
 * something, and it is not flattering.
 *
 * **Deliberately a pure presentational component.** `GET /api/v1/public/articles`
 * is Phase 2 (API_CONTRACT.md §6) and does not exist yet, and CLAUDE.md §5.2 is
 * explicit: build only what the backend exposes, no screens for endpoints that
 * don't exist. So this takes `articles` as a prop, `/` passes an empty array,
 * and the section renders nothing. When the endpoint lands, one `await` in the
 * page is the entire change — no rewrite, and no mock endpoint to delete.
 */

export type InsightSummary = {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly topic: string | null;
  readonly cover?: AssetDescriptor;
  /** Byline. See the `Byline` component below for why these are first-class. */
  readonly author?: string | null;
  readonly reviewedBy?: string | null;
  /** Last substantive update, when it differs from publication. */
  readonly updatedAt?: string | null;
};

export function InsightRail({ articles }: { articles: readonly InsightSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <Section labelledBy="insights-heading">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          id="insights-heading"
          eyebrow={vocabulary.sections.insights}
          title="Recent guidance"
          lede="Notes on Nepali tax and reporting, written for the people who have to apply them."
        />
        <Link
          href={routes.insights()}
          className="group inline-flex min-h-11 items-center gap-2 text-label-large text-primary"
        >
          {vocabulary.actions.viewAllInsights}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
          />
        </Link>
      </div>

      <ul className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => {
          const published = formatDate(article.publishedAt);
          const machineDate = toDateTimeAttr(article.publishedAt);

          return (
            <li key={article.slug} className="rise">
              <Card className="relative overflow-hidden">
                <AssetImage
                  asset={withAlt(article.cover ?? assets.articleCover, "")}
                  // 16:9 cover in a 1 → 2 → 3 column grid.
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  rounded={false}
                />
                <CardBody>
                  {article.topic ? (
                    <p className="text-label-small text-primary uppercase">
                      {article.topic}
                    </p>
                  ) : null}
                  <CardTitle>
                    <Link
                      href={routes.article(article.slug)}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {article.title}
                    </Link>
                  </CardTitle>
                  <p className="line-clamp-3 text-body-medium text-on-surface-variant">
                    {article.excerpt}
                  </p>
                  <Byline
                    article={article}
                    published={published}
                    machineDate={machineDate}
                  />
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/**
 * Published date, author and named reviewer.
 *
 * ARCHITECTURE.md §O.10 makes `author` + `reviewed_by` a first-class property of
 * an article rather than decoration: a technical-review step before publishing
 * tax guidance is genuine professional practice, and "Reviewed by CA X" is the
 * cheapest strong credibility device a firm's site has.
 *
 * Every field is conditional and the block disappears when none is present — an
 * author line names a real professional, so it follows the same rule as every
 * other verifiable fact on the site (CLAUDE.md §3.5). "Updated" shows only when
 * it differs from the published date; printing the same date twice reads as
 * padding, and Nepali rates and formats change yearly, so the distinction
 * between written-then and still-current-now is the whole point.
 */
function Byline({
  article,
  published,
  machineDate,
}: {
  article: InsightSummary;
  published: string | null;
  machineDate: string | null;
}) {
  const updated = article.updatedAt ? formatDate(article.updatedAt) : null;
  const updatedMachine = article.updatedAt ? toDateTimeAttr(article.updatedAt) : null;
  const showUpdated = updated !== null && updated !== published;

  const hasCredits = Boolean(article.author?.trim() || article.reviewedBy?.trim());
  if (!hasCredits && !published) return null;

  return (
    <div className="mt-auto flex flex-col gap-0.5 pt-4 text-body-small text-on-surface-variant">
      {hasCredits ? (
        <p>
          {article.author ? <>By {article.author}</> : null}
          {article.author && article.reviewedBy ? " · " : null}
          {article.reviewedBy ? <>Reviewed by {article.reviewedBy}</> : null}
        </p>
      ) : null}
      {published && machineDate ? (
        <p>
          <time dateTime={machineDate}>{published}</time>
          {showUpdated && updatedMachine ? (
            <>
              {" · Updated "}
              <time dateTime={updatedMachine}>{updated}</time>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shape-matched Suspense fallback. It repeats the real grid, gutters and card
 * proportions class for class — a fallback that does not match the layout it
 * replaces trades a spinner for a layout shift, which is the worse of the two.
 */
export function InsightRailSkeleton() {
  return (
    <section aria-hidden className="py-14 md:py-20">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-72" />
        <ul className="mt-10 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <div className="flex h-full flex-col rounded-xl border border-outline-variant bg-card">
                <Skeleton className="aspect-[16/9] w-full rounded-none rounded-t-xl" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
