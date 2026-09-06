import { AnnouncementFor } from "@/features/site-messages/components/messages-for-path";

/**
 * The announcement slot for the home page.
 *
 * Site messages are targeted by path, and a layout in the App Router is never
 * told which path it is rendering. The two obvious ways to get it both cost
 * more than they are worth: `headers()` marks the entire marketing tree
 * dynamic, ending ISR for every page on the site — and with it the property
 * that a backend outage serves cached HTML rather than taking the site down; a
 * client-side fetch puts a round trip and a layout shift at the top of every
 * page.
 *
 * A parallel route is the primitive that fits: a slot that is *routed*, so it
 * receives the path and caches per path, while rendering into a position the
 * layout chooses. `[...path]/page.tsx` beside this file covers every path below
 * `/`; the two together cover the whole marketing tree.
 */
export default function AnnouncementRoot() {
  return <AnnouncementFor path="/" />;
}
