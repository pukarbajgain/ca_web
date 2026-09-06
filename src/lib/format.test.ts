import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatDate,
  formatDateShort,
  formatMonthYear,
  formatNpr,
  nepaliFiscalYearLabel,
  slugify,
  toDateTimeAttr,
  truncate,
} from "./format";

/**
 * The date tests are the point of this file. Nepal is UTC+05:45, so anything
 * published between 00:00 and 05:45 NPT lands on the *previous* Gregorian day
 * in UTC. A server rendering in UTC that forgets `timeZone` therefore prints
 * the wrong date for roughly a quarter of the day — silently, and only for some
 * articles. These assertions pin that.
 */

describe("date formatting", () => {
  it("formats in Nepal Time regardless of the runtime timezone", () => {
    // 2026-08-11T20:00Z is 2026-08-12T01:45 in Kathmandu — the next day.
    expect(formatDate("2026-08-11T20:00:00Z")).toBe("12 August 2026");
    expect(formatDateShort("2026-08-11T20:00:00Z")).toBe("12 Aug 2026");
    expect(formatMonthYear("2026-08-11T20:00:00Z")).toBe("August 2026");
  });

  it("respects an explicit offset in the ISO string", () => {
    expect(formatDate("2026-01-01T00:30:00+05:45")).toBe("1 January 2026");
  });

  it("returns null for an unparseable value so the caller renders nothing", () => {
    expect(formatDate("not a date")).toBeNull();
    expect(formatDateShort("")).toBeNull();
    expect(toDateTimeAttr("nonsense")).toBeNull();
  });

  it("emits a machine-readable ISO string for <time dateTime>", () => {
    expect(toDateTimeAttr("2026-08-11T20:00:00Z")).toBe("2026-08-11T20:00:00.000Z");
  });
});

describe("nepaliFiscalYearLabel", () => {
  it("uses the previous BS year before the mid-July boundary", () => {
    // 1 July 2026 is still in FY 2082/83.
    expect(nepaliFiscalYearLabel("2026-07-01T06:00:00+05:45")).toBe("2082/83");
  });

  it("rolls to the next BS year on and after 16 July", () => {
    expect(nepaliFiscalYearLabel("2026-07-16T06:00:00+05:45")).toBe("2083/84");
    expect(nepaliFiscalYearLabel("2026-12-31T06:00:00+05:45")).toBe("2083/84");
  });

  it("pads the second half of the label to two digits", () => {
    // A boundary that produces …/00 must not render as "…/0".
    expect(nepaliFiscalYearLabel("2043-08-01T06:00:00+05:45")).toBe("2100/01");
  });

  it("returns null for an unparseable value", () => {
    expect(nepaliFiscalYearLabel("nope")).toBeNull();
  });
});

describe("numbers", () => {
  it("separates thousands", () => {
    expect(formatCount(1204556)).toBe("1,204,556");
  });

  it("renders NPR the way a Nepali invoice does", () => {
    expect(formatNpr(1250000)).toBe("Rs. 1,250,000");
  });

  it("returns an empty string for a non-finite value rather than 'NaN'", () => {
    expect(formatCount(Number.NaN)).toBe("");
    expect(formatNpr(Number.POSITIVE_INFINITY)).toBe("");
  });
});

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("Audit and assurance", 40)).toBe("Audit and assurance");
  });

  it("cuts on a word boundary and appends an ellipsis", () => {
    const result = truncate("Statutory audit under the Companies Act of Nepal", 30);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).not.toContain("  ");
  });
});

describe("slugify", () => {
  it("expands an ampersand rather than dropping it", () => {
    expect(slugify("Audit & Assurance")).toBe("audit-and-assurance");
  });

  it("collapses punctuation and trims separators", () => {
    expect(slugify("  VAT / TDS — returns!  ")).toBe("vat-tds-returns");
  });
});
