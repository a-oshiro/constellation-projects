import { IconButton } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import type { Background, Offer, Template } from '../../data/types';
import { Tooltip } from './Tooltip';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/**
 * Floating card to the left of an asset, showing the offer/template/style building blocks it was
 * generated from (same content as the old Offers/Templates/Styles accordion, just scoped to this one
 * asset instead of the whole alert) plus shortcuts to edit the offer in place and to jump to the
 * Templates/Theme and Logos task pages.
 */

interface AlertOfferCardProps {
  offer: Offer;
  template: Template;
  background?: Background;
  /** True while the project is Evergreen-locked — disables Edit Offer with an explanatory tooltip. */
  locked: boolean;
  onEditOffer: () => void;
}

const pillStyle: React.CSSProperties = {
  alignSelf: 'flex-start', background: '#f0f2f4', color: '#686576', borderRadius: 100,
  padding: '2px 8px', fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9',
  letterSpacing: '0.4px', textTransform: 'uppercase',
};

const linkStyle: React.CSSProperties = {
  alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0,
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab',
  textDecoration: 'underline', cursor: 'pointer',
};

/** Opens a task page in a new browser tab — used by the Template/Styles section link-out buttons. */
const openTaskPage = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');

export const AlertOfferCard = ({ offer, template, background, locked, onEditOffer }: AlertOfferCardProps) => (
  <div
    style={{
      position: 'absolute', top: 0, right: '100%', marginRight: 24, width: 240, flexShrink: 0,
      background: '#ffffff', borderRadius: 8, padding: 12, boxSizing: 'border-box',
      boxShadow: '0px 1px 4px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 12,
    }}
  >
    {/* Offer */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={sectionTitleStyle}>Offer</span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <img src={offer.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#f0f2f4' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {offer.vehicleName}
          </span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {offer.vin}
          </span>
          {offer.offerTypes[0] && <span style={pillStyle}>{offer.offerTypes[0].type}</span>}
          <Tooltip
            title={locked ? 'Unlock project to make changes' : ''}
            disableHoverListener={!locked}
            slotProps={{ popper: { style: { zIndex: 100050 } } }}
          >
            <span>
              <button
                disabled={locked}
                onClick={onEditOffer}
                style={{ ...linkStyle, color: locked ? '#9c99a9' : '#473bab', cursor: locked ? 'not-allowed' : 'pointer' }}
              >
                Edit Offer
              </button>
            </span>
          </Tooltip>
        </div>
      </div>
    </div>

    {/* Template */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionTitleStyle}>Template</span>
        <IconButton size="small" onClick={() => openTaskPage('/templates')} sx={{ padding: '2px' }} title="Open Templates">
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
        <IconButton size="small" onClick={() => openTaskPage('/theme-and-logos')} sx={{ padding: '2px' }} title="Open Theme and Logos">
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
