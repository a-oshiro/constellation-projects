import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { DisclosureReplacement, HighlightSegment } from '../../../utils/disclosureSnippetColors';
import { buildHighlightSegments, hexToRgba } from '../../../utils/disclosureSnippetColors';

// Editable raw disclosure with the templatized values color-matched in place. A transparent <textarea>
// sits on top of a mirror <div> that renders the same text with each replaced value highlighted —
// both share identical typography, padding and scrollbar gutter so the wrapped lines line up exactly.
// Highlights take their padding and 1px border (same as the template's variable chips) back out with an
// equal negative margin, so they never shift a glyph; the shared inline padding keeps a highlight at the
// start of a line from being clipped, and the 28px line height leaves room for the vertical padding.

/** Space between a highlighted value and its border. Sideways it's capped so padding + border (3px) stays
 * within the width of the space before/after the value instead of running into the neighboring words. */
const HIGHLIGHT_PAD_X = 2;
const HIGHLIGHT_PAD_Y = 4;
const HIGHLIGHT_BORDER = 1;

const TEXT_STYLE: CSSProperties = {
  margin: 0, padding: `0 ${HIGHLIGHT_PAD_X + HIGHLIGHT_BORDER}px`, border: 0, boxSizing: 'border-box',
  fontFamily: 'Roboto, sans-serif', fontSize: 12, lineHeight: '28px', letterSpacing: '0.15px',
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word',
  overflowY: 'auto', scrollbarGutter: 'stable',
};

/** Pulls a "$" sitting right before a highlighted amount into the highlight, so "$2,999" reads as one value. */
function withLeadingDollarSigns(segments: HighlightSegment[]): HighlightSegment[] {
  return segments.flatMap((seg, i) => {
    const next = segments[i + 1];
    if (!seg.color && next?.color && seg.text.endsWith('$') && !next.text.startsWith('$')) {
      next.text = `$${next.text}`;
      return seg.text.length > 1 ? [{ text: seg.text.slice(0, -1) }] : [];
    }
    return [seg];
  });
}

interface DisclosureRawInputProps {
  value: string;
  onChange: (value: string) => void;
  replacements: DisclosureReplacement[];
  colors: Record<string, string>;
  placeholder?: string;
  height: number;
  ariaLabel: string;
}

export function DisclosureRawInput({ value, onChange, replacements, colors, placeholder, height, ariaLabel }: DisclosureRawInputProps) {
  const mirrorRef = useRef<HTMLDivElement>(null);
  const segments = useMemo(() => withLeadingDollarSigns(buildHighlightSegments(value, replacements, colors)), [value, replacements, colors]);

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <div ref={mirrorRef} aria-hidden style={{ ...TEXT_STYLE, position: 'absolute', inset: 0, color: '#1f1d25', pointerEvents: 'none' }}>
        {value === '' && placeholder ? <span style={{ color: '#9c99a9' }}>{placeholder}</span> : segments.map((seg, i) => (
          seg.color ? (
            <span
              key={i}
              style={{
                background: hexToRgba(seg.color, 0.1), border: `${HIGHLIGHT_BORDER}px solid ${seg.color}`, borderRadius: 4,
                padding: `${HIGHLIGHT_PAD_Y}px ${HIGHLIGHT_PAD_X}px`, margin: `0 -${HIGHLIGHT_PAD_X + HIGHLIGHT_BORDER}px`,
                boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {seg.text}
            </span>
          ) : <span key={i}>{seg.text}</span>
        ))}
        {/* A trailing newline in a <div> collapses; this keeps the mirror as tall as the textarea's content. */}
        {'​'}
      </div>
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => { if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop; }}
        spellCheck={false}
        style={{
          ...TEXT_STYLE, position: 'absolute', inset: 0, width: '100%', height: '100%', resize: 'none', outline: 'none',
          background: 'transparent', color: 'transparent', caretColor: '#1f1d25',
        }}
      />
    </div>
  );
}
