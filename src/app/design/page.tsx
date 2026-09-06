import { Container } from "@/components/layout/container";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import { AssetImage } from "@/components/media/asset-image";
import { BrandLogo } from "@/components/media/brand-logo";
import { CredentialMarquee } from "@/components/sections/credential-marquee";
import { InsightRail, InsightRailSkeleton } from "@/components/sections/insight-rail";
import { Offices } from "@/components/sections/offices";
import { PeopleRail } from "@/components/sections/people-rail";
import { StatsBand } from "@/components/sections/stats-band";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardTitle } from "@/components/ui/card";
import { ScrollX } from "@/components/ui/scroll-x";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { assets, unreplacedAssets, withAlt } from "@/lib/assets";
import { brand, type Office, type Person, type Stat } from "@/lib/brand";
import { imageSlots } from "@/lib/image-slots";

import { ViewportSwitcher } from "./theme-controls";

import type { Metadata } from "next";

/**
 * `/design` — the living design system (ARCHITECTURE.md §J.1).
 *
 * Three jobs, and the third is the one that usually gets skipped:
 *
 *  1. Render every colour role, type step and component, so a change to
 *     `globals.css` is reviewable in one place.
 *  2. Provide the theme toggle, so the derived dark scheme is verified rather
 *     than assumed.
 *  3. **Be the responsive review surface.** The viewport switcher renders the
 *     live site at the same four widths the Playwright gate asserts, so
 *     "responsive because we wrote `md:`" and "responsive because we looked"
 *     stop being the same claim.
 *
 * It also does something specific to this project: it renders the **present**
 * branch of every honest-degradation component with explicitly-supplied sample
 * data. On `/` those sections render nothing, because the firm has published no
 * statistics, people or offices. Without this page the styled-and-populated
 * state would be unreviewable dead code — and the sample data here is safe
 * precisely because this page is `noindex` and is nobody's idea of a claim.
 */
export const metadata: Metadata = {
  title: "Design system",
  description: "Colour roles, type scale, components and responsive review surface.",
  // Internal review surface. It is served rather than gated so it can be
  // linked to a stakeholder, but it must never compete with a real page.
  robots: { index: false, follow: false },
};

/* ── Sample data. Exists ONLY on this page (see the header comment). ───────── */

const SAMPLE_STATS: readonly Stat[] = [
  { id: "s1", value: "18", label: "Years in practice", source: "sample" },
  { id: "s2", value: "6", label: "Partners and managers", source: "sample" },
  { id: "s3", value: "240+", label: "Annual engagements", source: "sample" },
  { id: "s4", value: "3", label: "Offices", source: "sample" },
];

const SAMPLE_PEOPLE: readonly Person[] = [
  {
    id: "p1",
    name: "Sample Partner",
    postNominals: "FCA",
    role: "Managing partner",
    practiceAreas: ["Audit", "NFRS"],
    membershipNumber: null,
  },
  {
    id: "p2",
    name: "Sample Partner Two",
    postNominals: "CA",
    role: "Partner — Tax",
    practiceAreas: ["Income tax", "VAT"],
    membershipNumber: null,
  },
];

const SAMPLE_OFFICES: readonly Office[] = [
  {
    id: "o1",
    name: "Sample office",
    street: "Sample Marg 00",
    city: "Sample City",
    region: "Bagmati",
    postalCode: null,
    countryCode: "NP",
    phone: null,
    email: null,
    latitude: null,
    longitude: null,
    isPrimary: true,
  },
];

/* Literal class strings, never interpolated: Tailwind's scanner reads source
 * text, so `bg-${role}` produces no CSS at all. */
const ROLE_SWATCHES = [
  { label: "primary", className: "bg-primary text-primary-foreground" },
  {
    label: "primary-container",
    className: "bg-primary-container text-on-primary-container",
  },
  {
    label: "secondary-container",
    className: "bg-secondary-container text-on-secondary-container",
  },
  { label: "tertiary", className: "bg-tertiary text-on-tertiary" },
  {
    label: "tertiary-container",
    className: "bg-tertiary-container text-on-tertiary-container",
  },
  { label: "destructive", className: "bg-destructive text-destructive-foreground" },
  {
    label: "success-container",
    className: "bg-success-container text-on-success-container",
  },
  {
    label: "warning-container",
    className: "bg-warning-container text-on-warning-container",
  },
  { label: "info-container", className: "bg-info-container text-on-info-container" },
];

const SURFACE_SWATCHES = [
  { label: "surface", className: "bg-surface text-on-surface" },
  { label: "container-lowest", className: "bg-surface-container-lowest text-on-surface" },
  { label: "container-low", className: "bg-surface-container-low text-on-surface" },
  { label: "container", className: "bg-surface-container text-on-surface" },
  { label: "container-high", className: "bg-surface-container-high text-on-surface" },
  {
    label: "container-highest",
    className: "bg-surface-container-highest text-on-surface",
  },
  { label: "inverse-surface", className: "bg-inverse-surface text-inverse-on-surface" },
  {
    label: "hero-ground",
    className: "bg-[var(--hero-ground)] text-[color:var(--hero-ink)]",
  },
];

const TYPE_STEPS = [
  { label: "display-large", className: "text-display-large" },
  { label: "display-medium", className: "text-display-medium" },
  { label: "display-small", className: "text-display-small" },
  { label: "headline-large", className: "text-headline-large" },
  { label: "headline-medium", className: "text-headline-medium" },
  { label: "headline-small", className: "text-headline-small" },
  { label: "title-large", className: "text-title-large" },
  { label: "title-medium", className: "text-title-medium" },
  { label: "title-small", className: "text-title-small" },
  { label: "body-large", className: "text-body-large" },
  { label: "body-medium", className: "text-body-medium" },
  { label: "body-small", className: "text-body-small" },
  { label: "label-large", className: "text-label-large" },
  { label: "label-medium", className: "text-label-medium" },
  { label: "label-small", className: "text-label-small" },
];

function Block({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-outline-variant pt-8">
      <h2
        id={id}
        className="font-[family-name:var(--font-display)] text-headline-small text-on-surface"
      >
        {title}
      </h2>
      {note ? (
        <p className="mt-1 max-w-[70ch] text-body-small text-on-surface-variant">
          {note}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  const unreplaced = unreplacedAssets();

  return (
    <main id="main" className="pb-action-bar min-h-dvh bg-surface">
      <Container className="flex flex-col gap-12 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label-small text-on-surface-variant uppercase">
              {brand.name} · Design system
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-display-small">
              Tokens, type and components
            </h1>
            <p className="mt-2 max-w-[70ch] text-body-medium text-on-surface-variant">
              Material 3 role tokens are canonical and are aliased onto the shadcn names,
              so unmodified primitives render to spec. Dark mode overrides only the{" "}
              <code className="font-[family-name:var(--font-mono)]">--md-*</code> sources,
              which is why both utility families flip together.
            </p>
          </div>
        </header>

        <Block
          id="viewports"
          title="Responsive review"
          note="The live site at the four widths the CI responsive gate asserts. If a layout is wrong here, the gate will fail — and vice versa."
        >
          <ViewportSwitcher />
        </Block>

        <Block id="colour" title="Colour roles">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ROLE_SWATCHES.map((swatch) => (
              <div
                key={swatch.label}
                className={`flex h-20 items-end rounded-lg p-3 text-label-medium ${swatch.className}`}
              >
                {swatch.label}
              </div>
            ))}
          </div>
        </Block>

        <Block
          id="surfaces"
          title="Surfaces"
          note="The elevation ladder. `hero-ground` is deliberately fixed across both schemes — see site.css."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SURFACE_SWATCHES.map((swatch) => (
              <div
                key={swatch.label}
                className={`flex h-20 items-end rounded-lg border border-outline-variant p-3 text-label-medium ${swatch.className}`}
              >
                {swatch.label}
              </div>
            ))}
          </div>
        </Block>

        <Block
          id="type"
          title="Type scale"
          note="Every step is clamp()-driven and in rem, so it scales continuously between 380px and 1280px and respects browser font scaling. Resize the window to see it move."
        >
          <div className="flex flex-col gap-3">
            {TYPE_STEPS.map((step) => (
              <div key={step.label} className="flex flex-wrap items-baseline gap-4">
                <span className="w-36 shrink-0 font-[family-name:var(--font-mono)] text-label-small text-on-surface-variant">
                  {step.label}
                </span>
                <span
                  className={`${step.className} ${step.label.startsWith("display") || step.label.startsWith("headline") ? "font-[family-name:var(--font-display)]" : ""} text-on-surface`}
                >
                  Audit, tax and advisory
                </span>
              </div>
            ))}
            <p className="mt-2 font-[family-name:var(--font-mono)] text-body-medium text-on-surface-variant">
              Mono · tabular figures: <span className="tabular">1,204,556.00</span>
            </p>
          </div>
        </Block>

        <Block
          id="brand"
          title="Brand marks"
          note="Inline SVG using currentColor, so both marks follow the theme."
        >
          <div className="flex flex-wrap items-center gap-8">
            <BrandLogo priority={false} className="h-14" />
            <div className="rounded-lg bg-[var(--hero-ground)] p-4">
              <BrandLogo priority={false} className="h-12" />
            </div>
          </div>
        </Block>

        <Block
          id="buttons"
          title="Buttons"
          note="Every variant carries `pointer-coarse:min-h-11`, so touch targets meet 44px without inflating desktop density."
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Book a consultation</Button>
              <Button variant="tonal">Tonal</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="rounded-lg bg-[var(--hero-ground)] p-4">
              <Button variant="inverse">On the deep ground</Button>
            </div>
          </div>
        </Block>

        <Block id="badges" title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Neutral</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Block>

        <Block id="cards" title="Card, heading and accordion">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardBody>
                <CardTitle>Audit &amp; assurance</CardTitle>
                <p className="text-body-medium text-on-surface-variant">
                  Statutory and special-purpose audits under Nepal Standards on Auditing,
                  with findings you can act on.
                </p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="tonal">
                  Read more
                </Button>
              </CardFooter>
            </Card>

            <div className="flex flex-col gap-8">
              <SectionHeading
                id="design-heading-sample"
                eyebrow="Section heading"
                title="Eyebrow rule, display heading, lede"
                lede="The same component drives every section on the site, so heading treatment cannot drift between them."
              />
              <Accordion>
                <AccordionItem value="one">
                  <AccordionTrigger>How are your fees set?</AccordionTrigger>
                  <AccordionPanel>
                    Fees are agreed in writing before work begins, based on scope and
                    complexity — never on a percentage of turnover.
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem value="two">
                  <AccordionTrigger>Do you work outside Kathmandu?</AccordionTrigger>
                  <AccordionPanel>
                    Yes. Most work is remote, with fieldwork scheduled on site where the
                    engagement requires it.
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </Block>

        <Block
          id="skeletons"
          title="Skeletons"
          note="Shape-matched to what they replace. A fallback that does not match its target trades a spinner for a layout shift."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="aspect-[16/9] w-full" />
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-outline-variant">
            <InsightRailSkeleton />
          </div>
        </Block>

        <Block
          id="slots"
          title="Image slots"
          note="Every slot has a locked ratio and declared intrinsic size, so replacing a placeholder with real art can never shift the layout."
        >
          <ScrollX label="Image slot specifications">
            <table className="w-full min-w-[36rem] text-left text-body-small">
              <thead className="text-label-small text-on-surface-variant uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-4">
                    Slot
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Ratio
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Intrinsic
                  </th>
                  <th scope="col" className="py-2">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody className="text-on-surface-variant">
                {Object.values(imageSlots).map((slot) => (
                  <tr key={slot.name} className="border-t border-outline-variant">
                    <td className="py-2 pr-4 font-[family-name:var(--font-mono)] text-on-surface">
                      {slot.name}
                    </td>
                    <td className="tabular py-2 pr-4">
                      {slot.ratio[0]}:{slot.ratio[1]}
                    </td>
                    <td className="tabular py-2 pr-4">
                      {slot.vector
                        ? "SVG"
                        : `${slot.intrinsic.width}×${slot.intrinsic.height}`}
                    </td>
                    <td className="py-2">{slot.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AssetImage
              asset={withAlt(assets.partnerPortrait, "")}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            />
            <AssetImage
              asset={assets.officeExterior}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            />
            <AssetImage
              asset={assets.articleCover}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            />
            <AssetImage
              asset={assets.heroLandscape}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            />
          </div>

          <p className="mt-4 text-body-small text-on-surface-variant">
            {unreplaced.length} of {unreplaced.length} slots still hold generated art. Run{" "}
            <code className="font-[family-name:var(--font-mono)]">pnpm assets:audit</code>{" "}
            for the handover checklist.
          </p>
        </Block>

        <Block
          id="honest-degradation"
          title="Honest degradation — the populated branch"
          note="These four sections render nothing on the live site, because the firm has published no statistics, people or offices. Sample data is supplied here so the styled state stays reviewable. Nothing below is a claim; this page is noindex."
        >
          <div className="flex flex-col gap-6 rounded-xl border border-dashed border-outline-variant p-4">
            <StatsBand stats={SAMPLE_STATS} />
            <PeopleRail people={SAMPLE_PEOPLE} />
            <Offices offices={SAMPLE_OFFICES} />
            <InsightRail
              articles={[
                {
                  slug: "sample-note",
                  title: "Sample guidance note",
                  excerpt:
                    "What the article card looks like once the insights endpoint ships in Phase 2.",
                  publishedAt: "2026-08-12T10:00:00+05:45",
                  updatedAt: "2026-09-01T10:00:00+05:45",
                  topic: "Income tax",
                  author: "CA Sample Partner, FCA",
                  reviewedBy: "CA Sample Reviewer, FCA",
                },
              ]}
            />
          </div>
        </Block>

        <Block id="marquee" title="Credential marquee">
          <CredentialMarquee />
        </Block>
      </Container>

      {/* The action bar is fixed and phone-only; shown here so its layout can
            be reviewed without opening dev tools. */}
      <MobileActionBar />
    </main>
  );
}
