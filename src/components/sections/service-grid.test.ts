import { describe, expect, it } from "vitest";

import { services } from "@/config/content";

import { serviceGridSpans, type ServiceCellSpan } from "./service-grid";

/**
 * The service grid's span arithmetic.
 *
 * This exists because of a real defect: the featured service used to take
 * `col-span-2` in a three-column grid, six services therefore occupied seven
 * cells, and seven is not a multiple of three — so the last row rendered one
 * card with two empty cells beside it (measured 403px of card against 826px of
 * nothing at 1920). The rule that replaced it is arithmetic, so it is tested as
 * arithmetic rather than by looking at a screenshot again.
 *
 * The invariant every case checks: **for the given column count, the cells sum
 * to a whole number of rows.** That is precisely "no row is left with a lone
 * item and dead space", expressed as a number.
 */

const cells = (spans: readonly ServiceCellSpan[], columns: 2 | 3) =>
  spans.reduce(
    (sum, span) => sum + (columns === 3 ? span.lgCols * span.lgRows : span.smCols),
    0,
  );

describe("serviceGridSpans", () => {
  it("fills a 3×3 grid exactly for six services with one featured", () => {
    const spans = serviceGridSpans(6, 0);

    expect(spans[0]).toEqual({ lgCols: 2, lgRows: 2, smCols: 1 });
    expect(spans.slice(1)).toEqual(
      Array.from({ length: 5 }, () => ({ lgCols: 1, lgRows: 1, smCols: 1 })),
    );
    // 2×2 + five 1×1 = 9 = three full rows of three.
    expect(cells(spans, 3)).toBe(9);
    expect(cells(spans, 3) % 3).toBe(0);
  });

  it("honours a featured service that starts a later row", () => {
    const spans = serviceGridSpans(6, 3);
    expect(spans[3]).toEqual({ lgCols: 2, lgRows: 2, smCols: 1 });
    expect(cells(spans, 3) % 3).toBe(0);
  });

  it("declines the tile when auto-placement could not reach it", () => {
    // Index 1 is mid-row: a two-column item does not fit the one cell left, so
    // CSS grid would skip to the next row and leave that cell empty.
    const spans = serviceGridSpans(6, 1);
    expect(spans[1]!.lgCols).toBe(1);
    expect(spans[1]!.lgRows).toBe(1);
    expect(cells(spans, 3) % 3).toBe(0);
  });

  it("declines the featured tile when it would not fill the grid", () => {
    // Seven services plus a 2×2 tile is ten cells, which strands one.
    const spans = serviceGridSpans(7, 0);
    expect(spans[0]!.lgRows).toBe(1);
    expect(spans[0]!.lgCols).toBe(1);
    expect(cells(spans, 3) % 3).toBe(0);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    "leaves no partial row at three columns for %i services",
    (count) => {
      for (const featured of [-1, 0, 1, 3, count - 1]) {
        expect(cells(serviceGridSpans(count, featured), 3) % 3).toBe(0);
      }
    },
  );

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    "leaves no partial row at two columns for %i services",
    (count) => {
      for (const featured of [-1, 0, 1, 3, count - 1]) {
        expect(cells(serviceGridSpans(count, featured), 2) % 2).toBe(0);
      }
    },
  );

  it("never widens a cell past the column count", () => {
    for (let count = 1; count <= 12; count += 1) {
      for (const span of serviceGridSpans(count, 0)) {
        expect(span.lgCols).toBeLessThanOrEqual(3);
        expect(span.smCols).toBeLessThanOrEqual(2);
        expect(span.lgRows).toBeLessThanOrEqual(2);
      }
    }
  });

  it("returns nothing for an empty list", () => {
    expect(serviceGridSpans(0, -1)).toEqual([]);
  });

  it("gives the shipped service list a featured tile that fills the grid", () => {
    // Guards the data, not just the function: if someone adds a seventh service
    // the grid stays whole, but the emphasis silently disappears — and this is
    // the test that says so out loud rather than letting it pass unnoticed.
    const featured = services.findIndex((service) => service.featured);
    expect(featured).toBeGreaterThanOrEqual(0);
    const spans = serviceGridSpans(services.length, featured);
    expect(spans[featured]).toEqual({ lgCols: 2, lgRows: 2, smCols: 1 });
    expect(cells(spans, 3) % 3).toBe(0);
    expect(cells(spans, 2) % 2).toBe(0);
  });
});
