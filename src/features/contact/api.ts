import "server-only";

import { env } from "@/lib/env";

import type { ContactFormValues } from "./schema";

/**
 * Forwarding an enquiry to the backend.
 *
 * `lib/fetcher.ts` is read-only by design (`apiGet` / `apiGetOptional`), because
 * every other call this site makes is a cached public read. This is the one
 * write, it must never be cached, and its failure policy is completely different
 * — so it lives here rather than widening the shared fetcher with a POST that
 * nothing else would use.
 *
 * ── The endpoint does not exist yet ─────────────────────────────────────────
 * `API_CONTRACT.md` §6 lists `GET /public/settings` as the only shipped public
 * route; `POST /public/enquiries` is not there. That is a fact about today, not
 * a reason to fake it: this function attempts the real call and reports exactly
 * what happened, and the route handler turns "the endpoint is not there" into a
 * 502 that tells the visitor their message was **not** sent. CLAUDE.md §5.2
 * forbids building UI for endpoints that do not exist; it does not forbid
 * failing honestly against one, and the alternative — a form that says "thank
 * you" and drops the enquiry — is the worst outcome available.
 *
 * ── No PII leaves this module in a log line ─────────────────────────────────
 * Nothing here logs. The caller logs a status and a code. The name, email, phone
 * and message are forwarded and then forgotten; they never reach stdout, where
 * they would end up in a log aggregator that nobody has assessed for personal
 * data.
 */

/** How the enquiry is named on the wire. snake_case, mirroring the API
 *  convention (CLAUDE.md §5.1) so a field is greppable across repositories. */
type EnquiryWire = {
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  service_slug: string | null;
  message: string;
  consent: true;
  source: string;
};

export type ForwardResult =
  | { outcome: "delivered" }
  /** The backend refused the payload. Should be unreachable — we validated with
   *  the same schema — so it is a contract drift signal, not a user error. */
  | { outcome: "rejected"; status: number }
  /** Unreachable, timed out, 5xx, or the route is not deployed. */
  | { outcome: "unavailable"; status: number | null };

/** Eight seconds. Long enough for a cold backend, short enough that a visitor
 *  is not left watching a spinner while a proxy decides to give up. */
const TIMEOUT_MS = 8_000;

export async function forwardEnquiry(values: ContactFormValues): Promise<ForwardResult> {
  // `env.API_URL` is a required, validated variable — but a build run with
  // SKIP_ENV_VALIDATION can still reach here with nothing set, and "post an
  // enquiry to undefined/api/v1/..." must not be an unhandled throw.
  if (!env.API_URL) return { outcome: "unavailable", status: null };

  const body: EnquiryWire = {
    name: values.name,
    email: values.email,
    phone: values.phone ?? null,
    organisation: values.organisation ?? null,
    service_slug: values.serviceSlug ?? null,
    message: values.message,
    consent: true,
    // Lets the practice tell a website enquiry from one raised in the admin
    // console without inspecting where it came from.
    source: "website_contact_form",
  };

  let response: Response;
  try {
    response = await fetch(`${env.API_URL}/api/v1/public/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      // A write is never cached, and Next would otherwise be entitled to
      // deduplicate two identical enquiries within one request.
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { outcome: "unavailable", status: null };
  }

  if (response.ok) return { outcome: "delivered" };

  /* 404 and 501 mean the route is not deployed — indistinguishable, from here,
   * from the backend being down, and both mean the enquiry did not land. 422
   * and 400 mean the contract has drifted, which is worth surfacing separately
   * because the fix is a code change rather than a retry. */
  if (response.status === 400 || response.status === 422) {
    return { outcome: "rejected", status: response.status };
  }
  return { outcome: "unavailable", status: response.status };
}
