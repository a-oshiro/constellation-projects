import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Highlight } from "@portal/components/ui/Highlight";

const GAP = 4;
/** Below this a truncated chip says nothing, so it wraps instead. */
const MIN_CHIP = 64;
/** Room kept on the last row for the +N, measured once from a rendered one. */
const COUNT_W = 34;

export interface Chip {
  text: string;
  /** Which filter this value belongs to, so clicking it can narrow the grid. */
  field: string;
  /** Set by the packer, only on a chip that had to be cut to finish its row. */
  max?: number;
}

/**
 * Every value an asset carries, in two rows, with the rest behind a count.
 *
 * Two rows rather than a fixed number of chips: chips are not the same width,
 * so three long ones already wrapped and three short ones wasted half the room.
 * What the card can spare is space, and space is what is rationed.
 *
 * **The rows are packed here rather than by `flex-wrap`.** Wrapping is the
 * wrong rule at the end of a row: a chip that does not fit moves down whole,
 * which left `Premium Plus TFSI quattro S tronic` opening the second row while
 * the first sat half empty. Packed by hand, a chip that does not fit is *cut*
 * to the room that is left — and only wraps when what is left is too little to
 * read.
 */
export function AssetChips<T extends Chip>({
  chips, query, open, onToggle, isActive, onPick,
}: {
  chips: T[];
  /** The platform search, so a value matched inside a chip is marked. */
  query: string;
  open: boolean;
  onToggle: (next: boolean) => void;
  /** Whether this value is already narrowing the grid. */
  isActive: (chip: T) => boolean;
  onPick: (chip: T) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<(T & { max?: number })[][]>([]);
  const [hidden, setHidden] = useState(0);

  const measure = useCallback(() => {
    const box = boxRef.current;
    const ruler = rulerRef.current;
    if (!box || !ruler) return;
    const width = box.clientWidth;
    if (!width) return;

    /* Natural widths, read off a copy laid out off-screen — the chips on the
     * card are already constrained, so they cannot be asked how wide they
     * would like to be. */
    const natural = (Array.from(ruler.children) as HTMLElement[])
      .map((el) => el.getBoundingClientRect().width);

    const packed: (T & { max?: number })[][] = [[], []];
    let row = 0;
    let used = 0;
    let i = 0;
    for (; i < chips.length && row < 2; i += 1) {
      const w = natural[i] ?? 0;
      const gap = packed[row].length ? GAP : 0;
      /* The last row keeps room for the count, but only while chips remain to
       * be counted — the final chip should not be cut for a badge that never
       * appears. */
      const reserve = row === 1 && i < chips.length - 1 ? COUNT_W + GAP : 0;
      const free = width - used - gap - reserve;

      if (w <= free) {
        packed[row].push(chips[i]);
        used += gap + w;
        continue;
      }
      if (free >= MIN_CHIP) {
        packed[row].push({ ...chips[i], max: Math.floor(free) });
        used = width;
        continue;
      }
      row += 1;
      used = 0;
      i -= 1;
    }

    setRows(packed);
    setHidden(chips.length - i);
  }, [chips]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    measure();
    /* The column width changes with the pane, and a repack changes both the
     * rows and the count. Nothing else on this card hears that. */
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure]);

  /** A chip is a filter you can see: clicking one narrows the grid by that
   *  value, clicking it again lets it go. An active one is drawn in the app's
   *  indigo — a toggle that looks the same in both states is a trap. */
  const chip = (p: T & { max?: number }, key: string) => {
    const on = isActive(p);
    return (
      <button
        key={key}
        type="button"
        title={p.text}
        aria-pressed={on}
        onClick={(e) => { e.stopPropagation(); onPick(p); }}
        style={p.max ? { maxWidth: p.max } : undefined}
        /* `max-w-full` as well as the packer's own cap: open, the chips are
          * laid out by flex-wrap rather than packed, and a value longer than
          * the whole card — a tag is a sentence here — is a flex item wider
          * than its container, which overflows it. It ran off the right edge
          * of the open card. */
        className={`shrink-0 max-w-full truncate text-[11px] px-2 py-[3px] rounded leading-none cursor-pointer transition-colors ${
          on
            ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            : "bg-[#f0f2f4] text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Highlight text={p.text} query={query} />
      </button>
    );
  };

  if (chips.length === 0) return null;

  return (
    <div className="relative mt-2">
      {/* The ruler: the same chips, unconstrained, measured and never seen.
        *
        * Boxed in something of zero size that clips, because `absolute` keeps
        * it out of the LAYOUT but not out of the scrollable area — a row of
        * twelve chips laid end to end is over a thousand pixels wide, and the
        * grid grew a horizontal scrollbar reaching a full screen past its own
        * edge. Clipped here, the children are still laid out and still
        * measurable; they simply have nowhere to push. */}
      <div aria-hidden className="absolute w-0 h-0 overflow-hidden">
        <div ref={rulerRef} className="flex gap-1 whitespace-nowrap">
          {chips.map((c) => (
            <span key={c.text} className="shrink-0 text-[11px] px-2 py-[3px] leading-none">
              {c.text}
            </span>
          ))}
        </div>
      </div>

      <div ref={boxRef} className={open ? "hidden" : ""}>
        {rows.map((r, i) => (
          <div key={i} className="flex gap-1 mt-1 first:mt-0 min-h-[17px]">
            {r.map((p, j) => chip(p, `${i}-${j}-${p.text}`))}
            {/* Right after the last chip of the row it belongs to, not pinned
              * to the edge: it reads as the next item in the list, which is
              * what it is. */}
            {hidden > 0 && i === rows.length - 1 && (
              <button
                type="button"
                onClick={() => onToggle(true)}
                aria-expanded={false}
                /* The same coat as every other chip — it is one more item in
                  * the list, not a control of a different kind. Only the hover
                  * separates them: this one opens the card rather than
                  * filtering by itself. */
                className="shrink-0 text-[11px] text-gray-600 bg-[#f0f2f4] hover:bg-indigo-100 hover:text-indigo-700 px-2 py-[3px] rounded leading-none cursor-pointer transition-colors tabular-nums"
              >
                +{hidden}
              </button>
            )}
          </div>
        ))}
      </div>

      {open && (
        /* In flow, inside the card — the card is what leaves the layout while
          * this is open (see AssetCard's `raised`), so these can simply grow
          * and the folder line below them moves down with them instead of
          * being covered. */
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => chip(c, c.text))}
          <button
            type="button"
            onClick={() => onToggle(false)}
            aria-expanded
            className="shrink-0 flex items-center gap-1 text-[11px] text-gray-600 bg-[#f0f2f4] hover:bg-indigo-100 hover:text-indigo-700 px-2 py-[3px] rounded leading-none cursor-pointer transition-colors"
          >
            <ChevronUp size={11} />
            show less
          </button>
        </div>
      )}
    </div>
  );
}
