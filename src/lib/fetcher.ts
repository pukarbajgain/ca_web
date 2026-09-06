import "server-only";

import { env } from "@/lib/env";

/**
 * `fetcher.ts` — the only way this app talks to the backend.
 *
 * **Server-only, by import.** `import "server-only"` makes it a *build* error to
 * pull this into a client component, which is the mechanical half of CLAUDE.md
 * §3.7: the browser never learns the API origin because it can never import the
 * module that knows it.
 *
 * **Native `fetch`, never Axios** (ARCHITECTURE.md §O.2). Axios is invisible to
 * Next's data cache, and the consequence is documented in the reference project
 * itself: pages prerender once at build time and freeze, forcing coarse
 * page-level ISR plus a defensive layout-level revalidate floor. Native `fetch`
 * with `next: { revalidate, tags }` gives per-resource invalidation instead, so
 * publishing one article re-renders exactly what changed.
 */

const API_PREFIX = "/api/v1";

/** The ISR floor from ARCHITECTURE.md §D.1. Tags do the precise work; this is
 *  the backstop for when a webhook is missed. */
export const DEFAULT_REVALIDATE_SECONDS = 300;

export type FetchOptions = {
  /** Seconds. `false` opts out of caching entirely (preview routes only). */
  revalidate?: number | false;
  /** Cache tags. See `revalidation-tags.ts` for the entity→tag mapping. */
  tags?: readonly string[];
  searchParams?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

/** RFC 9457 `application/problem+json` — the API's only error shape (§3 of the
 *  API contract). Clients branch on `code`, never on `title`/`detail`. */
export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  errors?: { field: string; message: string }[];
  request_id?: string;
};

/** Carries the parsed problem document so callers can branch on `problem.code`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ProblemDetail | null;
  readonly path: string;
  /**
   * The backend's `X-Request-ID`, which it also logs with structlog.
   *
   * CLAUDE.md §3.8c: an unexpected failure must show the visitor a human
   * sentence **plus a reference they can quote**, so that "it broke for me this
   * morning" becomes one grep. The header is read as well as `problem.request_id`
   * because a failure that happened before the app handler — a proxy, a crash —
   * has no problem document at all, and that is precisely the failure we most
   * need to be able to find.
   */
  readonly requestId: string | null;

  constructor(
    path: string,
    status: number,
    problem: ProblemDetail | null,
    requestId: string | null = null,
  ) {
    super(problem?.title ?? `Request to ${path} failed with ${status}`);
    this.name = "ApiError";
    this.path = path;
    this.status = status;
    this.code = problem?.code ?? "internal_error";
    this.problem = problem;
    this.requestId = requestId ?? problem?.request_id ?? null;
  }

  /** True for a genuine 404, which the caller turns into `notFound()`. A 404 is
   *  categorically different from an outage and must never share a branch. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/** Every list endpoint, no exceptions (API contract §4). */
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

function buildUrl(path: string, searchParams: FetchOptions["searchParams"]): string {
  const url = new URL(`${env.API_URL}${API_PREFIX}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function parseProblem(response: Response): Promise<ProblemDetail | null> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "code" in body) return body as ProblemDetail;
  } catch {
    // A non-JSON error body means the failure happened before the app handler
    // (a proxy, a crash). There is nothing to branch on; fall through to null.
  }
  return null;
}

/**
 * GET a public JSON resource.
 *
 * Throws `ApiError` on a non-2xx and a plain `Error` on a transport failure.
 * **Throwing is correct here**: the *service* layer decides policy — a 404
 * becomes `notFound()`, an outage becomes an error boundary, and optional site
 * chrome degrades to nothing (§D.4). Swallowing the failure at this level would
 * make all three indistinguishable.
 */
export async function apiGet<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = DEFAULT_REVALIDATE_SECONDS, tags, searchParams, signal } = options;

  const response = await fetch(buildUrl(path, searchParams), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    // `revalidate: false` maps to no-store; anything else is ISR with tags.
    ...(revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate, tags: tags ? [...tags] : undefined } }),
  });

  if (!response.ok) {
    throw new ApiError(
      path,
      response.status,
      await parseProblem(response),
      response.headers.get("x-request-id"),
    );
  }

  // 204 is legal on some endpoints; `.json()` would throw on an empty body.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * The outcome of reading a resource the page can render without.
 *
 * **Three outcomes, not two.** This used to be `T | null`, and collapsing it was
 * a real bug waiting to happen: "the backend says there are no offices" and "we
 * could not reach the backend" are different facts, and CLAUDE.md §3.8c is
 * explicit that only the first may render as normal. A `null` that means both
 * lets a transient outage present the firm as having published nothing —
 * a confident empty state built on a failed fetch.
 */
export type OptionalRead<T> =
  | { readonly status: "ok"; readonly data: T }
  /** The backend answered, and there is genuinely nothing there. */
  | { readonly status: "absent" }
  /** The read failed. Render nothing, substitute nothing, keep the reference. */
  | { readonly status: "unavailable"; readonly reference: string | null };

/**
 * `apiGet` with the failure policy for **optional** content already applied.
 *
 * This is not a mock/seed fallback (which ARCHITECTURE.md §O.18 bans, because a
 * fallback hides real failures). Nothing is ever fabricated; the caller is
 * simply told which kind of absence it is, and decides. A 404 is the backend
 * saying "nothing here" and is reported as `absent`; every other failure is
 * `unavailable` and carries the request id for §3.8c traceability.
 */
export async function apiGetOptional<T>(
  path: string,
  options: FetchOptions = {},
): Promise<OptionalRead<T>> {
  try {
    const data = await apiGet<T>(path, options);
    // A 204 comes back as `undefined`; that is an answer, and it is "nothing".
    return data === undefined || data === null
      ? { status: "absent" }
      : { status: "ok", data };
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return { status: "absent" };

    const reference = error instanceof ApiError ? error.requestId : null;
    console.warn(
      `[fetcher] optional GET ${path} unavailable${reference ? ` (ref ${reference})` : ""}:`,
      error instanceof ApiError ? `${error.status} ${error.code}` : error,
    );
    return { status: "unavailable", reference };
  }
}
