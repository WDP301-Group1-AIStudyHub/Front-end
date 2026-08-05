import { apiClient, unwrapApiData } from "./apiClient";
import type { ChatScope, ChatSource } from "@/types/chat";
import type { IFlashcardItem, IMcqItem } from "./studyMaterialApi";

export type ArtifactType =
  | "FLASHCARD"
  | "QUIZ"
  | "MINDMAP"
  | "REPORT"
  | "DATA_TABLE"
  | "SUMMARY";
export type ArtifactStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export interface MindmapNode {
  label: string;
  children?: MindmapNode[];
}

export type ArtifactContent =
  | { items: IFlashcardItem[] }
  | { items: IMcqItem[] }
  | { root: MindmapNode }
  | { markdown: string }
  | { columns: string[]; rows: string[][] };

export interface ArtifactRecord {
  _id: string;
  userId: string;
  threadId?: string;
  type: ArtifactType;
  status: ArtifactStatus;
  title: string;
  instructions?: string;
  content?: ArtifactContent;
  sourceDocumentIds: string[];
  // SUMMARY-only: the document this is a summary of. Doubles as the cache key
  // that makes a second POST /documents/:id/summaries a no-charge 200 instead
  // of a fresh generation.
  summaryDocumentId?: string;
  subjectId?: string;
  scope?: string;
  sources?: ChatSource[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  // Only populated by GET /api/artifacts/:id — true if the caller owns the
  // artifact, false if they only have it via a share.
  isOwner?: boolean;
  // Only populated by POST /api/documents/:id/summaries — true when this
  // response came from the cache (200, no quota charged) rather than a fresh
  // generation (202, quota charged).
  cached?: boolean;
}

export interface InitiateArtifactPayload {
  type: ArtifactType;
  title?: string;
  instructions?: string;
  threadId?: string;
  documentId?: string;
  documentIds?: string[];
  subject?: string;
  subjectId?: string;
  scope?: ChatScope;
}

export const initiateArtifact = async (
  payload: InitiateArtifactPayload,
): Promise<ArtifactRecord> => {
  const response = await apiClient.post("/api/artifacts", payload);
  return unwrapApiData(response.data, "Failed to start artifact generation");
};

export const listArtifacts = async (
  threadId?: string,
): Promise<ArtifactRecord[]> => {
  const response = await apiClient.get("/api/artifacts", {
    params: threadId ? { threadId } : undefined,
  });
  return unwrapApiData(response.data, "Failed to fetch artifacts");
};

export const getArtifactById = async (
  id: string,
): Promise<ArtifactRecord> => {
  const response = await apiClient.get(`/api/artifacts/${id}`);
  return unwrapApiData(response.data, "Failed to fetch artifact");
};

export const deleteArtifact = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/api/artifacts/${id}`);
  unwrapApiData(response.data, "Failed to delete artifact");
};

/**
 * The only owner-gated artifact creation route (SUMMARY is intentionally
 * excluded from the generic POST /api/artifacts). Safe to call whenever the
 * caller does not yet know if a summary exists: a cache hit returns 200 and
 * never charges quota. Only a genuinely new generation (202) charges one unit
 * — the status code, not the body, is what tells them apart, so this returns
 * it alongside the record rather than unwrapping to data alone.
 */
export const createDocumentSummary = async (
  documentId: string,
): Promise<{ record: ArtifactRecord; status: 200 | 202 }> => {
  const response = await apiClient.post(
    `/api/documents/${documentId}/summaries`,
    {},
  );
  return {
    record: unwrapApiData(response.data, "Failed to create summary"),
    status: response.status as 200 | 202,
  };
};

export type ArtifactSharePermission = "VIEW";

export interface ArtifactShareUser {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface ArtifactShare {
  id: string;
  artifactId: string;
  sharedWithUser: ArtifactShareUser;
  permission: ArtifactSharePermission;
  sharedBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Account-only invite — no email-a-stranger flow like DocumentShare has. */
export const shareArtifact = async (
  artifactId: string,
  email: string,
): Promise<ArtifactShare> => {
  const response = await apiClient.post(`/api/artifacts/${artifactId}/shares`, {
    email,
    permission: "VIEW",
  });
  return unwrapApiData(response.data, "Failed to share summary");
};

export const listArtifactShares = async (
  artifactId: string,
): Promise<ArtifactShare[]> => {
  const response = await apiClient.get(`/api/artifacts/${artifactId}/shares`);
  return unwrapApiData(response.data, "Failed to load summary shares");
};

export const revokeArtifactShare = async (
  artifactId: string,
  shareId: string,
): Promise<void> => {
  const response = await apiClient.delete(
    `/api/artifacts/${artifactId}/shares/${shareId}`,
  );
  unwrapApiData(response.data, "Failed to revoke summary share");
};

export interface SharedArtifactEntry {
  artifact: ArtifactRecord;
  sharedBy: ArtifactShareUser | null;
  sharedAt: string;
}

/** Summaries shared with the caller — readable without any document access. */
export const listSummariesSharedWithMe = async (): Promise<
  SharedArtifactEntry[]
> => {
  const response = await apiClient.get("/api/artifacts/shared-with-me");
  return unwrapApiData(response.data, "Failed to load shared summaries");
};
