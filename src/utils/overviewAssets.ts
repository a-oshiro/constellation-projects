import type { Offer, Template, Background, Asset } from '../data/types';

export interface PreviewAdShell {
  id: string;
  name: string;
  template: Template;
  assets: Asset[];
  platform: string;
}

/** Read-only offer × template × background asset preview, used only by the Project Overview page. */
export function computePreviewAssets(
  offers: Offer[],
  templates: Template[],
  backgrounds: Background[],
  projectName: string,
): Asset[] {
  const result: Asset[] = [];

  offers.filter((o) => !o.swapOnly).forEach((offer) => {
    templates.forEach((tmpl) => {
      const tmplBgs = backgrounds.filter((b) => b.templateId === tmpl.id);
      tmplBgs.forEach((bg, bi) => {
        const dimLabel = `${tmpl.width} x ${tmpl.height}`;
        const platform = tmpl.type === 'Facebook Post' ? 'Social' : tmpl.type === 'HTML' ? 'HTML' : 'Website';
        result.push({
          id: `preview-${offer.id}-${tmpl.id}-${bg.id}`,
          name: `${offer.vehicleName}_${dimLabel}_BG${bi + 1}`,
          description: `${tmpl.type === 'HTML' ? 'HTML' : 'Image'} | ${dimLabel}`,
          thumbnailUrl: bg.url,
          offerId: offer.id,
          templateId: tmpl.id,
          backgroundId: bg.id,
          status: 'approved',
          tags: [offer.offerTypes[0]?.type ?? 'Lease', dimLabel, platform],
          folder: projectName,
          width: tmpl.width,
          height: tmpl.height,
          imageType: tmpl.type === 'HTML' ? 'HTML' : 'Image',
          offerType: offer.offerTypes[0]?.type ?? 'Lease',
          platform,
          offer,
          backgroundUrl: bg.url,
        });
      });
    });
  });

  return result;
}

/** Groups preview assets sharing a template + background into Ad Shell–shaped previews. */
export function groupIntoAdShells(assets: Asset[], templates: Template[], projectName: string): PreviewAdShell[] {
  const shellMap = new Map<string, Asset[]>();
  assets.forEach((asset) => {
    const key = `${asset.templateId}__${asset.backgroundId}`;
    if (!shellMap.has(key)) shellMap.set(key, []);
    shellMap.get(key)!.push(asset);
  });

  return Array.from(shellMap.entries()).map(([key, shellAssets], idx) => {
    const first = shellAssets[0];
    const template = templates.find((t) => t.id === first.templateId)!;
    return {
      id: key,
      name: `${projectName}_${first.width} x ${first.height}_BG_${idx + 1}`,
      template,
      assets: shellAssets,
      platform: first.platform,
    };
  });
}
