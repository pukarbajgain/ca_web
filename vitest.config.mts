import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration.
 *
 * Two deliberate departures from the reference projects, both called out in
 * ARCHITECTURE.md's "patterns intentionally NOT borrowed":
 *
 *  - **No `fileParallelism: false` / `maxWorkers: 1`.** Both references
 *    serialise CI to hide flake. Serialising trades every future test run for a
 *    bug you have not diagnosed; if a test is flaky, fix the test.
 *  - **`environment: "jsdom"` as the default**, rather than `node` with per-file
 *    opt-in. Most of what has behaviour worth testing here is a component, and
 *    a pure-logic test costs nothing extra under jsdom.
 *
 * The `.mts` extension is deliberate: this file uses ESM syntax, and Vite's
 * upcoming native config loader treats a bare `.ts` in a CommonJS package as
 * CommonJS. `.mts` is unambiguous and silences the deprecation warning without
 * flipping the whole package to `"type": "module"`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vitest 4 resolves tsconfig `paths` natively — no plugin needed for `@/*`.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // `e2e/` is Playwright's; running it under Vitest would import a
    // conflicting `test` global and fail confusingly.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    css: false,
  },
});
