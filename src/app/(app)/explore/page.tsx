"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Halftone } from "@/components/dots/dots";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination, PromptRowSkeleton, Tag } from "@/components/ui/primitives";
import { useNavGuard, GuardedLink } from "@/lib/nav-guard";
import { applyFilters, matchesQuery, sortPrompts, uniqueCategories, uniqueTags, type SortKey } from "@/lib/search";
import { useStore } from "@/lib/store";

const PAGE_SIZE = 10;

export default function ExplorePage() {
  const router = useRouter();
  const { publicPrompts, owned, favorites, dataLoading, dataError, refreshPublic } = useStore();
  const { guardedNav } = useNavGuard();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    let list = publicPrompts.filter((p) => matchesQuery(p, query));
    list = applyFilters(list, { category: category || undefined, tag: tag || undefined }, favorites);
    return sortPrompts(list, sort);
  }, [publicPrompts, query, category, tag, favorites, sort]);

  const filterKey = `${query}|${category}|${tag}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const categories = useMemo(() => uniqueCategories(publicPrompts), [publicPrompts]);
  const tags = useMemo(() => uniqueTags(publicPrompts), [publicPrompts]);
  const ownPublic = owned.filter((p) => p.visibility === "public").length;
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Explore"
        meta={`${publicPrompts.length} public prompt${publicPrompts.length === 1 ? "" : "s"} · ${ownPublic} published by you`}
        description="A shared library of prompts people chose to publish. Read anything; save an independent copy into your private library — the original stays with its author."
        actions={
          <GuardedLink
            href="/library"
            className="inline-flex h-9 items-center rounded-xs border border-ink px-3.5 text-sm font-medium hover:bg-surface"
          >
            Back to my library
          </GuardedLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[340px]">
          <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <Input
            aria-label="Search public prompts"
            placeholder="Search public prompts…"
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
      </div>

      {tag ? (
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">Tag filter</span>
          <Tag onRemove={() => setTag("")}>#{tag}</Tag>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mb-5 flex flex-wrap gap-1.5 border-y border-line py-3">
          {tags.slice(0, 14).map((t) => (
            <Tag key={t} size="sm" active={tag === t} onClick={() => setTag(tag === t ? "" : t)}>
              {t}
            </Tag>
          ))}
        </div>
      ) : null}

      {dataError ? (
        <div className="mb-4 border border-ink bg-surface px-4 py-3 text-sm" role="alert">
          {dataError}{" "}
          <button type="button" onClick={() => void refreshPublic()} className="underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : null}

      {dataLoading ? <PromptRowSkeleton rows={5} /> : null}

      {!dataLoading && publicPrompts.length === 0 ? (
        <div className="relative overflow-hidden rounded-xs border border-line">
          <div className="pointer-events-none absolute -right-10 -top-12 text-ink opacity-[0.12]">
            <Halftone rings={12} maxDot={3} pitch={14} className="w-[360px]" />
          </div>
          <div className="relative px-6 py-14 text-center">
            <h2 className="font-display text-[19px] font-bold">Nothing published yet</h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-2">
              Explore shows prompts that people published from their libraries.{" "}
              {ownPublic > 0
                ? `You have ${ownPublic} published prompt${ownPublic === 1 ? "" : "s"} — they are listed above.`
                : "Publish one from your library to see it appear here."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => guardedNav(() => router.push("/prompts/new"))}>
                Create a prompt to publish
              </Button>
              <GuardedLink href="/library" className="inline-flex h-9 items-center rounded-xs border border-ink px-3.5 text-sm font-medium hover:bg-surface">
                Open my library
              </GuardedLink>
            </div>
          </div>
        </div>
      ) : null}

      {!dataLoading && publicPrompts.length > 0 && results.length === 0 ? (
        <EmptyState
          title="No public prompts match"
          description="Nothing in Explore matches the current search and filters."
          action={
            <Button
              onClick={() => {
                setQuery("");
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
            <PromptRow key={p.id} prompt={p} showAuthor />
          ))}
        </div>
      ) : null}

      {!dataLoading && results.length > 0 ? (
        <Pagination page={page} pageCount={pageCount} onPage={setPage} totalLabel={`Page ${page} of ${pageCount}`} />
      ) : null}
    </div>
  );
}
