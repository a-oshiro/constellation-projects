export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssetStatus = 'draft' | 'approved' | 'generated' | 'awaiting_approval' | 'needs_edits' | 'denied' | 'updated' | 'removed';
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
  | 'sent'
  | 'archived';

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
  /** The offer whose creative this pin belongs to — pins only render while that offer is the active carousel item. */
  offerId: string;
  xPct: number;
  yPct: number;
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
  /** Independent review state of the assets — approved/rejected in parallel with `emailStatus`. */
  assetsStatus: ReviewStatus;
  createdAt: number;
  /** Ordered oldest -> newest. */
  activity: AlertActivityEntry[];
  /** Comments left per review track (email/assets), ordered oldest -> newest. Defaults to empty when omitted. */
  comments?: AlertComment[];
  /** Set once the alert is manually archived — removed from the Kanban/Table and shown in the Archived Alerts dialog instead. */
  archivedAt?: number;
}

export type TaskKey = 'offers' | 'templates' | 'theme_and_logos' | 'review' | 'approved' | 'ads' | 'campaigns';

export interface TaskItem {
  key: TaskKey;
  label: string;
  count: number;
  route: string;
  completed: boolean;
}
