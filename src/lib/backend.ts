import type {
  CollectionDoc,
  ExportPayload,
  PromptDoc,
  PromptDraft,
  RecentDoc,
  SessionUser,
  UserProfile,
} from "@/lib/types";

export type BackendKind = "firebase";

export interface Backend {
  readonly kind: BackendKind;
  /** Human-readable status line for the settings/backend banner */
  readonly statusNote: string;

  signIn(email: string, password: string): Promise<SessionUser>;
  signUp(email: string, password: string, displayName: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;

  getUserProfile(uid: string): Promise<UserProfile | null>;
  updateUserProfile(uid: string, patch: Partial<Pick<UserProfile, "displayName" | "handle">>): Promise<void>;

  listOwnPrompts(uid: string): Promise<PromptDoc[]>;
  listPublicPrompts(): Promise<PromptDoc[]>;
  getPrompt(id: string): Promise<PromptDoc | null>;
  createPrompt(uid: string, draft: PromptDraft): Promise<string>;
  updatePrompt(id: string, patch: Partial<PromptDoc>): Promise<void>;
  deletePrompt(id: string): Promise<void>;

  listCollections(uid: string): Promise<CollectionDoc[]>;
  createCollection(uid: string, name: string, description: string): Promise<string>;
  updateCollection(id: string, patch: Partial<Pick<CollectionDoc, "name" | "description">>): Promise<void>;
  deleteCollection(id: string): Promise<void>;

  listFavorites(uid: string): Promise<string[]>;
  setFavorite(uid: string, promptId: string, on: boolean): Promise<void>;
  listRecents(uid: string): Promise<RecentDoc[]>;
  touchRecent(uid: string, promptId: string): Promise<void>;

  exportUserData(uid: string): Promise<ExportPayload>;
  deleteAccount(uid: string): Promise<void>;
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account exists for that email address.",
  "auth/email-already-in-use": "An account already exists for that email address.",
  "auth/invalid-email": "That email address does not look valid.",
  "auth/weak-password": "Password must be at least 8 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed": "Network request failed. Check your connection and retry.",
  "auth/configuration-not-found": "Email/password sign-in is not enabled in the Firebase console yet.",
  "auth/requires-recent-login": "For security, sign in again before completing this action.",
  permission_denied: "The server denied this request. Check that you are signed in and own this data.",
};

export function friendlyError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const anyErr = err as { code?: string; message?: string };
  const code = anyErr?.code ?? "unknown";
  const message =
    AUTH_MESSAGES[code] ??
    (anyErr?.message ? anyErr.message.replace(/^Firebase:\s*/i, "").slice(0, 160) : "Something went wrong.");
  return new AppError(message, code);
}

let backendPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = resolveBackend();
  }
  return backendPromise;
}

async function resolveBackend(): Promise<Backend> {
  const { isFirebaseConfigured } = await import("@/lib/firebase");
  if (!isFirebaseConfigured) {
    throw new AppError(
      "Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.",
      "backend/not-configured",
    );
  }
  const { firebaseBackend } = await import("@/lib/adapters/firebase-adapter");
  return firebaseBackend;
}
