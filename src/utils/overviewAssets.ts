import type { Offer, Template, Background, Asset, Alert } from '../data/types';
import type { Project } from '../data/projects';

/**
 * Deterministically varies which background an offer's preview asset uses, so different offers
 * don't all render the same photo. Indexed by the offer's stable position in the project's offer
 * list, so a given offer always maps to the same background everywhere it's previewed.
 */
export function backgroundForOffer(offer: Offer, offers: Offer[], backgrounds: Background[]): Background | undefined {
  if (backgrounds.length === 0) return undefined;
  const index = offers.findIndex((o) => o.id === offer.id);
  return backgrounds[(index < 0 ? 0 : index) % backgrounds.length];
}

/** One asset shown in an Alert dialog's carousel — either the "primary" asset (project.templates[0], the
 * only one ever included in the email) or an "extra" asset generated from one of the project's other
 * templates. `key` is what `Alert.offerReviews`/`Alert.extraAssetReviews` are keyed by: a bare offer id for
 * primary entries (unchanged from today), or a composite id for extra entries. */
export interface AlertAssetEntry {
  key: string;
  offer: Offer;
  template: Template;
  background: Background;
  isPrimary: boolean;
}

export const extraAssetKey = (offerId: string, templateId: string, backgroundId: string): string =>
  `${offerId}::${templateId}::${backgroundId}`;

/**
 * Every asset an Alert's offers can show, across every template the project defines. `project.templates[0]`
 * keeps today's exact one-background-per-offer behavior (via `backgroundForOffer`); every additional
 * template contributes one asset per offer per background in that template's scope. For any project with
 * only one template (every Evergreen project except BMW Seattle today) this returns exactly the primary
 * entries, identical to current behavior.
 */
export function buildAlertAssetEntries(alertOffers: Offer[], allOffers: Offer[], project: Project): AlertAssetEntry[] {
  const [primaryTemplate, ...extraTemplates] = project.templates;
  if (!primaryTemplate) return [];

  const entries: AlertAssetEntry[] = [];

  alertOffers.forEach((offer) => {
    const bg = backgroundForOffer(offer, allOffers, project.backgrounds);
    if (bg) entries.push({ key: offer.id, offer, template: primaryTemplate, background: bg, isPrimary: true });
  });

  extraTemplates.forEach((template) => {
    const templateBackgrounds = project.backgrounds.filter((b) => b.templateId === template.id);
    alertOffers.forEach((offer) => {
      templateBackgrounds.forEach((background) => {
        entries.push({
          key: extraAssetKey(offer.id, template.id, background.id),
          offer,
          template,
          background,
          isPrimary: false,
        });
      });
    });
  });

  return entries;
}

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

export interface AlertOfferVisibility {
  /** Offer IDs whose preview assets should be visible — the featured offer of any Approved or Sent alert. */
  unlockedOfferIds: Set<string>;
  /** Offer IDs whose assets should be grouped into Ad Shells — the featured offer of any Sent alert. */
  shellOfferIds: Set<string>;
  /** Unlocked offer IDs still awaiting Send — drives the "+N new" Assets badge. */
  newOfferIds: Set<string>;
  /** Timestamp each offer was unlocked (its alert's Approved/Sent activity), for "most recent first" ordering. */
  unlockedAt: Record<string, number>;
}

/**
 * Derives which offers' preview Assets/Ad Shells should surface in the Project Summary, driven by
 * the Alerts Kanban lifecycle. `allOfferIds` should be every offer id with a preview asset — offers
 * that no alert ever references (e.g. catalog padding unrelated to the Alerts story) aren't part of
 * that lifecycle at all, so they're always unlocked rather than waiting on an Approve that will never come.
 */
export function computeAlertOfferVisibility(alerts: Alert[], allOfferIds: string[] = []): AlertOfferVisibility {
  const unlockedOfferIds = new Set<string>();
  const shellOfferIds = new Set<string>();
  const unlockedAt: Record<string, number> = {};

  const referencedOfferIds = new Set(alerts.map((a) => a.featuredOfferId));
  allOfferIds.forEach((id) => {
    if (referencedOfferIds.has(id)) return;
    unlockedOfferIds.add(id);
    shellOfferIds.add(id);
  });

  alerts.forEach((alert) => {
    if (alert.status !== 'approved' && alert.status !== 'sent') return;
    const offerId = alert.featuredOfferId;
    unlockedOfferIds.add(offerId);
    if (alert.status === 'sent') shellOfferIds.add(offerId);

    const entry = [...alert.activity].reverse().find((e) => e.action === alert.status);
    const timestamp = entry?.timestamp ?? alert.createdAt;
    if (!unlockedAt[offerId] || timestamp > unlockedAt[offerId]) unlockedAt[offerId] = timestamp;
  });

  // "New" = unlocked by an alert but not yet part of a Sent Ad Shell — offers outside the alert
  // lifecycle entirely are never "new", they're just always-there catalog assets.
  const newOfferIds = new Set(
    [...unlockedOfferIds].filter((id) => referencedOfferIds.has(id) && !shellOfferIds.has(id)),
  );

  return { unlockedOfferIds, shellOfferIds, newOfferIds, unlockedAt };
}
