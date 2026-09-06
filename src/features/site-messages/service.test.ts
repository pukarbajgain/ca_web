import { describe, expect, it } from "vitest";

import { pathFromSegments } from "./path";

/**
 * The segments a parallel-route slot receives are the only thing standing
 * between a URL and the backend's targeting rules, and the rules compare
 * strings. These are the cases where an off-by-one slash changes which page a
 * message appears on — which is the failure an editor would report as "the
 * notice is on the wrong page" and nobody would think to look here for.
 */
describe("pathFromSegments", () => {
  it("maps the unmatched optional catch-all to the home path", () => {
    expect(pathFromSegments(undefined)).toBe("/");
    expect(pathFromSegments([])).toBe("/");
  });

  it("rebuilds a single segment with its leading slash", () => {
    expect(pathFromSegments(["services"])).toBe("/services");
  });

  it("rebuilds a nested path", () => {
    expect(pathFromSegments(["insights", "vat-registration"])).toBe(
      "/insights/vat-registration",
    );
  });

  it("drops the empty segment a trailing slash produces", () => {
    // `/services/` must target the same page as `/services`; a trailing empty
    // segment would otherwise send `/services/` to the backend and miss every
    // rule written for `/services`.
    expect(pathFromSegments(["services", ""])).toBe("/services");
  });
});
