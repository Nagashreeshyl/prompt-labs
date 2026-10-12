import Link from "next/link";
import { Halftone } from "@/components/dots/dots";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 text-ink opacity-[0.1]">
        <Halftone rings={14} maxDot={4} pitch={16} className="w-[420px]" />
      </div>
      <div className="relative w-full max-w-[52ch] text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-3">Error 404</p>
        <h1 className="mt-3 font-display text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[40px]">
          This page doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
          The link may be outdated, or the prompt was deleted. Your library, collections, and favorites are still where you left
          them.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href="/home"
            className="inline-flex h-9 items-center rounded-xs bg-ink px-3.5 text-sm font-medium text-canvas hover:bg-[#1a1a1a]"
          >
            Go home
          </Link>
          <Link
            href="/library"
            className="inline-flex h-9 items-center rounded-xs border border-ink px-3.5 text-sm font-medium hover:bg-surface"
          >
            Open library
          </Link>
        </div>
      </div>
    </div>
  );
}
