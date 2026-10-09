// The pure rules behind the filter row. Each block names the section of
// HANDOFF-filters.md that describes the rule; most of them were shipped wrong
// once, and the test is what keeps them from coming back.

import { describe, expect, test } from "vitest";
import {
  byAvailability, countFacet, fieldsFromFilters, fitToRow, groupByValue, withPicked,
  type FilterDescriptor,
} from "@portal/components/ui/FilterBar";

describe("countFacet — how many each option would leave (§5.4)", () => {
  const items = [
    { make: "BMW", tags: ["sale", "sale", "new"] },
    { make: "BMW", tags: ["new"] },
    { make: "Audi", tags: [] },
    { make: undefined, tags: ["sale"] },
  ];

  test("every option is listed, including the ones nothing carries", () => {
    expect(countFacet(items, ["Audi", "BMW", "Kia"], (i) => i.make)).toEqual({ Audi: 1, BMW: 2, Kia: 0 });
  });

  test("an item with a value twice is still one result", () => {
    expect(countFacet(items, ["sale", "new"], (i) => i.tags)).toEqual({ sale: 2, new: 2 });
  });

  test("values the filter does not offer are not counted, and a missing value is skipped", () => {
    expect(countFacet(items, ["BMW"], (i) => i.make)).toEqual({ BMW: 2 });
  });
});

describe("byAvailability — reachable values above dead ones (§5.14)", () => {
  test("live values first, then dead ones, each run alphabetical with digits read as digits", () => {
    const counts = { "Model 10": 3, "Model 2": 1, Zeta: 0, Alpha: 0, Beta: 5 };
    expect(byAvailability(Object.keys(counts), counts)).toEqual(["Beta", "Model 2", "Model 10", "Alpha", "Zeta"]);
  });

  test("without counts the caller's own order stands", () => {
    const dateRanges = ["Last 24 hours", "Last 7 days", "Last 30 days"];
    expect(byAvailability(dateRanges)).toEqual(dateRanges);
  });
});

describe("withPicked — a pick outliving its options stays removable (§5.5)", () => {
  test("a picked value the screen no longer offers is added back, after the rest", () => {
    expect(withPicked(["A", "B"], ["B", "Z"])).toEqual(["A", "B", "Z"]);
  });

  test("nothing missing, nothing added", () => {
    const options = ["A", "B"];
    expect(withPicked(options, ["A"])).toBe(options);
  });
});

describe("fitToRow — the row fits the window (§5.11, §5.12)", () => {
  const f = (id: string, w: number, active = false) => ({ id, label: id, w, active });
  const widthOf = (x: { w: number }) => x.w;
  const ids = (list: { id: string }[]) => list.map((x) => x.id);

  test("everything fits: nothing spills", () => {
    const row = [f("a", 100), f("b", 100)];
    expect(ids(fitToRow(row, widthOf, 208).shown)).toEqual(["a", "b"]); // 100 + 8 gap + 100
  });

  test("drops from the end, gaps included", () => {
    const row = [f("a", 100), f("b", 100)];
    const { shown, spilled } = fitToRow(row, widthOf, 207);
    expect(ids(shown)).toEqual(["a"]);
    expect(ids(spilled)).toEqual(["b"]);
  });

  test("never skips a wide control for a narrower one behind it — a control that hops places is worse than one that leaves", () => {
    const row = [f("a", 100), f("wide", 300), f("narrow", 50)];
    // a + narrow (158) would fit in 200, but the row keeps its order.
    expect(ids(fitToRow(row, widthOf, 200).shown)).toEqual(["a"]);
  });

  test("an idle filter leaves before an active one", () => {
    const row = [f("projects", 100), f("owner", 100, true), f("recovery", 100)];
    expect(ids(fitToRow(row, widthOf, 208).shown)).toEqual(["projects", "owner"]);
    expect(ids(fitToRow(row, widthOf, 100).shown)).toEqual(["owner"]);
  });

  test("an active filter leaves only when every idle one has gone", () => {
    const row = [f("a", 100, true), f("b", 100, true), f("c", 100)];
    expect(ids(fitToRow(row, widthOf, 100).shown)).toEqual(["a"]);
  });

  test("an unmeasured control is estimated from its label", () => {
    // label.length * 7 + 46 → "Year" = 74
    const row = [{ id: "year", label: "Year" }];
    expect(fitToRow(row, () => undefined, 74).shown).toHaveLength(1);
    expect(fitToRow(row, () => undefined, 73).shown).toHaveLength(0);
  });

  test("spilled keeps the original order", () => {
    const row = [f("a", 100), f("b", 100, true), f("c", 100), f("d", 100)];
    expect(ids(fitToRow(row, widthOf, 100).spilled)).toEqual(["a", "c", "d"]);
  });
});

describe("fieldsFromFilters — the list Sort and Group by offer is derived (§5.18)", () => {
  const d = (label: string): FilterDescriptor => ({ id: label, label, node: null });

  test("the screen's own fields first, then every filter in bar order", () => {
    expect(fieldsFromFilters([d("Make"), d("Model")], ["Name"])).toEqual(["Name", "Make", "Model"]);
  });

  test("dedupe is case-insensitive and keeps the first spelling", () => {
    expect(fieldsFromFilters([d("brand"), d("Year")], ["Brand"])).toEqual(["Brand", "Year"]);
  });

  test("a blank label is not a field", () => {
    expect(fieldsFromFilters([d("  "), d("Year")])).toEqual(["Year"]);
  });
});

describe("groupByValue — sections (HANDOFF-grouping.md)", () => {
  const rows = [
    { id: 1, tags: ["b", "a"] },
    { id: 2, tags: ["a"] },
    { id: 3, tags: [] as string[] },
    { id: 4, tags: ["10"] },
    { id: 5, tags: ["2"] },
  ];
  const sections = groupByValue(rows, (r) => r.tags);

  test("a row with several values lands under its FIRST one only", () => {
    expect(sections.find((s) => s.label === "b")?.items.map((r) => r.id)).toEqual([1]);
    expect(sections.find((s) => s.label === "a")?.items.map((r) => r.id)).toEqual([2]);
  });

  test("every row is in exactly one section, so the sections add up to the total", () => {
    expect(sections.reduce((n, s) => n + s.items.length, 0)).toBe(rows.length);
  });

  test("sections sort with digits read as digits, and rows with no value trail under their own heading", () => {
    expect(sections.map((s) => s.label)).toEqual(["2", "10", "a", "b", "Not set"]);
    expect(groupByValue(rows, (r) => r.tags, "No tags").at(-1)?.label).toBe("No tags");
  });
});
