import type { VariableDef } from "@/lib/types";

const VARIABLE_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/** Detect unique {{variable_name}} placeholders in a prompt body, in order of first appearance. */
export function detectVariables(content: string): string[] {
  const seen: string[] = [];
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  VARIABLE_RE.lastIndex = 0;
  while ((m = VARIABLE_RE.exec(content)) !== null) {
    const name = m[1];
    if (!found.has(name)) {
      found.add(name);
      seen.push(name);
    }
  }
  return seen;
}

export function humanizeVariable(name: string): string {
  return name
    .split("_")
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export interface SubstitutionResult {
  text: string;
  missing: string[];
}

/**
 * Substitute variable values into a template. Purely string-based — the
 * result is never parsed as HTML or code, and the source is never mutated.
 */
export function substitute(content: string, values: Record<string, string>): SubstitutionResult {
  const missing: string[] = [];
  const names = detectVariables(content);
  const text = content.replace(VARIABLE_RE, (_full, name: string) => {
    const value = values[name];
    if (value === undefined || value === "") {
      if (!missing.includes(name)) missing.push(name);
      return `{{${name}}}`;
    }
    return value;
  });
  for (const n of names) {
    const v = values[n];
    if (v === undefined || v === "") missing.push(n);
  }
  return { text, missing: [...new Set(missing)] };
}

/** Merge detected names with any stored definitions, keeping user metadata. */
export function mergeVariableDefs(content: string, stored: VariableDef[]): VariableDef[] {
  const names = detectVariables(content);
  const byName = new Map(stored.map((v) => [v.name, v]));
  return names.map((name) => byName.get(name) ?? { name });
}

function normalizeDefs(list: VariableDef[]): string {
  return JSON.stringify(
    list.map((v) => ({
      name: v.name,
      label: v.label || "",
      description: v.description || "",
      defaultValue: v.defaultValue || "",
    })),
  );
}

/** True when the definitions derived from a body differ from what is stored. */
export function defsChanged(content: string, stored: VariableDef[]): boolean {
  return normalizeDefs(mergeVariableDefs(content, stored)) !== normalizeDefs(stored.filter((s) => detectVariables(content).includes(s.name)));
}
