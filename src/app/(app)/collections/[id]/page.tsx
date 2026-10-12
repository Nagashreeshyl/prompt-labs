"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { AppLoading } from "@/components/app-loading";
import { CollectionDialog } from "@/components/collection/collection-dialog";
import { PromptRow } from "@/components/prompt/prompt-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmDialog, Menu, Modal } from "@/components/ui/overlays";
import { EmptyState, PromptRowSkeleton } from "@/components/ui/primitives";
import { formatRelativeTime } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { collections, owned, setPromptCollection, deleteCollection, toast, reportError, dataLoading } = useStore();
  const [query, setQuery] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const collection = collections.find((c) => c.id === id);
  const prompts = useMemo(() => owned.filter((p) => p.collectionId === id), [owned, id]);
  const results = useMemo(() => prompts.filter((p) => matchesQuery(p, query)), [prompts, query]);

  // Prompts that could be added: owned prompts not currently in this collection
  const candidates = useMemo(() => owned.filter((p) => p.collectionId !== id), [owned, id]);

  useEffect(() => {
    if (!dataLoading && !collection) router.replace("/collections");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, collection]);

  if (dataLoading && !collection) return <AppLoading label="Opening collection" />;
  if (!collection) return <AppLoading label="Opening collection" />;

  return (
    <div className="anim-fade-in">
      <button
        type="button"
        onClick={() => router.push("/collections")}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft size={13} aria-hidden />
        All collections
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-5">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">{collection.name}</h1>
          {collection.description ? <p className="mt-1.5 max-w-[65ch] text-sm text-ink-2">{collection.description}</p> : null}
          <p className="mt-2 font-mono text-[12px] text-ink-3">
            {prompts.length} prompt{prompts.length === 1 ? "" : "s"} · updated {formatRelativeTime(collection.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="primary" onClick={() => setAssignOpen(true)} icon={<Plus size={14} aria-hidden />}>
            Add prompts
          </Button>
          <Menu
            ariaLabel={`Actions for ${collection.name}`}
            items={[
              { label: "Rename collection…", onSelect: () => setEditOpen(true) },
              { label: "Delete collection…", danger: true, separatorBefore: true, onSelect: () => setDeleteOpen(true) },
            ]}
            trigger={(p) => (
              <button
                type="button"
                aria-label={`Actions for ${collection.name}`}
                {...p}
                className="flex h-9 w-9 items-center justify-center rounded-xs border border-ink hover:bg-surface"
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

      {prompts.length > 3 ? (
        <div className="relative mt-5 max-w-[340px]">
          <Search size={14} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <Input
            aria-label="Search within collection"
            placeholder="Search within this collection…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      ) : null}

      <div className="mt-6">
        {prompts.length === 0 ? (
          <EmptyState
            title="This collection is empty"
            description="Add prompts from your library. Adding to a collection moves the prompt into it — a prompt belongs to at most one collection."
            action={
              <Button variant="primary" onClick={() => setAssignOpen(true)}>
                Add prompts
              </Button>
            }
          />
        ) : null}

        {prompts.length > 0 && results.length === 0 ? (
          <EmptyState title="No matches" description={`Nothing here matches “${query}”.`} action={<Button onClick={() => setQuery("")}>Clear search</Button>} />
        ) : null}

        {results.length > 0 ? (
          <div className="border-t border-ink">
            {dataLoading ? (
              <PromptRowSkeleton rows={Math.min(4, results.length)} />
            ) : (
              results.map((p) => (
                <PromptRow
                  key={p.id}
                  prompt={p}
                  showVisibility
                  inCollection
                  onRemoveFromCollection={() => {
                    void setPromptCollection(p.id, null)
                      .then(() => toast(`Removed “${p.title}” from this collection`))
                      .catch((err) => reportError(err));
                  }}
                />
              ))
            )}
          </div>
        ) : null}
      </div>

      <CollectionDialog key={collection.id} open={editOpen} onClose={() => setEditOpen(false)} initial={{ id: collection.id, name: collection.name, description: collection.description }} onSaved={() => setEditOpen(false)} />

      <AssignPromptsModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        candidates={candidates}
        existingIds={prompts.map((p) => p.id)}
        collectionName={collection.name}
        onAssign={async (promptId, mode) => {
          setBusy(true);
          try {
            if (mode === "add") {
              await setPromptCollection(promptId, collection.id);
              toast("Added to collection");
            } else {
              await setPromptCollection(promptId, null);
              toast("Removed from collection");
            }
          } catch (err) {
            reportError(err);
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={busy}
        title="Delete this collection?"
        confirmLabel="Delete collection"
        description={<>The prompts inside stay in your library — only the grouping is removed. This cannot be undone.</>}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteCollection(collection.id);
            toast(`Deleted “${collection.name}”`);
            router.push("/collections");
          } catch (err) {
            reportError(err);
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function AssignPromptsModal({
  open,
  onClose,
  candidates,
  existingIds,
  collectionName,
  onAssign,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  candidates: PromptDoc[];
  existingIds: string[];
  collectionName: string;
  onAssign: (id: string, mode: "add" | "remove") => void;
  busy: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = candidates.filter((p) => matchesQuery(p, search));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add prompts to collection"
      description={`Pick prompts from your library to move into “${collectionName}”. They remain individually editable.`}
      width={640}
      footer={
        <Button onClick={onClose} disabled={busy}>
          Done
        </Button>
      }
    >
      <div className="mb-3">
        <Input aria-label="Search your library" placeholder="Search your library…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {candidates.length === 0 && existingIds.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-2">You have no prompts yet — create one first.</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-2">No prompts match “{search}”.</p>
      ) : (
        <ul className="max-h-[46vh] divide-y divide-line overflow-y-auto border-y border-line">
          {filtered.map((p) => {
            const inThis = existingIds.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAssign(p.id, inThis ? "remove" : "add")}
                  className="flex w-full items-center gap-3 px-2 py-3 text-left hover:bg-surface"
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border ${inThis ? "border-ink bg-ink" : "border-line bg-canvas"}`}
                  >
                    {inThis ? <Check size={13} aria-hidden className="text-canvas" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="block truncate text-[12.5px] text-ink-2">{p.description}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11.5px] text-ink-3">{inThis ? "in collection" : "add"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
