import { useState } from 'react';
import { Autocomplete, Button, IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { BackgroundCollection } from '../../../data/backgroundCollections';
import { collectionThumb } from '../../../data/backgroundCollections';

const FONT = 'Roboto, sans-serif';
const PURPLE = '#473bab';

interface Props {
  /** Collections the list does not have yet. */
  available: BackgroundCollection[];
  projectCount: number;
  onAdd: (key: string) => void;
  onCancel: () => void;
}

/** The collection picker that opens above the backgrounds: choose a collection, then add it. */
export const AddCollectionBar = ({ available, projectCount, onAdd, onCancel }: Props) => {
  const [picked, setPicked] = useState<BackgroundCollection | null>(null);
  return (
    <div role="group" aria-label="Add a collection" style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#faf9fe', border: '1px solid #e1ddf7', borderRadius: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>From a Collection</div>
        <div style={{ fontSize: 12, fontFamily: FONT, color: '#686576', marginTop: 2 }}>
          Brings every size of the collection{projectCount > 1 ? `, to all ${projectCount} projects` : ''}.
        </div>
      </div>
      <Autocomplete
        size="small" sx={{ width: 340, ml: 'auto', background: '#fff' }}
        options={available} value={picked} onChange={(_, c) => setPicked(c)}
        noOptionsText="Every collection is already on the list"
        groupBy={() => 'Recommended for your brand'}
        getOptionLabel={(c) => c.name}
        isOptionEqualToValue={(a, b) => a.key === b.key}
        renderInput={(params) => (
          <TextField {...params} placeholder="Add a collection"
            slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, 'aria-label': 'Add a collection' } }} />
        )}
        renderGroup={(params) => (
          <li key={params.key}>
            <div style={{ padding: '10px 16px 4px', fontSize: 11, fontFamily: FONT, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#4b4958', fontWeight: 500 }}>{params.group}</div>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        renderOption={(props, c) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest} style={{ ...rest.style, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={collectionThumb(c.key)} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0, background: '#e8eaed' }} />
              <span style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontFamily: FONT, color: '#1f1d25' }}>{c.name}</div>
                <div style={{ fontSize: 12, fontFamily: FONT, color: '#686576' }}>All template sizes</div>
              </span>
            </li>
          );
        }}
        // The dialog is a fixed layer at z-index 100001; the menu would otherwise open behind it.
        slotProps={{ popper: { sx: { zIndex: 100002 } } }}
      />
      <Button variant="contained" disableElevation disabled={!picked} onClick={() => picked && onAdd(picked.key)}
        sx={{ textTransform: 'none', borderRadius: '100px', background: PURPLE, '&:hover': { background: '#3d3396' }, whiteSpace: 'nowrap' }}>
        Add collection
      </Button>
      <IconButton size="small" aria-label="Cancel" onClick={onCancel}><Close style={{ fontSize: 20 }} /></IconButton>
    </div>
  );
};
