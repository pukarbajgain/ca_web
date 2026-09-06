import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";

import { TONE_RULE, TONE_WORD } from "../tone";

import { DismissButton } from "./dismiss-button";
import { DismissalScript } from "./dismissal-script";

import type { SiteMessage } from "../service";

/**
 * The two in-page placements, rendered at the top of the content area.
 *
 * **Why here and not scattered through each page.** These are chrome: they are
 * the same on `/services` whichever section of `/services` you are reading, and
 * a placement that every page has to remember to render is a placement that a
 * page added next year will silently lack. The marketing layout renders this
 * band once, above `children`, and no page can forget it.
 *
 * **Why the two placements look different.** A featured notice is the firm
 * saying something substantial — a filing deadline, a new office — and gets a
 * band, a display-face heading and room for an image. An inline banner is a
 * single sentence of standing information, and gets a rule and a line of text.
 * If both were rendered the same way the admin's placement choice would be a
 * setting with no observable effect, which is the kind of control that teaches
 * an editor to stop trusting the console.
 *
 * **Neither is a card.** No border box, no shadow, no radius (CLAUDE.md §3.8b).
 * The band is a change of ground and the banner is a 2px rule; that is enough
 * separation, and it keeps the top of every page from turning into a stack of
 * floating panels.
 */
export function NoticeBand({
  featured,
  banners,
}: {
  featured: readonly SiteMessage[];
  banners: readonly SiteMessage[];
}) {
  if (featured.length === 0 && banners.length === 0) return null;

  const anyDismissible = [...featured, ...banners].some((message) => message.dismissible);

  return (
    <div className="print-hidden">
      {featured.map((message) => (
        <FeaturedNotice key={message.key} message={message} />
      ))}

      {banners.length > 0 ? (
        <Container className="flex flex-col gap-1 border-b border-outline-variant py-4">
          {banners.map((message) => (
            <InlineBanner key={message.key} message={message} />
          ))}
        </Container>
      ) : null}

      {anyDismissible ? <DismissalScript /> : null}
    </div>
  );
}

function FeaturedNotice({ message }: { message: SiteMessage }) {
  const word = TONE_WORD[message.tone];

  return (
    <section
      data-site-message={message.key}
      suppressHydrationWarning
      aria-label={message.title}
      className="border-b border-outline-variant bg-surface-container-low"
    >
      <Container
        className={`grid items-center gap-8 py-6 md:py-7 ${
          // The image column is only reserved when there is an image. A fixed
          // second track with nothing in it leaves a 20rem hole beside the text
          // on every desktop screen — the notice reads as a broken layout
          // rather than a restrained one.
          message.image ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          {/* The rule carries the tone. It is `border-s`, not `border-l`, so it
              stays on the reading-start edge if this site is ever set in a
              right-to-left script. */}
          <span
            aria-hidden
            className={`mt-1 h-8 border-s-2 ${TONE_RULE[message.tone]}`}
          />
          <div className="min-w-0 flex-1">
            {word ? (
              <p className="text-label-medium text-on-surface-variant uppercase">
                {word}
              </p>
            ) : null}
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-headline-small text-on-surface">
              {message.title}
            </h2>
            {message.body ? (
              <p className="max-w-prose-measure mt-2 text-body-medium text-on-surface-variant">
                {message.body}
              </p>
            ) : null}
            {message.ctaHref ? (
              <Link
                href={message.ctaHref}
                className="mt-4 inline-flex items-center gap-1.5 text-label-large text-primary hover:underline pointer-coarse:min-h-11"
              >
                {message.ctaLabel ?? "Read more"}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : null}
          </div>
          {message.dismissible ? (
            <DismissButton
              messageKey={message.key}
              frequency={message.frequency}
              label={`Dismiss: ${message.title}`}
            />
          ) : null}
        </div>

        {message.image ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             `AssetImage` takes a typed descriptor from `lib/assets.ts` by
             design, so that no component can name an image path. A CMS banner
             has no descriptor — its URL is data. The optimiser would add little
             anyway: the backend already stores content-addressed WebP
             renditions, so this is a re-encode of an encoded file. Width and
             height come from the wire, which is what keeps CLS at zero. */
          <img
            src={message.image.url}
            alt={message.image.alt}
            width={message.image.width ?? undefined}
            height={message.image.height ?? undefined}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: message.image.objectPosition }}
            className="aspect-[16/9] w-full object-cover"
          />
        ) : null}
      </Container>
    </section>
  );
}

function InlineBanner({ message }: { message: SiteMessage }) {
  const word = TONE_WORD[message.tone];

  return (
    <div
      data-site-message={message.key}
      suppressHydrationWarning
      className={`flex items-start gap-3 border-s-2 py-3 ps-4 ${TONE_RULE[message.tone]}`}
    >
      <p className="max-w-prose-measure min-w-0 flex-1 text-body-medium text-on-surface-variant">
        {word ? <span className="font-medium text-on-surface">{word}: </span> : null}
        <span className="text-on-surface">{message.title}</span>
        {message.body ? <span> {message.body}</span> : null}
        {message.ctaHref ? (
          /* Always underlined, never underline-on-hover. A link *inside a run of
             text* cannot rely on colour to be distinguishable (WCAG 1.4.1), and
             axe measures exactly that: the primary against the body colour is
             1.05:1, nowhere near the 3:1 a colour-only cue would need. The
             standalone CTAs elsewhere on this page are a different case — they
             sit on their own line, where colour is not the only cue. */
          <Link
            href={message.ctaHref}
            className="ms-1.5 text-primary underline underline-offset-2"
          >
            {message.ctaLabel ?? "Read more"}
          </Link>
        ) : null}
      </p>
      {message.dismissible ? (
        <DismissButton
          messageKey={message.key}
          frequency={message.frequency}
          label={`Dismiss: ${message.title}`}
        />
      ) : null}
    </div>
  );
}
