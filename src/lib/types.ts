export type Visibility = "private" | "public";

export interface VariableDef {
  /** Placeholder name without braces, e.g. "tone" */
  name: string;
  /** Human-readable label; falls back to a title-cased name */
  label?: string;
  /** Optional helper text shown under the input */
  description?: string;
  /** Optional default value pre-filling the fill workspace */
  defaultValue?: string;
}

export interface PromptDoc {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerHandle: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  variables: VariableDef[];
  visibility: Visibility;
  collectionId: string | null;
  /** Set when this prompt was created via Save a Copy */
  sourcePromptId?: string | null;
  sourceAttribution?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CollectionDoc {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface RecentDoc {
  promptId: string;
  accessedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  handle: string;
  createdAt: number;
}

export type SessionUser = UserProfile;

export interface PromptDraft {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  variables: VariableDef[];
  visibility: Visibility;
  collectionId: string | null;
}

export interface ExportPayload {
  exportedAt: number;
  profile: UserProfile | null;
  prompts: PromptDoc[];
  collections: CollectionDoc[];
  favorites: string[];
  recents: RecentDoc[];
}

export const CATEGORIES = [
  "Writing",
  "Coding",
  "Research",
  "Productivity",
  "Marketing",
  "Education",
  "Analysis",
  "Design",
  "Personal",
  "Other",
] as const;

export const MAX_TAGS = 20;
export const TAG_MAX_LENGTH = 32;
