import "server-only";

import { env } from "@/lib/env";

import { toEnquiryWire } from "./wire";

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
 * ── The wire names, and the drift that broke this once ──────────────────────
 * `POST /public/enquiries` ships, and `EnquiryCreate` sets `extra="forbid"`.
 * This module was written against an assumed contract before the endpoint
 * existed and sent two fields it does not have — `service_slug` and `source` —
 * so **every enquiry was rejected with 422** and the visitor was told, honestly
 * but uselessly, that it could not be sent. The failure path worked exactly as
 * designed; the payload was wrong.
 *
 * The names below are checked against `app/schemas/public/enquiry.py`. The one
 * that is easy to get wrong is `source_path`: it is *the page the form was
 * submitted from*, not a channel label, and the route handler derives it from
 * the request rather than letting the browser assert it.
 *
 * ── No PII leaves this module in a log line ─────────────────────────────────
 * Nothing here logs. The caller logs a status and a code. The name, email, phone
 * and message are forwarded and then forgotten; they never reach stdout, where
 * they would end up in a log aggregator that nobody has assessed for personal
 * data.
 */

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

export async function forwardEnquiry(
  values: ContactFormValues,
  sourcePath: string | null,
): Promise<ForwardResult> {
  // `env.API_URL` is a required, validated variable — but a build run with
  // SKIP_ENV_VALIDATION can still reach here with nothing set, and "post an
  // enquiry to undefined/api/v1/..." must not be an unhandled throw.
  if (!env.API_URL) return { outcome: "unavailable", status: null };

  const body = toEnquiryWire(values, sourcePath);

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
