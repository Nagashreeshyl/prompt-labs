import { Halftone, DotLogo } from "@/components/dots/dots";

const PILLARS = ["Capture", "Organize", "Discover", "Customize", "Reuse", "Share"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>

      <aside aria-hidden className="relative hidden overflow-hidden bg-ink text-canvas lg:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <Halftone rings={14} maxDot={3.4} pitch={15} className="w-[560px] max-w-[90%] text-canvas opacity-90" />
        </div>
        <div className="absolute left-10 top-10 flex items-center gap-2.5">
          <DotLogo size={26} />
          <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.06em]">Prompt Labs</span>
        </div>
        <div className="absolute bottom-10 left-10 right-10">
          <p className="max-w-[20ch] font-display text-[34px] font-bold leading-[1.08] tracking-[-0.02em]">
            Find the right prompt. Customize it. Reuse it. Share it.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11.5px] text-line">
            {PILLARS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
