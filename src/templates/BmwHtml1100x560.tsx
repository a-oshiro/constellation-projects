import bmwLogoSrc from '../assets/bmw-logo.png';
import type { Offer } from '../data/types';

// ── Shared sub-components ─────────────────────────────────────────────────────

const BmwLogo = ({ size }: { size: number }) => (
  <img src={bmwLogoSrc} alt="BMW" width={size} height={size} style={{ objectFit: 'contain' }} />
);

// ── Template constants ────────────────────────────────────────────────────────
// Content area occupies the top 79.82%, footer the bottom 20.18%

const CONTENT_PCT = 0.7982;
const FOOTER_PCT = 0.2018;

// ── Preview (wireframe for TemplateCard and AddTemplatesDialog) ───────────────

export interface TemplatePreviewProps {
  hovered?: boolean;
}

export function TemplatePreview({ hovered }: TemplatePreviewProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f6f7f8' }}>

      {/* Background content area (top 79.82%) — striped with dashed green border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${CONTENT_PCT * 100}%`,
        background: 'repeating-linear-gradient(-45deg, #e8eaed 0px, #e8eaed 4px, #f0f2f4 4px, #f0f2f4 10px)',
        border: '1.5px dashed #43a047',
        boxSizing: 'border-box',
      }}>
        {/* "Background" center label */}
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

      {/* Footer bar (bottom 20.18%) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${FOOTER_PCT * 100}%`,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 4%',
      }}>
        {['View Inventory', 'Value Your Trade', 'Offer Details'].map((label) => (
          <span key={label} style={{
            fontSize: 7, fontFamily: 'Roboto, sans-serif', fontWeight: 700,
            color: '#473bab', letterSpacing: '0.5px', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* Vehicle name — top left */}
      <div style={{
        position: 'absolute', top: '8.57%', left: '2.91%',
        fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#111014',
        fontWeight: 400, lineHeight: 1.2,
      }}>
        {'{year} {make}'}<br />
        {'{model} {trim}'}
      </div>

      {/* Logo placeholder — top right (purple dashed) */}
      <div style={{
        position: 'absolute', top: '15.18%', right: '2.91%',
        width: '7.36%', height: '13.21%',
        border: '1.5px dashed #7b1fa2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 6, color: '#7b1fa2', textAlign: 'center', lineHeight: 1.2, fontFamily: 'Roboto, sans-serif' }}>
          Logo<br />Primary
        </span>
      </div>

      {/* Jellybean (vehicle image placeholder) — indigo dashed, left-center */}
      <div style={{
        position: 'absolute', left: '2.91%',
        width: '27.64%',
        top: `${CONTENT_PCT * 50}%`,
        transform: 'translateY(-50%)',
        aspectRatio: '270 / 147',
        border: '1.5px dashed #3949ab',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 7, color: '#3949ab', fontFamily: 'Roboto, sans-serif' }}>Jellybean</span>
      </div>

      {/* Offer text block — center */}
      <div style={{
        position: 'absolute',
        left: '33.09%',
        width: '38.64%',
        top: `${CONTENT_PCT * 50}%`,
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <span style={{ fontSize: 6, fontFamily: 'Roboto, sans-serif', color: '#111014', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          {'{OfferType}'}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#111014' }}>
            {'{MonthlyPayment}'}
          </span>
          <span style={{ fontSize: 6, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.8px', color: '#111014', textTransform: 'uppercase' }}>
            / MONTH
          </span>
        </div>
        <span style={{ fontSize: 7, fontFamily: 'Roboto, sans-serif', color: '#111014' }}>{'{Duration}-month lease'}</span>
        <span style={{ fontSize: 7, fontFamily: 'Roboto, sans-serif', color: '#111014' }}>{'{Mileage} miles per year'}</span>
        <span style={{ fontSize: 7, fontFamily: 'Roboto, sans-serif', color: '#111014' }}>{'${DownPayment} down'}</span>
      </div>

      {/* Claim Special button — right side */}
      <div style={{
        position: 'absolute',
        left: 'calc(50% + 38%)',
        top: `${CONTENT_PCT * 50}%`,
        transform: 'translate(-50%, -50%)',
      }}>
        <div style={{
          background: '#473bab', color: 'white',
          borderRadius: 100, padding: '4px 10px',
          fontSize: 8, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>
          Claim Special
        </div>
      </div>

      {/* Hover: Edit Template */}
      {hovered && (
        <div style={{ position: 'absolute', bottom: `${FOOTER_PCT * 100 + 2}%`, right: 7 }}>
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

// ── Filled (rendered at native 1100×560 pixel size) ───────────────────────────

export interface TemplateFilledProps {
  offer: Offer;
  backgroundUrl: string;
  width: number;
  height: number;
}

export function TemplateFilled({ offer, backgroundUrl, width, height }: TemplateFilledProps) {
  const contentH = height * CONTENT_PCT; // 447px
  const footerH = height * FOOTER_PCT;   // 113px

  // Key positions from Figma (at 1100×560)
  const vehicleLeft = width * 0.0291;           // 32px
  const vehicleWidth = width * 0.28;          // 304px
  const offerLeft = 364;                        // 364px fixed
  const offerWidth = 425;                       // 425px fixed
  const titleTop = height * 0.0857;             // 48px
  const logoWidth = width * 0.12;             // 81px
  const logoHeight = height * 0.12;           // 74px
  const contentCenterY = contentH / 1.7;          // 223.5px

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', fontFamily: 'Roboto, sans-serif' }}>

      {/* ── Content area (top 79.82% = 447px) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: contentH, overflow: 'hidden' }}>

        {/* Background photo */}
        <img
          src={backgroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Vehicle title — top left */}
        <div style={{
          position: 'absolute', top: titleTop, left: vehicleLeft,
          fontSize: 40, fontWeight: 800, color: '#ffffff',
          lineHeight: 1.2, letterSpacing: 0.25,
          zIndex: 2,
        }}>
          {offer.year} {offer.make} {offer.model}<br />{offer.trim}
        </div>

        {/* BMW logo — top right */}
        <div style={{
          position: 'absolute',
          top: '48px', right: '32px',
          width: logoWidth, height: logoHeight,
          zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BmwLogo size={logoWidth} />
        </div>

        {/* Vehicle image (Jellybean) — left, vertically centered */}
        <div style={{
          position: 'absolute',
          left: vehicleLeft,
          width: vehicleWidth,
          top: contentCenterY,
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}>
          <img
            src={offer.imageUrl}
            alt={offer.vehicleName}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))' }}
          />
        </div>

        {/* Offer details — center, vertically centered */}
        <div style={{
          position: 'absolute',
          left: offerLeft,
          width: offerWidth,
          top: contentCenterY,
          transform: 'translateY(-50%)',
          zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 4,
           backgroundColor: '#ffffff', padding: 16, borderRadius: 8,
        }}>
          {/* Offer type */}
          <span style={{ fontSize: 14, fontWeight: 400, color: '#111014', letterSpacing: 1, textTransform: 'uppercase', lineHeight: 2.66 }}>
            {offer.offerType[0] || 'APR'}
          </span>

          {/* Monthly payment */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1, }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: '#111014', letterSpacing: 0.25 }}>
              ${offer.monthlyPayment}
            </span>
            <span style={{ fontSize: 14, fontWeight: 400, color: '#111014', letterSpacing: 1, textTransform: 'uppercase' }}>
              / MONTH
            </span>
          </div>

          {/* Details */}
          <span style={{ fontSize: 14, fontWeight: 400, color: '#111014', letterSpacing: 0.15, lineHeight: 1.5 }}>
            {offer.term}-month lease
          </span>
          <span style={{ fontSize: 14, fontWeight: 400, color: '#111014', letterSpacing: 0.15, lineHeight: 1.5 }}>
            {offer.milesPerYear.toLocaleString()} miles per year
          </span>
          <span style={{ fontSize: 14, fontWeight: 400, color: '#111014', letterSpacing: 0.15, lineHeight: 1.5 }}>
            ${offer.downPayment.toLocaleString()} down
          </span>
        </div>

        {/* Claim Special button — right, vertically centered */}
        <div style={{
          position: 'absolute',
          top: contentCenterY,
          right: '32px',
          zIndex: 2,
        }}>
          <div style={{
            background: '#1E88E5', color: 'white',
            borderRadius: 4, padding: '16px 32px',
            fontSize: 20, fontWeight: 800, letterSpacing: 0.46,
            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(71,59,171,0.4)',
          }}>
            CLAIM SPECIAL
          </div>
        </div>
      </div>

      {/* ── Footer bar (bottom 20.18% = 113px) ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: footerH,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {['View Inventory', 'Value Your Trade', 'Offer Details'].map((label) => (
          <span key={label} style={{
            fontSize: 20, fontWeight: 800, color: '#1E88E5',
            letterSpacing: 0.46, textTransform: 'uppercase',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
