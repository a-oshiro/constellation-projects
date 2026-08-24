import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';
import { CURRENT_USER } from '../data/mockData';
import { DEFAULT_PROJECT_ID, getProjectById } from '../data/projects';
import type { Project } from '../data/projects';
import type { Background, Asset, AssetStatus, Offer, Template, AssetVersion, AssetComment, Alert, AlertStatus, AlertActivityEntry, AlertActivityAction, AlertComment, AlertCommentAnchor, ReviewStatus } from '../data/types';

/** Fixed one-way lifecycle: Generated -> Approved/Rejected, Rejected -> Generated (regenerate), Approved -> Sent, Sent is terminal. */
const ALERT_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  generated: ['approved', 'rejected'],
  rejected: ['generated'],
  approved: ['sent'],
  sent: [],
};

/** The overall Kanban column is derived from the two independent review tracks: any rejection wins, both-approved is Approved, otherwise Generated. */
function deriveAlertStatus(emailStatus: ReviewStatus, assetsStatus: ReviewStatus): AlertStatus {
  if (emailStatus === 'rejected' || assetsStatus === 'rejected') return 'rejected';
  if (emailStatus === 'approved' && assetsStatus === 'approved') return 'approved';
  return 'generated';
}

export interface PendingOfferChange {
  offerId: string;
  previousOffer: Offer;
  previousAssetStatuses: Record<string, AssetStatus>;
}

export interface PendingRemovalChange {
  type: 'offer' | 'template' | 'background';
  id: string;
  item: Offer | Template | Background;
  previousAssetStatuses: Record<string, AssetStatus>;
}

interface ProjectContextValue {
  backgrounds: Background[];
  templates: Template[];
  offers: Offer[];
  // IDs of items pending removal (kept in arrays for ghost-asset rendering)
  removedBgIds: Set<string>;
  removedTemplateIds: Set<string>;
  removedOfferIds: Set<string>;
  updateOffer: (id: string, updated: Partial<Offer>) => void;
  removeOffer: (id: string) => void;
  swapOffer: (oldOfferId: string, newOfferId: string) => void;
  removeTemplate: (id: string) => void;
  removeBackground: (id: string) => void;
  assets: Asset[];
  setAssetStatus: (id: string, status: AssetStatus) => void;
  bulkSetAssetStatus: (ids: Set<string>, status: AssetStatus) => void;
  everApprovedIds: Set<string>;
  pendingChanges: PendingOfferChange[];
  pendingRemovals: PendingRemovalChange[];
  applyChanges: () => void;
  revertChanges: (offerIds: Set<string>) => void;
  revertRemovals: (itemIds: Set<string>) => void;
  campaignLoaded: boolean;
  loadCampaign: () => void;
  assetVersions: Record<string, AssetVersion[]>;
  assetComments: Record<string, AssetComment[]>;
  addAssetComment: (assetId: string, text: string) => void;
  /** Whether the Approved task is enabled in the workflow */
  approvalEnabled: boolean;
  setApprovalEnabled: (enabled: boolean) => void;
  /** Evergreen-only: whether the project is locked against edits. */
  locked: boolean;
  setLocked: (locked: boolean) => void;
  /** Destination URLs for HTML asset CTAs: { [assetId]: { [ctaKey]: url } } */
  destinationUrls: Record<string, Record<string, string>>;
  setDestinationUrl: (assetId: string, ctaKey: string, url: string) => void;
  /** Bulk-apply destination URLs: { [assetId]: { [ctaKey]: url } } */
  bulkSetDestinationUrls: (updates: Record<string, Record<string, string>>) => void;
  /** The project currently loaded into this context — drives every task page's header/breadcrumb. */
  currentProject: Project;
  selectedProjectId: string;
  /** Switches the live project: swaps offers/templates/backgrounds and resets all in-progress workflow state. */
  selectProject: (id: string) => void;
  /** Only populated for Evergreen projects. */
  alerts: Alert[];
  /** Bulk shortcut (Kanban drag-drop / quick actions): applies the same transition to both the email and assets tracks at once. No-ops on an invalid transition. */
  moveAlert: (id: string, newStatus: AlertStatus) => void;
  /** Sets the email track's review state independently, recomputing the overall status. No-ops once the alert has been sent. */
  setEmailReview: (id: string, status: ReviewStatus) => void;
  /** Sets the assets track's review state independently, recomputing the overall status. No-ops once the alert has been sent. */
  setAssetsReview: (id: string, status: ReviewStatus) => void;
  /** Resets both review tracks to pending and moves the alert back to Generated. Only valid while the alert is Rejected. */
  rebuildAlert: (id: string) => void;
  /** Marks a fully-approved alert as Sent. Only valid while the alert is Approved. */
  sendAlert: (id: string) => void;
  /** Manually removes an alert from the Kanban/Table into the Archived Alerts dialog. No-ops if already archived. */
  archiveAlert: (id: string) => void;
  /**
   * Combined review action: approves or rejects one track and saves whatever Assignee/Mentioned
   * Teammates/Comment the reviewer entered alongside the decision — all three are optional. No-ops
   * once the alert has been sent.
   */
  reviewAlertTrack: (id: string, track: 'email' | 'assets', decision: Exclude<ReviewStatus, 'pending'>, input: { text: string; assigneeName?: string; assigneeAvatar?: string; mentionedNames: string[] }) => void;
  /**
   * Freeform, standalone commenting: always appends a new comment to the track's list — never
   * finds-and-overwrites like `reviewAlertTrack` — so comments can accumulate independently of
   * (and freely after) an Approve/Request Changes decision. Optionally anchored to a highlighted
   * range of email text or a pinned point on an asset creative.
   */
  addAlertComment: (id: string, track: 'email' | 'assets', input: { text: string; mentionedNames: string[]; anchor?: AlertCommentAnchor }) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

function computeAssets(offers: Offer[], templates: Template[], backgrounds: Background[], folder: string, defaultStatus: AssetStatus = 'draft'): Asset[] {
  const result: Asset[] = [];

  offers.forEach((offer) => {
    templates.forEach((tmpl) => {
      const tmplBgs = backgrounds.filter((b) => b.templateId === tmpl.id);
      tmplBgs.forEach((bg, bi) => {
        const dimLabel = `${tmpl.width} x ${tmpl.height}`;
        result.push({
          id: `asset-${offer.id}-${tmpl.id}-${bg.id}`,
          name: `${offer.vehicleName}_${dimLabel}_BG${bi + 1}`,
          description: `${tmpl.type === 'HTML' ? 'HTML' : 'Image'} | ${dimLabel}`,
          thumbnailUrl: bg.url,
          offerId: offer.id,
          templateId: tmpl.id,
          backgroundId: bg.id,
          status: defaultStatus,
          tags: [
            offer.offerTypes[0]?.type ?? 'Lease',
            dimLabel,
            tmpl.type === 'Facebook Post' ? 'Social' : tmpl.type === 'HTML' ? 'HTML' : 'Website',
          ],
          folder,
          width: tmpl.width,
          height: tmpl.height,
          imageType: tmpl.type === 'HTML' ? 'HTML' : 'Image',
          offerType: offer.offerTypes[0]?.type ?? 'Lease',
          platform: tmpl.type === 'Facebook Post' ? 'Social' : tmpl.type === 'HTML' ? 'HTML' : 'Website',
          offer,
          backgroundUrl: bg.url,
        });
      });
    });
  });

  return result;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_PROJECT_ID);
  const currentProject = useMemo(() => getProjectById(selectedProjectId), [selectedProjectId]);

  const [backgrounds, setBackgrounds] = useState<Background[]>(() => getProjectById(DEFAULT_PROJECT_ID).backgrounds);
  const [templates, setTemplates] = useState<Template[]>(() => getProjectById(DEFAULT_PROJECT_ID).templates);
  const [offers, setOffers] = useState<Offer[]>(() => getProjectById(DEFAULT_PROJECT_ID).offers);
  const [assetStatuses, setAssetStatuses] = useState<Record<string, AssetStatus>>({});
  const [everApprovedIds, setEverApprovedIds] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<PendingOfferChange[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<PendingRemovalChange[]>([]);

  // Items pending removal stay in their arrays for ghost-asset rendering;
  // these sets track which IDs are "logically removed" so UI can hide them.
  const [removedBgIds, setRemovedBgIds] = useState<Set<string>>(new Set());
  const [removedTemplateIds, setRemovedTemplateIds] = useState<Set<string>>(new Set());
  const [removedOfferIds, setRemovedOfferIds] = useState<Set<string>>(new Set());
  const [campaignLoaded, setCampaignLoaded] = useState(false);
  const loadCampaign = useCallback(() => setCampaignLoaded(true), []);
  const [approvalEnabled, setApprovalEnabled] = useState(() => getProjectById(DEFAULT_PROJECT_ID).approvalEnabled ?? true);
  const approvalEnabledRef = useRef(approvalEnabled);
  approvalEnabledRef.current = approvalEnabled;
  const [locked, setLocked] = useState(() => getProjectById(DEFAULT_PROJECT_ID).locked ?? true);
  const [alerts, setAlerts] = useState<Alert[]>(() => getProjectById(DEFAULT_PROJECT_ID).alerts ?? []);
  const [assetVersionHistory, setAssetVersionHistory] = useState<Record<string, AssetVersion[]>>({});
  const [assetComments, setAssetComments] = useState<Record<string, AssetComment[]>>({});
  const [destinationUrls, setDestinationUrlsState] = useState<Record<string, Record<string, string>>>({});

  const setDestinationUrl = useCallback((assetId: string, ctaKey: string, url: string) => {
    setDestinationUrlsState((prev) => ({
      ...prev,
      [assetId]: { ...prev[assetId], [ctaKey]: url },
    }));
  }, []);

  const bulkSetDestinationUrls = useCallback((updates: Record<string, Record<string, string>>) => {
    setDestinationUrlsState((prev) => {
      const next = { ...prev };
      Object.entries(updates).forEach(([assetId, ctaMap]) => {
        next[assetId] = { ...next[assetId], ...ctaMap };
      });
      return next;
    });
  }, []);

  const addAssetComment = useCallback((assetId: string, text: string) => {
    const comment: AssetComment = {
      id: `comment-${assetId}-${Date.now()}`,
      assetId,
      authorName: CURRENT_USER.name,
      authorAvatar: CURRENT_USER.avatarUrl,
      text,
      timestamp: Date.now(),
    };
    setAssetComments((prev) => ({
      ...prev,
      [assetId]: [...(prev[assetId] ?? []), comment],
    }));
  }, []);

  const makeActivityEntry = (id: string, action: AlertActivityAction, timestamp: number): AlertActivityEntry => ({
    id: `act-${id}-${timestamp}-${action}`,
    action,
    timestamp,
    actorName: CURRENT_USER.name,
    actorEmail: 'john.doe@mail.com',
    actorAvatar: CURRENT_USER.avatarUrl,
  });

  // Bulk shortcut used by the Kanban's drag-drop and quick-action buttons: applies the same
  // decision to both tracks at once, rather than requiring two separate dialog actions.
  const moveAlert = useCallback((id: string, newStatus: AlertStatus) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || !ALERT_TRANSITIONS[a.status].includes(newStatus)) return a;
      const timestamp = Date.now();

      if (newStatus === 'generated') {
        return {
          ...a,
          status: 'generated',
          emailStatus: 'pending',
          assetsStatus: 'pending',
          createdAt: timestamp, // Regenerating refreshes the "Created ... ago" clock.
          activity: [...a.activity, makeActivityEntry(id, 'rebuilt', timestamp)],
        };
      }
      if (newStatus === 'sent') {
        return { ...a, status: 'sent', activity: [...a.activity, makeActivityEntry(id, 'sent', timestamp)] };
      }

      const reviewStatus: ReviewStatus = newStatus === 'approved' ? 'approved' : 'rejected';
      const entries: AlertActivityEntry[] = [];
      if (a.emailStatus !== reviewStatus) entries.push(makeActivityEntry(id, reviewStatus === 'approved' ? 'email_approved' : 'email_rejected', timestamp));
      if (a.assetsStatus !== reviewStatus) entries.push(makeActivityEntry(id, reviewStatus === 'approved' ? 'assets_approved' : 'assets_rejected', timestamp));

      return {
        ...a,
        emailStatus: reviewStatus,
        assetsStatus: reviewStatus,
        status: newStatus,
        activity: [...a.activity, ...entries],
      };
    }));
  }, []);

  const setEmailReview = useCallback((id: string, reviewStatus: ReviewStatus) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status === 'sent') return a;
      const timestamp = Date.now();
      const activity = reviewStatus === 'pending'
        ? a.activity
        : [...a.activity, makeActivityEntry(id, reviewStatus === 'approved' ? 'email_approved' : 'email_rejected', timestamp)];
      return { ...a, emailStatus: reviewStatus, status: deriveAlertStatus(reviewStatus, a.assetsStatus), activity };
    }));
  }, []);

  const setAssetsReview = useCallback((id: string, reviewStatus: ReviewStatus) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status === 'sent') return a;
      const timestamp = Date.now();
      const activity = reviewStatus === 'pending'
        ? a.activity
        : [...a.activity, makeActivityEntry(id, reviewStatus === 'approved' ? 'assets_approved' : 'assets_rejected', timestamp)];
      return { ...a, assetsStatus: reviewStatus, status: deriveAlertStatus(a.emailStatus, reviewStatus), activity };
    }));
  }, []);

  const rebuildAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status !== 'rejected') return a;
      const timestamp = Date.now();
      return {
        ...a,
        status: 'generated',
        emailStatus: 'pending',
        assetsStatus: 'pending',
        createdAt: timestamp,
        activity: [...a.activity, makeActivityEntry(id, 'rebuilt', timestamp)],
      };
    }));
  }, []);

  const sendAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status !== 'approved') return a;
      return { ...a, status: 'sent', activity: [...a.activity, makeActivityEntry(id, 'sent', Date.now())] };
    }));
  }, []);

  /**
   * Combined review action: approves/rejects one track and, in the same update, saves whatever
   * Assignee/Mentioned Teammates/Comment the reviewer entered alongside the decision — all three
   * fields are optional. Undoing the decision (via setEmailReview/setAssetsReview back to 'pending')
   * leaves the saved comment in place so the fields re-populate for editing.
   */
  const reviewAlertTrack = useCallback((id: string, track: 'email' | 'assets', decision: Exclude<ReviewStatus, 'pending'>, input: { text: string; assigneeName?: string; assigneeAvatar?: string; mentionedNames: string[] }) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status === 'sent') return a;
      const timestamp = Date.now();

      const existing = a.comments ?? [];
      const existingComment = existing.find((c) => c.track === track);
      const hasContent = input.text.trim().length > 0 || !!input.assigneeName || input.mentionedNames.length > 0;
      let comments = existing;
      if (existingComment) {
        comments = existing.map((c) => c.id !== existingComment.id ? c : {
          ...c,
          text: input.text,
          assigneeName: input.assigneeName,
          assigneeAvatar: input.assigneeAvatar,
          mentionedNames: input.mentionedNames,
          editedAt: timestamp,
        });
      } else if (hasContent) {
        const comment: AlertComment = {
          id: `alert-comment-${id}-${track}-${timestamp}`,
          track,
          text: input.text,
          assigneeName: input.assigneeName,
          assigneeAvatar: input.assigneeAvatar,
          mentionedNames: input.mentionedNames,
          authorName: CURRENT_USER.name,
          authorAvatar: CURRENT_USER.avatarUrl,
          timestamp,
        };
        comments = [...existing, comment];
      }

      const activity = [...a.activity, makeActivityEntry(id, track === 'email'
        ? (decision === 'approved' ? 'email_approved' : 'email_rejected')
        : (decision === 'approved' ? 'assets_approved' : 'assets_rejected'), timestamp)];

      return track === 'email'
        ? { ...a, emailStatus: decision, status: deriveAlertStatus(decision, a.assetsStatus), activity, comments }
        : { ...a, assetsStatus: decision, status: deriveAlertStatus(a.emailStatus, decision), activity, comments };
    }));
  }, []);

  const addAlertComment = useCallback((
    id: string,
    track: 'email' | 'assets',
    input: { text: string; mentionedNames: string[]; anchor?: AlertCommentAnchor },
  ) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.status === 'sent' || !input.text.trim()) return a;
      const timestamp = Date.now();
      const comment: AlertComment = {
        id: `alert-comment-${id}-${track}-${timestamp}`,
        track,
        text: input.text.trim(),
        mentionedNames: input.mentionedNames,
        authorName: CURRENT_USER.name,
        authorAvatar: CURRENT_USER.avatarUrl,
        timestamp,
        anchor: input.anchor,
      };
      return { ...a, comments: [...(a.comments ?? []), comment] };
    }));
  }, []);

  // Manual archive — removes the alert from the Kanban/Table without changing its lifecycle status,
  // so the Archived Alerts dialog can still show what column it was in when archived.
  const archiveAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => {
      if (a.id !== id || a.archivedAt) return a;
      const timestamp = Date.now();
      return { ...a, archivedAt: timestamp, activity: [...a.activity, makeActivityEntry(id, 'archived', timestamp)] };
    }));
  }, []);

  const selectProject = useCallback((id: string) => {
    const project = getProjectById(id);
    setSelectedProjectId(id);
    setOffers(project.offers);
    setTemplates(project.templates);
    setBackgrounds(project.backgrounds);
    setAssetStatuses({});
    setEverApprovedIds(new Set());
    setPendingChanges([]);
    setPendingRemovals([]);
    setRemovedBgIds(new Set());
    setRemovedTemplateIds(new Set());
    setRemovedOfferIds(new Set());
    setCampaignLoaded(false);
    setApprovalEnabled(project.approvalEnabled ?? true);
    setLocked(project.locked ?? true);
    setAssetVersionHistory({});
    setAssetComments({});
    setDestinationUrlsState({});
    setAlerts(project.alerts ?? []);
  }, []);

  // All items (including pending removals) so computeAssets can still generate ghost assets.
  // Swap-only offers are excluded — they have no assets until they replace an out-of-stock offer.
  const rawAssets = useMemo(
    () => computeAssets(
      offers.filter(o => !o.swapOnly),
      templates,
      backgrounds,
      currentProject.projectName,
      currentProject.isEvergreen ? 'generated' : 'draft',
    ),
    [offers, templates, backgrounds, currentProject.projectName, currentProject.isEvergreen],
  );

  // Refs so callbacks can always read the latest values without stale closures
  const rawAssetsRef = useRef(rawAssets);
  rawAssetsRef.current = rawAssets;
  const assetStatusesRef = useRef(assetStatuses);
  assetStatusesRef.current = assetStatuses;

  const assets = useMemo(
    () => rawAssets
      .map((a) => assetStatuses[a.id] ? { ...a, status: assetStatuses[a.id] } : a)
      .filter((a) => {
        // Non-draft assets remain visible (they show as 'removed' in the Review task)
        if (a.status !== 'draft') return true;
        // Hide draft assets whose template, offer, or background is pending removal
        return (
          !removedTemplateIds.has(a.templateId) &&
          !removedOfferIds.has(a.offerId) &&
          !removedBgIds.has(a.backgroundId)
        );
      }),
    [rawAssets, assetStatuses, removedTemplateIds, removedOfferIds, removedBgIds],
  );

  const updateOffer = useCallback((id: string, updated: Partial<Offer>) => {
    const currentOffer = offers.find((o) => o.id === id);
    const prevAssetStatuses: Record<string, AssetStatus> = {};
    rawAssets.filter((a) => a.offerId === id).forEach((a) => {
      const status = assetStatuses[a.id] ?? 'draft';
      if (status !== 'draft') prevAssetStatuses[a.id] = status;
    });

    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));

    if (currentOffer) {
      setPendingChanges((prev) => {
        if (prev.some((c) => c.offerId === id)) return prev;
        return [...prev, { offerId: id, previousOffer: currentOffer, previousAssetStatuses: prevAssetStatuses }];
      });
    }

    setAssetStatuses((prev) => {
      const next = { ...prev };
      rawAssets.filter((a) => a.offerId === id).forEach((a) => {
        const currentStatus = prev[a.id] ?? 'draft';
        if (currentStatus !== 'draft' && currentStatus !== 'updated') {
          next[a.id] = 'updated';
        }
      });
      return next;
    });
  }, [rawAssets, offers, assetStatuses]);

  const markItemRemoved = useCallback((
    type: 'offer' | 'template' | 'background',
    id: string,
    item: Offer | Template | Background,
    filterFn: (a: Asset) => boolean,
  ) => {
    // Snapshot current statuses for assets that will be marked 'removed'
    const prevAssetStatuses: Record<string, AssetStatus> = {};
    rawAssets.filter(filterFn).forEach((a) => {
      prevAssetStatuses[a.id] = assetStatuses[a.id] ?? 'draft';
    });

    setPendingRemovals((prev) => {
      if (prev.some((r) => r.id === id)) return prev;
      return [...prev, { type, id, item, previousAssetStatuses: prevAssetStatuses }];
    });

    // Mark non-draft assets as 'removed'; draft assets stay as-is (they just disappear on apply)
    setAssetStatuses((prev) => {
      const next = { ...prev };
      rawAssets.filter(filterFn).forEach((a) => {
        const currentStatus = prev[a.id] ?? 'draft';
        if (currentStatus !== 'draft') {
          next[a.id] = 'removed';
        }
      });
      return next;
    });
  }, [rawAssets, assetStatuses]);

  const removeOffer = useCallback((id: string) => {
    const item = offers.find((o) => o.id === id);
    if (!item) return;
    markItemRemoved('offer', id, item, (a) => a.offerId === id);
    setRemovedOfferIds((prev) => new Set([...prev, id]));
  }, [offers, markItemRemoved]);

  const swapOffer = useCallback((oldOfferId: string, newOfferId: string) => {
    setOffers((prev) => {
      const newOffer = prev.find((o) => o.id === newOfferId);
      if (!newOffer) return prev;
      return prev
        .map((o) => o.id === oldOfferId
          ? { ...newOffer, id: oldOfferId, swapOnly: false, replacesOfferId: undefined, swapMatchType: undefined }
          : o
        )
        .filter((o) => o.id !== newOfferId);
    });
  }, []);

  const removeTemplate = useCallback((id: string) => {
    const item = templates.find((t) => t.id === id);
    if (!item) return;
    markItemRemoved('template', id, item, (a) => a.templateId === id);
    setRemovedTemplateIds((prev) => new Set([...prev, id]));
  }, [templates, markItemRemoved]);

  const removeBackground = useCallback((id: string) => {
    const item = backgrounds.find((b) => b.id === id);
    if (!item) return;
    markItemRemoved('background', id, item, (a) => a.backgroundId === id);
    setRemovedBgIds((prev) => new Set([...prev, id]));
  }, [backgrounds, markItemRemoved]);

  const setAssetStatus = useCallback((id: string, status: AssetStatus) => {
    setAssetStatuses((prev) => ({ ...prev, [id]: status }));
    if (status === 'approved') setEverApprovedIds((prev) => new Set([...prev, id]));
  }, []);

  const bulkSetAssetStatus = useCallback((ids: Set<string>, status: AssetStatus) => {
    setAssetStatuses((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[id] = status; });
      return next;
    });
    if (status === 'approved') setEverApprovedIds((prev) => new Set([...prev, ...ids]));
    if (status === 'awaiting_approval') {
      const now = Date.now();
      setAssetVersionHistory((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          const asset = rawAssetsRef.current.find((a) => a.id === id);
          if (!asset) return;
          const version: AssetVersion = {
            id: `v-${id}-${now}`,
            assetId: id,
            timestamp: now,
            offer: { ...asset.offer },
            backgroundUrl: asset.backgroundUrl,
            name: asset.name,
          };
          next[id] = [...(prev[id] ?? []), version];
        });
        return next;
      });
    }
  }, []);

  const applyChanges = useCallback(() => {
    // Record a new version for every 'updated' asset before changing statuses
    const now = Date.now();
    const currentStatuses = assetStatusesRef.current;
    const currentRawAssets = rawAssetsRef.current;
    const updatedIds = Object.entries(currentStatuses)
      .filter(([, s]) => s === 'updated')
      .map(([id]) => id);
    if (updatedIds.length > 0) {
      setAssetVersionHistory((prev) => {
        const next = { ...prev };
        updatedIds.forEach((id) => {
          const asset = currentRawAssets.find((a) => a.id === id);
          if (!asset) return;
          const version: AssetVersion = {
            id: `v-${id}-${now}`,
            assetId: id,
            timestamp: now,
            offer: { ...asset.offer },
            backgroundUrl: asset.backgroundUrl,
            name: asset.name,
          };
          next[id] = [...(prev[id] ?? []), version];
        });
        return next;
      });
    }

    // Finalize: remove pending-removal items from their arrays
    const removalsByType = { offer: new Set<string>(), template: new Set<string>(), background: new Set<string>() };
    pendingRemovals.forEach((r) => removalsByType[r.type].add(r.id));

    if (removalsByType.offer.size > 0) setOffers((prev) => prev.filter((o) => !removalsByType.offer.has(o.id)));
    if (removalsByType.template.size > 0) setTemplates((prev) => prev.filter((t) => !removalsByType.template.has(t.id)));
    if (removalsByType.background.size > 0) setBackgrounds((prev) => prev.filter((b) => !removalsByType.background.has(b.id)));

    setRemovedOfferIds(new Set());
    setRemovedTemplateIds(new Set());
    setRemovedBgIds(new Set());

    // updated → awaiting_approval (or 'generated' when approval is disabled); removed → gone
    const targetStatus = approvalEnabledRef.current ? 'awaiting_approval' : 'generated';
    setAssetStatuses((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id] === 'updated') next[id] = targetStatus;
        if (next[id] === 'removed') delete next[id];
      });
      return next;
    });

    setPendingChanges([]);
    setPendingRemovals([]);
  }, [pendingRemovals]);

  const revertChanges = useCallback((offerIds: Set<string>) => {
    const toRevert = pendingChanges.filter((c) => offerIds.has(c.offerId));

    setOffers((prev) => prev.map((o) => {
      const change = toRevert.find((c) => c.offerId === o.id);
      return change ? change.previousOffer : o;
    }));

    setAssetStatuses((prev) => {
      const next = { ...prev };
      toRevert.forEach((c) => {
        rawAssets.filter((a) => a.offerId === c.offerId).forEach((a) => {
          if (next[a.id] === 'updated') {
            if (c.previousAssetStatuses[a.id]) {
              next[a.id] = c.previousAssetStatuses[a.id];
            } else {
              delete next[a.id];
            }
          }
        });
      });
      return next;
    });

    setPendingChanges((prev) => prev.filter((c) => !offerIds.has(c.offerId)));
  }, [pendingChanges, rawAssets]);

  const revertRemovals = useCallback((itemIds: Set<string>) => {
    const toRevert = pendingRemovals.filter((r) => itemIds.has(r.id));

    // Restore asset statuses for reverted items
    setAssetStatuses((prev) => {
      const next = { ...prev };
      toRevert.forEach((r) => {
        Object.entries(r.previousAssetStatuses).forEach(([assetId, prevStatus]) => {
          if (next[assetId] === 'removed') {
            if (prevStatus === 'draft') {
              delete next[assetId];
            } else {
              next[assetId] = prevStatus;
            }
          }
        });
      });
      return next;
    });

    // Remove reverted IDs from the removed sets
    const revertedIds = new Set(toRevert.map((r) => r.id));
    setRemovedBgIds((prev) => new Set([...prev].filter((id) => !revertedIds.has(id))));
    setRemovedTemplateIds((prev) => new Set([...prev].filter((id) => !revertedIds.has(id))));
    setRemovedOfferIds((prev) => new Set([...prev].filter((id) => !revertedIds.has(id))));

    setPendingRemovals((prev) => prev.filter((r) => !itemIds.has(r.id)));
  }, [pendingRemovals]);

  return (
    <ProjectContext.Provider value={{
      backgrounds, templates, offers,
      removedBgIds, removedTemplateIds, removedOfferIds,
      updateOffer, removeOffer, swapOffer, removeTemplate, removeBackground,
      assets, setAssetStatus, bulkSetAssetStatus, everApprovedIds,
      pendingChanges, pendingRemovals,
      applyChanges, revertChanges, revertRemovals,
      campaignLoaded, loadCampaign,
      assetVersions: assetVersionHistory,
      assetComments,
      addAssetComment,
      approvalEnabled, setApprovalEnabled,
      locked, setLocked,
      destinationUrls, setDestinationUrl, bulkSetDestinationUrls,
      currentProject, selectedProjectId, selectProject,
      alerts, moveAlert, setEmailReview, setAssetsReview, rebuildAlert, sendAlert, archiveAlert, reviewAlertTrack, addAlertComment,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be inside ProjectProvider');
  return ctx;
}
