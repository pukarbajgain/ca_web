import "server-only";
import { cache } from "react";

import { fetchSiteMessages } from "./api";

import type {
  MessageFrequency,
  MessageTone,
  MessageTrigger,
  SiteMessageWire,
} from "./types";

/** Domain shape. camelCase, and only what a surface actually renders. */
export type SiteMessage = {
  readonly key: string;
  readonly title: string;
  readonly body: string | null;
  readonly tone: MessageTone;
  readonly ctaHref: string | null;
  readonly ctaLabel: string | null;
  readonly image: {
    readonly url: string;
    readonly alt: string;
    readonly width: number | null;
    readonly height: number | null;
    /** Already a CSS `object-position` value, so no component recomputes it. */
    readonly objectPosition: string;
  } | null;
  readonly dismissible: boolean;
  readonly frequency: MessageFrequency;
  readonly trigger: MessageTrigger;
  readonly triggerValue: number | null;
};

export type SiteMessages = {
  readonly announcementBar: readonly SiteMessage[];
  readonly inlineBanner: readonly SiteMessage[];
  readonly popupModal: readonly SiteMessage[];
  readonly featuredNotice: readonly SiteMessage[];
};

const NONE: SiteMessages = {
  announcementBar: [],
  inlineBanner: [],
  popupModal: [],
  featuredNotice: [],
};

function toMessage(wire: SiteMessageWire): SiteMessage {
  return {
    key: wire.key,
    title: wire.title,
    body: wire.body,
    tone: wire.tone,
    ctaHref: wire.cta_href,
    ctaLabel: wire.cta_label,
    image: wire.image_url
      ? {
          url: wire.image_url,
          // An empty alt is the correct value for a purely decorative banner
          // image, and the backend allows it; it must not become the title,
          // which a screen reader would then hear twice.
          alt: wire.image_alt ?? "",
          width: wire.image_width,
          height: wire.image_height,
          objectPosition: `${wire.image_focal_x ?? 50}% ${wire.image_focal_y ?? 50}%`,
        }
      : null,
    dismissible: wire.dismissible,
    frequency: wire.frequency,
    trigger: wire.trigger,
    triggerValue: wire.trigger_value,
  };
}

/**
 * Every live message for one path, grouped by where it renders.
 *
 * **This is the one read on the site that collapses "unavailable" into
 * "nothing", and the exception is principled.** CLAUDE.md §3.8c exists because
 * an empty state built on a failed fetch is a *claim*: "this firm has published
 * no articles" is false and damaging. A missing announcement bar claims
 * nothing — the page simply carries no notice, which is its resting state on
 * most days of the year. Rendering "we could not load the banner" would be
 * worse than useless: it would put an error in the most prominent strip on the
 * page, about content the visitor never knew existed.
 *
 * The failure is not swallowed silently. `apiGetOptional` logs it server-side
 * with the backend's request id, so an outage is still one grep away
 * (ARCHITECTURE.md §D.4 — chrome degrades to nothing, and says so in the log).
 *
 * `cache()` dedupes across the two parallel-route slots that both need this
 * data in the same render, so the announcement bar and the notices band cost
 * one request between them, not two.
 */
export const getSiteMessages = cache(async (path: string): Promise<SiteMessages> => {
  const read = await fetchSiteMessages(path);
  if (read.status !== "ok") return NONE;

  const wire = read.data;
  return {
    announcementBar: wire.announcement_bar.map(toMessage),
    inlineBanner: wire.inline_banner.map(toMessage),
    popupModal: wire.popup_modal.map(toMessage),
    featuredNotice: wire.featured_notice.map(toMessage),
  };
});

/** Re-exported so a slot page needs one import, not two. */
export { pathFromSegments } from "./path";
