import { useState } from 'react';
import { Button, IconButton, TextField } from '@mui/material';
import { MoreVert, Search, AutoAwesome, TravelExplore, History } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { OfferCard } from '../components/ui/OfferCard';
import { OfferWritePane } from '../components/ui/OfferWritePane';
import { useProject } from '../context/ProjectContext';
import type { Offer } from '../data/types';

export const OffersPage = () => {
  const { offers, updateOffer } = useProject();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;

  const filteredOffers = offers.filter((o) =>
    o.vehicleName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (id: string, updated: Partial<Offer>) => {
    updateOffer(id, updated);
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
                  minWidth: 160,
                  maxWidth: 211,
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    background: '#f9fafa',
                    height: 34,
                    '& fieldset': { borderColor: '#cac9cf' },
                    '&:hover fieldset': { borderColor: '#9c99a9' },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: 14,
                    color: '#9c99a9',
                    letterSpacing: '0.15px',
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
                selected={selectedOfferId === offer.id}
                onSelect={(id, checked) => setSelectedOfferId(checked ? id : null)}
                onClick={() => setSelectedOfferId(offer.id)}
              />
            ))}
          </div>
        </div>

        <TaskFooter currentTask="offers" />
      </div>

      {/* ── Write pane ─────────────────────────────────────────── */}
      {selectedOffer && (
        <OfferWritePane
          offer={selectedOffer}
          onClose={() => setSelectedOfferId(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
