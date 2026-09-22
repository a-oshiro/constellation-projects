export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssetStatus = 'draft' | 'approved' | 'generated' | 'awaiting_approval' | 'updated' | 'removed';
export type ProjectStatus = 'campaign_loaded' | 'draft' | 'in_review' | 'published';

export type OfferTypeName = 'Lease' | 'Finance' | 'Purchase' | 'ZD Lease' | 'Custom';

export interface LeaseOfferData {
  id: string;
  type: 'Lease';
  hidden?: boolean;
  source?: string;
  monthlyPayment?: number;
  term?: number;
  downPayment?: number;
  salesPrice?: number;
  totalDueAtSigning?: number;
  milesPerYear?: number;
  startDate?: string;
  expirationDate?: string;
  rebates?: Rebate[];
}

export interface FinanceOfferData {
  id: string;
  type: 'Finance';
  hidden?: boolean;
  source?: string;
  rate?: number;
  term?: number;
  payment?: number;
  financeDownPayment?: number;
  amountFinanced?: number;
  salesPrice?: number;
  minFico?: number;
}

export interface PurchaseRebateEntry {
  id: string;
  name: string;
  amount: number;
}

export interface PurchaseOfferData {
  id: string;
  type: 'Purchase';
  hidden?: boolean;
  source?: string;
  finalPrice?: number;
  dealerDiscount?: number;
  savingsOffMsrp?: number;
  purchaseRebates?: PurchaseRebateEntry[];
  purchaseCondRebates?: PurchaseRebateEntry[];
  purchaseManualInputs?: PurchaseRebateEntry[];
  dealerEnrolledPrice?: number;
  percentageOffMsrp?: number;
  savingsOffMsrpTitle?: string;
  savingsOffMsrpDesc?: string;
  finalPriceName?: string;
  additionalPurchaseDisclosure?: string;
}

export interface ZDLeaseOfferData {
  id: string;
  type: 'ZD Lease';
  hidden?: boolean;
  source?: string;
  noOfPayments?: number;
  monthlyPayment?: number;
  vehicleSalesPrice?: number;
  milesPerYear?: number;
  zdLeaseRebates?: PurchaseRebateEntry[];
  zdLeaseManualInputs?: PurchaseRebateEntry[];
  capCost?: number;
  capCostReduction?: number;
  netAdjCapCost?: number;
  totalLeaseCharge?: number;
  residualSalesValue?: number;
  centsPerMile?: number;
  tdAtSInclRebates?: number;
  terminationFee?: number;
  fico?: number;
  acquisitionFee?: number;
  securityDeposit?: number;
  additionalZdLeaseDisclosure?: string;
}

export interface CustomField {
  id: string;
  name: string;
  value: string;
}

export interface CustomOfferData {
  id: string;
  type: 'Custom';
  hidden?: boolean;
  source?: string;
  customFields?: CustomField[];
}

export type OfferTypeData =
  | LeaseOfferData
  | FinanceOfferData
  | PurchaseOfferData
  | ZDLeaseOfferData
  | CustomOfferData;

export interface Offer {
  id: string;
  vehicleName: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  inStock: number;
  offerTypes: OfferTypeData[];
  vin?: string;
  pvi?: number;
  aging?: number;
  sales?: number;
  inventory?: number;
  imageUrl: string;
  status?: AssetStatus;
  swapOnly?: boolean;
  replacesOfferId?: string;
  swapMatchType?: 'exact_match' | 'different_ymmt';
  // Vehicle info fields
  exteriorColor?: string;
  drivetrain?: string;
  condition?: 'New' | 'Used' | 'Certified Pre-Owned';
  msrp?: number;
  advertisedPrice?: number;
  similarVehiclesAtPrice?: number;
  vinsAtPrice?: string;
  daysInStock?: number;
  dateInStock?: string;
  mileage?: number;
  transmission?: string;
  blindSpotMonitor?: string;
  inTransit?: string;
  modelCode?: string;
  stockNumber?: string;
  styleName?: string;
  accountImages?: string;
  /** Fine-print lease disclosure shown at the bottom of generated ad assets. Fixed per offer so every asset built from it shows identical legal copy. */
  disclosure?: string;
}

/** Returns the first Lease offer type data, used by templates and asset previews. */
export function getPrimaryLeaseData(offer: Offer): LeaseOfferData {
  const lease = offer.offerTypes.find((ot): ot is LeaseOfferData => ot.type === 'Lease');
  return lease ?? { id: '', type: 'Lease' };
}

export interface Rebate {
  id: string;
  name: string;
  amount: number;
  status: 'applied' | 'non_stackable' | 'available';
  checked: boolean;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  brand: string;
  previewUrl: string;
}

export interface Background {
  id: string;
  templateId: string;
  url: string;
  name: string;
}

export interface Logo {
  id: string;
  name: string;
  brand: string;
  placement: string;
  url: string;
}

export interface Asset {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  offerId: string;
  templateId: string;
  backgroundId: string;
  status: AssetStatus;
  tags: string[];
  folder: string;
  width: number;
  height: number;
  imageType: string;
  offerType: string;
  platform: string;
  offer: Offer;
  backgroundUrl: string;
  logoId?: string;
}

export interface AssetVersion {
  id: string;
  assetId: string;
  timestamp: number;
  offer: Offer;
  backgroundUrl: string;
  name: string;
}

export interface AssetComment {
  id: string;
  assetId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
}

export type AlertCategory = 'Conquest' | 'Aging' | 'MSRP' | 'Offers' | 'De-Listing' | 'Inventory Gaps/Levels' | 'FTC';
/** Overall Kanban column — derived from `emailStatus`/`assetsStatus`, except 'sent' which is set explicitly. */
export type AlertStatus = 'generated' | 'rejected' | 'approved' | 'sent';
/** Per-half review state, independently tracked for the email and the assets. */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type AlertActivityAction =
  | 'generated'
  | 'email_approved'
  | 'email_rejected'
  | 'assets_approved'
  | 'assets_rejected'
  | 'rebuilt'
  | 'regenerated'
  | 'sent'
  | 'archived';

/** A hard failure of the generation system (trigger failure, incomplete asset generation, etc.) — its presence on an Alert means the email/assets could never be produced, so the dialog shows an empty state instead of a preview and every approval control is disabled. */
export interface AlertGenerationFailure {
  message: string;
  service: string;
  statusCode: number;
}

/** Non-blocking QC issue types surfaced on an individual asset/offer — advisory only, never blocks approval. */
export type QcFindingType = 'payment_consistency' | 'mileage_consistency' | 'selling_price_consistency';

/** One QC finding attached to a specific offer within an alert (e.g. "the stored offer has no MSRP"). */
export interface QcFinding {
  id: string;
  type: QcFindingType;
  offerId: string;
  message: string;
  expectedLabel: string;
  actualLabel: string;
}

export type CreativeQcCheckStatus = 'passed' | 'warning';

/** One named automated check within a Creative QC section (e.g. "Empty placeholders", "Text outside the canvas"). */
export interface CreativeQcCheck {
  id: string;
  label: string;
  status: CreativeQcCheckStatus;
  /** Specific named issues found — present only when status === 'warning' (e.g. a named empty placeholder). */
  issues?: string[];
}

/** One section of Creative QC ("Template Rules" or "Render Check"), a bundle of named checks plus when they last ran. */
export interface CreativeQcSection {
  id: 'template_rules' | 'render_check';
  label: string;
  checks: CreativeQcCheck[];
  checkedAt: number;
}

/** Per-offer Creative QC result — an offer's asset can fail Template Rules and/or Render Check independently. */
export interface CreativeQcResult {
  offerId: string;
  sections: CreativeQcSection[];
}

/** A point-in-time snapshot of the deal terms an offer was priced at when its asset was generated for this
 * alert — the "baseline" Deal QC compares the live offer against. Deliberately its own small, display-only
 * shape (not derived from `Offer`, which has no lender/dealerDiscount fields) since this is mock data only. */
export interface DealQcBaselineOffer {
  offerId: string;
  monthlyPayment: number;
  termMonths: number;
  msrp: number;
  dueAtSigning: number;
  mileagePerYear: number;
  dealerDiscount: number;
  lender: string;
}

export type DealQcFieldKey =
  | 'monthlyPayment' | 'termMonths' | 'msrp' | 'dueAtSigning' | 'mileagePerYear' | 'dealerDiscount' | 'lender';

/** One offer's Deal QC comparison — the baseline it was priced at vs. which fields (if any) no longer match. */
export interface DealQcOfferResult {
  offerId: string;
  baseline: DealQcBaselineOffer;
  /** Empty means this offer passed. */
  mismatchedFields: DealQcFieldKey[];
}

/** Alert-level Deal QC result, covering every offer used in the composed email. */
export interface DealQcResult {
  offers: DealQcOfferResult[];
  rulesetVersion: string;
  checkedAt: number;
}

export interface AlertActivityEntry {
  id: string;
  action: AlertActivityAction;
  timestamp: number;
  /** 'AI AutoAgent' for the initial generation, otherwise the acting user's name. */
  actorName: string;
  actorEmail?: string;
  actorAvatar?: string;
}

/** Character range inside one paragraph of Alert.bodyParagraphs, anchoring a comment to highlighted email text. */
export interface EmailCommentAnchor {
  kind: 'email';
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  /** The literal substring at anchor time — used to re-render the highlight and to detect stale offsets if the paragraph text ever changes. */
  quotedText: string;
}

/** Percentage-based point on one asset's preview image, anchoring a comment to a pin. */
export interface AssetCommentAnchor {
  kind: 'asset';
  /** The offer whose creative this pin/highlight belongs to. */
  offerId: string;
  /** Pin center (no width/height) or the highlighted rect's top-left corner (with width/height). */
  xPct: number;
  yPct: number;
  /** Present only for a highlighted region (vs. a pinned point): rect size as % of the asset's rendered box. */
  widthPct?: number;
  heightPct?: number;
  /** Selected text, captured only for highlighted-region anchors. */
  quotedText?: string;
}

export type AlertCommentAnchor = EmailCommentAnchor | AssetCommentAnchor;

/** A comment left on one review track (email or assets), optionally assigning a single owner and mentioning other teammates. */
export interface AlertComment {
  id: string;
  track: 'email' | 'assets';
  text: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  mentionedNames: string[];
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  /** Set when the comment is edited after posting — drives the "Edited" indicator. */
  editedAt?: number;
  /** Present only for comments created via highlight-to-comment (email) or pin-to-comment (assets); absent for plain composer comments. */
  anchor?: AlertCommentAnchor;
  /** Set once a reviewer marks the comment resolved — dims/strikes its text and hides it from the list unless "Show Resolved" is on. */
  resolved?: boolean;
  /** Present only on a reply — the id of the top-level comment it replies to. Replies aren't independently anchored or resolvable; they inherit their parent's visibility. */
  parentCommentId?: string;
  /** Emoji reactions, keyed by emoji, each holding the names of everyone who reacted with it. */
  reactions?: Record<string, string[]>;
}

/** One offer's individual asset-approval decision — who made it and when, so the asset approval widget and per-asset status card can show "by {actorName} • {relative time}". Absence from `Alert.offerReviews` means the offer hasn't been reviewed yet ('pending'). */
export interface OfferReviewEntry {
  status: Exclude<ReviewStatus, 'pending'>;
  actorName: string;
  timestamp: number;
}

/** An AI-drafted email proposal for an Evergreen project, tracked through the Generated/Rejected/Approved/Sent lifecycle. */
export interface Alert {
  id: string;
  category: AlertCategory;
  subject: string;
  preheader: string;
  bodyParagraphs: string[];
  /** The offer this alert's email is built around (the large recommended price card). */
  featuredOfferId: string;
  /** The other offers already running on paid media, shown as a secondary grid in the email. */
  otherOfferIds: string[];
  vin: string;
  status: AlertStatus;
  /** Independent review state of the email content — approved/rejected in parallel with `assetsStatus`. */
  emailStatus: ReviewStatus;
  /** Rollup of `offerReviews` — any rejection wins, else approved once every offer is approved, else pending. Kept as a stored field (recomputed whenever `offerReviews` changes) so existing readers (Kanban, table, filters) don't need to know about per-offer status. */
  assetsStatus: ReviewStatus;
  /** Per-offer (featuredOfferId + otherOfferIds) review state, keyed by offer id. Absent entries default to 'pending'. */
  offerReviews?: Record<string, OfferReviewEntry>;
  createdAt: number;
  /** Ordered oldest -> newest. */
  activity: AlertActivityEntry[];
  /** Comments left per review track (email/assets), ordered oldest -> newest. Defaults to empty when omitted. */
  comments?: AlertComment[];
  /** Set once the alert is manually archived — removed from the Kanban/Table and shown in the Archived Alerts dialog instead. */
  archivedAt?: number;
  /** Present when the generation system failed to produce this alert's email/assets entirely — a hard, blocking failure (see AlertGenerationFailure). */
  generationFailure?: AlertGenerationFailure;
  /** Non-blocking QC issues found on one or more of this alert's offers — advisory only, never blocks approval. */
  qcFindings?: QcFinding[];
  /** Creative QC results (Template Rules + Render Check), one entry per checked offer — advisory only. Absent/empty means no Creative QC data for this alert. */
  creativeQc?: CreativeQcResult[];
  /** Deal QC result for this alert's offers, checked against their stored baselines — advisory only. Absent means no Deal QC data for this alert. */
  dealQc?: DealQcResult;
  /** Email addresses this alert will be sent to. Undefined until the user edits them, at which point the dialog's default suggestion list is persisted here. */
  recipients?: string[];
}

export type TaskKey = 'offers' | 'templates' | 'theme_and_logos' | 'review' | 'approved' | 'ads' | 'campaigns';

export interface TaskItem {
  key: TaskKey;
  label: string;
  count: number;
  route: string;
  completed: boolean;
}
