import { describe, expect, it } from "vitest";

import { formatFileSize } from "./format";

describe("formatFileSize", () => {
  it("renders whole bytes as a plain count with no decimal", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("renders kilobytes and megabytes to one decimal place", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(2_400_000)).toBe("2.3 MB");
    expect(formatFileSize(1_572_864)).toBe("1.5 MB");
  });

  it("drops a trailing '.0' rather than showing a fake precision", () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
  });

  it("rolls over into gigabytes for a large file", () => {
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe("3 GB");
  });

  it("returns an empty string for a non-finite or negative value rather than 'NaN'", () => {
    expect(formatFileSize(Number.NaN)).toBe("");
    expect(formatFileSize(-1)).toBe("");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("");
  });
});
