import { useMemo } from 'react';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { hexToRgba } from '../../../utils/disclosureSnippetColors';

interface Segment {
  text: string;
  color?: string;
}

/** Finds each replacement's `original` substring in `sourceText` (skipping ones with no active color, and never re-matching a span already claimed by an earlier replacement), then slices the source into plain/colored segments in left-to-right order. */
function buildHighlightSegments(sourceText: string, replacements: DisclosureReplacement[], colors: Record<string, string>): Segment[] {
  const claimed: { start: number; end: number; color: string }[] = [];

  for (const r of replacements) {
    const color = colors[r.key];
    if (!color || !r.original) continue;
    let searchFrom = 0;
    while (searchFrom <= sourceText.length) {
      const idx = sourceText.indexOf(r.original, searchFrom);
      if (idx === -1) break;
      const end = idx + r.original.length;
      const overlaps = claimed.some((m) => idx < m.end && end > m.start);
      if (!overlaps) {
        claimed.push({ start: idx, end, color });
        break;
      }
      searchFrom = idx + 1;
    }
  }

  claimed.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const m of claimed) {
    if (m.start > cursor) segments.push({ text: sourceText.slice(cursor, m.start) });
    segments.push({ text: sourceText.slice(m.start, m.end), color: m.color });
    cursor = m.end;
  }
  if (cursor < sourceText.length) segments.push({ text: sourceText.slice(cursor) });
  return segments;
}

interface DisclosureSourcePaneProps {
  sourceText: string;
  replacements: DisclosureReplacement[];
  colors: Record<string, string>;
}

/** Read-only rendering of the original, client-provided disclosure text for the snippet builder's comparison view — never editable, only the outcome snippet is. */
export function DisclosureSourcePane({ sourceText, replacements, colors }: DisclosureSourcePaneProps) {
  const segments = useMemo(() => buildHighlightSegments(sourceText, replacements, colors), [sourceText, replacements, colors]);

  return (
    <div style={{
      fontFamily: 'Roboto, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#1f1d25',
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }}>
      {segments.map((seg, i) => (seg.color ? (
        <span
          key={i}
          style={{
            background: hexToRgba(seg.color, 0.1),
            border: `1px solid ${seg.color}`,
            borderRadius: 4,
            padding: '0 2px',
          }}
        >
          {seg.text}
        </span>
      ) : (
        <span key={i}>{seg.text}</span>
      )))}
    </div>
  );
}
