// A view is a link: the folder, the filters, the sort, the grouping and now the
// view all survive a round trip through the query string, and a default is
// never written. HANDOFF-portal.md §8.

import { describe, expect, test } from "vitest";
import { portalUrlQuery, readPortalUrl, PORTAL_VIEW_DEFAULTS } from "@portal/lib/portal-url-state";
import { EMPTY_PORTAL_FILTERS } from "@portal/components/portal/PortalFilterPanel";

const read = (q: string) => readPortalUrl(new URLSearchParams(q));
const base = {
  folder: null, filters: EMPTY_PORTAL_FILTERS,
  sort: PORTAL_VIEW_DEFAULTS.sort, sortAsc: PORTAL_VIEW_DEFAULTS.sortAsc,
  group: PORTAL_VIEW_DEFAULTS.group, view: PORTAL_VIEW_DEFAULTS.view,
};

describe("the view in the URL", () => {
  test("defaults write nothing", () => {
    expect(portalUrlQuery(base)).toBe("");
  });

  test("the table is written as view=table and read back", () => {
    const q = portalUrlQuery({ ...base, view: "list" });
    expect(q).toBe("view=table");
    expect(read(q).view).toBe("list");
    expect(read(q).present).toBe(true);
  });

  test("an unknown value opens the cards", () => {
    expect(read("view=mosaic").view).toBe("grid");
    expect(read("").view).toBe("grid");
  });

  test("it travels with the rest", () => {
    const q = portalUrlQuery({
      ...base, folder: "BMW Concord", sort: "Name", sortAsc: true, group: "Brands", view: "list",
      filters: { ...EMPTY_PORTAL_FILTERS, fileType: ["JPEG"], width: { min: "600", max: "" } },
    });
    const back = read(q);
    expect(back).toMatchObject({ folder: "BMW Concord", sort: "Name", sortAsc: true, group: "Brands", view: "list" });
    expect(back.filters.fileType).toEqual(["JPEG"]);
    expect(back.filters.width).toEqual({ min: "600", max: "" });
  });
});

describe("the selection in the URL", () => {
  test("written as repeated keys and read back", () => {
    const q = portalUrlQuery({ ...base, selected: ["a1", "b,2"] });
    expect(q).toBe("selected=a1&selected=b%2C2");
    expect(read(q).selected).toEqual(["a1", "b,2"]);
    expect(read(q).present).toBe(true);
  });

  test("none is nothing written, and an empty list read", () => {
    expect(portalUrlQuery({ ...base, selected: [] })).toBe("");
    expect(read("").selected).toEqual([]);
  });
});
