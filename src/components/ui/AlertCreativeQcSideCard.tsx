import { CheckCircle, WarningAmberOutlined } from '@mui/icons-material';
import type { CreativeQcResult } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';

/**
 * Floating card to the left of the focused asset, shown when its "Creative QC" tag is clicked — same
 * floating-left shell as AlertOfferCard/AlertQcFindingCard, condensed from the full Creative QC tab
 * content (CreativeQcTabContent) down to just this one offer's sections/checks.
 */

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase',
};

const checkRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px',
};

interface AlertCreativeQcSideCardProps {
  result: CreativeQcResult;
}

export const AlertCreativeQcSideCard = ({ result }: AlertCreativeQcSideCardProps) => {
  const allChecks = result.sections.flatMap((s) => s.checks);
  const hasWarning = allChecks.some((c) => c.status === 'warning');
  const latestCheckedAt = Math.max(...result.sections.map((s) => s.checkedAt));

  return (
    <div
      style={{
        position: 'absolute', top: 0, right: '100%', marginRight: 24, width: 320, flexShrink: 0,
        background: '#ffffff', borderRadius: 12, padding: 12, boxSizing: 'border-box',
        boxShadow: '0px 1px 9px rgba(0,0,0,0.12), 0px 6px 5px rgba(0,0,0,0.14), 0px 3px 2.5px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasWarning
          ? <WarningAmberOutlined style={{ fontSize: 20, color: '#663C00', flexShrink: 0 }} />
          : <CheckCircle style={{ fontSize: 20, color: '#4caf50', flexShrink: 0 }} />}
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
          Creative QC
        </span>
      </div>

      {result.sections.map((section) => (
        <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={sectionLabelStyle}>{section.label}</span>
          {section.checks.map((check) => (
            <div key={check.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={checkRowStyle}>
                {check.status === 'passed'
                  ? <CheckCircle style={{ fontSize: 14, color: '#4caf50', flexShrink: 0, marginTop: 2 }} />
                  : <WarningAmberOutlined style={{ fontSize: 14, color: '#c45500', flexShrink: 0, marginTop: 2 }} />}
                <span>{check.label}</span>
              </div>
              {check.issues && check.issues.length > 0 && (
                <ul style={{ margin: '0 0 0 20px', padding: 0, listStyle: 'disc' }}>
                  {check.issues.map((issue) => (
                    <li key={issue} style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.5 }}>
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}

      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
        Checked {formatRelativeTime(latestCheckedAt)}
      </span>
    </div>
  );
};
