"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton, FavoriteButton, PublishDialog } from "@/components/prompt/parts";
import { Menu, ConfirmDialog, ContextMenu, type MenuItem } from "@/components/ui/overlays";
import { Select } from "@/components/ui/field";
import { CategoryMarker, Tag, VisibilityMarker } from "@/components/ui/primitives";
import { formatRelativeTime, previewText } from "@/lib/format";
import { useNavGuard } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

export function toDraft(p: PromptDoc) {
  return {
    title: p.title,
    description: p.description,
    content: p.content,
    category: p.category,
    tags: [...p.tags],
    variables: p.variables.map((v) => ({ ...v })),
    visibility: p.visibility,
    collectionId: p.collectionId,
  };
}

export function AssignCollectionDialog({
  prompt,
  open,
  onClose,
}: {
  prompt: PromptDoc | null;
  open: boolean;
  onClose: () => void;
}) {
  const { collections, savePrompt, toast, reportError } = useStore();
  const [selected, setSelected] = useState<string>(prompt?.collectionId ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <ConfirmDialog
      open={open && prompt !== null}
      onClose={onClose}
      title="Assign to collection"
      description={prompt ? `Choose where “${prompt.title}” lives. A prompt belongs to at most one collection.` : undefined}
      confirmLabel="Save"
      loading={busy}
      onConfirm={async () => {
        if (!prompt) return;
        setBusy(true);
        try {
          await savePrompt({ ...toDraft(prompt), collectionId: selected || null }, prompt.id);
          toast(selected ? "Added to collection" : "Removed from collection");
          onClose();
        } catch (err) {
          reportError(err);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Select
        aria-label="Collection"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        options={[
          { value: "", label: "No collection" },
          ...collections.map((c) => ({ value: c.id, label: c.name })),
        ]}
      />
    </ConfirmDialog>
  );
}

interface PromptRowProps {
  prompt: PromptDoc;
  onChanged?: () => void;
  showAuthor?: boolean;
  showVisibility?: boolean;
  inCollection?: boolean;
  onRemoveFromCollection?: () => void;
}

export function PromptRow({
  prompt,
  onChanged,
  showAuthor = false,
  showVisibility = true,
  inCollection = false,
  onRemoveFromCollection,
}: PromptRowProps) {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { user, deletePrompt, savePrompt, saveACopy, toast, reportError, touchRecent } = useStore();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwner = user?.uid === prompt.ownerId;
  const href = `/prompts/${prompt.id}`;

  function open() {
    void touchRecent(prompt.id);
    guardedNav(() => router.push(href));
  }

  const items: MenuItem[] = [
    { label: "Open prompt", onSelect: open },
    ...(isOwner ? [{ label: "Edit", onSelect: () => guardedNav(() => router.push(`/prompts/${prompt.id}/edit`)) }] : []),
    { label: "Fill variables", onSelect: () => guardedNav(() => router.push(`/prompts/${prompt.id}/fill`)) },
    {
      label: isOwner ? "Duplicate to library" : "Save a copy to my library",
      separatorBefore: true,
      onSelect: async () => {
        try {
          const id = isOwner
            ? await savePrompt({ ...toDraft(prompt), visibility: "private", collectionId: null })
            : await saveACopy(prompt);
          toast(isOwner ? "Duplicated to your library" : "Copy saved to your library", {
            detail: isOwner ? undefined : "Private by default. Editing it never changes the original.",
            action: { label: "Open copy", onClick: () => router.push(`/prompts/${id}`) },
          });
          onChanged?.();
        } catch (err) {
          reportError(err);
        }
      },
    },
    ...(isOwner && inCollection && onRemoveFromCollection
      ? [{ label: "Remove from this collection", separatorBefore: true, onSelect: onRemoveFromCollection }]
      : []),
    ...(isOwner
      ? [
          { label: "Assign to collection…", onSelect: () => setAssignOpen(true) },
          {
            label: prompt.visibility === "public" ? "Unpublish…" : "Publish…",
            separatorBefore: true,
            onSelect: () => setPublishOpen(true),
          },
          { label: "Delete…", danger: true, separatorBefore: true, onSelect: () => setDeleteOpen(true) },
        ]
      : []),
  ];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuPos({ x: e.clientX, y: e.clientY });
        }}
        className="group relative flex cursor-pointer flex-col gap-2 border-b border-line px-2 py-4 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:flex-row sm:items-start sm:gap-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">{prompt.title}</h3>
            {showAuthor ? <span className="font-mono text-[11.5px] text-ink-3">{prompt.ownerName} · @{prompt.ownerHandle}</span> : null}
          </div>
          {prompt.description ? (
            <p className="mt-1 line-clamp-2 max-w-[86ch] text-[13.5px] leading-snug text-ink-2">{prompt.description}</p>
          ) : (
            <p className="mt-1 max-w-[86ch] truncate font-mono text-[12.5px] text-ink-3">{previewText(prompt.content, 160)}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <CategoryMarker category={prompt.category} />
            {prompt.tags.slice(0, 4).map((t) => (
              <Tag key={t} size="sm">
                {t}
              </Tag>
            ))}
            {prompt.tags.length > 4 ? <span className="font-mono text-[11px] text-ink-3">+{prompt.tags.length - 4}</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-center gap-2.5">
            {showVisibility ? <VisibilityMarker visibility={prompt.visibility} size="sm" /> : null}
            <time dateTime={new Date(prompt.updatedAt).toISOString()} className="font-mono text-[11px] text-ink-3" title="Last updated">
              {formatRelativeTime(prompt.updatedAt)}
            </time>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} role="group" aria-label="Prompt actions">
            <CopyButton text={prompt.content} size="sm" />
            {!isOwner ? (
              <button
                type="button"
                aria-label="Save a copy to my library"
                title="Save a copy to my library"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const id = await saveACopy(prompt);
                    toast("Copy saved to your library", {
                      detail: "Private by default. Editing it never changes the original.",
                      action: { label: "Open copy", onClick: () => router.push(`/prompts/${id}`) },
                    });
                    onChanged?.();
                  } catch (err) {
                    reportError(err);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-xs border border-line bg-canvas hover:border-ink"
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
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-xs border border-line bg-canvas hover:border-ink"
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
      </div>

      {menuPos ? <ContextMenu x={menuPos.x} y={menuPos.y} items={items} onClose={() => setMenuPos(null)} /> : null}

      <AssignCollectionDialog prompt={prompt} open={assignOpen} onClose={() => setAssignOpen(false)} />
      <PublishDialog prompt={prompt} open={publishOpen} onClose={() => setPublishOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={busy}
        title="Delete this prompt?"
        confirmLabel="Delete"
        description={
          <>
            “{prompt.title}” will be removed from your library, its collection, and favorites. This cannot be undone. Copies other people saved from a published version stay with them.
          </>
        }
        onConfirm={async () => {
          setBusy(true);
          try {
            await deletePrompt(prompt.id);
            toast("Prompt deleted");
            setDeleteOpen(false);
            onChanged?.();
          } catch (err) {
            reportError(err);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
