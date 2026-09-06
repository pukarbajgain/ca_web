import { credentials } from "@/config/content";
import { brand, isPresent } from "@/lib/brand";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Credential marquee (§D.6 row 4): quiet, factual, scannable.
 *
 * Every entry is a **descriptive statement of practice** — "Audit & assurance",
 * "Income tax · VAT · TDS" — not a claim that could be false. The one entry that
 * *would* be a claim, "Est. ____", is appended only when `brand.establishedYear`
 * holds a real year.
 *
 * Server-rendered with no JS: the list is repeated `MARQUEE_COPIES` times in
 * markup and the whole rail is translated by exactly one copy's width (see
 * `site.css`). Every copy after the first is `aria-hidden`, so a screen reader
 * hears the credentials once, and the strip is a labelled list rather than an
 * anonymous run of `<span>`s.
 *
 * ── Why four copies and not two ─────────────────────────────────────────────
 * A seamless loop needs the content that remains on screen at the end of the
 * cycle to still cover the viewport. With `C` copies of a track `T` wide, the
 * rail travels `T` and the covered width at the end of the cycle is `(C-1)·T`.
 * The list measures ~1300px, so two copies covered only ~1300px — fine at 1280,
 * but a 1920 or 4K viewport would run off the end of the content. Four copies
 * cover ~3900px, which clears every viewport the site is built for.
 *
 * (The version this replaced also animated each *track* by `-50%` of its own
 * width — half a list, not a whole one — so the pattern did not line up at the
 * loop point and the strip jumped once per cycle. Animating the rail by exactly
 * one copy is what makes it seamless.)
 */

/** Kept in step with the `--marquee-copies` custom property below; `site.css`
 *  divides by it to derive the translation, so the two cannot drift. */
const MARQUEE_COPIES = 4;

export function CredentialMarquee() {
  const items = [...credentials];
  if (isPresent(brand.establishedYear)) {
    items.push(`${vocabulary.labels.established} ${brand.establishedYear}`);
  }

  return (
    <section
      aria-label={vocabulary.sections.credentials}
      className="marquee-viewport overflow-hidden border-y border-outline-variant bg-surface-container-low py-3"
    >
      <div
        className="marquee-rail flex w-max"
        style={{ "--marquee-copies": MARQUEE_COPIES } as React.CSSProperties}
      >
        {Array.from({ length: MARQUEE_COPIES }, (_, copy) => (
          <CredentialTrack key={copy} items={items} duplicate={copy > 0} />
        ))}
      </div>
    </section>
  );
}

function CredentialTrack({
  items,
  duplicate = false,
}: {
  items: readonly string[];
  duplicate?: boolean;
}) {
  return (
    <ul
      className="marquee-track flex shrink-0 items-center"
      aria-hidden={duplicate ? true : undefined}
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-center px-5 text-label-medium whitespace-nowrap text-on-surface-variant uppercase"
        >
          <span aria-hidden className="mr-5 size-1 rounded-full bg-tertiary" />
          {item}
        </li>
      ))}
    </ul>
  );
}
