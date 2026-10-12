"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { CopyButton } from "@/components/prompt/parts";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/primitives";
import { countWords, formatDateTime } from "@/lib/format";
import { useLeaveGuard, useNavGuard } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";
import { CATEGORIES, MAX_TAGS, TAG_MAX_LENGTH, type PromptDoc, type PromptDraft, type VariableDef } from "@/lib/types";
import { detectVariables, humanizeVariable, mergeVariableDefs } from "@/lib/variables";

interface EditorState {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  collectionId: string;
  visibility: "private" | "public";
  variables: VariableDef[];
}

function stateFromPrompt(p: PromptDoc): EditorState {
  return {
    title: p.title,
    description: p.description,
    content: p.content,
    category: p.category,
    tags: [...p.tags],
    collectionId: p.collectionId ?? "",
    visibility: p.visibility,
    variables: mergeVariableDefs(p.content, p.variables),
  };
}

function emptyState(): EditorState {
  return {
    title: "",
    description: "",
    content: "",
    category: "Other",
    tags: [],
    collectionId: "",
    visibility: "private",
    variables: [],
  };
}

function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-").slice(0, TAG_MAX_LENGTH);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function PromptEditor({ prompt }: { prompt?: PromptDoc }) {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { collections, savePrompt, toast, reportError, markDirty, backendKind } = useStore();

  const [state, setState] = useState<EditorState>(() => (prompt ? stateFromPrompt(prompt) : emptyState()));
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(prompt ? stateFromPrompt(prompt) : emptyState()));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(prompt ? prompt.updatedAt : null);
  const [tagDraft, setTagDraft] = useState("");
  const [customCategory, setCustomCategory] = useState(() => (prompt && !CATEGORIES.includes(prompt.category as never) ? prompt.category : ""));
  const titleRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(state) !== baseline;

  useEffect(() => {
    markDirty("prompt-editor", dirty);
    return () => markDirty("prompt-editor", false);
  }, [dirty, markDirty]);

  const { dialog: leaveDialog } = useLeaveGuard(dirty);

  // Keep variables in sync with body edits; preserve existing metadata
  const syncedVariables = useMemo(() => mergeVariableDefs(state.content, state.variables), [state.content, state.variables]);

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function addTag() {
    if (!tagDraft.trim()) return;
    const next = normalizeTags([...state.tags, tagDraft]);
    patch("tags", next);
    setTagDraft("");
  }

  async function onSave(e?: React.FormEvent) {
    e?.preventDefault();
    const nextErrors: Record<string, string | undefined> = {};
    if (!state.title.trim()) nextErrors.title = "Title is required.";
    else if (state.title.trim().length > 200) nextErrors.title = "Keep the title under 200 characters.";
    if (!state.content.trim()) nextErrors.content = "Prompt body is required — this is the text you will reuse.";
    if (state.description.length > 2000) nextErrors.description = "Keep the description under 2000 characters.";
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      if (nextErrors.title) titleRef.current?.focus();
      return;
    }

    const category = customCategory.trim() ? customCategory.trim() : state.category || "Other";
    const draft: PromptDraft = {
      title: state.title.trim(),
      description: state.description.trim(),
      content: state.content,
      category,
      tags: normalizeTags(state.tags),
      variables: syncedVariables,
      visibility: state.visibility,
      collectionId: state.collectionId || null,
    };

    setSaving(true);
    try {
      const id = await savePrompt(draft, prompt?.id);
      const now = Date.now();
      setSavedAt(now);
      const saved: EditorState = { ...draft, collectionId: draft.collectionId ?? "", variables: syncedVariables, tags: draft.tags };
      setBaseline(JSON.stringify(saved));
      toast(prompt ? "Changes saved" : "Prompt saved", {
        action: { label: "Open prompt", onClick: () => router.push(`/prompts/${id}`) },
      });
      // Navigate directly — we just saved, so the unsaved-changes guard no longer applies.
      if (!prompt) router.push(`/prompts/${id}`);
    } catch (err) {
      reportError(err);
      // Unsaved text is retained; nothing is cleared on failure.
    } finally {
      setSaving(false);
    }
  }

  const wordCount = countWords(state.content);
  const detectedNames = detectVariables(state.content);

  return (
    <div>
      <form onSubmit={onSave} noValidate>
        <PageHeader
          title={prompt ? "Edit prompt" : "New prompt"}
          meta={
            saving
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : savedAt
                  ? `Saved ${formatDateTime(savedAt)}`
                  : prompt
                    ? `Created ${formatDateTime(prompt.createdAt)}`
                    : "Not saved yet"
          }
          actions={
            <>
              <Button type="button" onClick={() => guardedNav(() => router.push(prompt ? `/prompts/${prompt.id}` : "/library"))} disabled={saving}>
                Cancel
              </Button>
              {state.content.trim() ? <CopyButton text={state.content} variant="button" label="Copy body" /> : null}
              <Button type="submit" variant="primary" loading={saving} icon={<Save size={14} aria-hidden />}>
                {prompt ? "Save changes" : "Save prompt"}
              </Button>
            </>
          }
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          {/* Main writing column */}
          <div className="space-y-5">
            <div>
              <Label htmlFor="title" hint={`${state.title.length}/200`}>
                Title
              </Label>
              <Input
                id="title"
                ref={titleRef}
                value={state.title}
                onChange={(e) => patch("title", e.target.value)}
                error={errors.title}
                maxLength={220}
                placeholder="e.g. Socratic tutor for calculus"
                inputSize="lg"
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <Label htmlFor="description" hint="shown in lists and Explore">
                Description
              </Label>
              <Textarea
                id="description"
                rows={2}
                value={state.description}
                onChange={(e) => patch("description", e.target.value)}
                error={errors.description}
                placeholder="One or two sentences on what this prompt does and when to use it."
              />
              <FieldError message={errors.description} />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label htmlFor="content" className="text-[13px] font-medium text-ink">
                  Prompt body
                </label>
                <span className="font-mono text-[11px] text-ink-3">
                  {wordCount} words · {state.content.length} chars
                  {detectedNames.length > 0 ? ` · ${detectedNames.length} variable${detectedNames.length === 1 ? "" : "s"}` : ""}
                </span>
              </div>
              <Textarea
                id="content"
                mono
                rows={20}
                value={state.content}
                onChange={(e) => patch("content", e.target.value)}
                error={errors.content}
                placeholder={"Write the prompt you want to reuse.\n\nUse {{variable_name}} for anything that changes between uses:\nWrite a {{tone}} email to {{recipient}} about {{topic}}."}
                className="min-h-[380px] text-[14px]"
              />
              <FieldError message={errors.content} />
              <p className="mt-1.5 text-[12px] text-ink-3">
                Placeholders use double braces: <span className="font-mono text-ink-2">{"{{variable_name}}"}</span>. They become fill-in fields on the
                reuse screen — the template itself never changes.
              </p>
            </div>
          </div>

          {/* Metadata rail */}
          <aside className="space-y-5 lg:border-l lg:border-line lg:pl-8">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={customCategory ? "__custom" : state.category}
                onChange={(e) => {
                  if (e.target.value === "__custom") {
                    setCustomCategory((c) => c || "");
                    patch("category", "Other");
                  } else {
                    setCustomCategory("");
                    patch("category", e.target.value);
                  }
                }}
                options={[
                  ...CATEGORIES.map((c) => ({ value: c, label: c })),
                  { value: "__custom", label: "Custom…" },
                ]}
              />
              {customCategory !== "" || state.category === "Other" ? (
                <Input
                  aria-label="Custom category"
                  className="mt-2"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Custom category name"
                />
              ) : null}
            </div>

            <div>
              <Label htmlFor="tags" hint={`${state.tags.length}/${MAX_TAGS}`}>
                Tags
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id="tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag, press Enter"
                />
                <Button type="button" onClick={addTag} aria-label="Add tag" disabled={!tagDraft.trim()}>
                  <Plus size={14} aria-hidden />
                </Button>
              </div>
              {state.tags.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {state.tags.map((t) => (
                    <li key={t}>
                      <span className="inline-flex h-[26px] items-center gap-1 rounded-xs border border-line bg-canvas px-2 font-mono text-[12px] text-ink-2">
                        {t}
                        <button
                          type="button"
                          aria-label={`Remove tag ${t}`}
                          onClick={() => patch("tags", state.tags.filter((x) => x !== t))}
                          className="hover:opacity-70"
                        >
                          <X size={11} aria-hidden />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <Label htmlFor="collection">Collection</Label>
              <Select
                id="collection"
                value={state.collectionId}
                onChange={(e) => patch("collectionId", e.target.value)}
                options={[
                  { value: "", label: "No collection" },
                  ...collections.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                id="visibility"
                value={state.visibility}
                onChange={(e) => patch("visibility", e.target.value as "private" | "public")}
                options={[
                  { value: "private", label: "Private — only you" },
                  { value: "public", label: "Public — discoverable" },
                ]}
              />
              {state.visibility === "public" ? (
                <p className="mt-2 border border-ink bg-surface px-3 py-2 text-[12.5px] leading-snug">
                  Publishing makes this prompt readable by any signed-in user. They can copy it or save an independent copy.
                  Your collections and favorites stay private.
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-ink">Variables</span>
                <span className="font-mono text-[11px] text-ink-3">{syncedVariables.length} detected</span>
              </div>
              {syncedVariables.length === 0 ? (
                <p className="text-[12.5px] leading-snug text-ink-2">
                  No variables yet. Add <span className="font-mono text-ink">{"{{name}}"}</span> in the body and it appears here with optional labels and
                  defaults.
                </p>
              ) : (
                <ul className="space-y-3">
                  {syncedVariables.map((v, i) => (
                    <li key={v.name} className="border border-line px-3 py-2.5">
                      <p className="font-mono text-[12px] text-ink">{`{{${v.name}}}`}</p>
                      <Input
                        aria-label={`Label for ${v.name}`}
                        className="mt-2"
                        value={v.label ?? ""}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            variables: s.variables.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)),
                          }))
                        }
                        placeholder={`Label (default: ${humanizeVariable(v.name)})`}
                      />
                      <Input
                        aria-label={`Description for ${v.name}`}
                        className="mt-1.5"
                        value={v.description ?? ""}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            variables: s.variables.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)),
                          }))
                        }
                        placeholder="Helper text"
                      />
                      <Input
                        aria-label={`Default value for ${v.name}`}
                        mono
                        className="mt-1.5"
                        value={v.defaultValue ?? ""}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            variables: s.variables.map((x, xi) => (xi === i ? { ...x, defaultValue: e.target.value } : x)),
                          }))
                        }
                        placeholder="Default value"
                      />
                    </li>
                  ))}
                </ul>
              )}
              {backendKind === "local" ? (
                <p className="mt-3 font-mono text-[11px] leading-snug text-ink-3">
                  Local demo backend: prompts persist in this browser. Add Firebase keys and enable Email/Password to sync via
                  Firestore.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </form>
      {leaveDialog}
    </div>
  );
}
