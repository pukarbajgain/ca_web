/**
 * Wire types for `GET /api/v1/public/site-messages?path=…`
 * (`backend/app/schemas/public/site_message.py`).
 *
 * **snake_case, mirroring the wire 1:1** (CLAUDE.md §5.1) so a field name is
 * greppable across all three repositories; the camelCase mapping happens once,
 * in `service.ts`, and never in a component.
 *
 * Note what the backend deliberately does *not* send: `status`, `starts_at`,
 * `ends_at`, `target_paths`. The window and the targeting have already been
 * resolved server-side, so a message that appears here is live on this path by
 * construction — and the firm's unpublished plans never reach a browser.
 */

/** The four surfaces. One row, one presentation — ARCHITECTURE.md §H.3. */
export type MessagePlacement =
  "announcement_bar" | "inline_banner" | "popup_modal" | "featured_notice";

/** Meaning, not colour: the admin picks the register, the design system picks
 *  the palette, so a rebrand is a token change rather than a data migration. */
export type MessageTone = "info" | "success" | "warning" | "critical";

/** How often a dismissed message may come back. Enforced in the browser,
 *  because the public site has no visitor identity to enforce it against. */
export type MessageFrequency =
  "always" | "once_per_session" | "once_per_day" | "once_ever";

/** What makes a popup appear. Meaningful for `popup_modal` only. */
export type MessageTrigger = "immediate" | "delay" | "scroll" | "exit_intent";

export type SiteMessageWire = {
  /** UUIDv7. The dismissal key — not a database id; the public API has none. */
  key: string;
  title: string;
  body: string | null;
  tone: MessageTone;
  icon: string | null;
  cta_href: string | null;
  cta_label: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  /** Percentages, so they can be written straight into `object-position`. */
  image_focal_x: number | null;
  image_focal_y: number | null;
  dismissible: boolean;
  frequency: MessageFrequency;
  trigger: MessageTrigger;
  trigger_value: number | null;
};

export type SiteMessagesWire = {
  path: string;
  announcement_bar: SiteMessageWire[];
  inline_banner: SiteMessageWire[];
  popup_modal: SiteMessageWire[];
  featured_notice: SiteMessageWire[];
  /** Earliest `ends_at` in this response, or null when nothing here expires. */
  next_expiry_at: string | null;
};
