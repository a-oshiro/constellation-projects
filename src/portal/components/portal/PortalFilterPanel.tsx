// The Portal's filter pane — configuration only.
//
// A clone of the filter set the platform's Portal offers: 23 named filters in
// four groups, four numeric ranges, a sort and a Categorize By. The live
// screen's three duplicated pairs are one filter each here — see LABELS. Every control
// and the pane itself are shared primitives from components/ui/FilterBar, so
// nothing about filtering is drawn by hand here.
//
// The filters are declared as data rather than written out one by one: each
// entry says which PortalAsset field it narrows and which group it belongs to,
// and the same table drives both the pane and the matcher below. A filter
// therefore cannot exist in the UI without narrowing anything, or narrow
// something without appearing.

import {
  FilterBar, FilterCategorize, FilterRange, FilterRangeFields, FilterSelect, FilterSort,
  countFacet, fieldsFromFilters,
} from "@portal/components/ui/FilterBar";
import {
  PORTAL_FILTER_OPTIONS, PORTAL_SORT_FIELDS, PORTAL_CATEGORIZE_BY,
  type PortalAsset,
} from "@portal/lib/portal-assets";

/** The asset fields a select can narrow. */
export type SelectField = keyof typeof PORTAL_FILTER_OPTIONS;

export type PortalFilters = Record<SelectField, string[]> & {
  width: Range;
  height: Range;
  components: Range;
  offerCount: Range;
};

export interface Range { min: string; max: string }

const EMPTY_RANGE: Range = { min: "", max: "" };

const SELECT_FIELDS = Object.keys(PORTAL_FILTER_OPTIONS) as SelectField[];

/** Label and group per select — the order here is the order in the pane. */
const GROUPS: { group: string; fields: SelectField[] }[] = [
  { group: "Date & Type",  fields: ["fileType", "entityType"] },
  { group: "Organization", fields: ["tags", "entityStatus", "brands", "accounts"] },
  { group: "Dimensions",   fields: ["dimensions", "shape"] },
  {
    group: "Metadata",
    fields: [
      "assetTypes", "collection", "fluencyReady", "holidays", "make", "model",
      "offerTypes", "platform", "season", "textColor", "theme", "trim",
      "usageYears", "vehicleCondition", "year",
    ],
  },
];

// The platform's Portal lists both "Asset type" and "Asset Types", both
// "Brand" and "Brands", both "Offer type" and "Offer Types". Each pair is one
// concept, so each is one filter here — over the set, which always contains
// the asset's primary value.
export const PORTAL_FILTER_LABELS: Record<SelectField, string> = {
  fileType: "File Type", entityType: "Entity Type", tags: "Tags",
  entityStatus: "Entity Status", brands: "Brands", accounts: "Accounts",
  dimensions: "Dimensions", shape: "Shape", assetTypes: "Asset Types",
  collection: "Collection", fluencyReady: "Fluency Ready", holidays: "Holidays",
  make: "Make", model: "Model", offerTypes: "Offer Types",
  platform: "Platform", season: "Season", textColor: "Text Color",
  theme: "Theme", trim: "Trim", usageYears: "Usage Years",
  vehicleCondition: "Vehicle condition", year: "Year",
};

export const EMPTY_PORTAL_FILTERS: PortalFilters = {
  ...(Object.fromEntries(SELECT_FIELDS.map((f) => [f, [] as string[]])) as unknown as Record<SelectField, string[]>),
  width: EMPTY_RANGE, height: EMPTY_RANGE,
  components: EMPTY_RANGE, offerCount: EMPTY_RANGE,
};

const RANGES: { key: "width" | "height" | "components" | "offerCount"; label: string; field: keyof PortalAsset }[] = [
  { key: "width",      label: "Width",      field: "width"          },
  { key: "height",     label: "Height",     field: "height"         },
  { key: "components", label: "Components", field: "componentCount" },
  { key: "offerCount", label: "Offers",     field: "offerCount"     },
];

// ─── Reading a filter's value off an asset ───────────────────────────────────
// Sort and Categorize By name a filter rather than pick one of its values, so
// both need to read that filter off an asset. One table for both, keyed by the
// label the controls show, because a field that sorts by one thing and groups
// by another is the same defect as a count that disagrees with its rows.

const READ_BY_LABEL: Record<string, (a: PortalAsset) => string | string[] | number | undefined> = {
  ...Object.fromEntries(SELECT_FIELDS.map((f) => [
    PORTAL_FILTER_LABELS[f],
    (a: PortalAsset) => {
      const v = a[f as keyof PortalAsset];
      return Array.isArray(v) ? (v as string[]) : v === null || v === undefined ? undefined : String(v);
    },
  ])),
  ...Object.fromEntries(RANGES.map(({ label, field }) => [
    label, (a: PortalAsset) => Number(a[field]),
  ])),
  // Not a filter, but the Portal has always grouped by it.
  Folder: (a: PortalAsset) => a.folder,
};

/** What the filter called `label` reads off this asset, or undefined when the
 *  label names no filter at all. */
export function portalValueOf(
  asset: PortalAsset, label: string,
): string | string[] | number | undefined {
  return READ_BY_LABEL[label]?.(asset);
}

/** Whether a field can be sorted or grouped at all — everything in the table
 *  above, which is every filter plus Folder. */
export function isPortalField(label: string) {
  return label in READ_BY_LABEL;
}

/** Two assets ordered by that field. Numbers compare as numbers, everything
 *  else as text with digits read as digits, so "1080 x 1350" sorts after
 *  "1080 x 1080" and before "1280 x 320".
 *
 *  A row missing the value sorts last in EITHER direction, which is why the
 *  direction is applied here and not by the caller: callers used to multiply
 *  the result by -1 for descending, and that flipped the blanks too — sorting
 *  by Holidays, descending, opened on the 210 assets that have none. */
export function comparePortalBy(a: PortalAsset, b: PortalAsset, label: string, asc = true): number {
  const dir = asc ? 1 : -1;
  const read = READ_BY_LABEL[label];
  if (!read) return 0;
  const va = read(a);
  const vb = read(b);
  const fa = Array.isArray(va) ? va[0] : va;
  const fb = Array.isArray(vb) ? vb[0] : vb;
  if (fa === undefined || fa === "") return fb === undefined || fb === "" ? 0 : 1;
  if (fb === undefined || fb === "") return -1;
  if (typeof fa === "number" && typeof fb === "number") return dir * (fa - fb);
  return dir * String(fa).localeCompare(String(fb), undefined, { numeric: true });
}

/** The span each numeric filter actually covers, so its slider has a scale.
 *  Read off the library rather than declared, because a width of 0..3000 means
 *  nothing if every asset in hand is between 600 and 1080. */
export function derivePortalRangeBounds(
  assets: readonly PortalAsset[],
): Record<string, { min: number; max: number }> {
  const out: Record<string, { min: number; max: number }> = {};
  for (const { key, field } of RANGES) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const a of assets) {
      const n = Number(a[field]);
      if (!Number.isFinite(n)) continue;
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
    if (lo <= hi) out[key] = { min: Math.floor(lo), max: Math.ceil(hi) };
  }
  return out;
}

/** The distinct values each filter can offer, read off the library in hand —
 *  the generated one or whatever the platform returned. */
export function derivePortalOptions(
  assets: readonly PortalAsset[],
): Record<SelectField, string[]> {
  const out = Object.fromEntries(
    SELECT_FIELDS.map((f) => [f, new Set<string>()]),
  ) as unknown as Record<SelectField, Set<string>>;

  for (const asset of assets) {
    for (const field of SELECT_FIELDS) {
      const v = asset[field as keyof PortalAsset];
      if (Array.isArray(v)) v.forEach((x) => x && out[field].add(String(x)));
      else if (v !== null && v !== undefined && v !== "") out[field].add(String(v));
    }
  }

  return Object.fromEntries(
    SELECT_FIELDS.map((f) => [
      f,
      [...out[f]].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    ]),
  ) as unknown as Record<SelectField, string[]>;
}

/** Per-option counts for every filter, each one counted against the others.
 *
 *  One pass per filter — 23 walks of the library — because a facet's own
 *  selection has to be lifted before its options are counted, or picking BMW
 *  would leave every other make reading (0). Memoise at the call site. */
export function derivePortalCounts(
  assets: readonly PortalAsset[],
  filters: PortalFilters,
  search: string,
  options: Record<SelectField, readonly string[]>,
): Record<SelectField, Record<string, number>> {
  const out = {} as Record<SelectField, Record<string, number>>;
  for (const field of SELECT_FIELDS) {
    const others = { ...filters, [field]: [] as string[] };
    const subset = assets.filter((a) => matchesPortalFilters(a, others, search));
    out[field] = countFacet(subset, options[field] ?? [], (a) => {
      const v = a[field as keyof PortalAsset];
      return Array.isArray(v) ? (v as string[]) : v === undefined ? undefined : String(v);
    });
  }
  return out;
}

export function hasAnyPortalFilter(f: PortalFilters, search = "") {
  if (search.trim()) return true;
  if (SELECT_FIELDS.some((k) => f[k].length > 0)) return true;
  return RANGES.some(({ key }) => f[key].min !== "" || f[key].max !== "");
}

// ─── Matching ────────────────────────────────────────────────────────────────

function withinRange(value: number, range: Range) {
  if (range.min !== "" && value < Number(range.min)) return false;
  if (range.max !== "" && value > Number(range.max)) return false;
  return true;
}

/** Everything the pane's controls mean, applied to one asset. */
export function matchesPortalFilters(
  asset: PortalAsset, filters: PortalFilters, search: string,
): boolean {
  const term = search.trim().toLowerCase();
  if (term) {
    const haystack = `${asset.name} ${asset.folder} ${asset.collection} ${asset.brand} ${asset.make} ${asset.model} ${asset.tags.join(" ")}`;
    if (!haystack.toLowerCase().includes(term)) return false;
  }

  for (const field of SELECT_FIELDS) {
    const picked = filters[field];
    if (!picked.length) continue;
    const value = asset[field as keyof PortalAsset];
    // An array field matches when any of its values was picked; a scalar when
    // it is one of them.
    const ok = Array.isArray(value)
      ? value.some((v) => picked.includes(String(v)))
      : picked.includes(String(value));
    if (!ok) return false;
  }

  for (const { key, field } of RANGES) {
    if (!withinRange(Number(asset[field]), filters[key])) return false;
  }

  return true;
}

// ─── The pane ────────────────────────────────────────────────────────────────

/** A filter a screen adds over what an asset carries — a project's "Alert",
 *  the alert that produced each asset. Drawn with the same control as every
 *  other filter and offered to Sort and Group by the same way; the screen
 *  owns its values and applies it. */
export interface ExtraPortalFilter {
  id: string;
  label: string;
  group: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  counts?: Record<string, number>;
}

export function PortalFilterPanel({
  filters, options, counts, bounds, sortField, sortAsc, categorizeBy, pinned, search,
  onFilters, onSortField, onToggleSortDir, onCategorizeBy, onClear,
  onPinnedChange, extra = [],
}: {
  filters: PortalFilters;
  /** Numeric spans for the sliders — see derivePortalRangeBounds. */
  bounds?: Record<string, { min: number; max: number }>;
  /** Every value each filter can offer, derived from the loaded library. */
  options: Record<SelectField, readonly string[]>;
  /** What each of those values would leave standing — see derivePortalCounts. */
  counts?: Record<SelectField, Record<string, number>>;
  search: string;
  sortField: string;
  sortAsc: boolean;
  categorizeBy: string;
  pinned?: string[];
  onFilters: (next: PortalFilters) => void;
  onSortField: (next: string) => void;
  onToggleSortDir: () => void;
  onCategorizeBy: (next: string) => void;
  onClear: () => void;
  onPinnedChange?: (next: string[]) => void;
  /** The screen's own filters, leading the row. */
  extra?: readonly ExtraPortalFilter[];
}) {
  /** A filter with nothing to offer is not shown: with the live library some of
   *  the platform's vocabularies come back empty, and an empty select is worse
   *  than an absent one.
   *
   *  Unless it is narrowing. Vocabularies are derived from the folder in front
   *  of you, so changing folder can leave a filter with a value and no options
   *  — and hiding it then removed the only sign that anything was filtering at
   *  all. The grid went empty with nothing on screen to explain it and nothing
   *  to undo. A filter that is doing something is always shown, whatever it has
   *  left to offer. */
  const has = (field: SelectField) =>
    (options[field]?.length ?? 0) > 0 || filters[field].length > 0;

  const setSelect = (key: SelectField) => (next: string[]) =>
    onFilters({ ...filters, [key]: next });
  const setRange = (key: "width" | "height" | "components" | "offerCount") => (next: Range) =>
    onFilters({ ...filters, [key]: next });

  /** The pane and the bar read the same table the matcher does. */
  const extraDescriptors = extra
    .filter((x) => x.options.length > 0 || x.value.length > 0)
    .map((x) => ({
      id: x.id,
      label: x.label,
      group: x.group,
      options: x.options,
      value: x.value,
      onChange: x.onChange,
      counts: x.counts,
      active: x.value.length > 0,
      node: <FilterSelect label={x.label} options={x.options} value={x.value} onChange={x.onChange} counts={x.counts} />,
    }));
  const extraActive = extra.some((x) => x.value.length > 0);

  const descriptors = [...extraDescriptors, ...GROUPS.flatMap(({ group, fields }) => [
    ...fields.filter(has).map((field) => ({
      id: field,
      label: PORTAL_FILTER_LABELS[field],
      group,
      options: options[field],
      value: filters[field],
      onChange: setSelect(field),
      counts: counts?.[field],
      active: filters[field].length > 0,
      node: (
        <FilterSelect
          label={PORTAL_FILTER_LABELS[field]}
          options={options[field]}
          value={filters[field]}
          onChange={setSelect(field)}
          counts={counts?.[field]}
        />
      ),
    })),
    // The numeric pairs belong with the sizes they bound, and want the width
    // a pane gives them — never pinned into the row.
    // A range wears a select box now, so it is the same shape as every other
    // control and can ride in the row with them.
    ...RANGES.filter((r) => (group === "Dimensions"
      ? r.key !== "offerCount"
      : group === "Metadata" && r.key === "offerCount")
    ).map(({ key, label }) => ({
      id: key,
      label,
      group,
      active: filters[key].min !== "" || filters[key].max !== "",
      node: (
        <FilterRange
          label={label}
          value={filters[key]}
          onChange={setRange(key)}
          bounds={bounds?.[key]}
        />
      ),
      panel: (
        <FilterRangeFields
          label={label}
          value={filters[key]}
          onChange={setRange(key)}
          bounds={bounds?.[key]}
        />
      ),
    })),
  ])];

  return (
    <FilterBar
      filters={descriptors}
      pinned={pinned}
      onPinnedChange={onPinnedChange}
      onClear={hasAnyPortalFilter(filters, search) || extraActive ? onClear : undefined}
      right={
        <>
          <FilterSort
            field={sortField}
            fields={fieldsFromFilters(descriptors, PORTAL_SORT_FIELDS)}
            asc={sortAsc}
            onField={onSortField}
            onToggleDir={onToggleSortDir}
          />
          <FilterCategorize
            value={categorizeBy}
            fields={fieldsFromFilters(descriptors, PORTAL_CATEGORIZE_BY)}
            onChange={onCategorizeBy}
          />
        </>
      }
    />
  );
}
