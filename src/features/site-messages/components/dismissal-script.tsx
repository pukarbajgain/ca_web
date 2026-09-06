import { PREPAINT_DISMISSAL_SCRIPT } from "../dismissal";

/**
 * Runs the dismissal check before the browser paints the messages above it.
 *
 * Placed immediately *after* the markup it governs, not in `<head>`: it queries
 * `[data-site-message]` elements, so they have to exist, and the parser has not
 * reached anything below this point yet — which is exactly the window in which
 * hiding an element costs nothing and produces no layout shift.
 *
 * `dangerouslySetInnerHTML` is the only way to emit an inline script from React,
 * and the content is a module constant with no interpolation from any request,
 * response or user input. The CSP allows inline script for the reason
 * `next.config.ts` documents at length: nonces would force every page off the
 * static path, which is the whole rendering strategy of this site.
 */
export function DismissalScript() {
  return <script dangerouslySetInnerHTML={{ __html: PREPAINT_DISMISSAL_SCRIPT }} />;
}
