import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — the responsive and accessibility gates (ARCHITECTURE.md §K).
 *
 * **Four projects at 390 / 768 / 1280 / 1920.** These are not arbitrary: they
 * are the four widths CLAUDE.md §5.3 names, the same four the `/design`
 * viewport switcher offers, and the same four `next.config.ts` lists first in
 * `images.deviceSizes`. Keeping one set of numbers across the gate, the review
 * surface and the image pipeline is what stops "responsive" from meaning three
 * different things in three places.
 *
 * The phone project uses a real device descriptor rather than a bare viewport,
 * so it also gets a coarse pointer and a mobile user agent — which is what
 * makes the `pointer-coarse:min-h-11` touch floors actually apply.
 */
const PORT = 3000;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "390-phone",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "768-tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "1280-laptop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "1920-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],

  /**
   * Reuses an already-running dev server locally (the common case while
   * iterating) and starts a production build in CI, because a dev-mode bundle
   * behaves differently enough — overlay, unminified CSS, no ISR — that a green
   * dev run is not evidence about production.
   */
  webServer: {
    // CI runs the *standalone* bundle — the artefact that actually deploys.
    // `next start` ignores `output: "standalone"`, so testing it would exercise a
    // server we never ship, and would not catch a missing static/ or public/ copy.
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
