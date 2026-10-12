"use client";

import { X } from "lucide-react";
import { useStore } from "@/lib/store";

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="anim-fade-in pointer-events-auto flex items-start gap-3 rounded-xs border border-ink bg-ink px-3.5 py-3 text-canvas shadow-dialog"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug">{t.message}</p>
            {t.detail ? <p className="mt-0.5 font-mono text-[11px] text-line">{t.detail}</p> : null}
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismissToast(t.id);
                }}
                className="mt-2 text-[12.5px] font-medium underline underline-offset-4 hover:opacity-80"
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(t.id)}
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-line hover:text-canvas"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
