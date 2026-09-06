import { getSiteMessages } from "../service";

import { AnnouncementBar } from "./announcement-bar";
import { DismissalSweep } from "./dismissal-sweep";
import { MessagePopup } from "./message-popup";
import { NoticeBand } from "./notice-band";

/**
 * The two chrome surfaces, resolved for one path.
 *
 * They live here rather than in the route files because each slot is routed
 * twice — once at the slot root for `/`, once through a catch-all for
 * everything below it — and four route files calling one function each is the
 * shape that keeps the fetch, the mapping and the markup in one place.
 *
 * (Why not a single *optional* catch-all, `[[...path]]`, which would need one
 * file per slot? Next rejects it: an optional catch-all matches `/` with the
 * same specificity as the group's own `page.tsx`, and the build fails with
 * "You cannot define a route with the same specificity as an optional
 * catch-all route". A required catch-all plus a root page covers the same URLs
 * with no ambiguity.)
 *
 * `getSiteMessages` is `cache()`d, so the two components below cost one request
 * between them even though each asks independently.
 */
export async function AnnouncementFor({ path }: { path: string }) {
  const messages = await getSiteMessages(path);
  return <AnnouncementBar messages={messages.announcementBar} />;
}

export async function NoticesFor({ path }: { path: string }) {
  const messages = await getSiteMessages(path);

  return (
    <>
      <NoticeBand featured={messages.featuredNotice} banners={messages.inlineBanner} />
      <MessagePopup messages={messages.popupModal} />
      <DismissalSweep />
    </>
  );
}
