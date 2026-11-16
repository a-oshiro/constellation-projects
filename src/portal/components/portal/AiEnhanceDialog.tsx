// Batch AI Enhance — the full-screen dialog behind the Portal's AI Enhance
// action (Figma: CP-XXXXX AI Enhance Updates, node 4112:9293).
//
// Left: the tool rail (only Enhance is live), the prompt and the reference
// images. Right: one accordion per selected asset, its source beside four
// generated variants.
//
// Each asset is one request to /api/enhance-asset, which asks OpenAI for all
// of that asset's variants in a single call. Variants the user has ticked are
// KEPT on a regenerate — only the empty or unticked slots are asked for again,
// so a regenerate costs only what it replaces.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X, WandSparkles, Sparkles, Scaling, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Maximize2, CirclePlus, Square,
} from "lucide-react";
import { Checkbox } from "@portal/components/ui/checkbox";
import { Tooltip } from "@portal/components/ui/Tooltip";
import type { PortalAsset } from "@portal/lib/portal-assets";

// ─── Constants ────────────────────────────────────────────────────────────

const VARIANTS = 4;
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
function ToolTile({
  icon, label, active, disabled,
}: { icon: ReactNode; label: string; active?: boolean; disabled?: boolean }) {
  const tile = (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      className={`size-[100px] shrink-0 flex flex-col items-center justify-center gap-3 rounded-xl border-2 transition-colors ${
        active
          ? "bg-[#f2f0fa] border-semantic-primary-main text-semantic-primary-main"
          : "bg-white border-black/[0.12] text-semantic-action-active"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="h-8 flex items-center">{icon}</span>
      <span className="text-[10px] leading-[14px] font-medium">{label}</span>
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
  const [references, setReferences] = useState<Reference[]>([]);
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

  // The prompt grows with its text. Its height is set to what the text needs;
  // the column's flex layout then caps it at the room left (it shrinks before
  // anything else does), and past that the textarea scrolls.
  useLayoutEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [prompt, open]);

  // A fresh workspace each time the dialog opens on a selection.
  const assetKey = assets.map((a) => a.id).join(",");
  useEffect(() => {
    if (!open) return;
    setStates(Object.fromEntries(assets.map((a) => [a.id, freshState()])));
    setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assetKey]);

  const stateOf = (id: string) => states[id] ?? freshState();
  const busy = Object.values(states).some((s) => s.pending.some(Boolean));
  const hasResults = Object.values(states).some((s) => s.slots.some(Boolean));

  const patch = useCallback((id: string, fn: (s: AssetState) => AssetState) => {
    setStates((prev) => ({ ...prev, [id]: fn(prev[id] ?? freshState()) }));
  }, []);

  /** Asks for new variants in every slot of these assets that is not ticked. */
  const run = useCallback(async (targets: PortalAsset[]) => {
    const text = prompt.trim();
    if (!text) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const refs = references.map((r) => r.dataUrl);

    // Which slots each asset will fill — decided now, from the ticks as they stand.
    const jobs = targets
      .map((asset) => {
        const s = states[asset.id] ?? freshState();
        const slots = s.selected.map((sel, i) => (sel && s.slots[i] ? -1 : i)).filter((i) => i >= 0);
        return { asset, slots };
      })
      .filter((j) => j.slots.length > 0);

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
          }),
          signal: controller.signal,
        });
        const answer = await readAnswer(res);
        if (!answer.images?.length) {
          return settle((s) => ({ ...s, error: answer.error ?? "Image generation failed" }));
        }
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
  }, [prompt, references, states, patch]);

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

  const phrases = useMemo(
    () => (references.length ? PHRASES : PHRASES.filter((p) => !p.startsWith("Reading references"))),
    [references.length],
  );

  if (!open) return null;

  const canRun = !!prompt.trim() && !busy && assets.length > 0;
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
          <div className="shrink-0 flex flex-col items-center gap-4 p-4 border-r border-black/[0.12] overflow-y-auto">
            <ToolTile icon={<WandSparkles size={30} strokeWidth={1.5} />} label="Enhance" active />
            <ToolTile icon={<Scaling size={30} strokeWidth={1.5} />} label="Resize" disabled />
            <ToolTile
              icon={<span className="px-1 border-2 border-current rounded-[4px] text-[13px] font-bold leading-[18px]">HD</span>}
              label="Upscale"
              disabled
            />
          </div>

          {/* Enhancement settings */}
          {/* Everything here keeps its size except the prompt, which grows
            * with its text and gives way first when the column runs out: the
            * chain down to the textarea is `min-h-0`, the rest `shrink-0`. */}
          <div className="w-[350px] shrink-0 flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex flex-col gap-6 min-h-0">
              <div className="flex flex-col gap-1 shrink-0">
                <p className="text-[16px] font-medium leading-[1.75] tracking-[0.15px] text-semantic-text-primary">Enhance</p>
                <p className="text-[12px] leading-[1.43] tracking-[0.17px] text-semantic-text-secondary">
                  Ask AI what you wish to change on the selected assets. Selected variants are kept. Everything else is replaced.
                </p>
              </div>

              {/* Reference images */}
              <div className="flex flex-col gap-2 shrink-0">
                <div>
                  <p className="flex items-center gap-1">
                    <span className="text-[14px] font-medium leading-[1.43] tracking-[0.17px] text-semantic-text-primary">Reference Images</span>
                    <span className="text-[11px] leading-[1.66] tracking-[0.4px] text-semantic-text-secondary">(optional)</span>
                  </p>
                  <p className="text-[11px] leading-[1.66] tracking-[0.4px] text-semantic-text-secondary">
                    Add up to {MAX_REFERENCES} images to guide the enhancement.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {references.map((r) => (
                    <div key={r.id} className="group/ref relative size-[90px] rounded-xl overflow-hidden border border-black/[0.12] bg-[#f0f2f4]">
                      <img src={r.dataUrl} alt={r.name} title={r.name} className="absolute inset-0 w-full h-full object-contain" />
                      <button
                        type="button"
                        aria-label={`Remove ${r.name}`}
                        disabled={busy}
                        onClick={() => setReferences((prev) => prev.filter((x) => x.id !== r.id))}
                        className="absolute top-1 right-1 size-5 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/ref:opacity-100 focus-visible:opacity-100 disabled:hidden"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {references.length < MAX_REFERENCES && (
                    <button
                      type="button"
                      aria-label="Add reference image"
                      disabled={busy}
                      onClick={() => fileRef.current?.click()}
                      className={`size-[90px] rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
                        busy
                          ? "border-gray-300 text-gray-300 cursor-not-allowed"
                          : "border-semantic-primary-main text-semantic-primary-main hover:bg-semantic-primary-states-hover"
                      }`}
                    >
                      <CirclePlus size={22} strokeWidth={1.5} />
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => { addReferences(e.target.files); e.target.value = ""; }}
                  />
                </div>
              </div>

              {/* Prompt */}
              <div className="flex flex-col gap-2 min-h-0">
                {busy && (
                  <div className="flex items-center justify-between gap-2">
                    <ThinkingLine phrases={phrases} />
                    <ElapsedTimer />
                  </div>
                )}
                <div className={`flex flex-col gap-4 p-4 min-h-0 rounded-2xl border border-black/[0.12] drop-shadow-[0px_2px_1px_rgba(0,0,0,0.08)] ${busy ? "bg-[#f7f7f8]" : "bg-white"}`}>
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canRun) run(assets);
                    }}
                    disabled={busy}
                    placeholder="Ask AI what to change..."
                    aria-label="Ask AI what to change"
                    className="min-h-[60px] w-full resize-none bg-transparent outline-none text-[14px] leading-[1.5] tracking-[0.15px] text-semantic-text-primary placeholder:text-[#9c99a9] disabled:text-[#9c99a9]"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => run(assets)}
                      disabled={!canRun}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] bg-semantic-primary-main text-white hover:bg-[#3b3093] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Sparkles size={16} />
                      {hasResults ? "Regenerate All" : "Enhance Assets"}
                    </button>
                    {busy && (
                      <Tooltip label="Stop generation">
                        <button
                          type="button"
                          aria-label="Stop generation"
                          onClick={stop}
                          className="size-9 shrink-0 rounded-full bg-semantic-primary-main hover:bg-[#3b3093] flex items-center justify-center text-white transition-colors"
                        >
                          <Square size={14} fill="currentColor" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Tooltip label="Coming soon" className="self-center shrink-0">
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 px-2 py-1.5 rounded-full text-[14px] font-medium leading-6 tracking-[0.4px] text-semantic-primary-main disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <WandSparkles size={16} />
                Auto-Adjust Asset Quality
              </button>
            </Tooltip>
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
                        onClick={() => run([asset])}
                        disabled={busy || !prompt.trim()}
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
