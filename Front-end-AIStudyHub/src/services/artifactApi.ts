import { apiClient, unwrapApiData } from "./apiClient";
import type { ChatScope, ChatSource } from "@/types/chat";
import type { IFlashcardItem, IMcqItem } from "./studyMaterialApi";

export type ArtifactType =
  | "FLASHCARD"
  | "QUIZ"
  | "MINDMAP"
  | "REPORT"
  | "DATA_TABLE";
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
  subjectId?: string;
  scope?: string;
  sources?: ChatSource[];
  error?: string;
  createdAt: string;
  updatedAt: string;
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
