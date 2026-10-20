"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getBackend, friendlyError, type Backend, type BackendKind } from "@/lib/backend";
import type {
  CollectionDoc,
  ExportPayload,
  PromptDoc,
  PromptDraft,
  RecentDoc,
  SessionUser,
} from "@/lib/types";

export interface Toast {
  id: number;
  message: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}

interface StoreValue {
  backend: Backend | null;
  backendKind: BackendKind | "loading";
  backendNote: string;
  user: SessionUser | null;
  authReady: boolean;

  owned: PromptDoc[];
  publicPrompts: PromptDoc[];
  collections: CollectionDoc[];
  favorites: Set<string>;
  recents: RecentDoc[];
  dataLoading: boolean;
  dataError: string | null;

  refreshAll: () => Promise<void>;
  refreshOwned: () => Promise<void>;
  refreshPublic: () => Promise<void>;

  signInWithGoogle: () => Promise<SessionUser>;

  savePrompt: (draft: PromptDraft, id?: string) => Promise<string>;
  deletePrompt: (id: string) => Promise<void>;
  setVisibility: (id: string, visibility: "private" | "public") => Promise<void>;
  toggleFavorite: (id: string) => Promise<boolean>;
  touchRecent: (id: string) => Promise<void>;
  saveACopy: (source: PromptDoc) => Promise<string>;

  createCollection: (name: string, description: string) => Promise<string>;
  renameCollection: (id: string, name: string, description: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  setPromptCollection: (promptId: string, collectionId: string | null) => Promise<void>;

  exportData: () => Promise<ExportPayload>;
  deleteAccount: () => Promise<void>;
  updateProfile: (patch: { displayName?: string; handle?: string }) => Promise<void>;

  toasts: Toast[];
  toast: (message: string, opts?: { detail?: string; action?: Toast["action"]; duration?: number }) => void;
  dismissToast: (id: number) => void;
  reportError: (err: unknown, fallback?: string) => void;

  dirtyCount: number;
  markDirty: (id: string, dirty: boolean) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [owned, setOwned] = useState<PromptDoc[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<PromptDoc[]>([]);
  const [collections, setCollections] = useState<CollectionDoc[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recents, setRecents] = useState<RecentDoc[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);
  const [dirtySet, setDirtySet] = useState<Set<string>>(new Set());

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback<StoreValue["toast"]>((message, opts) => {
    const id = toastId.current++;
    const duration = opts?.duration ?? (opts?.action ? 8000 : 4200);
    setToasts((t) => [...t.slice(-3), { id, message, detail: opts?.detail, action: opts?.action }]);
    window.setTimeout(() => dismissToast(id), duration);
  }, [dismissToast]);

  const reportError = useCallback(
    (err: unknown, fallback = "Something went wrong.") => {
      const e = friendlyError(err);
      toast(e.message || fallback, { detail: e.code !== "unknown" ? undefined : undefined });
    },
    [toast],
  );

  // ── Boot backend + auth listener ────────────────────────────────────
  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      try {
        const b = await getBackend();
        if (cancelled) return;
        setBackend(b);
        unsub = b.onAuthChange((u) => {
          setUser(u);
          setAuthReady(true);
        });
        // Fallback in case the adapter never calls back
        window.setTimeout(() => setAuthReady(true), 2500);
      } catch (err) {
        if (!cancelled) {
          setDataError(friendlyError(err).message);
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const loadOwned = useCallback(
    async (b: Backend, uid: string) => {
      const [p, c, f, r] = await Promise.all([
        b.listOwnPrompts(uid),
        b.listCollections(uid),
        b.listFavorites(uid),
        b.listRecents(uid),
      ]);
      setOwned(p);
      setCollections(c);
      setFavorites(new Set(f));
      setRecents(r);
    },
    [],
  );

  const refreshAll = useCallback(async () => {
    if (!backend || !user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      await Promise.all([loadOwned(backend, user.uid), backend.listPublicPrompts().then(setPublicPrompts)]);
    } catch (err) {
      setDataError(friendlyError(err).message);
    } finally {
      setDataLoading(false);
    }
  }, [backend, user, loadOwned]);

  const refreshOwned = useCallback(async () => {
    if (!backend || !user) return;
    try {
      await loadOwned(backend, user.uid);
    } catch (err) {
      setDataError(friendlyError(err).message);
    }
  }, [backend, user, loadOwned]);

  const refreshPublic = useCallback(async () => {
    if (!backend) return;
    try {
      setPublicPrompts(await backend.listPublicPrompts());
    } catch (err) {
      setDataError(friendlyError(err).message);
    }
  }, [backend]);

  // Sync store state when the session changes. Data fetching kicks off here by design.
  useEffect(() => {
    if (backend && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshAll();
    } else {
      setOwned([]);
      setCollections([]);
      setFavorites(new Set());
      setRecents([]);
      setPublicPrompts([]);
    }
  }, [backend, user, refreshAll]);

  const requireAuth = useCallback((): SessionUser => {
    if (!user) throw new Error("You must be signed in.");
    return user;
  }, [user]);

  const signInWithGoogle = useCallback<StoreValue["signInWithGoogle"]>(async () => {
    if (!backend) throw new Error("Backend not ready");
    return backend.signInWithGoogle();
  }, [backend]);

  const savePrompt = useCallback<StoreValue["savePrompt"]>(
    async (draft, id) => {
      if (!backend) throw new Error("Backend not ready");
      const u = requireAuth();
      if (id) {
        await backend.updatePrompt(id, { ...draft });
        await refreshOwned();
        return id;
      }
      const newId = await backend.createPrompt(u.uid, draft);
      await refreshOwned();
      return newId;
    },
    [backend, requireAuth, refreshOwned],
  );

  const deletePrompt = useCallback<StoreValue["deletePrompt"]>(
    async (id) => {
      if (!backend) throw new Error("Backend not ready");
      requireAuth();
      await backend.deletePrompt(id);
      await refreshOwned();
    },
    [backend, requireAuth, refreshOwned],
  );

  const setVisibility = useCallback<StoreValue["setVisibility"]>(
    async (id, visibility) => {
      if (!backend) throw new Error("Backend not ready");
      requireAuth();
      await backend.updatePrompt(id, { visibility });
      await Promise.all([refreshOwned(), refreshPublic()]);
    },
    [backend, requireAuth, refreshOwned, refreshPublic],
  );

  const toggleFavorite = useCallback<StoreValue["toggleFavorite"]>(
    async (id) => {
      if (!backend) throw new Error("Backend not ready");
      const u = requireAuth();
      const on = !favorites.has(id);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
      try {
        await backend.setFavorite(u.uid, id, on);
      } catch (err) {
        setFavorites((prev) => {
          const next = new Set(prev);
          if (on) next.delete(id);
          else next.add(id);
          return next;
        });
        throw err;
      }
      return on;
    },
    [backend, favorites, requireAuth],
  );

  const touchRecent = useCallback<StoreValue["touchRecent"]>(
    async (id) => {
      if (!backend || !user) return;
      try {
        await backend.touchRecent(user.uid, id);
        setRecents(await backend.listRecents(user.uid));
      } catch {
        /* recents are best-effort */
      }
    },
    [backend, user],
  );

  const saveACopy = useCallback<StoreValue["saveACopy"]>(
    async (source) => {
      if (!backend) throw new Error("Backend not ready");
      const u = requireAuth();
      const now = Date.now();
      const draft: PromptDraft = {
        title: source.title,
        description: source.description,
        content: source.content,
        category: source.category,
        tags: [...source.tags],
        variables: source.variables.map((v) => ({ ...v })),
        visibility: "private",
        collectionId: null,
      };
      const id = await backend.createPrompt(u.uid, draft);
      await backend.updatePrompt(id, {
        sourcePromptId: source.id,
        sourceAttribution: `${source.ownerName} (@${source.ownerHandle})`,
        updatedAt: now,
      });
      await refreshOwned();
      return id;
    },
    [backend, requireAuth, refreshOwned],
  );

  const createCollection = useCallback<StoreValue["createCollection"]>(
    async (name, description) => {
      if (!backend) throw new Error("Backend not ready");
      const u = requireAuth();
      const id = await backend.createCollection(u.uid, name, description);
      await refreshOwned();
      return id;
    },
    [backend, requireAuth, refreshOwned],
  );

  const renameCollection = useCallback<StoreValue["renameCollection"]>(
    async (id, name, description) => {
      if (!backend) throw new Error("Backend not ready");
      requireAuth();
      await backend.updateCollection(id, { name, description });
      await refreshOwned();
    },
    [backend, requireAuth, refreshOwned],
  );

  const setPromptCollection = useCallback<StoreValue["setPromptCollection"]>(
    async (promptId, collectionId) => {
      if (!backend) throw new Error("Backend not ready");
      requireAuth();
      await backend.updatePrompt(promptId, { collectionId, updatedAt: Date.now() });
      await refreshOwned();
    },
    [backend, requireAuth, refreshOwned],
  );

  const deleteCollection = useCallback<StoreValue["deleteCollection"]>(
    async (id) => {
      if (!backend) throw new Error("Backend not ready");
      requireAuth();
      await backend.deleteCollection(id);
      await refreshOwned();
    },
    [backend, requireAuth, refreshOwned],
  );

  const exportData = useCallback<StoreValue["exportData"]>(async () => {
    if (!backend) throw new Error("Backend not ready");
    const u = requireAuth();
    return backend.exportUserData(u.uid);
  }, [backend, requireAuth]);

  const deleteAccount = useCallback<StoreValue["deleteAccount"]>(async () => {
    if (!backend) throw new Error("Backend not ready");
    const u = requireAuth();
    await backend.deleteAccount(u.uid);
    setUser(null);
  }, [backend, requireAuth]);

  const updateProfile = useCallback<StoreValue["updateProfile"]>(
    async (patch) => {
      if (!backend) throw new Error("Backend not ready");
      const u = requireAuth();
      await backend.updateUserProfile(u.uid, patch);
      setUser({ ...u, ...patch });
      await refreshOwned();
    },
    [backend, requireAuth, refreshOwned],
  );

  const markDirty = useCallback((id: string, dirty: boolean) => {
    setDirtySet((prev) => {
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      backend,
      backendKind: backend ? backend.kind : "loading",
      backendNote: backend?.statusNote ?? "",
      user,
      authReady,
      owned,
      publicPrompts,
      collections,
      favorites,
      recents,
      dataLoading,
      dataError,
      refreshAll,
      refreshOwned,
      refreshPublic,
      signInWithGoogle,
      savePrompt,
      deletePrompt,
      setVisibility,
      toggleFavorite,
      touchRecent,
      saveACopy,
      createCollection,
      renameCollection,
      deleteCollection,
      setPromptCollection,
      exportData,
      deleteAccount,
      updateProfile,
      toasts,
      toast,
      dismissToast,
      reportError,
      dirtyCount: dirtySet.size,
      markDirty,
    }),
    [
      backend,
      user,
      authReady,
      owned,
      publicPrompts,
      collections,
      favorites,
      recents,
      dataLoading,
      dataError,
      refreshAll,
      refreshOwned,
      refreshPublic,
      signInWithGoogle,
      savePrompt,
      deletePrompt,
      setVisibility,
      toggleFavorite,
      touchRecent,
      saveACopy,
      createCollection,
      renameCollection,
      deleteCollection,
      setPromptCollection,
      exportData,
      deleteAccount,
      updateProfile,
      toasts,
      toast,
      dismissToast,
      reportError,
      dirtySet,
      markDirty,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
