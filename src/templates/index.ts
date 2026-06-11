import type React from 'react';
import type { Offer } from '../data/types';

export interface TemplatePreviewProps {
  hovered?: boolean;
}

export interface TemplateFilledProps {
  offer: Offer;
  backgroundUrl: string;
  width: number;
  height: number;
}

export interface TemplateDefinition {
  Preview: React.ComponentType<TemplatePreviewProps>;
  Filled: React.ComponentType<TemplateFilledProps>;
}

// Lazy imports — each template is its own .tsx file you can edit independently
import * as T1 from './BmwWebsite600x250';
import * as T2 from './BmwSocial1080x1080';
import * as T3 from './BmwHtml1100x560';
import * as T4 from './BmwHtml720x300';

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
  'tmpl-1': { Preview: T1.TemplatePreview, Filled: T1.TemplateFilled },
  'tmpl-2': { Preview: T2.TemplatePreview, Filled: T2.TemplateFilled },
  'tmpl-3': { Preview: T3.TemplatePreview, Filled: T3.TemplateFilled },
  'tmpl-4': { Preview: T4.TemplatePreview, Filled: T4.TemplateFilled },
};
