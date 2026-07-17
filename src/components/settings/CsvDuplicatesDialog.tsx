import { Dialog, IconButton, Button, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { DestinationUrl } from './DestinationURLs';

const chipSx = {
  height: 22, borderRadius: '8px', background: '#f0f2f4', color: '#1f1d25',
  fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
  '& .MuiChip-label': { padding: '0 6px' },
};

const labelSx = { fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', textTransform: 'uppercase' as const };
const valueSx = { fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', wordBreak: 'break-all' as const };

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

function VersionColumn({ heading, entry }: { heading: string; entry: DestinationUrl }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.1px' }}>
        {heading}
      </span>
      <div>
        <div style={labelSx}>URL</div>
        <div style={valueSx}>{entry.url}</div>
      </div>
      <div>
        <div style={labelSx}>Type</div>
        <div style={valueSx}>{entry.type}</div>
      </div>
      {entry.ymmt && (
        <div>
          <div style={labelSx}>Vehicle</div>
          <div style={valueSx}>{entry.ymmt}</div>
        </div>
      )}
      {entry.ctas.length > 0 && (
        <div>
          <div style={labelSx}>Associated CTAs</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {entry.ctas.map((cta) => <Chip key={cta} label={cta} size="small" sx={chipSx} />)}
          </div>
        </div>
      )}
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
          width: 640, maxWidth: 640, borderRadius: '24px',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px 16px' }}>
        <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
          Duplicate Labels Found
        </span>
        <IconButton size="small" onClick={onDoNotReplace} sx={{ padding: '5px' }}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '60vh', overflowY: 'auto' }}>
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
          {duplicates.length} label{duplicates.length === 1 ? '' : 's'} in your CSV file already exist{duplicates.length === 1 ? 's' : ''} in
          the table below. Choose whether to replace the existing entries with the new values from your file.
        </span>

        {duplicates.map(({ existing, incoming }) => (
          <div
            key={existing.id}
            style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
              {existing.label}
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              <VersionColumn heading="Current" entry={existing} />
              <div style={{ width: 1, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
              <VersionColumn heading="New (from CSV)" entry={incoming} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 24px 24px' }}>
        <Button
          onClick={onDoNotReplace}
          variant="text"
          sx={{ textTransform: 'capitalize', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px', color: '#473bab' }}
        >
          Do Not Replace
        </Button>
        <Button
          onClick={onReplace}
          variant="contained"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', background: '#473bab', padding: '6px 16px',
            '&:hover': { background: '#3d3396' },
          }}
        >
          Replace
        </Button>
      </div>
    </Dialog>
  );
};
