import type { Code, Heading, Root, RootContent, Table } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type ArtifactKind = "code" | "table" | "note";

export interface ChatArtifact {
  id: string;
  messageId: string;
  kind: ArtifactKind;
  title: string;
  language?: string;
  content: string;
}

// An answer qualifies as a "note" artifact (structured summary/outline) when
// it has this many headings and is at least this long. Tune here if the
// sidebar gets too noisy or misses useful answers.
const NOTE_MIN_HEADINGS = 2;
const NOTE_MIN_LENGTH = 600;

const parser = unified().use(remarkParse).use(remarkGfm);

function nodeText(node: RootContent): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => nodeText(child as RootContent)).join("");
  }
  return "";
}

function sliceSource(source: string, node: RootContent): string | null {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (typeof start !== "number" || typeof end !== "number") return null;
  return source.slice(start, end);
}

function truncateTitle(title: string, maxLength = 60): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function codeFallbackTitle(language?: string): string {
  return language ? `${language} snippet` : "Code snippet";
}

function tableFallbackTitle(table: Table): string {
  const headerRow = table.children[0];
  if (!headerRow) return "Table";
  const cells = headerRow.children
    .map((cell) => nodeText(cell as RootContent).trim())
    .filter(Boolean);
  return cells.length > 0 ? truncateTitle(cells.join(" / ")) : "Table";
}

export function extractArtifacts(
  answer: string,
  messageId: string,
): ChatArtifact[] {
  if (!answer.trim()) return [];

  let tree: Root;
  try {
    tree = parser.parse(answer);
  } catch {
    return [];
  }

  const artifacts: ChatArtifact[] = [];
  let precedingHeading: string | undefined;
  let headingCount = 0;

  for (const node of tree.children) {
    if (node.type === "heading") {
      headingCount += 1;
      const text = nodeText(node as Heading).trim();
      if (text) precedingHeading = text;
      continue;
    }

    if (node.type === "code") {
      const code = node as Code;
      const content = sliceSource(answer, node);
      if (!content) continue;
      const language = code.lang?.trim() || undefined;
      artifacts.push({
        id: `${messageId}-artifact-${artifacts.length}`,
        messageId,
        kind: "code",
        title: precedingHeading
          ? truncateTitle(precedingHeading)
          : codeFallbackTitle(language),
        language,
        content,
      });
    } else if (node.type === "table") {
      const content = sliceSource(answer, node);
      if (!content) continue;
      artifacts.push({
        id: `${messageId}-artifact-${artifacts.length}`,
        messageId,
        kind: "table",
        title: precedingHeading
          ? truncateTitle(precedingHeading)
          : tableFallbackTitle(node as Table),
        content,
      });
    }
  }

  // A long, heading-structured answer is worth keeping whole as a note, even
  // when it also produced code/table artifacts above.
  if (headingCount >= NOTE_MIN_HEADINGS && answer.length >= NOTE_MIN_LENGTH) {
    const firstHeading = tree.children.find(
      (node): node is Heading => node.type === "heading",
    );
    const title = firstHeading ? nodeText(firstHeading).trim() : "";
    artifacts.push({
      id: `${messageId}-artifact-${artifacts.length}`,
      messageId,
      kind: "note",
      title: title ? truncateTitle(title) : "Structured answer",
      content: answer,
    });
  }

  return artifacts;
}
