import type { CSSProperties } from 'react';
import type { AlertCategory, QcFindingType } from '../data/types';

/** Outline + light tint overlay applied to a whole offer/asset card once it's been decided, so a
 * reviewed item reads differently from a pending one at a glance — green for approved, red for rejected. */
export const REVIEW_DECISION_STYLE: Record<'approved' | 'rejected', CSSProperties> = {
  approved: { outline: '2px solid #4caf50', outlineOffset: -1, background: 'rgba(76,175,80,0.08)' },
  rejected: { outline: '2px solid #d2323f', outlineOffset: -1, background: 'rgba(210,50,63,0.08)' },
};

/** Shared between AlertsKanbanBoard and AlertDialog — kept out of either component file so Fast Refresh stays happy. */
export const CATEGORY_STYLE: Record<AlertCategory, { background: string; color: string }> = {
  Conquest: { background: '#EBF5FB', color: '#01579b' },
  Aging: { background: 'rgba(99,86,225,0.12)', color: '#6356e1' },
  MSRP: { background: '#e8f5e9', color: '#1b5e20' },
  Offers: { background: '#E0F7FA', color: '#006064' },
  'De-Listing': { background: '#FDF4EC', color: '#c45500' },
  'Inventory Gaps/Levels': { background: '#FFF8E1', color: '#8d6e00' },
  FTC: { background: '#FBEFF0', color: '#be0e1c' },
};

/** "Michael Stuart" -> "Michael S." — the compact reviewer name shown on the Kanban card's review rows and in the dialog's footer banners. */
export function formatReviewerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Display label for each QC finding type — shared by the card/row/dialog tag and the left-floating detail card. */
export const QC_FINDING_LABEL: Record<QcFindingType, string> = {
  payment_consistency: 'Payment consistency',
  mileage_consistency: 'Mileage consistency',
  selling_price_consistency: 'Selling price consistency',
};
