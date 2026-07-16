import { useEffect, useState } from 'react';
import {
  Dialog, IconButton, TextField, Autocomplete, Checkbox, Chip, Button,
  CircularProgress, Alert,
} from '@mui/material';
import { Close, CheckBoxOutlineBlank, CheckBox as CheckBoxIcon } from '@mui/icons-material';
import { fetchUrlsFromWebsite, BMW_2026_MODELS } from '../../utils/fetchUrlsWithAI';
import type { DestinationUrl, DestinationUrlType } from './DestinationURLs';

const URL_TYPE_OPTIONS: DestinationUrlType[] = ['Contact', 'Inventory', 'Specials', 'Trade-In'];

const labelSx = { fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.15px' };

const fieldSx = {
  '& .MuiOutlinedInput-root': { background: '#f9fafa', borderRadius: '4px' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
  '& .MuiOutlinedInput-input': { fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' },
};

const chipSx = {
  height: 24, borderRadius: '8px', background: '#f0f2f4', color: '#1f1d25',
  fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
};

interface FetchUrlsDialogProps {
  open: boolean;
  onClose: () => void;
  defaultWebsite: string;
  onFetched: (urls: DestinationUrl[]) => void;
}

export const FetchUrlsDialog = ({ open, onClose, defaultWebsite, onFetched }: FetchUrlsDialogProps) => {
  const [website, setWebsite] = useState(defaultWebsite);
  const [types, setTypes] = useState<DestinationUrlType[]>(URL_TYPE_OPTIONS);
  const [models, setModels] = useState<string[]>(BMW_2026_MODELS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The dialog stays mounted between opens so MUI can animate its exit transition,
  // so reset the form back to defaults each time it's reopened rather than leaving stale picks.
  useEffect(() => {
    if (open) {
      setWebsite(defaultWebsite);
      setTypes(URL_TYPE_OPTIONS);
      setModels(BMW_2026_MODELS);
      setError(null);
    }
  }, [open, defaultWebsite]);

  const showModels = types.includes('Inventory');
  const allModelsSelected = models.length === BMW_2026_MODELS.length;

  const canSubmit = website.trim() !== '' && types.length > 0 && (!showModels || models.length > 0) && !loading;

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const urls = await fetchUrlsFromWebsite({
        website: website.trim(),
        types,
        models: showModels ? models : [],
        allModelsSelected,
      });
      onFetched(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while fetching URLs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      sx={{
        '& .MuiDialog-paper': {
          width: 600, maxWidth: 600, borderRadius: '24px',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px 16px' }}>
        <span style={{ fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
          Fetch URLs from Website
        </span>
        <IconButton size="small" onClick={onClose} disabled={loading} sx={{ padding: '5px' }}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
          Select below the URL categories you wish to fetch.
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelSx}>Account Website</span>
          <TextField
            fullWidth
            size="small"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
            sx={fieldSx}
          />
        </div>

        <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
            URL Categories
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelSx}>URL Types</span>
            <Autocomplete
              multiple
              disableCloseOnSelect
              size="small"
              options={URL_TYPE_OPTIONS}
              value={types}
              disabled={loading}
              onChange={(_, newValue) => setTypes(newValue)}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlank fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      checked={selected}
                      size="small"
                      sx={{ marginRight: 1, color: 'rgba(0,0,0,0.38)', '&.Mui-checked': { color: '#473bab' } }}
                    />
                    {option}
                  </li>
                );
              }}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} label={option} size="small" {...itemProps} sx={chipSx} />;
                })
              }
              renderInput={(params) => <TextField {...params} sx={fieldSx} />}
            />
          </div>

          {showModels && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelSx}>Vehicle Models</span>
              <Autocomplete
                multiple
                disableCloseOnSelect
                size="small"
                options={BMW_2026_MODELS}
                value={models}
                disabled={loading}
                onChange={(_, newValue) => setModels(newValue)}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox
                        icon={<CheckBoxOutlineBlank fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        checked={selected}
                        size="small"
                        sx={{ marginRight: 1, color: 'rgba(0,0,0,0.38)', '&.Mui-checked': { color: '#473bab' } }}
                      />
                      {option}
                    </li>
                  );
                }}
                renderValue={(value, getItemProps) => {
                  if (allModelsSelected) {
                    return [
                      <Chip key="all-models" label="All Models" size="small" onDelete={() => setModels([])} sx={chipSx} />,
                    ];
                  }
                  return value.map((option, index) => {
                    const { key, ...itemProps } = getItemProps({ index });
                    return <Chip key={key} label={option} size="small" {...itemProps} sx={chipSx} />;
                  });
                }}
                renderInput={(params) => <TextField {...params} sx={fieldSx} />}
              />
            </div>
          )}
        </div>

        {error && <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 24px 24px' }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="text"
          sx={{ textTransform: 'capitalize', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px', color: '#473bab' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleFetch}
          disabled={!canSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : undefined}
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', background: '#473bab', padding: '6px 16px',
            '&:hover': { background: '#3d3396' },
            '&.Mui-disabled': { background: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.26)' },
          }}
        >
          Fetch URLs
        </Button>
      </div>
    </Dialog>
  );
};
