import { describe, expect, it, vi } from "vitest";

import { readAllPages } from "./paginate";

const OPTIONS = { pageSize: 2, maxPages: 5 };

function pageOf(items: string[], total: number) {
  return { status: "ok" as const, items, total };
}

describe("readAllPages", () => {
  it("reads a single short page and stops", async () => {
    const read = vi.fn(async () => pageOf(["a"], 1));

    expect(await readAllPages(read, OPTIONS)).toEqual(["a"]);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("follows pages until `total` is reached", async () => {
    const pages = [pageOf(["a", "b"], 3), pageOf(["c"], 3)];
    const read = vi.fn(async (page: number) => pages[page - 1]!);

    expect(await readAllPages(read, OPTIONS)).toEqual(["a", "b", "c"]);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("stops on a short page even when `total` is absent", async () => {
    const pages = [
      { status: "ok" as const, items: ["a", "b"] },
      { status: "ok" as const, items: ["c"] },
    ];
    const read = vi.fn(async (page: number) => pages[page - 1]!);

    expect(await readAllPages(read, OPTIONS)).toEqual(["a", "b", "c"]);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("never exceeds `maxPages`, however much the API claims to hold", async () => {
    // `total` says 100 and every page is full: without the ceiling this loops
    // fifty times inside a request a crawler is waiting on.
    const read = vi.fn(async () => pageOf(["x", "y"], 100));

    const items = await readAllPages(read, OPTIONS);

    expect(read).toHaveBeenCalledTimes(5);
    expect(items).toHaveLength(10);
  });

  it("stops at the first failed read and keeps what it already had", async () => {
    const pages = [pageOf(["a", "b"], 4), { status: "unavailable" as const }];
    const read = vi.fn(async (page: number) => pages[page - 1]!);

    // A partial list, never a fabricated one, and never a throw: a sitemap that
    // 500s teaches a crawler to stop asking.
    expect(await readAllPages(read, OPTIONS)).toEqual(["a", "b"]);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("returns nothing when the very first read fails", async () => {
    const read = vi.fn(async () => ({ status: "unavailable" as const }));

    expect(await readAllPages(read, OPTIONS)).toEqual([]);
  });
});
