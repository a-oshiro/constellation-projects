import { useState } from 'react';
import { LockedFormContext } from '../../context/LockedFormContext';
import { Tooltip } from './Tooltip';

export const LOCKED_FORM_TOOLTIP = 'Unlock project to make changes';

/** Any element matching this is a "control" for the hover tooltip — the closest one to the pointer wins,
 * so an icon button inside a text field's adornment gets its own tooltip rather than the field's. */
const CONTROL_SELECTOR = '.MuiButtonBase-root, button, .MuiFormControlLabel-root, .MuiFormControl-root';

/**
 * Wraps a form so that, while `locked`, every control inside it is disabled and hovering any of them
 * shows "Unlock project to make changes".
 * - `AppTextField`/`AppSelect` (and any control reading `useLockedForm`) render MUI's own disabled style.
 * - The native `<fieldset disabled>` is the safety net: it disables every native input/button inside,
 *   including plain `<button>`s, which get a matching dimmed style below.
 * - One delegated hover handler drives a single tooltip anchored to whichever control is under the
 *   pointer — disabled MUI buttons normally swallow pointer events, so they're re-enabled for hover only
 *   (clicks still do nothing, since the underlying elements are disabled).
 */
export const LockedFormScope = ({ locked, children }: { locked: boolean; children: React.ReactNode }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!locked) return <LockedFormContext.Provider value={false}>{children}</LockedFormContext.Provider>;

  const handleMouseOver = (e: React.MouseEvent) => {
    const control = (e.target as HTMLElement).closest<HTMLElement>(CONTROL_SELECTOR);
    const next = control && e.currentTarget.contains(control) ? control : null;
    if (next !== anchor) setAnchor(next);
  };

  return (
    <LockedFormContext.Provider value>
      <style>{`
        .locked-form-scope .MuiButtonBase-root.Mui-disabled { pointer-events: auto; cursor: default; }
        .locked-form-scope .MuiInputBase-root.Mui-disabled,
        .locked-form-scope .MuiInputBase-root.Mui-disabled * { cursor: default; }
        .locked-form-scope button:disabled:not(.MuiButtonBase-root) { opacity: 0.38; cursor: default; }
      `}</style>
      <fieldset
        disabled
        className="locked-form-scope"
        onMouseOver={handleMouseOver}
        onMouseLeave={() => setAnchor(null)}
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
      >
        {children}
      </fieldset>
      <Tooltip
        title={LOCKED_FORM_TOOLTIP}
        open={!!anchor}
        placement="top"
        slotProps={{ popper: { anchorEl: anchor, style: { zIndex: 100050 } } }}
      >
        <span style={{ display: 'none' }} />
      </Tooltip>
    </LockedFormContext.Provider>
  );
};
