import { IconButton } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import type { Background, Offer, Template } from '../../data/types';
import { OfferListCard } from './AlertOffersPanel';
import { getProjectPathById } from '../../data/projects';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/**
 * Floating card to the left of an asset, showing the offer/template/style building blocks it was
 * generated from (same content as the old Offers/Templates/Styles accordion, just scoped to this one
 * asset instead of the whole alert) plus shortcuts to jump to the Templates/Theme and Logos task pages.
 * The Offer section reuses the same `OfferListCard` ("Offer Card") shown in the Alert Offers right-panel,
 * per CP-13922, so clicking its vehicle/pricing rows opens the same Vehicle Info / offer editors.
 */

interface AlertOfferCardProps {
  offer: Offer;
  template: Template;
  background?: Background;
  /** The Evergreen project this alert belongs to — used to scope the Template/Styles link-out buttons to it. */
  projectId: string;
  /** True while the project is Evergreen-locked — disables editing the offer with an explanatory tooltip. */
  locked: boolean;
  onEditOffer: (view: 'vehicle' | 'offer') => void;
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9',
  letterSpacing: '0.4px', textTransform: 'uppercase',
};

/** Opens a task page in a new browser tab — used by the Template/Styles section link-out buttons. */
const openTaskPage = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');

export const AlertOfferCard = ({ offer, template, background, projectId, locked, onEditOffer }: AlertOfferCardProps) => (
  <div
    style={{
      position: 'absolute', top: 0, right: '100%', marginRight: 24, width: 280, flexShrink: 0,
      background: '#ffffff', borderRadius: 8, padding: 12, boxSizing: 'border-box',
      boxShadow: '0px 1px 4px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 12,
    }}
  >
    {/* Offer */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={sectionTitleStyle}>Offer</span>
      <OfferListCard
        offer={offer}
        locked={locked}
        onEditVehicle={() => onEditOffer('vehicle')}
        onEditOffer={() => onEditOffer('offer')}
      />
    </div>

    {/* Template */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionTitleStyle}>Template</span>
        <IconButton size="small" onClick={() => openTaskPage(getProjectPathById(projectId, 'templates'))} sx={{ padding: '2px' }} title="Open Templates">
          <OpenInNew style={{ fontSize: 13, color: '#686576' }} />
        </IconButton>
      </div>
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>{template.name}</span>
      <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{template.width} x {template.height}</span>
    </div>

    {/* Styles */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionTitleStyle}>Styles</span>
        <IconButton size="small" onClick={() => openTaskPage(getProjectPathById(projectId, 'theme-and-logos'))} sx={{ padding: '2px' }} title="Open Theme and Logos">
          <OpenInNew style={{ fontSize: 13, color: '#686576' }} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {background && (
          <img src={background.url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
        )}
        <img src={bmwLogoSrc} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'contain', background: '#f0f2f4' }} />
      </div>
    </div>
  </div>
);
