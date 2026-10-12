"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton, FavoriteButton } from "@/components/prompt/parts";
import { Menu, type MenuItem } from "@/components/ui/overlays";
import { CategoryMarker, Tag, VisibilityMarker } from "@/components/ui/primitives";
import { formatRelativeTime, previewText } from "@/lib/format";
import { useNavGuard } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

/** Grid card for the library grid view — content-led, no icon chrome. */
export function PromptCard({ prompt, onChanged }: { prompt: PromptDoc; onChanged?: () => void }) {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { user, saveACopy, toast, reportError, touchRecent } = useStore();
  const [busy, setBusy] = useState(false);
  const isOwner = user?.uid === prompt.ownerId;

  function open() {
    void touchRecent(prompt.id);
    guardedNav(() => router.push(`/prompts/${prompt.id}`));
  }

  const items: MenuItem[] = [
    { label: "Open prompt", onSelect: open },
    { label: "Fill variables", onSelect: () => guardedNav(() => router.push(`/prompts/${prompt.id}/fill`)) },
    ...(isOwner ? [{ label: "Edit", onSelect: () => guardedNav(() => router.push(`/prompts/${prompt.id}/edit`)) }] : []),
  ];

  return (
    <article className="group flex flex-col border border-line bg-canvas transition-colors hover:border-ink">
      <button type="button" onClick={open} className="flex flex-1 flex-col px-4 pb-3 pt-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug tracking-[-0.01em]">{prompt.title}</h3>
          <VisibilityMarker visibility={prompt.visibility} size="sm" />
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-snug text-ink-2">
          {prompt.description || previewText(prompt.content, 170)}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5">
        <CategoryMarker category={prompt.category} />
        {prompt.tags.slice(0, 2).map((t) => (
          <Tag key={t} size="sm">
            {t}
          </Tag>
        ))}
        {prompt.tags.length > 2 ? <span className="font-mono text-[11px] text-ink-3">+{prompt.tags.length - 2}</span> : null}
      </div>
      <div className="flex items-center justify-between border-t border-line px-2.5 py-2">
        <time className="pl-1.5 font-mono text-[11px] text-ink-3">{formatRelativeTime(prompt.updatedAt)}</time>
        <div className="flex items-center gap-1">
          <CopyButton text={prompt.content} size="sm" />
          {!isOwner ? (
            <button
              type="button"
              aria-label="Save a copy to my library"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const id = await saveACopy(prompt);
                  toast("Copy saved to your library", {
                    action: { label: "Open copy", onClick: () => router.push(`/prompts/${id}`) },
                  });
                  onChanged?.();
                } catch (err) {
                  reportError(err);
                } finally {
                  setBusy(false);
                }
              }}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-xs border border-line hover:border-ink"
            >
              <UserPlus size={14} aria-hidden />
            </button>
          ) : null}
          <FavoriteButton promptId={prompt.id} size="sm" />
          <Menu
            ariaLabel={`Actions for ${prompt.title}`}
            items={items}
            trigger={(p) => (
              <button
                type="button"
                aria-label="More actions"
                {...p}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-xs border border-line hover:border-ink"
              >
                <span aria-hidden className="flex gap-[3px]">
                  <span className="block h-[3px] w-[3px] bg-ink" />
                  <span className="block h-[3px] w-[3px] bg-ink" />
                  <span className="block h-[3px] w-[3px] bg-ink" />
                </span>
              </button>
            )}
          />
        </div>
      </div>
    </article>
  );
}
