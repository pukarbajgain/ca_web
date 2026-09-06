import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Firm introduction (§D.6 row 6): two paragraphs, then links to the full story
 * and the team.
 *
 * The prose is deliberately about *how the firm works* rather than how good it
 * is. ICAN restricts comparative and superlative claims, and the constraint
 * improves the copy: "engagements are led by a partner and staffed by people who
 * stay with the file year on year" is verifiable, specific, and more persuasive
 * than "leading practice" ever was.
 *
 * Two columns from `lg` with the heading in a left rail. At that width a single
 * 100ch measure is unreadable and a centred block wastes the space; below it,
 * the rail stacks and the paragraphs get the full column.
 *
 * The three commitments beneath the prose are a deliberate addition: they are
 * the concrete form of the same claim, they are all things the firm controls
 * (so none is a fact awaiting confirmation), and they give the section something
 * scannable for the majority of visitors who will not read two paragraphs.
 *
 * **They are ruled entries, not cards** (CLAUDE.md §3.8b). They were a bordered,
 * filled, rounded three-cell panel, which put this section, the services grid
 * and the engagement steps into three consecutive card grids — the single most
 * template-like thing a page can do. Three short assertions do not need a box
 * each; a hairline and the type are enough, and the restraint reads as more
 * confident than the border did. The numerals went with the boxes: three
 * commitments are not a sequence, so numbering them encoded nothing true.
 */
const COMMITMENTS = [
  {
    title: "A partner on every file",
    body: "Not a partner on the proposal and a junior on the work.",
  },
  {
    title: "Scope and fee in writing first",
    body: "Agreed in the engagement letter before anything starts.",
  },
  {
    title: "Plain answers",
    body: "We explain the position rather than hand over a report that needs interpreting.",
  },
] as const;

export function FirmIntro() {
  return (
    <Section labelledBy="intro-heading" index="01">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Sticky rail from `lg`: the heading stays alongside the prose it names
            rather than scrolling away and leaving a column of empty ground. */}
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <SectionHeading
            id="intro-heading"
            eyebrow={vocabulary.sections.about}
            title={
              <>
                A practice built around{" "}
                <span className="text-primary">recurring obligations.</span>
              </>
            }
          />

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            <Link
              href={routes.about()}
              className="group inline-flex min-h-11 items-center gap-2 text-label-large text-primary"
            >
              {vocabulary.actions.ourStory}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
              />
            </Link>
            <Link
              href={routes.team()}
              className="group inline-flex min-h-11 items-center gap-2 text-label-large text-primary"
            >
              {vocabulary.actions.meetTheTeam}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        <div className="rise lg:col-span-7">
          {brand.intro.map((paragraph, index) => (
            <p
              key={paragraph.slice(0, 32)}
              className={
                index === 0
                  ? // The opening paragraph is set a step larger and in the
                    // display face: it is the firm's sentence, and setting it as
                    // body copy buries it.
                    "max-w-[62ch] font-[family-name:var(--font-display)] text-headline-small text-on-surface"
                  : "mt-6 max-w-[68ch] text-body-large text-on-surface-variant"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Full width, below both columns: the commitments are the concrete form
          of the paragraphs above, and confining them to the right column left a
          long stretch of empty ground beside them.

          One hairline above each entry, and nothing else. Stacked they read as a
          ruled list; in three columns the same rule is broken by the gutters,
          which is the ordinary editorial way to set three short statements
          side by side. */}
      <ul className="mt-14 grid gap-x-12 sm:grid-cols-3">
        {COMMITMENTS.map((commitment) => (
          <li
            key={commitment.title}
            className="border-t border-outline-variant pt-5 pb-6 sm:pb-0"
          >
            <h3 className="font-[family-name:var(--font-display)] text-title-large text-on-surface">
              {commitment.title}
            </h3>
            <p className="mt-2 max-w-[42ch] text-body-medium text-on-surface-variant">
              {commitment.body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
