import { useState } from 'react';
import {
  Autocomplete, TextField, Chip, IconButton,
  FormControl, InputLabel, Select, MenuItem, Button,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { CTA_OPTIONS, EXISTING_LABEL_SUGGESTIONS } from './DestinationURLs';
import type { DestinationUrl, DestinationUrlType } from './DestinationURLs';

// ── Vehicle catalog — makes the client has access to, with models per make and trims per model ──

const YEARS = ['2027', '2026', '2025', '2024', '2023'];

const VEHICLE_CATALOG: Record<string, Record<string, string[]>> = {
  BMW: { X1: ['sDrive28i', 'xDrive28i'], X3: ['sDrive30i', 'xDrive30i', 'M40i'], X5: ['xDrive40i', 'M60i'], '3 Series': ['330i', 'M340i'] },
  'Mercedes-Benz': { 'C-Class': ['C300', 'AMG C43'], 'E-Class': ['E350', 'E450'], GLE: ['350', '450'] },
  Audi: { A4: ['Premium', 'Premium Plus'], Q5: ['Premium', 'Prestige'], Q7: ['Premium', 'Prestige'] },
  Lexus: { RX: ['350', '500h'], ES: ['250', '350'], NX: ['250', '350h'] },
  Toyota: { Camry: ['LE', 'SE', 'XLE'], RAV4: ['LE', 'XLE', 'Limited'], Corolla: ['LE', 'SE'] },
  Honda: { Accord: ['LX', 'Sport', 'Touring'], 'CR-V': ['LX', 'EX', 'EX-L'], Civic: ['LX', 'Sport'] },
  Ford: { 'F-150': ['XL', 'XLT', 'Lariat'], Explorer: ['Base', 'XLT', 'Limited'], Escape: ['S', 'SE', 'Titanium'] },
  Chevrolet: { Silverado: ['WT', 'LT', 'LTZ'], Equinox: ['LS', 'LT', 'Premier'], Malibu: ['LS', 'LT'] },
  Volkswagen: { Tiguan: ['S', 'SE', 'SEL'], Atlas: ['SE', 'SEL'], Jetta: ['S', 'SE'] },
  Kia: { Sportage: ['LX', 'EX'], Telluride: ['LX', 'EX', 'SX'], Sorento: ['LX', 'EX'] },
  Hyundai: { Tucson: ['SE', 'SEL', 'Limited'], 'Santa Fe': ['SE', 'SEL'], Elantra: ['SE', 'SEL'] },
  Subaru: { Outback: ['Base', 'Premium', 'Limited'], Forester: ['Base', 'Premium'], Crosstrek: ['Base', 'Premium'] },
  Mazda: { 'CX-5': ['S', 'Sport', 'Grand Touring'], 'CX-50': ['S', 'Premium'], Mazda3: ['S', 'Preferred'] },
  Nissan: { Rogue: ['S', 'SV', 'SL'], Altima: ['S', 'SV'], Pathfinder: ['S', 'SV', 'SL'] },
  Jeep: { 'Grand Cherokee': ['Laredo', 'Limited'], Wrangler: ['Sport', 'Sahara', 'Rubicon'], Compass: ['Sport', 'Latitude'] },
  GMC: { Sierra: ['Pro', 'SLE', 'SLT'], Terrain: ['SLE', 'SLT'], Acadia: ['SLE', 'SLT'] },
  Cadillac: { XT5: ['Luxury', 'Premium Luxury'], Escalade: ['Luxury', 'Premium Luxury'], CT5: ['Luxury', 'Premium Luxury'] },
  Acura: { MDX: ['Base', 'Technology', 'Advance'], RDX: ['Base', 'Technology'], TLX: ['Base', 'Technology'] },
  Infiniti: { QX60: ['Pure', 'Luxe'], Q50: ['Pure', 'Luxe'], QX50: ['Pure', 'Luxe'] },
  Volvo: { XC90: ['Momentum', 'Inscription'], XC60: ['Momentum', 'Inscription'], XC40: ['Momentum', 'Plus'] },
  Porsche: { Macan: ['Base', 'S'], Cayenne: ['Base', 'S'], '911': ['Carrera', 'Carrera S'] },
  'Land Rover': { 'Range Rover': ['SE', 'HSE'], 'Range Rover Sport': ['SE', 'HSE'], Discovery: ['S', 'SE'] },
  MINI: { Cooper: ['Classic', 'Signature'], Countryman: ['Classic', 'Signature'] },
};

const MAKES = Object.keys(VEHICLE_CATALOG);

const TYPE_OPTIONS: DestinationUrlType[] = ['Contact', 'Inventory', 'Specials', 'Trade-In'];

const fieldSx = {
  '& .MuiInputLabel-root': { fontSize: 12 },
  '& .MuiOutlinedInput-input': { fontSize: 12 },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
};

interface NewUrlPanelProps {
  onClose: () => void;
  onSave: (url: DestinationUrl) => void;
}

export const NewUrlPanel = ({ onClose, onSave }: NewUrlPanelProps) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<DestinationUrlType | ''>('');
  const [ctas, setCtas] = useState<string[]>([]);

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');

  const isInventory = type === 'Inventory';
  const models = make ? Object.keys(VEHICLE_CATALOG[make]) : [];
  const trims = make && model ? VEHICLE_CATALOG[make][model] : [];

  const vehicleValid = !isInventory || (year !== '' && make !== '' && model !== '');
  const canSave = label.trim() !== '' && url.trim() !== '' && type !== '' && vehicleValid;

  const handleMakeChange = (newMake: string) => {
    setMake(newMake);
    setModel('');
    setTrim('');
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setTrim('');
  };

  const handleSave = () => {
    if (!canSave || type === '') return;
    onSave({
      id: `url-${Math.random().toString(36).slice(2)}`,
      label: label.trim(),
      url: url.trim(),
      type,
      ymmt: isInventory ? `${year} ${make} ${model}` : undefined,
      ctas,
    });
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 320, background: '#ffffff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          New URL
        </span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Fields ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Autocomplete
          freeSolo
          size="small"
          options={EXISTING_LABEL_SUGGESTIONS}
          value={label}
          onInputChange={(_, newValue) => setLabel(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Label" required sx={fieldSx} />
          )}
        />

        <TextField
          label="URL Address"
          required
          multiline
          minRows={3}
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          sx={fieldSx}
        />

        <FormControl size="small" fullWidth required>
          <InputLabel sx={{ fontSize: 12 }}>Type</InputLabel>
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as DestinationUrlType)}
            sx={{ fontSize: 12 }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {isInventory && (
          <div style={{ background: '#f4f5f6', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
              Vehicle Model
            </span>

            <FormControl size="small" fullWidth required>
              <InputLabel sx={{ fontSize: 12 }}>Year</InputLabel>
              <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)} sx={{ fontSize: 12, background: '#f9fafa' }}>
                {YEARS.map((y) => <MenuItem key={y} value={y} sx={{ fontSize: 12 }}>{y}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth required>
              <InputLabel sx={{ fontSize: 12 }}>Make</InputLabel>
              <Select label="Make" value={make} onChange={(e) => handleMakeChange(e.target.value)} sx={{ fontSize: 12, background: '#f9fafa' }}>
                {MAKES.map((m) => <MenuItem key={m} value={m} sx={{ fontSize: 12 }}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth required disabled={!make}>
              <InputLabel sx={{ fontSize: 12 }}>Model</InputLabel>
              <Select label="Model" value={model} onChange={(e) => handleModelChange(e.target.value)} sx={{ fontSize: 12, background: '#f9fafa' }}>
                {models.map((m) => <MenuItem key={m} value={m} sx={{ fontSize: 12 }}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth disabled={!model}>
              <InputLabel sx={{ fontSize: 12 }}>Trim</InputLabel>
              <Select label="Trim" value={trim} onChange={(e) => setTrim(e.target.value)} sx={{ fontSize: 12, background: '#f9fafa' }}>
                {trims.map((t) => <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        )}

        <Autocomplete
          multiple
          size="small"
          options={CTA_OPTIONS}
          value={ctas}
          onChange={(_, newValue) => setCtas(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  {...tagProps}
                  sx={{ height: 24, borderRadius: '8px', background: '#f0f2f4', color: '#1f1d25', fontSize: 11, fontFamily: 'Roboto, sans-serif' }}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Associated CTAs" sx={fieldSx} />
          )}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '12px 16px', flexShrink: 0,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', borderColor: 'rgba(99,86,225,0.5)', color: '#473bab',
            '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          variant="contained"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', background: '#473bab',
            '&:hover': { background: '#3d3396' },
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
