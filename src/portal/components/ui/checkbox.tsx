// The Portal's checkbox — a 16px box with the same props the prototype's
// (`checked`, `indeterminate`, `onCheckedChange`). A button with
// role="checkbox" rather than an <input>, so it can show the mixed state and
// be styled from the `--semantic-*` tokens in portal.css.
import { Check, Minus } from "lucide-react";
import type { ComponentProps } from "react";

type CheckboxProps = Omit<ComponentProps<"button">, "onChange" | "role"> & {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  checked = false, indeterminate = false, onCheckedChange, className = "", onClick, ...props
}: CheckboxProps) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      data-slot="checkbox"
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={`relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border outline-none transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-semantic-primary-main/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        on
          ? "border-semantic-primary-main bg-semantic-primary-main text-semantic-primary-contrast"
          : "border-gray-300 bg-white"
      } ${className}`}
      {...props}
    >
      {indeterminate ? <Minus className="size-3.5" /> : checked ? <Check className="size-3.5" /> : null}
    </button>
  );
}
