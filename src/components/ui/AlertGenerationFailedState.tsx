import { Refresh } from '@mui/icons-material';
import type { AlertGenerationFailure } from '../../data/types';
import emailGenerationFailedSrc from '../../assets/email-generation-failed.svg';

/**
 * Replaces the entire email-canvas content when an alert's generation failed outright — illustration,
 * title, the failure-specific reason, a Service/Status Code readout, the Regenerate Alert action, and a
 * footnote repeating the instruction. Per Figma node 6170:21441.
 */

interface AlertGenerationFailedStateProps {
  failure: AlertGenerationFailure;
  onRegenerate: () => void;
}

export const AlertGenerationFailedState = ({ failure, onRegenerate }: AlertGenerationFailedStateProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: 320, margin: '0 auto', padding: '16px 0' }}>
    <img src={emailGenerationFailedSrc} alt="" style={{ width: 200, height: 200, flexShrink: 0 }} />

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
        Email couldn't be generated
      </span>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', textAlign: 'center' }}>
        {failure.message}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
          <b>Service:</b> {failure.service}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
          <b>Status Code:</b> {failure.statusCode}
        </span>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <button
        onClick={onRegenerate}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
          borderRadius: 100, padding: '4px 10px', background: '#473bab', color: '#ffffff',
          fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', lineHeight: '22px',
        }}
      >
        <Refresh style={{ fontSize: 18 }} />
        Regenerate Alert
      </button>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', textAlign: 'center' }}>
        Please attempt to Regenerate Alert above.
        <br />
        If the error persists, contact the Product team.
      </span>
    </div>
  </div>
);
