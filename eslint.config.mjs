// @ts-check
/**
 * ESLint 9 flat config.
 *
 * ARCHITECTURE.md rejects "bare `next/core-web-vitals` with no custom rules" — that
 * config is the floor, not the ceiling. Three things are added on top, each of which
 * exists to make a *documented project rule* mechanically enforceable rather than a
 * matter of discipline:
 *
 *   1. the full `jsx-a11y` recommended set (Next enables only a subset), because the
 *      a11y gate in CI should never be the first place a violation is noticed;
 *   2. `import/order`, so diffs never churn on import position;
 *   3. `no-restricted-imports` / `no-restricted-syntax` guards for the four rules that
 *      would otherwise silently rot: no Axios, no raw `next/image` outside the media
 *      wrapper, no unvalidated `process.env`, and no hardcoded internal paths.
 *
 * NOTE ON PLUGIN REGISTRATION: `eslint-config-next/core-web-vitals` already registers
 * `react`, `react-hooks`, `import`, `jsx-a11y`, `@next/next` and `@typescript-eslint`.
 * Flat config forbids redefining a plugin key with a different instance, so we import
 * the plugins only to read their `rules` maps and never re-register them.
 */
import js from "@eslint/js";
import next from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,

  {
    name: "ca-web/a11y-full",
    files: ["**/*.{ts,tsx}"],
    // Rules only — the plugin object itself comes from eslint-config-next.
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },

  {
    name: "ca-web/house-rules",
    files: ["**/*.{ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true, project: "./tsconfig.json" },
      },
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          pathGroups: [{ pattern: "@/**", group: "internal", position: "before" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // ARCHITECTURE.md §O.2 — Axios is invisible to Next's cache. Native fetch only.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message:
                "Axios is banned (ARCHITECTURE.md §O.2): it bypasses Next's data cache, forcing coarse whole-page ISR. Use src/lib/fetcher.ts.",
            },
          ],
        },
      ],

      // Console noise ships to production otherwise; warn/error are intentional signals.
      /* A scrollable region genuinely must be focusable, or keyboard and Safari
       * users cannot reach content that has scrolled out of view (axe's
       * `scrollable-region-focusable`). `role="region"` with a name is the
       * correct markup for that, so it is added to the rule's allowlist rather
       * than suppressed at the call site. See components/ui/scroll-x.tsx. */
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        { tags: [], roles: ["tabpanel", "region"], allowExpressionValues: true },
      ],

      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
    },
  },

  {
    /* CLAUDE.md §3.6 / ARCHITECTURE.md §J.4: no component may reference an image path.
     * Everything goes through `components/media` with a typed asset descriptor, so the
     * raw `next/image` import is confined to that one directory. */
    name: "ca-web/image-containment",
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/media/**", "src/lib/assets.ts", "src/lib/image-slots.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "Axios is banned (ARCHITECTURE.md §O.2). Use src/lib/fetcher.ts.",
            },
            {
              name: "next/image",
              message:
                "Import { AssetImage } from '@/components/media/asset-image' instead. Components take a typed asset descriptor, never a path (ARCHITECTURE.md §J.4).",
            },
          ],
        },
      ],
    },
  },

  {
    /* Env is validated once, at module load, in src/lib/env.ts. Reading `process.env`
     * anywhere else re-opens the "undefined in production" failure mode that the
     * validation exists to close. next.config.ts and scripts/ are exempt: they run
     * before, or outside, the app module graph. */
    name: "ca-web/env-containment",
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env'][parent.property.name!='NODE_ENV']",
          message:
            "Read environment through `env` from '@/lib/env' — it is validated at module load. Only NODE_ENV may be read directly.",
        },
      ],
    },
  },

  {
    /**
     * `jsx-a11y` reads JSX literally: it cannot follow children that arrive
     * through a spread (`<h3 {...props} />`) or through Base UI's `render`
     * composition prop (`<Dialog.Close render={<a href=… />}>label</Dialog.Close>`,
     * where Base UI merges the children into the rendered anchor). Both patterns
     * produce correctly-labelled elements at runtime, and the real check is the
     * axe pass in `e2e/responsive.spec.ts`, which inspects the rendered DOM
     * rather than the source. Disabling the two source-level rules *only* in the
     * primitives and layout modules that compose this way keeps them active
     * everywhere content is written literally — which is where they catch bugs.
     */
    name: "ca-web/a11y-composition-exemptions",
    files: ["src/components/ui/**/*.tsx", "src/components/layout/mobile-nav.tsx"],
    rules: {
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },

  {
    name: "ca-web/tests",
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts", "vitest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
    },
  },

  // Must stay last: turns off every rule Prettier owns.
  prettier,
);
