import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ChatScope } from "@/types/chat";
import {
  deleteArtifact,
  initiateArtifact,
  listArtifacts,
  type ArtifactRecord,
  type ArtifactType,
  type InitiateArtifactPayload,
} from "@/services/artifactApi";

export interface ArtifactsContextType {
  artifacts: ArtifactRecord[];
  isLoading: boolean;
  railToggleCount: number;
  toggleRail: () => void;
  setThreadId: (id: string | undefined) => void;
  addOptimistic: (event: {
    artifactId: string;
    artifactType: string;
    title: string;
  }) => void;
  create: (
    type: ArtifactType,
    instructions: string,
    scopeOptions?: Omit<
      InitiateArtifactPayload,
      "type" | "instructions" | "threadId"
    >,
  ) => Promise<void>;
  remove: (id: string) => void;
  retry: (record: ArtifactRecord) => Promise<void>;
}

const ArtifactsContext = createContext<ArtifactsContextType | null>(null);

export const ArtifactsProvider: React.FC<{
  threadId?: string;
  children: React.ReactNode;
}> = ({ threadId, children }) => {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(
    threadId,
  );
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [railToggleCount, setRailToggleCount] = useState<number>(0);

  const toggleRail = useCallback(() => {
    setRailToggleCount((prev) => prev + 1);
  }, []);

  const activeThreadIdRef = useRef(activeThreadId);
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Ids of optimistic placeholders that no fetch has confirmed yet. A fetch
  // issued before the store learned the real thread id would otherwise drop
  // the placeholder, and the card would vanish mid-generation with no error
  // anywhere.
  const pendingPlaceholderIds = useRef<Set<string>>(new Set());

  const applyFetched = useCallback((fresh: ArtifactRecord[]) => {
    setArtifacts((current) => {
      const freshIds = new Set(fresh.map((artifact) => artifact._id));
      for (const id of freshIds) {
        pendingPlaceholderIds.current.delete(id);
      }
      const unconfirmed = current.filter((artifact) =>
        pendingPlaceholderIds.current.has(artifact._id),
      );
      return [...unconfirmed, ...fresh];
    });
  }, []);

  useEffect(() => {
    setActiveThreadId(threadId);
  }, [threadId]);

  useEffect(() => {
    let isSubscribed = true;
    // Placeholders belong to the thread they were created in. Cleared before
    // the fetch starts so anything added while it is in flight survives.
    pendingPlaceholderIds.current.clear();
    setIsLoading(true);
    listArtifacts(activeThreadId ?? "none")
      .then((res) => {
        if (isSubscribed) {
          applyFetched(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          applyFetched([]);
          setIsLoading(false);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [activeThreadId, applyFetched]);

  const hasGenerating = artifacts.some(
    (artifact) =>
      artifact.status === "PENDING" || artifact.status === "GENERATING",
  );

  useEffect(() => {
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      const targetId = activeThreadIdRef.current;
      try {
        const fresh = await listArtifacts(targetId ?? "none");
        applyFetched(fresh);
      } catch {
        // Transient fetch failure; next tick retries.
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [hasGenerating, activeThreadId, applyFetched]);

  const addOptimistic = useCallback(
    (event: { artifactId: string; artifactType: string; title: string }) => {
      setArtifacts((current) => {
        if (current.some((artifact) => artifact._id === event.artifactId)) {
          return current;
        }
        pendingPlaceholderIds.current.add(event.artifactId);
        const now = new Date().toISOString();
        const placeholder: ArtifactRecord = {
          _id: event.artifactId,
          userId: "",
          threadId: activeThreadIdRef.current,
          type: event.artifactType as ArtifactType,
          status: "GENERATING",
          title: event.title,
          sourceDocumentIds: [],
          createdAt: now,
          updatedAt: now,
        };
        return [placeholder, ...current];
      });
    },
    [],
  );

  const create = useCallback(
    async (
      type: ArtifactType,
      instructions: string,
      scopeOptions?: Omit<
        InitiateArtifactPayload,
        "type" | "instructions" | "threadId"
      >,
    ) => {
      const record = await initiateArtifact({
        type,
        instructions: instructions || undefined,
        threadId: activeThreadIdRef.current,
        ...scopeOptions,
      });
      setArtifacts((current) => [record, ...current]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    pendingPlaceholderIds.current.delete(id);
    setArtifacts((current) =>
      current.filter((artifact) => artifact._id !== id),
    );
    deleteArtifact(id).catch(() => {});
  }, []);

  const retry = useCallback(async (record: ArtifactRecord) => {
    pendingPlaceholderIds.current.delete(record._id);
    try {
      const fresh = await initiateArtifact({
        type: record.type,
        title: record.title,
        instructions: record.instructions,
        threadId: record.threadId,
        documentId:
          record.sourceDocumentIds.length === 1
            ? record.sourceDocumentIds[0]
            : undefined,
        documentIds:
          record.sourceDocumentIds.length > 1
            ? record.sourceDocumentIds
            : undefined,
        subjectId: record.subjectId,
        scope: record.scope as ChatScope | undefined,
      });
      setArtifacts((current) => [
        fresh,
        ...current.filter((artifact) => artifact._id !== record._id),
      ]);
      deleteArtifact(record._id).catch(() => {});
    } catch (err) {
      console.error("Failed to retry artifact generation", err);
    }
  }, []);

  const setThreadId = useCallback((id: string | undefined) => {
    setActiveThreadId(id);
  }, []);

  // Memoized so a poll tick that changes nothing does not re-render every
  // consumer; every callback below is already stable.
  const value = useMemo<ArtifactsContextType>(
    () => ({
      artifacts,
      isLoading,
      railToggleCount,
      toggleRail,
      setThreadId,
      addOptimistic,
      create,
      remove,
      retry,
    }),
    [
      artifacts,
      isLoading,
      railToggleCount,
      toggleRail,
      setThreadId,
      addOptimistic,
      create,
      remove,
      retry,
    ],
  );

  return (
    <ArtifactsContext.Provider value={value}>
      {children}
    </ArtifactsContext.Provider>
  );
};

export const useArtifacts = (): ArtifactsContextType => {
  const context = useContext(ArtifactsContext);
  if (!context) {
    throw new Error("useArtifacts must be used within an ArtifactsProvider");
  }
  return context;
};
