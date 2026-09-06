import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

import type { ServiceFaq } from "../types";

/**
 * Per-service FAQs.
 *
 * Reuses `components/ui/accordion` — the same primitive the landing page's FAQ
 * and the footer's phone layout use — rather than a second accordion. Base UI
 * supplies the `aria-expanded`/`aria-controls` wiring and the height transition;
 * a hand-rolled `<details>` here would be a third behaviour for the same
 * interaction.
 *
 * **The copy discipline is the constraint that makes this section safe.** Every
 * answer is about scope, process, timing or fees — never a position on a
 * specific tax or accounting treatment. Published guidance a reader might rely
 * on carries professional liability (ARCHITECTURE.md §P.3) and belongs in an
 * article that has been through the `reviewed_by` workflow, not in marketing
 * copy that nobody signed.
 *
 * The `FAQPage` JSON-LD is assembled at page level from the same array, so the
 * structured data and the accordion cannot disagree.
 */
export function ServiceFaqs({
  faqs,
  serviceName,
}: {
  faqs: readonly ServiceFaq[];
  serviceName: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <Section labelledBy="service-faq-heading">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="service-faq-heading"
            eyebrow={vocabulary.sections.faq}
            title={`${serviceName} — questions we are asked`}
            lede="If yours is not here, ask. A short call usually settles it, and it costs nothing."
          />
          <Link
            href={routes.contact()}
            className="group mt-6 inline-flex min-h-11 items-center gap-2 text-label-large text-primary"
          >
            {vocabulary.actions.getInTouch}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="lg:col-span-8">
          <Accordion className="border-t border-outline-variant">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`service-faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionPanel>
                  <p className="max-w-[68ch]">{faq.answer}</p>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
