import type { Offer, Template, Background, Alert } from './types';
import type { ProjectWorkflowStatus } from '../components/ui/ProjectStatusBadge';
import { OFFERS } from './offers';
import { TEMPLATES, BACKGROUNDS, PROJECT_INFO } from './mockData';
import { SEATTLE_OFFERS } from './evergreen/seattleOffers';
import { SEATTLE_ALERTS } from './evergreen/alerts';
import constellationLogo from '../assets/constellation-logo.png';

/** Status of a single accordion section on the Project Overview page. */
export type SectionStatus = 'done' | 'in_progress' | 'draft';

export interface ProjectSectionStatus {
  offers: SectionStatus;
  templates: SectionStatus;
  themeAndLogos: SectionStatus;
  assets: SectionStatus;
  adShells: SectionStatus;
  campaigns: SectionStatus;
}

export interface Project {
  id: string;
  accountName: string;
  accountCode: string;
  /** Project title, e.g. "May Offers - Specials" */
  projectName: string;
  /** Internal work-order style subtitle shown under the project name in the list, e.g. "WF58329_WASEABMW_MayOffersSpecials" */
  projectCode: string;
  brandTag: string;
  workflowStatus: ProjectWorkflowStatus;
  startDate: string;
  endDate: string;
  creator: string;
  creatorAvatar: string;
  lastUpdated: string;
  created: string;
  accountUrl: string;
  offers: Offer[];
  templates: Template[];
  backgrounds: Background[];
  sectionStatus: ProjectSectionStatus;
  /** Evergreen projects have no end date, are driven by a monthly AI agent, and show the Alerts Lifecycle Kanban on their Overview page. */
  isEvergreen?: boolean;
  /** Evergreen-only: whether the project is locked against edits. Defaults to true — unlocking requires confirming the risks in a popup. */
  locked?: boolean;
  /**
   * Per-project override for the "Approved" workflow step. When false, assets skip
   * draft/approval entirely and are always 'generated'. Mirrors the ProjectContext-wide
   * approvalEnabled toggle, but persists per project instead of always defaulting to true.
   */
  approvalEnabled?: boolean;
  /** Only populated for Evergreen projects — the AI-drafted email proposals shown on the Alerts Lifecycle board. */
  alerts?: Alert[];
}

const byTemplateIds = (templateIds: string[]) =>
  BACKGROUNDS.filter((b) => templateIds.includes(b.templateId));

const offerById = (id: string) => OFFERS.find((o) => o.id === id)!;
const templateById = (id: string) => TEMPLATES.find((t) => t.id === id)!;

export const PROJECTS: Project[] = [
  // ── The one "real" project — data mirrors mockData/offers exactly so its ──
  // ── overview preview matches what's live on the interactive task pages.  ──
  {
    id: 'proj-may-offers-specials',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: PROJECT_INFO.projectName,
    projectCode: 'WF58329_WASEABMW_MayOffersSpecials',
    brandTag: 'BMW',
    workflowStatus: 'in_progress',
    startDate: PROJECT_INFO.startDate,
    endDate: PROJECT_INFO.endDate,
    creator: PROJECT_INFO.creator,
    creatorAvatar: PROJECT_INFO.creatorAvatar,
    lastUpdated: 'Just now',
    created: '05/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: OFFERS,
    templates: TEMPLATES,
    backgrounds: BACKGROUNDS,
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'done',
      assets: 'in_progress',
      adShells: 'draft',
      campaigns: 'draft',
    },
  },
  {
    id: 'proj-summer-clearance',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: 'Summer Clearance Event',
    projectCode: 'WF60112_WASEABMW_SummerClearance',
    brandTag: 'BMW',
    workflowStatus: 'assets_generated',
    startDate: 'Jun 1, 2026',
    endDate: 'Jun 30, 2026',
    creator: 'Ava Brooks',
    creatorAvatar: 'https://i.pravatar.cc/32?img=32',
    lastUpdated: '2 hours ago',
    created: '05/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: [offerById('offer-1'), offerById('offer-4'), offerById('offer-5')],
    templates: [templateById('tmpl-1'), templateById('tmpl-2')],
    backgrounds: byTemplateIds(['tmpl-1', 'tmpl-2']),
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'done',
      assets: 'done',
      adShells: 'done',
      campaigns: 'draft',
    },
  },
  {
    id: 'proj-cpo-specials',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: 'Certified Pre-Owned Specials',
    projectCode: 'WF60245_WASEABMW_CPOSpecials',
    brandTag: 'BMW',
    workflowStatus: 'in_progress',
    startDate: 'Jul 1, 2026',
    endDate: 'Jul 31, 2026',
    creator: 'Henry Nova',
    creatorAvatar: 'https://i.pravatar.cc/32?img=12',
    lastUpdated: '1 day ago',
    created: '06/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: [offerById('offer-2'), offerById('offer-3'), offerById('offer-8')],
    templates: [templateById('tmpl-3'), templateById('tmpl-4')],
    backgrounds: byTemplateIds(['tmpl-3', 'tmpl-4']),
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'in_progress',
      assets: 'draft',
      adShells: 'draft',
      campaigns: 'draft',
    },
  },
  {
    id: 'proj-fall-lease-event',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: 'Fall Lease Event',
    projectCode: 'WF60389_WASEABMW_FallLeaseEvent',
    brandTag: 'BMW',
    workflowStatus: 'campaign_loaded',
    startDate: 'Sep 1, 2026',
    endDate: 'Sep 30, 2026',
    creator: 'Maite Espino',
    creatorAvatar: PROJECT_INFO.creatorAvatar,
    lastUpdated: '3 days ago',
    created: '08/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: [offerById('offer-1'), offerById('offer-2'), offerById('offer-7'), offerById('offer-8')],
    templates: TEMPLATES,
    backgrounds: BACKGROUNDS,
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'done',
      assets: 'done',
      adShells: 'done',
      campaigns: 'done',
    },
  },
  {
    id: 'proj-year-end-sales',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: 'Year End Sales Event',
    projectCode: 'WF60512_WASEABMW_YearEndSales',
    brandTag: 'BMW',
    workflowStatus: 'in_progress',
    startDate: 'Dec 1, 2026',
    endDate: 'Dec 31, 2026',
    creator: 'Henry Nova',
    creatorAvatar: 'https://i.pravatar.cc/32?img=12',
    lastUpdated: '5 days ago',
    created: '11/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: [offerById('offer-3'), offerById('offer-4'), offerById('offer-5'), offerById('offer-9')],
    templates: [templateById('tmpl-2')],
    backgrounds: byTemplateIds(['tmpl-2']),
    sectionStatus: {
      offers: 'done',
      templates: 'in_progress',
      themeAndLogos: 'draft',
      assets: 'draft',
      adShells: 'draft',
      campaigns: 'draft',
    },
  },
  {
    id: 'proj-ev-spotlight',
    accountName: PROJECT_INFO.accountName,
    accountCode: PROJECT_INFO.accountCode,
    projectName: 'Electric Vehicle Spotlight',
    projectCode: 'WF60634_WASEABMW_EVSpotlight',
    brandTag: 'BMW',
    workflowStatus: 'assets_generated',
    startDate: 'Aug 1, 2026',
    endDate: 'Aug 31, 2026',
    creator: 'Ava Brooks',
    creatorAvatar: 'https://i.pravatar.cc/32?img=32',
    lastUpdated: '1 week ago',
    created: '07/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    offers: [offerById('offer-6'), offerById('offer-9'), offerById('offer-10')],
    templates: [templateById('tmpl-1'), templateById('tmpl-3')],
    backgrounds: byTemplateIds(['tmpl-1', 'tmpl-3']),
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'done',
      assets: 'done',
      adShells: 'in_progress',
      campaigns: 'draft',
    },
  },
  {
    id: 'proj-evergreen-bmw-seattle',
    accountName: 'BMW of Seattle',
    accountCode: 'WASEABMW',
    projectName: 'Evergreen BMW of Seattle',
    projectCode: 'EVG00001_WASEABMW_Evergreen',
    brandTag: 'BMW',
    workflowStatus: 'live',
    startDate: 'Aug 1, 2026',
    endDate: '∞',
    creator: 'AI AutoAgent',
    creatorAvatar: constellationLogo,
    lastUpdated: 'Just now',
    created: '08/2026',
    accountUrl: PROJECT_INFO.accountUrl,
    isEvergreen: true,
    approvalEnabled: false,
    locked: true,
    // The Alerts Lifecycle board only ever references SEATTLE_OFFERS ids, so those stay first;
    // the rest of the BMW catalog is appended purely to give the Overview's Preview panel more assets.
    offers: [...SEATTLE_OFFERS, ...OFFERS.filter((o) => !o.swapOnly)],
    templates: [templateById('tmpl-2')],
    backgrounds: byTemplateIds(['tmpl-2']).filter((b) => ['bg-4', 'bg-5', 'bg-13', 'bg-14'].includes(b.id)),
    alerts: SEATTLE_ALERTS,
    sectionStatus: {
      offers: 'done',
      templates: 'done',
      themeAndLogos: 'done',
      assets: 'done',
      adShells: 'done',
      campaigns: 'done',
    },
  },
];

export const DEFAULT_PROJECT_ID = PROJECTS[0].id;

export const getProjectById = (id: string): Project =>
  PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
