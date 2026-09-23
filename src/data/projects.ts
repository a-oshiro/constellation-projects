import type { Offer, Template, Background, Alert } from './types';
import type { ProjectWorkflowStatus } from '../components/ui/ProjectStatusBadge';
import { OFFERS } from './offers';
import { TEMPLATES, BACKGROUNDS, PROJECT_INFO, CURRENT_USER } from './mockData';
import { SEATTLE_OFFERS } from './evergreen/seattleOffers';
import { SEATTLE_ALERTS, buildSampleEvergreenAlerts } from './evergreen/alerts';
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

// Declared early: the generated-project builder below needs it at module-eval time.
export const slugify = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const HAND_WRITTEN_PROJECTS: Project[] = [
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
    creator: CURRENT_USER.name,
    creatorAvatar: CURRENT_USER.avatarUrl,
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
    creator: CURRENT_USER.name,
    creatorAvatar: CURRENT_USER.avatarUrl,
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
    accountName: 'BMW Seattle',
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
    // tmpl-2 (the 1080x1080 square) must stay first — it's the only template ever used for the outbound
    // email and for every other Evergreen project's single-asset flow. tmpl-3/tmpl-4 are extra horizontal
    // templates: their assets are approvable in the Alert dialog's carousel but never appear in the email.
    templates: [templateById('tmpl-2'), templateById('tmpl-3'), templateById('tmpl-4')],
    backgrounds: byTemplateIds(['tmpl-2', 'tmpl-3', 'tmpl-4']).filter((b) =>
      ['bg-4', 'bg-5', 'bg-13', 'bg-14', 'bg-7', 'bg-8', 'bg-9', 'bg-10', 'bg-11', 'bg-12'].includes(b.id)),
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

// ── Generated projects — 30 additional mock projects spread across other fake ──
// ── BMW dealerships (never BMW Seattle), reusing the existing offers/templates/ ──
// ── backgrounds pools. 8 of these dealerships get an Evergreen project — never ──
// ── more than one per account.                                                ──

interface Dealership {
  name: string;
  code: string;
  url: string;
}

const DEALERSHIPS: Dealership[] = [
  { name: 'BMW of Naperville', code: 'ILNAPBMW', url: 'https://www.bmwnaperville.com' },
  { name: 'BMW of Plano', code: 'TXPLABMW', url: 'https://www.bmwplano.com' },
  { name: 'BMW of Scottsdale', code: 'AZSCOBMW', url: 'https://www.bmwscottsdale.com' },
  { name: 'BMW of Overland Park', code: 'KSOVEBMW', url: 'https://www.bmwoverlandpark.com' },
  { name: 'BMW of Cary', code: 'NCCARBMW', url: 'https://www.bmwcary.com' },
  { name: 'BMW of Fishers', code: 'INFISBMW', url: 'https://www.bmwfishers.com' },
  { name: 'BMW of Westminster', code: 'COWESBMW', url: 'https://www.bmwwestminster.com' },
  { name: 'BMW of Sugar Land', code: 'TXSUGBMW', url: 'https://www.bmwsugarland.com' },
  { name: 'BMW of Brentwood', code: 'TNBREBMW', url: 'https://www.bmwbrentwood.com' },
  { name: 'BMW of Frisco', code: 'TXFRIBMW', url: 'https://www.bmwfrisco.com' },
  { name: 'BMW of Roswell', code: 'GAROSBMW', url: 'https://www.bmwroswell.com' },
  { name: 'BMW of Woodbury', code: 'MNWOOBMW', url: 'https://www.bmwwoodbury.com' },
];

// The first 8 dealerships each get exactly one Evergreen project — enforcing "one per account".
const EVERGREEN_DEALERSHIP_COUNT = 8;

const CAMPAIGN_NAMES = [
  'Spring Clearance Event', 'Presidents Day Sales Event', 'Loyalty Appreciation Event', 'Back to School Lease Specials',
  'Memorial Day Blowout', 'Labor Day Savings Event', 'Holiday Bonus Cash Event', 'New Year New Deals',
  'Certified Pre-Owned Roundup', 'Model Year-End Clearance', 'Tax Season Trade-In Event', 'Summer Drive Event',
  'Fall Into Savings', 'Winter Wonderland Sales', 'Anniversary Sales Event', 'Flash Finance Weekend',
  'Test Drive & Win Event', 'VIP Preview Event', 'Grand Opening Specials', 'Inventory Blowout Sale',
  'Employee Pricing Event', 'Red Tag Clearance Event',
];

const WORKFLOW_CYCLE: ProjectWorkflowStatus[] = [
  'in_progress', 'awaiting_approval', 'pending_changes', 'assets_generated_no_approval',
  'awaiting_approval', 'assets_generated', 'campaign_loaded',
];

const CREATOR_POOL = [
  { name: 'Michael Stuart', avatar: 'https://i.pravatar.cc/32?img=52' },
  { name: 'Chloe Sinclair', avatar: 'https://i.pravatar.cc/32?img=45' },
  { name: 'Felix Orbit', avatar: 'https://i.pravatar.cc/32?img=33' },
  { name: 'Maite Espino', avatar: 'https://i.pravatar.cc/32?img=47' },
  { name: 'Henry Nova', avatar: 'https://i.pravatar.cc/32?img=12' },
  { name: 'Ava Brooks', avatar: 'https://i.pravatar.cc/32?img=32' },
];

const LAST_UPDATED_CYCLE = ['Just now', '1 hour ago', '3 hours ago', 'Yesterday', '2 days ago', '4 days ago', '1 week ago', '2 weeks ago'];

const MONTH_CYCLE: { start: string; end: string; created: string }[] = [
  { start: 'Jan 1, 2026', end: 'Jan 31, 2026', created: '01/2026' },
  { start: 'Feb 1, 2026', end: 'Feb 28, 2026', created: '02/2026' },
  { start: 'Mar 1, 2026', end: 'Mar 31, 2026', created: '03/2026' },
  { start: 'Apr 1, 2026', end: 'Apr 30, 2026', created: '04/2026' },
  { start: 'May 1, 2026', end: 'May 31, 2026', created: '05/2026' },
  { start: 'Jun 1, 2026', end: 'Jun 30, 2026', created: '06/2026' },
  { start: 'Jul 1, 2026', end: 'Jul 31, 2026', created: '07/2026' },
  { start: 'Aug 1, 2026', end: 'Aug 31, 2026', created: '08/2026' },
  { start: 'Sep 1, 2026', end: 'Sep 30, 2026', created: '09/2026' },
  { start: 'Oct 1, 2026', end: 'Oct 31, 2026', created: '10/2026' },
  { start: 'Nov 1, 2026', end: 'Nov 30, 2026', created: '11/2026' },
  { start: 'Dec 1, 2026', end: 'Dec 31, 2026', created: '12/2026' },
];

// Usable (non swap-only) offer/template ids, reused across every generated project.
const OFFER_ID_POOL = OFFERS.filter((o) => !o.swapOnly).map((o) => o.id);
const TEMPLATE_ID_POOL = TEMPLATES.map((t) => t.id);

/** Best-effort accordion status per workflow stage — only needs to look plausible on the Overview page. */
function sectionStatusFor(status: ProjectWorkflowStatus): ProjectSectionStatus {
  switch (status) {
    case 'in_progress':
      return { offers: 'done', templates: 'in_progress', themeAndLogos: 'draft', assets: 'draft', adShells: 'draft', campaigns: 'draft' };
    case 'pending_changes':
      return { offers: 'done', templates: 'done', themeAndLogos: 'done', assets: 'in_progress', adShells: 'draft', campaigns: 'draft' };
    case 'assets_generated_no_approval':
    case 'awaiting_approval':
      return { offers: 'done', templates: 'done', themeAndLogos: 'done', assets: 'in_progress', adShells: 'draft', campaigns: 'draft' };
    case 'assets_generated':
      return { offers: 'done', templates: 'done', themeAndLogos: 'done', assets: 'done', adShells: 'in_progress', campaigns: 'draft' };
    case 'campaign_loaded':
    case 'live':
      return { offers: 'done', templates: 'done', themeAndLogos: 'done', assets: 'done', adShells: 'done', campaigns: 'done' };
    default:
      return { offers: 'draft', templates: 'draft', themeAndLogos: 'draft', assets: 'draft', adShells: 'draft', campaigns: 'draft' };
  }
}

function offersWindow(start: number, size: number): Offer[] {
  return Array.from({ length: size }, (_, j) => offerById(OFFER_ID_POOL[(start + j) % OFFER_ID_POOL.length]));
}

function templatesWindow(start: number, size: number): Template[] {
  return Array.from({ length: size }, (_, j) => templateById(TEMPLATE_ID_POOL[(start + j) % TEMPLATE_ID_POOL.length]));
}

function buildGeneratedProjects(): Project[] {
  const projects: Project[] = [];

  // 8 Evergreen projects — one per account, for the first 8 dealerships.
  DEALERSHIPS.slice(0, EVERGREEN_DEALERSHIP_COUNT).forEach((dealership, i) => {
    const templates = templatesWindow(i % TEMPLATE_ID_POOL.length, 1);
    const backgrounds = byTemplateIds(templates.map((t) => t.id));
    const id = `proj-evergreen-${slugify(dealership.name)}`;
    const offers = offersWindow(i, 6);
    projects.push({
      id,
      accountName: dealership.name,
      accountCode: dealership.code,
      projectName: `Evergreen ${dealership.name}`,
      projectCode: `EVG0000${i + 2}_${dealership.code}_Evergreen`,
      brandTag: 'BMW',
      workflowStatus: 'live',
      startDate: MONTH_CYCLE[i % MONTH_CYCLE.length].start,
      endDate: '∞',
      creator: 'AI AutoAgent',
      creatorAvatar: constellationLogo,
      lastUpdated: LAST_UPDATED_CYCLE[i % LAST_UPDATED_CYCLE.length],
      created: MONTH_CYCLE[i % MONTH_CYCLE.length].created,
      accountUrl: dealership.url,
      isEvergreen: true,
      approvalEnabled: false,
      locked: true,
      offers,
      templates,
      backgrounds,
      alerts: buildSampleEvergreenAlerts(offers, id),
      sectionStatus: sectionStatusFor('live'),
    });
  });

  // 22 non-Evergreen projects, round-robin across all 12 dealerships.
  CAMPAIGN_NAMES.forEach((name, i) => {
    const dealership = DEALERSHIPS[i % DEALERSHIPS.length];
    const status = WORKFLOW_CYCLE[i % WORKFLOW_CYCLE.length];
    const creator = CREATOR_POOL[i % CREATOR_POOL.length];
    const month = MONTH_CYCLE[i % MONTH_CYCLE.length];
    const offers = offersWindow(i * 3, 3 + (i % 4));
    const templates = templatesWindow(i % TEMPLATE_ID_POOL.length, 1 + (i % 3));
    const backgrounds = byTemplateIds(templates.map((t) => t.id));

    projects.push({
      id: `proj-gen-${slugify(dealership.name)}-${slugify(name)}`,
      accountName: dealership.name,
      accountCode: dealership.code,
      projectName: name,
      projectCode: `WF${61000 + i}_${dealership.code}_${slugify(name).replace(/-/g, '')}`,
      brandTag: 'BMW',
      workflowStatus: status,
      startDate: month.start,
      endDate: month.end,
      creator: creator.name,
      creatorAvatar: creator.avatar,
      lastUpdated: LAST_UPDATED_CYCLE[(i + 3) % LAST_UPDATED_CYCLE.length],
      created: month.created,
      accountUrl: dealership.url,
      offers,
      templates,
      backgrounds,
      sectionStatus: sectionStatusFor(status),
    });
  });

  return projects;
}

export const PROJECTS: Project[] = [...HAND_WRITTEN_PROJECTS, ...buildGeneratedProjects()];

export const DEFAULT_PROJECT_ID = PROJECTS[0].id;

export const getProjectById = (id: string): Project =>
  PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];

// ── Slug-based routing helpers ──────────────────────────────────────────────────
// Project pages are addressed as /projects/:accountSlug/:projectSlug — both derived
// on the fly from accountName/projectName rather than stored, so the URL always
// reflects the current display names.

export const getAccountSlug = (project: Project): string => slugify(project.accountName);
export const getProjectSlug = (project: Project): string => slugify(project.projectName);

/** Builds the URL for a project's Overview page, or one of its task pages when `subpath` is given (e.g. "offers"). */
export const getProjectPath = (project: Project, subpath?: string): string => {
  const base = `/projects/${getAccountSlug(project)}/${getProjectSlug(project)}`;
  return subpath ? `${base}/${subpath}` : base;
};

export const getProjectBySlugs = (accountSlug: string, projectSlug: string): Project | undefined =>
  PROJECTS.find((p) => getAccountSlug(p) === accountSlug && getProjectSlug(p) === projectSlug);

/** Convenience wrapper for call sites that only have a project id on hand (not the full Project). */
export const getProjectPathById = (projectId: string, subpath?: string): string =>
  getProjectPath(getProjectById(projectId), subpath);
