import { useState } from 'react';
import { IconButton } from '@mui/material';
import { AccessTime, Cancel, Check, ExpandLess, ExpandMore, WarningAmberOutlined, CheckCircle } from '@mui/icons-material';
import type { CreativeQcResult, CreativeQcSection, Offer } from '../../data/types';
import { creativeQcHasWarning, passedCreativeQcResult } from '../../utils/alertQc';
import { QcOfferContainer } from './QcOfferContainer';

/**
 * "Creative QC" tab content — one container per asset (offer) in the alert, stacked. Each container has
 * the offer name + VIN on top, that asset's warnings (if any) right below it, then every section
 * (Template Rules, Render Check) as an accordion listing all of its checks, passed and warning alike.
 * Offers with no recorded Creative QC result get an all-passed result, so every asset is accounted for.
 * Assets with warnings are listed first. The trailing X/clock/check icons are a visual-only
 * manual-override affordance (not wired to any state) — no "manually overridden" concept exists yet.
 */

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.6px', textTransform: 'uppercase',
};

/** One section (Template Rules / Render Check) as an accordion — collapsed by default when it passed,
 * expanded when it has warnings — listing every check with its status. */
const SectionAccordion = ({ section }: { section: CreativeQcSection }) => {
  const warningCount = section.checks.filter((c) => c.status === 'warning').length;
  const [expanded, setExpanded] = useState(warningCount > 0);

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          border: 'none', background: '#fafafa', cursor: 'pointer', padding: '8px 10px',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {expanded ? <ExpandLess style={{ fontSize: 16, color: '#686576' }} /> : <ExpandMore style={{ fontSize: 16, color: '#686576' }} />}
          <span style={sectionHeaderStyle}>{section.label}</span>
        </span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: warningCount > 0 ? '#c45500' : '#1b5e20' }}>
          {warningCount > 0
            ? `${warningCount} warning${warningCount === 1 ? '' : 's'}`
            : `${section.checks.length} passed check${section.checks.length === 1 ? '' : 's'}`}
        </span>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px 10px' }}>
          {section.checks.map((check) => (
            <div key={check.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{check.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: check.status === 'warning' ? '#c45500' : '#1b5e20' }}>
                {check.status === 'warning' ? 'Warning' : 'Passed'}
              </span>
            </div>
          ))}
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', marginTop: 2 }}>
            Checked {new Date(section.checkedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

/** The asset's warning checks, called out right below its header with their specific issues. */
const WarningList = ({ result }: { result: CreativeQcResult }) => {
  const warnings = result.sections.flatMap((s) => s.checks.filter((c) => c.status === 'warning').map((c) => ({ section: s, check: c })));
  if (warnings.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FFF4E5' }}>
      {warnings.map(({ section, check }) => (
        <div key={`${section.id}-${check.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WarningAmberOutlined style={{ fontSize: 16, color: '#663C00', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#663C00' }}>{check.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#663C00', opacity: 0.8 }}>· {section.label}</span>
          </div>
          {check.issues && check.issues.length > 0 && (
            <ul style={{ margin: '0 0 0 22px', padding: 0, listStyle: 'disc' }}>
              {check.issues.map((issue) => (
                <li key={issue} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', lineHeight: 1.6 }}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

interface CreativeQcTabContentProps {
  results: CreativeQcResult[];
  /** Every offer in the alert, in display order — each gets a container even without a recorded result. */
  offers: Offer[];
  /** Timestamp shown on synthesized all-passed results. */
  fallbackCheckedAt: number;
  /** Key (`creative:<offerId>`) of the container to highlight after a tag jump. */
  flashKey: string | null;
}

export const CreativeQcTabContent = ({ results, offers, fallbackCheckedAt, flashKey }: CreativeQcTabContentProps) => {
  if (offers.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
          No assets in this alert.
        </p>
      </div>
    );
  }

  const rows = offers.map((offer) => {
    const result = results.find((r) => r.offerId === offer.id) ?? passedCreativeQcResult(offer.id, fallbackCheckedAt);
    return { offer, result, needsReview: creativeQcHasWarning(result) };
  });
  // Stable sort: assets needing review first, otherwise alert order.
  const ordered = [...rows.filter((r) => r.needsReview), ...rows.filter((r) => !r.needsReview)];
  const reviewCount = rows.filter((r) => r.needsReview).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: reviewCount > 0 ? '#FFF4E5' : '#edf7ed' }}>
        {reviewCount > 0
          ? <WarningAmberOutlined style={{ fontSize: 18, color: '#663C00', flexShrink: 0 }} />
          : <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: reviewCount > 0 ? '#663C00' : '#1b5e20' }}>
          {reviewCount > 0
            ? `${reviewCount} of ${rows.length} asset${rows.length === 1 ? '' : 's'} need${reviewCount === 1 ? 's' : ''} review`
            : `All ${rows.length} asset${rows.length === 1 ? '' : 's'} passed`}
        </span>
      </div>

      {ordered.map(({ offer, result, needsReview }) => {
        const key = `creative:${offer.id}`;
        return (
          <QcOfferContainer key={key} qcKey={key} offer={offer} needsReview={needsReview} flashed={flashKey === key}>
            <WarningList result={result} />
            {result.sections.map((section) => (
              <SectionAccordion key={section.id} section={section} />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
          </QcOfferContainer>
        );
      })}
    </div>
  );
};
