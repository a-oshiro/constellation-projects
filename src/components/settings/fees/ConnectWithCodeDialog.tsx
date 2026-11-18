import { useState } from 'react';
import { FeeButton } from './FeeButton';
import { FeeDialog } from './FeeDialog';
import { FeeTextField } from './FeeTextField';

// Figma "Connect with code" dialog: one FeeSync Account Code field. The button shows an inline spinner
// while the (mocked) connection runs; the parent closes the dialog once fees are pulled.

interface ConnectWithCodeDialogProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConnect: (code: string) => void;
}

export const ConnectWithCodeDialog = ({ open, loading, onCancel, onConnect }: ConnectWithCodeDialogProps) => {
  const [code, setCode] = useState('');
  const canSubmit = code.trim().length > 0 && !loading;
  const submit = () => { if (canSubmit) onConnect(code.trim()); };
  const close = () => { if (!loading) { onCancel(); setCode(''); } };

  return (
    <FeeDialog
      open={open}
      title="Connect with code"
      onClose={close}
      onSubmit={submit}
      actions={(
        <>
          <FeeButton variant="text" onClick={close} disabled={loading}>Cancel</FeeButton>
          <FeeButton type="submit" loading={loading} disabled={!canSubmit}>Connect With Code</FeeButton>
        </>
      )}
    >
      <FeeTextField
        id="feesync-account-code"
        label="FeeSync Account Code"
        value={code}
        onChange={setCode}
        autoFocus
        inputMode="numeric"
      />
    </FeeDialog>
  );
};
