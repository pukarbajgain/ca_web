/**
 * Rendered when Next cannot match this slot to the current URL — most often
 * during a client-side navigation into a route the slot's own segment tree does
 * not cover.
 *
 * Returning `null` is the correct behaviour, not a stub: chrome that cannot be
 * resolved for a path must render nothing rather than the previous path's
 * notice. Without this file the slot would hard-404 the page around it.
 */
export default function AnnouncementDefault() {
  return null;
}
