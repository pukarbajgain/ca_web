import { beforeEach, describe, expect, it, vi } from "vitest";

import { HONEYPOT_FIELD } from "./schema";

import type { ForwardResult } from "./api";

/**
 * `POST /api/contact`, tested through its real handler.
 *
 * Three behaviours here are security- or trust-critical and none of them is
 * visible from the UI, which is exactly why they are tested at this level:
 *
 *  1. a filled honeypot gets a **fake success** and is not forwarded;
 *  2. a failed forward returns **502 and never claims success**;
 *  3. no log line carries a name, an email, a message or an IP address.
 *
 * `forwardEnquiry` is mocked because the assertion is about what the handler
 * *does with* each outcome, and because the real one would try to reach a
 * backend that has no enquiries endpoint yet.
 */

const forwardEnquiry = vi.fn<(...args: never[]) => Promise<ForwardResult>>();
vi.mock("./api", () => ({
  forwardEnquiry: (...args: never[]) => forwardEnquiry(...args),
}));

/* The handler holds its rate-limit window in module scope, so each test needs a
 * fresh module instance or the fifth request in the file would 429. */
async function loadHandler() {
  vi.resetModules();
  const mod = await import("@/app/api/contact/route");
  return mod.POST;
}

function post(body: unknown, ip = "203.0.113.1") {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const valid = {
  name: "Sita Sharma",
  email: "sita@example.com.np",
  message: "We are a private company and our statutory audit is due next month.",
  consent: true,
};

beforeEach(() => {
  forwardEnquiry.mockReset();
  forwardEnquiry.mockResolvedValue({ outcome: "delivered" });
});

describe("POST /api/contact", () => {
  it("forwards a valid enquiry and reports it received", async () => {
    const POST = await loadHandler();
    const response = await POST(post(valid));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "received" });
    expect(forwardEnquiry).toHaveBeenCalledOnce();
  });

  it("never caches an enquiry response", async () => {
    const POST = await loadHandler();
    const response = await POST(post(valid));
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("answers a filled honeypot with a response indistinguishable from success", async () => {
    const POST = await loadHandler();

    const real = await POST(post(valid));
    const trapped = await POST(post({ ...valid, [HONEYPOT_FIELD]: "http://spam" }));

    // Byte-identical from the browser's point of view: same status, same body,
    // same headers. A 400 — or any difference at all — would tell the script
    // exactly which field to leave alone next time.
    expect(trapped.status).toBe(real.status);
    expect(await trapped.text()).toBe(await real.text());
    expect([...trapped.headers].sort()).toEqual([...real.headers].sort());

    // ...and only the real one was forwarded.
    expect(forwardEnquiry).toHaveBeenCalledOnce();
  });

  it("returns 400 for a body that is not JSON", async () => {
    const POST = await loadHandler();
    const response = await POST(
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "invalid_request" });
  });

  it("returns 400 with field names — and no field values — when validation fails", async () => {
    const POST = await loadHandler();
    const response = await POST(post({ ...valid, consent: false }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("validation_failed");
    expect(body.fields).toContain("consent");
    // The payload names fields, never their contents.
    expect(JSON.stringify(body)).not.toContain(valid.email);
    expect(forwardEnquiry).not.toHaveBeenCalled();
  });

  it("rejects a service slug that is not a real service", async () => {
    const POST = await loadHandler();
    const response = await POST(post({ ...valid, serviceSlug: "wealth-management" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ fields: ["serviceSlug"] });
    expect(forwardEnquiry).not.toHaveBeenCalled();
  });

  it("accepts a real service slug", async () => {
    const POST = await loadHandler();
    const response = await POST(post({ ...valid, serviceSlug: "taxation" }));
    expect(response.status).toBe(200);
  });

  it("returns 502 — never a success — when the enquiry could not be delivered", async () => {
    forwardEnquiry.mockResolvedValue({ outcome: "unavailable", status: 404 });
    const POST = await loadHandler();
    const response = await POST(post(valid));

    // The failure this asserts against is a contact form that says "thank you"
    // and drops the enquiry. Nobody ever finds out.
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.code).toBe("upstream_unavailable");
    // §3.8c: a human sentence *plus a reference* the visitor can quote. The
    // sentence is the client's job; the reference has to come from here.
    expect(body.reference).toMatch(/^[0-9a-f]{8}$/);
    // And no status code, exception name or framework text reaches the browser.
    expect(JSON.stringify(body)).not.toMatch(/404|502|Error|fetch/i);
  });

  it("logs the same reference it shows the visitor, and nothing else", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    forwardEnquiry.mockResolvedValue({ outcome: "unavailable", status: 503 });

    const POST = await loadHandler();
    const response = await POST(post(valid));
    const { reference } = await response.json();

    // The bridge between "clear to the visitor" and "diagnosable by us": the
    // reference is the only thing tying the two together, so it must be in both.
    expect(error.mock.calls.flat().join(" ")).toContain(reference);
    error.mockRestore();
  });

  it("returns 502 when the backend rejects a payload our own schema accepted", async () => {
    forwardEnquiry.mockResolvedValue({ outcome: "rejected", status: 422 });
    const POST = await loadHandler();
    const response = await POST(post(valid));
    expect(response.status).toBe(502);
  });

  it("rate limits a single address, and does not limit a different one", async () => {
    const POST = await loadHandler();

    for (let i = 0; i < 5; i++) {
      expect((await POST(post(valid, "198.51.100.7"))).status).toBe(200);
    }

    const blocked = await POST(post(valid, "198.51.100.7"));
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toMatchObject({ code: "rate_limited" });

    // The window is per address, not global — one noisy client must not close
    // the form for everyone else.
    expect((await POST(post(valid, "198.51.100.8"))).status).toBe(200);
  });

  it("puts no personal data in any log line", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    forwardEnquiry.mockResolvedValue({ outcome: "unavailable", status: null });
    const POST = await loadHandler();

    await POST(post({ ...valid, [HONEYPOT_FIELD]: "spam" }, "192.0.2.55"));
    await POST(post({ ...valid, consent: false }, "192.0.2.55"));
    await POST(post(valid, "192.0.2.55"));

    const logged = [...warn.mock.calls, ...error.mock.calls].flat().join(" | ");
    for (const secret of [valid.name, valid.email, valid.message, "192.0.2.55"]) {
      expect(logged).not.toContain(secret);
    }

    warn.mockRestore();
    error.mockRestore();
  });
});
