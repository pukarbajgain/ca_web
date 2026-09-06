import { CtaBand } from "@/components/sections/cta-band";
import { HowWeWork } from "@/components/sections/how-we-work";
import { Sectors } from "@/components/sections/sectors";
import { JsonLd } from "@/components/seo/json-ld";
import { ServiceIndex } from "@/features/services/components/service-index";
import { ServicesHero } from "@/features/services/components/services-hero";
import { listServices } from "@/features/services/service";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { breadcrumbJsonLd, serviceListJsonLd } from "@/lib/seo";
import { vocabulary } from "@/lib/vocabulary";

import type { Metadata } from "next";

/**
 * `/services` — the practice-area index.
 *
 * **Pages are shells** (ARCHITECTURE.md §D.2): imports and JSX tags, with every
 * decision about layout, absence and copy living in the section that owns it.
 *
 * Section order and the reason for each:
 *
 *  1. `ServicesHero` — one wide statement on the site's deep ground. Nothing
 *     else: the jump list it used to carry was a second copy of the contents
 *     that begin one screen below (CLAUDE.md §3.8b).
 *  2. `ServiceIndex` — the substance. An editorial register of ruled rows with
 *     the *complete* sub-service list, deliberately not a second card grid.
 *  3. `HowWeWork` — reused verbatim from the landing page. "What actually
 *     happens if I engage you" is the question a visitor has *after* reading the
 *     services, which is exactly where it now sits.
 *  4. `Sectors` — relevant experience without naming a client, which is both a
 *     confidentiality requirement and what ICAN's advertising restrictions are
 *     most concerned with (CLAUDE.md §3.5).
 *  5. `CtaBand` — one invitation, no pressure language.
 *
 * Grounds alternate deep → muted → surface → muted → deep. `HowWeWork` and
 * `Sectors` set their own, so the alternation is checked here against what those
 * two actually render rather than assumed.
 *
 * ISR per §D.1. When `GET /api/v1/public/services` lands, `listServices()` gains
 * `tags: [COLLECTION_TAGS.service]` at the fetch site and a publish invalidates
 * this page precisely; the 300s floor below is the backstop for a missed
 * webhook, not the mechanism.
 */
/* A literal, not `DEFAULT_REVALIDATE_SECONDS` — Next statically analyses segment
 * config exports and rejects an imported binding ("Invalid segment configuration
 * export detected"). Kept in step with lib/fetcher.ts by hand. */
export const revalidate = 300;

const TITLE = "Services";
const DESCRIPTION =
  "Audit and assurance, taxation, accounting and payroll, company secretarial, financial reporting advisory and business advisory for entities in Nepal.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: routes.services() },
  openGraph: {
    type: "website",
    url: routes.services(),
    title: `${TITLE} — ${brand.name}`,
    description: DESCRIPTION,
  },
};

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <>
      <JsonLd
        nodes={[
          serviceListJsonLd(
            services.map((s) => ({ name: s.name, description: s.summary })),
          ),
          breadcrumbJsonLd([
            { name: "Home", path: routes.home() },
            { name: vocabulary.nav.services, path: routes.services() },
          ]),
        ]}
      />

      <ServicesHero />
      <ServiceIndex services={services} />
      <HowWeWork />
      <Sectors />
      <CtaBand />
    </>
  );
}
