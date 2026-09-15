import { useMemo, useState } from 'react';
import { Button, Checkbox, FormControl, InputAdornment, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ContentCopyOutlined, Search } from '@mui/icons-material';
import type { EnrollmentSettings, VehicleModelYear } from '../../../data/enrollmentSettings';
import { MODEL_YEAR_OPTIONS } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE, FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, InfoCallout, SECTION_TITLE_STYLE, TEXT_FIELD_SX } from './shared';

interface VehiclesTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

const OfferModeChip = ({ mode }: { mode: VehicleModelYear['offerMode'] }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(99,86,225,0.5)', color: '#473bab',
    borderRadius: 8, padding: '3px 10px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.17px',
  }}>
    {mode === 'oem' ? 'OEM Offer' : 'Custom Offer'}
  </span>
);

const VehicleRow = ({ vehicle, onUpdate }: { vehicle: VehicleModelYear; onUpdate: (patch: Partial<VehicleModelYear>) => void }) => (
  <div style={{ background: vehicle.selected ? '#f9fafa' : 'transparent', borderRadius: 8, padding: '10px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Checkbox
        size="small"
        checked={vehicle.selected}
        onChange={(e) => onUpdate({ selected: e.target.checked })}
        sx={{ padding: 0, '&.Mui-checked': { color: '#473bab' } }}
      />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
        {vehicle.model} · {vehicle.year}
      </span>
      {vehicle.selected && (
        <>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={vehicle.trimsMode}
            onChange={(_, value) => value && onUpdate({ trimsMode: value })}
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none', fontSize: 12, fontFamily: 'Roboto, sans-serif', padding: '4px 12px',
                color: '#686576', borderColor: '#cac9cf',
                '&.Mui-selected': { background: '#1f1d25', color: '#ffffff', '&:hover': { background: '#1f1d25' } },
              },
            }}
          >
            <ToggleButton value="core">Core Trims</ToggleButton>
            <ToggleButton value="select">Select trims</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onUpdate({ offerMode: vehicle.offerMode === 'oem' ? 'custom' : 'oem' })}
            sx={{
              textTransform: 'none', fontSize: 12, fontWeight: 500, letterSpacing: '0.17px', borderRadius: '8px',
              color: '#1f1d25', borderColor: '#cac9cf', padding: '4px 12px', whiteSpace: 'nowrap',
              '&:hover': { borderColor: '#9b96b0', background: 'transparent' },
            }}
          >
            {vehicle.offerMode === 'oem' ? 'OEM Offer' : 'Custom Offer'}
          </Button>
        </>
      )}
    </div>
    {vehicle.selected && (
      <div style={{ paddingLeft: 32, paddingTop: 8 }}>
        <OfferModeChip mode={vehicle.offerMode} />
      </div>
    )}
  </div>
);

export const VehiclesTab = ({ settings, onChange }: VehiclesTabProps) => {
  const [copied, setCopied] = useState(false);

  const filteredVehicles = useMemo(() => {
    const query = settings.vehicleSearch.trim().toLowerCase();
    return settings.vehicles.filter((v) => {
      const matchesYear = settings.modelYearFilter === 'all' || String(v.year) === settings.modelYearFilter;
      const matchesQuery = !query || v.model.toLowerCase().includes(query);
      return matchesYear && matchesQuery;
    });
  }, [settings.vehicles, settings.modelYearFilter, settings.vehicleSearch]);

  const updateVehicle = (id: string, patch: Partial<VehicleModelYear>) => {
    onChange({ vehicles: settings.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  };

  const selectAll = () => {
    const visibleIds = new Set(filteredVehicles.map((v) => v.id));
    onChange({ vehicles: settings.vehicles.map((v) => (visibleIds.has(v.id) ? { ...v, selected: true } : v)) });
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(
      "If you select new model/trim preferences and choose National Offer, we'll first look for a national offer at the trim level. If none exists, we'll match to the national offer at the new model level. If no national offer exists at either level, we may generate offers that don't match your original selections.",
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <p style={{ ...BODY_TEXT_STYLE, flex: 1 }}>
          If you select new model/trim preferences and choose National Offer, we'll first look for a national offer at the trim
          level. If none exists, we'll match to the national offer at the new model level. If no national offer exists at either
          level, we may generate offers that don't match your original selections.
        </p>
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#686576', flexShrink: 0 }}
        >
          <ContentCopyOutlined style={{ fontSize: 18 }} />
        </button>
      </div>

      <div>
        <h3 style={SECTION_TITLE_STYLE}>Vehicles</h3>
        <p style={{ ...BODY_TEXT_STYLE, color: '#686576', marginBottom: 4 }}>
          Select which models and trims you want to advertise and choose between OEM Offers (National or Regional) or Custom
          Offers at the model or trim level.
        </p>
        <p style={{ ...BODY_TEXT_STYLE, fontWeight: 500 }}>Only core models will be published in the homepage hero slider.</p>
      </div>

      <InfoCallout title="Custom Offers will be calculated as follows:">
        10% Down Payment (Capitalized Cost Reduction), 10,000 miles per year, and term of 48 months or less (based on lowest
        payment). Due at signing will include first month payment, acquisition fee, dealer fees, and capitalized cost reduction.
      </InfoCallout>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ width: 160 }}>
          <div style={FIELD_LABEL_STYLE}>Model year</div>
          <FormControl size="small" fullWidth>
            <Select
              value={settings.modelYearFilter}
              onChange={(e) => onChange({ modelYearFilter: e.target.value })}
              sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' } }}
            >
              {MODEL_YEAR_OPTIONS.map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: 14 }}>{y === 'all' ? 'All Years' : y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div style={FIELD_LABEL_STYLE}>Search</div>
          <TextField
            size="small"
            fullWidth
            placeholder="Find Below"
            value={settings.vehicleSearch}
            onChange={(e) => onChange({ vehicleSearch: e.target.value })}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> } }}
            sx={TEXT_FIELD_SX}
          />
        </div>
        <div style={{ flex: 1 }} />
        <Button
          variant="outlined"
          onClick={selectAll}
          sx={{
            textTransform: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.17px', borderRadius: '100px',
            color: '#473bab', borderColor: '#473bab', padding: '6px 16px', flexShrink: 0,
            '&:hover': { borderColor: '#3d3396', background: 'rgba(71,59,171,0.04)' },
          }}
        >
          Select All
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filteredVehicles.map((v) => (
          <VehicleRow key={v.id} vehicle={v} onUpdate={(patch) => updateVehicle(v.id, patch)} />
        ))}
        {filteredVehicles.length === 0 && (
          <p style={{ ...HELPER_TEXT_STYLE, padding: '8px 12px' }}>No vehicles match this search.</p>
        )}
      </div>
    </div>
  );
};
