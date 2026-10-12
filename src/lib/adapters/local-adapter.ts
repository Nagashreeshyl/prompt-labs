import { AppError, type Backend } from "@/lib/backend";
import {
  DEMO_PASSWORD,
  DEMO_PROFILE,
  SEED_COLLECTIONS,
  SEED_FAVORITES,
  SEED_OWN_PROMPTS,
  SEED_PUBLIC_PROMPTS,
  SEED_RECENTS,
} from "@/lib/seed-data";
import type {
  CollectionDoc,
  ExportPayload,
  PromptDoc,
  PromptDraft,
  RecentDoc,
  SessionUser,
  UserProfile,
} from "@/lib/types";

/**
 * Local persistence adapter. Mirrors the Firestore document shapes and the
 * async surface of the Firebase adapter so the app can run fully without a
 * configured Firebase backend. Data stays in this browser's localStorage.
 */

const K_USERS = "pl:users";
const K_SESSION = "pl:session";
const K_PROMPTS = "pl:prompts";
const K_COLLECTIONS = "pl:collections";
const K_SEEDED = "pl:seeded";
const stateKey = (uid: string) => `pl:state:${uid}`;

interface LocalUser extends UserProfile {
  password: string;
}

interface LocalState {
  favorites: string[];
  recents: RecentDoc[];
}

function delay(ms = 160) {
  return new Promise((r) => setTimeout(r, ms));
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function users(): Record<string, LocalUser> {
  return read<Record<string, LocalUser>>(K_USERS, {});
}

function prompts(): PromptDoc[] {
  return read<PromptDoc[]>(K_PROMPTS, []);
}

function collections(): CollectionDoc[] {
  return read<CollectionDoc[]>(K_COLLECTIONS, []);
}

function stateOf(uid: string): LocalState {
  return read<LocalState>(stateKey(uid), { favorites: [], recents: [] });
}

function setStateOf(uid: string, state: LocalState) {
  write(stateKey(uid), state);
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(K_SEEDED) === "v1") return;
  const u = users();
  if (!u[DEMO_PROFILE.uid]) {
    u[DEMO_PROFILE.uid] = { ...DEMO_PROFILE, password: DEMO_PASSWORD };
    write(K_USERS, u);
  }
  const existing = new Set(prompts().map((p) => p.id));
  const all = [...prompts()];
  for (const p of [...SEED_PUBLIC_PROMPTS, ...SEED_OWN_PROMPTS]) {
    if (!existing.has(p.id)) all.push(p);
  }
  write(K_PROMPTS, all);

  const cols = collections();
  const colIds = new Set(cols.map((c) => c.id));
  write(K_COLLECTIONS, [...cols, ...SEED_COLLECTIONS.filter((c) => !colIds.has(c.id))]);

  const st = stateOf(DEMO_PROFILE.uid);
  if (st.favorites.length === 0 && st.recents.length === 0) {
    setStateOf(DEMO_PROFILE.uid, { favorites: [...SEED_FAVORITES], recents: [...SEED_RECENTS] });
  }
  window.localStorage.setItem(K_SEEDED, "v1");
}

function profileOf(u: LocalUser): SessionUser {
  const profile = { ...u };
  delete (profile as Record<string, unknown>).password;
  return profile;
}

let authListener: ((user: SessionUser | null) => void) | null = null;

function currentSession(): SessionUser | null {
  const uid = read<string | null>(K_SESSION, null);
  if (!uid) return null;
  const u = users()[uid];
  return u ? profileOf(u) : null;
}

function requireUser(email: string, password: string): LocalUser {
  const list = Object.values(users());
  const found = list.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!found || found.password !== password) {
    throw new AppError("Email or password is incorrect.", "auth/invalid-credential");
  }
  return found;
}

export const localBackend: Backend = {
  kind: "local",
  statusNote: "Local demo backend — data is stored in this browser only.",

  async signIn(email, password) {
    await delay();
    ensureSeeded();
    const u = requireUser(email, password);
    write(K_SESSION, u.uid);
    const profile = profileOf(u);
    authListener?.(profile);
    return profile;
  },

  async signUp(email, password, displayName) {
    await delay();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new AppError("That email address does not look valid.", "auth/invalid-email");
    }
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters.", "auth/weak-password");
    }
    const u = users();
    if (Object.values(u).some((x) => x.email.toLowerCase() === normalized)) {
      throw new AppError("An account already exists for that email address.", "auth/email-already-in-use");
    }
    const baseHandle =
      displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 24) || "user";
    const user: LocalUser = {
      uid: newId("u"),
      email: normalized,
      displayName: displayName.trim(),
      handle: baseHandle,
      createdAt: Date.now(),
      password,
    };
    u[user.uid] = user;
    write(K_USERS, u);
    write(K_SESSION, user.uid);
    const profile = profileOf(user);
    authListener?.(profile);
    return profile;
  },

  async signOut() {
    await delay(60);
    if (typeof window !== "undefined") window.localStorage.removeItem(K_SESSION);
    authListener?.(null);
  },

  async sendPasswordReset(email) {
    await delay();
    const found = Object.values(users()).find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      throw new AppError("No account exists for that email address.", "auth/user-not-found");
    }
    // Local backend has no mail transport; the UI states this honestly.
  },

  onAuthChange(cb) {
    ensureSeeded();
    authListener = cb;
    queueMicrotask(() => cb(currentSession()));
    return () => {
      if (authListener === cb) authListener = null;
    };
  },

  async getUserProfile(uid) {
    const u = users()[uid];
    return u ? profileOf(u) : null;
  },

  async updateUserProfile(uid, patch) {
    await delay(120);
    const u = users();
    if (!u[uid]) throw new AppError("Account not found.", "auth/user-not-found");
    if (patch.displayName !== undefined) {
      if (!patch.displayName.trim()) throw new AppError("Display name cannot be empty.", "profile/invalid-name");
      u[uid].displayName = patch.displayName.trim();
    }
    if (patch.handle !== undefined) {
      const h = patch.handle.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
      if (!h) throw new AppError("Handle cannot be empty.", "profile/invalid-handle");
      u[uid].handle = h;
    }
    write(K_USERS, u);
  },

  async listOwnPrompts(uid) {
    await delay();
    return prompts()
      .filter((p) => p.ownerId === uid)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async listPublicPrompts() {
    await delay();
    return prompts()
      .filter((p) => p.visibility === "public")
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getPrompt(id) {
    await delay(100);
    return prompts().find((p) => p.id === id) ?? null;
  },

  async createPrompt(uid, draft: PromptDraft) {
    await delay(180);
    const list = users()[uid];
    if (!list) throw new AppError("You must be signed in.", "auth/unauthenticated");
    const now = Date.now();
    const prompt: PromptDoc = {
      id: newId("p"),
      ownerId: uid,
      ownerName: list.displayName,
      ownerHandle: list.handle,
      title: draft.title.trim(),
      description: draft.description.trim(),
      content: draft.content,
      category: draft.category,
      tags: draft.tags,
      variables: draft.variables,
      visibility: draft.visibility,
      collectionId: draft.collectionId,
      sourcePromptId: null,
      sourceAttribution: null,
      createdAt: now,
      updatedAt: now,
    };
    write(K_PROMPTS, [prompt, ...prompts()]);
    return prompt.id;
  },

  async updatePrompt(id, patch) {
    await delay(160);
    const list = prompts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new AppError("This prompt no longer exists.", "data/not-found");
    list[idx] = { ...list[idx], ...patch, id, updatedAt: patch.updatedAt ?? Date.now() };
    write(K_PROMPTS, list);
  },

  async deletePrompt(id) {
    await delay(140);
    write(
      K_PROMPTS,
      prompts().filter((p) => p.id !== id),
    );
    for (const uid of Object.keys(users())) {
      const st = stateOf(uid);
      const favorites = st.favorites.filter((f) => f !== id);
      const recents = st.recents.filter((r) => r.promptId !== id);
      if (favorites.length !== st.favorites.length || recents.length !== st.recents.length) {
        setStateOf(uid, { favorites, recents });
      }
    }
  },

  async listCollections(uid) {
    await delay();
    return collections()
      .filter((c) => c.ownerId === uid)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async createCollection(uid, name, description) {
    await delay(150);
    const now = Date.now();
    const col: CollectionDoc = { id: newId("col"), ownerId: uid, name: name.trim(), description: description.trim(), createdAt: now, updatedAt: now };
    write(K_COLLECTIONS, [col, ...collections()]);
    return col.id;
  },

  async updateCollection(id, patch) {
    await delay(120);
    const cols = collections();
    const idx = cols.findIndex((c) => c.id === id);
    if (idx === -1) throw new AppError("This collection no longer exists.", "data/not-found");
    cols[idx] = { ...cols[idx], ...patch, updatedAt: Date.now() };
    write(K_COLLECTIONS, cols);
  },

  async deleteCollection(id) {
    await delay(130);
    write(
      K_COLLECTIONS,
      collections().filter((c) => c.id !== id),
    );
    write(
      K_PROMPTS,
      prompts().map((p) => (p.collectionId === id ? { ...p, collectionId: null } : p)),
    );
  },

  async listFavorites(uid) {
    await delay(80);
    return stateOf(uid).favorites;
  },

  async setFavorite(uid, promptId, on) {
    await delay(90);
    const st = stateOf(uid);
    const set = new Set(st.favorites);
    if (on) set.add(promptId);
    else set.delete(promptId);
    setStateOf(uid, { favorites: [...set], recents: st.recents });
  },

  async listRecents(uid) {
    await delay(80);
    return stateOf(uid).recents;
  },

  async touchRecent(uid, promptId) {
    const st = stateOf(uid);
    const rest = st.recents.filter((r) => r.promptId !== promptId);
    setStateOf(uid, { favorites: st.favorites, recents: [{ promptId, accessedAt: Date.now() }, ...rest].slice(0, 24) });
  },

  async exportUserData(uid): Promise<ExportPayload> {
    await delay(220);
    const profile = await this.getUserProfile(uid);
    const st = stateOf(uid);
    return {
      exportedAt: Date.now(),
      profile,
      prompts: prompts().filter((p) => p.ownerId === uid),
      collections: collections().filter((c) => c.ownerId === uid),
      favorites: st.favorites,
      recents: st.recents,
    };
  },

  async deleteAccount(uid) {
    await delay(300);
    write(
      K_PROMPTS,
      prompts().filter((p) => p.ownerId !== uid),
    );
    write(
      K_COLLECTIONS,
      collections().filter((c) => c.ownerId !== uid),
    );
    const u = users();
    delete u[uid];
    write(K_USERS, u);
    if (typeof window !== "undefined") window.localStorage.removeItem(stateKey(uid));
    if (read<string | null>(K_SESSION, null) === uid) {
      if (typeof window !== "undefined") window.localStorage.removeItem(K_SESSION);
      authListener?.(null);
    }
  },
};
