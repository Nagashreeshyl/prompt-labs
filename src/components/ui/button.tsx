"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { DotLoader } from "@/components/dots/dots";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-xs font-medium transition-colors duration-150 select-none disabled:pointer-events-none aria-disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-canvas border border-ink hover:bg-[#1a1a1a] active:bg-canvas active:text-ink",
  secondary: "bg-canvas text-ink border border-ink hover:bg-surface active:bg-surface-2",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-surface active:bg-surface-2",
  danger: "bg-canvas text-ink border border-ink hover:bg-ink hover:text-canvas",
};

const sizes: Record<Size, string> = {
  sm: "h-[30px] px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-[42px] px-5 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  block = false,
  icon,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <DotLoader dots={3} className="mr-0.5" /> : icon}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  size?: Size;
  loading?: boolean;
}

export function IconButton({ label, active = false, size = "md", loading = false, className = "", children, disabled, ...rest }: IconButtonProps) {
  const dim = size === "sm" ? "h-[30px] w-[30px]" : size === "lg" ? "h-[42px] w-[42px]" : "h-9 w-9";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={`${base} ${dim} ${active ? "bg-ink text-canvas border border-ink" : "bg-canvas text-ink border border-line hover:border-ink"} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : children}
    </button>
  );
}
