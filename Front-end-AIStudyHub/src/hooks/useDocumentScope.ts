import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { listDocuments } from "@/services/documentApi";
import type { DocumentItem } from "@/types/document";
import {
  getDocumentSubjectId,
  getDocumentSubjectKey,
  getDocumentSubjectName,
} from "@/lib/documentDisplay";
import { buildScopeFields, type ScopeFields } from "@/lib/chatScope";

export type UseDocumentScope = {
  documents: DocumentItem[];
  loadingDocs: boolean;
  selectedDocIds: string[];
  selectedDocs: DocumentItem[];
  /** Subject key of the current selection, or null when nothing is selected. */
  selectedSubjectKey: string | null;
  selectDocument: (id: string) => void;
  selectSubject: (subjectId: string) => void;
  removeDocument: (id: string) => void;
  clearSelection: () => void;
  notifyUnavailable: (label: string, ragStatus?: string) => void;
  /**
   * Reads the live selection off refs, so it stays correct inside a memoized
   * chat adapter closure that was created before the user picked anything.
   */
  getScopeFields: () => ScopeFields;
};

/**
 * Owns the "which documents is this conversation grounded in" state: the
 * library listing, the selection, and the scope fields the ask/artifact
 * payloads need.
 *
 * The selection callbacks are all referentially stable so they can feed the
 * composer's mention adapter — an unstable `onInserted` there remounts the
 * trigger popover and resets its drill-down state on every render.
 */
export function useDocumentScope(): UseDocumentScope {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const selectedDocIdsRef = useRef<string[]>([]);
  const documentsRef = useRef<DocumentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((docs) => {
        if (cancelled) return;
        setDocuments(docs);
        documentsRef.current = docs;
      })
      .catch(() => {
        if (cancelled) return;
        setDocuments([]);
        documentsRef.current = [];
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Written through on every change rather than synced in an effect: two
  // mentions inserted back to back would otherwise both read the pre-render
  // selection and the second would drop the first.
  const applySelection = useCallback((next: string[]) => {
    selectedDocIdsRef.current = next;
    setSelectedDocIds(next);
  }, []);

  const subjectKeyOf = useCallback((ids: readonly string[]) => {
    const first = documentsRef.current.find((doc) => doc.id === ids[0]);
    return first ? getDocumentSubjectKey(first) : null;
  }, []);

  const selectDocument = useCallback(
    (id: string) => {
      const doc = documentsRef.current.find((item) => item.id === id);
      if (!doc) return;

      const current = selectedDocIdsRef.current;
      if (current.includes(id)) return;

      const docSubjectKey = getDocumentSubjectKey(doc);
      const currentSubjectKey = subjectKeyOf(current);

      // The backend rejects a set spanning two subjects, so crossing over
      // replaces the selection rather than adding to it. Say so — silently
      // dropping the user's other documents reads as a bug.
      if (currentSubjectKey && currentSubjectKey !== docSubjectKey) {
        toast.info(
          `Study context switched to ${getDocumentSubjectName(doc) || "Subject"} — ${current.length} document(s) deselected.`,
        );
        applySelection([id]);
        return;
      }

      applySelection([...current, id]);
    },
    [applySelection, subjectKeyOf],
  );

  const selectSubject = useCallback(
    (subjectId: string) => {
      const subjectDocs = documentsRef.current.filter(
        (doc) =>
          (getDocumentSubjectId(doc) || getDocumentSubjectKey(doc)) ===
          subjectId,
      );
      if (subjectDocs.length === 0) return;

      const current = selectedDocIdsRef.current;
      const nextSubjectKey = getDocumentSubjectKey(subjectDocs[0]);
      const currentSubjectKey = subjectKeyOf(current);

      if (currentSubjectKey && currentSubjectKey !== nextSubjectKey) {
        toast.info(
          `Study context switched to ${getDocumentSubjectName(subjectDocs[0]) || "Subject"} — ${current.length} document(s) deselected.`,
        );
      }

      applySelection(subjectDocs.map((doc) => doc.id));
    },
    [applySelection, subjectKeyOf],
  );

  const removeDocument = useCallback(
    (id: string) => {
      applySelection(selectedDocIdsRef.current.filter((docId) => docId !== id));
    },
    [applySelection],
  );

  const clearSelection = useCallback(() => applySelection([]), [applySelection]);

  const notifyUnavailable = useCallback(
    (label: string, ragStatus?: string) => {
      if (ragStatus === "FAILED") {
        toast.warning(
          `"${label}" has no readable text — it looks like a scanned PDF or empty file.`,
        );
      } else if (ragStatus === "INDEXING") {
        toast.warning(
          `"${label}" is still being indexed — try again once it finishes.`,
        );
      } else {
        toast.warning(`"${label}" isn't available for questions yet.`);
      }
    },
    [],
  );

  const getScopeFields = useCallback((): ScopeFields => {
    const docIds = selectedDocIdsRef.current;
    const first = documentsRef.current.find((doc) => doc.id === docIds[0]);
    return buildScopeFields({
      docIds,
      subjectId: getDocumentSubjectId(first),
      subject: getDocumentSubjectName(first),
    });
  }, []);

  const selectedDocs = useMemo(
    () =>
      selectedDocIds
        .map((id) => documents.find((doc) => doc.id === id))
        .filter((doc): doc is DocumentItem => Boolean(doc)),
    [documents, selectedDocIds],
  );

  const selectedSubjectKey = selectedDocs[0]
    ? getDocumentSubjectKey(selectedDocs[0])
    : null;

  return {
    documents,
    loadingDocs,
    selectedDocIds,
    selectedDocs,
    selectedSubjectKey,
    selectDocument,
    selectSubject,
    removeDocument,
    clearSelection,
    notifyUnavailable,
    getScopeFields,
  };
}
