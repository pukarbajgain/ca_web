import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment contract, validated once at module load.
 *
 * Why validate at all: the failure mode this closes is specific and expensive —
 * a missing `NEXT_PUBLIC_SITE_URL` in production does not crash, it silently
 * emits relative canonical URLs and a sitemap full of `undefined/...`, and
 * nobody notices until rankings move. Failing at boot is strictly better.
 *
 * `server` values are unreachable from client bundles: @t3-oss throws at build
 * time if one is referenced from a `"use client"` module. That is the mechanism
 * behind CLAUDE.md §3.7 — `web` never ships an API URL or a secret to a browser.
 */
export const env = createEnv({
  server: {
    /** FastAPI origin. No trailing slash; `/api/v1` is appended by the fetcher. */
    API_URL: z
      .url({ error: "API_URL must be an absolute URL, e.g. http://localhost:8000" })
      .refine((v) => !v.endsWith("/"), { error: "API_URL must not end with '/'" }),

    /**
     * Shared secret for POST /api/revalidate. 32 chars is not arbitrary: it is
     * the floor at which a brute-force against a public endpoint stops being
     * worth attempting. The route also compares in constant time.
     */
    REVALIDATE_SECRET: z
      .string()
      .min(32, { error: "REVALIDATE_SECRET must be at least 32 characters" }),

    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },

  client: {
    /** Public origin of this site. Drives metadataBase, canonicals, sitemap, JSON-LD. */
    NEXT_PUBLIC_SITE_URL: z
      .url({ error: "NEXT_PUBLIC_SITE_URL must be an absolute URL" })
      .refine((v) => !v.endsWith("/"), {
        error:
          "NEXT_PUBLIC_SITE_URL must not end with '/' (it is concatenated with paths)",
      }),
  },

  /**
   * Next inlines `NEXT_PUBLIC_*` at build time, so client vars must be listed
   * literally — a computed `process.env[key]` would be replaced with undefined.
   */
  runtimeEnv: {
    API_URL: process.env.API_URL,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  /**
   * `pnpm lint`/`typecheck` and Docker image builds run without a real `.env`.
   * Skipping there keeps CI honest about *code* failures; the runtime still
   * validates on first import in the server process.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
