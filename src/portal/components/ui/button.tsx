// The Portal's button, on MUI's ButtonBase. Same `variant` / `size` vocabulary the
// prototype's shadcn button had, so the call sites read the same; the look comes
// from the `--semantic-*` tokens in portal.css.
import { forwardRef, type ComponentProps } from "react";
import ButtonBase from "@mui/material/ButtonBase";
import type { SxProps, Theme } from "@mui/material/styles";

export type ButtonVariant =
  | "default" | "outline" | "secondary" | "ghost" | "destructive" | "success"
  | "success-outline" | "error" | "error-outline" | "neutral" | "pane" | "link";

export type ButtonSize =
  | "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
  | "toolbar" | "icon-toolbar";

const v = (name: string) => `var(--semantic-${name})`;

const VARIANTS: Record<ButtonVariant, Record<string, unknown>> = {
  default: { bgcolor: v("primary-main"), color: v("primary-contrast"), "&:hover": { opacity: 0.9 } },
  outline: {
    border: `1px solid ${v("primary-states-outlinedborder")}`, color: v("primary-main"), bgcolor: "#fff",
    "&:hover, &[aria-expanded=true]": { bgcolor: v("primary-states-hover") },
  },
  secondary: { bgcolor: "#f4f4f6", color: v("primary-main"), "&:hover": { opacity: 0.8 } },
  ghost: { color: v("primary-main"), "&:hover, &[aria-expanded=true]": { bgcolor: v("primary-states-hover") } },
  destructive: { bgcolor: "rgba(210,50,63,0.1)", color: v("error-main"), "&:hover": { bgcolor: "rgba(210,50,63,0.2)" } },
  success: { bgcolor: v("success-main"), color: v("success-contrast"), "&:hover": { opacity: 0.9 } },
  "success-outline": {
    border: `1px solid ${v("success-states-outlinedborder")}`, color: v("success-main"), bgcolor: "#fff",
    "&:hover, &[aria-expanded=true]": { bgcolor: v("success-states-hover") },
  },
  error: { bgcolor: v("error-main"), color: v("error-contrast"), "&:hover": { opacity: 0.9 } },
  "error-outline": {
    border: `1px solid ${v("error-states-outlinedborder")}`, color: v("error-main"), bgcolor: "#fff",
    "&:hover, &[aria-expanded=true]": { bgcolor: v("error-states-hover") },
  },
  neutral: { color: v("action-active"), "&:hover": { bgcolor: v("action-hover") }, "&[aria-expanded=true]": { bgcolor: v("action-selected") } },
  pane: { color: "#9ca3af", "&:hover": { bgcolor: "#f3f4f6", color: "#4b5563" }, "&[aria-pressed=true]": { color: "#4b5563" } },
  link: { color: v("primary-main"), "&:hover": { textDecoration: "underline" } },
};

// 40px is the standard height; xs / icon-xs / icon-sm / toolbar are for dense chrome.
const SIZES: Record<ButtonSize, Record<string, unknown>> = {
  default: { height: 40, gap: "6px", px: "10px", fontSize: 14 },
  xs: { height: 24, gap: "4px", px: "8px", fontSize: 12, "& svg": { width: 12, height: 12 } },
  sm: { height: 40, gap: "4px", px: "10px", fontSize: 12.8, "& svg": { width: 14, height: 14 } },
  lg: { height: 40, gap: "6px", px: "10px", fontSize: 14 },
  icon: { width: 40, height: 40 },
  "icon-xs": { width: 24, height: 24, "& svg": { width: 12, height: 12 } },
  "icon-sm": { width: 28, height: 28 },
  "icon-lg": { width: 40, height: 40 },
  toolbar: { height: 30, gap: "8px", px: "10px", fontSize: 13, letterSpacing: "0.46px", "& svg": { width: 18, height: 18 } },
  "icon-toolbar": { width: 30, height: 30, "& svg": { width: 20, height: 20 } },
};

export type ButtonProps = Omit<ComponentProps<typeof ButtonBase>, "variant"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "default", sx, ...props }, ref,
) {
  const base: SxProps<Theme> = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    borderRadius: "100px", border: "1px solid transparent", fontFamily: "inherit",
    fontWeight: 500, whiteSpace: "nowrap", userSelect: "none", transition: "all .15s",
    "&.Mui-disabled": { opacity: 0.5, pointerEvents: "none" },
    ...(VARIANTS[variant] as object),
    ...(SIZES[size] as object),
  };
  return <ButtonBase ref={ref} sx={[base, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} {...props} />;
});
