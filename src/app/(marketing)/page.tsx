import { CredentialMarquee } from "@/components/sections/credential-marquee";
import { CtaBand } from "@/components/sections/cta-band";
import { Faq } from "@/components/sections/faq";
import { FirmIntro } from "@/components/sections/firm-intro";
import { Hero } from "@/components/sections/hero";
import { HowWeWork } from "@/components/sections/how-we-work";
import { InsightRail } from "@/components/sections/insight-rail";
import { Offices } from "@/components/sections/offices";
import { PeopleRail } from "@/components/sections/people-rail";
import { Sectors } from "@/components/sections/sectors";
import { ServiceGrid } from "@/components/sections/service-grid";
import { StatsBand } from "@/components/sections/stats-band";
import { JsonLd } from "@/components/seo/json-ld";
import { faqs, services } from "@/config/content";
import { readSiteSettings } from "@/features/settings/service";
import { brand } from "@/lib/brand";
import { faqJsonLd, serviceListJsonLd } from "@/lib/seo";

/**
 * The landing page.
 *
 * **Pages are shells** (ARCHITECTURE.md §D.2): a list of `<Section/>` and
 * nothing else. Every decision about layout, absence and copy lives in the
 * section that owns it, which is why several of these render nothing today and
 * the page still reads correctly.
 *
 * Section order follows §D.6 exactly. Two rows of that table are deliberately
 * absent from this file: the utility bar and header (rows 1–2) and the footer
 * (row 16) belong to the route-group layout, and the compliance-deadline widget
 * (row 12) needs a Bikram Sambat calendar and a statutory deadline table that
 * neither repo has yet — shipping a wrong deadline is worse than shipping none.
 *
 * ISR with tags, per §D.1. The 300s floor is a backstop; the real freshness
 * mechanism is the tagged invalidation the backend triggers through
 * `/api/revalidate`.
 */
/* A literal, not `DEFAULT_REVALIDATE_SECONDS` — Next statically analyses segment
 * config exports at build time and rejects an imported binding outright
 * ("Invalid segment configuration export detected"). The value must therefore be
 * kept in step with `DEFAULT_REVALIDATE_SECONDS` in lib/fetcher.ts by hand. */
export const revalidate = 300;

export default async function HomePage() {
  /**
   * Site settings are the one live read on this page, and the three outcomes are
   * kept distinct on purpose (CLAUDE.md §3.8c).
   *
   *  - **ok** — render what the firm has published.
   *  - **absent** — the backend answered and has no settings row yet, so the
   *    locally-configured values *are* the current truth. Rendering them is
   *    correct, not a fallback.
   *  - **unavailable** — the read failed. Substituting the local list here would
   *    present possibly-stale addresses as current, which is the "confident
   *    empty state built on a failed fetch" §3.8c forbids, in its more dangerous
   *    inverted form. So nothing is substituted: the section renders nothing,
   *    the warning and its request id are already logged by the fetcher, and the
   *    page makes no location claim it cannot stand behind.
   *
   * All three are visually identical today, because every office list involved
   * is empty. That is exactly why the distinction has to live in the code rather
   * than in whether the output happens to look the same this week.
   */
  const settings = await readSiteSettings();
  const offices =
    settings.status === "ok"
      ? settings.settings.offices
      : settings.status === "absent"
        ? brand.offices
        : [];

  return (
    <>
      {/* Page-level structured data. The organisation and website nodes come
          from the root layout; these two are specific to what this page shows. */}
      <JsonLd
        nodes={[
          serviceListJsonLd(
            services.map((s) => ({ name: s.name, description: s.summary })),
          ),
          faqJsonLd(faqs),
        ]}
      />

      <Hero />
      <CredentialMarquee />
      {/* Renders nothing until real, sourced figures exist (CLAUDE.md §3.5). */}
      <StatsBand />
      <FirmIntro />
      <ServiceGrid />
      <HowWeWork />
      <Sectors />
      {/* Renders nothing until real people consent to being listed. */}
      <PeopleRail />
      {/* `GET /public/articles` is Phase 2 (API_CONTRACT.md §6). The section is
          built and tested; it is handed an empty list rather than a fabricated
          one, and gains its data with a one-line change when the endpoint ships. */}
      <InsightRail articles={[]} />
      <Faq />
      <Offices offices={offices} />
      <CtaBand />
    </>
  );
}
