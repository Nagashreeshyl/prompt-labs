"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2, UserPlus } from "lucide-react";
import { AppLoading } from "@/components/app-loading";
import { CopyButton, FavoriteButton, PromptContentWithChips, PublishControl } from "@/components/prompt/parts";
import { toDraft } from "@/components/prompt/prompt-row";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlays";
import { CategoryMarker, EmptyState, ErrorPanel, Tag, VisibilityMarker } from "@/components/ui/primitives";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { getBackend } from "@/lib/backend";
import { useNavGuard, GuardedLink } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { owned, publicPrompts, collections, user, deletePrompt, saveACopy, savePrompt, toast, reportError, touchRecent } = useStore();
  const [fetched, setFetched] = useState<{ id: string; doc: PromptDoc | null } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const local = owned.find((p) => p.id === id) ?? publicPrompts.find((p) => p.id === id);
  const prompt = local ?? (fetched?.id === id ? fetched.doc : undefined);

  useEffect(() => {
    if (local) return;
    let cancelled = false;
    (async () => {
      try {
        const b = await getBackend();
        const doc = await b.getPrompt(id);
        if (cancelled) return;
        setFetched({ id, doc });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this prompt.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, local]);

  useEffect(() => {
    if (prompt) void touchRecent(prompt.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.id]);

  if (error) {
    return (
      <div className="pt-6">
        <ErrorPanel message={error} onRetry={() => router.refresh()} />
      </div>
    );
  }
  if (prompt === undefined) return <AppLoading label="Loading prompt" />;
  if (prompt === null) {
    return (
      <div className="pt-6">
        <EmptyState
          title="Prompt not found"
          description="This prompt may have been deleted, or it is private and you don't have access. If someone shared a link to a private prompt, ask the owner to publish it."
          action={
            <Button variant="primary" onClick={() => router.push("/library")}>
              Back to library
            </Button>
          }
        />
      </div>
    );
  }

  const isOwner = user?.uid === prompt.ownerId;
  const collection = prompt.collectionId ? collections.find((c) => c.id === prompt.collectionId) ?? null : null;

  return (
    <article className="anim-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/library"
          onClick={(e) => {
            e.preventDefault();
            guardedNav(() => router.push(isOwner ? "/library" : "/explore"));
          }}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft size={13} aria-hidden />
          {isOwner ? "My Library" : "Explore"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={prompt.content} variant="button" label="Copy prompt" />
          <Button
            variant="primary"
            onClick={() => guardedNav(() => router.push(`/prompts/${prompt.id}/fill`))}
            disabled={false}
          >
            Fill variables
          </Button>
          <FavoriteButton promptId={prompt.id} />
          {isOwner ? (
            <>
              <Button
                onClick={() => guardedNav(() => router.push(`/prompts/${prompt.id}/edit`))}
                icon={<Pencil size={13} aria-hidden />}
              >
                Edit
              </Button>
              <PublishControl prompt={prompt} />
              <Button variant="danger" onClick={() => setDeleteOpen(true)} aria-label="Delete prompt">
                <Trash2 size={13} aria-hidden />
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              loading={busy}
              icon={<UserPlus size={13} aria-hidden />}
              onClick={async () => {
                setBusy(true);
                try {
                  const newId = await saveACopy(prompt);
                  toast("Copy saved to your library", {
                    detail: "Private by default. Editing it never changes the original.",
                    action: { label: "Open copy", onClick: () => router.push(`/prompts/${newId}`) },
                  });
                } catch (err) {
                  reportError(err);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save a copy
            </Button>
          )}
        </div>
      </div>

      <header className="border-b border-ink pb-5">
        <h1 className="max-w-[24ch] font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[38px]">{prompt.title}</h1>
        {prompt.description ? <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-ink-2">{prompt.description}</p> : null}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <CategoryMarker category={prompt.category} />
          {prompt.tags.map((t) => (
            <Tag key={t} size="sm">
              {t}
            </Tag>
          ))}
          <VisibilityMarker visibility={prompt.visibility} />
          {isOwner && collection ? (
            <GuardedLink href={`/collections/${collection.id}`} className="font-mono text-[12px] text-ink-2 underline-offset-4 hover:underline">
              in {collection.name}
            </GuardedLink>
          ) : null}
          <span className="font-mono text-[12px] text-ink-3">
            {prompt.ownerName} · @{prompt.ownerHandle} · updated {formatRelativeTime(prompt.updatedAt)}
          </span>
        </div>
      </header>

      {prompt.sourceAttribution ? (
        <p className="mt-4 border border-line bg-surface px-4 py-2.5 font-mono text-[12px] text-ink-2">
          Saved as an independent copy of a prompt by {prompt.sourceAttribution}. Editing this copy never changes the original.
        </p>
      ) : null}

      <section aria-label="Prompt content" className="mt-6">
        <div className="rounded-xs border border-line bg-canvas px-5 py-6 sm:px-8 sm:py-8">
          <PromptContentWithChips content={prompt.content} className="font-mono text-[14px]" />
        </div>
      </section>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="font-mono text-[11.5px] text-ink-3">
          Created {formatDate(prompt.createdAt)} · Updated {formatDate(prompt.updatedAt)}
        </span>
        <div className="flex items-center gap-2">
          <CopyButton text={prompt.content} variant="button" label="Copy prompt" />
          {isOwner ? (
            <Button
              onClick={async () => {
                try {
                  const newId = await savePrompt({ ...toDraft(prompt), visibility: "private", collectionId: null });
                  toast("Duplicated to your library", {
                    action: { label: "Open copy", onClick: () => router.push(`/prompts/${newId}`) },
                  });
                } catch (err) {
                  reportError(err);
                }
              }}
            >
              Duplicate
            </Button>
          ) : null}
        </div>
      </footer>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={busy}
        title="Delete this prompt?"
        confirmLabel="Delete"
        description={
          <>
            “{prompt.title}” will be removed permanently. Copies other people saved stay with them.
          </>
        }
        onConfirm={async () => {
          setBusy(true);
          try {
            await deletePrompt(prompt.id);
            toast("Prompt deleted");
            guardedNav(() => router.push("/library"));
          } catch (err) {
            reportError(err);
          } finally {
            setBusy(false);
          }
        }}
      />
    </article>
  );
}
