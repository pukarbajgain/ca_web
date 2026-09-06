import { describe, expect, it } from "vitest";

import { toEnquiryWire } from "./wire";

import type { ContactFormValues } from "./schema";

const VALUES: ContactFormValues = {
  name: "Sabina Karki",
  email: "sabina.karki@example.com",
  phone: "+977 9800000000",
  organisation: "Himalaya Trading",
  serviceSlug: "audit-and-assurance",
  message: "We need a statutory audit for FY 2081/82.",
  consent: true,
};

/**
 * The contract this file protects is `extra="forbid"` on the backend's
 * `EnquiryCreate`. An extra key is not ignored there — it is a 422, and the
 * visitor is told their enquiry could not be sent while every other part of the
 * system is working. That is precisely what happened: `service_slug` and
 * `source` were sent, neither exists on that schema, and every enquiry from the
 * website was rejected.
 *
 * So the assertion is on the **exact key set**, not on individual fields. A
 * field added here without a matching column on the API breaks this test rather
 * than the contact form.
 */
describe("toEnquiryWire", () => {
  it("sends exactly the keys the API declares, and no others", () => {
    expect(Object.keys(toEnquiryWire(VALUES, "/contact")).sort()).toEqual([
      "consent",
      "email",
      "message",
      "name",
      "organisation",
      "phone",
      "source_path",
    ]);
  });

  it("never sends the service slug, which the API has no field for", () => {
    const wire = toEnquiryWire(VALUES, "/contact") as Record<string, unknown>;

    // `service_interest_id` is an integer foreign key and `web` cannot produce
    // one; sending the slug in its place was the 422.
    expect(wire.service_slug).toBeUndefined();
    expect(wire.service_interest_id).toBeUndefined();
    expect(wire.source).toBeUndefined();
  });

  it("carries the page the enquiry came from", () => {
    expect(toEnquiryWire(VALUES, "/services/taxation").source_path).toBe(
      "/services/taxation",
    );
  });

  it("sends null rather than an empty string for the optional fields", () => {
    // The columns are nullable; "" would be a value the practice then has to
    // interpret, and `Field(default=None)` is what the schema actually declares.
    const wire = toEnquiryWire(
      { ...VALUES, phone: undefined, organisation: undefined },
      null,
    );

    expect(wire.phone).toBeNull();
    expect(wire.organisation).toBeNull();
    expect(wire.source_path).toBeNull();
  });

  it("always asserts consent, because the backend 422s on false", () => {
    expect(toEnquiryWire(VALUES, null).consent).toBe(true);
  });
});
