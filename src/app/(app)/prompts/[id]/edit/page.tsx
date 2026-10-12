"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLoading } from "@/components/app-loading";
import { PromptEditor } from "@/components/prompt/prompt-editor";
import { ErrorPanel } from "@/components/ui/primitives";
import { getBackend } from "@/lib/backend";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { owned, user } = useStore();
  const [fetched, setFetched] = useState<{ id: string; doc: PromptDoc | null } | undefined>(undefined);
  const [notOwned, setNotOwned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const local = owned.find((p) => p.id === id);

  useEffect(() => {
    if (local) return;
    let cancelled = false;
    (async () => {
      try {
        const b = await getBackend();
        const doc = await b.getPrompt(id);
        if (cancelled) return;
        if (!doc) {
          setFetched({ id, doc: null });
          return;
        }
        if (user && doc.ownerId !== user.uid) {
          setFetched({ id, doc: null });
          setNotOwned(true);
          return;
        }
        setFetched({ id, doc });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this prompt.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, local, user]);

  const prompt = local ?? (fetched?.id === id ? fetched.doc : undefined);

  if (error) {
    return (
      <div className="pt-6">
        <ErrorPanel message={error} onRetry={() => router.push(`/prompts/${id}`)} />
      </div>
    );
  }
  if (prompt === undefined) return <AppLoading label="Loading prompt" />;
  if (prompt === null) {
    return (
      <div className="pt-6">
        <ErrorPanel
          title={notOwned ? "Not your prompt" : "Prompt not found"}
          message={notOwned ? "You can only edit prompts you own. Open it read-only, or save a copy to your library." : "It may have been deleted, or you may not have access to it."}
          onRetry={() => router.push("/library")}
        />
      </div>
    );
  }
  return <PromptEditor prompt={prompt} />;
}
