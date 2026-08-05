import {
  FileText,
  Layers,
  ListChecks,
  Network,
  Table,
  type LucideIcon,
} from "lucide-react";

import type { ArtifactRecord, ArtifactType } from "@/services/artifactApi";
import type { StudyMaterial } from "@/services/studyMaterialApi";

export const TYPE_META: Record<
  ArtifactType,
  { label: string; icon: LucideIcon }
> = {
  FLASHCARD: { label: "Flashcards", icon: Layers },
  QUIZ: { label: "Quiz", icon: ListChecks },
  MINDMAP: { label: "Mind map", icon: Network },
  REPORT: { label: "Report", icon: FileText },
  DATA_TABLE: { label: "Data table", icon: Table },
};

export const MARKDOWN_PREVIEW_CLASS =
  "artifact-preview max-h-[60vh] min-w-0 overflow-y-auto text-sm leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_code]:font-mono [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:font-semibold [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5";

export function dataTableToMarkdown(
  columns: string[],
  rows: string[][],
): string {
  const escape = (cell: string) => cell.replace(/\|/g, "\\|");
  return [
    `| ${columns.map(escape).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
}

export function recordToCopyText(record: ArtifactRecord): string {
  const content = record.content;
  if (!content) return record.title;
  if ("markdown" in content) return content.markdown;
  if ("columns" in content)
    return dataTableToMarkdown(content.columns, content.rows);
  return JSON.stringify(content, null, 2);
}

export function recordToStudyMaterial(record: ArtifactRecord): StudyMaterial {
  const items =
    record.content && "items" in record.content ? record.content.items : [];
  return {
    id: record._id,
    _id: record._id,
    title: record.title,
    userId: record.userId,
    documentId: record.sourceDocumentIds[0] ?? "",
    type: record.type === "QUIZ" ? "MCQ" : "FLASHCARD",
    status: record.status,
    items,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
