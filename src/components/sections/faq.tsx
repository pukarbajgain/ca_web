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
import { faqs, type FaqItem } from "@/config/content";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * FAQ (§D.6 row 13): answers the objection before it becomes a bounce.
 *
 * Two constraints shape the content, both recorded in `config/content.ts`: every
 * answer is about **process, scope or timing**, never a position on a specific
 * tax treatment (published advice a reader might rely on carries real
 * professional liability — §P.3); and the fee question is answered plainly,
 * because "how much?" is the actual reason most visitors leave.
 *
 * `id="faq"` is stable so `routes.faq()` (`/#faq`) has something to land on, and
 * `Section` adds the `scroll-mt` that clears the sticky header.
 *
 * The `FAQPage` JSON-LD is assembled at page level rather than here, so the
 * structured data is one graph with the rest of it instead of one `<script>` per
 * section.
 */
export function Faq({ items = faqs }: { items?: readonly FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section id="faq" labelledBy="faq-heading" index="05">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="faq-heading"
            eyebrow={vocabulary.sections.faq}
            title="Questions we are asked"
            lede="If yours is not here, ask — a short call usually settles it."
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
          {/* Single-open by default: on a phone several open panels turn the
              section into a wall of text with no visible structure. */}
          <Accordion className="border-t border-outline-variant">
            {items.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionPanel>
                  <p className="max-w-[68ch]">{item.answer}</p>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
