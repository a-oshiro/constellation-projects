// Batch AI Enhance — the full-screen dialog behind the Portal's AI Enhance
// action (Figma: CP-XXXXX AI Enhance Updates, node 4112:9293).
//
// Left: the tool rail (only Enhance is live), then the Enhance column, laid
// out like an AI chat: each request is a speech bubble, answered by a short
// reply with thumbs up/down and a retry; the prompt box at the foot carries the
// reference images and the send/stop button. Right: one accordion per selected
// asset, its source beside four generated variants.
//
// Each asset is one request to /api/enhance-asset, which asks OpenAI for all
// of that asset's variants in a single call. Variants the user has ticked are
// KEPT on a regenerate — only the empty or unticked slots are asked for again,
// so a regenerate costs only what it replaces.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Maximize2, Plus, Square, ArrowUp, ThumbsUp, ThumbsDown, History,
} from "lucide-react";
import { Checkbox } from "@portal/components/ui/checkbox";
import enhanceIcon from "../../../assets/icons/ai-enhance/enhance.svg";
import resizeIcon from "../../../assets/icons/ai-enhance/resize.svg";
import upscaleIcon from "../../../assets/icons/ai-enhance/upscale-4k.svg";
import { Tooltip } from "@portal/components/ui/Tooltip";
import type { PortalAsset } from "@portal/lib/portal-assets";

// ─── Constants ────────────────────────────────────────────────────────────

const VARIANTS = 4;

/** The prompt box dropping from under the title to the foot of the column on
 *  the first request, shrinking to one line on the way. A plain cubic
 *  ease-out: the stronger curve used for opening covered a quarter of this
 *  much longer trip in its first frame, and the drop read as a jump. */
const MOVE_MS = 300;
const MOVE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** The prompt box opening (and folding): a strong ease-out, no overshoot. */
const RESIZE_MS = 300;
const RESIZE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MAX_REFERENCES = 7;
/** Requests in flight at once. Every asset is its own OpenAI call, and a large
 *  selection fired all together would run into the API's rate limits. */
const CONCURRENCY = 3;
/** Longest edge, in pixels, an image is shrunk to before it is sent. Matches
 *  the largest standard output size, so detail in logos and text survives;
 *  image input is billed by size, so it is not sent larger. */
const MAX_UPLOAD_EDGE = 1536;

/** The loading line above the prompt. A new phrase every 2400ms, typed in one
 *  letter every 30ms — so a phrase can be at most 80 characters long to finish
 *  before the next one starts. */
const PHRASE_MS = 2400;
const LETTER_MS = 30;
const PHRASES = [
  "Thinking...",
  "Reading references...",
  "Analyzing request...",
  "Studying the assets...",
  "Composing variants...",
  "Generating images...",
  "Balancing light and color...",
  "Refining details...",
  "Almost there...",
];

// ─── Types ────────────────────────────────────────────────────────────────

interface Reference { id: string; name: string; dataUrl: string }

/** The image model's render tier. Higher looks better and costs several times
 *  more per variant; the API's own default is medium. */
type Quality = "low" | "medium" | "high";
const QUALITY_LABEL: Record<Quality, string> = { low: "Low", medium: "Medium", high: "High" };

/** One exchange in the Enhance column's chat: the request as sent, and how
 *  it went. Kept for as long as the dialog is open. */
interface Turn {
  id: string;
  prompt: string;
  /** The reference images sent with it, so a retry sends the same ones. */
  references: Reference[];
  /** The quality it was asked at — a retry asks at the same one. */
  quality: Quality;
  /** The variants it produced, once finished — absent if it changed nothing. */
  snapshot?: Snapshot;
  status: "running" | "done" | "stopped" | "error";
  /** The reply under the bubble, once it has finished. */
  reply?: string;
  feedback?: "up" | "down";
}

/** Every asset's variants and ticks as a request left them — what "Revert to
 *  this version" puts back. */
type Snapshot = Record<string, { slots: (string | null)[]; selected: boolean[] }>;

/** How a run went, asset by asset, for the reply — and the variants it left. */
interface RunOutcome {
  total: number; updated: number; failed: number; aborted: boolean; firstError?: string;
  snapshot: Snapshot;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The reply to a finished request. Written from what happened rather than by
 *  a model: the image API returns images, not words, and a second call per
 *  request for a sentence would cost time and money. */
function replyFor(o: RunOutcome): { status: Turn["status"]; reply: string } {
  if (o.aborted) {
    return {
      status: "stopped",
      reply: o.updated ? `Stopped. ${plural(o.updated, "asset")} had already been updated.` : "Stopped.",
    };
  }
  if (o.total === 0) {
    return { status: "done", reply: "Every variant is ticked, so there was nothing to replace. Untick some to generate new ones." };
  }
  if (o.updated === 0) {
    return { status: "error", reply: o.firstError ? `That didn't work: ${o.firstError}` : "That didn't work. Try again." };
  }
  if (o.failed) {
    return {
      status: "done",
      reply: `Updated ${o.updated} of ${plural(o.total, "asset")}. ${plural(o.failed, "asset")} failed; the error is shown on ${o.failed === 1 ? "it" : "each"}.`,
    };
  }
  return {
    status: "done",
    reply: o.total === 1 ? "Done. The asset has new variants on the right." : `Done. All ${o.total} assets have new variants on the right.`,
  };
}

interface AssetState {
  /** The four variant slots; null until one is generated. */
  slots: (string | null)[];
  /** Slots waiting on a request — drawn as skeletons. */
  pending: boolean[];
  /** Ticked variants: kept on regenerate, and what the footer saves. */
  selected: boolean[];
  error?: string;
  open: boolean;
}

export interface EnhancedPick { asset: PortalAsset; url: string; variant: number }

const freshState = (): AssetState => ({
  slots: Array(VARIANTS).fill(null),
  pending: Array(VARIANTS).fill(false),
  selected: Array(VARIANTS).fill(false),
  open: true,
});

// ─── Image helpers ────────────────────────────────────────────────────────

/** Shrinks an image to MAX_UPLOAD_EDGE and returns it as a data URL. PNG stays
 *  PNG so a logo keeps its transparency; anything else becomes JPEG. */
async function toUploadDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return blob.type === "image/png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.95);
}

/** Platform assets are sent by URL and fetched server-side; anything served
 *  from this app (the local sample library) is read here and sent as data. */
async function sourcePayload(asset: PortalAsset): Promise<{ sourceUrl?: string; sourceImage?: string }> {
  if (/^https?:\/\//.test(asset.url) && !asset.url.startsWith(window.location.origin)) {
    return { sourceUrl: asset.url };
  }
  const res = await fetch(asset.url);
  if (!res.ok) throw new Error(`Could not read ${asset.name}`);
  return { sourceImage: await toUploadDataUrl(await res.blob()) };
}

/** Reads the endpoint's streamed answer — keep-alive whitespace, then JSON. */
async function readAnswer(res: Response): Promise<{ images?: string[]; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected response (${res.status})` };
  }
}

// ─── Small pieces ─────────────────────────────────────────────────────────

/** 42s · 3min 5s · 1h 2min 5s */
function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h) return `${h}h ${m}min ${s}s`;
  if (m) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Time since the request started. It mounts with the request, so mounting
 *  is the start. */
function ElapsedTimer() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span
      className="shrink-0 text-[12px] leading-[1.43] tracking-[0.17px] tabular-nums text-semantic-text-secondary"
      aria-label="Time elapsed"
    >
      {formatElapsed(Math.floor((now - start) / 1000))}
    </span>
  );
}

/** The loading line: a spinner and a phrase typed in letter by letter. */
function ThinkingLine({ phrases }: { phrases: string[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), LETTER_MS);
    return () => window.clearInterval(id);
  }, []);
  const perPhrase = PHRASE_MS / LETTER_MS;
  const phrase = phrases[Math.floor(tick / perPhrase) % phrases.length];
  const shown = phrase.slice(0, (tick % perPhrase) + 1);
  return (
    <div className="flex items-center gap-2 h-5 shrink-0" role="status" aria-live="polite">
      <span className="size-4 shrink-0 rounded-full border-2 border-gray-200 border-t-semantic-primary-main animate-spin" />
      <span className="sr-only">{phrase}</span>
      <span aria-hidden className="text-[12px] leading-[1.43] tracking-[0.17px] text-semantic-text-secondary">
        {shown}
      </span>
    </div>
  );
}

function IconButton({
  label, onClick, disabled, children,
}: { label: string; onClick?: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="p-[5px] rounded-full text-semantic-action-active hover:bg-semantic-action-hover disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

/** One tile of the tool rail on the far left. */
/** One tab of the tool rail — Figma "Side Sheet / Vertical Tabs" (node
 *  4175:5278): a 56px square, 24px icon over an 11px label, the selected one
 *  on a light purple wash. */
function ToolTile({
  icon, tint, label, active, disabled,
}: {
  icon: string;
  /** Paint the icon entirely in the label's purple. The Figma exports carry
   *  black fills (the colour is an override on the canvas), so each is used as
   *  a mask over `currentColor` rather than recoloured. */
  tint?: boolean;
  label: string; active?: boolean; disabled?: boolean;
}) {
  const tile = (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      className={`size-14 shrink-0 flex flex-col items-center gap-2 pt-[7px] pb-[3px] rounded-[5px] text-semantic-primary-main transition-colors ${
        active ? "bg-[rgba(99,86,225,0.08)]" : disabled ? "cursor-not-allowed" : "hover:bg-[rgba(99,86,225,0.04)]"
      }`}
    >
      {tint ? (
        <span
          aria-hidden
          className="size-6 shrink-0 bg-current"
          // Quoted: small SVGs arrive inlined as data URLs, which break unquoted.
          style={{ mask: `url("${icon}") center / contain no-repeat`, WebkitMask: `url("${icon}") center / contain no-repeat` }}
        />
      ) : (
        <img src={icon} alt="" width={24} height={24} className="size-6 shrink-0" />
      )}
      <span className="h-[14px] flex items-center text-[11px] leading-[1.66] tracking-[0.4px] whitespace-nowrap">{label}</span>
    </button>
  );
  return disabled ? <Tooltip label="Coming soon">{tile}</Tooltip> : tile;
}

/** One tile of an asset's row — the source or a variant. The five share the
 *  row's width equally between 160px and 240px; below 160px the row scrolls
 *  sideways instead of squeezing them. */
const TILE = "flex flex-col flex-[1_1_0] min-w-[160px] max-w-[240px]";

/** A tile: the source, a variant, or the skeleton standing in for one. */
function Thumb({
  label, url, pending, selected, onToggle, onPreview, disabled, isSource,
}: {
  label: string;
  url: string | null;
  pending?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onPreview?: () => void;
  disabled?: boolean;
  isSource?: boolean;
}) {
  if (pending) {
    return (
      <div className={TILE}>
        <div className="portal-skeleton aspect-square w-full rounded-xl" />
        <div className="pt-1 h-[30px] flex items-center">
          <div className="portal-skeleton h-3 w-[60%] rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className={TILE}>
      <div
        className={`relative aspect-square w-full rounded-xl overflow-hidden bg-[#f0f2f4] ${
          isSource ? "" : selected ? "border-[3px] border-semantic-primary-main" : "border border-black/[0.12]"
        }`}
      >
        {url && <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />}
        {onToggle && url && (
          <>
            <button
              type="button"
              aria-label={selected ? `Deselect ${label}` : `Select ${label}`}
              onClick={onToggle}
              disabled={disabled}
              className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="absolute top-2 left-2">
              <Checkbox checked={selected} onCheckedChange={onToggle} disabled={disabled} aria-label={label} />
            </div>
          </>
        )}
      </div>
      <div className="pt-1 flex items-center">
        <span
          className={`flex-1 min-w-0 truncate text-[12px] leading-[1.43] tracking-[0.17px] ${
            selected ? "text-semantic-primary-main" : "text-semantic-text-secondary"
          }`}
        >
          {label}
        </span>
        <IconButton label={`Preview ${label}`} onClick={onPreview} disabled={!url}>
          <Maximize2 size={14} />
        </IconButton>
      </div>
    </div>
  );
}

/** The user's request, as a light-purple bubble on the right, with the
 *  reference images that went with it. */
function RequestBubble({ turn }: { turn: Turn }) {
  return (
    <div className="self-end max-w-[85%] flex flex-col gap-2 px-3 py-2 rounded-2xl rounded-br-md bg-[#eeedfe] text-[#26215c]">
      {turn.references.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {turn.references.map((r) => (
            <img
              key={r.id}
              src={r.dataUrl}
              alt={r.name}
              title={r.name}
              className="size-10 rounded-md object-cover border border-black/[0.08] bg-white"
            />
          ))}
        </div>
      )}
      <p className="text-[14px] leading-[1.45] whitespace-pre-wrap break-words">{turn.prompt}</p>
    </div>
  );
}

/** The answer to a request, with feedback and a retry under it — small grey
 *  icons, the picked thumb in the app's purple. */
function Reply({
  turn, busy, onFeedback, onRetry, revert,
}: {
  turn: Turn; busy: boolean; onFeedback: (f: "up" | "down") => void; onRetry: () => void;
  /** Present when the request produced variants to go back to. */
  revert?: { current: boolean; onlyOne: boolean; onRevert: () => void };
}) {
  const tone = turn.status === "error" ? "text-semantic-error-main"
    : turn.status === "stopped" ? "text-semantic-text-secondary"
    : "text-semantic-text-primary";
  const icon = "size-7 rounded-md flex items-center justify-center transition-colors hover:bg-semantic-action-hover disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed";
  const off = "text-[#9c99a9] hover:text-semantic-text-secondary";
  const on = "text-semantic-primary-main";
  return (
    <div className="flex flex-col gap-1">
      <p className={`text-[14px] leading-[1.5] ${tone}`}>{turn.reply}</p>
      <div className="flex items-center -ml-1.5">
        {turn.status === "done" && (
          <>
            <Tooltip label="Good result">
              <button type="button" aria-label="Good result" aria-pressed={turn.feedback === "up"} onClick={() => onFeedback("up")} className={`${icon} ${turn.feedback === "up" ? on : off}`}>
                <ThumbsUp size={15} />
              </button>
            </Tooltip>
            <Tooltip label="Bad result">
              <button type="button" aria-label="Bad result" aria-pressed={turn.feedback === "down"} onClick={() => onFeedback("down")} className={`${icon} ${turn.feedback === "down" ? on : off}`}>
                <ThumbsDown size={15} />
              </button>
            </Tooltip>
          </>
        )}
        <Tooltip label="Try again for all assets">
          <button type="button" aria-label="Try again for all assets" onClick={onRetry} disabled={busy} className={`${icon} ${off}`}>
            <RefreshCw size={15} />
          </button>
        </Tooltip>
        {revert && (
          <Tooltip
            label={revert.onlyOne ? "Revert to this version · there is only one version so far"
              : revert.current ? "Revert to this version · this is the current version"
              : "Revert to this version"}
          >
            <button
              type="button"
              aria-label="Revert to this version"
              onClick={revert.onRevert}
              disabled={busy || revert.onlyOne || revert.current}
              className={`${icon} ${off}`}
            >
              <History size={15} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ─── The dialog ───────────────────────────────────────────────────────────

export function AiEnhanceDialog({
  open, assets, onClose, onSaveAsNew, onSaveAsVersions,
}: {
  open: boolean;
  /** The selected assets — images with a file behind them. */
  assets: PortalAsset[];
  onClose: () => void;
  onSaveAsNew: (picks: EnhancedPick[]) => void;
  onSaveAsVersions: (picks: EnhancedPick[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  /** References attached to the request being written; they travel with it. */
  const [references, setReferences] = useState<Reference[]>([]);
  /** The chat so far, oldest first. */
  const [turns, setTurns] = useState<Turn[]>([]);
  const [quality, setQuality] = useState<Quality>("medium");
  /** The request whose variants are on screen right now — null once a
   *  per-asset regenerate has mixed in variants of its own. */
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  /** The prompt box opened up by the user (focus or a click) after the first
   *  request. Before the first request it is always open. */
  const [boxOpen, setBoxOpen] = useState(false);
  /** The prompt box's outer slot (moved) and the box itself (resized). */
  const boxSlotRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  /** Where the box was, and how tall, just before a change that moves or
   *  resizes it — read by the layout effect that animates from there. */
  const moveFrom = useRef<number | null>(null);
  const heightFrom = useRef<number | null>(null);
  /** Remember the box's height before it is opened or folded. */
  const markResize = () => {
    if (boxRef.current) heightFrom.current = boxRef.current.offsetHeight;
  };
  const historyRef = useRef<HTMLDivElement>(null);
  const [states, setStates] = useState<Record<string, AssetState>>({});
  /** The enlarged view: the images it can step through, and which is shown. */
  const [preview, setPreview] = useState<{ items: { url: string; label: string }[]; index: number } | null>(null);
  const openPreview = (items: { url: string; label: string }[], index: number) => setPreview({ items, index });
  /** Steps the preview by `delta`, wrapping at either end. */
  const stepPreview = useCallback((delta: number) => {
    setPreview((p) => (p && p.items.length > 1
      ? { ...p, index: (p.index + delta + p.items.length) % p.items.length }
      : p));
  }, []);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);


  // A fresh workspace each time the dialog opens on a selection.
  const assetKey = assets.map((a) => a.id).join(",");
  useEffect(() => {
    if (!open) return;
    setStates(Object.fromEntries(assets.map((a) => [a.id, freshState()])));
    setPreview(null);
    setTurns([]);
    setCurrentVersion(null);
    setBoxOpen(false);
    // Ready to type the moment it opens.
    window.setTimeout(() => promptRef.current?.focus(), 0);
    setPrompt("");
    setReferences([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assetKey]);

  const stateOf = (id: string) => states[id] ?? freshState();
  const busy = Object.values(states).some((s) => s.pending.some(Boolean));
  /** A request has been sent: the column is a chat now. */
  const started = turns.length > 0;
  /** The full prompt box, with + and quality — otherwise the one-line one. */
  const expanded = !started || (boxOpen && !busy);

  // The prompt grows with its text. Its height is set to what the text needs;
  // the column's flex layout then caps it at the room left (it shrinks before
  // anything else does), and past that the textarea scrolls.
  useLayoutEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt, open, expanded]);

  // The box's moves and resizes, animated from where they started (FLIP): the
  // layout changes at once, and the box is played from its old place or size
  // into the new one. Runs after the textarea has taken its new height.
  useLayoutEffect(() => {
    const slot = boxSlotRef.current;
    const box = boxRef.current;
    const from = moveFrom.current;
    const fromH = heightFrom.current;
    moveFrom.current = null;
    heightFrom.current = null;
    if (!slot || !box || prefersReducedMotion()) return;

    /** Eases the box's height from what it was to what it is now. */
    const resize = (fromHeight: number, duration: number, easing: string) => {
      const toH = box.offsetHeight;
      if (Math.abs(toH - fromHeight) <= 1) return 0;
      box.style.overflow = "hidden";
      const anim = box.animate(
        [{ height: `${fromHeight}px` }, { height: `${toH}px` }],
        { duration, easing },
      );
      const done = () => { box.style.overflow = ""; };
      anim.onfinish = done;
      anim.oncancel = done;
      return fromHeight - toH;
    };

    if (from !== null) {
      // First request: from under the title to the foot, shrinking to one
      // line on the way rather than snapping to it first. Both use the same
      // curve and duration, so they move as one.
      // Where the slot ends up — read before the shrink starts, since a
      // running height animation already moves it.
      const to = slot.getBoundingClientRect().top;
      const shrink = fromH !== null ? resize(fromH, MOVE_MS, MOVE_EASE) : 0;
      // The box sits at the foot of its slot, so while it is still taller the
      // slot's top is that much higher; the move starts from the old place
      // with that accounted for, and the two meet at the end.
      const dy = from - to + shrink;
      if (Math.abs(dy) > 1) {
        slot.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
          { duration: MOVE_MS, easing: MOVE_EASE },
        );
      }
      return;
    }
    // Opening or folding in place: the height eases to its new value. The
    // box sits at the foot of the column, so it grows upwards.
    if (fromH !== null) resize(fromH, RESIZE_MS, RESIZE_EASE);
  }, [expanded, started]);
  /** The latest request — what the per-asset regenerate buttons repeat. */
  const lastTurn = turns.length ? turns[turns.length - 1] : undefined;

  const patch = useCallback((id: string, fn: (s: AssetState) => AssetState) => {
    setStates((prev) => ({ ...prev, [id]: fn(prev[id] ?? freshState()) }));
  }, []);

  /** Asks for new variants in every slot of these assets that is not ticked,
   *  and says how it went. */
  const run = useCallback(async (
    targets: PortalAsset[], text: string, sentRefs: Reference[], sentQuality: Quality,
  ): Promise<RunOutcome> => {
    const controller = new AbortController();
    abortRef.current = controller;
    const refs = sentRefs.map((r) => r.dataUrl);
    // The version this run will leave, built from what it starts with plus
    // what it receives — exact, with no need to read state back afterwards.
    const snapshot: Snapshot = Object.fromEntries(assets.map((a) => {
      const s = states[a.id] ?? freshState();
      return [a.id, { slots: [...s.slots], selected: [...s.selected] }];
    }));
    const outcome: RunOutcome = { total: 0, updated: 0, failed: 0, aborted: false, snapshot };

    // Which slots each asset will fill — decided now, from the ticks as they stand.
    const jobs = targets
      .map((asset) => {
        const s = states[asset.id] ?? freshState();
        const slots = s.selected.map((sel, i) => (sel && s.slots[i] ? -1 : i)).filter((i) => i >= 0);
        return { asset, slots };
      })
      .filter((j) => j.slots.length > 0);
    outcome.total = jobs.length;

    for (const j of jobs) {
      patch(j.asset.id, (s) => ({
        ...s,
        error: undefined,
        open: true,
        pending: s.pending.map((p, i) => p || j.slots.includes(i)),
      }));
    }

    const one = async (job: (typeof jobs)[number]) => {
      const settle = (fn: (s: AssetState) => AssetState) =>
        patch(job.asset.id, (s) => fn({ ...s, pending: s.pending.map((p, i) => (job.slots.includes(i) ? false : p)) }));
      try {
        if (controller.signal.aborted) return settle((s) => s);
        const source = await sourcePayload(job.asset);
        const res = await fetch("/api/enhance-asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            ...source,
            width: job.asset.width,
            height: job.asset.height,
            references: refs,
            count: job.slots.length,
            quality: sentQuality,
          }),
          signal: controller.signal,
        });
        const answer = await readAnswer(res);
        if (!answer.images?.length) {
          if (controller.signal.aborted) return settle((s) => s);
          outcome.failed += 1;
          outcome.firstError ??= answer.error;
          return settle((s) => ({ ...s, error: answer.error ?? "Image generation failed" }));
        }
        outcome.updated += 1;
        const snap = snapshot[job.asset.id];
        job.slots.forEach((slot, k) => {
          if (snap && answer.images![k]) {
            snap.slots[slot] = answer.images![k];
            snap.selected[slot] = false;
          }
        });
        settle((s) => {
          const slots = [...s.slots];
          const selected = [...s.selected];
          job.slots.forEach((slot, k) => {
            if (answer.images![k]) {
              slots[slot] = answer.images![k];
              selected[slot] = false;
            }
          });
          return { ...s, slots, selected };
        });
      } catch (e) {
        // Stopped: the slots keep whatever they showed before.
        if (controller.signal.aborted) return settle((s) => s);
        outcome.failed += 1;
        outcome.firstError ??= e instanceof Error ? e.message : undefined;
        settle((s) => ({ ...s, error: e instanceof Error ? e.message : "Image generation failed" }));
      }
    };

    // A small pool, so a large selection does not fire every request at once.
    const queue = [...jobs];
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let job = queue.shift(); job; job = queue.shift()) await one(job);
      }),
    );
    if (abortRef.current === controller) abortRef.current = null;
    outcome.aborted = controller.signal.aborted;
    return outcome;
  }, [assets, states, patch]);

  const patchTurn = (id: string, fn: (t: Turn) => Turn) =>
    setTurns((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

  /** Runs a turn's request over every asset and writes its reply. */
  const runTurn = async (turn: Turn) => {
    const outcome = await run(assets, turn.prompt, turn.references, turn.quality);
    const { status, reply } = replyFor(outcome);
    const changed = outcome.updated > 0;
    patchTurn(turn.id, (t) => ({ ...t, status, reply, snapshot: changed ? outcome.snapshot : t.snapshot }));
    if (changed) setCurrentVersion(turn.id);
  };

  /** Puts every asset's variants and ticks back to how a request left them. */
  const revertTo = (turn: Turn) => {
    const snap = turn.snapshot;
    if (!snap || busy) return;
    setStates((prev) => {
      const next = { ...prev };
      for (const [id, v] of Object.entries(snap)) {
        const s = prev[id] ?? freshState();
        next[id] = {
          ...s,
          slots: [...v.slots],
          selected: [...v.selected],
          pending: Array(VARIANTS).fill(false),
          error: undefined,
        };
      }
      return next;
    });
    setCurrentVersion(turn.id);
  };

  /** The prompt box's send: the request becomes a bubble, the box empties for
   *  the next one, and its references go with it. */
  const send = () => {
    const text = prompt.trim();
    if (!text || busy || assets.length === 0) return;
    const turn: Turn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt: text,
      references,
      quality,
      status: "running",
    };
    // The first request sends the box from under the title to the foot of the
    // column; later ones only fold it.
    if (!started && boxSlotRef.current) moveFrom.current = boxSlotRef.current.getBoundingClientRect().top;
    markResize();
    setTurns((prev) => [...prev, turn]);
    setPrompt("");
    setReferences([]);
    // Folds to one line while it works; the textarea is disabled, so the
    // focus it had goes too.
    setBoxOpen(false);
    void runTurn(turn);
  };

  /** A reply's retry: the same request and references, again, for every asset. */
  const retry = (turn: Turn) => {
    if (busy) return;
    patchTurn(turn.id, (t) => ({ ...t, status: "running", reply: undefined, feedback: undefined }));
    void runTurn(turn);
  };

  // The newest exchange in view: on a new request, and when its reply lands.
  const lastStatus = lastTurn?.status;
  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns.length, lastStatus]);

  const stop = () => abortRef.current?.abort();

  const close = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (preview && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        stepPreview(e.key === "ArrowLeft" ? -1 : 1);
        return;
      }
      if (e.key !== "Escape") return;
      if (preview) setPreview(null);
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, preview, close, stepPreview]);

  // Stop anything in flight if the dialog goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function addReferences(files: FileList | null) {
    if (!files) return;
    const room = MAX_REFERENCES - references.length;
    const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    const added = await Promise.all(
      picked.map(async (f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        dataUrl: await toUploadDataUrl(f),
      })),
    );
    setReferences((prev) => [...prev, ...added].slice(0, MAX_REFERENCES));
  }

  const picks: EnhancedPick[] = useMemo(
    () => assets.flatMap((asset) => {
      const s = states[asset.id];
      if (!s) return [];
      return s.slots.flatMap((url, i) => (url && s.selected[i] ? [{ asset, url, variant: i + 1 }] : []));
    }),
    [assets, states],
  );

  /** Every generated variant, asset by asset — what the preview's arrows step through. */
  const results = useMemo(
    () => assets.flatMap((asset) => (states[asset.id]?.slots ?? []).flatMap((url, i) => (
      url ? [{ key: `${asset.id}:${i}`, url, label: `${asset.name} — Variant ${i + 1}` }] : []
    ))),
    [assets, states],
  );

  const runningRefs = turns.find((t) => t.status === "running")?.references.length ?? 0;
  const phrases = useMemo(
    () => (runningRefs ? PHRASES : PHRASES.filter((p) => !p.startsWith("Reading references"))),
    [runningRefs],
  );

  if (!open) return null;

  const canSend = !!prompt.trim() && !busy && assets.length > 0;
  /** Send, or stop while a request runs — the same button in both box states. */
  const submitButton = busy ? (
                      <Tooltip key="stop" label="Stop generation">
                        <button
                          type="button"
                          aria-label="Stop generation"
                          onClick={stop}
                          className="size-8 rounded-full bg-semantic-primary-main hover:bg-[#3b3093] flex items-center justify-center text-white transition-colors"
                        >
                          <Square size={12} fill="currentColor" />
                        </button>
                      </Tooltip>
                    ) : (
                      <Tooltip key="send" label="Send">
                        <button
                          type="button"
                          aria-label="Send"
                          onClick={send}
                          disabled={!canSend}
                          className="size-8 rounded-full bg-semantic-primary-main hover:bg-[#3b3093] flex items-center justify-center text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp size={16} strokeWidth={2.25} />
                        </button>
                      </Tooltip>
                    );
  const n = picks.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-enhance-title"
        className="relative w-full h-full bg-white rounded-[24px] overflow-hidden flex flex-col shadow-[0px_11px_15px_-7px_rgba(0,0,0,0.2),0px_24px_38px_3px_rgba(0,0,0,0.14),0px_9px_46px_8px_rgba(0,0,0,0.12)]"
      >
        {/* ── Title ── */}
        <div className="flex items-center gap-6 px-4 pt-4 pb-2 border-b border-black/[0.12] shrink-0">
          <h2 id="ai-enhance-title" className="flex-1 text-[16px] font-medium leading-[1.5] tracking-[0.024px] text-semantic-text-primary">
            Batch AI Enhance
          </h2>
          <IconButton label="Close" onClick={close}>
            <X size={20} />
          </IconButton>
        </div>

        {/* ── Workspace ── */}
        <div className="flex-1 min-h-0 flex">
          {/* Tool rail — only Enhance is live for now. */}
          <div className="shrink-0 flex flex-col items-center gap-2 pt-2 px-2 border-r border-black/[0.12] overflow-y-auto">
            <ToolTile icon={enhanceIcon} tint label="Enhance" active />
            {/* Not built yet: disabled, with a "Coming soon" tooltip, but drawn
              * in the same purple as Enhance, as in the design. */}
            <ToolTile icon={resizeIcon} tint label="Resize" disabled />
            <ToolTile icon={upscaleIcon} tint label="Upscale" disabled />
          </div>

          {/* The Enhance column, as a chat.
            *  · Before the first request: the title and its description, and
            *    the full prompt box straight under them, focused.
            *  · From the first request on: the title alone, the history (which
            *    scrolls), and the prompt box pinned to the foot — collapsed to
            *    one line (placeholder and send/stop) until it is clicked, and
            *    always collapsed while a request runs. */}
          <div className="w-[350px] shrink-0 flex flex-col min-h-0">
            <div className="flex flex-col gap-1 shrink-0 px-4 pt-4 pb-3">
              <p className="text-[16px] font-medium leading-[1.75] tracking-[0.15px] text-semantic-text-primary">Enhance</p>
              {!started && (
                <p className="text-[12px] leading-[1.43] tracking-[0.17px] text-semantic-text-secondary">
                  Ask AI what you wish to change on the selected assets. Selected variants are kept. Everything else is replaced.
                </p>
              )}
            </div>

            {/* History */}
            {started && (
            <div ref={historyRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-1 pb-4 flex flex-col gap-4" aria-live="polite">
              {turns.map((t) => (
                <div key={t.id} className="flex flex-col gap-2">
                  <RequestBubble turn={t} />
                  {t.status === "running" ? (
                    <div className="flex items-center justify-between gap-2">
                      <ThinkingLine phrases={phrases} />
                      <ElapsedTimer />
                    </div>
                  ) : (
                    <Reply
                      turn={t}
                      busy={busy}
                      onFeedback={(f) => patchTurn(t.id, (x) => ({ ...x, feedback: x.feedback === f ? undefined : f }))}
                      onRetry={() => retry(t)}
                      revert={t.snapshot ? {
                        current: currentVersion === t.id,
                        onlyOne: turns.length < 2,
                        onRevert: () => revertTo(t),
                      } : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
            )}

            {/* Prompt box */}
            <div ref={boxSlotRef} className="shrink-0 px-4 pb-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => { addReferences(e.target.files); e.target.value = ""; }}
              />
              <div
                ref={boxRef}
                // Clicking anywhere on the collapsed line opens it, not only on
                // the text itself.
                onMouseDown={(e) => {
                  if (expanded || busy || e.target === promptRef.current) return;
                  e.preventDefault();
                  promptRef.current?.focus();
                }}
                onBlur={(e) => {
                  // Folds back only when focus left for elsewhere on the page —
                  // not for the + button or the quality picker inside it, and
                  // not for the system file picker (the window loses focus) —
                  // and only when there is nothing typed or attached to lose.
                  const box = e.currentTarget;
                  window.setTimeout(() => {
                    if (!document.hasFocus() || box.contains(document.activeElement)) return;
                    if (!promptRef.current?.value.trim() && references.length === 0 && boxOpen) {
                      markResize();
                      setBoxOpen(false);
                    }
                  }, 0);
                }}
                className={`flex border border-black/[0.12] focus-within:border-semantic-primary-main drop-shadow-[0px_2px_1px_rgba(0,0,0,0.08)] transition-[border-radius] ${
                  busy ? "bg-[#f7f7f8]" : "bg-white"
                } ${expanded
                  ? "flex-col gap-2 p-3 rounded-2xl"
                  : `items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-[22px] ${busy ? "" : "cursor-text"}`}`}
              >
                {expanded && references.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {references.map((r) => (
                      <div key={r.id} className="group/ref relative size-12 rounded-lg overflow-hidden border border-black/[0.12] bg-[#f0f2f4]">
                        <img src={r.dataUrl} alt={r.name} title={r.name} className="absolute inset-0 w-full h-full object-cover" />
                        <button
                          type="button"
                          aria-label={`Remove ${r.name}`}
                          disabled={busy}
                          onClick={() => setReferences((prev) => prev.filter((x) => x.id !== r.id))}
                          className="absolute top-0.5 right-0.5 size-4 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/ref:opacity-100 focus-visible:opacity-100 disabled:hidden"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => {
                    if (!expanded) markResize();
                    setBoxOpen(true);
                  }}
                  onKeyDown={(e) => {
                    // Enter sends, Shift+Enter is a new line — as in any AI chat.
                    // Not while an input method is composing a character.
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={busy}
                  rows={expanded ? 2 : 1}
                  placeholder="Ask AI what to change..."
                  aria-label="Ask AI what to change"
                  className={`w-full resize-none bg-transparent outline-none text-[14px] leading-[1.5] tracking-[0.15px] text-semantic-text-primary placeholder:text-[#9c99a9] disabled:text-[#9c99a9] ${
                    expanded ? "max-h-[200px]" : "flex-1 min-w-0 max-h-[21px] overflow-hidden whitespace-nowrap"
                  }`}
                />
                {expanded ? (
                  <div className="flex items-center gap-1.5">
                  <Tooltip label={references.length >= MAX_REFERENCES ? `Up to ${MAX_REFERENCES} reference images` : "Add reference images"}>
                    <button
                      type="button"
                      aria-label="Add reference images"
                      disabled={busy || references.length >= MAX_REFERENCES}
                      onClick={() => fileRef.current?.click()}
                      className="size-8 rounded-full border border-black/[0.16] flex items-center justify-center text-semantic-text-secondary hover:bg-semantic-action-hover hover:text-semantic-text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </Tooltip>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => { addReferences(e.target.files); e.target.value = ""; }}
                  />
                    <div className="ml-auto flex items-center gap-1.5">
                    {/* Quality: a native select for its keyboard and screen-reader
                      * behaviour, dressed as a small pill. */}
                    <Tooltip label="Image quality · higher costs more">
                      <label className={`relative flex items-center h-8 rounded-full border border-black/[0.16] text-[12px] leading-none text-semantic-text-secondary ${busy ? "opacity-40" : "hover:bg-semantic-action-hover"}`}>
                        <span className="sr-only">Image quality</span>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value as Quality)}
                          disabled={busy}
                          className="appearance-none bg-transparent outline-none h-full pl-3 pr-6 rounded-full cursor-pointer disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-semantic-primary-main"
                        >
                          {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                            <option key={q} value={q}>{QUALITY_LABEL[q]}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="pointer-events-none absolute right-2" />
                      </label>
                    </Tooltip>
                      {submitButton}
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0">{submitButton}</div>
                )}
              </div>
            </div>
          </div>

          <div className="w-px shrink-0 bg-black/[0.12]" />

          {/* Source and enhanced results */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 flex flex-col gap-4">
            {assets.map((asset) => {
              const s = stateOf(asset.id);
              const anyPending = s.pending.some(Boolean);
              const nothingYet = !anyPending && !s.slots.some(Boolean);
              const label = `${asset.name}`;
              return (
                <section key={asset.id} className="shrink-0 flex flex-col gap-2 p-3 rounded-xl border border-black/[0.12] bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 h-6 flex items-center px-2.5 rounded border border-semantic-primary-main text-[11px] leading-[18px] tracking-[0.16px] text-semantic-primary-main">
                        Composite
                      </span>
                      <span className="truncate text-[14px] leading-[1.5] tracking-[0.15px] text-semantic-text-primary" title={label}>
                        {label}
                      </span>
                      <span className="shrink-0 text-[11px] leading-[1.66] tracking-[0.4px] text-semantic-text-secondary">
                        {asset.dimensions.replace(/\s*[x×]\s*/i, "×")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <IconButton
                        label="Regenerate this asset"
                        onClick={() => {
                          if (!lastTurn) return;
                          // A mix of versions now: no reply's version is the one on screen.
                          setCurrentVersion(null);
                          void run([asset], lastTurn.prompt, lastTurn.references, lastTurn.quality);
                        }}
                        disabled={busy || !lastTurn}
                      >
                        <RefreshCw size={18} />
                      </IconButton>
                      <IconButton
                        label={s.open ? "Collapse" : "Expand"}
                        onClick={() => patch(asset.id, (x) => ({ ...x, open: !x.open }))}
                      >
                        {s.open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </IconButton>
                    </div>
                  </div>

                  {s.open && (
                    <>
                      {/* Source, divider, four variants — one row that scrolls
                        * sideways once the tiles reach their 160px minimum. */}
                      <div className="overflow-x-auto pb-1">
                        <div className="flex items-stretch gap-4">
                          <Thumb
                            label="Source"
                            url={asset.url}
                            isSource
                            onPreview={() => openPreview([{ url: asset.url, label: `${asset.name} — Source` }], 0)}
                          />
                          <div className="w-px shrink-0 bg-black/[0.12]" />
                          {nothingYet ? (
                            /* As wide as the four variants it stands in for. */
                            <div className="flex-[4_4_0] min-w-[688px] max-w-[1008px] flex items-center justify-center text-center px-4">
                              <p className={`text-[12px] leading-[1.43] tracking-[0.17px] ${s.error ? "text-semantic-error-main" : "text-semantic-text-secondary"}`}>
                                {s.error ?? "Enhancement results will appear here"}
                              </p>
                            </div>
                          ) : (
                            s.slots.map((url, i) => (
                              <Thumb
                                key={i}
                                label={`Variant ${i + 1}`}
                                url={url}
                                pending={s.pending[i]}
                                selected={s.selected[i]}
                                disabled={busy}
                                onToggle={() => patch(asset.id, (x) => ({
                                  ...x, selected: x.selected.map((v, k) => (k === i ? !v : v)),
                                }))}
                                onPreview={() => {
                                  if (!url) return;
                                  const k = results.findIndex((r) => r.key === `${asset.id}:${i}`);
                                  openPreview(results, Math.max(0, k));
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      {s.error && !nothingYet && (
                        <p className="text-[12px] leading-[1.43] text-semantic-error-main">{s.error}</p>
                      )}
                    </>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 pt-2 pb-4 border-t border-black/[0.12]">
          <button
            type="button"
            onClick={close}
            className="px-[5px] py-1 rounded-full text-[13px] font-medium leading-[22px] tracking-[0.46px] text-semantic-primary-main hover:bg-semantic-primary-states-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={n === 0 || busy}
            onClick={() => onSaveAsNew(picks)}
            className="px-4 py-1.5 rounded-full border border-semantic-primary-states-outlinedborder text-[14px] font-medium leading-6 tracking-[0.4px] text-semantic-primary-main hover:bg-semantic-primary-states-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Save {n || ""} As New {n === 1 ? "Asset" : "Assets"}
          </button>
          <button
            type="button"
            disabled={n === 0 || busy}
            onClick={() => onSaveAsVersions(picks)}
            className="px-4 py-1.5 rounded-full bg-semantic-primary-main text-[14px] font-medium leading-6 tracking-[0.4px] text-white hover:bg-[#3b3093] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Save {n || ""} As New {n === 1 ? "Version" : "Versions"}
          </button>
        </div>

        {/* ── Preview ── */}
        {preview && (() => {
          const item = preview.items[preview.index];
          const many = preview.items.length > 1;
          const arrow = "absolute top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-800 transition-colors";
          return (
            <div
              className="absolute inset-0 z-10 bg-black/70 flex flex-col items-center justify-center gap-3 px-20 py-10"
              onClick={() => setPreview(null)}
            >
              <img
                key={item.url}
                src={item.url}
                alt={item.label}
                className="max-w-full max-h-[calc(100%-48px)] object-contain rounded-xl bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-white text-[13px]">
                {item.label}
                {many && <span className="text-white/60"> · {preview.index + 1} of {preview.items.length}</span>}
              </p>
              {many && (
                <>
                  <button
                    type="button"
                    aria-label="Previous result"
                    onClick={(e) => { e.stopPropagation(); stepPreview(-1); }}
                    className={`${arrow} left-5`}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next result"
                    onClick={(e) => { e.stopPropagation(); stepPreview(1); }}
                    className={`${arrow} right-5`}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setPreview(null)}
                className="absolute top-4 right-4 size-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>
          );
        })()}
      </div>
    </div>,
    document.body,
  );
}
