import type { LineMarker } from '../../../utils/diffMarkers';

/** Width reserved on the left of diffed text for the gutter icons — pad the scroll container by this. */
export const DIFF_GUTTER_WIDTH = 44;

const ICON_SIZE = 14;

const ICON_STYLE = {
  position: 'absolute', width: ICON_SIZE, height: ICON_SIZE, borderRadius: '50%', color: '#ffffff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
  fontFamily: 'Roboto, sans-serif', lineHeight: 1,
} as const;

const ICONS = {
  removed: { glyph: '−', background: '#d32f2f', label: 'Removed' },
  added: { glyph: '+', background: '#2e7d32', label: 'Added' },
} as const;

/**
 * Code-diff style gutter: a "−" (removed) or "+" (added) circle pinned to the left of each wrapped line
 * that holds changed text, like GitHub's diff view. Render it inside the position:relative scroll
 * container the markers were measured against, so the icons scroll with the text.
 */
export const DiffGutter = ({ markers }: { markers: LineMarker[] }) => (
  <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, width: DIFF_GUTTER_WIDTH, height: 0, pointerEvents: 'none' }}>
    {markers.map((marker) => marker.types.map((type, i) => (
      <span
        key={`${Math.round(marker.top)}-${type}`}
        title={ICONS[type].label}
        style={{ ...ICON_STYLE, top: marker.top - ICON_SIZE / 2, left: 8 + i * (ICON_SIZE + 2), background: ICONS[type].background }}
      >
        {ICONS[type].glyph}
      </span>
    )))}
  </div>
);
