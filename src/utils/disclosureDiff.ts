/** One run of a word-level diff: text kept as is, text only in the old version, or text only in the new one. */
export interface DiffPart {
  type: 'equal' | 'removed' | 'added';
  text: string;
}

// Words, whitespace runs and {variables} each become one token, so a diff never cuts a variable in half.
const TOKEN_RE = /(\{[a-zA-Z0-9_]+\}|\s+)/;

export const tokenize = (text: string): string[] => text.split(TOKEN_RE).filter((t) => t !== '');

interface DiffOp {
  type: DiffPart['type'];
  token: string;
  /** Index of the token in the new sequence (`equal` and `added` ops). */
  newIndex: number;
}

/** Token-level diff (longest common subsequence) of two token sequences. */
function diffOps(a: string[], b: string[]): DiffOp[] {
  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..].
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', token: a[i], newIndex: j });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: 'removed', token: a[i++], newIndex: -1 });
    } else {
      ops.push({ type: 'added', token: b[j], newIndex: j });
      j++;
    }
  }
  while (i < a.length) ops.push({ type: 'removed', token: a[i++], newIndex: -1 });
  while (j < b.length) {
    ops.push({ type: 'added', token: b[j], newIndex: j });
    j++;
  }
  return ops;
}

/** A lone space matching between two edited words would split one edit into many tiny marks. */
const isBridgingSpace = (ops: DiffOp[], p: number) => (
  ops[p].type === 'equal' && ops[p].token.trim() === '' && !!ops[p - 1] && ops[p - 1].type !== 'equal' && !!ops[p + 1] && ops[p + 1].type !== 'equal'
);

/**
 * Word-level diff of `oldText` → `newText`. The parts, read without the `removed` ones, rebuild
 * `newText`; read without the `added` ones, they rebuild `oldText`. A whitespace-only match sandwiched
 * between changes joins them, so each run of changes becomes one removed part followed by one added part.
 */
export function diffText(oldText: string, newText: string): DiffPart[] {
  const ops = diffOps(tokenize(oldText), tokenize(newText));
  const out: DiffPart[] = [];
  let removed = '';
  let added = '';
  const flush = () => {
    if (removed) out.push({ type: 'removed', text: removed });
    if (added) out.push({ type: 'added', text: added });
    removed = '';
    added = '';
  };
  const pushEqual = (text: string) => {
    const last = out[out.length - 1];
    if (last?.type === 'equal') last.text += text;
    else out.push({ type: 'equal', text });
  };
  ops.forEach((op, p) => {
    if (op.type === 'removed') removed += op.token;
    else if (op.type === 'added') added += op.token;
    else if (isBridgingSpace(ops, p)) {
      removed += op.token;
      added += op.token;
    } else {
      flush();
      pushEqual(op.token);
    }
  });
  flush();
  return out;
}

/**
 * Which tokens of an already-tokenized new text are additions relative to `oldText` (indices into
 * `newTokens`) — for marking up text that lives in the DOM, where the new tokens map back to nodes.
 */
export function addedTokenIndexes(oldText: string, newTokens: string[]): Set<number> {
  const ops = diffOps(tokenize(oldText), newTokens);
  const added = new Set<number>();
  ops.forEach((op, p) => {
    if (op.type === 'added' || isBridgingSpace(ops, p)) added.add(op.newIndex);
  });
  return added;
}

/** True when the diff has any removed or added text beyond whitespace. */
export const hasDiffChanges = (parts: DiffPart[]) => parts.some((p) => p.type !== 'equal' && p.text.trim() !== '');
