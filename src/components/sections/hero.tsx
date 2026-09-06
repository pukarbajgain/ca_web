import { ArrowRight, BadgeCheck, BarChart3, Users } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { AssetImage } from "@/components/media/asset-image";
import { buttonVariants } from "@/components/ui/button";
import { heroContent, type HeroTrustMarker } from "@/config/content";
import { assets, withAlt } from "@/lib/assets";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * The landing hero.
 *
 * ── The composition, and why it changes shape rather than scaling ───────────
 * The photograph is the firm's own office, and its left third is deliberately
 * empty worktop — that emptiness is the headline's ground. So from `lg` the
 * image is the section's *background*, the copy sits on the bright half, and a
 * scrim carries the white further right so the measure can breathe without the
 * text ever crossing onto the laptop.
 *
 * Below `lg` that cannot work: the subject sits on the right of the frame, and
 * cropping to a phone width either loses it or pushes the copy on top of it. So
 * the layout does not scale — it **recomposes**. The copy takes a clean white
 * ground of its own, and the photograph follows underneath as a full-bleed
 * band, still doing its job (this is a real practice, in a real office) without
 * fighting the words for the same pixels. Mobile-first means designing that
 * second composition, not shrinking the first (CLAUDE.md §3.3).
 *
 * The ink tokens live in `site.css` §1b so the scrim and the type are tuned
 * together in one place rather than at six call sites.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate bg-surface">
      {/* From `lg` the photograph is the ground. Below it, it is the band at the
          foot of the section instead — one asset, two compositions. */}
      <div aria-hidden className="absolute inset-0 -z-10 hidden lg:block">
        <AssetImage
          asset={withAlt(assets.heroLandscape, "")}
          sizes="100vw"
          priority
          rounded={false}
          className="h-full"
          imageClassName="object-cover"
        />
        {/* The scrim. Fully opaque across the measure, then released across a
            long fade so the join is never visible as an edge. The stops are
            deliberately generous: the headline's last line is its longest, and
            at 1440 it reaches the laptop — which is bright, but bright is not
            the same as uniform, and type must not sit on a gradient it was not
            measured against. */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface from-45% via-surface/70 via-64% to-transparent to-84%" />
      </div>

      <Container className="relative py-14 sm:py-20 lg:py-28 xl:py-32">
        <div className="max-w-2xl lg:max-w-[34rem] xl:max-w-[38rem]">
          {/* `text-balance` rather than a hand-placed break: the headline is
              three lines at `lg` and two at `xl`, and a <br> would be wrong at
              one of them. */}
          <h1
            id="hero-heading"
            className="mt-5 font-[family-name:var(--font-display)] text-display-medium text-balance text-[color:var(--hero-photo-ink)] xl:text-display-large"
          >
            {heroContent.headline}{" "}
            <span className="text-[color:var(--hero-photo-accent)]">
              {heroContent.headlineAccent}
            </span>
          </h1>

          <p className="max-w-prose-measure mt-6 text-body-large text-[color:var(--hero-photo-ink-muted)]">
            {heroContent.body}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href={routes.contact()}
              className={cn(
                buttonVariants({ variant: "primary", size: "lg" }),
                "group w-full sm:w-auto",
              )}
            >
              Book a Consultation
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
              />
            </Link>

            {/* An outlined button, not a text link. The reference gives the two
                actions equal weight and the fill is what separates them; §D.6's
                "one primary action" is satisfied by the fill, not by demoting
                the second to a link. */}
            <Link
              href={routes.services()}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full border-primary text-primary hover:bg-primary/5 sm:w-auto",
              )}
            >
              Explore Our Services
            </Link>
          </div>

          <TrustMarkers />
        </div>
      </Container>

      {/* The phone and tablet composition of the same photograph. `aria-hidden`
          and empty alt: it is atmosphere, and every fact it carries is already
          written above it in text. */}
      <div aria-hidden className="lg:hidden">
        <AssetImage
          asset={withAlt(assets.heroLandscape, "")}
          sizes="100vw"
          priority
          rounded={false}
        />
      </div>
    </section>
  );
}

const TRUST_ICONS = {
  registration: BadgeCheck,
  clients: Users,
  experience: BarChart3,
} as const satisfies Record<HeroTrustMarker["icon"], unknown>;

/**
 * The three trust markers.
 *
 * A `<ul>`, because it is a list of three peer claims and a screen reader
 * should be told how many there are before the first one.
 *
 * The icons are decorative and marked so: each sits beside its own label, and
 * announcing "badge check, Registered with ICAN" adds a word the reader did not
 * need. Colour is never the only carrier — every marker is readable with the
 * icons stripped out entirely.
 */
function TrustMarkers() {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3 sm:gap-y-0 lg:mt-12 lg:gap-x-8">
      {heroContent.trust.map((marker) => {
        const Icon = TRUST_ICONS[marker.icon];
        return (
          <li key={marker.lines.join(" ")} className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/35 text-primary"
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="text-body-small leading-snug text-balance text-[color:var(--hero-photo-ink-muted)]">
              {marker.lines.map((line, i) => (
                <span key={line} className="block">
                  {i === 0 ? (
                    <span className="font-medium text-on-surface">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
