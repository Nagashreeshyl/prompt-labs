import type { PromptDoc } from "@/lib/types";

export type SearchScope = "library" | "explore";
export type SortKey = "updated" | "created" | "title";

export interface SearchFilters {
  category?: string;
  tag?: string;
  collectionId?: string | null;
  visibility?: "private" | "public";
  favoritesOnly?: boolean;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Keyword match across title, description, tags, category, and body. */
export function matchesQuery(prompt: PromptDoc, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const haystack = [
    prompt.title,
    prompt.description,
    prompt.category,
    prompt.tags.join(" "),
    prompt.content,
    prompt.ownerName,
    prompt.ownerHandle,
  ]
    .join("\n")
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function applyFilters(prompts: PromptDoc[], filters: SearchFilters, favorites?: Set<string>): PromptDoc[] {
  return prompts.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.tag && !p.tags.includes(filters.tag)) return false;
    if (filters.visibility && p.visibility !== filters.visibility) return false;
    if (filters.collectionId !== undefined && filters.collectionId !== null && p.collectionId !== filters.collectionId) return false;
    if (filters.favoritesOnly && favorites && !favorites.has(p.id)) return false;
    return true;
  });
}

export function sortPrompts(prompts: PromptDoc[], sort: SortKey): PromptDoc[] {
  const list = [...prompts];
  switch (sort) {
    case "title":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "created":
      return list.sort((a, b) => b.createdAt - a.createdAt);
    case "updated":
    default:
      return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export function uniqueTags(prompts: PromptDoc[]): string[] {
  const set = new Set<string>();
  for (const p of prompts) for (const t of p.tags) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function uniqueCategories(prompts: PromptDoc[]): string[] {
  const set = new Set<string>();
  for (const p of prompts) if (p.category) set.add(p.category);
  return [...set].sort((a, b) => a.localeCompare(b));
}
