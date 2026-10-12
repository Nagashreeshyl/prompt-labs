"use client";

import { DotLoader, DotLogo } from "@/components/dots/dots";

export function AppLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5" role="status" aria-live="polite">
      <DotLogo size={34} className="text-ink" />
      <div className="flex items-center gap-3">
        <DotLoader dots={5} />
        <span className="font-mono text-[11.5px] text-ink-3">{label}</span>
      </div>
    </div>
  );
}
