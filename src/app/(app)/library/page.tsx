"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LayoutGrid, List, Plus, RotateCcw, Search, X } from "lucide-react";
import { PromptCard } from "@/components/prompt/prompt-card";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Segmented, EmptyState, Pagination, PageHeader, PromptRowSkeleton, Tag } from "@/components/ui/primitives";
import { useNavGuard, GuardedLink } from "@/lib/nav-guard";
import { applyFilters, matchesQuery, sortPrompts, uniqueCategories, uniqueTags, type SortKey } from "@/lib/search";
import { useStore } from "@/lib/store";

const PAGE_SIZE = 12;

function LibraryInner() {
  const searchParams = useSearchParams();
  const { owned, collections, favorites, dataLoading, dataError, refreshAll } = useStore();
  const { guardedNav } = useNavGuard();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [visibility, setVisibility] = useState<"" | "private" | "public">("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("updated");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  const visParam = searchParams.get("visibility");
  const colParam = searchParams.get("collection");
  const paramKey = `${visParam}|${colParam}`;
  const [prevParamKey, setPrevParamKey] = useState<string | null>(null);
  if (prevParamKey !== paramKey) {
    setPrevParamKey(paramKey);
    if (visParam === "public" || visParam === "private") setVisibility(visParam);
    if (colParam) setCollectionId(colParam);
  }

  const filtered = useMemo(() => {
    let list = owned.filter((p) => matchesQuery(p, query));
    list = applyFilters(
      list,
      {
        category: category || undefined,
        tag: tag || undefined,
        collectionId: collectionId || undefined,
        visibility: visibility || undefined,
        favoritesOnly: favoritesOnly || undefined,
      },
      favorites,
    );
    return sortPrompts(list, sort);
  }, [owned, query, category, tag, collectionId, visibility, favoritesOnly, favorites, sort]);

  const filterKey = `${query}|${category}|${tag}|${collectionId}|${visibility}|${favoritesOnly}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categories = useMemo(() => uniqueCategories(owned), [owned]);
  const tags = useMemo(() => uniqueTags(owned), [owned]);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (query) activeFilters.push({ key: "q", label: `“${query}”`, clear: () => setQuery("") });
  if (category) activeFilters.push({ key: "cat", label: category, clear: () => setCategory("") });
  if (tag) activeFilters.push({ key: "tag", label: `#${tag}`, clear: () => setTag("") });
  if (collectionId)
    activeFilters.push({
      key: "col",
      label: collections.find((c) => c.id === collectionId)?.name ?? "Collection",
      clear: () => setCollectionId(""),
    });
  if (visibility) activeFilters.push({ key: "vis", label: visibility, clear: () => setVisibility("") });
  if (favoritesOnly) activeFilters.push({ key: "fav", label: "Favorites only", clear: () => setFavoritesOnly(false) });

  return (
    <div>
      <PageHeader
        title="My Library"
        meta={`${owned.length} prompt${owned.length === 1 ? "" : "s"} · ${owned.filter((p) => p.visibility === "public").length} public`}
        actions={
          <>
            <Segmented
              ariaLabel="View"
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: <List size={13} aria-hidden />, ariaLabel: "List view" },
                { value: "grid", label: <LayoutGrid size={13} aria-hidden />, ariaLabel: "Grid view" },
              ]}
            />
            <GuardedLink
              href="/prompts/new"
              className="inline-flex h-9 items-center gap-2 rounded-xs border border-ink bg-ink px-3.5 text-sm font-medium text-canvas hover:bg-[#1a1a1a]"
            >
              <Plus size={14} aria-hidden />
              New prompt
            </GuardedLink>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
          <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <Input
            aria-label="Search within library"
            placeholder="Search title, tags, content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          options={[
            { value: "updated", label: "Recently updated" },
            { value: "created", label: "Recently created" },
            { value: "title", label: "Title A–Z" },
          ]}
        />
        <Select
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          aria-label="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          options={[{ value: "", label: "All tags" }, ...tags.map((t) => ({ value: t, label: t }))]}
        />
        <Select
          aria-label="Collection"
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          options={[{ value: "", label: "Any collection" }, ...collections.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Select
          aria-label="Visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "" | "private" | "public")}
          options={[
            { value: "", label: "Any visibility" },
            { value: "private", label: "Private" },
            { value: "public", label: "Public" },
          ]}
        />
        <Button size="sm" onClick={() => setFavoritesOnly((v) => !v)} aria-pressed={favoritesOnly} className={favoritesOnly ? "!border-ink bg-surface" : ""}>
          Favorites
        </Button>
      </div>

      {activeFilters.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">Active filters</span>
          {activeFilters.map((f) => (
            <Tag key={f.key} onRemove={f.clear}>
              {f.label}
            </Tag>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setTag("");
              setCollectionId("");
              setVisibility("");
              setFavoritesOnly(false);
            }}
            className="inline-flex items-center gap-1.5 text-[12.5px] underline underline-offset-4 hover:opacity-70"
          >
            <RotateCcw size={12} aria-hidden />
            Reset all
          </button>
        </div>
      ) : null}

      {dataError ? (
        <div className="mb-4 border border-ink bg-surface px-4 py-3 text-sm" role="alert">
          {dataError}{" "}
          <button type="button" onClick={() => void refreshAll()} className="underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : null}

      {dataLoading ? <PromptRowSkeleton rows={6} /> : null}

      {!dataLoading && owned.length === 0 ? (
        <EmptyState
          title="No prompts yet"
          description="Prompts you save live here. Start from a blank template — variables you add with {{braces}} become fill-in fields later."
          action={
            <Button variant="primary" onClick={() => guardedNav(() => router.push("/prompts/new"))}>
              <Plus size={14} aria-hidden />
              Create your first prompt
            </Button>
          }
        />
      ) : null}

      {!dataLoading && owned.length > 0 && filtered.length === 0 ? (
        <EmptyState
          title="No prompts match"
          description="No prompts in your library match the current search and filters. Remove a filter or clear the search to see everything."
          action={
            <Button
              onClick={() => {
                setQuery("");
                setCategory("");
                setTag("");
                setCollectionId("");
                setVisibility("");
                setFavoritesOnly(false);
              }}
            >
              <X size={14} aria-hidden />
              Clear search and filters
            </Button>
          }
        />
      ) : null}

      {!dataLoading && filtered.length > 0 ? (
        view === "list" ? (
          <div className="border-t border-ink">
            {pageItems.map((p) => (
              <PromptRow key={p.id} prompt={p} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        )
      ) : null}

      {!dataLoading && filtered.length > 0 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPage={setPage}
          totalLabel={`${filtered.length} result${filtered.length === 1 ? "" : "s"} · page ${page} of ${pageCount}`}
        />
      ) : null}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<PageHeader title="My Library" meta="Loading…" />}>
      <LibraryInner />
    </Suspense>
  );
}
