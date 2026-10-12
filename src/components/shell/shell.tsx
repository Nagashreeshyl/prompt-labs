"use client";

import { Compass, Home, Library, Star, FolderClosed, Plus, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { DotLogo, DotMark, DotField } from "@/components/dots/dots";
import { Menu } from "@/components/ui/overlays";
import { useNavGuard, GuardedLink } from "@/lib/nav-guard";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/library", label: "My Library", icon: Library, countKey: "owned" as const },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/collections", label: "Collections", icon: FolderClosed, countKey: "collections" as const },
  { href: "/favorites", label: "Favorites", icon: Star, countKey: "favorites" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const { user, owned, collections, favorites, backendKind, signOutSafe } = useSidebarStore();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-line bg-canvas lg:flex">
      <div className="relative overflow-hidden border-b border-line px-5 pb-5 pt-6">
        <DotField size="xs" opacity={22} fade="r" className="pointer-events-none absolute inset-y-0 right-0 w-24" />
        <GuardedLink href="/home" className="relative flex items-center gap-2.5" aria-label="Prompt Labs home">
          <DotLogo size={24} />
          <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.06em]">Prompt Labs</span>
        </GuardedLink>
      </div>

      <div className="px-4 pb-3 pt-4">
        <GuardedLink
          href="/prompts/new"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-xs border border-ink bg-ink text-[13.5px] font-medium text-canvas transition-colors hover:bg-[#1a1a1a]"
        >
          <Plus size={14} aria-hidden />
          New prompt
        </GuardedLink>
        <button
          type="button"
          onClick={() => guardedNav(() => router.push("/search"))}
          className="mt-2 flex h-9 w-full items-center gap-2 rounded-xs border border-line bg-canvas px-2.5 text-left text-[13px] text-ink-3 transition-colors hover:border-ink-3"
        >
          <Search size={13} aria-hidden />
          <span className="flex-1">Search…</span>
          <span className="font-mono text-[10.5px] text-ink-3">⌘K</span>
        </button>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count =
              item.countKey === "owned"
                ? owned.length
                : item.countKey === "collections"
                  ? collections.length
                  : item.countKey === "favorites"
                    ? (mounted ? favorites.size : 0)
                    : null;
            return (
              <li key={item.href}>
                <GuardedLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-[34px] items-center gap-2.5 rounded-xs px-2.5 text-[13.5px] transition-colors ${
                    active ? "bg-ink font-medium text-canvas" : "text-ink-2 hover:bg-surface hover:text-ink"
                  }`}
                >
                  <item.icon size={14} aria-hidden strokeWidth={active ? 2 : 1.75} />
                  <span className="flex-1">{item.label}</span>
                  {count !== null && count > 0 ? (
                    <span className={`font-mono text-[11px] ${active ? "text-line" : "text-ink-3"}`}>{count}</span>
                  ) : null}
                </GuardedLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-4 py-3">
        <div className="mb-2.5 flex items-center gap-2 font-mono text-[10.5px] text-ink-3">
          <DotMark pattern="row" muted dot={1.5} gap={1.6} />
          {backendKind === "firebase" ? "Firebase backend" : "Connecting…"}
        </div>
        <Menu
          ariaLabel="Account"
          align="start"
          items={[
            { label: "Settings", onSelect: () => guardedNav(() => router.push("/settings")) },
            { label: "Export data", onSelect: () => guardedNav(() => router.push("/settings#export")) },
            { label: "Sign out", danger: true, separatorBefore: true, onSelect: () => void signOutSafe() },
          ]}
          trigger={(p) => (
            <button
              type="button"
              {...p}
              className="flex w-full items-center gap-2.5 rounded-xs px-1.5 py-2 text-left hover:bg-surface"
            >
              <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center border border-ink bg-canvas">
                <span className="font-display text-[13px] font-bold">{(user?.displayName ?? "?").charAt(0).toUpperCase()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{user?.displayName}</span>
                <span className="block truncate font-mono text-[11px] text-ink-3">@{user?.handle}</span>
              </span>
            </button>
          )}
        />
      </div>
    </aside>
  );
}

function useSidebarStore() {
  const store = useStore();
  const router = useRouter();
  const { toast, reportError } = store;
  const signOutSafe = async () => {
    try {
      await store.backend?.signOut();
      toast("Signed out");
      router.replace("/sign-in");
    } catch (err) {
      reportError(err);
    }
  };
  return { user: store.user, owned: store.owned, collections: store.collections, favorites: store.favorites, backendKind: store.backendKind, signOutSafe };
}

/* ── Mobile top bar + bottom nav ────────────────────────────────── */

export function MobileTopBar() {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
      <GuardedLink href="/home" className="flex items-center gap-2" aria-label="Prompt Labs home">
        <DotLogo size={20} />
        <span className="font-display text-[13.5px] font-extrabold uppercase tracking-[0.06em]">Prompt Labs</span>
      </GuardedLink>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Search"
          onClick={() => guardedNav(() => router.push("/search"))}
          className="flex h-9 w-9 items-center justify-center rounded-xs border border-line hover:border-ink"
        >
          <Search size={15} aria-hidden />
        </button>
        <GuardedLink
          href="/prompts/new"
          aria-label="New prompt"
          className="flex h-9 w-9 items-center justify-center rounded-xs border border-ink bg-ink text-canvas"
        >
          <Plus size={15} aria-hidden />
        </GuardedLink>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-canvas lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <GuardedLink
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10.5px] font-medium ${
              active ? "text-ink" : "text-ink-3"
            }`}
          >
            <span aria-hidden className={active ? "flex h-[3px] w-[3px] bg-ink" : ""} />
            <item.icon size={17} aria-hidden strokeWidth={active ? 2.1 : 1.7} />
            {item.label === "My Library" ? "Library" : item.label}
          </GuardedLink>
        );
      })}
    </nav>
  );
}

/* ── ⌘K handler ─────────────────────────────────────────────────── */

export function CommandKeyCapture() {
  const router = useRouter();
  const { guardedNav } = useNavGuard();
  const pathname = usePathname();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (pathname !== "/search") guardedNav(() => router.push("/search"));
        const input = document.querySelector<HTMLInputElement>("[data-search-input]");
        input?.focus();
        input?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, guardedNav, pathname]);
  return null;
}

function subscribeNoop() {
  return () => {};
}
