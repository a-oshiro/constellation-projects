// The parts of a project's "Project defaults" that the prototype's Project
// record does not carry — custom variables, logos, audio — plus tags. Seeded
// deterministically per project so a multi-project selection has a realistic
// mix of shared and differing values, and held in memory for the session
// (same contract as enrollmentSettingsStore: a reload puts everything back).
//
// Templates and backgrounds live on the Project itself.

import type { Project } from './projects';
import { EVERGREEN_LIFESTYLE } from './lifestyle';
import type { IgnoreProduct, LifestyleItem } from './lifestyle';
import bmwRoundel from '../assets/bmw-logo.png';
import bmwLogo1 from '../assets/logos/bmw-logo-1.png';
import bmwLogo2 from '../assets/logos/bmw-logo-2.png';
import bmwMLogo from '../assets/logos/bmw-m-logo.png';
import bmwFourthOfJuly from '../assets/logos/bmw-4th-of-july-event.png';
import bmwUltimate from '../assets/logos/bmw-ultimate-event.png';
import bmwCertified from '../assets/logos/bmw-certified-event.png';

export interface CustomVariable { id: string; name: string; value: string }

/** Where a logo sits on a creative — the live app's "placeholders". */
export type LogoSlot = 'Primary Logo' | 'Secondary Logo' | 'Event Logo';

export interface ProjectLogo {
  id: string; name: string; slot: LogoSlot; scope: string; color: string;
  /** Image, size and file type, as the picture and the file line of the logo library show them. */
  src?: string; width?: number; height?: number; format?: string;
  /** Event logos only: the dates the logo runs, as "Mon D, YYYY". */
  startDate?: string; endDate?: string;
}

export interface ProjectAudio { id: string; name: string; placeholder: string; seconds: number }

export interface ProjectExtras {
  tags: string[];
  customVariables: CustomVariable[];
  logos: ProjectLogo[];
  audio: ProjectAudio[];
  lifestyle: LifestyleItem[];
  ignoreProduct: IgnoreProduct;
}

const VARIABLE_POOL: CustomVariable[] = [
  { id: 'var-cta-learn', name: 'cta_text', value: 'Learn More' },
  { id: 'var-cta-shop', name: 'cta_text', value: 'Shop Now' },
  { id: 'var-disclaimer', name: 'disclaimer_label', value: 'See dealer for details' },
  { id: 'var-phone', name: 'sales_phone', value: '(206) 555-0142' },
];


/** Every logo the library offers a project, whether or not a project already carries it. */
export const LOGO_LIBRARY: ProjectLogo[] = [
  { id: 'logo-roundel', name: 'BMW_Roundel.png', slot: 'Primary Logo', scope: 'Project default', color: '#1c69d4', src: bmwRoundel, width: 180, height: 180, format: 'PNG' },
  { id: 'logo-white', name: 'BMW_White_Logo.png', slot: 'Secondary Logo', scope: 'Project default', color: '#0f3d7a', src: bmwRoundel, width: 180, height: 180, format: 'PNG' },
  { id: 'logo-event', name: 'BMW_Event_Lockup.png', slot: 'Event Logo', scope: 'Project default', color: '#6356e1', src: bmwRoundel, width: 180, height: 180, format: 'PNG' },
  { id: 'logo-bmw-1', name: 'BMW_logo1.png', slot: 'Primary Logo', scope: 'Project default', color: '#1c69d4', src: bmwLogo1, width: 1280, height: 1280, format: 'PNG' },
  { id: 'logo-bmw-2', name: 'BMW_logo2.png', slot: 'Secondary Logo', scope: 'Project default', color: '#1c69d4', src: bmwLogo2, width: 512, height: 512, format: 'PNG' },
  { id: 'logo-bmw-m', name: 'BMW_M_logo1.png', slot: 'Secondary Logo', scope: 'Project default', color: '#1c69d4', src: bmwMLogo, width: 3840, height: 2160, format: 'PNG' },
  { id: 'logo-event-july', name: 'BMW_4th of july_sales event_logo.png', slot: 'Event Logo', scope: 'Project default', color: '#6356e1', src: bmwFourthOfJuly, width: 500, height: 169, format: 'PNG' },
  { id: 'logo-event-ultimate', name: 'BMW_ultimate_sales event_logo.png', slot: 'Event Logo', scope: 'Project default', color: '#6356e1', src: bmwUltimate, width: 706, height: 339, format: 'PNG' },
  { id: 'logo-event-certified', name: 'BMW_certified_sales event_logo.png', slot: 'Event Logo', scope: 'Project default', color: '#6356e1', src: bmwCertified, width: 800, height: 800, format: 'PNG' },
];

const AUDIO_POOL: Omit<ProjectAudio, 'id'>[] = [
  { name: 'Brand_Jingle_15s', placeholder: 'Audio 1', seconds: 15 },
  { name: 'VO_ENG_Specials', placeholder: 'Audio 1', seconds: 4 },
];

const TAG_POOL = ['Q4', 'Specials', 'Lease', 'Certified', 'Service'];

/** A small stable number from a string — enough to vary the seeds. */
const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

function seed(project: Project): ProjectExtras {
  const h = hash(project.id);
  const variables = [
    VARIABLE_POOL[h % 2],            // cta_text: Learn More or Shop Now — differs across projects
    VARIABLE_POOL[2],                // shared by everyone
    ...(h % 3 === 0 ? [VARIABLE_POOL[3]] : []),
  ];
  // Every project carries the primary logo and nothing else.
  const logos = [LOGO_LIBRARY[0]];
  const audio: ProjectAudio[] = h % 4 === 0
    ? []
    : [{ id: h % 2 ? 'audio-jingle' : `audio-vo-${project.id}`, ...AUDIO_POOL[h % 2 ? 0 : 1], name: h % 2 ? AUDIO_POOL[0].name : `VO_ENG_${project.accountName.replace(/\s+/g, '-')}` }];
  return {
    tags: [TAG_POOL[h % TAG_POOL.length], ...(h % 3 === 0 ? [TAG_POOL[(h + 2) % TAG_POOL.length]] : [])],
    customVariables: variables,
    logos,
    audio,
    // Evergreen projects start with a couple of vehicle clips; the others have none yet.
    lifestyle: project.isEvergreen ? [...EVERGREEN_LIFESTYLE] : [],
    ignoreProduct: { images: true, videos: true },
  };
}

const store = new Map<string, ProjectExtras>();

export const getProjectExtras = (project: Project): ProjectExtras => {
  let extras = store.get(project.id);
  if (!extras) { extras = seed(project); store.set(project.id, extras); }
  return extras;
};

export const saveProjectExtras = (projectId: string, extras: ProjectExtras) => { store.set(projectId, extras); };
