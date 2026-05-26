import type { Offer, Template, Background, Asset, TaskItem } from './types';
import bmwI4 from '../assets/offers/bmw-i4-edrive40.png';
import bmwX3 from '../assets/offers/bmw-x3-xdrive.png';
import bmw3Series from '../assets/offers/bmw-3series-330i.png';
import bg600_1 from '../assets/backgrounds/600_250_1.png';
import bg600_2 from '../assets/backgrounds/600_250_2.png';
import bg600_3 from '../assets/backgrounds/600_250_3.png';
import bg1080_1 from '../assets/backgrounds/1080_1080_1.png';
import bg1080_2 from '../assets/backgrounds/1080_1080_2.png';
import bg1080_3 from '../assets/backgrounds/1080_1080_3.png';

export const PROJECT_INFO = {
  accountName: 'BMW Seattle',
  accountCode: 'WASEABMW',
  projectName: 'May Offers - Specials',
  status: 'campaign_loaded' as const,
  workflowStatus: 'in_progress' as const,
  startDate: 'May 1, 2026',
  endDate: 'May 31, 2026',
  creator: 'Maite Espino',
  creatorAvatar: 'https://i.pravatar.cc/32?img=47',
  clientLogo: '/bmw-logo.svg',
  accountUrl: 'https://www.bmwseattle.com',
};

export const TASKS: TaskItem[] = [
  { key: 'offers', label: 'Offers', count: 3, route: '/offers', completed: true },
  { key: 'templates', label: 'Templates', count: 2, route: '/templates', completed: true },
  { key: 'theme_and_logos', label: 'Theme and Logos', count: 4, route: '/theme-and-logos', completed: true },
  { key: 'review', label: 'Review', count: 18, route: '/review', completed: true },
  { key: 'approved', label: 'Approved', count: 18, route: '/approved', completed: true },
  { key: 'ads', label: 'Ads', count: 0, route: '/ads', completed: false },
  { key: 'campaigns', label: 'Campaigns', count: 0, route: '/campaigns', completed: false },
];

export const OFFERS: Offer[] = [
  {
    id: 'offer-1',
    vehicleName: '2025 BMW i4 eDRIVE40',
    year: 2025,
    make: 'BMW',
    model: 'i4',
    trim: 'eDRIVE40',
    inStock: 16,
    monthlyPayment: 399,
    term: 36,
    downPayment: 2500,
    salesPrice: 20464,
    totalDueAtSigning: 2999,
    milesPerYear: 5000,
    expirationDate: '05/31/2026',
    offerType: ['Lease'],
    pvi: 96,
    aging: 95,
    sales: 90,
    inventory: 20,
    imageUrl: bmwI4,
    rebates: [
      { id: 'r1', name: 'EV Lease Credit', amount: 7500, status: 'applied', checked: true },
      { id: 'r2', name: 'Military Incentive', amount: 5000, status: 'applied', checked: false },
      { id: 'r3', name: 'Loyalty Credit', amount: 4000, status: 'applied', checked: true },
      { id: 'r4', name: 'APR Credit', amount: 3000, status: 'non_stackable', checked: false },
      { id: 'r5', name: 'Mobility Program', amount: 2500, status: 'applied', checked: true },
      { id: 'r6', name: 'Corporate Fleet', amount: 1500, status: 'applied', checked: true },
    ],
  },
  {
    id: 'offer-2',
    vehicleName: '2026 BMW X3 30 XDRIVE',
    year: 2026,
    make: 'BMW',
    model: 'X3',
    trim: '30 XDRIVE',
    inStock: 24,
    monthlyPayment: 569,
    term: 39,
    downPayment: 3000,
    salesPrice: 35000,
    totalDueAtSigning: 5129,
    milesPerYear: 10000,
    expirationDate: '05/31/2026',
    offerType: ['Lease', 'Regional'],
    pvi: 93,
    aging: 70,
    sales: 9,
    inventory: 24,
    imageUrl: bmwX3,
    rebates: [],
  },
  {
    id: 'offer-3',
    vehicleName: '2026 BMW 3 SERIES 330i SEDAN',
    year: 2026,
    make: 'BMW',
    model: '3 SERIES',
    trim: '330i SEDAN',
    inStock: 6,
    monthlyPayment: 479,
    term: 39,
    downPayment: 2000,
    salesPrice: 28000,
    totalDueAtSigning: 4949,
    milesPerYear: 10000,
    expirationDate: '05/31/2026',
    offerType: ['Lease', 'Regional'],
    pvi: 92,
    aging: 91,
    sales: 3,
    inventory: 6,
    imageUrl: bmw3Series,
    rebates: [],
  },
];

export const TEMPLATES: Template[] = [
  {
    id: 'tmpl-1',
    name: 'BMW_Website_600 x 250',
    type: 'Facebook Cover',
    width: 600,
    height: 250,
    brand: 'BMW',
    previewUrl: '',
  },
  {
    id: 'tmpl-2',
    name: 'BMW_Social_1080x1080',
    type: 'Facebook Post',
    width: 1080,
    height: 1080,
    brand: 'BMW',
    previewUrl: '',
  },
];

export const BACKGROUNDS: Background[] = [
  { id: 'bg-1', templateId: 'tmpl-1', url: bg600_1, name: '600x250 Background 1' },
  { id: 'bg-2', templateId: 'tmpl-1', url: bg600_2, name: '600x250 Background 2' },
  { id: 'bg-3', templateId: 'tmpl-1', url: bg600_3, name: '600x250 Background 3' },
  { id: 'bg-4', templateId: 'tmpl-2', url: bg1080_1, name: '1080x1080 Background 1' },
  { id: 'bg-5', templateId: 'tmpl-2', url: bg1080_2, name: '1080x1080 Background 2' },
  { id: 'bg-6', templateId: 'tmpl-2', url: bg1080_3, name: '1080x1080 Background 3' },
];

const offerNames: Record<string, string> = {
  'offer-1': '2025 BMW i4 eDRIVE40',
  'offer-2': '2026 BMW X3 30 XDRIVE',
  'offer-3': '2026 BMW 3 SERIES 330i SEDAN',
};

// Generate assets: each offer × each template × each background for that template
export const ASSETS: Asset[] = (() => {
  const assets: Asset[] = [];
  let idx = 1;

  OFFERS.forEach((offer) => {
    TEMPLATES.forEach((tmpl) => {
      const templateBgs = BACKGROUNDS.filter((b) => b.templateId === tmpl.id);
      templateBgs.forEach((bg, bi) => {
        const dimLabel = `${tmpl.width} x ${tmpl.height}`;
        const bgNum = bi + 1;
        assets.push({
          id: `asset-${idx++}`,
          name: `${offerNames[offer.id]}_${dimLabel}_BG${bgNum}`,
          description: `Image | ${dimLabel}`,
          thumbnailUrl: bg.url,
          offerId: offer.id,
          templateId: tmpl.id,
          backgroundId: bg.id,
          status: 'approved',
          tags: [offer.offerType[0] || 'Lease', dimLabel, tmpl.type === 'Facebook Post' ? 'Social' : 'Website'],
          folder: 'May Offers - Specials',
          width: tmpl.width,
          height: tmpl.height,
          imageType: 'Image',
          offerType: offer.offerType[0] || 'Lease',
          platform: tmpl.type === 'Facebook Post' ? 'Social' : 'Website',
          offer,
          backgroundUrl: bg.url,
        });
      });
    });
  });

  return assets;
})();

