import type { CSSProperties, ReactElement } from "react";

export type DotSize = "xs" | "sm" | "md" | "lg";

interface DotFieldProps {
  /** Visual density/size variant */
  size?: DotSize;
  /** 0–100; lowers the effective contrast of the field */
  opacity?: number;
  /** Fade the field on one edge */
  fade?: "b" | "r" | "none";
  className?: string;
  style?: CSSProperties;
  /** Decorative by default — patterns never carry meaning for AT */
  ariaHidden?: boolean;
}

/** A generated dot-matrix field. No raster assets, no hues. */
export function DotField({ size = "sm", opacity = 100, fade = "none", className = "", style, ariaHidden = true }: DotFieldProps) {
  const fadeClass = fade === "b" ? " dots-fade-b" : fade === "r" ? " dots-fade-r" : "";
  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={`dots-${size}${fadeClass} ${className}`}
      style={{ opacity: opacity / 100, ...style }}
    />
  );
}

/** Dotted separator aligned to the dot system's rhythm. */
export function DotRule({ className = "", strong = false }: { className?: string; strong?: boolean }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        borderTop: strong ? "1px dotted var(--color-ink)" : "1px dotted var(--color-line)",
        height: 0,
      }}
    />
  );
}

const MARK_PATTERNS: Record<string, number[]> = {
  // 3×3 glyphs used as section identifiers
  square: [1, 1, 1, 1, 0, 1, 1, 1, 1],
  bracket: [1, 0, 1, 1, 0, 1, 1, 1, 1],
  cross: [0, 1, 0, 1, 1, 1, 0, 1, 0],
  corner: [1, 1, 0, 1, 0, 0, 0, 0, 0],
  diagonal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  row: [0, 0, 0, 1, 1, 1, 0, 0, 0],
};

export type MarkPattern = keyof typeof MARK_PATTERNS;

/** Small 3×3 dot glyph — a technical marker, not an icon replacement. */
export function DotMark({
  pattern = "square",
  className = "",
  dot = 2,
  gap = 2,
  muted = false,
}: {
  pattern?: MarkPattern;
  className?: string;
  dot?: number;
  gap?: number;
  muted?: boolean;
}) {
  const cells = MARK_PATTERNS[pattern] ?? MARK_PATTERNS.square;
  const size = dot * 3 + gap * 2;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % 3) * (dot + gap)}
            y={Math.floor(i / 3) * (dot + gap)}
            width={dot}
            height={dot}
            fill={muted ? "var(--color-ink-3)" : "var(--color-ink)"}
          />
        ) : null,
      )}
    </svg>
  );
}

/** Sequenced pulsing dots — restrained, reduced-motion aware via CSS. */
export function DotLoader({ dots = 5, className = "" }: { dots?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[5px] ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className="anim-dot-pulse block h-[3px] w-[3px] rounded-full bg-ink"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

/** Radial halftone formation for empty states and identity panels. Uses currentColor. */
export function Halftone({
  rings = 9,
  maxDot = 3.2,
  pitch = 13,
  className = "",
  center = false,
}: {
  rings?: number;
  maxDot?: number;
  pitch?: number;
  className?: string;
  center?: boolean;
}) {
  const n = rings * 2 + 1;
  const size = n * pitch;
  const c = (n - 1) / 2;
  const circles: ReactElement[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = x - c;
      const dy = y - c;
      const dist = Math.sqrt(dx * dx + dy * dy) / (c || 1);
      const t = center ? dist : 1 - dist;
      const r = Math.max(0.4, maxDot * t * t * (center ? 1 : 1.15));
      if (r <= 0.45 && t < 0.12) continue;
      circles.push(
        <circle key={`${x}-${y}`} cx={x * pitch + pitch / 2} cy={y * pitch + pitch / 2} r={r} fill="currentColor" />,
      );
    }
  }
  return (
    <svg aria-hidden viewBox={`0 0 ${size} ${size}`} className={className} style={{ overflow: "visible" }}>
      {circles}
    </svg>
  );
}

/** The Prompt Labs logo mark — a 7×7 dot-matrix P. */
export function DotLogo({ size = 22, className = "" }: { size?: number; className?: string }) {
  const pattern = [
    1, 1, 1, 1, 1, 0, 0,
    1, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 0, 0,
    1, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0,
  ];
  const dot = 2;
  const gap = 1.15;
  const unit = dot + gap;
  const total = 7 * unit - gap;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Prompt Labs"
    >
      {pattern.map((on, i) =>
        on ? (
          <rect key={i} x={(i % 7) * unit} y={Math.floor(i / 7) * unit} width={dot} height={dot} fill="currentColor" />
        ) : null,
      )}
    </svg>
  );
}
