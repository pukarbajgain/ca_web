import type { MessageTone } from "./types";

/**
 * Tone → classes, in one table.
 *
 * The admin chooses *meaning* (`info`, `warning`) and this file chooses the
 * paint. That separation is why a rebrand is a token change and not a data
 * migration — and why nobody writing a component has to remember which of the
 * four container pairs goes with "critical".
 *
 * **Two registers, not one palette applied twice.** A full-width strip across
 * the top of the page is the one place a tone may be loud: it is short-lived,
 * it is the firm speaking, and a coloured band is what a reader already
 * understands. Everywhere else the tone is a 2px rule and nothing more.
 * Painting a notice block in the same container colour would give the page two
 * competing coloured masses and turn a professional site into a dashboard of
 * alerts (CLAUDE.md §3.8b).
 */
export const TONE_STRIP: Record<MessageTone, string> = {
  info: "bg-info-container text-on-info-container",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  critical: "bg-error-container text-on-error-container",
};

/** The quiet register: a rule in the tone colour on a neutral ground. */
export const TONE_RULE: Record<MessageTone, string> = {
  info: "border-s-info",
  success: "border-s-success",
  warning: "border-s-warning",
  critical: "border-s-destructive",
};

/**
 * The tone as a word, for the small label above a notice.
 *
 * Colour alone must never be the only carrier of meaning (WCAG 1.4.1), and a
 * reader who cannot see the rule still needs to know this one is urgent.
 * `info` returns null: "Information" above a piece of information is noise, and
 * an info notice is not making a claim the reader needs warning about.
 */
export const TONE_WORD: Record<MessageTone, string | null> = {
  info: null,
  success: "Good news",
  warning: "Please note",
  critical: "Important",
};
