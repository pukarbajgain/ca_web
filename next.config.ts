import type { NextConfig } from "next";

/**
 * Next.js configuration — `web`.
 *
 * Deliberately reads `process.env` directly rather than importing `@/lib/env`:
 * this file is evaluated by the Next CLI before the app's module graph exists,
 * and a validation throw here produces a stack trace with no useful context.
 * `src/lib/env.ts` is the validating gate for everything the app itself reads.
 */

const isDev = process.env.NODE_ENV === "development";

/** Backend origin. Used only to build the same-origin `/uploads` proxy below. */
const API_ORIGIN = (process.env.API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

/**
 * Content-Security-Policy, assembled from a directive map so a change is one
 * line and never a mis-edited semicolon-delimited string.
 *
 * Two deliberate concessions, both structural rather than lazy:
 *
 *  - `'unsafe-inline'` in `script-src`. The nonce-based alternative requires a
 *    per-request nonce from `middleware.ts`, which forces every page out of the
 *    static/ISR path (ARCHITECTURE.md §D.1) — the entire rendering strategy of
 *    this site. This app renders no user-supplied HTML and takes no credential,
 *    so the residual XSS surface is small. `admin`, which *does* render authored
 *    HTML, is dynamic anyway and should use nonces.
 *  - `'unsafe-inline'` in `style-src`, which next/font and React style props both
 *    require and for which no nonce-free alternative exists.
 *
 * `frame-ancestors 'none'` duplicates X-Frame-Options on purpose: the header is
 * for legacy agents, the directive is the one modern browsers honour.
 */
const csp = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  "style-src": ["'self'", "'unsafe-inline'"],
  // next/font self-hosts Google fonts at build time, so no external font origin.
  "font-src": ["'self'", "data:"],
  "img-src": ["'self'", "data:", "blob:"],
  // Same-origin only: media is proxied through /uploads, and the browser never
  // talks to the API directly (CLAUDE.md §3.7). `ws:` is the dev HMR socket.
  "connect-src": ["'self'", ...(isDev ? ["ws:", "http://localhost:*"] : [])],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  // We may frame ourselves: `/design` renders `/design/preview` in an iframe at
  // each tested viewport width. See PREVIEW_PATH below for why that is a
  // separate route rather than `/`.
  "frame-src": ["'self'"],
  "manifest-src": ["'self'"],
  ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
} satisfies Record<string, string[]>;

function serialiseCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, values]) =>
      values.length ? `${directive} ${values.join(" ")}` : directive,
    )
    .join("; ");
}

const cspHeader = serialiseCsp(csp);

/**
 * The one route that may be framed, and only by this origin.
 *
 * `/design`'s viewport switcher has to render the real site at 390/768/1280/1920
 * — that is the whole point of it doubling as the responsive review surface
 * (ARCHITECTURE.md §J.1). But `X-Frame-Options: DENY` and `frame-ancestors
 * 'none'` are enforced on the *framed* document, so a page cannot be framed even
 * by itself, and pointing the iframe at `/` was silently blocked
 * (`ERR_BLOCKED_BY_RESPONSE`) with an empty preview box.
 *
 * The wrong fix is to weaken the site-wide header to SAMEORIGIN. Instead a
 * dedicated, `noindex` preview route renders the same components and carries the
 * relaxed pair; **every other route, `/` included, keeps `DENY` /
 * `frame-ancestors 'none'` exactly as specified.** The two header rules below
 * use disjoint sources, because two matching rules would emit two
 * `X-Frame-Options` headers and browsers take the strictest.
 */
const PREVIEW_PATH = "/design/preview";

const previewCspHeader = serialiseCsp({ ...csp, "frame-ancestors": ["'self'"] });

/** Everything except the security headers that differ between the two rules. */
const sharedSecurityHeaders = [
  // 2 years, preload-eligible. Harmless on http://localhost (browsers ignore
  // HSTS on plain HTTP), so it is not dev-gated.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
      "browsing-topics=()",
    ].join(", "),
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Container-friendly output: a self-contained server bundle, no node_modules copy.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // A trailing slash is a second URL for the same content; canonicals hate it.
  trailingSlash: false,

  // A type error must fail the build; there is no `eslint` key in Next 16 —
  // `next lint` was removed, and linting is `pnpm lint` in CI instead.
  typescript: { ignoreBuildErrors: false },

  images: {
    /**
     * WEBP ONLY — this is a hard security requirement, not a performance choice.
     *
     * GHSA-2xp9-vwfh-vxw4 (25 August 2026, critical): unauthenticated RCE in the
     * Next.js Image Optimization API, reached by making the optimizer decode an
     * attacker-controlled **AVIF** image through a vulnerable libheif in `sharp`.
     * Vercel's fix was to DISABLE AVIF optimization pending an upstream libheif
     * fix. Listing "image/avif" here re-opens that vector the moment a future
     * release restores AVIF support.
     *
     * `ecommerce_fe` sets `["image/avif", "image/webp"]`. That half of the
     * reference pattern is deliberately not carried across (CLAUDE.md §4.1).
     * Revisit only when Vercel announces the upstream fix has propagated.
     */
    formats: ["image/webp"],

    /**
     * SVG stays out of the optimizer entirely. `dangerouslyAllowSVG` would let a
     * proxied SVG execute script in the image origin; our placeholders and brand
     * marks are served straight from /public with `unoptimized` set by the media
     * wrapper instead, which costs nothing (they are already ~1 KB).
     */
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",

    // Media is same-origin via the /media rewrite below, so no remote pattern
    // is needed. Adding one would widen the optimizer's reachable URL space.
    remotePatterns: [],
    // Matches the breakpoints the responsive gate tests (390/768/1280/1920).
    deviceSizes: [390, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        // The design-system preview, and nothing else.
        source: PREVIEW_PATH,
        headers: [
          { key: "Content-Security-Policy", value: previewCspHeader },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        // Every other route. The negative lookahead keeps the two sources
        // disjoint so exactly one X-Frame-Options header is ever emitted.
        source: "/:path((?!design/preview$).*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          ...sharedSecurityHeaders,
        ],
      },
    ];
  },

  /**
   * CMS media is served same-origin.
   *
   * The backend publishes every asset URL as the root-relative `/media/<two
   * hex>/<two hex>/<sha256>[-<width>].<ext>` — a content-addressed path derived
   * from the storage key, never a stored URL. Proxying it through this app
   * rather than linking the API host buys three things: the CSP can stay
   * `img-src 'self'` with no third origin allow-listed, `next/image` can treat
   * the file as a local path with no `remotePatterns` widening, and the API
   * origin never appears in HTML — which matters because the browser is not
   * supposed to know it exists (CLAUDE.md §3.7).
   *
   * The rewrite is not optional decoration: without it every banner image,
   * team photograph and downloadable circular resolves against this origin and
   * 404s. It was `/uploads/:path*` until the media pipeline settled on the
   * `media/` key namespace, and the stale prefix meant the proxy pointed at a
   * path the backend has never served.
   */
  async rewrites() {
    return [{ source: "/media/:path*", destination: `${API_ORIGIN}/media/:path*` }];
  },
};

export default nextConfig;
