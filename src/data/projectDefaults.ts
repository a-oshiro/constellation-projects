// The parts of a project's "Project defaults" that the prototype's Project
// record does not carry — custom variables, logos, audio — plus tags. Seeded
// deterministically per project so a multi-project selection has a realistic
// mix of shared and differing values, and held in memory for the session
// (same contract as enrollmentSettingsStore: a reload puts everything back).
//
// Templates and backgrounds live on the Project itself.

import type { Project } from './projects';

export interface CustomVariable { id: string; name: string; value: string }

/** Where a logo sits on a creative — the live app's "placeholders". */
export type LogoSlot = 'Primary Logo' | 'Secondary Logo' | 'Event Logo';

export interface ProjectLogo { id: string; name: string; slot: LogoSlot; scope: string; color: string }

export interface ProjectAudio { id: string; name: string; placeholder: string; seconds: number }

export interface ProjectExtras {
  tags: string[];
  customVariables: CustomVariable[];
  logos: ProjectLogo[];
  audio: ProjectAudio[];
}

const VARIABLE_POOL: CustomVariable[] = [
  { id: 'var-cta-learn', name: 'cta_text', value: 'Learn More' },
  { id: 'var-cta-shop', name: 'cta_text', value: 'Shop Now' },
  { id: 'var-disclaimer', name: 'disclaimer_label', value: 'See dealer for details' },
  { id: 'var-phone', name: 'sales_phone', value: '(206) 555-0142' },
];

const LOGO_POOL: ProjectLogo[] = [
  { id: 'logo-roundel', name: 'BMW_Roundel', slot: 'Primary Logo', scope: 'Project default', color: '#1c69d4' },
  { id: 'logo-white', name: 'BMW_White_Logo', slot: 'Secondary Logo', scope: 'Project default', color: '#0f3d7a' },
  { id: 'logo-event', name: 'BMW_Event_Lockup', slot: 'Event Logo', scope: 'Project default', color: '#6356e1' },
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
  const logos = [LOGO_POOL[0], ...(h % 2 === 0 ? [LOGO_POOL[1]] : []), ...(h % 5 === 0 ? [LOGO_POOL[2]] : [])];
  const audio: ProjectAudio[] = h % 4 === 0
    ? []
    : [{ id: h % 2 ? 'audio-jingle' : `audio-vo-${project.id}`, ...AUDIO_POOL[h % 2 ? 0 : 1], name: h % 2 ? AUDIO_POOL[0].name : `VO_ENG_${project.accountName.replace(/\s+/g, '-')}` }];
  return {
    tags: [TAG_POOL[h % TAG_POOL.length], ...(h % 3 === 0 ? [TAG_POOL[(h + 2) % TAG_POOL.length]] : [])],
    customVariables: variables,
    logos,
    audio,
  };
}

const store = new Map<string, ProjectExtras>();

export const getProjectExtras = (project: Project): ProjectExtras => {
  let extras = store.get(project.id);
  if (!extras) { extras = seed(project); store.set(project.id, extras); }
  return extras;
};

export const saveProjectExtras = (projectId: string, extras: ProjectExtras) => { store.set(projectId, extras); };
