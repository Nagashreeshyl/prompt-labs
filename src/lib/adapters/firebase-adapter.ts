import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { AppError, friendlyError, type Backend } from "@/lib/backend";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type {
  CollectionDoc,
  ExportPayload,
  PromptDoc,
  PromptDraft,
  RecentDoc,
  SessionUser,
  UserProfile,
} from "@/lib/types";

function auth() {
  const a = getFirebaseAuth();
  if (!a) throw new AppError("Firebase is not configured.", "backend/not-configured");
  return a;
}

function db() {
  const d = getFirebaseDb();
  if (!d) throw new AppError("Firebase is not configured.", "backend/not-configured");
  return d;
}

function toProfile(uid: string, data: Record<string, unknown>, emailFallback: string | null): UserProfile {
  return {
    uid,
    email: (data.email as string) ?? emailFallback ?? "",
    displayName: (data.displayName as string) ?? "User",
    handle: (data.handle as string) ?? "user",
    createdAt: (data.createdAt as number) ?? Date.now(),
  };
}

export async function probeFirebaseReady(): Promise<boolean> {
  try {
    const a = getFirebaseAuth();
    if (!a) return false;
    await fetchSignInMethodsForEmail(a, "backend-probe@example.com");
    return true;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") return false;
    // Transient network problems: prefer trying Firebase so the real error surfaces in the UI.
    return true;
  }
}

export const firebaseBackend: Backend = {
  kind: "firebase",
  statusNote: "Firebase backend — live project prompt-labs-5aaf9.",

  async signIn(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth(), email, password);
      return await ensureProfile(cred.user);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth(), provider);
      return await ensureProfile(cred.user);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async signUp(email, password, displayName) {
    try {
      const cred = await createUserWithEmailAndPassword(auth(), email, password);
      try {
        await updateProfile(cred.user, { displayName });
      } catch {
        /* profile write is non-blocking; the users doc is the source of truth */
      }
      const handle =
        displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 24) || "user";
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        handle,
        createdAt: Date.now(),
      };
      await setDoc(doc(db(), "users", profile.uid), { ...profile });
      return profile;
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async signOut() {
    try {
      await fbSignOut(auth());
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth(), email.trim());
    } catch (err) {
      throw friendlyError(err);
    }
  },

  onAuthChange(cb) {
    const a = getFirebaseAuth();
    if (!a) {
      cb(null);
      return () => {};
    }
    return onAuthStateChanged(a, (user) => {
      cb(user ? toProfile(user.uid, {}, user.email) : null);
    });
  },

  async getUserProfile(uid) {
    try {
      const snap = await getDoc(doc(db(), "users", uid));
      if (!snap.exists()) return null;
      const authUser = auth().currentUser;
      return toProfile(snap.id, snap.data(), authUser?.email ?? null);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async updateUserProfile(uid, patch) {
    try {
      await updateDoc(doc(db(), "users", uid), { ...patch });
      const authUser = auth().currentUser;
      if (authUser && patch.displayName) {
        try {
          await updateProfile(authUser, { displayName: patch.displayName });
        } catch {
          /* non-blocking */
        }
      }
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async listOwnPrompts(uid) {
    try {
      const snap = await getDocs(query(collection(db(), "prompts"), where("ownerId", "==", uid)));
      return snap.docs.map((d) => d.data() as PromptDoc).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async listPublicPrompts() {
    try {
      const snap = await getDocs(query(collection(db(), "prompts"), where("visibility", "==", "public")));
      return snap.docs.map((d) => d.data() as PromptDoc).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async getPrompt(id) {
    try {
      const snap = await getDoc(doc(db(), "prompts", id));
      return snap.exists() ? (snap.data() as PromptDoc) : null;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "permission-denied") return null;
      throw friendlyError(err);
    }
  },

  async createPrompt(uid, draft: PromptDraft) {
    try {
      const authUser = auth().currentUser;
      const profile = await this.getUserProfile(uid);
      const now = Date.now();
      const id = doc(collection(db(), "prompts")).id;
      const prompt: PromptDoc = {
        id,
        ownerId: uid,
        ownerName: profile?.displayName ?? authUser?.displayName ?? "User",
        ownerHandle: profile?.handle ?? "user",
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
      await setDoc(doc(db(), "prompts", id), prompt);
      return id;
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async updatePrompt(id, patch) {
    try {
      await updateDoc(doc(db(), "prompts", id), { ...patch, updatedAt: patch.updatedAt ?? Date.now() });
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async deletePrompt(id) {
    try {
      await deleteDoc(doc(db(), "prompts", id));
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async listCollections(uid) {
    try {
      const snap = await getDocs(query(collection(db(), "collections"), where("ownerId", "==", uid)));
      return snap.docs.map((d) => d.data() as CollectionDoc).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async createCollection(uid, name, description) {
    try {
      const id = doc(collection(db(), "collections")).id;
      const now = Date.now();
      const col: CollectionDoc = { id, ownerId: uid, name: name.trim(), description: description.trim(), createdAt: now, updatedAt: now };
      await setDoc(doc(db(), "collections", id), col);
      return id;
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async updateCollection(id, patch) {
    try {
      await updateDoc(doc(db(), "collections", id), { ...patch, updatedAt: Date.now() });
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async deleteCollection(id) {
    try {
      const batch = writeBatch(db());
      batch.delete(doc(db(), "collections", id));
      await batch.commit();
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async listFavorites(uid) {
    try {
      const snap = await getDocs(collection(db(), "users", uid, "favorites"));
      return snap.docs.map((d) => d.id);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async setFavorite(uid, promptId, on) {
    try {
      const ref = doc(db(), "users", uid, "favorites", promptId);
      if (on) await setDoc(ref, { promptId, createdAt: Date.now() });
      else await deleteDoc(ref);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async listRecents(uid) {
    try {
      const snap = await getDocs(collection(db(), "users", uid, "recents"));
      return snap.docs
        .map((d) => d.data() as RecentDoc)
        .sort((a, b) => b.accessedAt - a.accessedAt)
        .slice(0, 24);
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async touchRecent(uid, promptId) {
    try {
      const ref = doc(db(), "users", uid, "recents", promptId);
      await setDoc(ref, { promptId, accessedAt: Date.now() }, { merge: true });
      // keep the collection bounded
      const snap = await getDocs(collection(db(), "users", uid, "recents"));
      if (snap.size > 40) {
        const excess = snap.docs
          .map((d) => ({ id: d.id, data: d.data() as RecentDoc }))
          .sort((a, b) => a.data.accessedAt - b.data.accessedAt)
          .slice(0, snap.size - 24);
        const batch = writeBatch(db());
        for (const e of excess) batch.delete(doc(db(), "users", uid, "recents", e.id));
        await batch.commit();
      }
    } catch (err) {
      throw friendlyError(err);
    }
  },

  async exportUserData(uid): Promise<ExportPayload> {
    const [profile, prompts, collections, favorites, recents] = await Promise.all([
      this.getUserProfile(uid),
      this.listOwnPrompts(uid),
      this.listCollections(uid),
      this.listFavorites(uid),
      this.listRecents(uid),
    ]);
    return { exportedAt: Date.now(), profile, prompts, collections, favorites, recents };
  },

  async deleteAccount(uid) {
    try {
      const batch = writeBatch(db());
      const [promptSnap, colSnap, favSnap, recentSnap] = await Promise.all([
        getDocs(query(collection(db(), "prompts"), where("ownerId", "==", uid))),
        getDocs(query(collection(db(), "collections"), where("ownerId", "==", uid))),
        getDocs(collection(db(), "users", uid, "favorites")),
        getDocs(collection(db(), "users", uid, "recents")),
      ]);
      promptSnap.docs.forEach((d) => batch.delete(d.ref));
      colSnap.docs.forEach((d) => batch.delete(d.ref));
      favSnap.docs.forEach((d) => batch.delete(d.ref));
      recentSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db(), "users", uid));
      await batch.commit();

      const user: User | null = auth().currentUser;
      if (user) await user.delete();
    } catch (err) {
      throw friendlyError(err);
    }
  },
};

async function ensureProfile(user: User): Promise<SessionUser> {
  const ref = doc(db(), "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return toProfile(snap.id, snap.data(), user.email);
  const handle =
    (user.displayName ?? user.email?.split("@")[0] ?? "user").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") ||
    "user";
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
    handle,
    createdAt: Date.now(),
  };
  await setDoc(ref, { ...profile });
  return profile;
}
