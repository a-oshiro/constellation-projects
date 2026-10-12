// Transient one-shot confirmation — the dark pill that slides in at the
// bottom-right and disappears on its own. Extracted from the Offers task,
// which had it inline, so the Alerts Timeline shows the same thing.
//
// Bottom-right is the app's convention. The Figma for the Alerts Timeline
// puts it bottom-left; the convention won, because the Offers task has been
// shipping it on the right and a toast that changes corner by section reads
// as two different mechanisms.

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function Toast({
  message,
  variant = "success",
}: {
  message: string;
  /** `error` swaps the green check for a red warning — same pill otherwise. */
  variant?: "success" | "error";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] animate-swap-in"
    >
      <div className="flex items-center gap-2 bg-gray-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-full shadow-lg">
        {variant === "error"
          ? <AlertTriangle size={14} className="text-red-400" />
          : <CheckCircle2 size={14} className="text-emerald-300" />}
        {message}
      </div>
    </div>
  );
}

/** The state half: `setToast("…")` shows it, and it clears itself. */
export function useToast(ms = 2400) {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(t);
  }, [toast, ms]);
  return [toast, setToast] as const;
}
