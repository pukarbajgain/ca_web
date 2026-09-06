import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * The intro prose, in the left-rail/right-body figure the FAQ and sectors
 * sections already use, so the detail page reads as part of the same site.
 *
 * Returns `null` on an empty array rather than printing a heading over nothing —
 * the same rule the landing page's absent-data sections follow.
 *
 * The measure is capped at 68ch. Body copy at the full 82rem page width is
 * genuinely hard to read, and this is the block a prospect actually reads.
 */
export function ServiceOverview({ paragraphs }: { paragraphs: readonly string[] }) {
  if (paragraphs.length === 0) return null;

  return (
    <Section labelledBy="overview-heading" index="01">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="overview-heading"
            eyebrow="Overview"
            title="What this covers"
          />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-8">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="max-w-[68ch] text-body-large text-on-surface-variant"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
