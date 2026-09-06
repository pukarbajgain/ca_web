"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

import {
  contactMessages,
  genericFieldError,
  isContactErrorCode,
  type ContactErrorCode,
} from "../messages";
import {
  contactSchema,
  emptyContactForm,
  fieldErrorsFrom,
  HONEYPOT_FIELD,
  type ContactFieldName,
  type ContactFormState,
} from "../schema";

import { CheckboxField, SelectField, TextAreaField, TextField } from "./fields";

/**
 * The enquiry form.
 *
 * This is the most consequential feedback surface on the public site: a failed
 * enquiry is a lost client, and a *falsely successful* one is worse — the
 * visitor waits for a reply that was never coming and the practice never learns
 * they wrote. Everything below follows from that (CLAUDE.md §3.8c).
 *
 * ── The states, kept distinct ───────────────────────────────────────────────
 * `idle | submitting | sent | error`, and a failed send **never** renders as a
 * success. The route handler reports whether the enquiry actually reached the
 * practice; if it did not, the form stays on screen with everything the visitor
 * typed still in it, says plainly that nothing was sent, offers a retry where
 * retrying could help, and shows a reference they can quote.
 *
 * ── Where each kind of feedback goes ────────────────────────────────────────
 *  - **Validation** is inline, next to the offending field, on blur and on
 *    submit — never a summary banner. A message in the corner of the page about
 *    a field two screens up is not feedback, it is a puzzle. Each sentence says
 *    how to fix it, and they live in `schema.ts` so the client and the server
 *    produce identical wording.
 *  - **Transport and server failures** go in one live region above the button:
 *    they are about the submission as a whole, not about any field.
 *  - **Pending** is on the button itself, with `aria-busy` and a disabled
 *    control, because that is what was pressed.
 *  - **Success** replaces the form. A toast that fades is not a state change,
 *    and this one has to say what happens next and roughly when.
 *
 * ── Why plain React state and not react-hook-form ───────────────────────────
 * `react-hook-form` is in the project's locked stack but not in this
 * repository's dependency set, and this is the only form on the public site.
 * Adding a dependency and a lockfile change to manage seven fields would cost
 * more than it saves; the shared Zod schema does the work either way.
 *
 * ── Why it posts to our own route handler ───────────────────────────────────
 * ARCHITECTURE.md §C.2: the browser never talks to the backend. The only
 * browser→server traffic from `web` is to its own route handlers, first-party
 * and same-origin — which is also why the CSP can stay `connect-src 'self'`.
 */

type Status = "idle" | "submitting" | "sent" | "error";

/** A direct channel offered as a way round a failed send. Built server-side
 *  from `lib/brand.ts`, so an absent value produces no entry at all. */
export type ContactFallback = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
};

const FIELD_ORDER: ContactFieldName[] = [
  "name",
  "email",
  "phone",
  "organisation",
  "serviceSlug",
  "message",
  "consent",
];

export function EnquiryForm({
  services,
  firmName,
  /** Rendered when the firm publishes no phone, WhatsApp or email at all. */
  showNoDirectChannelsNote,
  /** Phone/email to fall back to when a send fails. Empty while both are null. */
  fallbacks,
}: {
  services: readonly { slug: string; name: string }[];
  firmName: string;
  showNoDirectChannelsNote: boolean;
  fallbacks: readonly ContactFallback[];
}) {
  const formId = useId();
  const [values, setValues] = useState<ContactFormState>(emptyContactForm);
  const [errors, setErrors] = useState<Partial<Record<ContactFieldName, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorCode, setErrorCode] = useState<ContactErrorCode>("network_error");
  const [reference, setReference] = useState<string | null>(null);
  const [sentService, setSentService] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  /* Guards the window between the submit handler starting and React committing
   * `status = "submitting"`. `disabled` alone loses a double-press inside that
   * gap, which is exactly what an anxious visitor on a slow connection does. */
  const inFlight = useRef(false);

  const field = (name: ContactFieldName) => `${formId}-${name}`;

  function set<K extends keyof ContactFormState>(name: K, value: ContactFormState[K]) {
    setValues((current) => ({ ...current, [name]: value }));
    if (name !== HONEYPOT_FIELD && errors[name as ContactFieldName]) {
      // Clear as they fix it. Leaving a message under a field the visitor has
      // just corrected reads as "still wrong", and is a common reason someone
      // abandons a form they have already put right.
      setErrors((current) => ({ ...current, [name as ContactFieldName]: undefined }));
    }
  }

  /**
   * Validate one field when focus leaves it.
   *
   * Parsing the whole object and reading a single key out is deliberate: the
   * schema is one object with cross-field wording, and re-deriving a per-field
   * schema would be a second source of truth. Untouched fields are unaffected
   * because only the blurred key is written — a form must not turn red because
   * someone tabbed through it.
   */
  function validateOnBlur(name: ContactFieldName) {
    const parsed = contactSchema.safeParse(values);
    const message = parsed.success ? undefined : fieldErrorsFrom(parsed.error)[name];
    setErrors((current) => ({ ...current, [name]: message }));
  }

  /** Move focus to the first field with a message, so a keyboard or screen
   *  reader user is taken to the problem instead of hunting for it. */
  function focusFirstError(found: Partial<Record<ContactFieldName, string>>) {
    const first = FIELD_ORDER.find((name) => found[name]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(field(first))}`)?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      // Inline, on the fields themselves. No banner: §3.8c puts a validation
      // message next to the input, not in a corner.
      const found = fieldErrorsFrom(parsed.error);
      setErrors(found);
      setStatus("idle");
      focusFirstError(found);
      return;
    }

    inFlight.current = true;
    setErrors({});
    setReference(null);
    setStatus("submitting");

    try {
      const response = await fetch(routes.contactApi(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (response.ok) {
        setSentService(
          services.find((s) => s.slug === parsed.data.serviceSlug)?.name ?? null,
        );
        setStatus("sent");
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const envelope = (body ?? {}) as Record<string, unknown>;
      const code = isContactErrorCode(envelope.code)
        ? envelope.code
        : "upstream_unavailable";

      /* The server found a field our own schema accepted — the two contracts
       * have drifted. Still answered next to the field rather than as a banner,
       * because that is where a visitor can act on it. */
      if (code === "validation_failed" && Array.isArray(envelope.fields)) {
        const found: Partial<Record<ContactFieldName, string>> = {};
        for (const name of envelope.fields) {
          if (FIELD_ORDER.includes(name as ContactFieldName)) {
            found[name as ContactFieldName] = genericFieldError;
          }
        }
        if (Object.keys(found).length > 0) {
          setErrors(found);
          setStatus("idle");
          focusFirstError(found);
          return;
        }
      }

      setReference(typeof envelope.reference === "string" ? envelope.reference : null);
      setErrorCode(code);
      setStatus("error");
    } catch {
      // The request never left the browser. Distinct from a server refusal, and
      // the message says so — "nothing has been sent" is the actionable part.
      setErrorCode("network_error");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "sent") {
    return (
      /* A quiet block, not a bordered "success card". Once it appears it is the
         only thing on this half of the page, so it needs no box to be found —
         and a ticked green panel would be the loudest element on a page whose
         whole register is deliberately calm. */
      <div role="status" className="border-t-2 border-primary pt-8">
        <h3 className="font-[family-name:var(--font-display)] text-headline-small text-on-surface">
          {contactMessages.success.title}
        </h3>
        <p className="mt-4 max-w-[56ch] text-body-large text-on-surface-variant">
          {contactMessages.success.body}
        </p>
        {sentService ? (
          <p className="mt-2 max-w-[56ch] text-body-large text-on-surface-variant">
            {contactMessages.success.aboutService(sentService)}
          </p>
        ) : null}
      </div>
    );
  }

  const submitting = status === "submitting";
  const showFormError = status === "error";
  const retryable = contactMessages.retryable[errorCode];

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {showNoDirectChannelsNote ? (
        <p className="max-w-[62ch] border-l-2 border-outline pl-4 text-body-large text-on-surface-variant">
          {contactMessages.form.noDirectChannels}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          id={field("name")}
          name="name"
          label={contactMessages.labels.name}
          autoComplete="name"
          required
          value={values.name}
          error={errors.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => validateOnBlur("name")}
        />

        <TextField
          id={field("email")}
          name="email"
          type="email"
          inputMode="email"
          label={contactMessages.labels.email}
          autoComplete="email"
          required
          value={values.email}
          error={errors.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => validateOnBlur("email")}
        />

        <TextField
          id={field("phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          label={contactMessages.labels.phone}
          hint={contactMessages.labels.optional}
          autoComplete="tel"
          value={values.phone}
          error={errors.phone}
          onChange={(e) => set("phone", e.target.value)}
          onBlur={() => validateOnBlur("phone")}
        />

        <TextField
          id={field("organisation")}
          name="organisation"
          label={contactMessages.labels.organisation}
          hint={contactMessages.labels.optional}
          autoComplete="organization"
          value={values.organisation}
          error={errors.organisation}
          onChange={(e) => set("organisation", e.target.value)}
          onBlur={() => validateOnBlur("organisation")}
        />
      </div>

      {/* Populated from the real service list, passed in from the server page —
          so an option can never name a service that has no page. */}
      <SelectField
        id={field("serviceSlug")}
        name="serviceSlug"
        label={contactMessages.labels.service}
        hint={contactMessages.labels.optional}
        placeholder={contactMessages.labels.servicePlaceholder}
        options={services.map((s) => ({ value: s.slug, label: s.name }))}
        value={values.serviceSlug}
        error={errors.serviceSlug}
        onChange={(e) => set("serviceSlug", e.target.value)}
        onBlur={() => validateOnBlur("serviceSlug")}
      />

      <TextAreaField
        id={field("message")}
        name="message"
        label={contactMessages.labels.message}
        required
        rows={6}
        value={values.message}
        error={errors.message}
        onChange={(e) => set("message", e.target.value)}
        onBlur={() => validateOnBlur("message")}
      />

      {/*
       * ── The honeypot ───────────────────────────────────────────────────────
       * Hidden with `sr-only` rather than `display:none`: a field that is not
       * rendered at all is skipped by anything that runs CSS, and the point is
       * to catch the scripts that do not. `aria-hidden` keeps it out of the
       * accessibility tree and `tabIndex={-1}` keeps it off the tab order, so no
       * person — sighted or not — can reach it by accident. Together those also
       * satisfy axe's `aria-hidden-focus`, which fails on a *tabbable* element
       * inside an `aria-hidden` subtree.
       *
       * A filled value gets a response from the route handler that is
       * byte-identical to a real success, never an error: an error response is
       * free feedback for whoever is probing.
       */}
      <div aria-hidden className="sr-only">
        <label htmlFor={`${formId}-${HONEYPOT_FIELD}`}>
          {contactMessages.labels.honeypot}
        </label>
        <input
          id={`${formId}-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values[HONEYPOT_FIELD]}
          onChange={(e) => set(HONEYPOT_FIELD, e.target.value)}
        />
      </div>

      <CheckboxField
        id={field("consent")}
        name="consent"
        label={contactMessages.labels.consent(firmName)}
        checked={values.consent}
        error={errors.consent}
        onChange={(e) => set("consent", e.target.checked)}
        onBlur={() => validateOnBlur("consent")}
      />

      {/*
       * One live region for failures that are about the submission rather than
       * about a field. `polite` rather than `assertive`: it appears in response
       * to the visitor's own action, so it does not need to interrupt. Placed
       * before the button so a screen reader reaches it on the way back up from
       * the control that was pressed.
       */}
      <div aria-live="polite">
        {showFormError ? (
          <div className="max-w-[62ch] border-l-2 border-destructive pl-4">
            <p className="text-body-large text-on-surface">
              {contactMessages.errors[errorCode]}
            </p>

            {fallbacks.length > 0 ? (
              <p className="mt-2 text-body-medium text-on-surface-variant">
                {contactMessages.alternativesLead}{" "}
                {fallbacks.map((fallback, index) => (
                  <span key={fallback.href}>
                    {index > 0 ? " · " : ""}
                    <a
                      href={fallback.href}
                      className="text-primary underline underline-offset-4"
                    >
                      {fallback.value}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}

            {/* The bridge between "clear to the visitor" and "diagnosable by
                us" (§3.8c). The same reference is in the server log, with no
                personal data beside it. */}
            {reference ? (
              <p className="tabular mt-2 text-body-small text-on-surface-variant">
                {contactMessages.errorReference(reference)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          aria-busy={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            /* A pending indicator, not decoration: it is the only thing that
             * distinguishes "sending" from "nothing happened" on a slow
             * connection. `motion-safe` so a reduced-motion visitor gets the
             * label change and a static mark instead. */
            <span
              aria-hidden
              className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
            />
          ) : null}
          {submitting
            ? contactMessages.labels.submitting
            : showFormError && retryable
              ? contactMessages.labels.retry
              : contactMessages.labels.submit}
        </Button>

        <p className="max-w-[42ch] text-body-small text-on-surface-variant">
          {contactMessages.form.privacyNote}
        </p>
      </div>
    </form>
  );
}
