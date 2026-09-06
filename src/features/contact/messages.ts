/**
 * Every reader-facing string the enquiry form can show, in one file.
 *
 * CLAUDE.md §5.2 and §3.8c: errors are **one layer, not forty call sites**, and
 * the client **branches on the error `code`, never on prose**. The route handler
 * returns a stable machine code; this module is the only place that turns one
 * into English, so re-wording an apology is a one-line review rather than a
 * search across components.
 *
 * ── The wording rules, which are the substance of §3.8c ─────────────────────
 *  - **Never expose anything technical.** No status codes, no exception names,
 *    no framework text. "502" is not a sentence a visitor can act on.
 *  - **Say what happened and what to do next.** Every message below names the
 *    state of the enquiry ("nothing has been sent") and an action.
 *  - **Never claim a success we cannot back.** The `upstream_unavailable`
 *    wording exists because the alternative — a cheerful thank-you over a
 *    dropped submission — is the worst thing this page can do: the visitor waits
 *    for a reply that was never going to come, and the practice never learns
 *    they wrote.
 *  - **Retry is offered only where retrying could help.** A transport failure and
 *    an unreachable backend are worth another press; a validation failure is not,
 *    and it is answered next to the field instead.
 */

/** Machine codes `POST /api/contact` can return. The client switches on these. */
export const CONTACT_ERROR_CODES = [
  "invalid_request",
  "validation_failed",
  "rate_limited",
  "upstream_unavailable",
  "network_error",
] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

export function isContactErrorCode(value: unknown): value is ContactErrorCode {
  return (
    typeof value === "string" &&
    (CONTACT_ERROR_CODES as readonly string[]).includes(value)
  );
}

export const contactMessages = {
  success: {
    title: "Your enquiry has reached us.",
    /** What happens next, and roughly when — §3.8c: a success state confirms the
     *  consequence, not merely that a button worked. */
    body: "Someone from the practice reads every enquiry that comes in and will reply within one working day. Our working week is Sunday to Friday.",
    aboutService: (service: string) => `We have it noted against ${service}.`,
  },

  errors: {
    invalid_request:
      "Something in the form did not come through, so nothing has been sent. Please try again.",
    /* Reachable only if the browser and the server disagree about the shape of
     * the form, which should not happen — they share one schema. It is answered
     * next to the offending fields, so this sentence is a fallback. */
    validation_failed:
      "Please check the highlighted answers and send again. Nothing has been sent yet.",
    rate_limited:
      "You have sent several enquiries in a short time, so this one has not been sent. Please try again in a few minutes.",
    upstream_unavailable:
      "We could not send that just now, and nothing has been delivered. Please try again in a moment.",
    network_error:
      "Your message did not leave this browser, so nothing has been sent. Check your connection and try again.",
  } satisfies Record<ContactErrorCode, string>,

  /** Which failures are worth another press of the button. */
  retryable: {
    invalid_request: true,
    validation_failed: false,
    rate_limited: false,
    upstream_unavailable: true,
    network_error: true,
  } satisfies Record<ContactErrorCode, boolean>,

  /**
   * The bridge between "clear to the visitor" and "diagnosable by us" (§3.8c).
   * The route handler logs the same reference against the failure, so a visitor
   * who quotes it can be matched to an exact request — with no personal data in
   * the log line to make the match.
   */
  errorReference: (reference: string) => `Reference ${reference}`,

  /** Introduces the direct channels offered as a way round a failed send. */
  alternativesLead: "In the meantime you can reach us directly:",

  labels: {
    name: "Full name",
    email: "Email",
    phone: "Phone",
    organisation: "Organisation",
    service: "Service needed",
    servicePlaceholder: "Not sure yet",
    message: "How can we help?",
    /* A function, not a string: the firm's name lives in exactly one file
     * (`lib/brand.ts`, CLAUDE.md §5.1) and the server page passes it in, which
     * also keeps the whole brand module out of the client bundle. */
    consent: (firm: string) =>
      `I am happy for ${firm} to use these details to reply to this enquiry.`,
    submit: "Send enquiry",
    submitting: "Sending…",
    retry: "Try again",
    optional: "Optional",
    /* The honeypot's own label. Never seen by a person — the field is
     * screen-reader-hidden and off the tab order — but a label is what makes a
     * naive bot confident enough to fill it in. */
    honeypot: "Leave this field empty",
  },

  form: {
    heading: "Send an enquiry",
    lede: "Tell us what the entity is and what is due. If it is not work for us, we will say so and point you somewhere useful.",
    /** Shown when the firm has published no phone, WhatsApp or email at all. */
    noDirectChannels:
      "This form is the way to reach us at the moment. It goes straight to the practice, and we reply within one working day.",
    privacyNote:
      "We use what you send here to answer your enquiry and for nothing else. Client confidentiality under the ICAN code of ethics applies from the first conversation.",
  },
} as const;

/**
 * Validation wording, in the same file for the same reason.
 *
 * §3.8c: "say what is wrong **and how to fix it**". Every sentence below is an
 * instruction — "Enter a phone number we can reach you on", never "Invalid
 * input" — and each one is attached to its own field rather than collected into
 * a banner in the corner of the page.
 *
 * These are the messages carried by `schema.ts` itself, so the browser and the
 * server produce identical wording. This map covers only the case where the
 * *server* reports a field the client thought was fine, which is a contract
 * drift rather than a typing mistake.
 */
export const genericFieldError = "Please check this answer and try again.";
