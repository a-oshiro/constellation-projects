import { useState } from 'react';
import { FeeButton } from './FeeButton';
import { FeeDialog, FeeDialogText } from './FeeDialog';
import type { FeeSource } from './feeTabState';

// Figma "Switch Popup" (to FeeSync) and "Switch back to manual" (to Manual): confirm before the fee
// source changes, since automated offers start using the new source right away.

const COPY: Record<FeeSource, { title: string; confirm: string; body: React.ReactNode }> = {
  feesync: {
    title: 'Switch to FeeSync',
    confirm: 'Switch To FeeSync',
    body: <>Automated offers will now use <strong>FeeSync fees</strong>. All manually configured fees will remain saved. You may switch back to Manual at any time.</>,
  },
  manual: {
    title: 'Switch to Manual',
    confirm: 'Switch To Manual',
    body: <>Automated offers will now use <strong>manually configured fees</strong>. You may switch back to FeeSync at any time.</>,
  },
};

interface SwitchSourceDialogProps {
  /** The source being switched to; null keeps the dialog closed. */
  target: FeeSource | null;
  onCancel: () => void;
  onConfirm: (source: FeeSource) => void;
}

export const SwitchSourceDialog = ({ target, onCancel, onConfirm }: SwitchSourceDialogProps) => {
  // Keep the last opened copy while the dialog animates closed; falling back to a fixed source here made
  // "Switch to Manual" flash the FeeSync copy on dismiss. Updated during render (no effect, no extra paint).
  const [shown, setShown] = useState<FeeSource>(target ?? 'feesync');
  if (target !== null && target !== shown) setShown(target);
  const copy = COPY[target ?? shown];
  return (
    <FeeDialog
      open={target !== null}
      title={copy.title}
      onClose={onCancel}
      actions={(
        <>
          <FeeButton variant="text" onClick={onCancel}>Cancel</FeeButton>
          <FeeButton onClick={() => target && onConfirm(target)}>{copy.confirm}</FeeButton>
        </>
      )}
    >
      <FeeDialogText>{copy.body}</FeeDialogText>
    </FeeDialog>
  );
};
