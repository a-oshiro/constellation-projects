import { useCallback, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { EntityChatButton } from "@portal/components/chat/EntityChat";
import type { EntityRef } from "@portal/lib/chat-store";

interface AssetCardProps {
  /** Whether this card is currently selected */
  selected?: boolean;
  /** Called when the checkbox is toggled (receives new boolean value) */
  onSelect?: (checked: boolean) => void;
  /**
   * Content rendered inside the thumbnail shell.
   * The shell already provides: square aspect-ratio, bg-[#f0f2f4],
   * rounded-xl, overflow-hidden, and the ring stroke.
   * Pass an element that fills the available space.
   */
  preview: ReactNode;
  /** Content rendered in the text area below the thumbnail */
  footer: ReactNode;
  /** Extra class names forwarded to the outer wrapper */
  className?: string;
  /** Called when the card is clicked (checkbox / menu clicks are swallowed) */
  onClick?: () => void;
  /**
   * A menu for the thumbnail's top-right corner. Nothing is drawn unless a
   * caller passes one — the card used to draw a ⋯ of its own that opened
   * nothing, and a control that does not work is worse than no control.
   * Bring it back per card, with the menu, when there is something in it.
   */
  menuButton?: ReactNode;
  /** A status for the asset (`StatusIndicator`), in the thumbnail's top-right
   *  corner — 8px from the top and from the right edge, per the Figma card.
   *  It sits before the menu when the card has both. */
  status?: ReactNode;
  /** Opt a card into "talk about this". Given an entity, the chat affordance
   *  appears in the thumbnail's top-left corner — the top-right is the menu's.
   *  One prop rather than each caller composing the button, since every card
   *  that wants it wants it in the same place. */
  chatEntity?: EntityRef;
  /**
   * When false, removes overflow-hidden from the thumbnail shell.
   * Use for stacked-card effects where rotated copies need to visually
   * protrude beyond the shell boundary (matches Figma clipsContent: false).
   * Default: true.
   */
  clipPreview?: boolean;
  /**
   * Opt a card into "look at this one". Given a handler, the thumbnail gains
   * an **Asset Details** button on hover, and the whole thumbnail becomes the
   * way to SELECT the card.
   *
   * That pair is the point: a card carries two different intentions and they
   * were sharing one surface. Picking several assets is a sweep of clicks on
   * the pictures; looking closely at one is a deliberate act, and it gets its
   * own target — this button, and the card's name, which the caller wires.
   */
  onOpen?: () => void;
  /**
   * Lift the whole card onto a white panel — thumbnail, name and all — rather
   * than lighting up one part of it. Used while a card has something expanded
   * over the grid: what is open belongs to the card, so the card is what reads
   * as raised.
   *
   * It costs the layout nothing. The padding that makes room for the panel is
   * cancelled by an equal negative margin, so the card occupies exactly the
   * box it did before and the row below never moves.
   */
  raised?: boolean;
}

/**
 * Shared card shell — Card Vertical variant from the Constellation Design System.
 *
 * Anatomy (matches Figma "Card & Row / Card Vertical"):
 *
 *   ┌────────────────────────────────────────┐  ← rounded-xl, gray bg
 *   │              thumbnail                 │    1 px inset ring (default)
 *   │   image / wireframe fills edge-to-edge │    2 px indigo ring (selected)
 *   │                                        │
 *   │  [☑ checkbox TL]       [⋯ menu TR]    │
 *   └────────────────────────────────────────┘
 *   title                              [⋮ / edit]  ← pt-2 pb-3, zero horizontal pad
 *   subtitle
 *   [chip] [chip]
 *   📁 folder
 *
 * The outer wrapper has NO background and NO stroke — the card shape is
 * defined entirely by the thumbnail shell.
 * The selection ring wraps the thumbnail ONLY (not the text section).
 */
export function AssetCard({
  selected = false,
  onSelect,
  preview,
  footer,
  className = "",
  onClick,
  menuButton,
  status,
  chatEntity,
  clipPreview = true,
  onOpen,
  raised = false,
}: AssetCardProps) {
  /** The height the card stands at when it is down, kept so the shell can hold
   *  it open while the content floats above. State rather than a ref: it is
   *  read while rendering, which a ref may not be. */
  const [restHeight, setRestHeight] = useState<number>();
  const measure = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || raised) return;
      const h = el.offsetHeight;
      setRestHeight((prev) => (prev === h ? prev : h));
    },
    [raised],
  );

  return (
    <div
      onClick={onClick}
      /* Raised, the card LEAVES THE FLOW and the shell holds the height it had
       * — so it can grow downward over its neighbours without the grid moving
       * a pixel, and everything grows in its natural order: the folder line
       * stays under the chips instead of being covered by them.
       *
       * The height is read off the card itself while it is down, rather than
       * declared: it is the thumbnail's square plus whatever the caller put in
       * the footer, and only the card knows that. */
      style={raised ? { height: restHeight } : undefined}
      className={`group/entity cursor-pointer relative w-full min-w-[240px] max-w-[300px] ${className}`}
    >
      <div
        ref={measure}
        className={raised ? "absolute inset-x-0 top-0 z-[15]" : ""}
      >
        {/* The white sits BEHIND the card, reaching 8px past it on every side.
          * It is a layer of its own rather than padding, because padding would
          * change the content's width — and the thumbnail is a square of that
          * width, so raising the card would have resized and moved the very
          * picture the reader is looking at. Nothing in here moves; a panel
          * appears under it. */}
        {raised && (
          <div
            aria-hidden
            style={{
              borderRadius: 16,
              boxShadow:
                "0 0 0 1px rgba(17,16,20,0.05), 0 8px 28px -6px rgba(17,16,20,0.18)",
            }}
            className="absolute -inset-2 bg-white"
          />
        )}

        <div className="relative">
      {/* ── Thumbnail shell ── */}
      <div
        className={`relative aspect-square rounded-xl transition-shadow duration-150 ${
          clipPreview ? "overflow-hidden" : ""
        } bg-[#f0f2f4]${
          /* A soft halo on hover, outside the shell. Two shadows: a wide, very
           * faint spread that reads as glow, and a shorter, darker one under
           * it so the card lifts rather than merely lighting up. `overflow-
           * hidden` does not clip it — an element's own outer shadow is drawn
           * outside its border box. */
          onOpen || onSelect
            ? " group-hover/entity:shadow-[0_0_0_5px_rgba(99,86,225,0.10),0_8px_22px_-8px_rgba(99,86,225,0.45)]"
            : ""
        }`}
      >
        {/* Image / wireframe.
          *
          * On an interactive card it takes a gentle push in on hover. The
          * wrapper is what scales, not the artwork itself, so a caller can
          * keep passing whatever it likes — and the shell's own
          * `overflow-hidden` is what turns a scale into a crop rather than a
          * card that grows. */}
        {onOpen || onSelect ? (
          <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover/entity:scale-[1.04]">
            {preview}
          </div>
        ) : (
          preview
        )}

        {/* The thumbnail selects. It lies over the artwork and under the
          * corner controls, which stop propagation of their own. Without a
          * way to select, it is not drawn at all — a pointer cursor over a
          * picture that does nothing is a worse promise than no cursor. */}
        {onSelect && (
          <button
            type="button"
            aria-label={selected ? "Deselect" : "Select"}
            aria-pressed={selected}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(!selected);
            }}
            className="absolute inset-0 cursor-pointer"
          />
        )}

        {/* Asset Details — on hover, and always once focused, so it is
          * reachable by keyboard on a card whose other target is the picture
          * itself. Bottom-right: the corners above are taken, and it sits
          * clear of the artwork's usual subject. */}
        {onOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            /* The same pill the page's own + New wears — size, weight and
              * radius — so the two read as one kind of button rather than two.
              */
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-sm opacity-0 translate-y-1 transition-all group-hover/entity:opacity-100 group-hover/entity:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 hover:bg-indigo-700"
          >
            <Eye size={12} />
            Asset Details
          </button>
        )}

        {/* The frame, painted OVER the artwork rather than under it. A ring on
          * the shell is part of the shell's own box, so any child drawn to the
          * edges covers it — and most assets are artwork that runs edge to
          * edge, which is exactly where a frame earns its keep. */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl transition-shadow ${
            selected
              ? "ring-2 ring-inset ring-indigo-500"
              : /* Hover wears the selected HUE but not its weight. The
                 * thumbnail is a target and has to say so before it is used,
                 * and saying it in the same purple is what ties the promise to
                 * what the click delivers — but at indigo-500 the two strokes
                 * differed only by `inset`, which is no difference at all on
                 * screen. A card you were merely pointing at read as a card you
                 * had checked, and it stayed that way after a click opened the
                 * review pane, because the pointer had not moved. Lighter, the
                 * same gesture still answers, and only a checked card wears the
                 * full stroke. */
                "ring-1 ring-inset ring-black/[0.07]" +
                (onOpen || onSelect
                  ? " group-hover/entity:ring-2 group-hover/entity:ring-indigo-300"
                  : "")
          }`}
        />

        {/* Checkbox overlay — top-left */}
        <div
          className="absolute top-2.5 left-2.5 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(!selected);
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-indigo-600 border-indigo-600"
                : "bg-white/90 border-gray-300"
            }`}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4l3 3 5-5"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Chat overlay — top-left, mirroring the menu on the other corner.
          * Stops propagation so opening the conversation is not also a click
          * on the card. */}
        {chatEntity && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
            <EntityChatButton entity={chatEntity} className="w-6 h-6 bg-white/80 hover:bg-white rounded-md" />
          </div>
        )}

        {/* Status and menu — top-right, 8px in, each only when a caller supplies
          * it. A plain status is a label and lets clicks through to the card;
          * a status that is a control (StatusPicker) takes its own clicks back
          * with `pointer-events-auto` and stops them there. */}
        {(status || menuButton) && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {/* `flex`, not block: a block wraps the inline pill in a line box
              * 2px taller than it, which pushed it a pixel off the 8px. */}
            {status && <div className="pointer-events-none flex">{status}</div>}
            {menuButton && <div onClick={(e) => e.stopPropagation()}>{menuButton}</div>}
          </div>
        )}
      </div>

      {/* ── Text area ──
          Figma spec: padding-top 8px, padding-bottom 12px, horizontal 0
          Text aligns flush with the thumbnail edges. */}
          <div className="pt-2 pb-3">{footer}</div>
        </div>
      </div>
    </div>
  );
}
