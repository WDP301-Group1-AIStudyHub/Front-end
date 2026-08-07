import { create } from "zustand";
import axios from "axios";
import { getStoredToken } from "../services/authStorage";
import { findOrCreateSubjectByName } from "../services/subjectApi";
import { buildQuotaErrorMessage } from "../utils/formatStorage";
import { useStorageStore } from "./useStorageStore";
import { INDEX_ISSUE_ACTIONS } from "../lib/chatScope";
import { subscribeToUploadSession } from "../services/socket";
import type { DocumentItem } from "../types/document";
import type { StorageQuotaDetails } from "../types/storage";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const API_BASE_URL = API_ORIGIN.replace(/\/api$/, "");

export interface UploadItem {
  id: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "success" | "failed";
  step?: string;
  message?: string;
  error?: string;
  /**
   * Set when the upload itself succeeded but the file produced nothing
   * searchable — a scanned PDF with no text layer, for example. Kept separate
   * from `status` so the tab filters and counts stay as they are: the transfer
   * really did succeed, the document just cannot answer questions.
   */
  warning?: string;
  abortController?: AbortController;
}

interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  subject?: string;
}

export interface ConflictItem {
  id: string;
  payload: UploadDocumentPayload;
  existingDocumentMeta: DocumentItem;
  onSuccess?: () => void;
}

interface UploadState {
  uploads: UploadItem[];
  stagedConflicts: Record<string, ConflictItem>;
  uploadFile: (
    payload: UploadDocumentPayload,
    onSuccess?: () => void,
    overwriteId?: string,
  ) => Promise<void>;
  processIncomingUpload: (
    payload: UploadDocumentPayload,
    existingDocuments: DocumentItem[],
    onSuccess?: () => void,
  ) => void;
  resolveConflict: (
    conflictId: string,
    action: "REPLACE" | "KEEP_BOTH" | "CANCEL",
  ) => void;
  cancelUpload: (id: string) => void;
  cancelAll: () => void;
  removeUpload: (id: string) => void;
  clearFinished: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: [],
  stagedConflicts: {},

  processIncomingUpload: (payload, existingDocuments, onSuccess) => {
    const duplicate = existingDocuments.find(
      (doc) =>
        doc.fileName.trim().toLowerCase() ===
        payload.file.name.trim().toLowerCase(),
    );

    if (duplicate) {
      const conflictId = crypto.randomUUID();
      set((state) => ({
        stagedConflicts: {
          ...state.stagedConflicts,
          [conflictId]: {
            id: conflictId,
            payload,
            existingDocumentMeta: duplicate,
            onSuccess,
          },
        },
      }));
      return;
    }

    get().uploadFile(payload, onSuccess);
  },

  resolveConflict: (conflictId, action) => {
    const conflict = get().stagedConflicts[conflictId];
    if (!conflict) return;

    const { payload, existingDocumentMeta, onSuccess } = conflict;

    set((state) => {
      const updated = { ...state.stagedConflicts };
      delete updated[conflictId];
      return { stagedConflicts: updated };
    });

    if (action === "REPLACE") {
      get().uploadFile(payload, onSuccess, existingDocumentMeta.id);
    } else if (action === "KEEP_BOTH") {
      const file = payload.file;
      const dotIndex = file.name.lastIndexOf(".");
      const name =
        dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      const ext = dotIndex !== -1 ? file.name.substring(dotIndex) : "";
      const uniqueName = `${name} (1)${ext}`;

      const renamedFile = new File([file], uniqueName, { type: file.type });
      const renamedPayload = { ...payload, file: renamedFile };
      get().uploadFile(renamedPayload, onSuccess);
    }
  },

  uploadFile: async (payload, onSuccess, overwriteId) => {
    const id = crypto.randomUUID();
    const abortController = new AbortController();

    console.log("[Upload Debug] uploadFile initiated", {
      uploadSessionId: id,
      fileName: payload.file.name,
      fileSize: payload.file.size,
      title: payload.title,
      subjectInput: payload.subject,
    });

    const newItem: UploadItem = {
      id,
      fileName: payload.file.name,
      progress: 0,
      status: "pending",
      abortController,
    };

    set((state) => ({ uploads: [newItem, ...state.uploads] }));

    // Subscribe to real-time Socket.IO upload progress events
    const unsubscribeSocket = subscribeToUploadSession(id, (progressPayload) => {
      console.log(`[Upload Debug] Applying socket update to upload store item [${id}]`, progressPayload);
      set((state) => ({
        uploads: state.uploads.map((item) => {
          if (item.id === id) {
            const nextStatus =
              progressPayload.status === "completed"
                ? "success"
                : progressPayload.status === "failed"
                  ? "failed"
                  : "processing";

            return {
              ...item,
              progress: progressPayload.progress,
              status: nextStatus,
              step: progressPayload.step,
              message: progressPayload.message,
              error:
                progressPayload.status === "failed"
                  ? progressPayload.message
                  : item.error,
            };
          }
          return item;
        }),
      }));
    });

    // Every upload entry point funnels through here, so one guard covers the
    // library dialog, the dashboard dropzone and any future caller. The server
    // is still authoritative; this only avoids a pointless round trip.
    const capacity = useStorageStore
      .getState()
      .hasCapacityFor(payload.file.size);
    if (capacity.known && !capacity.ok) {
      unsubscribeSocket();
      const message = buildQuotaErrorMessage({
        availableBytes: capacity.available,
        packageName: useStorageStore.getState().storage?.package?.name ?? "",
        quotaBytes: useStorageStore.getState().storage?.quotaBytes ?? 0,
        requiredBytes: capacity.needed,
        reservedBytes: useStorageStore.getState().storage?.reservedBytes ?? 0,
        usedBytes: useStorageStore.getState().storage?.usedBytes ?? 0,
      });
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id ? { ...item, status: "failed", error: message } : item,
        ),
      }));
      return;
    }

    try {
      // Step 1: Resolve subject name to subjectId
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id
            ? { ...item, status: "processing", progress: 5, message: "Resolving subject..." }
            : item,
        ),
      }));

      let subjectId = "";
      if (payload.subject?.trim()) {
        subjectId = await findOrCreateSubjectByName(payload.subject.trim());
        console.log("[Upload Debug] Subject resolved:", {
          inputSubject: payload.subject,
          resolvedSubjectId: subjectId,
        });
      } else {
        throw new Error("Subject is required");
      }

      // Step 2: Upload binary using Axios
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id
            ? { ...item, status: "uploading", progress: 10, message: "Uploading file to server..." }
            : item,
        ),
      }));

      const formData = new FormData();
      formData.set("file", payload.file);
      formData.set("title", payload.title.trim());
      formData.set("subjectId", subjectId);
      formData.set("uploadSessionId", id);
      if (payload.description?.trim()) {
        formData.set("description", payload.description.trim());
      }
      if (payload.subject?.trim()) {
        formData.set("subject", payload.subject.trim());
      }
      if (overwriteId) {
        formData.set("overwriteId", overwriteId);
      }

      console.log(`[Upload Debug] Sending Axios POST /api/documents/upload`, {
        uploadSessionId: id,
        subjectId,
        fileName: payload.file.name,
        targetUrl: `${API_BASE_URL}/api/documents/upload`,
      });

      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/documents/upload`,
        formData,
        {
          headers,
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              // Scale HTTP upload to 10% - 25% of total progress
              const scaledProgress = Math.min(
                25,
                10 + Math.round((percentage * 15) / 100),
              );
              console.log(`[Upload Debug] Axios HTTP Upload Progress: ${percentage}% (scaled: ${scaledProgress}%)`);
              set((state) => ({
                uploads: state.uploads.map((item) => {
                  if (item.id === id) {
                    const status =
                      percentage >= 100 ? "processing" : "uploading";
                    const message =
                      percentage >= 100
                        ? item.message && item.message !== "Uploading file to server..."
                          ? item.message
                          : "Processing document on server..."
                        : `Uploading file (${percentage}%)...`;
                    return {
                      ...item,
                      progress: Math.max(item.progress, scaledProgress),
                      status,
                      message,
                    };
                  }
                  return item;
                }),
              }));
            }
          },
        },
      );

      console.log("[Upload Debug] Axios HTTP response received:", response.data);

      if (response.data?.success) {
        // A 2xx only means the file was stored. Indexing runs inside the same
        // request, so the response already knows whether anything reached the
        // vector store — surface that instead of reporting a clean success for
        // a document that cannot answer anything.
        const uploaded = response.data?.data as
          | { ragStatus?: string; ragError?: string }
          | undefined;
        const warning =
          uploaded?.ragStatus === "FAILED"
            ? `${uploaded.ragError || "No readable text found."} ${INDEX_ISSUE_ACTIONS.no_content}`
            : undefined;

        set((state) => ({
          uploads: state.uploads.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "success",
                  progress: 100,
                  message: "Upload completed successfully",
                  warning,
                }
              : item,
          ),
        }));
        useStorageStore.getState().applyUploadedBytes(payload.file.size);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.data?.message || "Server upload failed");
      }
    } catch (err: unknown) {
      console.error("[Upload Debug] uploadFile caught error:", err);
      if (
        axios.isCancel(err) ||
        (err instanceof Error && err.name === "CanceledError")
      ) {
        return;
      }
      const quotaDetails = axios.isAxiosError<{
        code?: string;
        details?: StorageQuotaDetails;
      }>(err)
        ? err.response?.data?.code === "STORAGE_QUOTA_EXCEEDED"
          ? err.response?.data?.details
          : undefined
        : undefined;

      // The server rejected on quota: refresh so the bar reflects the truth
      // that made it reject, then show the specific numbers instead of a code.
      if (quotaDetails) {
        void useStorageStore.getState().loadStorage({ force: true });
      }

      const errorMessage = quotaDetails
        ? buildQuotaErrorMessage(quotaDetails)
        : axios.isAxiosError<{ message?: string }>(err)
          ? err.response?.data?.message || err.message
          : err instanceof Error
            ? err.message
            : "Upload failed";
      set((state) => ({
        uploads: state.uploads.map((item) =>
          item.id === id
            ? { ...item, status: "failed", error: errorMessage }
            : item,
        ),
      }));
    } finally {
      unsubscribeSocket();
    }
  },

  cancelUpload: (id) => {
    set((state) => {
      const item = state.uploads.find((u) => u.id === id);
      if (
        item &&
        (item.status === "uploading" ||
          item.status === "processing" ||
          item.status === "pending")
      ) {
        item.abortController?.abort();
        return {
          uploads: state.uploads.map((u) =>
            u.id === id
              ? { ...u, status: "failed", error: "Cancelled by user" }
              : u,
          ),
        };
      }
      return state;
    });
  },

  cancelAll: () => {
    const { uploads, cancelUpload } = get();
    uploads.forEach((item) => {
      if (
        item.status === "uploading" ||
        item.status === "processing" ||
        item.status === "pending"
      ) {
        cancelUpload(item.id);
      }
    });
  },

  removeUpload: (id) => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    }));
  },

  clearFinished: () => {
    set((state) => ({
      uploads: state.uploads.filter(
        (u) =>
          u.status === "uploading" ||
          u.status === "processing" ||
          u.status === "pending",
      ),
    }));
  },
}));
