"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlays";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const router = useRouter();
  const { user, backendKind, backendNote, owned, collections, favorites, recents, updateProfile, exportData, deleteAccount, toast, reportError } = useStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const backendLabel = backendKind === "loading" ? "Detecting…" : backendKind === "firebase" ? "Cloud (Firebase)" : "Local browser mode";

  return (
    <div className="anim-fade-in">
      <PageHeader
        title="Settings"
        description="Account details, your data, and honest notes about where this app stores things."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-8">
          {/* Profile */}
          <section aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Profile
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingProfile(true);
                try {
                  await updateProfile({ displayName: displayName.trim(), handle: handle.trim().replace(/^@/, "") });
                  toast("Profile saved");
                } catch (err) {
                  reportError(err);
                } finally {
                  setSavingProfile(false);
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="set-name">Display name</Label>
                  <Input id="set-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ada Lovelace" />
                </div>
                <div>
                  <Label htmlFor="set-handle" hint="shown on published prompts">
                    Handle
                  </Label>
                  <Input id="set-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ada" />
                </div>
              </div>
              <div>
                <Label htmlFor="set-email" hint="read-only">
                  Email
                </Label>
                <Input id="set-email" value={user?.email ?? ""} readOnly disabled />
              </div>
              <Button type="submit" variant="primary" loading={savingProfile} disabled={savingProfile}>
                Save profile
              </Button>
            </form>
          </section>

          {/* Data */}
          <section aria-labelledby="data-heading" className="border-t border-line pt-8">
            <h2 id="data-heading" className="font-display text-[17px] font-bold tracking-[-0.01em]">
              Your data
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <Stat label="Prompts" value={owned.length} />
              <Stat label="Collections" value={collections.length} />
              <Stat label="Favorites" value={favorites.size} />
              <Stat label="Recents" value={recents.length} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  setExportBusy(true);
                  try {
                    const payload = await exportData();
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `prompt-labs-export-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast("Export downloaded", { detail: "A JSON file with your prompts, collections, favorites, and recents." });
                  } catch (err) {
                    reportError(err);
                  } finally {
                    setExportBusy(false);
                  }
                }}
                icon={<Download size={14} aria-hidden />}
                loading={exportBusy}
              >
                Export everything as JSON
              </Button>
              <Button
                variant="danger"
                onClick={() => setDeleteOpen(true)}
                icon={<Trash2 size={14} aria-hidden />}
              >
                Delete account…
              </Button>
            </div>
          </section>
        </div>

        {/* Sidebar column */}
        <aside className="space-y-6">
          <section aria-labelledby="backend-heading" className="rounded-xs border border-ink bg-surface px-5 py-5">
            <h2 id="backend-heading" className="font-display text-[15px] font-bold tracking-[-0.01em]">
              Where data lives
            </h2>
            <p className="mt-2 font-mono text-[12.5px] text-ink-2">{backendLabel}</p>
            {backendNote ? <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{backendNote}</p> : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag size="sm">{backendKind === "firebase" ? "Firestore" : "localStorage"}</Tag>
              <Tag size="sm">{backendKind === "firebase" ? "live sync" : "this browser only"}</Tag>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
              {backendKind === "firebase"
                ? "Your prompts sync through your own Firebase project. Server rules keep private prompts readable only by their owner."
                : "Local mode stores everything in this browser (localStorage). Clearing site data or using another device starts you fresh — export before switching."}
            </p>
          </section>

          <section aria-labelledby="about-heading" className="rounded-xs border border-line px-5 py-5">
            <h2 id="about-heading" className="font-display text-[15px] font-bold tracking-[-0.01em]">
              About
            </h2>
            <dl className="mt-2 space-y-1.5 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">App</dt>
                <dd className="font-mono">Prompt Labs</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Version</dt>
                <dd className="font-mono">0.1.0</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Auth</dt>
                <dd className="font-mono">{user ? "signed in" : "signed out"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
              No tracking, no ads, no invented metrics. Collections are folders — prompts stay individually usable everywhere.
            </p>
            <Button
              className="mt-4"
              onClick={async () => {
                await storeSignOut();
                router.push("/sign-in");
              }}
              icon={<LogOut size={14} aria-hidden />}
            >
              Sign out
            </Button>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        loading={deleteBusy}
        title="Delete your account?"
        confirmLabel="Permanently delete account"
        requireText="DELETE"
        description={
          <>
            This deletes your profile, every prompt you own, collections, favorites, and recents. Published prompts you own are
            removed from Explore too. This cannot be undone. Export first if you want a copy.
          </>
        }
        onConfirm={async () => {
          setDeleteBusy(true);
          try {
            await deleteAccount();
            toast("Account deleted");
            router.replace("/sign-in");
          } catch (err) {
            reportError(err);
            setDeleteBusy(false);
          }
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line px-3 py-2.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-display text-[22px] font-bold leading-none tracking-[-0.02em]">{value}</dd>
    </div>
  );
}

async function storeSignOut() {
  const { getBackend } = await import("@/lib/backend");
  const b = await getBackend();
  await b.signOut();
}
