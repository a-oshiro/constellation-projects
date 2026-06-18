export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssetStatus = 'draft' | 'approved' | 'generated' | 'awaiting_approval' | 'needs_edits' | 'denied' | 'updated' | 'removed';
export type ProjectStatus = 'campaign_loaded' | 'draft' | 'in_review' | 'published';

export type OfferTypeName = 'Lease' | 'Finance' | 'Purchase' | 'ZD Lease' | 'Custom';

export interface LeaseOfferData {
  id: string;
  type: 'Lease';
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

export type TaskKey = 'offers' | 'templates' | 'theme_and_logos' | 'review' | 'approved' | 'ads' | 'campaigns';

export interface TaskItem {
  key: TaskKey;
  label: string;
  count: number;
  route: string;
  completed: boolean;
}
