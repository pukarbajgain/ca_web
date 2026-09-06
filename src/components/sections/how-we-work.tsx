import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { engagementSteps } from "@/config/content";
import { vocabulary } from "@/lib/vocabulary";

/**
 * How we work (§D.6 row 8): removes the "what actually happens if I call?"
 * hesitation, which is the largest single source of drop-off on a
 * professional-services site.
 *
 * ── It is a numbered sequence, and it is set as one ──────────────────────────
 * This shipped as four bordered, filled cells in a rounded panel. Two problems
 * with that, both named in CLAUDE.md §3.8b. First, it made this the third
 * consecutive card grid on the page, which is what makes a page read as a
 * template rather than as a firm's own site. Second, and worse, four equal boxes
 * say "four things"; the content is *four things in order*, and the composition
 * was contradicting it.
 *
 * So the boxes are gone and the numeral does the work: an `<ol>` where each step
 * hangs beneath a hairline and opens with a large serif numeral. The rules line
 * up across the row and read as one continuous rule broken by the gutters, so
 * the sequence is legible before a word of it is read. That is a structural
 * device encoding something true — the order genuinely matters — rather than
 * decoration.
 *
 * Three things were removed rather than restyled, because the section is better
 * without them: the panel border and fill, the "STEP 01" mono label (the numeral
 * beside it already said that), and an oversized 7%-opacity SVG watermark of the
 * same number, which was a third statement of the same fact drawn as an effect.
 *
 * Layout is per-viewport, not shrunk (§D.3 rule 6): a stacked ruled list on a
 * phone, 2×2 on a tablet and laptop, and four across only from `xl`, where the
 * column is wide enough that a step title stays on two lines. Reserving those
 * two lines from `xl` is what puts the four bodies on one baseline — at 1024 in
 * a four-column row one title wrapped to three lines while its neighbours took
 * one, and the paragraphs began 30px apart.
 */
export function HowWeWork() {
  return (
    <Section labelledBy="how-heading">
      <SectionHeading
        id="how-heading"
        eyebrow={vocabulary.sections.howWeWork}
        title="How an engagement runs"
        lede="No proposal theatre. Four steps, and you know the scope and the fee basis in writing before any work starts."
      />

      <ol className="mt-14 grid gap-x-10 md:grid-cols-2 xl:grid-cols-4">
        {engagementSteps.map((step, index) => (
          <li
            key={step.title}
            className="border-t border-outline-variant pt-6 pb-10 xl:pb-0"
          >
            {/* `aria-hidden` because the `<ol>` already tells a screen reader
                "3 of 4"; this is the same fact, set for the eye. `tabular`
                keeps the four numerals on the same width. */}
            <p
              aria-hidden
              className="tabular font-[family-name:var(--font-display)] text-display-small text-primary"
            >
              {String(index + 1).padStart(2, "0")}
            </p>

            <h3 className="mt-5 font-[family-name:var(--font-display)] text-title-large text-on-surface xl:min-h-[2lh]">
              {step.title}
            </h3>

            <p className="mt-3 max-w-[42ch] text-body-medium text-on-surface-variant">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
