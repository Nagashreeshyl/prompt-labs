"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, description, children, footer, width = 480 }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = Array.from(
        node.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/25"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="anim-dialog-in relative w-full rounded-xs border border-ink bg-canvas shadow-dialog"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="font-display text-[17px] font-bold tracking-[-0.01em]">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-[13px] leading-snug text-ink-2">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xs text-ink-2 hover:bg-surface hover:text-ink"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : null}
        {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  requireText,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** When set, the user must type this exact text to enable confirmation */
  requireText?: string;
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setTyped("");
  }
  const blocked = Boolean(requireText) && typed.trim() !== requireText;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={520}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={loading} disabled={blocked}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <div className="text-sm leading-relaxed text-ink-2">{description}</div> : null}
      {children}
      {requireText ? (
        <div className="mt-4">
          <label htmlFor="confirm-typed" className="mb-1.5 block text-[13px] font-medium text-ink">
            Type <span className="font-mono">{requireText}</span> to confirm
          </label>
          <input
            id="confirm-typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="h-9 w-full rounded-xs border border-line bg-canvas px-3 font-mono text-[13px] focus:border-ink"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ) : null}
    </Modal>
  );
}

/* ── Dropdown / context menu ─────────────────────────────────────── */

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

export function Menu({
  trigger,
  items,
  align = "end",
  ariaLabel = "Menu",
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean }) => ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <span className="contents">{trigger({ onClick: () => setOpen((v) => !v), "aria-expanded": open })}</span>
      {open ? (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={`anim-fade-in absolute z-40 mt-1 min-w-[190px] rounded-xs border border-ink bg-canvas py-1 shadow-dialog ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <div key={item.label}>
              {item.separatorBefore ? <div className="my-1 border-t border-line" role="separator" /> : null}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`block w-full px-3 py-[7px] text-left text-[13px] ${
                  item.disabled ? "cursor-not-allowed text-disabled" : item.danger ? "text-ink hover:bg-ink hover:text-canvas" : "text-ink hover:bg-surface"
                }`}
              >
                {item.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Keyboard-navigable menu opened by right-click on a row. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  useEffect(() => {
    function onDoc() {
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="menu"
      className="fixed z-50 min-w-[190px] rounded-xs border border-ink bg-canvas py-1 shadow-dialog"
      style={{ left: Math.min(x, window.innerWidth - 210), top: Math.min(y, window.innerHeight - 240) }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <div key={item.label}>
          {item.separatorBefore ? <div className="my-1 border-t border-line" role="separator" /> : null}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={`block w-full px-3 py-[7px] text-left text-[13px] ${
              item.disabled ? "cursor-not-allowed text-disabled" : item.danger ? "text-ink hover:bg-ink hover:text-canvas" : "text-ink hover:bg-surface"
            }`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* ── Tooltip (title fallback enhanced with delay) ────────────────── */

const TooltipCtx = createContext<{ show: (t: string) => void; hide: () => void } | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const show = useCallback((t: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setText(t), 450);
  }, []);
  const hide = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setText(null);
  }, []);
  return (
    <TooltipCtx.Provider value={{ show, hide }}>
      {children}
      {text ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-xs bg-ink px-2.5 py-1.5 text-[12px] text-canvas"
        >
          {text}
        </div>
      ) : null}
    </TooltipCtx.Provider>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const ctx = useContext(TooltipCtx);
  if (!ctx) return <>{children}</>;
  return (
    <span onMouseEnter={() => ctx.show(label)} onMouseLeave={ctx.hide} onFocus={() => ctx.show(label)} onBlur={ctx.hide} className="inline-flex">
      {children}
    </span>
  );
}
