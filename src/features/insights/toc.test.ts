import { describe, expect, it } from "vitest";

import { buildContents, slugifyHeading } from "./toc";

describe("buildContents", () => {
  it("gives every heading an id derived from its text", () => {
    const { html, headings } = buildContents(
      "<h2>How is residency decided?</h2><p>Body.</p><h3>The 183-day test</h3>",
    );
    expect(headings).toEqual([
      { id: "how-is-residency-decided", text: "How is residency decided?", level: 2 },
      { id: "the-183-day-test", text: "The 183-day test", level: 3 },
    ]);
    expect(html).toContain('<h2 id="how-is-residency-decided">');
    expect(html).toContain('<h3 id="the-183-day-test">');
  });

  it("keeps ids unique when two sections share a title", () => {
    // Two elements cannot share an id: the second anchor would jump to the first.
    const { headings } = buildContents("<h2>Example</h2><h2>Example</h2>");
    expect(headings.map((h) => h.id)).toEqual(["example", "example-2"]);
  });

  it("leaves an id the editor wrote themselves alone", () => {
    // They may be maintaining an anchor something already links to.
    const { html, headings } = buildContents('<h2 id="legacy-anchor">Rates</h2>');
    expect(html).toContain('id="legacy-anchor"');
    expect(html).not.toContain('id="rates"');
    // It is still listed, so the contents rail is complete...
    expect(headings[0]?.text).toBe("Rates");
  });

  it("reads through inline markup inside a heading", () => {
    const { headings } = buildContents("<h2>The <strong>TDS</strong> trap</h2>");
    expect(headings[0]).toMatchObject({ text: "The TDS trap", id: "the-tds-trap" });
  });

  it("ignores an empty heading rather than emitting a blank anchor", () => {
    const { html, headings } = buildContents("<h2></h2><h2>Real</h2>");
    expect(headings).toHaveLength(1);
    expect(html).toContain("<h2></h2>");
  });

  it("leaves a body with no headings untouched", () => {
    const body = "<p>One paragraph, no sections.</p>";
    expect(buildContents(body)).toEqual({ html: body, headings: [] });
  });

  it("decodes the entities the sanitiser emits", () => {
    expect(buildContents("<h2>Fees &amp; billing</h2>").headings[0]?.text).toBe(
      "Fees & billing",
    );
  });
});

describe("slugifyHeading", () => {
  it("drops punctuation and collapses whitespace", () => {
    expect(slugifyHeading("  What income do NRIs pay tax on?  ")).toBe(
      "what-income-do-nris-pay-tax-on",
    );
  });

  it("never leaves a leading or trailing hyphen", () => {
    expect(slugifyHeading("— Rates —")).toBe("rates");
  });
});
