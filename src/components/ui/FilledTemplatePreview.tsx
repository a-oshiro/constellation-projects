import { useRef, useState, useEffect } from 'react';
import type { Offer, Template } from '../../data/types';
import { TEMPLATE_REGISTRY } from '../../templates';
import * as DefaultTemplate from '../../templates/BmwWebsite600x250';

interface FilledTemplatePreviewProps {
  template: Template;
  offer: Offer;
  backgroundUrl: string;
}

export function FilledTemplatePreview({ template, offer, backgroundUrl }: FilledTemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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

  const FilledComponent = TEMPLATE_REGISTRY[template.id]?.Filled ?? DefaultTemplate.TemplateFilled;

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
        <FilledComponent
          offer={offer}
          backgroundUrl={backgroundUrl}
          width={template.width}
          height={template.height}
        />
      </div>
    </div>
  );
}
