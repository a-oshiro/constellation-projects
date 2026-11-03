import { useMemo } from 'react';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { buildHighlightSegments, hexToRgba } from '../../../utils/disclosureSnippetColors';

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
