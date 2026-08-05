import type { ChatScope } from "@/types/chat";
import type { DocumentItem } from "@/types/document";

/**
 * Whether a document can ground an answer.
 *
 * Mirrors `isActiveVersionReadyForChat` in the backend's `chatScope.service`:
 * a real chunk count or an `indexedAt` counts as ready even when `ragStatus`
 * says otherwise. That matters because `ragStatus` postdates a lot of the
 * corpus — documents indexed before the field existed report `NOT_AVAILABLE`
 * while carrying hundreds of chunks and answering questions fine. Gating on
 * `ragStatus` alone would grey out most of a real library.
 */
export function isDocumentReadyForChat(doc: DocumentItem): boolean {
  switch (doc.ragStatus) {
    case "INDEXING":
    case "FAILED":
    case "DELETED":
    case "DELETE_PENDING":
      return false;
    case "INDEXED":
      return (doc.totalChunks ?? 0) > 0;
    default:
      // `lastIndexedAt` alone is not evidence of content: a document that
      // finished indexing and produced nothing carries a timestamp and zero
      // chunks. Only treat the timestamp as a signal when the chunk count is
      // genuinely unknown, which is the legacy case this branch exists for.
      if (doc.totalChunks !== undefined) return doc.totalChunks > 0;
      return Boolean(doc.lastIndexedAt);
  }
}

export type DocumentIndexState = "ready" | "processing" | "unsearchable";

export function getDocumentIndexState(doc: DocumentItem): DocumentIndexState {
  if (doc.ragStatus === "INDEXING") return "processing";

  const statusStr = [doc.extractionStatus, doc.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    statusStr.includes("pending") ||
    statusStr.includes("processing") ||
    statusStr.includes("uploading") ||
    statusStr.includes("extracting") ||
    statusStr.includes("indexing")
  ) {
    return "processing";
  }

  if (isDocumentReadyForChat(doc)) {
    return "ready";
  }

  return "unsearchable";
}

export type DocumentIndexIssue = {
  kind: "extraction_failed" | "no_content";
  summary: string;
  action: string;
};

/**
 * The remedies live here rather than in the API's error strings, so a surface
 * that shows the backend message *and* an action does not print the same
 * suggestion twice. The upload widget imports these for the same reason.
 */
export const INDEX_ISSUE_ACTIONS = {
  extraction_failed: "Try uploading it again.",
  no_content: "Run OCR or upload a text-based copy.",
} as const;

export function getDocumentIndexIssue(
  doc: DocumentItem,
): DocumentIndexIssue | undefined {
  if (getDocumentIndexState(doc) !== "unsearchable") {
    return undefined;
  }

  const statusStr = [doc.extractionStatus, doc.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isExtractionFailed =
    statusStr.includes("fail") || statusStr.includes("error");

  if (isExtractionFailed) {
    return {
      kind: "extraction_failed",
      summary: doc.extractionError || "We couldn't read this file.",
      action: INDEX_ISSUE_ACTIONS.extraction_failed,
    };
  }

  return {
    kind: "no_content",
    summary: doc.ragError || "No readable text found.",
    action: INDEX_ISSUE_ACTIONS.no_content,
  };
}

/**
 * `documentIds` is capped at this length by the backend
 * (`agent.validation.ts` / `artifact.validation.ts`). A larger selection has to
 * travel as `subject_all` instead.
 */
export const MAX_SCOPE_DOCUMENT_IDS = 20;

/** The scope half of an ask or artifact payload. */
export type ScopeFields = {
  scope: ChatScope;
  documentId?: string;
  documentIds?: string[];
  subject?: string;
  subjectId?: string;
};

/**
 * Turns a document selection into the scope fields both `/api/agent/ask` and
 * `/api/artifacts` expect.
 *
 * Lives here rather than in a page because the rules are backend contract, not
 * presentation: the server rejects `subject_all` without a `subjectId`, rejects
 * more than {@link MAX_SCOPE_DOCUMENT_IDS} ids, and rejects a set whose
 * documents span subjects. Two pages build this payload, and a copy that drifts
 * shows up as a 400 rather than a type error.
 */
export function buildScopeFields({
  docIds,
  subjectId,
  subject,
}: {
  docIds: readonly string[];
  subjectId?: string | undefined;
  subject?: string | undefined;
}): ScopeFields {
  // Only fall back to subject_all when there is a real subjectId to send —
  // documents whose subject is a bare string have none, and the backend would
  // reject the request outright. Those truncate instead.
  const useSubjectScope =
    docIds.length > MAX_SCOPE_DOCUMENT_IDS && Boolean(subjectId);
  const scopedDocIds = useSubjectScope
    ? []
    : docIds.slice(0, MAX_SCOPE_DOCUMENT_IDS);

  const fields: ScopeFields = {
    scope:
      docIds.length === 0
        ? "library_all"
        : useSubjectScope
          ? "subject_all"
          : scopedDocIds.length === 1
            ? "single_document"
            : "document_set",
    subject: subject || undefined,
    subjectId: subjectId || undefined,
  };

  if (scopedDocIds.length === 1) {
    fields.documentId = scopedDocIds[0];
  } else if (scopedDocIds.length > 1) {
    fields.documentIds = scopedDocIds;
  }

  return fields;
}
