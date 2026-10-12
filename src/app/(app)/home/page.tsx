"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Search } from "lucide-react";
import { Halftone } from "@/components/dots/dots";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PromptRowSkeleton, Tag } from "@/components/ui/primitives";
import { formatRelativeTime, greetingForHour } from "@/lib/format";
import { useNavGuard, GuardedLink } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { user, owned, publicPrompts, collections, favorites, recents, dataLoading, dataError, refreshAll } = useStore();

  const hour = typeof window === "undefined" ? 12 : new Date().getHours();
  const greeting = greetingForHour(hour);
  const firstName = (user?.displayName ?? "there").split(" ")[0];

  const recentPrompts = recents
    .map((r) => owned.find((p) => p.id === r.promptId) ?? publicPrompts.find((p) => p.id === r.promptId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  const favoritePrompts = owned.concat(publicPrompts).filter((p) => favorites.has(p.id)).slice(0, 3);

  const publicCount = owned.filter((p) => p.visibility === "public").length;
  const tagCount = new Set(owned.flatMap((p) => p.tags)).size;

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const query = typeof q === "string" ? q.trim() : "";
    guardedNav(() => router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search"));
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        meta={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        actions={
          <>
            <form onSubmit={submitSearch} className="relative hidden sm:block">
              <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                name="q"
                aria-label="Search prompts"
                placeholder="Search your library…"
                className="h-9 w-[260px] rounded-xs border border-line bg-canvas pl-9 pr-3 text-[13.5px] placeholder:text-ink-3 hover:border-ink-3 focus:border-ink"
              />
            </form>
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

      {dataError ? (
        <div className="mb-6 border border-ink bg-surface px-4 py-3 text-sm" role="alert">
          {dataError}{" "}
          <button type="button" onClick={() => void refreshAll()} className="underline underline-offset-4">
            Retry
          </button>
        </div>
      ) : null}

      {/* Library summary — factual counts, no charts */}
      <dl className="mb-8 grid grid-cols-2 divide-line border-y border-line sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Prompts", value: owned.length, href: "/library" },
          { label: "Public", value: publicCount, href: "/library?visibility=public" },
          { label: "Collections", value: collections.length, href: "/collections" },
          { label: "Tags", value: tagCount, href: "/library" },
        ].map((s) => (
          <div key={s.label} className="px-1 py-3.5 sm:px-5">
            <dt className="font-mono text-[11px] text-ink-3">{s.label}</dt>
            <dd className="mt-0.5">
              <GuardedLink href={s.href} className="font-display text-[22px] font-bold tracking-[-0.01em] hover:underline">
                {dataLoading ? "–" : s.value}
              </GuardedLink>
            </dd>
          </div>
        ))}
      </dl>

      {dataLoading ? <PromptRowSkeleton rows={3} /> : null}

      {!dataLoading && owned.length === 0 && publicPrompts.length === 0 ? (
        <EmptyState
          title="Your library starts empty"
          description="Save your first prompt and it becomes a reusable template: fill variables later, copy clean text, publish when you're ready."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" onClick={() => guardedNav(() => router.push("/prompts/new"))}>
                Create your first prompt
              </Button>
              <Button onClick={() => guardedNav(() => router.push("/explore"))}>Browse Explore</Button>
            </div>
          }
        />
      ) : null}

      {!dataLoading && recentPrompts.length > 0 ? (
        <section className="mb-10" aria-labelledby="recent-heading">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 id="recent-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Recently opened
            </h2>
            <GuardedLink href="/library" className="text-[12.5px] underline underline-offset-4 hover:opacity-70">
              Open library
            </GuardedLink>
          </div>
          <div className="border-t border-ink">
            {recentPrompts.map((p) => (
              <PromptRow key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      ) : null}

      {!dataLoading && owned.length > 0 && recentPrompts.length === 0 ? (
        <section className="mb-10" aria-labelledby="library-preview-heading">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 id="library-preview-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              In your library
            </h2>
            <GuardedLink href="/library" className="text-[12.5px] underline underline-offset-4 hover:opacity-70">
              Open library
            </GuardedLink>
          </div>
          <div className="border-t border-ink">
            {owned.slice(0, 3).map((p) => (
              <PromptRow key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {collections.length > 0 ? (
          <section aria-labelledby="collections-heading">
            <h2 id="collections-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Collections
            </h2>
            <ul className="mt-3 space-y-px border-y border-line">
              {collections.slice(0, 4).map((c) => {
                const count = owned.filter((p) => p.collectionId === c.id).length;
                return (
                  <li key={c.id}>
                    <GuardedLink
                      href={`/collections/${c.id}`}
                      className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium">{c.name}</span>
                        {c.description ? <span className="block truncate text-[12.5px] text-ink-2">{c.description}</span> : null}
                      </span>
                      <span className="font-mono text-[11.5px] text-ink-3">{count} prompts</span>
                    </GuardedLink>
                  </li>
                );
              })}
            </ul>
            {collections.length > 4 ? (
              <GuardedLink href="/collections" className="mt-2 inline-block text-[12.5px] underline underline-offset-4">
                All collections
              </GuardedLink>
            ) : null}
          </section>
        ) : (
          <section aria-labelledby="collections-heading">
            <h2 id="collections-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Collections
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              Group prompts into named collections — client work, study sets, shipping checklists.{" "}
              <GuardedLink href="/collections" className="underline underline-offset-4">
                Create one
              </GuardedLink>
            </p>
          </section>
        )}

        {favoritePrompts.length > 0 ? (
          <section aria-labelledby="favorites-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="favorites-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
                Favorites
              </h2>
              <GuardedLink href="/favorites" className="text-[12.5px] underline underline-offset-4 hover:opacity-70">
                All favorites
              </GuardedLink>
            </div>
            <ul className="mt-3 border-y border-line">
              {favoritePrompts.map((p) => (
                <li key={p.id}>
                  <GuardedLink href={`/prompts/${p.id}`} className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-surface">
                    <span className="min-w-0 truncate text-[14px] font-medium">{p.title}</span>
                    <span className="shrink-0 font-mono text-[11px] text-ink-3">{formatRelativeTime(p.updatedAt)}</span>
                  </GuardedLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Explore entry point */}
      <section className="relative mt-10 overflow-hidden rounded-xs border border-ink">
        <div className="pointer-events-none absolute -right-8 -top-10 text-ink opacity-[0.14]">
          <Halftone rings={10} maxDot={3} pitch={14} className="w-[320px]" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-5 px-6 py-7">
          <div className="max-w-[46ch]">
            <h2 className="font-display text-[20px] font-bold tracking-[-0.01em]">A public library of reusable prompts</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Explore prompts other people published. Read them, copy them, or save an independent copy into your private
              library — the original never changes.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["writing", "coding", "research", "productivity"].map((t) => (
                <Tag key={t} size="sm">
                  {t}
                </Tag>
              ))}
            </div>
          </div>
          <GuardedLink
            href="/explore"
            className="inline-flex h-9 items-center gap-2 rounded-xs border border-ink bg-canvas px-4 text-sm font-medium hover:bg-surface"
          >
            Open Explore
            <ArrowRight size={14} aria-hidden />
          </GuardedLink>
        </div>
      </section>

      <p className="mt-8 font-mono text-[11px] text-ink-3">
        Signed in as {user?.email} · keyword search only · data stored in Firestore
      </p>
    </div>
  );
}
