import type { Asset, AssetStatus } from '../data/types';

export type SortByOption = 'default' | 'template' | 'offer' | 'dimension';

export interface FilterState {
  sortBy: SortByOption;
  sortDesc: boolean;
  assetTypes: string[];
  dimensions: string[];
  statuses: AssetStatus[];
  years: number[];
  makes: string[];
  models: string[];
}

export const DEFAULT_FILTER_STATE: FilterState = {
  sortBy: 'default',
  sortDesc: false,
  assetTypes: [],
  dimensions: [],
  statuses: [],
  years: [],
  makes: [],
  models: [],
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  generated: 'Generated',
  updated: 'Updated',
  awaiting_approval: 'Awaiting Approval',
  needs_edits: 'Needs Edits',
  denied: 'Denied',
  removed: 'Removed',
  approved: 'Approved',
};

export function applyAssetFilters(assets: Asset[], state: FilterState): Asset[] {
  let result = [...assets];

  if (state.assetTypes.length > 0) {
    result = result.filter(a => state.assetTypes.includes(a.imageType));
  }
  if (state.dimensions.length > 0) {
    result = result.filter(a => state.dimensions.includes(`${a.width} x ${a.height}`));
  }
  if (state.statuses.length > 0) {
    result = result.filter(a => state.statuses.includes(a.status));
  }
  if (state.years.length > 0) {
    result = result.filter(a => state.years.includes(a.offer.year));
  }
  if (state.makes.length > 0) {
    result = result.filter(a => state.makes.includes(a.offer.make));
  }
  if (state.models.length > 0) {
    result = result.filter(a => state.models.includes(a.offer.model));
  }

  if (state.sortBy !== 'default') {
    result.sort((a, b) => {
      let aKey: string;
      let bKey: string;
      switch (state.sortBy) {
        case 'template':
          aKey = a.templateId;
          bKey = b.templateId;
          break;
        case 'offer':
          aKey = a.offer.vehicleName;
          bKey = b.offer.vehicleName;
          break;
        case 'dimension':
          aKey = `${String(a.width).padStart(6, '0')}x${String(a.height).padStart(6, '0')}`;
          bKey = `${String(b.width).padStart(6, '0')}x${String(b.height).padStart(6, '0')}`;
          break;
        default:
          aKey = '';
          bKey = '';
      }
      const cmp = aKey.localeCompare(bKey);
      return state.sortDesc ? -cmp : cmp;
    });
  } else if (state.sortDesc) {
    result.reverse();
  }

  return result;
}

export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.sortBy !== 'default' ||
    state.sortDesc ||
    state.assetTypes.length > 0 ||
    state.dimensions.length > 0 ||
    state.statuses.length > 0 ||
    state.years.length > 0 ||
    state.makes.length > 0 ||
    state.models.length > 0
  );
}
