import { useEffect, useState } from 'react';
import { Button, IconButton, TextField } from '@mui/material';
import { MoreVert, Search, AutoAwesome, TravelExplore, History } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { OfferCard } from '../components/ui/OfferCard';
import { useProject } from '../context/ProjectContext';
import { useLayout } from '../context/LayoutContext';
import type { OfferTypeName, OfferTypeData } from '../data/types';

function createDefaultOfferType(type: OfferTypeName): OfferTypeData {
  const id = `ot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case 'Lease':    return { id, type: 'Lease', source: 'National', rebates: [] };
    case 'Finance':  return { id, type: 'Finance', source: 'National' };
    case 'Purchase': return { id, type: 'Purchase', source: 'National', purchaseRebates: [], purchaseCondRebates: [], purchaseManualInputs: [] };
    case 'ZD Lease': return { id, type: 'ZD Lease', source: 'National', zdLeaseRebates: [], zdLeaseManualInputs: [] };
    case 'Custom':   return { id, type: 'Custom', source: 'National', customFields: [] };
  }
}

export const OffersPage = () => {
  const { offers, updateOffer } = useProject();
  const { offersPanel, openOffersPanel, closeOffersPanel } = useLayout();
  const [search, setSearch] = useState('');

  useEffect(() => () => closeOffersPanel(), []);

  const filteredOffers = offers.filter((o) =>
    o.vehicleName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddOfferType = (offerId: string, type: OfferTypeName) => {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    const newEntry = createDefaultOfferType(type);
    updateOffer(offerId, { offerTypes: [...offer.offerTypes, newEntry] });
    openOffersPanel('write-pane', offerId, newEntry.id);
  };

  const handleRemoveOfferType = (offerId: string, offerTypeId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;
    updateOffer(offerId, { offerTypes: offer.offerTypes.filter((ot) => ot.id !== offerTypeId) });
    if (offersPanel?.offerId === offerId && offersPanel?.offerTypeId === offerTypeId) {
      closeOffersPanel();
    }
  };

  const handleReorderOfferTypes = (offerId: string, newTypes: OfferTypeData[]) => {
    updateOffer(offerId, { offerTypes: newTypes });
  };

  return (
    <div className="flex h-full" style={{ background: '#f0f2f4' }}>
      {/* ── Main panel ─────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <PageHeader breadcrumbs={['Projects', 'May Offers - Specials', 'Offers']} title="Offers">
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border cursor-pointer"
            style={{ borderColor: '#473bab', color: '#473bab', background: 'transparent', fontWeight: 500 }}
          >
            Data Compliance
          </button>
          <IconButton size="small">
            <MoreVert style={{ fontSize: 18 }} />
          </IconButton>
        </PageHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Add offer options */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                icon: <AutoAwesome style={{ fontSize: 24, color: '#9e9e9e' }} />,
                title: 'Get Recommendations',
                desc: 'From inventory, incentives, and competitors',
              },
              {
                icon: <TravelExplore style={{ fontSize: 24, color: '#9e9e9e' }} />,
                title: 'Browse All Offers',
                desc: 'Regional, national and VIN-level offers',
              },
              {
                icon: <History style={{ fontSize: 24, color: '#9e9e9e' }} />,
                title: 'See Past Offers',
                desc: 'Browse offers from the previous months',
              },
            ].map((opt) => (
              <div
                key={opt.title}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-purple-400 transition-colors"
                style={{ borderColor: '#e0e0e0', background: '#fafafa' }}
              >
                {opt.icon}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#212121' }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: '#757575' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search & controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 mb-3">
              <span style={{ fontSize: 14, fontWeight: 500, color: '#212121' }}>
                Recommendations to get you started
              </span>
              <TextField
                size="small"
                placeholder="Find below"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Search style={{ fontSize: 20, color: '#9c99a9', marginRight: 6, flexShrink: 0 }} />
                    ),
                  },
                }}
                sx={{
                  minWidth: 160, maxWidth: 211, flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px', background: '#f9fafa', height: 34,
                    '& fieldset': { borderColor: '#cac9cf' },
                    '&:hover fieldset': { borderColor: '#9c99a9' },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: 14, color: '#9c99a9', letterSpacing: '0.15px',
                    padding: '6px 8px 6px 0',
                    '&::placeholder': { color: '#9c99a9', opacity: 1 },
                  },
                }}
              />
            </div>
            <div className="flex items-center gap-4 mb-3">
              <Button variant="text" size="small" sx={{ textTransform: 'none', fontSize: 13, color: '#473bab' }}>
                Select All
              </Button>
              <span style={{ fontSize: 13, color: '#757575' }}>{offers.length} offers</span>
              <IconButton size="small">
                <MoreVert style={{ fontSize: 18 }} />
              </IconButton>
            </div>
          </div>

          {/* Offer cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                selected={offersPanel?.offerId === offer.id}
                activeOfferTypeId={offersPanel?.offerId === offer.id ? offersPanel.offerTypeId : undefined}
                onSelect={(_, checked) => {
                  if (checked) {
                    const first = offer.offerTypes[0];
                    if (first) openOffersPanel('write-pane', offer.id, first.id);
                  } else {
                    closeOffersPanel();
                  }
                }}
                onVehicleClick={() => openOffersPanel('vehicle-info', offer.id)}
                onOfferTypeClick={(offerTypeId) => openOffersPanel('write-pane', offer.id, offerTypeId)}
                onAddOfferType={(type) => handleAddOfferType(offer.id, type)}
                onRemoveOfferType={(offerTypeId) => handleRemoveOfferType(offer.id, offerTypeId)}
                onReorderOfferTypes={(newTypes) => handleReorderOfferTypes(offer.id, newTypes)}
              />
            ))}
          </div>
        </div>

        <TaskFooter currentTask="offers" />
      </div>
    </div>
  );
};
