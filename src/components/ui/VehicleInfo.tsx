import { useState, useEffect } from 'react';
import {
  IconButton,
  TextField,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import { Close, ContentCopy, Edit, Delete, CalendarToday, ArticleOutlined } from '@mui/icons-material';
import { AppTextField } from './AppTextField';
import { AppSelect } from './AppSelect';
import type { Offer } from '../../data/types';

interface VehicleInfoProps {
  offer: Offer;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Offer>) => void;
  /** Suppresses the built-in "Vehicle Info" title row — for callers (e.g. the alert dialog's tabbed offer editor) that provide their own outer title/close affordance. */
  hideHeader?: boolean;
}

const autocompleteSx = {
  '& .MuiInputLabel-root': { fontSize: 13 },
  '& .MuiOutlinedInput-input': { fontSize: 14 },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#6d28d9' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6d28d9' },
};

const SectionLabel = ({ text }: { text: string }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: '#1f1d25',
      fontFamily: 'Roboto, sans-serif',
      margin: '16px 0 8px',
    }}
  >
    {text}
  </div>
);

export const VehicleInfo = ({ offer, onClose, onSave, hideHeader }: VehicleInfoProps) => {
  const [draft, setDraft] = useState<Partial<Offer>>({});

  useEffect(() => {
    setDraft({});
  }, [offer.id]);

  const val = <K extends keyof Offer>(field: K): Offer[K] =>
    (draft[field] !== undefined ? draft[field] : offer[field]) as Offer[K];

  const set = (field: keyof Offer, value: unknown) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(offer.id, draft);
    setDraft({});
    onClose();
  };

  const imageFileName = offer.imageUrl.split('/').pop() ?? offer.imageUrl;

  const makeOptions = [offer.make, 'BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'Chevrolet']
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((m) => ({ value: m, label: m }));

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 360,
        background: '#ffffff',
        margin: '8px 8px 8px 0',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      {!hideHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
            Vehicle Info
          </span>
          <IconButton size="small" onClick={onClose}>
            <Close style={{ fontSize: 18 }} />
          </IconButton>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>

        {/* Vehicle image */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <img
            src={offer.imageUrl}
            alt={offer.vehicleName}
            style={{ width: 120, height: 80, objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6, maxWidth: '100%' }}>
            <span style={{
              fontSize: 11,
              color: '#686576',
              fontFamily: 'Roboto, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 170,
            }}>
              {imageFileName}
            </span>
            <IconButton size="small">
              <ContentCopy style={{ fontSize: 14, color: '#686576' }} />
            </IconButton>
            <IconButton size="small">
              <Edit style={{ fontSize: 14, color: '#686576' }} />
            </IconButton>
            <IconButton size="small">
              <Delete style={{ fontSize: 14, color: '#686576' }} />
            </IconButton>
          </div>
        </div>

        {/* VIN */}
        <AppTextField
          label="VIN"
          value={val('vin') ?? ''}
          onChange={(e) => set('vin', e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end">
                    <ContentCopy style={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Year | Make */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Year"
            type="number"
            value={String(val('year') ?? '')}
            onChange={(e) => set('year', Number(e.target.value))}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarToday style={{ fontSize: 15, color: '#686576' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <AppSelect
            label="Make"
            value={String(val('make') ?? '')}
            onChange={(v) => set('make', v)}
            options={makeOptions}
          />
        </div>

        {/* Model | Trim */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <Autocomplete
            freeSolo
            size="small"
            options={[offer.model]}
            value={String(val('model') ?? '')}
            onInputChange={(_, v) => set('model', v)}
            renderInput={(params) => (
              <TextField {...params} label="Model" size="small" sx={autocompleteSx} />
            )}
          />
          <Autocomplete
            freeSolo
            size="small"
            options={[offer.trim]}
            value={String(val('trim') ?? '')}
            onInputChange={(_, v) => set('trim', v)}
            renderInput={(params) => (
              <TextField {...params} label="Trim" size="small" sx={autocompleteSx} />
            )}
          />
        </div>

        {/* Exterior Color | Drivetrain */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Exterior Color"
            value={String(val('exteriorColor') ?? '')}
            onChange={(e) => set('exteriorColor', e.target.value)}
          />
          <AppTextField
            label="Drivetrain"
            value={String(val('drivetrain') ?? '')}
            onChange={(e) => set('drivetrain', e.target.value)}
          />
        </div>

        {/* Condition */}
        <FormControl sx={{ mb: 0.5 }}>
          <FormLabel
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1f1d25',
              mb: 0.5,
              '&.Mui-focused': { color: '#1f1d25' },
            }}
          >
            Condition
          </FormLabel>
          <RadioGroup
            row
            value={val('condition') ?? 'New'}
            onChange={(e) => set('condition', e.target.value)}
          >
            {(['New', 'Used', 'Certified Pre-Owned'] as const).map((c) => (
              <FormControlLabel
                key={c}
                value={c}
                control={
                  <Radio
                    size="small"
                    sx={{ color: '#473bab', '&.Mui-checked': { color: '#473bab' } }}
                  />
                }
                label={c}
                sx={{ '& .MuiFormControlLabel-label': { fontSize: 13 } }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* Pricing */}
        <SectionLabel text="Pricing" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="MSRP"
            type="number"
            value={val('msrp') != null ? String(val('msrp')) : ''}
            onChange={(e) => set('msrp', e.target.value === '' ? undefined : Number(e.target.value))}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
          />
          <AppTextField
            label="Advertised Price"
            type="number"
            value={val('advertisedPrice') != null ? String(val('advertisedPrice')) : ''}
            onChange={(e) => set('advertisedPrice', e.target.value === '' ? undefined : Number(e.target.value))}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            }}
          />
        </div>
        <AppTextField
          label="Similar Vehicles at this Price"
          type="number"
          value={val('similarVehiclesAtPrice') != null ? String(val('similarVehiclesAtPrice')) : '0'}
          onChange={(e) => set('similarVehiclesAtPrice', Number(e.target.value))}
          sx={{ mb: 1 }}
        />
        <AppTextField
          label="VINs at this Price"
          value={val('vinsAtPrice') ?? 'N/A'}
          disabled
          sx={{ mb: 0.5 }}
        />

        {/* Dates */}
        <SectionLabel text="Dates" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Days in Stock"
            type="number"
            value={val('daysInStock') != null ? String(val('daysInStock')) : ''}
            onChange={(e) =>
              set('daysInStock', e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
          <AppTextField
            label="Date in Stock"
            type="date"
            value={val('dateInStock') ?? ''}
            onChange={(e) => set('dateInStock', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </div>

        {/* Specifications */}
        <SectionLabel text="Specifications" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Mileage"
            type="number"
            value={val('mileage') != null ? String(val('mileage')) : ''}
            onChange={(e) =>
              set('mileage', e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
          <AppTextField
            label="Transmission"
            value={String(val('transmission') ?? '')}
            onChange={(e) => set('transmission', e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Blind Spot Monitor"
            value={String(val('blindSpotMonitor') ?? '')}
            onChange={(e) => set('blindSpotMonitor', e.target.value)}
          />
          <AppTextField
            label="In Transit"
            value={String(val('inTransit') ?? '')}
            onChange={(e) => set('inTransit', e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <AppTextField
            label="Model Code"
            value={String(val('modelCode') ?? '')}
            onChange={(e) => set('modelCode', e.target.value)}
          />
          <AppTextField
            label="Stock Number"
            value={String(val('stockNumber') ?? '')}
            onChange={(e) => set('stockNumber', e.target.value)}
          />
        </div>
        <AppTextField
          label="Style Name"
          value={String(val('styleName') ?? '')}
          onChange={(e) => set('styleName', e.target.value)}
          sx={{ mb: 1 }}
        />
        <AppTextField
          label="Account Images"
          value={String(val('accountImages') ?? '')}
          onChange={(e) => set('accountImages', e.target.value)}
          sx={{ mb: 0.5 }}
        />

        {/* Disclosure */}
        <SectionLabel text="Disclosure" />
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            background: '#f9fafa',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ArticleOutlined style={{ fontSize: 20, color: '#9e9e9e' }} />
            <span style={{ fontSize: 13, color: '#686576', fontFamily: 'Roboto, sans-serif' }}>
              Placeholder Disclosure
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#686576', margin: '0 0 8px', fontFamily: 'Roboto, sans-serif' }}>
            [Edit] to Insert disclosure or [Remove] to replace template
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              style={{
                fontSize: 13,
                color: '#473bab',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              <Edit style={{ fontSize: 14 }} /> Edit
            </button>
            <button
              style={{
                fontSize: 13,
                color: '#686576',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              — Remove
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: '6px 20px',
            borderRadius: 100,
            border: '1px solid #473bab',
            background: 'transparent',
            color: '#473bab',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.4px',
          }}
        >
          Close
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '6px 20px',
            borderRadius: 100,
            border: 'none',
            background: '#473bab',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.4px',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};
