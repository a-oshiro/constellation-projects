export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type AssetStatus = 'draft' | 'approved' | 'generated' | 'awaiting_approval' | 'needs_edits' | 'denied' | 'updated' | 'removed';
export type ProjectStatus = 'campaign_loaded' | 'draft' | 'in_review' | 'published';

export interface Offer {
  id: string;
  vehicleName: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  inStock: number;
  monthlyPayment: number;
  term: number;
  downPayment: number;
  salesPrice: number;
  totalDueAtSigning: number;
  milesPerYear: number;
  expirationDate: string;
  offerType: string[];
  vin?: string;
  pvi?: number;
  aging?: number;
  sales?: number;
  inventory?: number;
  imageUrl: string;
  rebates: Rebate[];
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
