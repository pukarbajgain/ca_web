import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Office, Person, Stat } from "@/lib/brand";

import { InsightRail } from "./insight-rail";
import { Offices } from "./offices";
import { PeopleRail } from "./people-rail";
import { StatsBand } from "./stats-band";

/**
 * The four sections that must render **nothing** when their data is absent.
 *
 * This is the highest-value component test in the repo. The rule it protects is
 * a regulatory one (CLAUDE.md §3.5), and the way it usually breaks is
 * innocuous: someone adds a heading outside the early return, or a "no offices
 * yet" empty state, and the page starts asserting something it cannot support.
 * Asserting on the *container being empty* catches both.
 */

function expectRendersNothing(ui: React.ReactElement) {
  const { container } = render(ui);
  expect(container).toBeEmptyDOMElement();
}

describe("absent branch", () => {
  it("renders nothing when there are no statistics", () => {
    expectRendersNothing(<StatsBand stats={[]} />);
  });

  it("renders nothing when no people are listed", () => {
    expectRendersNothing(<PeopleRail people={[]} />);
  });

  it("renders nothing when no office is published", () => {
    expectRendersNothing(<Offices offices={[]} />);
  });

  it("renders nothing when there are no articles", () => {
    expectRendersNothing(<InsightRail articles={[]} />);
  });
});

describe("present branch", () => {
  const stats: Stat[] = [
    { id: "s", value: "18", label: "Years in practice", source: "engagement records" },
  ];

  const people: Person[] = [
    {
      id: "p",
      name: "Sample Partner",
      postNominals: "FCA",
      role: "Managing partner",
      practiceAreas: ["Audit"],
      membershipNumber: null,
    },
  ];

  const offices: Office[] = [
    {
      id: "o",
      name: "Kathmandu",
      street: "Sample Marg 1",
      city: "Kathmandu",
      region: null,
      postalCode: null,
      countryCode: "NP",
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      isPrimary: true,
    },
  ];

  it("renders the figure and its label when a statistic exists", () => {
    render(<StatsBand stats={stats} />);
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Years in practice")).toBeInTheDocument();
  });

  it("renders a person by accessible name, with post-nominals", () => {
    render(<PeopleRail people={people} />);
    expect(screen.getByRole("link", { name: "Sample Partner" })).toBeInTheDocument();
    expect(screen.getByText("FCA")).toBeInTheDocument();
  });

  it("renders an office as a real address element", () => {
    render(<Offices offices={offices} />);
    expect(screen.getByRole("heading", { name: /Kathmandu/ })).toBeInTheDocument();
    // Regex, not an exact string: the street and city share one <span> (split
    // by a <br>), so the element's textContent is "Sample Marg 1Kathmandu".
    expect(screen.getByText(/Sample Marg 1/)).toBeInTheDocument();
  });

  it("omits a person's optional fields rather than rendering an empty row", () => {
    render(
      <PeopleRail people={[{ ...people[0]!, postNominals: null, practiceAreas: [] }]} />,
    );
    expect(screen.queryByText("FCA")).not.toBeInTheDocument();
  });
});
