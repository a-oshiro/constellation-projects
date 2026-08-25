import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, OpenInNew } from '@mui/icons-material';
import type { Background, Offer, Template } from '../../data/types';
import { TemplateThumb } from './OverviewCards';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/**
 * "Alert Elements" section of the Approvals sidebar: three collapsible accordions (Offers, Templates,
 * Styles) surfacing the building blocks a given alert's email/assets were generated from, each with a
 * one-click path back to its source page.
 */

type AccordionKey = 'offers' | 'templates' | 'styles';

interface AlertElementAccordionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  onViewTask: () => void;
  children: React.ReactNode;
}

const AlertElementAccordion = ({ title, expanded, onToggle, onViewTask, children }: AlertElementAccordionProps) => (
  <div style={{ background: '#f4f5f6', borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
      <span style={{ flex: 1, fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.17px' }}>
        {title}
      </span>
      <button
        onClick={onViewTask}
        style={{ background: 'none', border: 'none', padding: '0 8px 0 0', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab', textDecoration: 'underline', cursor: 'pointer' }}
      >
        View Task
      </button>
      <IconButton size="small" onClick={onToggle} sx={{ padding: '4px' }}>
        {expanded ? <ExpandLess style={{ fontSize: 20, color: '#686576' }} /> : <ExpandMore style={{ fontSize: 20, color: '#686576' }} />}
      </IconButton>
    </div>
    {expanded && <div style={{ padding: '0 12px 12px' }}>{children}</div>}
  </div>
);

interface ElementRowProps {
  imageUrl?: string;
  thumbnail?: React.ReactNode;
  title: string;
  subtitle?: string;
  pillLabel?: string;
  onLinkOut?: () => void;
}

/** Shared thumbnail + name/meta + link-out row, used by both the Offers and Templates accordion bodies. */
const ElementRow = ({ imageUrl, thumbnail, title, subtitle, pillLabel, onLinkOut }: ElementRowProps) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0' }}>
    {thumbnail ?? (
      <img src={imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#ffffff' }} />
    )}
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subtitle}
        </span>
      )}
      {pillLabel && (
        <span style={{ alignSelf: 'flex-start', background: '#f0f2f4', color: '#686576', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>
          {pillLabel}
        </span>
      )}
    </div>
    {onLinkOut && (
      <IconButton size="small" onClick={onLinkOut} sx={{ padding: '4px', flexShrink: 0 }}>
        <OpenInNew style={{ fontSize: 16, color: '#686576' }} />
      </IconButton>
    )}
  </div>
);

export interface AlertElementsSectionProps {
  rowOffers: Offer[];
  templates: Template[];
  styleBackgrounds: Background[];
  onClose: () => void;
}

export const AlertElementsSection = ({ rowOffers, templates, styleBackgrounds, onClose }: AlertElementsSectionProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<AccordionKey, boolean>>({ offers: false, templates: false, styles: false });

  const toggle = (key: AccordionKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleViewTask = (route: string) => { navigate(route); onClose(); };
  const handleOfferLinkOut = (offer: Offer) => {
    // Passed via navigation state (consumed by OffersPage on landing) rather than calling
    // openOffersPanel directly — the Offers page mounting fresh right after this navigation would
    // otherwise race its own cleanup-on-unmount effect and immediately close the panel.
    navigate('/offers', { state: { openOfferId: offer.id } });
    onClose();
  };
  const handleTemplateLinkOut = () => { navigate('/templates'); onClose(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AlertElementAccordion
        title="Offers"
        expanded={expanded.offers}
        onToggle={() => toggle('offers')}
        onViewTask={() => handleViewTask('/offers')}
      >
        {rowOffers.map((offer) => (
          <ElementRow
            key={offer.id}
            imageUrl={offer.imageUrl}
            title={offer.vehicleName}
            subtitle={offer.vin}
            pillLabel={offer.offerTypes[0]?.type}
            onLinkOut={() => handleOfferLinkOut(offer)}
          />
        ))}
      </AlertElementAccordion>

      <AlertElementAccordion
        title="Templates"
        expanded={expanded.templates}
        onToggle={() => toggle('templates')}
        onViewTask={() => handleViewTask('/templates')}
      >
        {templates.map((template) => (
          <ElementRow
            key={template.id}
            thumbnail={
              <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                <TemplateThumb template={template} />
              </div>
            }
            title={template.name}
            subtitle={`${template.width} x ${template.height}`}
            onLinkOut={handleTemplateLinkOut}
          />
        ))}
      </AlertElementAccordion>

      <AlertElementAccordion
        title="Styles"
        expanded={expanded.styles}
        onToggle={() => toggle('styles')}
        onViewTask={() => handleViewTask('/theme-and-logos')}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {styleBackgrounds.map((bg) => (
            <img key={bg.id} src={bg.url} alt="" style={{ width: '100%', aspectRatio: '1', borderRadius: 6, objectFit: 'cover' }} />
          ))}
          <img src={bmwLogoSrc} alt="" style={{ width: '100%', aspectRatio: '1', borderRadius: 6, objectFit: 'contain', background: '#f0f2f4' }} />
        </div>
      </AlertElementAccordion>
    </div>
  );
};
