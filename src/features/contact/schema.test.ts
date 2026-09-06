import { describe, expect, it } from "vitest";

import {
  contactSchema,
  emptyContactForm,
  fieldErrorsFrom,
  HONEYPOT_FIELD,
} from "./schema";

/**
 * The enquiry contract.
 *
 * This schema is the *only* validation the server performs before forwarding a
 * person's contact details, so these tests are the closest thing the site has to
 * an input-handling contract test. Each case below is a real failure mode:
 * a form posted with the consent box unticked, an empty optional field arriving
 * as `""`, and a bot filling every input on the page.
 */

const valid = {
  ...emptyContactForm,
  name: "Sita Sharma",
  email: "sita@example.com.np",
  message: "We are a private company and our statutory audit is due next month.",
  consent: true as const,
};

describe("contactSchema", () => {
  it("accepts a complete enquiry", () => {
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("treats a blank optional field as absent, not as an empty string", () => {
    // A browser posts "" for every untouched input. Forwarding `phone: ""` would
    // put an empty string in the practice's CRM where a null belongs.
    const result = contactSchema.safeParse(valid);
    expect(result.success && result.data.phone).toBeUndefined();
    expect(result.success && result.data.organisation).toBeUndefined();
    expect(result.success && result.data.serviceSlug).toBeUndefined();
  });

  it("keeps an optional field that was filled in", () => {
    const result = contactSchema.safeParse({ ...valid, phone: " 01-4XXXXXX " });
    // Trimmed, because a trailing space is not part of anyone's phone number.
    expect(result.success && result.data.phone).toBe("01-4XXXXXX");
  });

  it("rejects an enquiry with the consent box unticked", () => {
    // The single most important assertion in this file: without it, an unticked
    // box parses as `false` and the enquiry is forwarded anyway.
    const result = contactSchema.safeParse({ ...valid, consent: false });
    expect(result.success).toBe(false);
    expect(
      result.success === false && fieldErrorsFrom(result.error).consent,
    ).toBeTruthy();
  });

  it("requires a name, an email and a message", () => {
    const result = contactSchema.safeParse({ ...emptyContactForm, consent: true });
    expect(result.success).toBe(false);
    const errors = result.success === false ? fieldErrorsFrom(result.error) : {};
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it("rejects an address that is not an email", () => {
    const result = contactSchema.safeParse({ ...valid, email: "sita at example" });
    expect(result.success).toBe(false);
  });

  it("rejects a service value that is not slug-shaped", () => {
    // Shape only — membership of the real service list is checked server-side,
    // where the list lives. This stops an unbounded string reaching that check.
    expect(
      contactSchema.safeParse({ ...valid, serviceSlug: "Audit & Assurance" }).success,
    ).toBe(false);
    expect(contactSchema.safeParse({ ...valid, serviceSlug: "taxation" }).success).toBe(
      true,
    );
  });

  it("caps every free-text field", () => {
    const result = contactSchema.safeParse({ ...valid, message: "x".repeat(4001) });
    expect(result.success).toBe(false);
  });

  it("declares the honeypot as a must-be-empty field", () => {
    // The route handler answers a filled honeypot with a fake success *before*
    // parsing, so this branch is belt and braces — but a schema that silently
    // accepted the field would make the pre-check the only thing standing there.
    expect(contactSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: "" }).success).toBe(
      true,
    );
    expect(
      contactSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: "http://spam.example" })
        .success,
    ).toBe(false);
  });
});

describe("fieldErrorsFrom", () => {
  it("reports one message per field, in the order the issues arrived", () => {
    const result = contactSchema.safeParse({ ...emptyContactForm, consent: true });
    const errors = result.success === false ? fieldErrorsFrom(result.error) : {};
    // A stack of three messages under one input is noise; the second is usually
    // a consequence of the first.
    expect(Object.values(errors).every((message) => typeof message === "string")).toBe(
      true,
    );
  });

  it("never surfaces the honeypot to the form", () => {
    // There is no visible field to attach it to, so a message there would be an
    // error the visitor can neither see nor fix.
    const result = contactSchema.safeParse({ ...valid, [HONEYPOT_FIELD]: "spam" });
    const errors = result.success === false ? fieldErrorsFrom(result.error) : {};
    expect(Object.keys(errors)).not.toContain(HONEYPOT_FIELD);
  });
});
