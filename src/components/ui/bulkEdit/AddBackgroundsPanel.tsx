import { Autocomplete, IconButton, TextField } from '@mui/material';
import { Close, ImageOutlined } from '@mui/icons-material';
import type { BackgroundCollection } from '../../../data/backgroundCollections';
import { collectionThumb } from '../../../data/backgroundCollections';

const FONT = 'Roboto, sans-serif';

const Thumb = ({ src, size }: { src: string; size: number }) => (
  <img src={src} alt="" style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover', flexShrink: 0, background: '#e8eaed' }} />
);

interface Props {
  /** Collections the list does not have yet. */
  available: BackgroundCollection[];
  /** Collections added while this panel has been open, newest last. */
  added: BackgroundCollection[];
  projectCount: number;
  onPick: (key: string) => void;
  onClose: () => void;
}

/** The right-hand panel of the Backgrounds section: pick a collection and it is added to every selected project. */
export const AddBackgroundsPanel = ({ available, added, projectCount, onPick, onClose }: Props) => (
  <aside aria-label="Add Backgrounds" style={{
    position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, zIndex: 20, background: '#fff', borderLeft: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '-12px 0 28px rgba(31,29,37,0.14)', display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 12px 8px 20px' }}>
      <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>Add Backgrounds</h2>
      <IconButton size="small" aria-label="Close" onClick={onClose}><Close style={{ fontSize: 20 }} /></IconButton>
    </div>
    <div style={{ padding: '4px 16px 16px', overflowY: 'auto' }}>
      <div style={{ border: '1px solid #e7e7e9', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <ImageOutlined style={{ fontSize: 20, color: '#4b4958', marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>From a Collection</div>
            <div style={{ fontSize: 12, fontFamily: FONT, color: '#686576', lineHeight: 1.45, marginTop: 2 }}>
              Apply a curated media set to matching template sizes{projectCount > 1 ? `, on all ${projectCount} projects` : ''}.
            </div>
          </div>
        </div>
        <Autocomplete
          size="small" fullWidth sx={{ mt: 2 }}
          options={available} value={null} blurOnSelect
          noOptionsText="Every collection is already on the list"
          groupBy={() => 'Recommended for your brand'}
          getOptionLabel={(c) => c.name}
          onChange={(_, c) => { if (c) onPick(c.key); }}
          renderInput={(params) => <TextField {...params} placeholder="Add a collection" slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, 'aria-label': 'Add a collection' } }} />}
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
                <Thumb src={collectionThumb(c.key)} size={40} />
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontFamily: FONT, color: '#1f1d25' }}>{c.name}</div>
                  <div style={{ fontSize: 12, fontFamily: FONT, color: '#686576' }}>All template sizes</div>
                </span>
              </li>
            );
          }}
          slotProps={{ popper: { sx: { zIndex: 100002 } } }}
        />
        {added.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            {added.map((c) => (
              <div key={c.key} style={{ width: 90 }}>
                <Thumb src={collectionThumb(c.key)} size={90} />
                <div style={{ marginTop: 4, fontSize: 12, fontFamily: FONT, color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>{c.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </aside>
);
