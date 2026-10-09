// Shareable Portal view state, encoded in the query string.
//
// Copying the address bar hands someone else the folder you are standing in and
// every filter you have set; the assets themselves are re-read, so they see the
// same view against whatever is current. A bookmark is the same mechanism
// pointed at yourself.
//
// Follows lib/studio-url-state.ts, which solved this for the Studio: only
// non-defaults are written, so a link stays readable, and a link that omits
// something means "default" rather than "whatever the recipient last had".
//
// Multi-value filters are written as REPEATED keys — `?brands=Audi&brands=BMW`
// — rather than one comma-joined key. A folder or a brand may contain a comma,
// and repeating the key sidesteps the escaping question entirely instead of
// inventing a separator nothing is allowed to contain. [The platform's own
// Portal appears to comma-join; if the real implementation must match it, that
// is the one line to change.]

import { EMPTY_PORTAL_FILTERS, type PortalFilters, type Range } from "@portal/components/portal/PortalFilterPanel";

/** Structural read side of both `URLSearchParams` and Next's read-only variant. */
type Params = { get(key: string): string | null; getAll(key: string): string[] };

/** Keys that are not filters. Their own names, so none can collide with a
 *  filter key if one is ever added — and `sortBy`/`categorizeBy` are spelled
 *  the way the platform's own Portal spells them. */
const FOLDER_KEY = "folder";
const SORT_KEY = "sortBy";
const ASC_KEY = "asc";
const GROUP_KEY = "categorizeBy";

/** What the Portal opens as. Only a departure from these is written, so a link
 *  stays readable and an omitted key means default rather than "whatever the
 *  recipient last had". */
export const PORTAL_VIEW_DEFAULTS = {
  sort: "Updated At",
  /** Newest first — the arrow points down when the Portal opens. */
  sortAsc: false,
  group: "None",
} as const;

/** Which keys are selects and which are numeric ranges, read off the empty
 *  filter set rather than declared again — a filter added to PortalFilters is
 *  shareable the moment it exists, with nothing to remember here. */
function fieldKinds() {
  const selects: string[] = [];
  const ranges: string[] = [];
  for (const [key, value] of Object.entries(EMPTY_PORTAL_FILTERS)) {
    if (Array.isArray(value)) selects.push(key);
    else ranges.push(key);
  }
  return { selects, ranges };
}

/** "600-1080", "600-", "-1080". An empty end is no bound on that side, which is
 *  what the range control itself means by a blank box. */
function parseRange(raw: string | null): Range | null {
  if (raw === null) return null;
  const [min = "", max = ""] = raw.split("-", 2);
  const clean = (v: string) => (/^\d+$/.test(v) ? v : "");
  const range = { min: clean(min), max: clean(max) };
  return range.min === "" && range.max === "" ? null : range;
}

function formatRange(range: Range): string | null {
  if (range.min === "" && range.max === "") return null;
  return `${range.min}-${range.max}`;
}

export interface PortalUrlState {
  /** Whether the URL carried any Portal param at all. A link that names none is
   *  not a link to an empty Portal — it is someone opening /portal. */
  present: boolean;
  folder: string | null;
  filters: PortalFilters;
  sort: string;
  sortAsc: boolean;
  group: string;
}

export function readPortalUrl(params: Params): PortalUrlState {
  const { selects, ranges } = fieldKinds();
  const filters = { ...EMPTY_PORTAL_FILTERS } as PortalFilters;
  let present = params.get(FOLDER_KEY) !== null;

  for (const key of selects) {
    const values = params.getAll(key).filter(Boolean);
    if (!values.length) continue;
    (filters as unknown as Record<string, string[]>)[key] = values;
    present = true;
  }
  for (const key of ranges) {
    const range = parseRange(params.get(key));
    if (!range) continue;
    (filters as unknown as Record<string, Range>)[key] = range;
    present = true;
  }

  const sort = params.get(SORT_KEY);
  const asc = params.get(ASC_KEY);
  const group = params.get(GROUP_KEY);
  if (sort !== null || asc !== null || group !== null) present = true;

  return {
    present,
    folder: params.get(FOLDER_KEY) || null,
    filters,
    sort: sort || PORTAL_VIEW_DEFAULTS.sort,
    sortAsc: asc === null ? PORTAL_VIEW_DEFAULTS.sortAsc : asc === "1" || asc === "true",
    group: group || PORTAL_VIEW_DEFAULTS.group,
  };
}

export function portalUrlQuery(state: {
  folder: string | null;
  filters: PortalFilters;
  sort: string;
  sortAsc: boolean;
  group: string;
}): string {
  const { selects, ranges } = fieldKinds();
  const p = new URLSearchParams();

  if (state.folder) p.set(FOLDER_KEY, state.folder);
  for (const key of selects) {
    for (const value of (state.filters as unknown as Record<string, string[]>)[key] ?? []) {
      p.append(key, value);
    }
  }
  for (const key of ranges) {
    const formatted = formatRange((state.filters as unknown as Record<string, Range>)[key]);
    if (formatted) p.set(key, formatted);
  }

  // The order and the grouping are as much "the view" as the filters are: a
  // link that restored what is listed but not how it is arranged would hand
  // someone half of what the sender was looking at.
  if (state.sort !== PORTAL_VIEW_DEFAULTS.sort) p.set(SORT_KEY, state.sort);
  if (state.sortAsc !== PORTAL_VIEW_DEFAULTS.sortAsc) p.set(ASC_KEY, state.sortAsc ? "1" : "0");
  if (state.group !== PORTAL_VIEW_DEFAULTS.group) p.set(GROUP_KEY, state.group);

  return p.toString();
}
