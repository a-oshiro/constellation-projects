import type { Offer, Template, Background, Asset, TaskItem } from './types';
import bmwi4 from '../assets/offers/i4.png';
import bmw228i from '../assets/offers/228i.png';
import bmw330i from '../assets/offers/330i.png';
import bmwi5 from '../assets/offers/i5.png';
import bmwiX from '../assets/offers/iX.png';
import bmwX1 from '../assets/offers/X1.png';
import bmwX3 from '../assets/offers/X3.png';
import bmwX5 from '../assets/offers/X5.png';
import bmwX6 from '../assets/offers/X6.png';
import bmwX7 from '../assets/offers/X7.png';
import bg600_1 from '../assets/backgrounds/600_250_1.png';
import bg600_2 from '../assets/backgrounds/600_250_2.png';
import bg600_3 from '../assets/backgrounds/600_250_3.png';
import bg1080_1 from '../assets/backgrounds/1080_1080_1.png';
import bg1080_2 from '../assets/backgrounds/1080_1080_2.png';
import bg1080_3 from '../assets/backgrounds/1080_1080_3.png';
import bgHtml1 from '../assets/backgrounds/html_1100_1.png';
import bgHtml2 from '../assets/backgrounds/html_1100_2.png';
import bgHtml3 from '../assets/backgrounds/html_1100_3.png';
import bgHtml720_1 from '../assets/backgrounds/html_1100_1.png';
import bgHtml720_2 from '../assets/backgrounds/html_1100_2.png';
import bgHtml720_3 from '../assets/backgrounds/html_1100_3.png';

export const CURRENT_USER = {
  name: 'John Doe',
  avatarUrl: 'https://i.pravatar.cc/40?img=12',
};

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
  { key: 'templates', label: 'Templates', count: 3, route: '/templates', completed: true },
  { key: 'theme_and_logos', label: 'Theme and Logos', count: 4, route: '/theme-and-logos', completed: true },
  { key: 'review', label: 'Review', count: 27, route: '/review', completed: true },
  { key: 'approved', label: 'Approved', count: 27, route: '/approved', completed: true },
  { key: 'ads', label: 'Ads', count: 0, route: '/ads', completed: false },
  { key: 'campaigns', label: 'Campaigns', count: 0, route: '/campaigns', completed: false },
];

export const OFFERS: Offer[] = [
  {
    id: "offer-1",
    vehicleName: "2026 BMW X1 xDrive28i",
    year: 2026,
    make: "BMW",
    model: "X1",
    trim: "xDrive28i",
    inStock: 22,
    monthlyPayment: 429,
    term: 36,
    downPayment: 2500,
    salesPrice: 43200,
    totalDueAtSigning: 3299,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease"],
    pvi: 88,
    aging: 72,
    sales: 85,
    inventory: 22,
    imageUrl: bmwX1,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 1500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 1000, status: "applied", checked: false },
      { id: "r3", name: "College Grad Rebate", amount: 1000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 750, status: "non_stackable", checked: false },
      { id: "r5", name: "Corporate Fleet", amount: 500, status: "applied", checked: true }
    ]
  },
  {
    id: "offer-2",
    vehicleName: "2026 BMW X3 30 xDrive",
    year: 2026,
    make: "BMW",
    model: "X3",
    trim: "30 xDrive",
    inStock: 18,
    monthlyPayment: 539,
    term: 36,
    downPayment: 3000,
    salesPrice: 52650,
    totalDueAtSigning: 3799,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 91,
    aging: 68,
    sales: 88,
    inventory: 18,
    imageUrl: bmwX3,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 2000, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 1500, status: "applied", checked: false },
      { id: "r3", name: "College Grad Rebate", amount: 1000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 1000, status: "non_stackable", checked: false },
      { id: "r5", name: "Corporate Fleet", amount: 750, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-3",
    vehicleName: "2026 BMW X5 xDrive40i",
    year: 2026,
    make: "BMW",
    model: "X5",
    trim: "xDrive40i",
    inStock: 14,
    monthlyPayment: 849,
    term: 36,
    downPayment: 4000,
    salesPrice: 83220,
    totalDueAtSigning: 5499,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 94,
    aging: 55,
    sales: 80,
    inventory: 14,
    imageUrl: bmwX5,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 3000, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2000, status: "applied", checked: false },
      { id: "r3", name: "Corporate Fleet", amount: 1500, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 2500, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 1000, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-4",
    vehicleName: "2027 BMW X6 xDrive40i AWD",
    year: 2027,
    make: "BMW",
    model: "X6",
    trim: "xDrive40i AWD",
    inStock: 9,
    monthlyPayment: 899,
    term: 36,
    downPayment: 5000,
    salesPrice: 86650,
    totalDueAtSigning: 6499,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 87,
    aging: 48,
    sales: 74,
    inventory: 9,
    imageUrl: bmwX6,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 3500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2000, status: "applied", checked: false },
      { id: "r3", name: "Corporate Fleet", amount: 2000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 2500, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 1000, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-5",
    vehicleName: "2027 BMW X7 xDrive40i",
    year: 2027,
    make: "BMW",
    model: "X7",
    trim: "xDrive40i",
    inStock: 7,
    monthlyPayment: 979,
    term: 36,
    downPayment: 5000,
    salesPrice: 91850,
    totalDueAtSigning: 6999,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 85,
    aging: 42,
    sales: 70,
    inventory: 7,
    imageUrl: bmwX7,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 4000, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2500, status: "applied", checked: false },
      { id: "r3", name: "Corporate Fleet", amount: 2000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 3000, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 1500, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-6",
    vehicleName: "2027 BMW i4 eDrive40",
    year: 2027,
    make: "BMW",
    model: "i4",
    trim: "eDrive40",
    inStock: 16,
    monthlyPayment: 499,
    term: 36,
    downPayment: 2500,
    salesPrice: 57900,
    totalDueAtSigning: 3499,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease"],
    pvi: 96,
    aging: 90,
    sales: 92,
    inventory: 16,
    imageUrl: bmwi4,
    rebates: [
      { id: "r1", name: "EV Lease Credit", amount: 7500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2000, status: "applied", checked: false },
      { id: "r3", name: "Loyalty Credit", amount: 3000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 2500, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 1500, status: "applied", checked: true },
      { id: "r6", name: "Corporate Fleet", amount: 1000, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-7",
    vehicleName: "2026 BMW 228i Gran Coupe",
    year: 2026,
    make: "BMW",
    model: "228i",
    trim: "Gran Coupe",
    inStock: 20,
    monthlyPayment: 389,
    term: 36,
    downPayment: 2000,
    salesPrice: 39900,
    totalDueAtSigning: 2999,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 82,
    aging: 78,
    sales: 79,
    inventory: 20,
    imageUrl: bmw228i,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 1500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 1000, status: "applied", checked: false },
      { id: "r3", name: "College Grad Rebate", amount: 1000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 750, status: "non_stackable", checked: false }
    ]
  },
  {
    id: "offer-8",
    vehicleName: "2026 BMW 330i Sedan",
    year: 2026,
    make: "BMW",
    model: "330i",
    trim: "Sedan",
    inStock: 25,
    monthlyPayment: 469,
    term: 36,
    downPayment: 2500,
    salesPrice: 48675,
    totalDueAtSigning: 3299,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease", "Finance"],
    pvi: 90,
    aging: 81,
    sales: 86,
    inventory: 25,
    imageUrl: bmw330i,
    rebates: [
      { id: "r1", name: "Loyalty Credit", amount: 2000, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 1500, status: "applied", checked: false },
      { id: "r3", name: "College Grad Rebate", amount: 1000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 1000, status: "non_stackable", checked: false },
      { id: "r5", name: "Corporate Fleet", amount: 750, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-9",
    vehicleName: "2026 BMW iX xDrive45 AWD",
    year: 2026,
    make: "BMW",
    model: "iX",
    trim: "xDrive45 AWD",
    inStock: 11,
    monthlyPayment: 849,
    term: 36,
    downPayment: 4500,
    salesPrice: 86820,
    totalDueAtSigning: 5999,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease"],
    pvi: 93,
    aging: 60,
    sales: 77,
    inventory: 11,
    imageUrl: bmwiX,
    rebates: [
      { id: "r1", name: "EV Lease Credit", amount: 7500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2500, status: "applied", checked: false },
      { id: "r3", name: "Loyalty Credit", amount: 3500, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 3000, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 2000, status: "applied", checked: true },
      { id: "r6", name: "Corporate Fleet", amount: 1500, status: "applied", checked: false }
    ]
  },
  {
    id: "offer-10",
    vehicleName: "2027 BMW i5 eDrive40",
    year: 2027,
    make: "BMW",
    model: "i5",
    trim: "eDrive40",
    inStock: 13,
    monthlyPayment: 679,
    term: 36,
    downPayment: 3500,
    salesPrice: 67100,
    totalDueAtSigning: 4499,
    milesPerYear: 10000,
    expirationDate: "06/30/2026",
    offerType: ["Lease"],
    pvi: 95,
    aging: 74,
    sales: 83,
    inventory: 13,
    imageUrl: bmwi5,
    rebates: [
      { id: "r1", name: "EV Lease Credit", amount: 7500, status: "applied", checked: true },
      { id: "r2", name: "Military Incentive", amount: 2000, status: "applied", checked: false },
      { id: "r3", name: "Loyalty Credit", amount: 3000, status: "applied", checked: true },
      { id: "r4", name: "APR Credit", amount: 2500, status: "non_stackable", checked: false },
      { id: "r5", name: "Mobility Program", amount: 2000, status: "applied", checked: true },
      { id: "r6", name: "Corporate Fleet", amount: 1000, status: "applied", checked: false }
    ]
  }
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
  {
    id: 'tmpl-3',
    name: 'BMW_HTML_1100x560',
    type: 'HTML',
    width: 1100,
    height: 560,
    brand: 'BMW',
    previewUrl: '',
  },
  {
    id: 'tmpl-4',
    name: 'BMW_HTML_720x300',
    type: 'HTML',
    width: 720,
    height: 300,
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
  { id: 'bg-7', templateId: 'tmpl-3', url: bgHtml1, name: '1100x560 Background 1' },
  { id: 'bg-8', templateId: 'tmpl-3', url: bgHtml2, name: '1100x560 Background 2' },
  { id: 'bg-9', templateId: 'tmpl-3', url: bgHtml3, name: '1100x560 Background 3' },
  { id: 'bg-10', templateId: 'tmpl-4', url: bgHtml720_1, name: '720x300 Background 1' },
  { id: 'bg-11', templateId: 'tmpl-4', url: bgHtml720_2, name: '720x300 Background 2' },
  { id: 'bg-12', templateId: 'tmpl-4', url: bgHtml720_3, name: '720x300 Background 3' },
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
        const mediaType = tmpl.type === 'HTML' ? 'HTML' : 'Image';
        const platform = tmpl.type === 'Facebook Post' ? 'Social' : tmpl.type === 'HTML' ? 'HTML' : 'Website';
        assets.push({
          id: `asset-${idx++}`,
          name: `${offerNames[offer.id]}_${dimLabel}_BG${bgNum}`,
          description: `${mediaType} | ${dimLabel}`,
          thumbnailUrl: bg.url,
          offerId: offer.id,
          templateId: tmpl.id,
          backgroundId: bg.id,
          status: 'approved',
          tags: [offer.offerType[0] || 'Lease', dimLabel, platform],
          folder: 'May Offers - Specials',
          width: tmpl.width,
          height: tmpl.height,
          imageType: mediaType,
          offerType: offer.offerType[0] || 'Lease',
          platform,
          offer,
          backgroundUrl: bg.url,
        });
      });
    });
  });

  return assets;
})();

