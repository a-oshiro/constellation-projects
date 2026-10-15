// The background collections a project can draw from. A collection is one creative
// at every size, so it brings a background for each template of the project it is
// added to. The first five are the ones the mock projects already carry (their
// backgrounds are named "<size> Background N"); the rest are offered but not yet used.

import type { Background, Template } from './types';
import { BACKGROUNDS } from './mockData';

export interface BackgroundCollection { key: string; name: string }

export const BACKGROUND_COLLECTIONS: BackgroundCollection[] = [
  { key: 'Background 1', name: 'City Skyline' },
  { key: 'Background 2', name: 'Country Road Hill' },
  { key: 'Background 3', name: 'Mansion Porch' },
  { key: 'Background 5', name: 'Fall Foliage Road' },
  { key: 'Background 6', name: 'Abstract Purple' },
  { key: 'Background 7', name: 'Abstract Red Bokeh' },
  { key: 'Background 8', name: 'Abstract Teal Glow' },
  { key: 'Background 9', name: 'Studio Gray Gradient' },
];

/** Templates a collection has no size for. Those sizes can be generated with AI, per project. */
const MISSING_SIZES: Record<string, string[]> = {
  'Background 5': ['tmpl-1', 'tmpl-4'],
  'Background 6': ['tmpl-3'],
  'Background 7': ['tmpl-2'],
  'Background 8': ['tmpl-4'],
};

const hasSize = (collection: BackgroundCollection, template: Template) =>
  !(MISSING_SIZES[collection.key] ?? []).includes(template.id);

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
  return collection ? templates.filter((t) => hasSize(collection, t)).map((t) => backgroundFor(collection, t)) : [];
};

/** The size AI generates for a template the collection lacks. */
export const generatedBackground = (key: string, template: Template): Background | null => {
  const collection = BACKGROUND_COLLECTIONS.find((c) => c.key === key);
  return collection ? { ...backgroundFor(collection, template), id: `gen-${key.replace(/\s+/g, '-').toLowerCase()}-${template.id}` } : null;
};

/** A picture for the collection, for the picker. */
export const collectionThumb = (key: string): string => {
  const collection = BACKGROUND_COLLECTIONS.find((c) => c.key === key);
  const sample = BACKGROUNDS.find((b) => b.templateId === 'tmpl-2');
  if (!collection) return sample?.url ?? '';
  const real = BACKGROUNDS.find((b) => b.name.endsWith(collection.key));
  return real?.url ?? BACKGROUNDS[BACKGROUND_COLLECTIONS.indexOf(collection) % BACKGROUNDS.length].url;
};
