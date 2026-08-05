import {
  isDocumentReadyForChat,
  getDocumentIndexState,
  getDocumentIndexIssue,
} from "../chatScope";
import type { DocumentItem } from "@/types/document";

// Minimal helper to build dummy DocumentItem objects
function makeDoc(overrides: Partial<DocumentItem>): DocumentItem {
  return {
    id: "test-doc-1",
    title: "Test Doc",
    fileName: "test.pdf",
    fileType: "pdf",
    fileSize: 1024,
    fileUrl: "http://example.com/test.pdf",
    filePublicId: "test_1",
    uploadedBy: "user_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function runChatScopeTests() {
  const assertions: { name: string; pass: boolean; details?: string }[] = [];

  function assert(name: string, condition: boolean, details?: string) {
    assertions.push({ name, pass: condition, details });
    if (!condition) {
      console.error(`❌ FAIL: ${name}`, details ?? "");
    } else {
      console.log(`✅ PASS: ${name}`);
    }
  }

  // 1. Test getDocumentIndexState
  const docZeroChunks = makeDoc({
    ragStatus: "FAILED",
    extractionStatus: "COMPLETED",
    totalChunks: 0,
    ragError: "No text layer found",
  });

  // 0. Test isDocumentReadyForChat
  assert(
    "isDocumentReadyForChat: zero chunk doc => false",
    isDocumentReadyForChat(docZeroChunks) === false,
  );

  const docIndexed940 = makeDoc({
    ragStatus: "INDEXED",
    totalChunks: 940,
    lastIndexedAt: new Date().toISOString(),
  });
  assert(
    "INDEXED + 940 chunks => ready",
    getDocumentIndexState(docIndexed940) === "ready",
    `Got ${getDocumentIndexState(docIndexed940)}`,
  );

  const docIndexing = makeDoc({
    ragStatus: "INDEXING",
    totalChunks: 0,
  });
  assert(
    "INDEXING => processing",
    getDocumentIndexState(docIndexing) === "processing",
    `Got ${getDocumentIndexState(docIndexing)}`,
  );

  const docFailedRag = makeDoc({
    ragStatus: "FAILED",
    totalChunks: 0,
  });
  assert(
    "FAILED => unsearchable",
    getDocumentIndexState(docFailedRag) === "unsearchable",
    `Got ${getDocumentIndexState(docFailedRag)}`,
  );

  const docLegacyNotAvailableWithChunks = makeDoc({
    ragStatus: "NOT_AVAILABLE",
    totalChunks: 76,
  });
  assert(
    "NOT_AVAILABLE + chunks => ready",
    getDocumentIndexState(docLegacyNotAvailableWithChunks) === "ready",
    `Got ${getDocumentIndexState(docLegacyNotAvailableWithChunks)}`,
  );

  // 2. Test getDocumentIndexIssue
  const issueZeroChunk = getDocumentIndexIssue(docZeroChunks);
  assert(
    "Zero-chunk document returns kind: no_content and OCR action",
    issueZeroChunk?.kind === "no_content" &&
      issueZeroChunk.action.includes("OCR"),
    `Got issue: ${JSON.stringify(issueZeroChunk)}`,
  );

  const docExtractionFailed = makeDoc({
    extractionStatus: "FAILED",
    extractionError: "markitdown timed out",
    ragStatus: "NOT_AVAILABLE",
    totalChunks: 0,
  });
  const issueExtractionFailed = getDocumentIndexIssue(docExtractionFailed);
  assert(
    "Extraction failed document returns kind: extraction_failed and upload action",
    issueExtractionFailed?.kind === "extraction_failed" &&
      issueExtractionFailed.action.includes("uploading"),
    `Got issue: ${JSON.stringify(issueExtractionFailed)}`,
  );

  const issueHealthy = getDocumentIndexIssue(docIndexed940);
  assert(
    "Healthy document returns undefined issue",
    issueHealthy === undefined,
    `Got ${JSON.stringify(issueHealthy)}`,
  );

  // 3. Regression check: extractionStatus "COMPLETED" with ragStatus "FAILED" must NOT return "ready"
  const chuong4Mock = makeDoc({
    title: "chuong4.pdf",
    fileName: "chuong4.pdf",
    extractionStatus: "COMPLETED",
    status: "ACTIVE",
    ragStatus: "FAILED",
    ragError: "Empty markdown document after processing",
    totalChunks: 0,
  });

  assert(
    "Regression check: chuong4.pdf (COMPLETED + FAILED) must be unsearchable",
    getDocumentIndexState(chuong4Mock) === "unsearchable",
    `Got ${getDocumentIndexState(chuong4Mock)}`,
  );

  const failedCount = assertions.filter((a) => !a.pass).length;
  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed.`);
  }
  console.log(`\nAll ${assertions.length} chatScope unit tests passed!`);
}
