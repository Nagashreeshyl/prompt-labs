"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Segmented, EmptyState, Pagination, PromptRowSkeleton, Tag } from "@/components/ui/primitives";
import { applyFilters, matchesQuery, sortPrompts, uniqueCategories, uniqueTags, type SearchScope, type SortKey } from "@/lib/search";
import { useStore } from "@/lib/store";

const PAGE_SIZE = 10;

function SearchInner() {
  const searchParams = useSearchParams();
  const { owned, publicPrompts, favorites, dataLoading } = useStore();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [scope, setScope] = useState<SearchScope>("library");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(1);
  const [submitted, setSubmitted] = useState(() => searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced local query application
  useEffect(() => {
    const t = window.setTimeout(() => setSubmitted(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const source = scope === "library" ? owned : publicPrompts;

  const results = useMemo(() => {
    let list = source.filter((p) => matchesQuery(p, submitted));
    list = applyFilters(list, { category: category || undefined, tag: tag || undefined }, favorites);
    return sortPrompts(list, sort);
  }, [source, submitted, category, tag, favorites, sort]);

  const filterKey = `${submitted}|${category}|${tag}|${sort}|${scope}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const categories = useMemo(() => uniqueCategories(source), [source]);
  const tags = useMemo(() => uniqueTags(source), [source]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">Search</h1>
        <p className="mt-1.5 font-mono text-[12px] text-ink-3">
          Keyword search across title, description, tags, category, and body · no semantic ranking
        </p>
      </div>
      <div className="rule-strong mb-5" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            ref={inputRef}
            data-search-input
            type="search"
            aria-label="Search prompts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSubmitted(query);
              }
              if (e.key === "Escape") setQuery("");
            }}
            placeholder={scope === "library" ? "Search your library…" : "Search public prompts…"}
            className="h-12 w-full rounded-xs border border-ink bg-canvas pl-11 pr-10 text-[15px] placeholder:text-ink-3"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setSubmitted("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-ink-2 hover:text-ink"
            >
              <X size={15} aria-hidden />
            </button>
          ) : null}
        </div>
        <Segmented
          ariaLabel="Search scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: "library", label: "My Library" },
            { value: "explore", label: "Explore" },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          aria-label="Sort results"
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
        {(category || tag) && (
          <Button
            size="sm"
            onClick={() => {
              setCategory("");
              setTag("");
            }}
          >
            <X size={12} aria-hidden />
            Clear filters
          </Button>
        )}
      </div>

      {(category || tag) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {category ? (
            <Tag onRemove={() => setCategory("")}>{category}</Tag>
          ) : null}
          {tag ? <Tag onRemove={() => setTag("")}>#{tag}</Tag> : null}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 font-mono text-[11.5px] text-ink-3" role="status">
          {dataLoading
            ? "Loading…"
            : submitted || category || tag
              ? `${results.length} result${results.length === 1 ? "" : "s"} in ${scope === "library" ? "your library" : "Explore"}`
              : `Type to search · ${source.length} prompt${source.length === 1 ? "" : "s"} in scope`}
        </p>

        {dataLoading ? <PromptRowSkeleton rows={4} /> : null}

        {!dataLoading && (submitted || category || tag) && results.length === 0 ? (
          <EmptyState
            title="No results"
            description={`Nothing in ${scope === "library" ? "your library" : "Explore"} matches “${submitted}” with the current filters. Try fewer words, clear filters, or switch scope.`}
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setSubmitted("");
                  setCategory("");
                  setTag("");
                }}
              >
                Clear search and filters
              </Button>
            }
          />
        ) : null}

        {!dataLoading && pageItems.length > 0 ? (
          <div className="border-t border-ink">
            {pageItems.map((p) => (
              <PromptRow key={p.id} prompt={p} showAuthor={scope === "explore"} showVisibility={scope === "library"} />
            ))}
          </div>
        ) : null}

        {!dataLoading && results.length > 0 ? (
          <Pagination page={page} pageCount={pageCount} onPage={setPage} totalLabel={`Page ${page} of ${pageCount}`} />
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
