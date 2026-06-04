import ReactDOM from 'react-dom';
import { useTestWidget, WIDGET_EXPANDED_WIDTH, WIDGET_COLLAPSED_WIDTH, SHOW_TEST_WIDGET } from '../../context/TestWidgetContext';
import script from '../../data/testScript.json';

export const TestWidget = () => {
  const { expanded, setExpanded, widgetWidth } = useTestWidget();

  // ── Visual panel — portaled to document.body so it shares the root
  // stacking context with other portals (AssetDetailsDialog, LargePreviewModal,
  // ComparisonModal, etc.) and z-index: 99999 reliably wins over all of them.
  const panel = (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: widgetWidth,
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid #d6d8da',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        zIndex: 99999,
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#686576' }}>
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

  if (!SHOW_TEST_WIDGET) return null;

  return (
    <>
      {/* Spacer: keeps the flex layout intact so app content is pushed to the right */}
      <div
        style={{
          width: expanded ? WIDGET_EXPANDED_WIDTH : WIDGET_COLLAPSED_WIDTH,
          flexShrink: 0,
          transition: 'width 0.2s ease',
        }}
      />
      {/* Visual panel: portaled to body, shares root stacking context with all other portals */}
      {ReactDOM.createPortal(panel, document.body)}
    </>
  );
};
