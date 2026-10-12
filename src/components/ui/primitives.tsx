"use client";

import { ChevronLeft, ChevronRight, Globe, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { DotField, DotLoader, DotMark, type MarkPattern } from "@/components/dots/dots";
import type { Visibility } from "@/lib/types";

/* ── Tags & markers ─────────────────────────────────────────────── */

export function Tag({
  children,
  onClick,
  active = false,
  onRemove,
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-xs border font-mono ${
    size === "sm" ? "h-[22px] px-1.5 text-[11px]" : "h-[26px] px-2 text-[12px]"
  } ${
    active
      ? "border-ink bg-ink text-canvas"
      : "border-line bg-canvas text-ink-2 hover:border-ink hover:text-ink"
  } ${onClick ? "cursor-pointer" : ""}`;

  const inner = (
    <>
      <span>{children}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove filter ${String(children)}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 flex h-[14px] w-[14px] items-center justify-center text-[13px] leading-none hover:opacity-70"
        >
          ×
        </button>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <span className={cls}>{inner}</span>;
}

export function VisibilityMarker({ visibility, size = "md" }: { visibility: Visibility; size?: "sm" | "md" }) {
  const Icon = visibility === "public" ? Globe : Lock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-ink-2 ${size === "sm" ? "text-[11px]" : "text-[12px]"}`}
      title={visibility === "public" ? "Public — visible to signed-in users" : "Private — only you"}
    >
      <Icon size={size === "sm" ? 11 : 12} aria-hidden />
      {visibility === "public" ? "Public" : "Private"}
    </span>
  );
}

export function CategoryMarker({ category, pattern = "row" }: { category: string; pattern?: MarkPattern }) {
  if (!category) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
      <DotMark pattern={pattern} muted dot={1.6} gap={1.8} />
      {category}
    </span>
  );
}

/* ── Layout helpers ─────────────────────────────────────────────── */

export function PageHeader({
  title,
  meta,
  description,
  actions,
}: {
  title: string;
  /** Factual mono metadata under the title (counts, sort) — never a decorative eyebrow */
  meta?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">{title}</h1>
          {meta ? <p className="mt-1.5 font-mono text-[12px] text-ink-3">{meta}</p> : null}
          {description ? <p className="mt-1.5 max-w-[64ch] text-sm text-ink-2">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="rule-strong mt-4" />
    </header>
  );
}

export function Skeleton({ className = "", lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-[12px] animate-pulse rounded-xs bg-surface-2" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function PromptRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line border-y border-line" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-[14px] w-[38%] animate-pulse rounded-xs bg-surface-2" />
            <div className="h-[11px] w-[62%] animate-pulse rounded-xs bg-surface" />
          </div>
          <div className="hidden h-[11px] w-16 animate-pulse rounded-xs bg-surface sm:block" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  variant = "default",
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: "default" | "search" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 py-6 text-sm text-ink-2 ${className}`}>
        <DotMark pattern="cross" muted />
        <span>{description}</span>
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-xs border border-line bg-canvas px-6 py-12 text-center ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28">
        <DotField size="sm" opacity={16} fade="b" className="h-full w-full" />
      </div>
      <div className="relative mx-auto flex max-w-[46ch] flex-col items-center">
        <svg aria-hidden viewBox="0 0 91 91" width="72" height="72" className="mb-5 text-ink">
          {Array.from({ length: 7 }).map((_, y) =>
            Array.from({ length: 7 }).map((_, x) => {
              const dx = x - 3;
              const dy = y - 3;
              const dist = Math.sqrt(dx * dx + dy * dy) / 4.24;
              const r = Math.max(0.5, 2.6 * (1 - dist) * (1 - dist));
              return <circle key={`${x}-${y}`} cx={x * 13 + 6.5} cy={y * 13 + 6.5} r={r} fill="currentColor" />;
            }),
          )}
        </svg>
        <h2 className="font-display text-[19px] font-bold tracking-[-0.01em]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function ErrorPanel({ title = "Something went wrong", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xs border border-ink bg-surface px-5 py-4" role="alert">
      <div className="flex items-start gap-3">
        <DotMark pattern="diagonal" className="mt-1" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-2">{message}</p>
        </div>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="shrink-0 text-[13px] font-medium underline underline-offset-4 hover:opacity-70">
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ── Controls ───────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; ariaLabel?: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex items-center rounded-xs border border-line bg-canvas p-[2px]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-[28px] items-center gap-1.5 rounded-[2px] px-2.5 text-[12.5px] font-medium transition-colors ${
              active ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onPage,
  totalLabel,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  totalLabel?: string;
}) {
  if (pageCount <= 1) return totalLabel ? <p className="py-3 font-mono text-[11px] text-ink-3">{totalLabel}</p> : null;
  return (
    <nav className="flex items-center justify-between gap-4 border-t border-line py-3" aria-label="Pagination">
      <span className="font-mono text-[11px] text-ink-3">
        {totalLabel ?? `Page ${page} / ${pageCount}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-[30px] items-center gap-1 rounded-xs border border-line px-2 text-[12.5px] enabled:hover:border-ink disabled:cursor-not-allowed disabled:text-disabled"
        >
          <ChevronLeft size={13} aria-hidden /> Prev
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex h-[30px] items-center gap-1 rounded-xs border border-line px-2 text-[12.5px] enabled:hover:border-ink disabled:cursor-not-allowed disabled:text-disabled"
        >
          Next <ChevronRight size={13} aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export function InlineStatus({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11.5px] text-ink-2">
      <DotLoader dots={3} />
      {children}
    </span>
  );
}
