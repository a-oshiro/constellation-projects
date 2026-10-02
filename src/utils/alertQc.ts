import { Payments, Speed, Sell } from '@mui/icons-material';
import type { Alert, CreativeQcResult, QcFindingType } from '../data/types';
import { QC_FINDING_LABEL } from './alertReview';

export const QC_FINDING_ICON: Record<QcFindingType, React.ElementType> = {
  payment_consistency: Payments,
  mileage_consistency: Speed,
  selling_price_consistency: Sell,
};

/** Which tab of the QC warnings panel a tag/warning lives in. Legacy structured findings (payment,
 * mileage, selling price consistency) are deal-term checks, so they're grouped under Deal QC. */
export type QcTab = 'creative' | 'deal';

/** One QC tag as shown on an asset and on its offer's card — the same list drives both. */
export interface QcTag {
  /** Stable id: `legacy:<findingId>`, `creative:<offerId>` or `deal:<offerId>`. Also identifies the
   * warning block in the QC panel that clicking the tag scrolls to. */
  key: string;
  label: string;
  /** Set for legacy structured findings — picks the tag's icon. */
  findingType?: QcFindingType;
  tab: QcTab;
  offerId: string;
}

/** A request to open the QC panel on one tag's warning — `token` changes on every request so re-clicking
 * the same tag re-scrolls/re-flashes even though `key` hasn't changed. */
export interface QcFocusRequest {
  key: string;
  tab: QcTab;
  offerId: string;
  token: number;
}

/** How long a QC panel card stays highlighted after a QC tag click. */
export const QC_FLASH_MS = 2000;

/** The QC panel's tag-jump highlight: the card's 1px gray outline becomes a 2px `color` (the platform's
 * warning color) one, drawn as an outline over the border so the layout never shifts. */
export const qcFlashOutline = (flashed: boolean, color: string): React.CSSProperties => ({
  outline: `2px solid ${flashed ? color : 'transparent'}`,
  outlineOffset: -1,
  transition: 'outline-color 0.2s ease',
});

type AlertQcData = Pick<Alert, 'qcFindings' | 'creativeQc' | 'dealQc'>;

export const creativeQcHasWarning = (result?: CreativeQcResult) =>
  !!result?.sections.some((s) => s.checks.some((c) => c.status === 'warning'));

/** Every QC tag for one offer, in display order: legacy findings, then Creative QC, then Deal QC. */
export const qcTagsForOffer = (alert: AlertQcData, offerId: string): QcTag[] => {
  const tags: QcTag[] = (alert.qcFindings ?? [])
    .filter((f) => f.offerId === offerId)
    .map((f) => ({ key: `legacy:${f.id}`, label: QC_FINDING_LABEL[f.type], findingType: f.type, tab: 'deal', offerId }));
  if (creativeQcHasWarning(alert.creativeQc?.find((r) => r.offerId === offerId))) {
    tags.push({ key: `creative:${offerId}`, label: 'Creative QC', tab: 'creative', offerId });
  }
  if (alert.dealQc?.offers.some((o) => o.offerId === offerId && o.mismatchedFields.length > 0)) {
    tags.push({ key: `deal:${offerId}`, label: 'Deal QC', tab: 'deal', offerId });
  }
  return tags;
};

/** Default Creative QC result for an offer with no recorded result — every check passed, so the panel can
 * still show each asset's Template Rules / Render Check, not just the ones with problems. */
export const passedCreativeQcResult = (offerId: string, checkedAt: number): CreativeQcResult => ({
  offerId,
  sections: [
    {
      id: 'template_rules',
      label: 'Template Rules',
      checkedAt,
      checks: [{ id: 'empty-placeholders', label: 'Empty placeholders', status: 'passed' }],
    },
    {
      id: 'render_check',
      label: 'Render Check',
      checkedAt,
      checks: [
        { id: 'text-outside-canvas', label: 'Text outside the canvas', status: 'passed' },
        { id: 'overlapping-text', label: 'Overlapping text', status: 'passed' },
        { id: 'low-contrast-text', label: 'Low contrast text', status: 'passed' },
      ],
    },
  ],
});
