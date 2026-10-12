"use client";

import { Check, Copy, Globe, Heart, Lock, Moon, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { useStore } from "@/lib/store";
import type { PromptDoc } from "@/lib/types";
import { detectVariables } from "@/lib/variables";
import { IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlays";

/* ── Copy ───────────────────────────────────────────────────────── */

export function CopyButton({
  text,
  label = "Copy prompt",
  size = "md",
  onCopied,
  variant = "icon",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  onCopied?: () => void;
  variant?: "icon" | "button";
}) {
  const { toast } = useStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function run() {
    const result = await copyText(text);
    if (result === "failed") {
      toast("Could not access the clipboard.", {
        detail: "Select the prompt text and copy it manually (⌘C / Ctrl+C).",
        duration: 7000,
      });
      return;
    }
    setCopied(true);
    onCopied?.();
    if (result === "fallback-copied") {
      toast("Copied via fallback select.", { detail: "Clipboard API was blocked; text is selected for you." });
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={run}
        className={`inline-flex h-9 items-center gap-2 rounded-xs border border-ink px-3.5 text-sm font-medium transition-colors ${
          copied ? "bg-ink text-canvas" : "bg-canvas text-ink hover:bg-surface"
        }`}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {copied ? "Copied" : label}
      </button>
    );
  }

  return (
    <IconButton label={copied ? "Copied" : label} size={size} onClick={run}>
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
    </IconButton>
  );
}

/* ── Favorite ───────────────────────────────────────────────────── */

export function FavoriteButton({ promptId, size = "md" }: { promptId: string; size?: "sm" | "md" }) {
  const { favorites, toggleFavorite, toast, reportError } = useStore();
  const active = favorites.has(promptId);
  const [busy, setBusy] = useState(false);

  return (
    <IconButton
      label={active ? "Remove from favorites" : "Add to favorites"}
      size={size}
      active={false}
      aria-pressed={active}
      className={active ? "!border-ink" : ""}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const nowOn = await toggleFavorite(promptId);
          toast(nowOn ? "Added to favorites" : "Removed from favorites");
        } catch (err) {
          reportError(err);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heart size={14} aria-hidden fill={active ? "currentColor" : "none"} />
    </IconButton>
  );
}

/* ── Variable chip (used inside previews) ───────────────────────── */

export function VariableChip({ name }: { name: string }) {
  return (
    <span className="mx-[1px] inline-flex items-center rounded-[2px] border border-ink bg-surface px-[5px] py-px font-mono text-[0.86em] text-ink">
      {`{{${name}}}`}
    </span>
  );
}

/** Render prompt content with detected variables as chips. Pure text — no HTML injection. */
export function PromptContentWithChips({ content, className = "" }: { content: string; className?: string }) {
  const names = detectVariables(content);
  if (names.length === 0) return <div className={`prompt-prose ${className}`}>{content}</div>;
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(\\{\\{\\s*(?:${escaped.join("|")})\\s*\\}\\})`, "g");
  const parts = content.split(re);
  return (
    <div className={`prompt-prose ${className}`}>
      {parts.map((part, i) => {
        const m = part.match(/^\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}$/);
        if (m) return <VariableChip key={i} name={m[1]} />;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

/* ── Publish state control (owner) ──────────────────────────────── */

export function PublishState({ visibility }: { visibility: PromptDoc["visibility"] }) {
  const Icon = visibility === "public" ? Globe : Lock;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-ink-2">
      <Icon size={12} aria-hidden />
      {visibility === "public" ? "Public" : "Private"}
    </span>
  );
}

export function PublishDialog({
  prompt,
  open,
  onClose,
}: {
  prompt: PromptDoc;
  open: boolean;
  onClose: () => void;
}) {
  const { setVisibility, toast, reportError } = useStore();
  const [busy, setBusy] = useState(false);
  const isPublic = prompt.visibility === "public";

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      loading={busy}
      title={isPublic ? "Unpublish this prompt?" : "Publish this prompt?"}
      confirmLabel={isPublic ? "Unpublish" : "Publish"}
      description={
        isPublic ? (
          <>
            It will stop appearing in Explore and public search for other users.{" "}
            <strong className="text-ink">Copies other people already saved stay with them</strong> — unpublishing cannot delete those.
          </>
        ) : (
          <>
            Any signed-in user will be able to find this prompt in Explore, read it, copy it, and save an independent copy. Your private notes, collections, and favorites are never shared. You can unpublish at any time.
          </>
        )
      }
      onConfirm={async () => {
        setBusy(true);
        try {
          await setVisibility(prompt.id, isPublic ? "private" : "public");
          toast(isPublic ? "Prompt unpublished" : "Prompt published", {
            detail: isPublic ? "No longer listed in Explore." : "Now discoverable in Explore.",
          });
          onClose();
        } catch (err) {
          reportError(err);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function PublishControl({ prompt, size = "md" }: { prompt: PromptDoc; size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const isPublic = prompt.visibility === "public";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xs border border-ink font-medium transition-colors hover:bg-surface ${
          size === "sm" ? "h-[30px] px-2.5 text-[13px]" : "h-9 px-3.5 text-sm"
        }`}
      >
        {isPublic ? <Moon size={13} aria-hidden /> : <Upload size={13} aria-hidden />}
        {isPublic ? "Unpublish" : "Publish"}
      </button>
      <PublishDialog prompt={prompt} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
