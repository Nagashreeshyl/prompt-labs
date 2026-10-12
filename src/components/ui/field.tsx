"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {children}
      </label>
      {hint ? <span className="font-mono text-[11px] text-ink-3">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-snug text-ink">
      <span aria-hidden className="mt-[5px] block h-[7px] w-[7px] shrink-0 bg-ink" />
      <span>{message}</span>
    </p>
  );
}

const inputBase =
  "w-full rounded-xs border bg-canvas text-ink placeholder:text-ink-3 transition-colors duration-150 disabled:bg-disabled-bg disabled:text-disabled";

function stateBorder(error?: string) {
  return error ? "border-ink border-[1.5px]" : "border-line hover:border-ink-3";
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  mono?: boolean;
  inputSize?: "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, mono = false, inputSize = "md", className = "", id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <input
      id={inputId}
      ref={ref}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${inputId}-err` : undefined}
      className={`${inputBase} ${stateBorder(error)} ${mono ? "font-mono text-[13px]" : ""} ${
        inputSize === "lg" ? "h-11 px-3.5 text-[15px]" : "h-9 px-3 text-sm"
      } ${className}`}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  mono?: boolean;
}

export function Textarea({ error, mono = false, className = "", id, rows = 8, ...rest }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <textarea
      id={inputId}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${inputId}-err` : undefined}
      className={`${inputBase} ${stateBorder(error)} ${
        mono ? "font-mono text-[13.5px] leading-[1.65]" : "text-sm leading-relaxed"
      } min-h-[96px] resize-y px-3.5 py-2.5 ${className}`}
      {...rest}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ error, options, placeholder, className = "", id, ...rest }: SelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="relative">
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`${inputBase} ${stateBorder(error)} h-9 cursor-pointer appearance-none pl-3 pr-9 text-sm ${className}`}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" />
    </div>
  );
}

export function Checkbox({
  label,
  id,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={`inline-flex items-center gap-2.5 text-sm text-ink ${disabled ? "cursor-not-allowed text-disabled" : "cursor-pointer"}`}>
      <input
        id={inputId}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
          checked ? "border-ink bg-ink" : "border-ink bg-canvas"
        } ${disabled ? "border-line bg-disabled-bg" : ""}`}
      >
        {checked ? (
          <svg viewBox="0 0 10 10" className="h-[10px] w-[10px] text-canvas">
            <path d="M1.5 5.2 4 7.5 8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        ) : null}
      </span>
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; id?: string }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-3 text-sm">
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-[22px] w-[40px] border transition-colors ${checked ? "border-ink bg-ink" : "border-line bg-canvas"}`}
      >
        <span
          aria-hidden
          className={`absolute top-[2px] block h-[16px] w-[16px] transition-transform duration-150 ${checked ? "translate-x-[20px] bg-canvas" : "translate-x-[2px] bg-ink"}`}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
