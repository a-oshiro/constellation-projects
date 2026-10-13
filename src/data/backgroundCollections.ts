// The background collections a project can draw from. A collection is one creative
// at every size, so it brings a background for each template of the project it is
// added to. The first five are the ones the mock projects already carry (their
// backgrounds are named "<size> Background N"); the rest are offered but not yet used.

import type { Background, Template } from './types';
import { BACKGROUNDS } from './mockData';

export interface BackgroundCollection { key: string; name: string }

export const BACKGROUND_COLLECTIONS: BackgroundCollection[] = [
  { key: 'Background 1', name: 'Abstract Blue Black' },
  { key: 'Background 2', name: 'Abstract Dark' },
  { key: 'Background 3', name: 'Abstract Golden Shadows' },
  { key: 'Background 4', name: 'Abstract Light' },
  { key: 'Background 5', name: 'Abstract Orange Waves' },
  { key: 'Background 6', name: 'Abstract Purple' },
  { key: 'Background 7', name: 'Abstract Red Bokeh' },
  { key: 'Background 8', name: 'Abstract Teal Glow' },
  { key: 'Background 9', name: 'Studio Gray Gradient' },
];

export const collectionName = (key: string) => BACKGROUND_COLLECTIONS.find((c) => c.key === key)?.name ?? key;

/** The collection's background for one template: the real one when the mock data has it, otherwise a stand-in picture at that size. */
const backgroundFor = (collection: BackgroundCollection, template: Template): Background => {
  const real = BACKGROUNDS.find((b) => b.templateId === template.id && b.name.endsWith(collection.key));
  if (real) return real;
  const pool = BACKGROUNDS.filter((b) => b.templateId === template.id);
  const index = BACKGROUND_COLLECTIONS.indexOf(collection);
  return {
    id: `bg-${collection.key.replace(/\s+/g, '-').toLowerCase()}-${template.id}`,
    templateId: template.id,
    url: pool.length ? pool[index % pool.length].url : '',
    name: `${template.width}x${template.height} ${collection.key}`,
  };
};

/** The collection at every size of the given templates. */
export const collectionBackgrounds = (key: string, templates: readonly Template[]): Background[] => {
  const collection = BACKGROUND_COLLECTIONS.find((c) => c.key === key);
  return collection ? templates.map((t) => backgroundFor(collection, t)) : [];
};

/** A picture for the collection, for the picker. */
export const collectionThumb = (key: string): string => {
  const collection = BACKGROUND_COLLECTIONS.find((c) => c.key === key);
  const sample = BACKGROUNDS.find((b) => b.templateId === 'tmpl-2');
  if (!collection) return sample?.url ?? '';
  const real = BACKGROUNDS.find((b) => b.name.endsWith(collection.key));
  return real?.url ?? BACKGROUNDS[BACKGROUND_COLLECTIONS.indexOf(collection) % BACKGROUNDS.length].url;
};
