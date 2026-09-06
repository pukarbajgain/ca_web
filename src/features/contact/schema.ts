import { z } from "zod";

/**
 * The enquiry contract — **one schema, both sides of the wire**.
 *
 * The client form parses with it before it posts, and `app/api/contact/route.ts`
 * parses with it again before it forwards. Sharing the module is what makes
 * those two checks impossible to drift apart; re-validating on the server is
 * what makes the client check a *convenience* rather than a control, which is
 * the only correct way round — a browser check is a UX feature, never a security
 * boundary.
 *
 * This file is imported by a client component, so it must stay free of
 * `server-only` modules and of `config/content.ts` (which would put every word
 * of the site's editorial copy into the browser bundle). The consequence is
 * `serviceSlug` below: the shape is checked here, membership of the real service
 * list is checked on the server, where the list already lives.
 */

/**
 * The honeypot field name.
 *
 * `botcheck` is what the reference sites use, and a *plausible* name matters:
 * a field called `honeypot` is skipped by anything more sophisticated than a
 * form-fill script. It is declared here rather than typed as a literal at three
 * call sites so the input, the schema and the route handler cannot disagree —
 * a honeypot the server checks under a different name is not a honeypot.
 */
export const HONEYPOT_FIELD = "botcheck";

/** Matches `revalidation-tags.ts`. A slug is a key, not free text. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** An optional free-text field. A browser posts `""` for "left blank"; both that
 *  and an absent key mean the same thing, and both become `undefined`. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} must be ${max} characters or fewer.` })
    .optional()
    .transform((value) => (value ? value : undefined));

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Please tell us your name." })
    .max(120, { error: "Name must be 120 characters or fewer." }),

  email: z
    .email({ error: "Please enter an email address we can reply to." })
    .max(200, { error: "Email must be 200 characters or fewer." }),

  /* Optional, and deliberately not pattern-matched. Nepali numbers are written
   * as +977-1-…, 01-…, 98…, with and without separators; a regex here would
   * reject real numbers to catch typos the firm can spot in a second. */
  phone: optionalText(40, "Phone number"),

  organisation: optionalText(160, "Organisation"),

  /**
   * The "Service needed" select.
   *
   * Shape only. The route handler checks the value against the real service list
   * and rejects an unknown slug — the form only ever offers real options, so a
   * mismatch means the request did not come from the form.
   */
  serviceSlug: z
    .union([
      z.literal(""),
      z
        .string()
        .max(80)
        .regex(SLUG_PATTERN, { error: "Select a service from the list." }),
    ])
    .optional()
    .transform((value) => (value ? value : undefined)),

  message: z
    .string()
    .trim()
    .min(10, { error: "A sentence or two about the entity and what is due is enough." })
    .max(4000, { error: "Message must be 4000 characters or fewer." }),

  /**
   * Consent. `z.literal(true)` rather than `z.boolean()`: an unchecked box is a
   * validation failure with a message, not a `false` that quietly forwards a
   * person's contact details anyway.
   */
  consent: z.literal(true, {
    error: "Please confirm you are happy for us to reply to this enquiry.",
  }),

  /**
   * The honeypot. A real person never sees this field, so any value in it is a
   * bot. Typed as "must be empty" for documentation; the *behaviour* lives in
   * the route handler, which returns a **fake success** before validation runs
   * rather than a 400 — an error would tell the bot what to change.
   */
  [HONEYPOT_FIELD]: z.string().max(0).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

/** The shape the form holds while it is being filled in: all strings, plus the
 *  checkbox. Parsed into `ContactFormValues` on submit. */
export type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  serviceSlug: string;
  message: string;
  consent: boolean;
  [HONEYPOT_FIELD]: string;
};

export const emptyContactForm: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  organisation: "",
  serviceSlug: "",
  message: "",
  consent: false,
  [HONEYPOT_FIELD]: "",
};

/** Field names the form can show an error against. */
export type ContactFieldName = keyof Omit<ContactFormState, typeof HONEYPOT_FIELD>;

/** Flatten a parse failure into `{ field: firstMessage }`, which is what a form
 *  renders. Only the first message per field: a stack of three messages under
 *  one input is noise, and the second is usually a consequence of the first. */
export function fieldErrorsFrom(
  error: z.ZodError<unknown>,
): Partial<Record<ContactFieldName, string>> {
  const out: Partial<Record<ContactFieldName, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (key === HONEYPOT_FIELD) continue;
    const field = key as ContactFieldName;
    if (out[field] === undefined) out[field] = issue.message;
  }
  return out;
}
