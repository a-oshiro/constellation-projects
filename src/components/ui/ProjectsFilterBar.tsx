// The Projects page's filter row — configuration only.
//
// Same shape as the Portal's PortalFilterPanel and the same primitives from
// the Portal's FilterBar: the filters are declared as data, and one table
// drives both the controls and the matcher, so a filter cannot appear without
// narrowing anything or narrow something without appearing.

import { FilterBar, FilterSelect, countFacet, usePinnedFilters } from '@portal/components/ui/FilterBar';
import type { Project } from '../../data/projects';

export type ProjectFilterKey = 'status' | 'owner' | 'lastUpdated' | 'evergreen' | 'brand';

export type ProjectFilters = Record<ProjectFilterKey, string[]>;

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  status: [], owner: [], lastUpdated: [], evergreen: [], brand: [],
};

const KEYS = Object.keys(EMPTY_PROJECT_FILTERS) as ProjectFilterKey[];

const LABELS: Record<ProjectFilterKey, string> = {
  status: 'Status',
  owner: 'Owner',
  lastUpdated: 'Last Updated',
  evergreen: 'Evergreen',
  brand: 'Brand',
};

/** In the order a person reads them — newest first — not alphabetically. */
export const LAST_UPDATED_BUCKETS = ['Today', 'Yesterday', 'Past week', 'Past 2 weeks', 'Older'] as const;

/** Projects carry "how long ago" as text ("Just now", "3 hours ago",
 *  "2 days ago", "1 week ago"), so the filter reads that text into a bucket.
 *  Anything it does not recognise is "Older" rather than dropped, so no project
 *  can become unreachable by a filter. */
export function lastUpdatedBucket(text: string): (typeof LAST_UPDATED_BUCKETS)[number] {
  const t = text.trim().toLowerCase();
  if (t === 'just now' || /\b(second|minute|hour)s?\b/.test(t)) return 'Today';
  if (t === 'yesterday') return 'Yesterday';
  const match = /^(\d+)\s*(day|week)s?\b/.exec(t);
  if (!match) return 'Older';
  const n = Number(match[1]);
  if (match[2] === 'day') return n <= 1 ? 'Yesterday' : n < 7 ? 'Past week' : 'Past 2 weeks';
  return n <= 2 ? 'Past 2 weeks' : 'Older';
}

/** What each filter reads off a project. `status` needs the board's column
 *  label, which the page owns, so it is passed in. */
function valueOf(project: Project, key: ProjectFilterKey, statusOf: (p: Project) => string): string {
  switch (key) {
    case 'status': return statusOf(project);
    case 'owner': return project.creator;
    case 'lastUpdated': return lastUpdatedBucket(project.lastUpdated);
    case 'evergreen': return project.isEvergreen ? 'Yes' : 'No';
    case 'brand': return project.brandTag;
  }
}

export function hasAnyProjectFilter(f: ProjectFilters) {
  return KEYS.some((k) => f[k].length > 0);
}

export function matchesProjectFilters(
  project: Project, filters: ProjectFilters, statusOf: (p: Project) => string,
  skip?: ProjectFilterKey,
): boolean {
  return KEYS.every((k) => k === skip || !filters[k].length || filters[k].includes(valueOf(project, k, statusOf)));
}

/** The values each filter can offer, read off the projects in hand. Status and
 *  Last Updated keep their natural order; the rest are alphabetical. */
export function deriveProjectOptions(
  projects: readonly Project[], statusOrder: readonly string[], statusOf: (p: Project) => string,
): ProjectFilters {
  const seen = (k: ProjectFilterKey) => new Set(projects.map((p) => valueOf(p, k, statusOf)));
  const alpha = (k: ProjectFilterKey) =>
    [...seen(k)].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const inOrder = (k: ProjectFilterKey, order: readonly string[]) => order.filter((o) => seen(k).has(o));
  return {
    status: inOrder('status', statusOrder),
    owner: alpha('owner'),
    lastUpdated: inOrder('lastUpdated', LAST_UPDATED_BUCKETS),
    evergreen: inOrder('evergreen', ['Yes', 'No']),
    brand: alpha('brand'),
  };
}

export function ProjectsFilterBar({
  projects, filters, onFilters, options, statusOf, leading, right,
}: {
  /** The projects before the filters apply — what the option counts are read from. */
  projects: readonly Project[];
  filters: ProjectFilters;
  onFilters: (next: ProjectFilters) => void;
  options: ProjectFilters;
  statusOf: (p: Project) => string;
  leading?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [pinned, setPinned] = usePinnedFilters(
    'constellation:projects-pinned-filters:v1',
    KEYS,
  );

  const descriptors = KEYS
    // A filter with nothing to offer is not shown — unless it is narrowing.
    .filter((k) => options[k].length > 0 || filters[k].length > 0)
    .map((k) => {
      // Counted against the OTHER filters, so picking one status does not
      // drop the rest to zero.
      const subset = projects.filter((p) => matchesProjectFilters(p, filters, statusOf, k));
      const counts = countFacet(subset, options[k], (p) => valueOf(p, k, statusOf));
      const keepOrder = k === 'status' || k === 'lastUpdated';
      const onChange = (next: string[]) => onFilters({ ...filters, [k]: next });
      return {
        id: k,
        label: LABELS[k],
        group: 'Project',
        options: options[k],
        value: filters[k],
        onChange,
        counts,
        keepOrder,
        active: filters[k].length > 0,
        node: <FilterSelect label={LABELS[k]} options={options[k]} value={filters[k]} onChange={onChange} counts={counts} keepOrder={keepOrder} />,
      };
    });

  return (
    <FilterBar
      filters={descriptors}
      leading={leading}
      right={right}
      pinned={pinned}
      onPinnedChange={setPinned}
      onClear={hasAnyProjectFilter(filters) ? () => onFilters(EMPTY_PROJECT_FILTERS) : undefined}
    />
  );
}
