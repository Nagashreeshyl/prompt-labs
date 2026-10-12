"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderClosed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionDialog } from "@/components/collection/collection-dialog";
import { ConfirmDialog, Menu } from "@/components/ui/overlays";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { formatRelativeTime } from "@/lib/format";
import { useNavGuard } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";

export default function CollectionsPage() {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { collections, owned, deleteCollection, toast, reportError, dataLoading } = useStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <PageHeader
        title="Collections"
        meta={`${collections.length} collection${collections.length === 1 ? "" : "s"} · private to you`}
        description="Flexible folders for your prompts. A prompt belongs to at most one collection; deleting a collection never deletes its prompts."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)} icon={<Plus size={14} aria-hidden />}>
            New collection
          </Button>
        }
      />

      {!dataLoading && collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Collections group prompts by project, client, course, or anything else you think in. Create one, then assign prompts from the library or the editor."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Create your first collection
            </Button>
          }
        />
      ) : null}

      {collections.length > 0 ? (
        <ul className="border-t border-ink">
          {collections.map((c) => {
            const count = owned.filter((p) => p.collectionId === c.id).length;
            return (
              <li key={c.id} className="flex items-center gap-3 border-b border-line px-2 py-4 hover:bg-surface">
                <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-surface">
                  <FolderClosed size={16} aria-hidden />
                </span>
                <button
                  type="button"
                  onClick={() => guardedNav(() => router.push(`/collections/${c.id}`))}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-display text-[16px] font-semibold tracking-[-0.01em]">{c.name}</span>
                  {c.description ? <span className="mt-0.5 block truncate text-[13px] text-ink-2">{c.description}</span> : null}
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-[12px] text-ink-2">{count} prompt{count === 1 ? "" : "s"}</span>
                  <span className="font-mono text-[11px] text-ink-3">{formatRelativeTime(c.updatedAt)}</span>
                </div>
                <Menu
                  ariaLabel={`Actions for ${c.name}`}
                  items={[
                    { label: "Open collection", onSelect: () => guardedNav(() => router.push(`/collections/${c.id}`)) },
                    {
                      label: "Rename…",
                      onSelect: () => setEditing({ id: c.id, name: c.name, description: c.description }),
                    },
                    { label: "Delete…", danger: true, separatorBefore: true, onSelect: () => setDeleting({ id: c.id, name: c.name }) },
                  ]}
                  trigger={(p) => (
                    <button
                      type="button"
                      aria-label={`Actions for ${c.name}`}
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
              </li>
            );
          })}
        </ul>
      ) : null}

      <CollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={(id) => guardedNav(() => router.push(`/collections/${id}`))} />
      {editing ? (
        <CollectionDialog key={editing.id} open onClose={() => setEditing(null)} initial={editing} onSaved={() => setEditing(null)} />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        loading={busy}
        title="Delete this collection?"
        confirmLabel="Delete collection"
        description={
          <>
            The prompts inside stay in your library — only the grouping is removed. This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await deleteCollection(deleting.id);
            toast(`Deleted “${deleting.name}”`);
            setDeleting(null);
          } catch (err) {
            reportError(err);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
