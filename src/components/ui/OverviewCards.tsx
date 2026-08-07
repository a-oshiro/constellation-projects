import { InfoOutlined } from '@mui/icons-material';
import type { Offer, Template, Asset } from '../../data/types';
import { TEMPLATE_REGISTRY } from '../../templates';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import type { PreviewAdShell } from '../../utils/overviewAssets';

/** Read-only, compact card previews used only on the Project Overview page. */

export const ScrollRow = ({ children }: { children: React.ReactNode }) => (
  <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'clip' }}>
    {children}
  </div>
);

const TEMPLATE_THUMB_SIZE = 40;
const TEMPLATE_THUMB_NATIVE = 100;

/**
 * Fills its container with a template's live Preview component, scaled down via CSS transform —
 * templates have no static preview image, and the Preview component's fixed-px text needs a real
 * transform (not just a smaller layout box) to stay legible-proportioned at avatar size.
 */
export const TemplateThumb = ({ template }: { template: Template }) => {
  const isWide = template.width >= template.height;
  const previewWidth = isWide ? '100%' : `${(template.width / template.height) * 100}%`;
  const previewHeight = isWide ? `${(template.height / template.width) * 100}%` : '100%';
  const PreviewComponent = TEMPLATE_REGISTRY[template.id]?.Preview;
  const scale = TEMPLATE_THUMB_SIZE / TEMPLATE_THUMB_NATIVE;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: TEMPLATE_THUMB_NATIVE, height: TEMPLATE_THUMB_NATIVE, transform: `scale(${scale})`, transformOrigin: 'top left',
        display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f4',
      }}>
        <div style={{ width: previewWidth, height: previewHeight, position: 'relative', flexShrink: 0 }}>
          {PreviewComponent ? <PreviewComponent /> : <div style={{ width: '100%', height: '100%', background: '#e8eaed' }} />}
        </div>
      </div>
    </div>
  );
};

function getLeaseFields(offer: Offer): { label: string; value: string }[] {
  const lease = offer.offerTypes.find((ot) => ot.type === 'Lease');
  if (!lease) return [];
  return [
    { label: 'Monthly Payment', value: lease.monthlyPayment != null ? `$${lease.monthlyPayment}` : '—' },
    { label: 'Term', value: lease.term != null ? String(lease.term) : '—' },
    { label: 'Total Due at Signing', value: lease.totalDueAtSigning != null ? `$${lease.totalDueAtSigning.toLocaleString()}` : '—' },
  ];
}

export const OverviewOfferCard = ({ offer }: { offer: Offer }) => {
  const lease = offer.offerTypes.find((ot) => ot.type === 'Lease');
  const fields = getLeaseFields(offer);

  return (
    <div style={{
      width: 300, minWidth: 300, flexShrink: 0,
      border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
      overflow: 'hidden', background: '#ffffff',
    }}>
      <div style={{ display: 'flex', gap: 12, padding: 12 }}>
        <div style={{
          width: 64, height: 64, flexShrink: 0, background: '#f0f2f4', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#1f1d25', lineHeight: 1.43, letterSpacing: '0.17px',
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {offer.vehicleName}
          </p>
          {offer.vin && (
            <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>
              {offer.vin}
            </p>
          )}
          {lease && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(99,86,225,0.12)', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#6356e1', letterSpacing: '0.16px' }}>
                {lease.type}
              </span>
              {lease.source && (
                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.16px' }}>
                  {lease.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {fields.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {fields.map((f) => (
            <div key={f.label} style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
                {f.label === 'Total Due at Signing' && <InfoOutlined style={{ fontSize: 12, color: '#686576', flexShrink: 0 }} />}
              </div>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const OverviewTemplateCard = ({ template }: { template: Template }) => {
  const isWide = template.width >= template.height;
  const previewWidth = isWide ? '100%' : `${(template.width / template.height) * 100}%`;
  const previewHeight = isWide ? `${(template.height / template.width) * 100}%` : '100%';
  const PreviewComponent = TEMPLATE_REGISTRY[template.id]?.Preview;

  return (
    <div style={{ width: 220, minWidth: 220, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: '100%', aspectRatio: '1 / 1', background: '#f0f2f4',
        border: '1px solid #e7e7e9', borderRadius: 12, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: previewWidth, height: previewHeight, position: 'relative', flexShrink: 0 }}>
          {PreviewComponent ? <PreviewComponent /> : <div style={{ width: '100%', height: '100%', background: '#e8eaed' }} />}
        </div>
      </div>
      <div style={{ paddingTop: 6 }}>
        <p style={{
          margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
          lineHeight: 1.43, letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {template.name}
        </p>
        <div style={{ display: 'flex', gap: 4, marginTop: 1, alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{template.type}</span>
          <span style={{ fontSize: 11, color: '#686576' }}>|</span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{template.width} x {template.height}</span>
        </div>
      </div>
    </div>
  );
};

const OVERVIEW_CARD_SIZE = 155;

export const OverviewAssetCard = ({ asset }: { asset: Asset }) => {
  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  return (
    <div style={{
      width: OVERVIEW_CARD_SIZE, height: OVERVIEW_CARD_SIZE, minWidth: OVERVIEW_CARD_SIZE, flexShrink: 0,
      background: '#f0f2f4', border: '1px solid #e7e7e9', borderRadius: 8, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
        <FilledTemplatePreview template={{ id: asset.templateId, name: '', type: asset.imageType, width: asset.width, height: asset.height, brand: '', previewUrl: '' }} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
      </div>
    </div>
  );
};

export const OverviewAdShellCard = ({ shell }: { shell: PreviewAdShell }) => {
  const { template, assets } = shell;
  const isWide = template.width > template.height;
  const innerWidthPct = isWide ? 100 : (template.width / template.height) * 100;
  const innerHeightPct = !isWide ? 100 : (template.height / template.width) * 100;

  return (
    <div style={{
      width: OVERVIEW_CARD_SIZE, height: OVERVIEW_CARD_SIZE, minWidth: OVERVIEW_CARD_SIZE, flexShrink: 0,
      background: '#f0f2f4', border: '1px solid #e7e7e9', borderRadius: 8, overflow: 'hidden', position: 'relative',
    }}>
      {assets[2] && (
        <div style={{ position: 'absolute', inset: 20, opacity: 0.4, transform: 'rotate(-5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
            <FilledTemplatePreview template={template} offer={assets[2].offer} backgroundUrl={assets[2].backgroundUrl} />
          </div>
        </div>
      )}
      {assets[1] && (
        <div style={{ position: 'absolute', inset: 20, opacity: 0.4, transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
            <FilledTemplatePreview template={template} offer={assets[1].offer} backgroundUrl={assets[1].backgroundUrl} />
          </div>
        </div>
      )}
      {assets[0] && (
        <div style={{ position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
            <FilledTemplatePreview template={template} offer={assets[0].offer} backgroundUrl={assets[0].backgroundUrl} />
          </div>
        </div>
      )}
      {/* Site/platform badge — bottom left, matches the real Ad Shell card */}
      <div style={{
        position: 'absolute', bottom: 6, left: 6, width: 20, height: 20, borderRadius: '50%',
        background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #424242' }} />
      </div>
    </div>
  );
};
