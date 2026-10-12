"use client";

import { useMemo, useState } from "react";
import { Heart, Clock } from "lucide-react";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Halftone } from "@/components/dots/dots";
import { Button } from "@/components/ui/button";
import { Segmented, PageHeader, PromptRowSkeleton } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

export default function FavoritesPage() {
  const { owned, publicPrompts, favorites, recents, dataLoading } = useStore();
  const [tab, setTab] = useState<"favorites" | "recent">("favorites");

  const all = useMemo(() => [...owned, ...publicPrompts], [owned, publicPrompts]);

  const favoritePrompts = useMemo(
    () => [...favorites].map((id) => all.find((p) => p.id === id)).filter((p): p is PromptDoc => Boolean(p)),
    [favorites, all]
  );

  // Recent may reference deleted prompts — filter stale refs and surface the count honestly
  const recentPrompts = useMemo(
    () =>
      [...recents]
        .sort((a, b) => b.accessedAt - a.accessedAt)
        .map((r) => all.find((p) => p.id === r.promptId))
        .filter((p): p is PromptDoc => Boolean(p)),
    [recents, all]
  );
  const staleRecent = recents.length - recentPrompts.length;

  const list = tab === "favorites" ? favoritePrompts : recentPrompts;
  const loading = dataLoading && list.length === 0;

  return (
    <div className="anim-fade-in">
      <PageHeader
        title="Saved"
        meta={
          tab === "favorites"
            ? `${favoritePrompts.length} favorite${favoritePrompts.length === 1 ? "" : "s"}`
            : `${recentPrompts.length} recently opened${staleRecent > 0 ? ` · ${staleRecent} removed since` : ""}`
        }
        description={
          tab === "favorites"
            ? "Star any prompt — yours or someone else's — to keep it one click away from anywhere in the app."
            : "The prompts you opened most recently, newest first. This list clears when a prompt is deleted."
        }
        actions={
          <Segmented
            ariaLabel="Saved view"
            value={tab}
            onChange={setTab}
            options={[
              { value: "favorites", label: "Favorites" },
              { value: "recent", label: "Recently opened" },
            ]}
          />
        }
      />

      {loading ? <PromptRowSkeleton rows={4} /> : null}

      {!loading && list.length === 0 ? (
        <div className="relative overflow-hidden rounded-xs border border-line">
          <div className="pointer-events-none absolute -right-10 -top-12 text-ink opacity-[0.12]">
            <Halftone rings={10} maxDot={3} pitch={14} className="w-[320px]" />
          </div>
          <div className="relative px-6 py-14 text-center">
            {tab === "favorites" ? (
              <>
                <Heart size={20} aria-hidden className="mx-auto text-ink-3" />
                <h2 className="mt-3 font-display text-[19px] font-bold">No favorites yet</h2>
                <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-2">
                  Tap the heart on any prompt row or detail page to favorite it. Favorites include prompts from Explore — they stay
                  linked to the original, so you always see the author&apos;s latest version.
                </p>
              </>
            ) : (
              <>
                <Clock size={20} aria-hidden className="mx-auto text-ink-3" />
                <h2 className="mt-3 font-display text-[19px] font-bold">Nothing opened yet</h2>
                <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-2">
                  Prompts you open appear here, newest first. Open one from your library or Explore to start the list.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      {!loading && list.length > 0 ? (
        <div className="border-t border-ink">
          {list.map((p) => (
            <PromptRow key={p.id} prompt={p} showAuthor={!owned.some((o) => o.id === p.id)} showVisibility />
          ))}
        </div>
      ) : null}

      {!loading && staleRecent > 0 && tab === "recent" ? (
        <p className="mt-4 font-mono text-[11.5px] text-ink-3">
          {staleRecent} entr{staleRecent === 1 ? "y" : "ies"} skipped — those prompts no longer exist.
        </p>
      ) : null}

      {!loading && list.length > 0 && tab === "favorites" ? (
        <div className="mt-6 flex justify-start">
          <Button onClick={() => setTab("recent")} variant="ghost">
            View recently opened instead
          </Button>
        </div>
      ) : null}
    </div>
  );
}
