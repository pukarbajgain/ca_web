import { NextResponse } from "next/server";

import { forwardEnquiry } from "@/features/contact/api";
import { contactSchema, HONEYPOT_FIELD } from "@/features/contact/schema";
import { listServiceSlugs } from "@/features/services/service";
import { env } from "@/lib/env";

/**
 * `POST /api/contact` — the enquiry form's own route handler.
 *
 * ── Why this exists at all ──────────────────────────────────────────────────
 * ARCHITECTURE.md §C.2 boundary 1: **the browser never talks to the backend.**
 * The only browser→server traffic from `web` is to its own route handlers,
 * first-party and same-origin. That buys three things here: the API origin never
 * reaches a client bundle, the CSP stays `connect-src 'self'`, and the backend
 * needs no CORS entry for the public origin.
 *
 * ── The four outcomes, kept distinct ────────────────────────────────────────
 *   200  the enquiry reached the practice (or was a bot — see the honeypot)
 *   400  the payload is not an enquiry, or fails the shared schema
 *   429  too many enquiries from one address in a short window
 *   502  we could not deliver it, and we say so rather than pretending
 *
 * The 502 is the important one. A contact form that returns "thank you" when
 * the send failed is the worst bug this page can have, because nobody ever finds
 * out: the visitor believes they are waiting for a reply and the practice never
 * knows they wrote. So the client is told exactly what happened and the form
 * keeps everything the visitor typed.
 *
 * ── No PII in logs, and a reference that still makes a failure findable ─────
 * Every log line below carries a status, a machine code and — for an unexpected
 * failure — a random reference, and nothing else. Name, email, phone, message
 * and the client address are forwarded or used as a map key and then forgotten;
 * none of them is ever printed, because stdout on a container platform ends up
 * in a log aggregator that has not been assessed for personal data, and a
 * retention policy nobody wrote is not a retention policy.
 *
 * The reference is the bridge CLAUDE.md §3.8c asks for: the visitor is shown a
 * human sentence plus that string, and quoting it locates the exact request in
 * the logs without any personal data having been stored to make the match.
 */

/** Node, not edge: `AbortSignal.timeout` and the module-scope rate-limit map
 *  both need a long-lived runtime. */
export const runtime = "nodejs";
/** A mutation is never prerendered, cached or revalidated. */
export const dynamic = "force-dynamic";

/* ── Rate limiting ─────────────────────────────────────────────────────────
 * A fixed-window counter per client address, held in module scope.
 *
 * **What this is and is not.** It is per-instance: with N server processes an
 * attacker gets N windows, and a restart clears it. That is a real limitation
 * and it is written down rather than glossed over — the durable version belongs
 * on the backend (`core/ratelimit.py`, ARCHITECTURE.md §F.1), where the enquiry
 * endpoint can rate-limit by address and by email across every instance. What
 * this *does* achieve, cheaply and with no dependency, is stopping one browser
 * or one script from turning the practice's inbox into a firehose, which is the
 * failure this form is actually exposed to today.
 *
 * The map is pruned on write so it cannot grow without bound — the failure mode
 * of the reference implementation, which only ever filters the bucket it is
 * currently reading and keeps every address it has ever seen. */
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_MAX_KEYS = 10_000;

const attempts = new Map<string, number[]>();

function isRateLimited(key: string, now: number): boolean {
  const recent = (attempts.get(key) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT_MAX) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);

  if (attempts.size > RATE_LIMIT_MAX_KEYS) {
    for (const [existing, times] of attempts) {
      if (times.every((at) => now - at >= RATE_LIMIT_WINDOW_MS))
        attempts.delete(existing);
    }
  }

  return false;
}

/**
 * The client address, as far as it can be trusted.
 *
 * `x-forwarded-for` is client-supplied unless a proxy overwrites it, so this is
 * a *nuisance* control, not a security boundary — which is exactly what a
 * contact form needs. The first entry is the original client when the header is
 * appended to correctly by every hop.
 *
 * Everything with no usable header shares the `"unknown"` bucket. That is
 * deliberate: an unidentifiable flood is still a flood, and the alternative
 * (letting unknown clients through unlimited) inverts the control. The address
 * is used as a map key and **never logged** — an IP is personal data.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * A short, unguessable reference for one failed request.
 *
 * Eight hex characters, not a UUID: a visitor may have to read it down a phone
 * line, and 32 bits is ample to disambiguate the handful of failures a contact
 * form produces in a day. It is random rather than derived from anything about
 * the enquiry, so it carries no personal data of its own.
 */
function newReference(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * The page the enquiry was sent from, taken from `Referer`.
 *
 * Derived here rather than accepted from the request body: a field the browser
 * asserts is a field an attacker can set to anything, and this one is stored and
 * later read by staff. The header is still client-supplied, so it is treated as
 * a hint and not as evidence — **it is only used when it points at this site**,
 * and only its pathname is kept. Anything else becomes `null`, because "we do
 * not know" is a truthful value and a fabricated path is not.
 *
 * `Referrer-Policy: strict-origin-when-cross-origin` (next.config.ts) sends the
 * full URL on a same-origin request, which is exactly this case.
 */
function sourcePathFrom(request: Request): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;

  try {
    const url = new URL(referer);
    if (url.origin !== new URL(env.NEXT_PUBLIC_SITE_URL).origin) return null;
    // The column is capped at 2000; keep well inside it and drop the query,
    // which can carry anything a visitor was sent a link with.
    return url.pathname.slice(0, 512);
  } catch {
    return null;
  }
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    // Belt and braces alongside `dynamic = "force-dynamic"`: no intermediary
    // may ever serve one visitor's enquiry response to another.
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const now = Date.now();

  if (isRateLimited(clientKey(request), now)) {
    // No address in the log line. The count is the signal; the identity is not.
    console.warn("[contact] rejected: rate_limited");
    return json(429, { code: "rate_limited" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { code: "invalid_request" });
  }

  if (typeof body !== "object" || body === null) {
    return json(400, { code: "invalid_request" });
  }

  /* ── The honeypot ────────────────────────────────────────────────────────
   * Checked **before** validation and answered with a **fake success**.
   *
   * A 400 here would be free feedback: the script learns which field it must
   * leave alone and comes back correct. So the response is **byte-identical to a
   * real success** — same status, same body, same headers — and the enquiry is
   * simply not forwarded. Nothing in what the browser receives distinguishes the
   * two, which is the whole mechanism.
   *
   * No person can reach this field — it is `aria-hidden`, off the tab order and
   * visually clipped — so a value in it is never a human mistake, and the log
   * line records only that one was discarded. */
  const honeypot = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.length > 0) {
    console.warn("[contact] discarded: honeypot");
    return json(200, { status: "received" });
  }

  /* The same schema the browser used. Re-validating server-side is the point:
   * the client check is a convenience, this one is the control. */
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[contact] rejected: validation_failed");
    return json(400, {
      code: "validation_failed",
      // Field *names* only — never the values that failed.
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))],
    });
  }

  /* Membership of the real service list, which the shared schema deliberately
   * cannot check (it is imported by the browser and must not pull the content
   * module into the bundle). The form only ever offers real options, so a
   * mismatch means the request did not come from the form. */
  if (parsed.data.serviceSlug) {
    const slugs = await listServiceSlugs();
    if (!slugs.includes(parsed.data.serviceSlug)) {
      console.warn("[contact] rejected: unknown_service_slug");
      return json(400, { code: "validation_failed", fields: ["serviceSlug"] });
    }
  }

  const result = await forwardEnquiry(parsed.data, sourcePathFrom(request));

  if (result.outcome === "delivered") {
    return json(200, { status: "received" });
  }

  /* Both remaining outcomes mean the same thing to the visitor — the enquiry
   * did **not** reach the practice — so both get the same code and the same
   * honest sentence. They are logged differently because they need different
   * things from us: a rejected payload is a contract drift and needs a code
   * change, an unreachable backend needs a look at the service. */
  const reference = newReference();

  if (result.outcome === "rejected") {
    console.error(
      `[contact] ${reference} backend rejected the payload: ${result.status}`,
    );
  } else {
    console.error(
      `[contact] ${reference} not delivered: upstream ${result.status ?? "unreachable"}`,
    );
  }

  // The visitor never sees the status code — only a sentence and this reference.
  return json(502, { code: "upstream_unavailable", reference });
}
