import { useState } from 'react';
import { IconButton } from '@mui/material';
import { AccessTime, Cancel, Check, ExpandLess, ExpandMore } from '@mui/icons-material';
import type { CreativeQcResult, CreativeQcSection, Offer } from '../../data/types';

/**
 * "Creative QC" tab content — per screenshot 1: each checked offer's Template Rules / Render Check
 * sections, with a pass/needs-review pill, warning checks called out with their specific issues, the
 * remaining passed checks tucked behind an expandable "N passed checks" disclosure, and a checked-at
 * timestamp. The trailing X/clock/check icons are a visual-only manual-override affordance (not wired to
 * any state) — no backing "manually overridden" concept exists in the data model yet.
 */

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.6px', textTransform: 'uppercase',
};

const pill = (status: 'needs_review' | 'passed'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, letterSpacing: '0.4px',
  background: status === 'passed' ? '#edf7ed' : '#FDF4EC',
  color: status === 'passed' ? '#1b5e20' : '#c45500',
});

const CreativeQcSectionCard = ({ section }: { section: CreativeQcSection }) => {
  const [expanded, setExpanded] = useState(false);
  const warningChecks = section.checks.filter((c) => c.status === 'warning');
  const passedChecks = section.checks.filter((c) => c.status === 'passed');
  const sectionStatus = warningChecks.length > 0 ? 'needs_review' : 'passed';

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={sectionHeaderStyle}>{section.label}</span>
        <span style={pill(sectionStatus)}>{sectionStatus === 'passed' ? 'QC passed' : 'QC: needs review'}</span>
      </div>

      {warningChecks.map((check) => (
        <div key={check.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>{check.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#c45500' }}>Warning</span>
          </div>
          {check.issues && check.issues.length > 0 && (
            <>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Placeholders left empty</span>
              <ul style={{ margin: '0 0 0 18px', padding: 0, listStyle: 'disc' }}>
                {check.issues.map((issue) => (
                  <li key={issue} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', lineHeight: 1.6 }}>{issue}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}

      {passedChecks.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#473bab', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}
          >
            {expanded ? <ExpandLess style={{ fontSize: 16 }} /> : <ExpandMore style={{ fontSize: 16 }} />}
            {passedChecks.length} passed check{passedChecks.length === 1 ? '' : 's'}
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {passedChecks.map((check) => (
                <div key={check.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{check.label}</span>
                  <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#1b5e20' }}>Passed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>
          Checked {new Date(section.checkedAt).toLocaleString()}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconButton size="small" disabled sx={{ padding: '3px' }} title="Reject (not yet available)">
            <Cancel style={{ fontSize: 16, color: '#cac9cf' }} />
          </IconButton>
          <IconButton size="small" disabled sx={{ padding: '3px' }} title="Defer (not yet available)">
            <AccessTime style={{ fontSize: 16, color: '#cac9cf' }} />
          </IconButton>
          <IconButton size="small" disabled sx={{ padding: '3px' }} title="Approve (not yet available)">
            <Check style={{ fontSize: 16, color: '#cac9cf' }} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

interface CreativeQcTabContentProps {
  results: CreativeQcResult[];
  offers: Offer[];
}

export const CreativeQcTabContent = ({ results, offers }: CreativeQcTabContentProps) => {
  if (results.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
          No Creative QC issues to review for this alert.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {results.map((result) => {
        const offer = offers.find((o) => o.id === result.offerId);
        return (
          <div key={result.offerId} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offer && (
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
                {offer.vehicleName}{offer.vin ? ` · VIN ${offer.vin}` : ''}
              </span>
            )}
            {result.sections.map((section) => (
              <CreativeQcSectionCard key={section.id} section={section} />
            ))}
          </div>
        );
      })}
    </div>
  );
};
