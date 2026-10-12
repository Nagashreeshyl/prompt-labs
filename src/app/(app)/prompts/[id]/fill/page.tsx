"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, RotateCcw } from "lucide-react";
import { AppLoading } from "@/components/app-loading";
import { CopyButton, PromptContentWithChips } from "@/components/prompt/parts";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ErrorPanel, Tag } from "@/components/ui/primitives";
import { copyText } from "@/lib/clipboard";
import { getBackend } from "@/lib/backend";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";
import { humanizeVariable, mergeVariableDefs, substitute } from "@/lib/variables";

export default function FillVariablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { owned, publicPrompts, touchRecent, toast } = useStore();
  const [fetched, setFetched] = useState<{ id: string; doc: PromptDoc | null } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const firstMissingRef = useRef<HTMLInputElement>(null);

  const local = owned.find((p) => p.id === id) ?? publicPrompts.find((p) => p.id === id);
  const prompt = local ?? (fetched?.id === id ? fetched.doc : undefined);

  useEffect(() => {
    if (local) return;
    let cancelled = false;
    (async () => {
      try {
        const b = await getBackend();
        const doc = await b.getPrompt(id);
        if (!cancelled) setFetched({ id, doc });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this prompt.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, local]);

  const defs = useMemo(() => (prompt ? mergeVariableDefs(prompt.content, prompt.variables) : []), [prompt]);

  const [valuesForId, setValuesForId] = useState<string | null>(null);
  if (prompt && valuesForId !== prompt.id) {
    setValuesForId(prompt.id);
    const initial: Record<string, string> = {};
    for (const d of mergeVariableDefs(prompt.content, prompt.variables)) {
      initial[d.name] = d.defaultValue ?? "";
    }
    setValues(initial);
  }

  useEffect(() => {
    if (prompt) void touchRecent(prompt.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt?.id]);

  const preview = useMemo(() => (prompt ? substitute(prompt.content, values) : { text: "", missing: [] }), [prompt, values]);
  const isOwner = useStoreOwner(prompt);

  if (error) {
    return (
      <div className="pt-6">
        <ErrorPanel message={error} onRetry={() => router.refresh()} />
      </div>
    );
  }
  if (prompt === undefined) return <AppLoading label="Loading workspace" />;
  if (prompt === null) {
    return (
      <div className="pt-6">
        <ErrorPanel title="Prompt not found" message="This prompt may have been deleted or is private." onRetry={() => router.push("/library")} />
      </div>
    );
  }

  async function copyCompleted() {
    if (preview.missing.length > 0) {
      setShowMissing(true);
      toast("Fill every variable before copying", {
        detail: `Missing: ${preview.missing.map((m) => `{{${m}}}`).join(", ")}`,
        duration: 6000,
      });
      firstMissingRef.current?.focus();
      return;
    }
    const result = await copyText(preview.text);
    if (result === "failed") {
      toast("Could not access the clipboard.", { detail: "Use the preview selection and copy manually." });
      return;
    }
    setCopied(true);
    toast("Completed prompt copied", { detail: "Your saved template is unchanged." });
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="anim-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/prompts/${prompt.id}`}
          onClick={(e) => {
            e.preventDefault();
            router.push(`/prompts/${prompt.id}`);
          }}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft size={13} aria-hidden />
          Back to template
        </Link>
        <span className="font-mono text-[11.5px] text-ink-3">Filling never modifies the saved prompt</span>
      </div>

      <header className="border-b border-ink pb-5">
        <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">{prompt.title}</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-ink-2">
          Fill the {defs.length} variable{defs.length === 1 ? "" : "s"} below. The preview updates as you type — copy only when every slot is filled.
        </p>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.2fr)]">
        {/* Variable form */}
        <section aria-labelledby="vars-heading">
          <h2 id="vars-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
            Variables
          </h2>
          {defs.length === 0 ? (
            <div className="mt-4 border border-line px-4 py-6 text-center">
              <p className="text-sm text-ink-2">
                This prompt has no variables. You can still copy it as-is, or edit it to add{" "}
                <span className="font-mono text-ink">{"{{placeholders}}"}</span>.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <CopyButton text={prompt.content} variant="button" label="Copy prompt" />
                {isOwner ? (
                  <Button onClick={() => router.push(`/prompts/${prompt.id}/edit`)}>Edit to add variables</Button>
                ) : null}
              </div>
            </div>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void copyCompleted();
              }}
            >
              {defs.map((d, i) => {
                const missing = showMissing && !values[d.name]?.trim();
                return (
                  <div key={d.name}>
                    <Label htmlFor={`var-${d.name}`} hint={`{{${d.name}}}`}>
                      {d.label || humanizeVariable(d.name)}
                    </Label>
                    {d.description ? <p className="-mt-0.5 mb-1.5 text-[12.5px] text-ink-2">{d.description}</p> : null}
                    <Input
                      id={`var-${d.name}`}
                      ref={i === 0 ? firstMissingRef : undefined}
                      value={values[d.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [d.name]: e.target.value }))}
                      error={missing ? "This variable is required before copying." : undefined}
                      placeholder={d.defaultValue || `Value for ${d.name}`}
                      inputSize="lg"
                    />
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" variant="primary" icon={copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}>
                  {copied ? "Copied" : "Copy completed prompt"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    for (const d of defs) reset[d.name] = d.defaultValue ?? "";
                    setValues(reset);
                    setShowMissing(false);
                    toast("Values reset to defaults");
                  }}
                  icon={<RotateCcw size={13} aria-hidden />}
                >
                  Reset values
                </Button>
              </div>
              {preview.missing.length > 0 ? (
                <p className="font-mono text-[11.5px] text-ink-3" role="status">
                  {preview.missing.length} variable{preview.missing.length === 1 ? "" : "s"} still empty ·{" "}
                  {defs.length - preview.missing.length}/{defs.length} filled
                </p>
              ) : (
                <p className="font-mono text-[11.5px] text-ink-3" role="status">
                  All {defs.length} variables filled · ready to copy
                </p>
              )}
            </form>
          )}

          <div className="mt-8 border-t border-line pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">Template tags</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {prompt.tags.length > 0 ? (
                prompt.tags.map((t) => (
                  <Tag key={t} size="sm">
                    {t}
                  </Tag>
                ))
              ) : (
                <span className="text-[12.5px] text-ink-2">No tags</span>
              )}
            </div>
          </div>
        </section>

        {/* Live preview */}
        <section aria-labelledby="preview-heading" className="lg:sticky lg:top-8 lg:self-start">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="preview-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Preview
            </h2>
            <span className="font-mono text-[11px] text-ink-3">{preview.text.length} chars</span>
          </div>
          <div className="rounded-xs border border-ink bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="font-mono text-[11px] text-ink-2">completed output</span>
              <CopyButton text={preview.text} size="sm" label="Copy completed prompt" />
            </div>
            <div className="max-h-[62vh] overflow-y-auto bg-canvas px-5 py-5 sm:px-6">
              {defs.length === 0 ? (
                <div className="prompt-prose font-mono text-[13.5px]">{prompt.content}</div>
              ) : (
                <div className="prompt-prose font-mono text-[13.5px]">
                  {preview.text.split("\n").map((line, li) => {
                    const parts = line.split(/(\{\{[a-zA-Z][a-zA-Z0-9_]*\}\})/g);
                    return (
                      <span key={li}>
                        {parts.map((part, pi) => {
                          const m = part.match(/^\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}$/);
                          if (!m) return <span key={pi}>{part}</span>;
                          const name = m[1];
                          const filled = values[name]?.trim();
                          return (
                            <span
                              key={pi}
                              className={
                                filled
                                  ? "bg-ink px-[3px] py-px text-canvas"
                                  : "border border-dashed border-ink px-[3px] py-px text-ink-2"
                              }
                            >
                              {filled || `{{${name}}}`}
                            </span>
                          );
                        })}
                        {"\n"}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-snug text-ink-2">
            Filled values render as solid blocks; empty slots stay dashed. The saved template above is never modified — close this
            screen and open the prompt to verify.
          </p>
          <div className="mt-3 rounded-xs border border-line px-4 py-3">
            <p className="mb-2 font-mono text-[11px] text-ink-3">original template (read-only)</p>
            <PromptContentWithChips content={prompt.content} className="max-h-[200px] overflow-y-auto font-mono text-[12.5px] text-ink-2" />
          </div>
        </section>
      </div>
    </div>
  );
}

function useStoreOwner(prompt: PromptDoc | null | undefined) {
  const { user } = useStore();
  if (!prompt) return false;
  return user?.uid === prompt.ownerId;
}
