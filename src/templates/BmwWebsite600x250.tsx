import bmwLogoSrc from '../assets/bmw-logo.png';
import type { Offer } from '../data/types';
import { getPrimaryLeaseData } from '../data/types';

// ── Shared sub-components ─────────────────────────────────────────────────────

const BmwLogo = ({ size }: { size: number }) => (
  <img src={bmwLogoSrc} alt="BMW" width={size} height={size} draggable={false} style={{ objectFit: 'contain', userSelect: 'none' }} />
);

// ── Preview (wireframe for TemplateCard and AddTemplatesDialog) ───────────────

export interface TemplatePreviewProps {
  hovered?: boolean;
}

export function TemplatePreview({ hovered }: TemplatePreviewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Striped background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(-45deg, #e8eaed 0px, #e8eaed 6px, #f0f2f4 6px, #f0f2f4 14px)',
      }} />

      {/* "Background Image" label */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.75)', border: '1px dashed #9c99a9',
        borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 9, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.3px' }}>
          Background Image
        </span>
      </div>

      {/* Left: text placeholders */}
      <div style={{
        position: 'absolute', left: '4%', top: '8%',
        width: '44%', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#473bab', lineHeight: 1.25, padding: '2px 5px', background: 'rgba(71,59,171,0.08)', borderRadius: 4 }}>
          {'{vehicleCondition}'}<br />{'{year} {make} {model}'}<br />{'{trim}'}
        </div>
        <div style={{ fontSize: 9, fontFamily: 'Roboto, sans-serif', color: '#473bab', lineHeight: 1.4, padding: '2px 5px', background: 'rgba(71,59,171,0.08)', borderRadius: 4 }}>
          {'{Offer type} for'}<br />{'${monthlyPayment} / month'}<br />{'for {n} months'}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#473bab', borderRadius: 100, padding: '3px 10px', width: 'fit-content' }}>
          <span style={{ fontSize: 9, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: 'white', whiteSpace: 'nowrap' }}>More Info</span>
        </div>
        <div style={{ height: 5, width: '88%', background: 'rgba(0,0,0,0.12)', borderRadius: 3 }} />
      </div>

      {/* Right: product image placeholder */}
      <div style={{
        position: 'absolute', left: '51%', top: '8%',
        width: '44%', height: '68%',
        border: '2px solid #473bab', borderRadius: 6, background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
      }}>
        <svg width={32} height={20} viewBox="0 0 40 26" fill="none">
          <rect x="2" y="10" width="36" height="13" rx="3" stroke="#473bab" strokeWidth="1.5"/>
          <path d="M6 10 L10 3 H30 L34 10" stroke="#473bab" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="10" cy="23" r="3" stroke="#473bab" strokeWidth="1.5"/>
          <circle cx="30" cy="23" r="3" stroke="#473bab" strokeWidth="1.5"/>
        </svg>
        <span style={{ fontSize: 9, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', textAlign: 'center' }}>
          Product Image
        </span>
      </div>

      {/* Top-right: logo placeholder */}
      <div style={{
        position: 'absolute', top: '5%', right: '3%',
        width: '11%', height: '18%',
        border: '1.5px dashed #ec4899', borderRadius: 4, background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: '#ec4899', fontFamily: 'Roboto, sans-serif', textAlign: 'center', lineHeight: 1.2 }}>Logo</span>
      </div>

      {/* Hover: Edit Template */}
      {hovered && (
        <div style={{ position: 'absolute', bottom: 7, right: 7 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#473bab', color: 'white', border: 'none',
            borderRadius: 100, padding: '4px 10px', fontSize: 11,
            fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}>
            ✎ Edit Template
          </button>
        </div>
      )}
    </div>
  );
}

// ── Filled (rendered with real offer + background, at native pixel size) ───────

export interface TemplateFilledProps {
  offer: Offer;
  backgroundUrl: string;
  width: number;
  height: number;
}

export function TemplateFilled({ offer, backgroundUrl, width, height }: TemplateFilledProps) {
  const leaseData = getPrimaryLeaseData(offer);
  const isWide = width > height;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>

      {/* Background photo */}
      <img
        src={backgroundUrl}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }}
      />

      {/* Left gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isWide
          ? 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(to right, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0) 100%)',
      }} />

      {/* Left: offer text */}
      <div style={{
        position: 'absolute',
        left: '4%', top: isWide ? '8%' : '10%',
        width: isWide ? '50%' : '60%',
        display: 'flex', flexDirection: 'column',
        gap: isWide ? width * 0.015 : width * 0.02,
        zIndex: 2,
      }}>
        <div style={{ fontSize: isWide ? width * 0.05 : width * 0.07, fontFamily: "'BMW Type Next', Roboto, sans-serif", fontWeight: 700, color: 'white', lineHeight: 1.25, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
          New {offer.year} {offer.make} {offer.model} {offer.trim}
        </div>
        <div style={{ fontSize: isWide ? width * 0.033 : width * 0.05, fontFamily: "'BMW Type Next', Roboto, sans-serif", color: 'white', lineHeight: 1.5, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          {offer.offerTypes[0]?.type ?? 'Lease'} for ${leaseData.monthlyPayment ?? 0}/month<br/>for {leaseData.term ?? 0} months
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: '#1B69D5', borderRadius: 100,
          padding: isWide ? `${width * 0.01}px ${width * 0.03}px` : `${width * 0.02}px ${width * 0.06}px`,
          width: 'fit-content',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: isWide ? width * 0.035 : width * 0.05, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: 'white', whiteSpace: 'nowrap' }}>
            More Info
          </span>
        </div>
      </div>

      {/* Right: vehicle image */}
      <div style={{
        position: 'absolute',
        left: isWide ? '45%' : '30%',
        top: isWide ? '0%' : '25%',
        width: isWide ? '50%' : '80%',
        height: isWide ? '110%' : '62%',
        zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={offer.imageUrl}
          alt={offer.vehicleName}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))', userSelect: 'none' }}
        />
      </div>

      {/* Top-right: BMW logo */}
      <div style={{
        position: 'absolute',
        top: isWide ? '6%' : '5%', right: '3%',
        width: isWide ? '11%' : '20%',
        height: isWide ? '20%' : '20%',
        zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BmwLogo size={width * 0.058} />
      </div>

      {/* Bottom: fine-print disclosure */}
      {offer.disclosure && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.55)',
          padding: `${width * 0.006}px ${width * 0.03}px`,
          zIndex: 3,
        }}>
          <span style={{
            fontSize: width * 0.014, fontFamily: 'Roboto, sans-serif', color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: isWide ? 2 : 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {offer.disclosure}
          </span>
        </div>
      )}
    </div>
  );
}
