import { useState } from 'react';
import script from '../../data/testScript.json';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 52;

export const TestWidget = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        flexShrink: 0,
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid #d6d8da',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {expanded ? (
        /* ── Expanded state ─────────────────────────────── */
        <>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px 10px',
              borderBottom: '1px solid #d0d2d4',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                color: '#686576',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              Test Script
            </span>
            <button
              onClick={() => setExpanded(false)}
              title="Collapse"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: '#686576',
                flexShrink: 0,
              }}
            >
              {/* Left-pointing chevron: collapse */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Script content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {script.map((flow, fi) => (
              <div key={fi}>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: 15,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 700,
                    color: '#1f1d25',
                    lineHeight: 1.43,
                    letterSpacing: '0.1px',
                  }}
                >
                  {flow.title}
                </p>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {flow.steps.map((step, si) => (
                    <li
                      key={si}
                      style={{
                        fontSize: 13,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        color: '#3d3b47',
                        lineHeight: 1.5,
                        letterSpacing: '0.15px',
                      }}
                    >
                      ● {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── Collapsed state ────────────────────────────── */
        <button
          onClick={() => setExpanded(true)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 14,
          }}
        >
          {/* Right-pointing chevron — same vertical position as header arrow */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#686576' }}>
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* 'View Test Script' label — 12px below the arrow.
              writing-mode makes layout dims match visual dims, so marginTop is a true gap. */}
          <span
            style={{
              marginTop: 12,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: 12,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 600,
              color: '#686576',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Test Script
          </span>
        </button>
      )}
    </div>
  );
};
