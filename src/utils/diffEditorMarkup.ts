import { addedTokenIndexes, tokenize } from './disclosureDiff';
import type { MarkerItem } from './diffMarkers';

/** Name of the CSS Custom Highlight that paints added text — style it with `::highlight(snippet-diff-added)`. */
export const ADDED_HIGHLIGHT_NAME = 'snippet-diff-added';

interface EditorToken {
  text: string;
  /** Text tokens point at their slice of a text node; variable chips at their element. */
  node?: Text;
  start?: number;
  end?: number;
  chip?: HTMLElement;
}

/** Walks the editor's DOM in reading order, tokenizing like the diff does so tokens map back to nodes. */
function collectEditorTokens(editor: HTMLElement): EditorToken[] {
  const tokens: EditorToken[] = [];
  const walk = (parent: Node) => {
    parent.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        let offset = 0;
        for (const piece of tokenize(text)) {
          tokens.push({ text: piece, node: child as Text, start: offset, end: offset + piece.length });
          offset += piece.length;
        }
      } else if (child instanceof HTMLElement) {
        if (child.dataset.variableKey) tokens.push({ text: `{${child.dataset.variableKey}}`, chip: child });
        else walk(child);
      }
    });
  };
  walk(editor);
  return tokens;
}

/**
 * Marks what the editor's current content adds on top of `baseline` (the snippet's text before the update):
 * added text gets the `snippet-diff-added` highlight and added variable chips `data-diff="added"`, without
 * changing the editor's DOM structure. Returns the added content's on-screen boxes for the gutter icons.
 */
export function markAddedInEditor(root: HTMLElement, baseline: string): MarkerItem[] {
  root.querySelectorAll('[data-diff]').forEach((el) => el.removeAttribute('data-diff'));
  const editor = root.querySelector<HTMLElement>('[contenteditable]');
  if (!editor) return [];

  const tokens = collectEditorTokens(editor);
  const added = addedTokenIndexes(baseline, tokens.map((t) => t.text));

  const ranges: Range[] = [];
  const items: MarkerItem[] = [];
  tokens.forEach((token, i) => {
    if (!added.has(i)) return;
    if (token.chip) {
      token.chip.dataset.diff = 'added';
      items.push({ type: 'added', rects: Array.from(token.chip.getClientRects()) });
    } else if (token.node && token.start !== undefined && token.end !== undefined) {
      const range = document.createRange();
      range.setStart(token.node, token.start);
      range.setEnd(token.node, token.end);
      ranges.push(range);
      // Whitespace is painted, but only real words decide which lines get an icon (a space at a wrap would add a stray one).
      if (token.text.trim() !== '') items.push({ type: 'added', rects: Array.from(range.getClientRects()) });
    }
  });

  if ('highlights' in CSS && typeof Highlight !== 'undefined') {
    CSS.highlights.set(ADDED_HIGHLIGHT_NAME, new Highlight(...ranges));
  }
  return items;
}

/** Removes the added-text highlight — call when the dialog that set it goes away. */
export function clearAddedHighlight() {
  if ('highlights' in CSS) CSS.highlights.delete(ADDED_HIGHLIGHT_NAME);
}
