import { NoticesFor } from "@/features/site-messages/components/messages-for-path";

/**
 * The in-page slot for the home page: featured notices, inline banners and the
 * popup mount.
 *
 * A second slot rather than one, because the two groups belong in different
 * places — the bar sits above the header, these sit at the top of `<main>` —
 * and a slot renders in exactly one position. The cost is nil: the read is
 * `cache()`d, so both slots resolve from a single request in a single render.
 *
 * The popup mounts here for no reason other than that it needs a mount point; a
 * native `<dialog>` renders in the browser's top layer, so its position in the
 * document does not affect where it appears.
 */
export default function NoticesRoot() {
  return <NoticesFor path="/" />;
}
