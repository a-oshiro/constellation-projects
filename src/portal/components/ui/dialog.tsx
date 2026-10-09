// The Portal's dialog, on MUI's Dialog. Keeps the compound shape the prototype
// used (Dialog / DialogContent / Header / Title / Description / Footer) so the
// call sites are unchanged.
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import MuiDialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { XIcon } from "lucide-react";

export function Dialog({
  open, onOpenChange, children,
}: { open: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  // The content component supplies the Paper, so the root only carries open state.
  return <DialogCtx.Provider value={{ open, onOpenChange }}>{children}</DialogCtx.Provider>;
}

const DialogCtx = createContext<{ open: boolean; onOpenChange?: (o: boolean) => void }>({ open: false });

export function DialogContent({
  className, children, showCloseButton = true,
}: { className?: string; children?: ReactNode; showCloseButton?: boolean }) {
  const { open, onOpenChange } = useContext(DialogCtx);
  // MUI's paper styles are unlayered and would beat Tailwind utilities, so only
  // set a width when the caller has not.
  const sized = !!className && /(^|\s)(sm:)?w-/.test(className);
  return (
    <MuiDialog
      open={open}
      onClose={() => onOpenChange?.(false)}
      maxWidth={false}
      slotProps={{
        paper: {
          className,
          sx: {
            m: 2, borderRadius: "12px", maxHeight: "none", position: "relative",
            ...(sized ? {} : { width: 384, maxWidth: "calc(100% - 2rem)", p: 2, display: "grid", gap: 2 }),
          },
        },
      }}
    >
      {children}
      {showCloseButton && (
        <IconButton aria-label="Close" size="small" onClick={() => onOpenChange?.(false)}
          sx={{ position: "absolute", top: 8, right: 8 }}>
          <XIcon size={16} />
        </IconButton>
      )}
    </MuiDialog>
  );
}

export function DialogHeader({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`flex flex-col gap-2 ${className}`} {...props} />;
}

export function DialogFooter({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`flex flex-row justify-end gap-2 ${className}`} {...props} />;
}

export function DialogTitle({ className = "", ...props }: ComponentProps<"h2">) {
  return <h2 className={`text-base leading-none font-medium ${className}`} {...props} />;
}

export function DialogDescription({ className = "", ...props }: ComponentProps<"p">) {
  return <p className={`text-sm text-gray-500 ${className}`} {...props} />;
}
