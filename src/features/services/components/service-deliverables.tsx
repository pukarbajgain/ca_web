import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * "What you get" — the deliverables, as distinct from the scope.
 *
 * The distinction is why this is a separate section from "What's included":
 * scope is what we *do*, deliverables are what *lands on your desk*. A prospect
 * comparing two firms is comparing the second list, and most firms only publish
 * the first.
 *
 * Four lines, ruled, at a generous measure. The tick icons this started with
 * were removed: a checkmark on every row of a list titled "What you get" adds
 * no information a reader does not already have from the heading, and an icon
 * per item is exactly the decoration CLAUDE.md §3.8b rules out. The list
 * semantics carry it.
 */
export function ServiceDeliverables({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;

  return (
    <Section labelledBy="deliverables-heading" ground="muted" index="04">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="deliverables-heading"
            eyebrow="Deliverables"
            title="What you get"
          />
        </div>

        <ul className="border-t border-outline-variant lg:col-span-8">
          {items.map((item) => (
            <li
              key={item}
              className="max-w-[68ch] border-b border-outline-variant py-5 text-body-large text-on-surface-variant"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
