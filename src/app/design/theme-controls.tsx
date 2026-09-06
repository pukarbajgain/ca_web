"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ScrollX } from "@/components/ui/scroll-x";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * `attribute="data-theme"` is not a preference — it is what `globals.css`
 * actually keys on (`:root[data-theme="dark"]`, and a light choice guarded
 * against a dark OS preference via `:root:not([data-theme="light"])`). Using
 * next-themes' default `class` attribute would toggle a class nothing reads.
 *
 * `defaultTheme="system"` matches the design system's own default: stamping no
 * attribute is the third state, where `prefers-color-scheme` decides.
 */
export function DesignThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}

/**
 * True once React has hydrated, false during SSR and on the first client render.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the effect form
 * calls `setState` synchronously in an effect body, which the React Compiler
 * lint rule rejects (it causes a cascading render) — and `useSyncExternalStore`
 * expresses the intent directly by giving React a different value for the
 * server snapshot than for the client one. The store never changes, so the
 * subscribe function is a no-op.
 */
const neverChanges = () => () => {};
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  /**
   * next-themes cannot know the active theme on the server — the choice lives in
   * localStorage and in the OS preference, neither of which the server can see.
   * Deriving `aria-pressed` from `theme` during SSR therefore renders
   * `aria-pressed="false"` on the server and `true` on the client, which React
   * reports as a hydration mismatch and does not patch up.
   *
   * The fix is to render the *server's* view on the first client render too, and
   * only then reconcile — `useIsHydrated` below. (The matching half of this is
   * `suppressHydrationWarning` on `<html>` in the root layout, for the
   * attributes next-themes writes there.)
   */
  const hydrated = useIsHydrated();

  return (
    <div
      role="group"
      aria-label="Colour scheme"
      className="inline-flex rounded-lg border border-outline-variant p-1"
    >
      {THEMES.map((option) => {
        const Icon = option.icon;
        const active = hydrated && theme === option.value;
        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
            className={cn(active && "bg-secondary-container text-on-secondary-container")}
          >
            <Icon aria-hidden />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * The viewport switcher.
 *
 * Renders the *live site* in an iframe at each width the Playwright responsive
 * gate asserts (390 / 768 / 1280 / 1920), so a designer, a stakeholder and CI
 * are all looking at the same four numbers. Reviewing responsiveness by dragging
 * a window is how breakpoints get "verified" and stay broken; this makes the
 * check reproducible and linkable.
 *
 * Wider-than-viewport frames scale down rather than forcing horizontal page
 * scroll — which would ironically break the very property being reviewed.
 */
const VIEWPORTS = [
  { width: 390, label: "390 · phone" },
  { width: 768, label: "768 · tablet" },
  { width: 1280, label: "1280 · laptop" },
  { width: 1920, label: "1920 · desktop" },
] as const;

export function ViewportSwitcher({ src = routes.designPreview() }: { src?: string }) {
  const [width, setWidth] = useState<number>(390);
  const [scale, setScale] = useState<number>(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Preview width"
          className="inline-flex flex-wrap rounded-lg border border-outline-variant p-1"
        >
          {VIEWPORTS.map((viewport) => (
            <Button
              key={viewport.width}
              variant="ghost"
              size="sm"
              aria-pressed={width === viewport.width}
              onClick={() => setWidth(viewport.width)}
              className={cn(
                width === viewport.width &&
                  "bg-secondary-container text-on-secondary-container",
              )}
            >
              {viewport.label}
            </Button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-body-small text-on-surface-variant">
          Scale
          <input
            type="range"
            min={0.25}
            max={1}
            step={0.05}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="accent-[var(--md-primary)]"
          />
          <span className="tabular w-10">{Math.round(scale * 100)}%</span>
        </label>
      </div>

      {/* The outer box scrolls, never the page. `ScrollX` (not a bare
          `.scroll-x` div) because a scroll container whose contents cannot take
          focus is unreachable by keyboard — axe's `scrollable-region-focusable`. */}
      <ScrollX
        label="Site preview"
        className="rounded-xl border border-outline-variant bg-surface-container p-4"
      >
        <div
          style={{
            width: width * scale,
            height: 720 * scale,
            // `zoom` would change layout width; a transform keeps the iframe's
            // own viewport at the real pixel width so media queries behave.
            overflow: "hidden",
          }}
        >
          <iframe
            title={`Site preview at ${width} pixels wide`}
            src={src}
            width={width}
            height={720}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: 0,
              background: "var(--md-surface)",
              borderRadius: 8,
            }}
          />
        </div>
      </ScrollX>
    </div>
  );
}
