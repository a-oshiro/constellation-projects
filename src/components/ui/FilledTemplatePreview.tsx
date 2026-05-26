import { useRef, useState, useEffect } from 'react';
import type { Offer, Template } from '../../data/types';
import bmwLogoSrc from '../../assets/bmw-logo.png';

interface FilledTemplatePreviewProps {
  template: Template;
  offer: Offer;
  backgroundUrl: string;
}

const BmwLogo = ({ size }: { size: number }) => (
  <img src={bmwLogoSrc} alt="BMW" width={size} height={size} style={{ objectFit: 'contain' }} />
);

export function FilledTemplatePreview({ template, offer, backgroundUrl }: FilledTemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const isWide = template.width > template.height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width } = el.getBoundingClientRect();
      if (width > 0) setScale(width / template.width);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [template.width]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Content rendered at native template dimensions, then scaled to fit container */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: template.width,
        height: template.height,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }}>

        {/* ── Background photo ─────────────────────────── */}
        <img
          src={backgroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* ── Left-side gradient overlay for text readability ── */}
        <div style={{
          position: 'absolute', inset: 0,
          background: isWide
            ? 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0) 100%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0) 100%)',
        }} />

        {/* ── Left: offer text ─────────────────────────── */}
        <div style={{
          position: 'absolute',
          left: '4%',
          top: isWide ? '8%' : '10%',
          width: isWide ? '50%' : '60%',
          display: 'flex',
          flexDirection: 'column',
          gap: isWide ? template.width * 0.015 : template.width * 0.02,
          zIndex: 2,
        }}>
          {/* Vehicle name */}
          <div style={{
            fontSize: isWide ? template.width * 0.05 : template.width * 0.07,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.25,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            New {offer.year} {offer.make} {offer.model} {offer.trim}
          </div>

          {/* Payment info */}
          <div style={{
            fontSize: isWide ? template.width * 0.033 : template.width * 0.05,
            fontFamily: 'Roboto, sans-serif',
            color: 'white',
            lineHeight: 1.5,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}>
            {offer.offerType[0] || 'Lease'} for ${offer.monthlyPayment}/month  <br/>
            for {offer.term} months
          </div>

          {/* CTA button */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#473bab',
            borderRadius: 100,
            padding: isWide ? `${template.width * 0.01}px ${template.width * 0.03}px` : `${template.width * 0.02}px ${template.width * 0.06}px`,
            width: 'fit-content',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            marginTop: isWide ? template.width * 0 : template.width * 0.035,
          }}>
            <span style={{
              fontSize: isWide ? template.width * 0.035 : template.width * 0.05,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: 'white',
              whiteSpace: 'nowrap',
            }}>
              More Info
            </span>
          </div>
        </div>

        {/* ── Right: vehicle image ──────────────────────── */}
        <div style={{
          position: 'absolute',
          left: isWide ? '45%' : '30%',
          top: isWide ? '0%' : '25%',
          width: isWide ? '50%' : '80%',
          height: isWide ? '110%' : '62%',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={offer.imageUrl}
            alt={offer.vehicleName}
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}
          />
        </div>

        {/* ── Top-right: BMW logo ───────────────────────── */}
        <div style={{
          position: 'absolute',
          top: isWide ? '6%' : '5%',
          right: '3%',
          width: isWide ? '11%' : '20%',
          height: isWide ? '20%' : '20%',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <BmwLogo size={template.width * 0.058} />
        </div>

      </div>
    </div>
  );
}
