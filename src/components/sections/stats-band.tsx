import { Section } from "@/components/layout/section";
import { brand, type Stat } from "@/lib/brand";

/**
 * Stats band (§D.6 row 5) — **the clearest expression of the honest-degradation
 * rule in the codebase.**
 *
 * CLAUDE.md §3.5: "A placeholder photograph is honest; a placeholder statistic
 * is a false claim on a regulated professional's website." So this section takes
 * its figures from configuration and **renders nothing at all when there are
 * none** — not a skeleton, not a zero, not "coming soon". The component exists
 * and is styled and is exercised on `/design` with real sample values; it simply
 * has nothing to say on `/` yet, and saying nothing is the correct output.
 *
 * `.tabular` (globals.css) puts the figures on tabular numerals so a row of
 * numbers aligns on the decimal rather than shimmering.
 *
 * Layout: 2×2 on phone, single row from `md` (§D.3 rule 6).
 */
export function StatsBand({ stats = brand.stats }: { stats?: readonly Stat[] }) {
  if (stats.length === 0) return null;

  return (
    <Section
      labelledBy="stats-heading"
      size="compact"
      className="border-b border-outline-variant"
    >
      <h2 id="stats-heading" className="sr-only">
        The practice in figures
      </h2>
      {/* 2x2 on phone, one row from `md` (§D.3 rule 6). */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="flex flex-col gap-1">
            <dt className="order-2 text-body-small text-on-surface-variant">
              {stat.label}
            </dt>
            <dd className="tabular order-1 font-[family-name:var(--font-display)] text-display-small text-primary">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
