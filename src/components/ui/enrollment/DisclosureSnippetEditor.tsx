import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Popover, TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { DISCLOSURE_VARIABLES } from '../../../data/disclosureVariables';
import { hexToRgba } from '../../../utils/disclosureSnippetColors';

// ── DOM <-> string conversion ──────────────────────────────────────────────
// The editable container's direct/nested children are one of: plain text nodes (which may contain
// literal '\n' characters, rendered as line breaks via `white-space: pre-wrap`), atomic non-editable
// chip <span>s carrying a `data-variable-key`, or inline formatting wrappers (<strong>/<em>/<u>/<s>)
// that visually render the markdown source lives in (bold/italic/underline/strikethrough) instead of
// showing the raw ** / * / <u> / ~~ delimiters. `renderTokenString` parses the markdown-with-variables
// string into that DOM shape; `serialize` walks it back into the string. Enter/paste are intercepted so
// the browser never gets a chance to insert its own nested <div>/<br> structure.

const VARIABLE_TOKEN_RE = /^\{([a-zA-Z0-9_]+)\}/;

type ParseNode =
  | { type: 'text'; value: string }
  | { type: 'chip'; key: string }
  | { type: 'bold' | 'italic' | 'underline' | 'strikethrough'; children: ParseNode[] };

const FORMAT_TAGS: Record<DisclosureFormatType, string> = {
  bold: 'STRONG',
  italic: 'EM',
  underline: 'U',
  strikethrough: 'S',
};

/** Parses `**bold**` / `*italic*` / `<u>underline</u>` / `~~strikethrough~~` / `{variable}` tokens out of raw markdown-ish text, recursively (so a chip inside a bold run still renders as a chip). */
function parseInline(input: string): ParseNode[] {
  const nodes: ParseNode[] = [];
  let i = 0;
  let textBuf = '';

  const flushText = () => {
    if (textBuf) {
      nodes.push({ type: 'text', value: textBuf });
      textBuf = '';
    }
  };

  while (i < input.length) {
    if (input.startsWith('**', i)) {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        flushText();
        nodes.push({ type: 'bold', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (input.startsWith('~~', i)) {
      const end = input.indexOf('~~', i + 2);
      if (end !== -1) {
        flushText();
        nodes.push({ type: 'strikethrough', children: parseInline(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    if (input.startsWith('<u>', i)) {
      const end = input.indexOf('</u>', i + 3);
      if (end !== -1) {
        flushText();
        nodes.push({ type: 'underline', children: parseInline(input.slice(i + 3, end)) });
        i = end + 4;
        continue;
      }
    }
    if (input[i] === '*' && !input.startsWith('**', i)) {
      const end = input.indexOf('*', i + 1);
      if (end !== -1) {
        flushText();
        nodes.push({ type: 'italic', children: parseInline(input.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    const chipMatch = VARIABLE_TOKEN_RE.exec(input.slice(i));
    if (chipMatch) {
      flushText();
      nodes.push({ type: 'chip', key: chipMatch[1] });
      i += chipMatch[0].length;
      continue;
    }
    textBuf += input[i];
    i += 1;
  }
  flushText();
  return nodes;
}

function styleChipSpan(span: HTMLElement, color: string | undefined) {
  if (color) {
    span.style.background = hexToRgba(color, 0.1);
    span.style.borderColor = color;
  } else {
    span.style.background = '#f0f2f4';
    span.style.borderColor = 'transparent';
  }
}

function buildChipSpan(key: string, color: string | undefined): HTMLSpanElement {
  const span = document.createElement('span');
  span.contentEditable = 'false';
  span.dataset.variableKey = key;
  span.style.cssText = [
    'display:inline-flex', 'align-items:center', 'gap:4px', 'border:1px solid transparent',
    'border-radius:4px', 'padding:2px 6px', 'margin:0 1px', 'font-family:Roboto, sans-serif',
    'font-size:13px', 'color:#1f1d25', 'cursor:pointer', 'vertical-align:baseline', 'white-space:nowrap',
  ].join(';');
  styleChipSpan(span, color);

  const label = document.createElement('span');
  label.textContent = `{${key}}`;
  span.appendChild(label);

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '13');
  svg.setAttribute('height', '13');
  svg.style.cssText = 'flex-shrink:0;';
  svg.dataset.role = 'remove-variable';
  const path = document.createElementNS(svgNs, 'path');
  path.setAttribute('d', 'M5 5L15 15M15 5L5 15');
  path.setAttribute('stroke', '#9c99a9');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
  span.appendChild(svg);

  return span;
}

function appendParseNodes(container: Node, nodes: ParseNode[], getColor: (key: string) => string | undefined) {
  for (const node of nodes) {
    if (node.type === 'text') {
      container.appendChild(document.createTextNode(node.value));
    } else if (node.type === 'chip') {
      container.appendChild(buildChipSpan(node.key, getColor(node.key)));
    } else {
      const el = document.createElement(FORMAT_TAGS[node.type]);
      appendParseNodes(el, node.children, getColor);
      container.appendChild(el);
    }
  }
}

function renderTokenString(container: HTMLElement, value: string, getColor: (key: string) => string | undefined) {
  container.innerHTML = '';
  appendParseNodes(container, parseInline(value), getColor);
  if (container.childNodes.length === 0) container.appendChild(document.createTextNode(''));
}

function serializeNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) return '';
  if (node.dataset.variableKey) return `{${node.dataset.variableKey}}`;
  const inner = Array.from(node.childNodes).map(serializeNode).join('');
  switch (node.tagName) {
    case 'STRONG':
    case 'B':
      return `**${inner}**`;
    case 'EM':
    case 'I':
      return `*${inner}*`;
    case 'U':
      return `<u>${inner}</u>`;
    case 'S':
    case 'STRIKE':
      return `~~${inner}~~`;
    default:
      return inner;
  }
}

function serialize(container: HTMLElement): string {
  return Array.from(container.childNodes).map(serializeNode).join('');
}

function setCursorAtOffset(container: HTMLElement, targetOffset: number) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let remaining = targetOffset;
  let node = walker.nextNode();
  let lastText: Text | null = null;
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      placeCollapsedRange(node, remaining);
      return;
    }
    remaining -= len;
    lastText = node as Text;
    node = walker.nextNode();
  }
  if (lastText) placeCollapsedRange(lastText, lastText.textContent?.length ?? 0);
  else {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.collapse(false);
    applyRange(range);
  }
}

function placeCollapsedRange(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  applyRange(range);
}

function applyRange(range: Range) {
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

// ── Component ───────────────────────────────────────────────────────────────

export type DisclosureFormatType = 'bold' | 'italic' | 'underline' | 'strikethrough';

export interface DisclosureSnippetEditorHandle {
  applyFormat: (type: DisclosureFormatType) => void;
  openAddVariablePicker: (anchorEl: HTMLElement) => void;
  undo: () => void;
  loadValue: (value: string) => void;
  focus: () => void;
  /** Recolors the outcome chips already in the DOM (comparison view) without a full re-render — pass null to revert everything to the default gray chip. */
  applyChipColors: (colors: Record<string, string> | null) => void;
}

interface DisclosureSnippetEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
}

interface PickerState {
  open: boolean;
  anchorEl: HTMLElement | null;
  mode: 'insert' | 'replace';
}

const TYPING_DEBOUNCE_MS = 600;

export const DisclosureSnippetEditor = forwardRef<DisclosureSnippetEditorHandle, DisclosureSnippetEditorProps>(
  ({ initialValue, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef(initialValue);
    const historyRef = useRef<string[]>([]);
    const burstStartRef = useRef<string | null>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const targetChipRef = useRef<HTMLElement | null>(null);
    const chipColorsRef = useRef<Record<string, string> | null>(null);

    const [picker, setPicker] = useState<PickerState>({ open: false, anchorEl: null, mode: 'insert' });
    const [search, setSearch] = useState('');

    const colorFor = (key: string) => chipColorsRef.current?.[key];

    useEffect(() => {
      if (containerRef.current) renderTokenString(containerRef.current, valueRef.current, colorFor);
    }, []);

    const flushPendingBurst = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (burstStartRef.current !== null && burstStartRef.current !== valueRef.current) {
        historyRef.current.push(burstStartRef.current);
      }
      burstStartRef.current = null;
    };

    const handleNativeInput = () => {
      const container = containerRef.current;
      if (!container) return;
      const newValue = serialize(container);
      if (burstStartRef.current === null) burstStartRef.current = valueRef.current;
      valueRef.current = newValue;
      onChange(newValue);
      if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        if (burstStartRef.current !== null && burstStartRef.current !== valueRef.current) {
          historyRef.current.push(burstStartRef.current);
        }
        burstStartRef.current = null;
        debounceTimerRef.current = null;
      }, TYPING_DEBOUNCE_MS);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode('\n');
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      applyRange(range);
      handleNativeInput();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      applyRange(range);
      handleNativeInput();
    };

    const closePicker = () => setPicker((p) => ({ ...p, open: false }));

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const chip = target.closest('[data-variable-key]') as HTMLElement | null;
      if (!chip || !containerRef.current?.contains(chip)) return;
      const isRemove = !!target.closest('svg[data-role="remove-variable"]');
      const container = containerRef.current;
      if (!container) return;

      if (isRemove) {
        flushPendingBurst();
        historyRef.current.push(valueRef.current);
        chip.remove();
        const newValue = serialize(container);
        valueRef.current = newValue;
        onChange(newValue);
      } else {
        targetChipRef.current = chip;
        savedRangeRef.current = null;
        setSearch('');
        setPicker({ open: true, anchorEl: chip, mode: 'replace' });
      }
    };

    // Applies formatting by wrapping the live DOM selection in the matching inline element (rather than
    // splicing markdown delimiters into a string and re-rendering) — so the result reads as actually
    // bold/italic/underlined/struck-through immediately, with no raw ** / * / ~~ ever shown to the user.
    const applyFormat = (type: DisclosureFormatType) => {
      const container = containerRef.current;
      if (!container) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      flushPendingBurst();
      historyRef.current.push(valueRef.current);

      const tagName = FORMAT_TAGS[type];
      let ancestor: Node | null = range.commonAncestorContainer;
      if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentElement;
      const existingWrapper = ancestor instanceof HTMLElement ? ancestor.closest(tagName) : null;

      if (existingWrapper && container.contains(existingWrapper)) {
        // Toggle off: unwrap the existing formatting element in place.
        const parent = existingWrapper.parentNode;
        if (parent) {
          while (existingWrapper.firstChild) parent.insertBefore(existingWrapper.firstChild, existingWrapper);
          parent.removeChild(existingWrapper);
        }
      } else {
        const wrapper = document.createElement(tagName);
        const contents = range.extractContents();
        wrapper.appendChild(contents);
        range.insertNode(wrapper);
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        applyRange(newRange);
      }

      container.normalize();
      const newValue = serialize(container);
      valueRef.current = newValue;
      onChange(newValue);
      container.focus();
    };

    const openAddVariablePicker = (anchorEl: HTMLElement) => {
      const container = containerRef.current;
      const sel = window.getSelection();
      let range: Range | null = null;
      if (container && sel && sel.rangeCount > 0 && container.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0).cloneRange();
      }
      savedRangeRef.current = range;
      targetChipRef.current = null;
      setSearch('');
      setPicker({ open: true, anchorEl, mode: 'insert' });
    };

    const handleSelectVariable = (key: string) => {
      const container = containerRef.current;
      if (!container) return;
      flushPendingBurst();
      historyRef.current.push(valueRef.current);

      if (picker.mode === 'insert') {
        let range = savedRangeRef.current;
        if (!range || !container.contains(range.startContainer)) {
          range = document.createRange();
          range.selectNodeContents(container);
          range.collapse(false);
        }
        range.deleteContents();
        const chip = buildChipSpan(key, colorFor(key));
        range.insertNode(chip);
        range.setStartAfter(chip);
        range.collapse(true);
        applyRange(range);
      } else if (picker.mode === 'replace' && targetChipRef.current) {
        const newChip = buildChipSpan(key, colorFor(key));
        targetChipRef.current.replaceWith(newChip);
      }

      const newValue = serialize(container);
      valueRef.current = newValue;
      onChange(newValue);
      closePicker();
      container.focus();
    };

    const undo = () => {
      const container = containerRef.current;
      if (!container) return;
      flushPendingBurst();
      const prev = historyRef.current.pop();
      if (prev === undefined) return;
      valueRef.current = prev;
      renderTokenString(container, prev, colorFor);
      setCursorAtOffset(container, prev.length);
      onChange(prev);
    };

    const loadValue = (value: string) => {
      valueRef.current = value;
      historyRef.current = [];
      burstStartRef.current = null;
      if (containerRef.current) renderTokenString(containerRef.current, value, colorFor);
    };

    const applyChipColors = (colors: Record<string, string> | null) => {
      chipColorsRef.current = colors;
      const container = containerRef.current;
      if (!container) return;
      container.querySelectorAll<HTMLElement>('[data-variable-key]').forEach((span) => {
        const key = span.dataset.variableKey;
        if (key) styleChipSpan(span, colors?.[key]);
      });
    };

    useImperativeHandle(ref, () => ({
      applyFormat,
      openAddVariablePicker,
      undo,
      loadValue,
      applyChipColors,
      focus: () => containerRef.current?.focus(),
    }));

    const filteredGroups = useMemo(() => {
      const term = search.trim().toLowerCase();
      const matches = DISCLOSURE_VARIABLES.filter(
        (v) => !term || v.label.toLowerCase().includes(term) || v.key.toLowerCase().includes(term),
      );
      const byCategory = new Map<string, typeof matches>();
      for (const v of matches) {
        const list = byCategory.get(v.category) ?? [];
        list.push(v);
        byCategory.set(v.category, list);
      }
      return Array.from(byCategory.entries());
    }, [search]);

    return (
      <>
        <div
          ref={containerRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleNativeInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onClick={handleContainerClick}
          style={{
            outline: 'none',
            fontFamily: 'Roboto, sans-serif',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#1f1d25',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: 400,
          }}
        />

        <Popover
          open={picker.open}
          anchorEl={picker.anchorEl}
          onClose={closePicker}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          sx={{ zIndex: 100002 }}
        >
          <div style={{ width: 300, padding: 12 }}>
            <TextField
              autoFocus
              size="small"
              fullWidth
              placeholder="Search variables"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: 13, fontFamily: 'Roboto, sans-serif' } }}
            />
            <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 8 }}>
              {filteredGroups.map(([category, items]) => (
                <div key={category}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase', padding: '8px 8px 4px' }}>
                    {category}
                  </div>
                  {items.map((v) => (
                    <div
                      key={v.key}
                      onClick={() => handleSelectVariable(v.key)}
                      style={{
                        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
                        padding: '7px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Roboto, sans-serif',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f2f4')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 13, color: '#1f1d25' }}>{v.label}</span>
                      <span style={{ fontSize: 11, color: '#9c99a9', flexShrink: 0 }}>{`{${v.key}}`}</span>
                    </div>
                  ))}
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <div style={{ padding: 12, color: '#9c99a9', fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>No variables found.</div>
              )}
            </div>
          </div>
        </Popover>
      </>
    );
  },
);

DisclosureSnippetEditor.displayName = 'DisclosureSnippetEditor';
