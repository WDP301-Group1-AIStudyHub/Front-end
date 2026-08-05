import type { DocumentItem } from "@/types/document";

export function getDocumentSubject(doc?: DocumentItem) {
  return doc && typeof doc.subject === "object" ? doc.subject : null;
}

export function getDocumentSubjectName(doc?: DocumentItem) {
  return (
    getDocumentSubject(doc)?.name ||
    (typeof doc?.subject === "string" ? doc.subject : undefined)
  );
}

export function getDocumentSubjectId(doc?: DocumentItem) {
  return getDocumentSubject(doc)?._id || doc?.subjectId;
}

export function getDocumentSemester(doc?: DocumentItem) {
  return getDocumentSubject(doc)?.semester?.trim() || "No semester";
}

export function getDocumentSubjectKey(doc: DocumentItem) {
  return (
    getDocumentSubjectId(doc) || getDocumentSubjectName(doc) || "No subject"
  );
}
