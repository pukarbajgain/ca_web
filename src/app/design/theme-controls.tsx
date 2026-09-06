"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollX } from "@/components/ui/scroll-x";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
