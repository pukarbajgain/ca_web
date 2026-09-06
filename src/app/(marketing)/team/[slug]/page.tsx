import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/sections/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { TeamPortrait } from "@/features/team/components/team-portrait";
import { getTeamMember } from "@/features/team/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { absoluteUrl, breadcrumbJsonLd, personJsonLd } from "@/lib/seo";

import type { Metadata } from "next";

export const revalidate = 300;

/**
 * `/team/[slug]` — one profile.
 *
 * Follows `features/insights`'s `[slug]` pattern exactly, not the
 * `dynamicParams = false` one `/services/[slug]` uses: team members live in the
 * backend and can be published at any time, the same as an article, so there is
 * no fixed slug set to prerender against. `generateMetadata` calls `notFound()`
 * before any HTML streams — the difference between a real 404 and a soft one
 * (ARCHITECTURE.md §D.5) — and `getTeamMember` is `cache()`-deduped so this
 * costs no extra request against the body's own read.
 *
 * **The segment's own `not-found.tsx` is load-bearing, not decorative.** A root
 * `app/loading.tsx` used to commit a `200` before `notFound()` could run,
 * turning every dynamic-route 404 into an indexable soft 404 — see
 * `insights/not-found.tsx` for the measurement. That file has since been
 * removed; `team/not-found.tsx` exists so this segment keeps a real 404 if a
 * layout-level loading state is ever reintroduced elsewhere.
 *
 * An *outage* is deliberately not a 404: it falls through to the page, which
 * renders an error rather than telling a crawler the person is gone.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const read = await getTeamMember(slug);
  if (read.status === "absent") notFound();
  if (read.status === "unavailable") return { title: "Our team" };

  const { member } = read;
  const path = routes.person(member.slug);
  const title = member.postNominals
    ? `${member.name}, ${member.postNominals}`
    : member.name;

  return {
    title,
    ...(member.designation ? { description: member.designation } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      title: `${title} — ${brand.name}`,
      url: absoluteUrl(path),
    },
  };
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const read = await getTeamMember(slug);

  if (read.status === "absent") notFound();

  // An outage is not a missing profile, and must not be presented as one.
  if (read.status === "unavailable") {
    return (
      <div className="mx-auto max-w-page px-6 py-24 md:px-10">
        <h1 className="font-[family-name:var(--font-display)] text-headline-large">
          We could not load this profile
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
          href={routes.team()}
          className="mt-8 inline-block text-primary hover:underline"
        >
          ← Our team
        </Link>
      </div>
    );
  }

  const { member } = read;
  const path = routes.person(member.slug);
  const bioParagraphs = member.bio
    ? member.bio
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];

  return (
    <>
      <JsonLd
        nodes={[
          personJsonLd(
            {
              id: member.slug,
              name: member.name,
              postNominals: member.postNominals,
              role: member.designation ?? "",
              practiceAreas: member.practiceAreas,
              membershipNumber: null,
            },
            path,
          ),
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: "Our team", path: routes.team() },
            { name: member.name, path },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-14 md:px-10 md:py-20">
          <nav
            aria-label="Breadcrumb"
            className="text-body-small text-on-surface-variant"
          >
            <Link href={routes.team()} className="hover:underline">
              Our team
            </Link>
          </nav>

          <div className="mt-6 grid gap-8 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start sm:gap-10">
            <div className="w-24 sm:w-32">
              <TeamPortrait
                photo={member.photo}
                alt={`${member.name}${member.designation ? `, ${member.designation}` : ""}`}
                sizes="(min-width: 640px) 8rem, 6rem"
                priority
              />
            </div>

            <div className="min-w-0">
              <h1 className="flex flex-wrap items-baseline gap-x-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
                {member.name}
                {member.postNominals ? (
                  <span className="text-headline-small text-tertiary">
                    {member.postNominals}
                  </span>
                ) : null}
              </h1>
              {member.designation ? (
                <p className="mt-2 text-title-medium text-on-surface-variant">
                  {member.designation}
                </p>
              ) : null}
              {member.office ? (
                <p className="mt-1 text-body-medium text-on-surface-variant">
                  {member.office.name} office
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-page px-6 py-14 md:px-10 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="max-w-prose-measure">
            {bioParagraphs.length > 0 ? (
              bioParagraphs.map((paragraph, index) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className={
                    index === 0
                      ? "text-body-large text-on-surface-variant"
                      : "mt-4 text-body-large text-on-surface-variant"
                  }
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-body-large text-on-surface-variant">
                A profile for {member.name} has not been published yet.
              </p>
            )}

            <p className="mt-16 border-t border-outline-variant pt-6 text-body-small text-on-surface-variant italic">
              {brand.disclaimer}
            </p>

            <Link
              href={routes.team()}
              className="mt-10 inline-block text-primary hover:underline"
            >
              ← Our team
            </Link>
          </div>

          {member.practiceAreas.length > 0 ? (
            <aside aria-labelledby="practice-areas-heading">
              <h2
                id="practice-areas-heading"
                className="text-label-medium text-on-surface-variant uppercase"
              >
                Practice areas
              </h2>
              <ul className="mt-4 flex flex-col gap-2">
                {member.practiceAreas.map((area) => (
                  <li
                    key={area}
                    className="border-t border-outline-variant pt-2 text-body-medium text-on-surface"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>

      <CtaBand />
    </>
  );
}
