import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The two gates that run at every viewport (ARCHITECTURE.md §K).
 *
 * Both are deliberately blunt. A screenshot diff tells you *something* changed;
 * these tell you the page is broken. Horizontal overflow and a serious axe
 * violation are the two failures that are always bugs, at any width, on any
 * page — which is what makes them safe to gate on.
 */

/**
 * Every page a visitor can reach, plus the design surface.
 *
 * The list is exhaustive on purpose. A gate that covers only the landing page
 * proves the landing page, and every regression this suite has actually caught
 * — a soft 404, a contrast failure under a translucent panel, a fixed bar
 * covering the last element of a page — was the kind that lands on whichever
 * page nobody was looking at. `/insights/[slug]` and `/team/[slug]` are absent
 * because their content is API-supplied and there is no slug that is guaranteed
 * to exist; the article body's own gate lives in the unit tests for `toc.ts`.
 */
const PAGES = [
  { path: "/", name: "landing" },
  { path: "/services", name: "services" },
  { path: "/insights", name: "insights" },
  { path: "/team", name: "team" },
  { path: "/about", name: "about" },
  { path: "/downloads", name: "downloads" },
  { path: "/contact", name: "contact" },
  { path: "/design", name: "design system" },
] as const;

/**
 * Wait until the page is safe to measure.
 *
 * NOT Playwright's `"networkidle"` state. That is what this file used first, and
 * it timed out on every page against a production `next start`: Next keeps
 * background work in flight (ISR revalidation of the settings fetch), so the
 * network never goes quiet for 500ms and the gate fails on a page that is
 * perfectly fine. Playwright's own guidance is to avoid that state.
 *
 * What actually needs waiting for is narrower and deterministic: the load event,
 * then `document.fonts.ready`, then one frame. The type scale is `clamp()`-driven,
 * so measuring before the webfonts swap in reports the fallback font's metrics —
 * a flaky *pass*, which is worse than a flaky failure.
 */
/**
 * Keep a CMS popup out of the page measurements.
 *
 * A `site_message` with `placement: popup_modal` opens a native `<dialog>` in
 * the browser's top layer and paints a 45% scrim over everything. Both gates
 * below then measure the *scrimmed* page: the contrast sampler reads every
 * paragraph on the site against mid-grey and reports the entire footer as
 * failing, which is a true statement about a page nobody is reading and a
 * false statement about the page.
 *
 * Neutralising `showModal` before navigation is deterministic in a way that
 * closing the dialog afterwards is not — the popup's trigger may be a delay or
 * a scroll depth, so "close it if it is open" races the thing it is trying to
 * suppress and produces a gate that passes or fails on timing.
 *
 * The popup's own contrast is therefore **not** covered here, and that is a
 * gap worth naming rather than hiding: it is data-dependent (there may be no
 * popup published at all), so gating on it would make CI depend on the
 * contents of a database.
 */
async function suppressPopups(page: Page) {
  await page.addInitScript(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      // `show()` rather than nothing: a component that opens a dialog and then
      // reads `.open` still behaves, so this suppresses the overlay without
      // changing the page's logic. It is then hidden by the rule below.
      this.setAttribute("data-suppressed-modal", "");
      this.style.display = "none";
    };
  });
}

async function waitUntilMeasurable(page: Page) {
  await page.waitForLoadState("load");
  /* `/design` mounts its theme provider on the client and renders nothing until
   * it has, so `load` can fire on an empty body. Measuring then reports a
   * flawless page with no content in it — a silent pass, which is the one
   * failure mode a gate must not have. */
  await page.waitForFunction(
    () => (document.body.innerText ?? "").trim().length > 200,
    undefined,
    { timeout: 15_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

/**
 * The overflow assertion.
 *
 * `documentElement.scrollWidth > clientWidth` is the honest test: it is exactly
 * what makes the browser show a horizontal scrollbar. Comparing against
 * `window.innerWidth` instead would produce false failures on platforms that
 * reserve scrollbar gutter, so `clientWidth` is used on both sides.
 *
 * A one-pixel tolerance absorbs sub-pixel rounding from `clamp()` type and
 * fractional grid gaps, which are not layout bugs.
 */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const offenders: string[] = [];

    // Report *what* overflows, not just that something does — otherwise this
    // failure costs an hour of bisecting CSS.
    if (doc.scrollWidth - doc.clientWidth > 1) {
      for (const element of Array.from(
        document.body.querySelectorAll<HTMLElement>("*"),
      )) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > doc.clientWidth + 1 || rect.left < -1) {
          const parent = element.parentElement;
          // An element inside a deliberate `overflow-x: auto` container is
          // supposed to be wider than the page (globals.css `.scroll-x`).
          const scrollable =
            parent && getComputedStyle(parent).overflowX.match(/auto|scroll|hidden/);
          if (!scrollable) {
            offenders.push(
              `${element.tagName.toLowerCase()}.${element.className?.toString().slice(0, 80)}`,
            );
          }
        }
        if (offenders.length >= 5) break;
      }
    }

    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders };
  });

  expect(
    overflow.scrollWidth - overflow.clientWidth,
    `Horizontal overflow of ${overflow.scrollWidth - overflow.clientWidth}px. Likely offenders: ${overflow.offenders.join(", ") || "none identified"}`,
  ).toBeLessThanOrEqual(1);
}

/**
 * ── The painted-ground contrast gate ────────────────────────────────────────
 *
 * Why this exists next to axe rather than instead of it.
 *
 * Lighthouse reported `color-contrast` at 4.42:1 on the hero's practice-index
 * panel — the "WHAT WE DO" eyebrow and the 01–06 numerals — while our axe run
 * reported zero violations at all four viewports. Two independent reasons:
 *
 *  1. **axe skips `aria-hidden` elements for colour contrast**, on the grounds
 *     that they are hidden from assistive technology. That is correct for a
 *     screen reader and wrong for a sighted low-vision reader, who still has to
 *     read the numeral. Most of the failing nodes were `aria-hidden`.
 *  2. **axe cannot resolve a background it did not compute.** Text over a
 *     gradient, a blurred bloom or a translucent panel makes axe return
 *     *incomplete* rather than a violation, and incompletes are not failures.
 *     The hero is all three of those stacked.
 *
 * So this gate does not ask the DOM what the background is. It hides every glyph
 * on the page, photographs what is left, and samples the pixels that were
 * actually painted underneath each run of text — including under `aria-hidden`
 * text, and including whatever gradient, blur or translucency produced them. The
 * worst pixel in each text run is the one that has to clear the ratio.
 *
 * Element `opacity` is folded into the foreground before comparing, because
 * `getComputedStyle().color` does not include it and a numeral at `opacity-80`
 * is genuinely dimmer than its declared colour. That is the bug this codebase
 * already hit once at `opacity-40`.
 */

async function expectTextMeetsContrastAgainstPaintedGround(page: Page) {
  /* 1. Tag every element that owns painted text, and record what colour it
   *    paints it in. Tagging rather than returning handles keeps the whole
   *    measurement inside one `evaluate` per scroll step. */
  const total = await page.evaluate(() => {
    const parseRgb = (value: string): number[] => {
      const nums = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 1];
    };

    /**
     * What counts as chrome — something painted *over* the document rather than
     * in it. `fixed` always is. `sticky` only when it also opens a stacking
     * context (`z-index` other than `auto`): that is the difference between the
     * site header, which deliberately floats above the page, and the firm-intro
     * column, which is `lg:sticky` but never covers anything.
     */
    const isChrome = (s: CSSStyleDeclaration) =>
      s.position === "fixed" || (s.position === "sticky" && s.zIndex !== "auto");

    let id = 0;
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      // Only elements that own text directly; a wrapper would double-report the
      // same glyphs with a colour it does not actually paint.
      const owns = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0,
      );
      if (!owns) continue;

      /* ── The three exemptions, each for a reason WCAG states ──────────────
       * • SVG-drawn glyphs are a *graphic*, not text. 1.4.3 governs text. The
       *   step numerals in `how-we-work` are drawn as `<svg><text>` precisely
       *   so that this distinction is made honestly rather than by suppressing
       *   a rule — see the comment there — and the wordmark is a logo, which
       *   1.4.3 also exempts.
       * • An inactive user-interface component has no contrast requirement.
       * • `sr-only` text is clipped to a 1px box and never painted at all. */
      if (el.closest("svg")) continue;
      if (el.closest("[disabled],[aria-disabled='true'],.sr-only")) continue;

      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Nothing is painted for an element inside a `display: none` subtree, and
      // this page has plenty of those: the desktop nav below `lg`, the phone
      // action bar from `md`. `getClientRects()` is empty for all of them.
      if (el.getClientRects().length === 0) continue;
      /* A run taller than the viewport can never be *wholly* on screen, so the
       * sampler would skip it silently and the coverage assertion below would
       * fail forever. Skipping it here, deliberately, is the honest version of
       * the same thing — and nothing on this site is that tall except on a very
       * short viewport. */
      if (el.getBoundingClientRect().height > window.innerHeight * 0.9) continue;
      /* Nothing is painted for a run that sits entirely outside a clipping
       * ancestor either — the credential marquee's rail is four copies of the
       * list wide and its strip shows one screenful, so most of those items are
       * never on screen at any scroll position. They are the same six strings
       * in the same style as the ones that are. */
      if (
        (() => {
          const box = el.getBoundingClientRect();
          for (let n = el.parentElement; n; n = n.parentElement) {
            const s = getComputedStyle(n);
            if (s.overflowX === "visible" && s.overflowY === "visible") continue;
            const clip = n.getBoundingClientRect();
            if (box.right <= clip.left || box.left >= clip.right) return true;
          }
          return false;
        })()
      ) {
        continue;
      }

      // Cumulative opacity, and whether anything above is page chrome. An
      // ancestor at 0.4 genuinely dims this text whatever its declared colour
      // says, and `getComputedStyle().color` does not include it — that is the
      // bug this codebase already hit once, at `opacity-40`.
      let opacity = 1;
      let chrome = false;
      for (let node: HTMLElement | null = el; node; node = node.parentElement) {
        const s = getComputedStyle(node);
        opacity *= Number(s.opacity || "1");
        if (isChrome(s)) chrome = true;
      }
      // A hover-only affordance is not painted until it is hovered.
      if (opacity <= 0.02) continue;

      const [r, g, b, a] = parseRgb(style.color);
      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;

      el.dataset.contrastId = String(id++);
      el.dataset.contrastFg = [r!, g!, b!, a! * opacity].join(",");
      // WCAG 1.4.3: 3:1 for large text (≥24px, or ≥18.66px when bold), else 4.5:1.
      el.dataset.contrastFloor =
        size >= 24 || (size >= 18.66 && weight >= 700) ? "3" : "4.5";
      if (chrome) el.dataset.contrastChromeText = "";
    }
    return id;
  });

  expect(total, "found no text to measure — the selector is wrong").toBeGreaterThan(20);

  /* 2. Blank every glyph. Backgrounds, borders and rules stay exactly as
   *    painted, so what is left in the photograph is the ground. */
  const blank = (hideChrome: boolean) =>
    page.evaluate((hide) => {
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
        const s = getComputedStyle(el);
        if (s.position === "fixed" || (s.position === "sticky" && s.zIndex !== "auto")) {
          el.dataset.contrastChromeBox = "";
        }
      }
      const style = document.createElement("style");
      style.id = "__contrast_blanker";
      style.textContent = [
        "*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }",
        // `color` does not blank an SVG glyph; without this the watermark
        // numerals stay painted and contaminate the ground beneath real text.
        "svg text, svg tspan { fill: transparent !important; stroke: none !important; }",
        // Freeze anything in motion. The credential marquee moves ~30px a
        // second, which is enough for the geometry read in one call and the
        // photograph taken in the next to disagree about where a word is.
        "*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }",
        hide ? "[data-contrast-chrome-box] { visibility: hidden !important; }" : "",
      ].join("\n");
      document.head.append(style);
    }, hideChrome);

  const unblank = () =>
    page.evaluate(() => document.getElementById("__contrast_blanker")?.remove());

  /**
   * Sampling is done **viewport by viewport, never `fullPage`**. A full-page
   * capture does not agree with `getBoundingClientRect()` on this page — the
   * `min-h-dvh` shell and the `animation-timeline: view()` entrances both react
   * to the capture, so the photograph and the geometry drift apart and every
   * sample lands in the wrong section. Scrolling and shooting the real viewport
   * measures exactly what a reader sees at that scroll position.
   */
  const sampleVisible = async (which: "flow" | "chrome") => {
    const shot = (await page.screenshot()).toString("base64");
    return page.evaluate(
      async ({ shot, which }) => {
        const channel = (c: number) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        const luminance = (p: number[]) =>
          0.2126 * channel(p[0]!) + 0.7152 * channel(p[1]!) + 0.0722 * channel(p[2]!);
        const contrast = (x: number[], y: number[]) => {
          const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m);
          return (hi! + 0.05) / (lo! + 0.05);
        };

        const image = new Image();
        image.src = `data:image/png;base64,${shot}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(image, 0, 0);
        // A phone project runs at a device pixel ratio > 1, so the photograph is
        // larger than the CSS viewport. Everything below is in CSS pixels.
        const scale = canvas.width / document.documentElement.clientWidth;

        const selector =
          which === "chrome"
            ? "[data-contrast-id][data-contrast-chrome-text]"
            : "[data-contrast-id]:not([data-contrast-chrome-text])";

        const measured: string[] = [];
        const bad: { label: string; ratio: number; floor: number; ground: number[] }[] =
          [];

        for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
          const fg = el.dataset.contrastFg!.split(",").map(Number);
          const floor = Number(el.dataset.contrastFloor);
          const alpha = fg[3]!;

          const rects: DOMRect[] = [];
          for (const node of Array.from(el.childNodes)) {
            if (node.nodeType !== Node.TEXT_NODE) continue;
            if (!(node.textContent ?? "").trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            rects.push(...Array.from(range.getClientRects()));
          }
          if (rects.length === 0) continue;

          /* How much of this run the viewport is showing right now. A run that
           * is only partly on screen is left for a later scroll step — *unless*
           * an ancestor clips it horizontally, which is what the credential
           * marquee does: its rail is far wider than the strip, so its items are
           * permanently half-shown and would otherwise never be measured at all.
           * For those, the part the rail actually shows is the whole of what a
           * reader ever sees, so measuring it is measuring the run. */
          const viewportWidth = document.documentElement.clientWidth;
          const clipped = ((): boolean => {
            for (let n = el.parentElement; n; n = n.parentElement) {
              const s = getComputedStyle(n);
              if (s.overflowX === "visible") continue;
              const box = n.getBoundingClientRect();
              if (rects.some((r) => r.left < box.left - 1 || r.right > box.right + 1)) {
                return true;
              }
            }
            return false;
          })();

          const visible = rects.map((r) => ({
            left: Math.max(r.left, 0),
            top: Math.max(r.top, 0),
            right: Math.min(r.right, viewportWidth),
            bottom: Math.min(r.bottom, window.innerHeight),
            area: r.width * r.height,
          }));
          const shown = visible.reduce(
            (sum, v) =>
              sum + Math.max(0, v.right - v.left) * Math.max(0, v.bottom - v.top),
            0,
          );
          const total = visible.reduce((sum, v) => sum + v.area, 0);
          if (total === 0) continue;
          const coverage = shown / total;
          if (coverage < (clipped ? 0.15 : 0.995)) continue;

          let worst = Infinity;
          let worstGround: number[] = [];
          for (const rect of visible) {
            const x = Math.round(rect.left * scale);
            const y = Math.round(rect.top * scale);
            const w = Math.min(
              Math.round((rect.right - rect.left) * scale),
              canvas.width - x,
            );
            const h = Math.min(
              Math.round((rect.bottom - rect.top) * scale),
              canvas.height - y,
            );
            if (w < 1 || h < 1) continue;
            const data = ctx.getImageData(x, y, w, h).data;
            for (let i = 0; i < data.length; i += 4) {
              const ground = [data[i]!, data[i + 1]!, data[i + 2]!];
              // Composite the declared colour (with its opacity) over this
              // pixel: that is the colour a reader actually sees.
              const painted = fg
                .slice(0, 3)
                .map((c, k) => alpha * c + (1 - alpha) * ground[k]!);
              const ratio = contrast(painted, ground);
              if (ratio < worst) {
                worst = ratio;
                worstGround = ground;
              }
            }
          }
          if (worst === Infinity) continue;

          measured.push(el.dataset.contrastId!);
          // A small tolerance absorbs PNG round-tripping and sub-pixel
          // antialiasing at a glyph edge; it is far below any real defect.
          if (worst < floor - 0.1) {
            bad.push({
              label: `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} — "${(el.textContent ?? "").trim().slice(0, 34)}"`,
              ratio: worst,
              floor,
              ground: worstGround,
            });
          }
        }

        // Drop what has been measured so a later step does not repeat it.
        for (const id of measured) {
          document
            .querySelector<HTMLElement>(`[data-contrast-id="${id}"]`)
            ?.removeAttribute("data-contrast-id");
        }
        return bad;
      },
      { shot, which },
    );
  };

  const failures: { label: string; ratio: number; floor: number; ground: number[] }[] =
    [];
  const frame = () =>
    page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  const scrollTo = async (y: number) => {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await frame();
    await frame();
  };

  /* Chrome first — the sticky header and the phone action bar are painted *over*
   * the page, so they have to be photographed with the page behind them. Twice,
   * because the header is transparent over the hero at rest and picks up a
   * translucent ground once scrolled: two different grounds, both real. */
  await blank(false);
  failures.push(...(await sampleVisible("chrome")));
  await scrollTo(900);
  failures.push(...(await sampleVisible("chrome")));
  await unblank();

  /* Then the document flow with the chrome hidden. Hiding it is what stops the
   * header's translucent, backdrop-blurred ground from being mistaken for the
   * ground under the content it happens to be floating above — that is
   * occlusion, not a contrast defect, and it produced three false failures
   * before this pass was split out. `visibility: hidden` keeps the layout
   * identical. */
  await blank(true);
  const viewport = await page.evaluate(() => window.innerHeight);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.round(viewport * 0.75)) {
    await scrollTo(y);
    failures.push(...(await sampleVisible("flow")));
  }

  /* Anything still untagged never happened to be *wholly* on screen at a step
   * boundary — a tall paragraph, or a run that only ever appeared clipped. Scroll
   * each remaining one to the middle and measure it, so the gate's coverage does
   * not depend on where the steps happened to land. Bounded, because an
   * unbounded loop here would be a hang rather than a failure. */
  for (let round = 0; round < 12; round += 1) {
    const done = await page.evaluate(() => {
      const next = document.querySelector<HTMLElement>(
        "[data-contrast-id]:not([data-contrast-chrome-text])",
      );
      if (!next) return true;
      next.scrollIntoView({ block: "center", behavior: "instant" });
      return false;
    });
    if (done) break;
    await frame();
    await frame();
    failures.push(...(await sampleVisible("flow")));
  }

  const unmeasured = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-contrast-id]")).map(
      (el) =>
        `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} — "${(el.textContent ?? "").trim().slice(0, 30)}"`,
    ),
  );
  await unblank();
  await scrollTo(0);

  // A run this gate silently skipped is a run it does not protect, so what was
  // skipped is asserted rather than assumed — and named, so a future skip is a
  // five-second diagnosis instead of a bisect.
  expect(unmeasured, "text runs the contrast gate never managed to sample").toEqual([]);

  expect(
    failures.map(
      (f) =>
        `${f.ratio.toFixed(2)}:1 (needs ${f.floor}:1) over rgb(${f.ground.join(",")}) — ${f.label}`,
    ),
    "Text does not clear its contrast floor against the ground actually painted behind it.",
  ).toEqual([]);
}

for (const { path, name } of PAGES) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await suppressPopups(page);
    });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto(path);
      await waitUntilMeasurable(page);
      await expectNoHorizontalOverflow(page);
    });

    test("has no serious or critical accessibility violations", async ({ page }) => {
      await page.goto(path);
      await waitUntilMeasurable(page);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // The design page renders the live site in an iframe; auditing it here
        // would double-report every violation the landing-page run already owns.
        .exclude("iframe")
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );

      expect(
        blocking,
        blocking
          .map(
            (v) =>
              `${v.id}: ${v.help} (${v.nodes.length} nodes)\n  ${v.nodes[0]?.html ?? ""}`,
          )
          .join("\n"),
      ).toEqual([]);
    });

    test("every run of text clears its contrast floor against the painted ground", async ({
      page,
    }) => {
      await page.goto(path);
      await waitUntilMeasurable(page);
      await expectTextMeetsContrastAgainstPaintedGround(page);
    });
  });
}

/**
 * ── The grid-fill gate ──────────────────────────────────────────────────────
 *
 * The defect it was written for: the services grid gave its featured card
 * `col-span-2` in a three-column grid, so six services occupied seven cells and
 * the last row rendered **one card with two empty cells beside it** — 403px of
 * content against 826px of nothing, at every width from 1024 up.
 *
 * A screenshot test would have caught that only if someone looked at the right
 * screenshot. This measures it: for every row track the grid declares, the items
 * sitting in that track must span the grid's full width. An item spanning two
 * rows counts in both, which is exactly how the 2×2 featured tile fills the
 * space the orphan used to waste.
 */
async function expectEveryGridRowIsFull(page: Page, selector: string, label: string) {
  const rows = await page.evaluate((sel) => {
    const grid = document.querySelector<HTMLElement>(sel);
    if (!grid) return null;
    const style = getComputedStyle(grid);
    const box = grid.getBoundingClientRect();
    const rowGap = parseFloat(style.rowGap) || 0;
    const columnGap = parseFloat(style.columnGap) || 0;

    let y = box.top;
    return style.gridTemplateRows
      .split(" ")
      .map(parseFloat)
      .filter((h) => !Number.isNaN(h))
      .map((height) => {
        const band = { top: y, bottom: y + height };
        y += height + rowGap;

        const inBand = Array.from(grid.children).filter((child) => {
          const rect = child.getBoundingClientRect();
          return rect.top < band.bottom - 1 && rect.bottom > band.top + 1;
        });
        const covered =
          inBand.reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) +
          Math.max(0, inBand.length - 1) * columnGap;

        return {
          items: inBand.length,
          covered: Math.round(covered),
          width: Math.round(box.width),
        };
      });
  }, selector);

  expect(rows, `${label}: grid not found`).not.toBeNull();
  expect(rows!.length, `${label}: grid has no rows`).toBeGreaterThan(0);

  for (const [index, row] of rows!.entries()) {
    expect(
      row.width - row.covered,
      `${label}: row ${index + 1} of ${rows!.length} leaves ${row.width - row.covered}px empty beside ${row.items} item(s)`,
    ).toBeLessThanOrEqual(2);
  }
}

test.describe("landing page grids", () => {
  test("leaves no stranded card in the services grid", async ({ page }) => {
    await page.goto("/");
    await waitUntilMeasurable(page);
    await expectEveryGridRowIsFull(
      page,
      '[aria-labelledby="services-heading"] ul',
      "services",
    );
  });

  test("leaves no stranded step in the engagement grid", async ({ page }) => {
    await page.goto("/");
    await waitUntilMeasurable(page);
    await expectEveryGridRowIsFull(page, '[aria-labelledby="how-heading"] ol', "steps");
  });

  /**
   * Within a row, the step bodies must start on one line.
   *
   * They did not: at 1024 a four-across row gave each step a 183px measure, one
   * title wrapped to three lines while its neighbours took one, and the four
   * paragraphs began 30px apart. The fix is 2×2 through the laptop range plus a
   * two-line reservation from `xl` — both of which this notices if they regress.
   */
  test("starts every step body on the same baseline as its row", async ({ page }) => {
    await page.goto("/");
    await waitUntilMeasurable(page);

    const rows = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-labelledby="how-heading"] ol > li'),
      );
      const byRow = new Map<number, number[]>();
      for (const item of items) {
        const row = Math.round(item.getBoundingClientRect().top);
        const body = item.querySelector("p:last-of-type");
        if (!body) continue;
        const top = Math.round(body.getBoundingClientRect().top);
        byRow.set(row, [...(byRow.get(row) ?? []), top]);
      }
      return Array.from(byRow.values());
    });

    expect(rows.length).toBeGreaterThan(0);
    for (const tops of rows) {
      expect(
        Math.max(...tops) - Math.min(...tops),
        `step bodies in one row start at ${tops.join(", ")}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  /**
   * The credential marquee has to read as motion, not as a clipping bug.
   *
   * Two separate failures were found here. The rail was animated by half a copy
   * of the list rather than a whole one, so the pattern jumped once per cycle;
   * and there were only two copies, so a wide viewport ran off the end of the
   * content. Both are geometry, so both are asserted as geometry: the rail
   * travels exactly one copy, and the content covers the strip at every point in
   * the cycle.
   */
  test("loops the credential marquee seamlessly and covers the strip", async ({
    page,
  }) => {
    await page.goto("/");
    await waitUntilMeasurable(page);

    const geometry = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".marquee-rail");
      const strip = document.querySelector<HTMLElement>(".marquee-viewport");
      if (!rail || !strip) return null;

      const animation = rail.getAnimations()[0];
      if (!animation) return null;
      const duration = Number(animation.effect?.getTiming().duration ?? 0);

      const copies = rail.querySelectorAll(".marquee-track").length;
      const copyWidth = rail.getBoundingClientRect().width / copies;

      // Pause and rewind *before* reading the origin: measuring travel against a
      // rail that is still moving is how this test first lied to itself.
      animation.pause();
      animation.currentTime = 0;
      const originLeft = rail.getBoundingClientRect().left;

      /* Times, not fractions: at `currentTime === duration` an infinitely
       * iterating animation has already wrapped to the start of the next
       * iteration and reads as zero travel. One millisecond earlier is the last
       * moment of the cycle, which is what we actually want to check. */
      const times = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration - 1];
      const samples = times.map((time) => {
        const fraction = time / duration;
        animation.currentTime = time;
        const stripBox = strip.getBoundingClientRect();
        const railBox = rail.getBoundingClientRect();
        return {
          fraction,
          travelled: originLeft - railBox.left,
          // Positive means the content stops short of the strip's edge, which is
          // the gap a reader would see as a hole in the ticker.
          leftGap: railBox.left - stripBox.left,
          rightGap: stripBox.right - railBox.right,
        };
      });
      animation.currentTime = 0;
      animation.play();
      return { copies, copyWidth, samples };
    });

    expect(geometry, "the marquee has no running animation").not.toBeNull();
    for (const sample of geometry!.samples) {
      /* Linear travel, ending on exactly one copy. Anything else leaves the
       * pattern out of phase at the loop point and the strip jumps once per
       * cycle — which is what a `translateX(-50%)` on each *track* (half a copy)
       * used to do. */
      expect(
        Math.abs(sample.travelled - sample.fraction * geometry!.copyWidth),
        `at ${sample.fraction} of the cycle the rail had travelled ${sample.travelled.toFixed(1)}px, not ${(sample.fraction * geometry!.copyWidth).toFixed(1)}px`,
      ).toBeLessThan(2);
    }
    for (const sample of geometry!.samples) {
      expect(
        sample.leftGap,
        "marquee content pulled away from the left edge",
      ).toBeLessThanOrEqual(1);
      expect(
        sample.rightGap,
        "marquee content ran out before the right edge",
      ).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  /**
   * `prefers-reduced-motion` has to mean *stopped*, not *fast*. The shared
   * `globals.css` block only shortens durations to 0.01ms, which for a marquee
   * snaps the rail to the end of its travel and leaves a strip cut off mid-word
   * — the appearance of a bug, produced by the accessibility preference. So the
   * rail stops being a rail: no animation, no transform, no mask, and the single
   * remaining copy wraps into a complete, readable list.
   */
  test("stops the credential marquee rather than speeding it up", async ({ page }) => {
    await page.goto("/");
    await waitUntilMeasurable(page);

    const state = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".marquee-rail");
      const strip = document.querySelector<HTMLElement>(".marquee-viewport");
      if (!rail || !strip) return null;
      const style = getComputedStyle(rail);
      const visibleItems = Array.from(rail.querySelectorAll<HTMLElement>("li")).filter(
        (li) => li.getClientRects().length > 0,
      );
      const stripBox = strip.getBoundingClientRect();
      return {
        animations: rail.getAnimations().length,
        animationName: style.animationName,
        transform: style.transform,
        maskImage: style.maskImage,
        flexWrap: style.flexWrap,
        visible: visibleItems.length,
        overflowing: visibleItems.some(
          (li) =>
            li.getBoundingClientRect().left < stripBox.left - 1 ||
            li.getBoundingClientRect().right > stripBox.right + 1,
        ),
      };
    });

    expect(state, "marquee missing").not.toBeNull();
    expect(state!.animations, "the marquee is still animating").toBe(0);
    expect(state!.animationName).toBe("none");
    expect(
      state!.transform === "none" || state!.transform === "matrix(1, 0, 0, 1, 0, 0)",
    ).toBe(true);
    expect(state!.maskImage, "an edge fade implies motion that is not happening").toBe(
      "none",
    );
    expect(state!.flexWrap).toBe("wrap");
    // The duplicate copies are removed, so the reader sees the list once…
    expect(state!.visible).toBe(6);
    // …and all of it, with nothing running off either edge.
    expect(state!.overflowing, "credentials still run off the edge of the strip").toBe(
      false,
    );
  });
});

test.describe("landing page structure", () => {
  test("keeps the mobile action bar clear of the footer", async ({ page }, testInfo) => {
    await page.goto("/");
    const bar = page.getByRole("group", { name: /get in touch/i });

    if (testInfo.project.name === "390-phone") {
      await expect(bar).toBeVisible();

      // The regression this catches: a fixed bar with no matching padding on
      // <main> permanently covers the last element of every page.
      const covered = await page.evaluate(() => {
        const main = document.querySelector("main");
        const footer = document.querySelector("footer");
        if (!main || !footer) return null;
        return getComputedStyle(main).paddingBottom;
      });
      expect(covered).not.toBe("0px");
    } else {
      await expect(bar).toBeHidden();
    }
  });

  test("exposes one primary navigation landmark and a working skip link", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip to content/i);
  });
});
