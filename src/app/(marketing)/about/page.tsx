import { Section } from "@/components/layout/section";
import { CtaBand } from "@/components/sections/cta-band";
import { HowWeWork } from "@/components/sections/how-we-work";
import { JsonLd } from "@/components/seo/json-ld";
import { brand, isPresent } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd } from "@/lib/seo";
import { vocabulary } from "@/lib/vocabulary";

import type { Metadata } from "next";

/**
 * `/about` — the firm's story.
 *
 * **Static content, deliberately not an API read** (CLAUDE.md §3.3c): there is
 * no `about` resource on the backend and none is planned — a firm's own
 * narrative is authored copy, not a content type an editor publishes weekly.
 * So this page reads `lib/brand.ts` (verifiable facts, `null` until confirmed)
 * and `components/sections/how-we-work.tsx` (already-authored editorial
 * content in `config/content.ts`, reused verbatim rather than duplicated) —
 * the same seam `features/services/service.ts` documents for its own content.
 *
 * **Absent facts render nothing** (CLAUDE.md §3.5). The registration strip
 * below renders zero rows today because `brand.icanRegistrationNumber`,
 * `brand.panNumber` and `brand.establishedYear` are all still `null` — that is
 * correct, not a bug to work around with placeholder values.
 *
 * Ground rhythm: muted (header) → surface (story) → muted (registration and
 * regulators) → surface (`HowWeWork`, whose own ground is fixed) → deep
 * (`CtaBand`). Checked against what actually renders today, per the same rule
 * `firm-intro.tsx` documents for the homepage.
 *
 * No `export const revalidate` — same as the `(legal)` pages, which read only
 * `lib/brand.ts` too. There is no fetch on this page for ISR to govern; Next
 * statically renders it at build time like any other page with no dynamic
 * data call.
 */

const TITLE = "About";
const DESCRIPTION = `The story, structure and regulatory standing of ${brand.name}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.about() },
  openGraph: {
    type: "website",
    url: routes.about(),
    title: `${TITLE} — ${brand.name}`,
    description: DESCRIPTION,
  },
};

const REGISTRATION_FACTS = [
  { label: vocabulary.labels.icanRegistration, value: brand.icanRegistrationNumber },
  { label: vocabulary.labels.pan, value: brand.panNumber },
  {
    label: vocabulary.labels.established,
    value: isPresent(brand.establishedYear) ? String(brand.establishedYear) : null,
  },
].filter((fact) => isPresent(fact.value));

export default function AboutPage() {
  return (
    <>
      <JsonLd
        nodes={[
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: TITLE, path: routes.about() },
          ]),
        ]}
      />

      <header className="border-b border-outline-variant bg-surface-container-low">
        <div className="mx-auto max-w-page px-6 py-16 md:px-10 md:py-24">
          <p className="text-label-medium text-tertiary uppercase">About</p>
          <h1 className="max-w-prose-measure mt-3 font-[family-name:var(--font-display)] text-display-small text-on-surface">
            Built around the obligations that recur every year.
          </h1>
          <p className="max-w-prose-measure mt-4 text-body-large text-on-surface-variant">
            Statutory audit, tax compliance and company secretarial work do not happen
            once. We are structured for that rhythm — not for a single engagement.
          </p>
        </div>
      </header>

      <Section labelledBy="story-heading" ground="surface" index="01">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <p className="flex items-center gap-3 text-label-small text-on-surface-variant uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-60" />
              {vocabulary.sections.about}
            </p>
            <h2
              id="story-heading"
              className="mt-4 font-[family-name:var(--font-display)] text-display-small text-on-surface"
            >
              What we are, and what we are not.
            </h2>
          </div>

          <div className="lg:col-span-7">
            {brand.intro.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 32)}
                className={
                  index === 0
                    ? "max-w-[62ch] font-[family-name:var(--font-display)] text-headline-small text-on-surface"
                    : "mt-6 max-w-[68ch] text-body-large text-on-surface-variant"
                }
              >
                {paragraph}
              </p>
            ))}
            <p className="mt-6 max-w-[68ch] text-body-large text-on-surface-variant">
              We do not audit an entity whose books we also keep, and we do not take an
              engagement where independence is already compromised. The ICAN code of
              ethics is not a formality on this point, and we do not treat it as one.
            </p>
          </div>
        </div>
      </Section>

      <Section labelledBy="registration-heading" ground="muted" index="02">
        <h2
          id="registration-heading"
          className="font-[family-name:var(--font-display)] text-headline-small text-on-surface"
        >
          Registration and regulation
        </h2>

        {REGISTRATION_FACTS.length > 0 ? (
          <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-outline-variant pt-6 sm:grid-cols-3">
            {REGISTRATION_FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-label-small text-on-surface-variant uppercase">
                  {fact.label}
                </dt>
                <dd className="tabular mt-1 text-title-medium text-on-surface">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="max-w-prose-measure mt-8 text-body-medium text-on-surface-variant">
          As a chartered accountancy practice we operate under the Institute of Chartered
          Accountants of Nepal, and our work brings us regularly before the other
          regulators a Nepali entity answers to.
        </p>

        <dl className="mt-8 flex flex-col border-t border-outline-variant">
          {brand.regulators.map((regulator) => (
            <div
              key={regulator.id}
              className="grid gap-1 border-b border-outline-variant py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
            >
              <dt className="text-title-medium text-on-surface">{regulator.name}</dt>
              <dd className="text-body-medium text-on-surface-variant">
                <a
                  href={regulator.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {regulator.full}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <HowWeWork />

      <div className="mx-auto max-w-page px-6 md:px-10">
        <p className="max-w-prose-measure border-t border-outline-variant py-10 text-body-small text-on-surface-variant italic">
          {brand.disclaimer}
        </p>
      </div>

      <CtaBand />
    </>
  );
}
