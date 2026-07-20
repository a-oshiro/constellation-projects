import { Dialog, IconButton, Button, Chip, Checkbox } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { DestinationUrl } from './DestinationURLs';

const chipSx = {
  height: 24, borderRadius: '8px', background: 'rgba(99,86,225,0.04)', color: '#473bab',
  fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
  '& .MuiChip-label': { padding: '0 6px' },
};

const columnHeadingSx = { fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.1px' };
const fieldLabelSx = { fontSize: 12, fontWeight: 700, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' };
const fieldValueSx = { fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', wordBreak: 'break-all' as const };
const rowBorderSx = { borderBottom: '1px solid rgba(0,0,0,0.12)' };

export interface CsvDuplicateEntry {
  existing: DestinationUrl;
  incoming: DestinationUrl;
}

interface CsvDuplicatesDialogProps {
  open: boolean;
  duplicates: CsvDuplicateEntry[];
  onReplace: () => void;
  onDoNotReplace: () => void;
}

function FieldRow({ label, current, incoming }: { label: string; current: string; incoming: string }) {
  return (
    <div style={{ display: 'flex', ...rowBorderSx }}>
      <div style={{ width: 130, flexShrink: 0, padding: '12px 8px' }}>
        <span style={fieldLabelSx}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '12px 8px' }}>
        <span style={fieldValueSx}>{current}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '12px 8px' }}>
        <span style={fieldValueSx}>{incoming}</span>
      </div>
    </div>
  );
}

function CtaCell({ ctas }: { ctas: string[] }) {
  if (ctas.length === 0) return <span style={fieldValueSx}>-</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {ctas.map((cta) => <Chip key={cta} label={cta} size="small" sx={chipSx} />)}
    </div>
  );
}

function DuplicateEntry({ entry, isFirst }: { entry: CsvDuplicateEntry; isFirst: boolean }) {
  const { existing, incoming } = entry;
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', width: '100%',
        paddingTop: isFirst ? 0 : 8, paddingBottom: 16,
        borderTop: isFirst ? undefined : '1px solid rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12 }}>
        <Checkbox
          checked
          size="small"
          inputProps={{ readOnly: true }}
          sx={{ padding: 0, color: '#473bab', '&.Mui-checked': { color: '#473bab' } }}
        />
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
          {existing.label}
        </span>
      </div>
      <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', ...rowBorderSx }}>
          <div style={{ width: 130, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '8px' }}><span style={columnHeadingSx}>Current</span></div>
          <div style={{ flex: 1, padding: '8px' }}><span style={columnHeadingSx}>New (from csv)</span></div>
        </div>
        <FieldRow label="URL" current={existing.url} incoming={incoming.url} />
        <FieldRow label="Type" current={existing.type} incoming={incoming.type} />
        <FieldRow label="Vehicle Model" current={existing.ymmt || '-'} incoming={incoming.ymmt || '-'} />
        <div style={{ display: 'flex' }}>
          <div style={{ width: 130, flexShrink: 0, padding: '12px 8px' }}>
            <span style={fieldLabelSx}>Associated CTAs</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: '12px 8px' }}>
            <CtaCell ctas={existing.ctas} />
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: '12px 8px' }}>
            <CtaCell ctas={incoming.ctas} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const CsvDuplicatesDialog = ({ open, duplicates, onReplace, onDoNotReplace }: CsvDuplicatesDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onDoNotReplace}
      sx={{
        '& .MuiDialog-paper': {
          width: 820, maxWidth: '90vw', borderRadius: '24px',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px 16px' }}>
        <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
          Duplicate URL Labels Found
        </span>
        <IconButton size="small" onClick={onDoNotReplace} sx={{ padding: '5px' }}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', maxHeight: '65vh', overflowY: 'auto' }}>
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5, paddingBottom: 12 }}>
          The following URLs will be replaced with the CSV upload. If you wish to continue, confirm values below.
        </span>

        {duplicates.map((entry, index) => (
          <DuplicateEntry key={entry.existing.id} entry={entry} isFirst={index === 0} />
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 16px' }}>
        <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          URLs with unique labels will be added normally to the account.
        </span>
        <Button
          onClick={onDoNotReplace}
          variant="text"
          sx={{ textTransform: 'capitalize', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px', color: '#473bab', whiteSpace: 'nowrap' }}
        >
          Continue With Existing Values
        </Button>
        <Button
          onClick={onReplace}
          variant="contained"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', background: '#473bab', padding: '6px 16px', whiteSpace: 'nowrap',
            '&:hover': { background: '#3d3396' },
          }}
        >
          Replace Values on Selected URLs
        </Button>
      </div>
    </Dialog>
  );
};
