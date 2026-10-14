// Lifestyle media: pictures and clips of a specific vehicle model, used in place of a plain background.
// Unlike a background they belong to a model, not to a template size.

import threeSeriesSquare from '../assets/lifestyle/2026-bmw-3-series-1080x1080.png';
import threeSeriesWide from '../assets/lifestyle/2026-bmw-3-series-1920x1080.png';
import x3Square from '../assets/lifestyle/2026-bmw-x3-1080x1080.png';
import x3Wide from '../assets/lifestyle/2026-bmw-x3-1920x1080.png';
import x5Square from '../assets/lifestyle/2026-bmw-x5-1080x1080.png';
import x5Wide from '../assets/lifestyle/2026-bmw-x5-1920x1080.png';
import x7Square from '../assets/lifestyle/2026-bmw-x7-1080x1080.png';
import x7Wide from '../assets/lifestyle/2026-bmw-x7-1920x1080.png';

export interface LifestyleItem {
  id: string;
  /** The file name, as it is in the portal. */
  name: string;
  kind: 'image' | 'video';
  /** The vehicle it shows. */
  model: string;
  width: number;
  height: number;
  /** A frame of the clip, or the picture itself. */
  poster: string;
}

const video = (model: string, width: number, height: number, poster: string): LifestyleItem => ({
  id: `life-${model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${width}x${height}`,
  name: `${model} - ${width}x${height}.mp4`,
  kind: 'video', model, width, height, poster,
});

/** Everything the portal offers, whether or not a project carries it yet. */
export const LIFESTYLE_LIBRARY: LifestyleItem[] = [
  video('2026 BMW 3 Series', 1080, 1080, threeSeriesSquare),
  video('2026 BMW 3 Series', 1920, 1080, threeSeriesWide),
  video('2026 BMW X3', 1080, 1080, x3Square),
  video('2026 BMW X3', 1920, 1080, x3Wide),
  video('2026 BMW X5', 1080, 1080, x5Square),
  video('2026 BMW X5', 1920, 1080, x5Wide),
  video('2026 BMW X7', 1080, 1080, x7Square),
  video('2026 BMW X7', 1920, 1080, x7Wide),
];

/** What an Evergreen project starts with: the 1080 x 1080 clips of the 3 Series and the X3. */
export const EVERGREEN_LIFESTYLE: LifestyleItem[] = LIFESTYLE_LIBRARY.filter(
  (l) => l.width === 1080 && (l.model === '2026 BMW 3 Series' || l.model === '2026 BMW X3'),
);

/** Whether lifestyle media leaves the template's product placeholder empty (the vehicle is already in the media). */
export interface IgnoreProduct { images: boolean; videos: boolean }
