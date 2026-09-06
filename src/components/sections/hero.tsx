import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { services } from "@/config/content";
import { brand, isPresent } from "@/lib/brand";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { vocabulary } from "@/lib/vocabulary";

/**
 * Hero — **typographic, not photographic** (ARCHITECTURE.md §D.6).
 *
 * Three reasons this is the right call, all of which survive the arrival of real
 * assets:
 *
 *  1. It looks finished with placeholders and stays good afterwards. A hero built
 *     around a stock photograph gets designed around that photograph, and the
 *     firm's real photograph will not match it.
 *  2. It cannot be undermined by a mediocre photo — and a practice's first
 *     photoshoot usually produces mediocre photos.
 *  3. It is the fastest LCP available: the largest contentful paint is text in a
 *     font that is already self-hosted and preloaded, with no image request.
 *
 * ── What fills the right-hand half, and why it is not decoration ─────────────
 * A typographic hero on a wide screen has a real problem: a headline column
 * leaves half the viewport empty, and "empty" reads as unfinished rather than as
 * confident. The usual fixes are a stock photograph (rejected above) or an
 * abstract shape (pretty, says nothing).
 *
 * Instead the right column carries a **ruled index of the practice** — the
 * disciplines, numbered, on hairlines. It fills the space, it is drawn from the
 * firm's own material (a ledger is what an accountant rules), and it does real
 * work: a visitor who reads nothing but the hero still learns what the firm
 * does. It is the same content as the services grid, at a glance.
 *
 * One accent word carries the section's entire colour budget. The credential
 * line beneath the CTAs states what the firm *is*, and every element of it is
 * conditional — with nothing confirmed, the line disappears rather than
 * inventing a number (CLAUDE.md §3.5).
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      /* `-mt-16 pt-16` (and the `lg` pair) pulls the hero up under the sticky
       * header and pads the content back down. That is what lets the header
       * render transparent over the deep ground at the top of the page instead
       * of sitting on it as a light bar — see `site-header.tsx`. The two heights
       * must match the header's `h-16 lg:h-20`. */
      className="relative isolate -mt-16 overflow-hidden bg-[var(--hero-ground)] pt-16 text-[color:var(--hero-ink)] lg:-mt-20 lg:pt-20"
    >
      {/* Decorative layers: `aria-hidden` so they are never announced, and
          `pointer-events-none` so they can never swallow a tap on a CTA. */}
      <div
        aria-hidden
        className="ledger-rules pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_75%_55%_at_12%_0%,var(--hero-ground-2),transparent_72%)]"
      />
      {/* A single warm bloom behind the accent word, at very low strength. It is
          the only place the tertiary hue appears in the hero besides the word
          itself, which is what stops that word looking arbitrary. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-24 -z-10 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(255,199,142,0.10),transparent_65%)] blur-3xl"
      />

      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:min-h-[30rem] lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-7">
            {/* The spine ties the copy to the ledger grid. Only from `lg`, where
                there is a real gutter for it to sit in. */}
            <span
              aria-hidden
              className="ledger-spine absolute top-0 -left-8 hidden h-full w-px lg:block"
            />

            <p className="flex items-center gap-3 text-label-small text-[color:var(--hero-ink-subtle)] uppercase">
              <span aria-hidden className="h-px w-8 bg-current opacity-70" />
              Chartered Accountants · {brand.locale.country}
            </p>

            <h1
              id="hero-heading"
              className="mt-6 font-[family-name:var(--font-display)] text-display-large text-[color:var(--hero-ink)]"
            >
              Audit, tax and advisory,{" "}
              <em className="text-[color:var(--hero-accent)] not-italic">
                <span className="italic">explained plainly.</span>
              </em>
            </h1>

            <p className="mt-6 max-w-[52ch] text-body-large text-[color:var(--hero-ink-muted)]">
              We handle the statutory work a business in Nepal has to get right — audit,
              income tax, VAT and TDS, and the filings that follow — and we tell you what
              the numbers mean in language you can act on.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href={routes.contact()}
                className={cn(
                  buttonVariants({ variant: "inverse", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                {vocabulary.actions.book}
              </Link>

              {/* A text link, not a second button. Two filled CTAs make the
                  visitor choose, and §D.6 row 2 is explicit: one primary action. */}
              <Link
                href={routes.services()}
                className="group inline-flex min-h-11 items-center gap-2 self-start text-label-large text-[color:var(--hero-ink)] sm:self-auto"
              >
                <span className="relative">
                  {vocabulary.actions.viewAllServices}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-[color:var(--hero-accent)] transition-transform duration-300 group-hover:scale-x-100"
                  />
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
                />
              </Link>
            </div>

            <CredentialLine />
          </div>

          <div className="lg:col-span-5">
            <PracticeIndex />
          </div>
        </div>
      </Container>

      {/* Hairline seam into the credential marquee, so the deep ground ends on a
          drawn line rather than a hard colour change. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--hero-rule)] to-transparent"
      />
    </section>
  );
}

/**
 * The ruled index of disciplines. Reads the same `services` list the grid below
 * uses, so the two can never disagree about what the firm does.
 */
function PracticeIndex() {
  return (
    <div className="rounded-xl border border-[color:var(--hero-rule)] bg-white/[0.03] p-5 backdrop-blur-[1px] sm:p-6">
      <p className="text-label-small text-[color:var(--hero-ink-subtle)] uppercase">
        {vocabulary.sections.services}
      </p>

      <ul className="mt-4 flex flex-col">
        {services.map((service, index) => (
          <li key={service.slug}>
            <Link
              href={routes.service(service.slug)}
              className="group flex items-baseline gap-4 border-t border-[color:var(--hero-rule)] py-3 first:border-t-0 first:pt-0"
            >
              <span
                aria-hidden
                className="font-[family-name:var(--font-mono)] text-label-small text-[color:var(--hero-ink-subtle)]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-title-medium text-[color:var(--hero-ink)] transition-colors group-hover:text-[color:var(--hero-accent)]">
                {service.name}
              </span>
              <ArrowRight
                aria-hidden
                className="size-3.5 shrink-0 translate-y-0.5 text-[color:var(--hero-ink-subtle)] opacity-0 transition-all group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ICAN registration and year established. Both are verifiable facts, so both are
 * `null` until the firm confirms them and the whole line disappears rather than
 * leaving a stray separator (CLAUDE.md §3.5).
 */
function CredentialLine() {
  const items: string[] = [];
  if (isPresent(brand.icanRegistrationNumber)) {
    items.push(`${vocabulary.labels.icanRegistration} ${brand.icanRegistrationNumber}`);
  }
  if (isPresent(brand.establishedYear)) {
    items.push(`${vocabulary.labels.established} ${brand.establishedYear}`);
  }
  if (items.length === 0) return null;

  return (
    <p className="tabular mt-9 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[color:var(--hero-rule)] pt-5 text-body-small text-[color:var(--hero-ink-subtle)]">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-3">
          {index > 0 ? <span aria-hidden>·</span> : null}
          {item}
        </span>
      ))}
    </p>
  );
}
