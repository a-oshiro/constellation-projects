import type { ReactNode } from 'react';
import { formatFeeAmount, formatShortDate } from '../../../data/feeSync';
import type { FeeSyncLimitations, FeeSyncRejectedUpdate } from '../../../data/feeSync';
import { FeeButton } from './FeeButton';
import { FeeDialog } from './FeeDialog';
import { FeeNotice } from './FeeNotice';
import { StatusChip } from './StatusChip';

// Option 2b "See details": a summary of what Constellation doesn't use from FeeSync. Known limitations
// (applied automatically on every sync) are grey sections; a rejected update is a separate warning, so the
// two never read as the same thing. Sizes live here.
const WIDTH = 600;
const SECTION_GAP = 20;
const SECTION_INNER_GAP = 8;
const ROW_PADDING = '10px 14px';
const ROW_GAP = 12;
const BODY_FONT_SIZE = 12;
const CAPTION_FONT_SIZE = 11;
const HEADING_FONT_SIZE = 14;
const LIST_RADIUS = 8;

const OUTER_BORDER = '1px solid rgba(0,0,0,0.12)';
const ROW_BORDER = '1px solid rgba(0,0,0,0.08)';
const BODY = { margin: 0, fontSize: BODY_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px' } as const;
const CAPTION = { margin: 0, fontSize: CAPTION_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: '#686576' } as const;

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

interface FeeSyncDetailsDialogProps {
  open: boolean;
  brand: string;
  limitations: FeeSyncLimitations;
  rejectedUpdate: FeeSyncRejectedUpdate | null;
  onClose: () => void;
  /** FeeSync is mocked in this prototype, so the caller decides what "Edit in FeeSync" does. */
  onEditInFeeSync: () => void;
}

export const FeeSyncDetailsDialog = ({ open, brand, limitations, rejectedUpdate, onClose, onEditInFeeSync }: FeeSyncDetailsDialogProps) => {
  const { usedVehicleFees, unsupportedSettings } = limitations;
  return (
    <FeeDialog
      open={open}
      title="What Constellation doesn’t use from FeeSync"
      onClose={onClose}
      width={WIDTH}
      spreadActions
      actions={(
        <>
          <FeeButton variant="text" onClick={onEditInFeeSync}>Edit in FeeSync</FeeButton>
          <FeeButton onClick={onClose}>Done</FeeButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SECTION_GAP, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
        <p style={{ ...BODY, color: '#686576', marginTop: -8 }}>These limits are applied automatically on every sync.</p>

        {usedVehicleFees.length > 0 && (
          <Section title="Fees for Used vehicles" count={usedVehicleFees.length}>
            <p style={{ ...BODY, color: '#5b5968' }}>
              Constellation doesn’t support Used vehicles. Fees for Used only are excluded.
              {usedVehicleFees.some((f) => f.handling === 'brand-only') && ' Fees that also cover a brand apply to that brand only.'}
            </p>
            <List>
              {usedVehicleFees.map((fee, i) => (
                <Row key={fee.name} last={i === usedVehicleFees.length - 1}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: ROW_GAP }}>
                    <span style={BODY}>{fee.name}, {formatFeeAmount(fee.amount)}</span>
                    <span style={{ ...BODY, color: '#686576', flexShrink: 0 }}>
                      {fee.handling === 'excluded' ? 'Excluded' : `Applies to ${brand} only`}
                    </span>
                  </div>
                </Row>
              ))}
            </List>
          </Section>
        )}

        {unsupportedSettings.length > 0 && (
          <Section title="Settings not supported" count={unsupportedSettings.length}>
            <List>
              {unsupportedSettings.map((s, i) => (
                <Row key={s.setting} last={i === unsupportedSettings.length - 1}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ ...BODY, fontWeight: 500 }}>{s.setting}</span>
                    <span style={{ ...BODY, color: '#5b5968' }}>{s.instead}</span>
                    <span style={CAPTION}>Affects {joinNames(s.affectedFees)}</span>
                  </div>
                </Row>
              ))}
            </List>
          </Section>
        )}

        {rejectedUpdate && (
          <FeeNotice tone="warning">
            <strong style={{ fontWeight: 500, display: 'block' }}>Update not applied on {formatShortDate(rejectedUpdate.receivedAt)}</strong>
            <strong style={{ fontWeight: 500 }}>{rejectedUpdate.feeName}</strong> {rejectedUpdate.change} {rejectedUpdate.reason}
          </FeeNotice>
        )}
      </div>
    </FeeDialog>
  );
};

const Section = ({ title, count, children }: { title: string; count: number; children: ReactNode }) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: SECTION_INNER_GAP }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: SECTION_INNER_GAP }}>
      <h3 style={{ margin: 0, fontSize: HEADING_FONT_SIZE, fontWeight: 500, lineHeight: 1.57, letterSpacing: '0.1px' }}>{title}</h3>
      <StatusChip tone="neutral" label={String(count)} />
    </div>
    {children}
  </section>
);

const List = ({ children }: { children: ReactNode }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: OUTER_BORDER, borderRadius: LIST_RADIUS }}>{children}</ul>
);

const Row = ({ last, children }: { last: boolean; children: ReactNode }) => (
  <li style={{ padding: ROW_PADDING, borderBottom: last ? 'none' : ROW_BORDER }}>{children}</li>
);
