import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { diffText } from '../../../utils/disclosureDiff';
import { collectTaggedItems, useDiffMarkers } from '../../../utils/diffMarkers';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { buildHighlightSegments, hexToRgba } from '../../../utils/disclosureSnippetColors';
import { DIFF_GUTTER_WIDTH, DiffGutter } from './DiffGutter';

/**
 * Read-only raw disclosure with the client's changes marked against the text the snippet was last built
 * from (Figma flow A2): removed wording in red with a strikethrough, added wording in green, and a "−" /
 * "+" icon pinned in the gutter of every line that holds a change. Unchanged and added wording keep the
 * color-matched variable highlights.
 */

const TEXT_STYLE: CSSProperties = {
  position: 'relative', margin: 0, padding: `0 3px 0 ${DIFF_GUTTER_WIDTH}px`, boxSizing: 'border-box',
  fontFamily: 'Roboto, sans-serif', fontSize: 12, lineHeight: '28px', letterSpacing: '0.15px',
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
  overflowY: 'auto', scrollbarGutter: 'stable', color: '#1f1d25',
};

interface DisclosureDiffViewProps {
  oldText: string;
  newText: string;
  replacements: DisclosureReplacement[];
  colors: Record<string, string>;
  height: number;
  ariaLabel: string;
}

export function DisclosureDiffView({ oldText, newText, replacements, colors, height, ariaLabel }: DisclosureDiffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => diffText(oldText, newText), [oldText, newText]);
  const markers = useDiffMarkers(containerRef, collectTaggedItems, [parts, replacements, colors]);

  return (
    <div ref={containerRef} role="document" aria-label={ariaLabel} style={{ ...TEXT_STYLE, height, width: '100%' }}>
      <DiffGutter markers={markers} />
      {parts.map((part, i) => {
        if (part.type === 'removed') {
          return (
            <span key={i} data-diff="removed" style={{ background: 'rgba(211,47,47,0.12)', color: '#b71c1c', textDecoration: 'line-through' }}>
              {part.text}
            </span>
          );
        }
        const segments = buildHighlightSegments(part.text, replacements, colors);
        const content = segments.map((seg, k) => (
          seg.color
            ? <span key={k} style={{ background: hexToRgba(seg.color, 0.1), border: `1px solid ${seg.color}`, borderRadius: 4, padding: '4px 2px' }}>{seg.text}</span>
            : <span key={k}>{seg.text}</span>
        ));
        if (part.type === 'added') {
          return <span key={i} data-diff="added" style={{ background: 'rgba(46,125,50,0.12)', color: '#1b5e20' }}>{content}</span>;
        }
        return <span key={i}>{content}</span>;
      })}
    </div>
  );
}
