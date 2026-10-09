// The Portal's filters, run against the prototype's own library (326 assets).
// Sections refer to HANDOFF-filters.md.

import { describe, expect, test } from "vitest";
import { PORTAL_ASSETS, type PortalAsset } from "@portal/lib/portal-assets";
import {
  EMPTY_PORTAL_FILTERS, comparePortalBy, derivePortalCounts, derivePortalOptions,
  hasAnyPortalFilter, matchesPortalFilters, portalValueOf, type PortalFilters, type SelectField,
} from "@portal/components/portal/PortalFilterPanel";

const OPTIONS = derivePortalOptions(PORTAL_ASSETS);

/** Every count in the pane against the assets clicking that option returns. */
function expectCountsMatchRows(filters: PortalFilters, search = "") {
  const counts = derivePortalCounts(PORTAL_ASSETS, filters, search, OPTIONS);
  for (const field of Object.keys(counts) as SelectField[]) {
    for (const [option, n] of Object.entries(counts[field])) {
      const picked = { ...filters, [field]: [option] };
      const returned = PORTAL_ASSETS.filter((a) => matchesPortalFilters(a, picked, search)).length;
      expect({ field, option, count: n }).toEqual({ field, option, count: returned });
    }
  }
}

/** The first value of a field that some asset carries. */
const firstOption = (field: SelectField) => OPTIONS[field][0];

describe("faceted counts — the number beside an option is what clicking it returns (§5.4)", () => {
  test("with nothing filtering", () => {
    expectCountsMatchRows(EMPTY_PORTAL_FILTERS);
  });

  test("with two filters and a range on", () => {
    expectCountsMatchRows({
      ...EMPTY_PORTAL_FILTERS,
      make: [firstOption("make")],
      fileType: [firstOption("fileType")],
      width: { min: "600", max: "" },
    });
  });

  test("with a search term on", () => {
    expectCountsMatchRows(EMPTY_PORTAL_FILTERS, "a");
  });

  test("a filter is not counted against itself: picking one make leaves the others their counts", () => {
    const make = firstOption("make");
    const counts = derivePortalCounts(PORTAL_ASSETS, { ...EMPTY_PORTAL_FILTERS, make: [make] }, "", OPTIONS);
    const unfiltered = derivePortalCounts(PORTAL_ASSETS, EMPTY_PORTAL_FILTERS, "", OPTIONS);
    expect(counts.make).toEqual(unfiltered.make);
  });
});

describe("ranges — an open end is no bound (§5.16)", () => {
  test("an empty range matches everything", () => {
    expect(PORTAL_ASSETS.every((a) => matchesPortalFilters(a, EMPTY_PORTAL_FILTERS, ""))).toBe(true);
  });

  test("each end bounds on its own side only", () => {
    const min = PORTAL_ASSETS.filter((a) =>
      matchesPortalFilters(a, { ...EMPTY_PORTAL_FILTERS, width: { min: "1000", max: "" } }, ""));
    expect(min.length).toBeGreaterThan(0);
    expect(min.every((a) => a.width >= 1000)).toBe(true);
    const max = PORTAL_ASSETS.filter((a) =>
      matchesPortalFilters(a, { ...EMPTY_PORTAL_FILTERS, width: { min: "", max: "1000" } }, ""));
    expect(max.every((a) => a.width <= 1000)).toBe(true);
  });
});

describe("Clear Filters shows only while something is filtering (§5.9)", () => {
  test("nothing on, no link", () => {
    expect(hasAnyPortalFilter(EMPTY_PORTAL_FILTERS)).toBe(false);
  });
  test("the search alone counts", () => {
    expect(hasAnyPortalFilter(EMPTY_PORTAL_FILTERS, "audi")).toBe(true);
  });
  test("one end of a range counts", () => {
    expect(hasAnyPortalFilter({ ...EMPTY_PORTAL_FILTERS, height: { min: "", max: "500" } })).toBe(true);
  });
});

describe("comparePortalBy — sort (§5.18)", () => {
  const sortBy = (label: string, asc: boolean) =>
    [...PORTAL_ASSETS].sort((a, b) => comparePortalBy(a, b, label, asc));
  const isBlank = (a: PortalAsset, label: string) => {
    const v = portalValueOf(a, label);
    const first = Array.isArray(v) ? v[0] : v;
    return first === undefined || first === "";
  };

  test.each([true, false])("a row missing the value sorts last, asc = %s", (asc) => {
    // Holidays: 210 of the 326 assets have none. Descending used to open on them.
    const sorted = sortBy("Holidays", asc);
    const firstBlank = sorted.findIndex((a) => isBlank(a, "Holidays"));
    expect(firstBlank).toBeGreaterThan(0);
    expect(sorted.slice(firstBlank).every((a) => isBlank(a, "Holidays"))).toBe(true);
  });

  test("descending is ascending reversed, among the rows that have a value", () => {
    const value = (a: PortalAsset) => String(portalValueOf(a, "Year"));
    const asc = sortBy("Year", true).map(value);
    const desc = sortBy("Year", false).map(value);
    expect(desc).toEqual([...asc].reverse());
  });

  test("text compares with digits read as digits", () => {
    const a = { ...PORTAL_ASSETS[0], dimensions: "1080 x 1350" };
    const b = { ...PORTAL_ASSETS[0], dimensions: "1280 x 320" };
    const c = { ...PORTAL_ASSETS[0], dimensions: "1080 x 1080" };
    const sorted = [a, b, c].sort((x, y) => comparePortalBy(x, y, "Dimensions"));
    expect(sorted.map((x) => x.dimensions)).toEqual(["1080 x 1080", "1080 x 1350", "1280 x 320"]);
  });

  test("a label that names no field leaves the order to the caller", () => {
    expect(comparePortalBy(PORTAL_ASSETS[0], PORTAL_ASSETS[1], "Not a field")).toBe(0);
  });
});
