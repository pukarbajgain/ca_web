/**
 * Generates `public/placeholders/*.svg` and `public/brand/*.svg`.
 *
 * Run with `pnpm assets:generate`. Regenerating is idempotent, so the files are
 * committed (a build must not depend on a codegen step) but are never
 * hand-edited — edit the composition here instead.
 *
 * ── Why these look the way they do (ARCHITECTURE.md §J.4.3) ─────────────────
 * The brief is "intentional, but never mistaken for content". Two traps to
 * avoid, and the reasoning is worth keeping:
 *
 *  - **A grey box with "1200×630" stamped on it** is honest but ugly, and it
 *    makes every review of the page a review of the placeholder.
 *  - **Stock photography** is worse: the page gets designed around a photograph
 *    the firm's real photograph will not match, and the layout collapses on
 *    swap day.
 *
 * So each placeholder is an abstract composition in the design system's own
 * neutrals, built from the ledger-rule motif the hero uses. It reads as
 * deliberate art direction at a glance and as obviously-not-a-photograph on a
 * second look.
 *
 * Each file carries `prefers-color-scheme` rules. An SVG referenced by `<img>`
 * is a separate document and cannot inherit the page's colour — but it *does*
 * see the user's colour-scheme preference, so this is the only way a raster-slot
 * placeholder can follow the theme.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { imageSlots, type ImageSlot } from "../src/lib/image-slots";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Light/dark pairs drawn from globals.css, so placeholders sit in the palette
 *  rather than beside it. Hex is duplicated here because a Node script cannot
 *  read CSS custom properties; a test asserts the pairs stay in sync. */
const PALETTE = {
  ground: ["#efeeeb", "#1b2122"],
  groundAlt: ["#e3e2df", "#252b2c"],
  rule: ["#bfc8ca", "#3f484a"],
  shape: ["#cbe7f0", "#324a52"],
  deep: ["#0e4a52", "#82d3de"],
} as const;

type ColourKey = keyof typeof PALETTE;

function themeStyle(): string {
  const light = (Object.keys(PALETTE) as ColourKey[])
    .map((key) => `--c-${key}:${PALETTE[key][0]}`)
    .join(";");
  const dark = (Object.keys(PALETTE) as ColourKey[])
    .map((key) => `--c-${key}:${PALETTE[key][1]}`)
    .join(";");
  return [
    "<style>",
    `svg{--c-scheme:light;${light}}`,
    `@media (prefers-color-scheme:dark){svg{${dark}}}`,
    "</style>",
  ].join("");
}

const c = (key: ColourKey) => `var(--c-${key})`;

function svg(width: number, height: number, body: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"`,
    ` width="${width}" height="${height}" role="presentation" data-placeholder="">`,
    themeStyle(),
    body,
    "</svg>",
  ].join("");
}

/** Evenly spaced horizontal hairlines — the ledger. Opacity falls off downward
 *  so the composition has a direction rather than reading as graph paper. */
function ledgerRules(
  width: number,
  height: number,
  count: number,
  inset: number,
  opacity = 0.9,
  yOffset = 0,
): string {
  const step = height / (count + 1);
  return Array.from({ length: count }, (_, i) => {
    const y = Math.round((yOffset + step * (i + 1)) * 100) / 100;
    const fade = opacity * (1 - (i / count) * 0.55);
    return `<rect x="${inset}" y="${y}" width="${width - inset * 2}" height="1" fill="${c("rule")}" opacity="${fade.toFixed(2)}"/>`;
  }).join("");
}

/* ── One composition per raster slot ──────────────────────────────────────── */

function portraitComposition(slot: ImageSlot): string {
  const { width: w, height: h } = slot.intrinsic;
  // An abstract figure: shoulders arc plus head circle. Recognisably a person's
  // silhouette so the crop is reviewable, obviously not a photograph.
  const headR = Math.round(w * 0.145);
  const headCy = Math.round(h * 0.38);
  const shoulderR = Math.round(w * 0.36);
  const shoulderCy = Math.round(h * 0.86);
  const neckW = Math.round(headR * 1.1);
  return svg(
    w,
    h,
    [
      `<rect width="${w}" height="${h}" fill="${c("groundAlt")}"/>`,
      ledgerRules(w, h, 8, Math.round(w * 0.1), 0.55),
      `<circle cx="${Math.round(w / 2)}" cy="${shoulderCy}" r="${shoulderR}" fill="${c("shape")}"/>`,
      // Neck bridge: two detached circles read as a target, not a person.
      `<rect x="${Math.round(w / 2 - neckW / 2)}" y="${headCy}" width="${neckW}" height="${shoulderCy - shoulderR - headCy + 12}" fill="${c("shape")}"/>`,
      `<circle cx="${Math.round(w / 2)}" cy="${headCy}" r="${headR}" fill="${c("shape")}"/>`,
      `<circle cx="${Math.round(w / 2)}" cy="${headCy}" r="${headR}" fill="none" stroke="${c("deep")}" stroke-width="3" opacity="0.3"/>`,
    ].join(""),
  );
}

function officeComposition(slot: ImageSlot): string {
  const { width: w, height: h } = slot.intrinsic;
  // A flat elevation: a facade grid over a horizon rule. Abstract, but it says
  // "building", so a real exterior photo replaces like for like.
  const cols = 6;
  const rows = 4;
  const padX = Math.round(w * 0.18);
  const padTop = Math.round(h * 0.2);
  const gridW = w - padX * 2;
  const gridH = Math.round(h * 0.52);
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const windows: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const opacity = 0.22 + ((row * cols + col) % 5) * 0.11;
      windows.push(
        `<rect x="${Math.round(padX + col * cellW + cellW * 0.12)}" y="${Math.round(padTop + row * cellH + cellH * 0.12)}" width="${Math.round(cellW * 0.76)}" height="${Math.round(cellH * 0.76)}" rx="3" fill="${c("shape")}" opacity="${opacity.toFixed(2)}"/>`,
      );
    }
  }
  return svg(
    w,
    h,
    [
      `<rect width="${w}" height="${h}" fill="${c("ground")}"/>`,
      `<rect x="${padX}" y="${padTop}" width="${gridW}" height="${gridH}" fill="none" stroke="${c("rule")}" stroke-width="2"/>`,
      windows.join(""),
      `<rect x="0" y="${padTop + gridH}" width="${w}" height="2" fill="${c("deep")}" opacity="0.45"/>`,
      // Offset is passed in rather than patched onto the output string: a regex
      // over generated SVG also matches `opacity="0.5"` and silently corrupts it.
      ledgerRules(w, Math.round(h * 0.24), 3, 0, 0.5, padTop + gridH + 20),
    ].join(""),
  );
}

function coverComposition(slot: ImageSlot): string {
  const { width: w, height: h } = slot.intrinsic;
  // Article covers sit next to headlines, so this is the quietest composition:
  // a measure block of rules with one accent rule standing in for a title.
  const inset = Math.round(w * 0.1);
  const barH = Math.max(4, Math.round(h / 120));
  return svg(
    w,
    h,
    [
      `<rect width="${w}" height="${h}" fill="${c("ground")}"/>`,
      `<rect x="${inset}" y="${Math.round(h * 0.3)}" width="${Math.round(w * 0.42)}" height="${barH * 3}" rx="${barH}" fill="${c("deep")}" opacity="0.5"/>`,
      Array.from({ length: 5 }, (_, i) => {
        const y = Math.round(h * 0.46 + i * (h * 0.075));
        const lineW = Math.round(w * (i === 4 ? 0.34 : 0.62));
        return `<rect x="${inset}" y="${y}" width="${lineW}" height="${barH}" rx="${barH / 2}" fill="${c("rule")}" opacity="${(0.85 - i * 0.1).toFixed(2)}"/>`;
      }).join(""),
      `<circle cx="${Math.round(w * 0.84)}" cy="${Math.round(h * 0.5)}" r="${Math.round(h * 0.26)}" fill="${c("shape")}" opacity="0.55"/>`,
    ].join(""),
  );
}

function ogComposition(slot: ImageSlot): string {
  const { width: w, height: h } = slot.intrinsic;
  return svg(
    w,
    h,
    [
      `<rect width="${w}" height="${h}" fill="${c("ground")}"/>`,
      ledgerRules(w, h, 7, Math.round(w * 0.08), 0.7),
      `<rect x="${Math.round(w * 0.42)}" y="${Math.round(h * 0.68)}" width="${Math.round(w * 0.16)}" height="4" rx="2" fill="${c("deep")}" opacity="0.5"/>`,
    ].join(""),
  );
}

/* ── Emit ─────────────────────────────────────────────────────────────────── */

const compositions: Record<string, (slot: ImageSlot) => string> = {
  "partner-portrait": portraitComposition,
  "office-exterior": officeComposition,
  "article-cover": coverComposition,
  "og-image": ogComposition,
};

function write(relative: string, contents: string): void {
  const target = join(ROOT, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${contents}\n`, "utf8");
  console.warn(`  wrote ${relative} (${(contents.length / 1024).toFixed(1)} KB)`);
}

console.warn("Generating placeholder art…");
for (const [name, build] of Object.entries(compositions)) {
  const slot = imageSlots[name as keyof typeof imageSlots];
  write(`public/placeholders/${name}.svg`, build(slot));
}
console.warn("Done.");
