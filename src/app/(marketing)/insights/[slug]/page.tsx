import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { ArticleContents } from "@/features/insights/components/article-contents";
import { getArticle } from "@/features/insights/service";
import { buildContents } from "@/features/insights/toc";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

import type { Metadata } from "next";

export const revalidate = 300;

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * `generateMetadata` calls `notFound()` for a missing article.
 *
 * It runs before the body streams, so a 404 decided here is a real 404. Deciding
 * it in the component instead would let `loading.tsx` commit a 200 first, and
 * the page would be a soft 404 — indexed, and indistinguishable to a crawler
 * from a real page. `getArticle` is `cache()`-deduped, so this costs no extra
 * request.
 *
 * An *outage* is deliberately not a 404: it falls through to the page, which
 * renders an error rather than telling a crawler the article is gone.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const read = await getArticle(slug);
  if (read.status === "absent") notFound();
  if (read.status === "unavailable") return { title: "Insights" };

  const { article } = read;
  return {
    title: article.metaTitle ?? article.title,
    ...((article.metaDescription ?? article.standfirst)
      ? { description: article.metaDescription ?? article.standfirst ?? undefined }
      : {}),
    alternates: { canonical: article.canonicalUrl ?? routes.article(article.slug) },
    ...(article.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "article",
      title: article.metaTitle ?? article.title,
      url: absoluteUrl(routes.article(article.slug)),
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      modifiedTime: article.modifiedAt,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await getArticle(slug);

  if (read.status === "absent") notFound();

  // An outage is not a missing article, and must not be presented as one.
  if (read.status === "unavailable") {
    return (
      <div className="mx-auto max-w-page px-6 py-24 md:px-10">
        <h1 className="font-[family-name:var(--font-display)] text-headline-large">
          We could not load this article
        </h1>
        <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
          Please try again in a moment.
          {read.reference ? (
            <span className="mt-2 block font-[family-name:var(--font-mono)] text-body-small">
              Reference {read.reference}
            </span>
          ) : null}
        </p>
        <Link
          href={routes.insights()}
          className="mt-8 inline-block text-primary hover:underline"
        >
          ← All insights
        </Link>
      </div>
    );
  }

  const { article } = read;
  const { html, headings } = buildContents(article.bodyHtml);

  const byline = [
    article.author
      ? `By ${article.author.name}${article.author.postNominals ? `, ${article.author.postNominals}` : ""}`
      : null,
    // The CA-specific half of the byline: on published tax guidance the firm
    // names the partner who checked it, not only the person who wrote it.
    article.reviewer
      ? `Reviewed by ${article.reviewer.name}${article.reviewer.postNominals ? `, ${article.reviewer.postNominals}` : ""}`
      : null,
    article.publishedAt ? `Published ${longDate(article.publishedAt)}` : null,
    // Readers of a filing deadline need to know when it was last confirmed.
    article.modifiedAt && article.modifiedAt !== article.publishedAt
      ? `Updated ${longDate(article.modifiedAt)}`
      : null,
  ].filter(Boolean);

  return (
    <>
      <JsonLd
        nodes={[
          articleJsonLd(article),
          faqJsonLd(article.faqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Insights", path: routes.insights() },
            { name: article.title, path: routes.article(article.slug) },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-14 md:px-10 md:py-20">
          <nav
            aria-label="Breadcrumb"
            className="text-body-small text-on-surface-variant"
          >
            <Link href={routes.insights()} className="hover:underline">
              Insights
            </Link>
            {article.category ? <span> / {article.category.name}</span> : null}
          </nav>
          <h1 className="max-w-prose-measure mt-4 font-[family-name:var(--font-display)] text-display-small text-on-surface">
            {article.title}
          </h1>
          {article.standfirst ? (
            <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
              {article.standfirst}
            </p>
          ) : null}
          {byline.length > 0 ? (
            <p className="mt-6 text-body-small text-on-surface-variant">
              {byline.join(" · ")}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-page gap-12 px-6 py-14 md:px-10 md:py-20 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          {/* The body is sanitised on write with a strict allowlist, so what is
              stored is already trusted. Sanitising again here would be theatre;
              the guarantee lives at the boundary where untrusted input entered. */}
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          {article.faqs.length > 0 ? (
            <section aria-labelledby="article-faqs" className="max-w-prose-measure mt-16">
              <h2
                id="article-faqs"
                className="font-[family-name:var(--font-display)] text-headline-small"
              >
                Questions we are asked about this
              </h2>
              <dl className="mt-6 flex flex-col">
                {article.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="border-t border-outline-variant py-5"
                  >
                    <dt className="text-title-medium text-on-surface">{faq.question}</dt>
                    <dd className="mt-2 text-body-medium text-on-surface-variant">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {article.relatedServices.length > 0 ? (
            <section
              aria-labelledby="article-services"
              className="max-w-prose-measure mt-16"
            >
              <h2
                id="article-services"
                className="text-label-medium text-on-surface-variant uppercase"
              >
                Related work
              </h2>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {article.relatedServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="text-primary hover:underline"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* The disclaimer is not boilerplate on a regulated professional's
              site — it is the sentence that keeps general guidance from reading
              as advice given to one reader (CLAUDE.md §3.5). */}
          <p className="max-w-prose-measure mt-16 border-t border-outline-variant pt-6 text-body-small text-on-surface-variant italic">
            {article.disclaimer ?? brand.disclaimer}
          </p>

          <Link
            href={routes.insights()}
            className="mt-10 inline-block text-primary hover:underline"
          >
            ← All insights
          </Link>
        </div>

        <ArticleContents headings={headings} />
      </div>
    </>
  );
}
