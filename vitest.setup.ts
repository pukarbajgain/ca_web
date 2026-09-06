import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * `src/lib/env.ts` validates at **module load**, and anything importing a module
 * that transitively imports it would therefore throw before a single assertion
 * runs. Stubbing here, at top level, happens before any test file's imports are
 * evaluated — which is the only place it works.
 *
 * Real-looking values rather than `SKIP_ENV_VALIDATION`: the tests should
 * exercise the same parsing path production does, so a schema change that
 * breaks a URL format fails a test instead of a deploy.
 */
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test");
vi.stubEnv("API_URL", "http://localhost:8000");
vi.stubEnv("REVALIDATE_SECRET", "a".repeat(48));
vi.stubEnv("NODE_ENV", "test");

/** jsdom implements neither; several primitives read them on mount. */
vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => {
  cleanup();
});
