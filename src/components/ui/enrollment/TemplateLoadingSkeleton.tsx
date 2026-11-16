import { useEffect, useState } from 'react';
import { Skeleton } from '@mui/material';
import { BODY2_SECONDARY_STYLE } from './disclosureStyles';

const LOADING_MESSAGES = [
  'Reading disclosure...',
  'Converting values into variables...',
  'Creating template...',
];
/** Delay between typed letters. */
const LETTER_MS = 30;
/** Time from one message starting to the next — longer than the longest message takes to type. */
const MESSAGE_MS = 1500;

/** Line widths for the skeleton paragraph — uneven, like wrapped disclosure text. */
const LINE_WIDTHS = ['100%', '96%', '100%', '88%', '100%', '72%'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Types each loading message out letter by letter, moving to the next every MESSAGE_MS. Stops on the
 * last message (it stays up until loading ends) rather than looping.
 */
function useTypewriter(messages: string[]) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  // Reduced motion: whole messages, still advancing.
  const [reducedMotion] = useState(prefersReducedMotion);
  const message = messages[index];

  // Typing.
  useEffect(() => {
    if (reducedMotion || length >= message.length) return;
    const t = setTimeout(() => setLength((n) => n + 1), LETTER_MS);
    return () => clearTimeout(t);
  }, [length, message, reducedMotion]);

  // Advancing to the next message.
  useEffect(() => {
    if (index >= messages.length - 1) return;
    const t = setTimeout(() => {
      setLength(0);
      setIndex((i) => i + 1);
    }, MESSAGE_MS);
    return () => clearTimeout(t);
  }, [index, messages.length]);

  return { message, typed: reducedMotion ? message : message.slice(0, length) };
}

/** The Constellation mark (the lockup's three arcs), its arcs lighting up in a wave from inner to outer. */
const ConstellationWave = () => (
  <svg className="constellation-wave" width={10} height={18} viewBox="0 0 18 33" fill="#473bab" aria-hidden style={{ flexShrink: 0 }}>
    <path d="M17.2606 8.04418C17.0772 8.03238 16.8938 8.02648 16.7046 8.02648C12.3995 8.02648 8.90834 11.6207 8.90834 16.053C8.90834 20.4852 12.3995 24.0794 16.7046 24.0794C16.8938 24.0794 17.0772 24.0735 17.2606 24.0558C13.2135 23.7607 10.0262 20.2905 10.0262 16.053C10.0262 11.8155 13.2192 8.34518 17.2606 8.05009V8.04418Z" />
    <path d="M6.12234 16.0471C6.12234 9.69079 10.909 4.48539 16.9797 4.04275C16.7046 4.02504 16.4237 4.01324 16.1428 4.01324C9.68797 4.01324 4.45417 9.4016 4.45417 16.0471C4.45417 22.6925 9.68797 28.0809 16.1428 28.0809C16.4237 28.0809 16.7046 28.0691 16.9797 28.0514C10.9147 27.6087 6.12234 22.4033 6.12234 16.0471Z" />
    <path d="M2.22422 16.0471C2.22422 7.57204 8.61025 0.631495 16.6988 0.0413128C16.332 0.0118036 15.9594 0 15.5867 0C6.97648 0 0 7.18252 0 16.0471C0 24.9116 6.97648 32.0941 15.5867 32.0941C15.9594 32.0941 16.332 32.0823 16.6988 32.0528C8.61025 31.4626 2.22422 24.5221 2.22422 16.0471Z" />
  </svg>
);

/** Loading state for a disclosure's "Resulting Template" pane while the template is being generated. */
export const TemplateLoadingSkeleton = () => {
  const { message, typed } = useTypewriter(LOADING_MESSAGES);

  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Screen readers get each whole message once, not every typed letter. */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        {message}
      </span>
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 20 }}>
        <ConstellationWave />
        <p style={{ ...BODY2_SECONDARY_STYLE, lineHeight: '20px' }}>
          {typed}
          <span className="template-typewriter-caret" style={{ marginLeft: 1 }}>|</span>
        </p>
      </div>
      <style>{`
        @keyframes template-typewriter-blink { 50% { opacity: 0; } }
        .template-typewriter-caret { animation: template-typewriter-blink 1s step-end infinite; }
        @keyframes constellation-wave { 0%, 60%, 100% { opacity: 0.25; } 30% { opacity: 1; } }
        .constellation-wave path { opacity: 0.25; animation: constellation-wave 1.2s ease-in-out infinite; }
        .constellation-wave path:nth-child(2) { animation-delay: 0.15s; }
        .constellation-wave path:nth-child(3) { animation-delay: 0.3s; }
        @media (prefers-reduced-motion: reduce) {
          .template-typewriter-caret { animation: none; }
          .constellation-wave path { animation: none; opacity: 1; }
        }
      `}</style>
      {/* Lines sized to the template editor's 28px rows, so the result drops in without a jump. */}
      <div aria-hidden style={{ paddingTop: 8 }}>
        {LINE_WIDTHS.map((width, i) => (
          <Skeleton key={i} variant="rounded" animation="wave" width={width} height={12} sx={{ marginBottom: '16px', borderRadius: '4px' }} />
        ))}
      </div>
    </div>
  );
};
