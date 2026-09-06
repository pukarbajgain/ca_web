import MarketingLayout from "@/app/(marketing)/layout";
import HomePage from "@/app/(marketing)/page";
import {
  AnnouncementFor,
  NoticesFor,
} from "@/features/site-messages/components/messages-for-path";

import type { Metadata } from "next";

/**
 * The framable preview target for `/design`'s viewport switcher.
 *
 * It renders the marketing chrome and the landing page directly — the same
 * component tree `/` renders, not a copy of it — so what the reviewer sees at
 * 390/768/1280/1920 is the real thing. Composing the route group's layout as a
 * plain component is legal precisely because a layout *is* a component; the
 * route group only decides which URLs Next wraps it around.
 *
 * It exists as a separate route for one reason: `X-Frame-Options: DENY` and
 * `frame-ancestors 'none'` are enforced on the framed document, so `/` cannot be
 * framed even by this origin. Rather than weaken the site-wide header, this one
 * path carries `SAMEORIGIN` / `frame-ancestors 'self'` (see next.config.ts).
 *
 * The two parallel-route slots are composed by hand here for the same reason:
 * outside the route group nothing routes them, so the preview renders each for
 * `/` directly. Passing `null` instead would have been less code and a worse
 * preview — a live announcement bar changes the height of everything below it,
 * which is precisely the kind of thing a reviewer is looking at when they open
 * this page at four viewport widths.
 *
 * `noindex, nofollow`, and it is excluded from the sitemap by `routes.ts`: it is
 * a duplicate of `/` and must never compete with it in search results.
 */
export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default function DesignPreviewPage() {
  return (
    <MarketingLayout
      announcement={<AnnouncementFor path="/" />}
      notices={<NoticesFor path="/" />}
    >
      <HomePage />
    </MarketingLayout>
  );
}
