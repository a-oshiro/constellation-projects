import type { Template, Background, Asset, TaskItem } from './types';
import { OFFERS } from './offers';
export { OFFERS } from './offers';
import bg600_1 from '../assets/backgrounds/600_250_1.png';
import bg600_2 from '../assets/backgrounds/600_250_2.png';
import bg600_3 from '../assets/backgrounds/600_250_3.png';
import bg1080_1 from '../assets/backgrounds/1080_1080_1.png';
import bg1080_2 from '../assets/backgrounds/1080_1080_2.png';
import bg1080_3 from '../assets/backgrounds/1080_1080_3.png';
import bg1080_4 from '../assets/backgrounds/1080_1080_4.png';
import bg1080_5 from '../assets/backgrounds/1080_1080_5.png';
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

export interface Teammate {
  name: string;
  avatarUrl: string;
}

/** Mock roster for the alert-comment Assignee/Mentioned Teammates pickers. */
export const MOCK_TEAMMATES: Teammate[] = [
  { name: 'John Doe', avatarUrl: CURRENT_USER.avatarUrl },
  { name: 'Michael Stuart', avatarUrl: 'https://i.pravatar.cc/40?img=52' },
  { name: 'Maite Espino', avatarUrl: 'https://i.pravatar.cc/40?img=47' },
  { name: 'Chloe Sinclair', avatarUrl: 'https://i.pravatar.cc/40?img=45' },
  { name: 'Henry Nova', avatarUrl: 'https://i.pravatar.cc/40?img=11' },
  { name: 'Felix Orbit', avatarUrl: 'https://i.pravatar.cc/40?img=33' },
];

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
  { id: 'bg-13', templateId: 'tmpl-2', url: bg1080_4, name: '1080x1080 Background 4' },
  { id: 'bg-14', templateId: 'tmpl-2', url: bg1080_5, name: '1080x1080 Background 5' },
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
    const primaryType = offer.offerTypes[0]?.type ?? 'Lease';
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
          tags: [primaryType, dimLabel, platform],
          folder: 'May Offers - Specials',
          width: tmpl.width,
          height: tmpl.height,
          imageType: mediaType,
          offerType: primaryType,
          platform,
          offer,
          backgroundUrl: bg.url,
        });
      });
    });
  });

  return assets;
})();
