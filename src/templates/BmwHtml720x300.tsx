import bmwLogoSrc from '../assets/bmw-logo.png';
import type { Offer } from '../data/types';

// ── Shared sub-components ─────────────────────────────────────────────────────

const BmwLogo = ({ size }: { size: number }) => (
  <img src={bmwLogoSrc} alt="BMW" width={size} height={size} style={{ objectFit: 'contain' }} />
);

function buildSocialHeader(offer: Offer): string {
  const type = (offer.offerType[0] || 'Lease').toLowerCase();
  if (type.includes('apr')) {
    return `0% APR Financing for ${offer.term} mos. on approved credit.`;
  }
  return `$${offer.monthlyPayment}/mo. for ${offer.term} mos. on approved credit.`;
}

// ── Preview (wireframe for TemplateCard and AddTemplatesDialog) ───────────────

export interface TemplatePreviewProps {
  hovered?: boolean;
}

export function TemplatePreview({ hovered }: TemplatePreviewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f6f7f8' }}>

      {/* Background — full area, striped with dashed green border */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(-45deg, #e8eaed 0px, #e8eaed 4px, #f0f2f4 4px, #f0f2f4 10px)',
        border: '1.5px dashed #43a047',
        boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#43a047', color: 'white',
          borderRadius: 3, padding: '2px 6px',
          fontSize: 9, fontFamily: 'Roboto, sans-serif',
        }}>
          Background
        </div>
      </div>

      {/* Vehicle name — top left */}
      <div style={{
        position: 'absolute', top: '8%', left: '3.33%',
        fontSize: 7, fontFamily: 'Roboto, sans-serif', color: '#111014',
        fontWeight: 400, lineHeight: 1.43, whiteSpace: 'nowrap',
      }}>
        {'{year} {make} {model} {trim}'}
      </div>

      {/* Social Header — large headline, left side */}
      <div style={{
        position: 'absolute', top: '16.67%', left: '3.33%', right: '36.39%',
        fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#111014',
        fontWeight: 400, lineHeight: 1.2, letterSpacing: '0.25px',
      }}>
        {'{SocialHeader}'}
      </div>

      {/* Logo placeholder — top right (purple dashed) */}
      <div style={{
        position: 'absolute', top: '8%', right: '3.33%', bottom: '67.33%', left: '85.42%',
        border: '1.5px dashed #7b1fa2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 5, color: '#7b1fa2', textAlign: 'center', lineHeight: 1.2, fontFamily: 'Roboto, sans-serif' }}>
          Logo<br />Primary
        </span>
      </div>

      {/* Jellybean placeholder — right side (indigo dashed) */}
      <div style={{
        position: 'absolute', top: '23.67%', right: '3.33%', bottom: '8%', left: '62.36%',
        border: '1.5px dashed #3949ab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 7, color: '#3949ab', fontFamily: 'Roboto, sans-serif' }}>Jellybean</span>
      </div>

      {/* Claim Special button */}
      <div style={{
        position: 'absolute', top: '44.67%', left: '2.71%', right: '76.46%', bottom: '41.33%',
        background: '#473bab', borderRadius: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: 'white', fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Claim Special
        </span>
      </div>

      {/* View Inventory button */}
      <div style={{
        position: 'absolute', top: '61.33%', left: '2.71%', right: '75.9%', bottom: '24.67%',
        background: '#473bab', borderRadius: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: 'white', fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
          View Inventory
        </span>
      </div>

      {/* Value Trade button */}
      <div style={{
        position: 'absolute', top: '78%', left: '2.71%', right: '77.36%', bottom: '8%',
        background: '#473bab', borderRadius: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: 'white', fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Value Trade
        </span>
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

// ── Filled (rendered at native 720×300 pixel size) ────────────────────────────

export interface TemplateFilledProps {
  offer: Offer;
  backgroundUrl: string;
  width: number;
  height: number;
}

export function TemplateFilled({ offer, backgroundUrl, width, height }: TemplateFilledProps) {
  const socialHeader = buildSocialHeader(offer);

  // Pixel positions from Figma (at 720×300)
  const logoSize = Math.round(width * 0.10);   // 81px

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', fontFamily: 'Roboto, sans-serif' }}>

      {/* Background photo */}
      <img
        src={backgroundUrl}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Vehicle name — top left, small */}
      <div style={{
        position: 'absolute',
        top: height * 0.08, left: width * 0.0333,
        fontSize: 14, fontWeight: 600, color: '#ffffff',
        lineHeight: 1.43, letterSpacing: 0.17,
        whiteSpace: 'nowrap',
        zIndex: 2,
      }}>
        {offer.year} {offer.make} {offer.model} {offer.trim}
      </div>

      {/* Social Header — large headline */}
      <div style={{
        position: 'absolute',
        top: height * 0.1667,
        left: width * 0.0333,
        right: width * 0.3639,
        fontSize: 30, fontWeight: 400, color: '#ffffff',
        lineHeight: 1.2, letterSpacing: 0.25,
        zIndex: 2,
      }}>
        {socialHeader}
      </div>

      {/* BMW Logo — top right */}
      <div style={{
        position: 'absolute',
        top: height * 0.05,
        right: width * 0.0333,
        width: logoSize, height: logoSize,
        zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BmwLogo size={logoSize} />
      </div>

      {/* Claim Special button */}
      <div style={{
        position: 'absolute',
        top: height * 0.4467,
        left: width * 0.0271,
        right: width * 0.7646,
        zIndex: 2,
        width: width * 0.25,
      }}>
        <div style={{
          background: '#1E88E5', color: 'white',
          borderRadius: 100, padding: '8px 22px',
          fontSize: 15, fontWeight: 500, letterSpacing: 0.46,
          whiteSpace: 'nowrap', textAlign: 'center', textTransform: 'uppercase',
        }}>
          CLAIM SPECIAL
        </div>
      </div>

      {/* View Inventory button */}
      <div style={{
        position: 'absolute',
        top: height * 0.6133,
        left: width * 0.0271,
        right: width * 0.759,
        zIndex: 2,
        width: width * 0.25,
      }}>
        <div style={{
          background: '#1E88E5', color: 'white',
          borderRadius: 100, padding: '8px 22px',
          fontSize: 15, fontWeight: 500, letterSpacing: 0.46,
          whiteSpace: 'nowrap', textAlign: 'center', textTransform: 'uppercase',
        }}>
          VIEW INVENTORY
        </div>
      </div>

      {/* Value Trade button */}
      <div style={{
        position: 'absolute',
        top: height * 0.78,
        left: width * 0.0271,
        right: width * 0.7736,
        zIndex: 2,
        width: width * 0.25,
      }}>
        <div style={{
          background: '#1E88E5', color: 'white',
          borderRadius: 100, padding: '8px 22px',
          fontSize: 15, fontWeight: 500, letterSpacing: 0.46,
          whiteSpace: 'nowrap', textAlign: 'center', textTransform: 'uppercase',
        }}>
          VALUE TRADE
        </div>
      </div>

      {/* Jellybean (vehicle image) — right side */}
      <div style={{
        position: 'absolute',
        zIndex: 2,
        width: '50%',
        right: '24px',
        top: '5px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={offer.imageUrl}
          alt={offer.vehicleName}
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))' }}
        />
      </div>
    </div>
  );
}
