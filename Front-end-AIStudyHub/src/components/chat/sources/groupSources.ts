import type { ChatSource, GroupedSource } from "@/types/chat";

export function groupSources(sources: ChatSource[]): GroupedSource[] {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return [];
  }

  const groupsMap = new Map<string, GroupedSource>();

  for (const source of sources) {
    if (!source || !source.documentId) continue;

    let group = groupsMap.get(source.documentId);
    if (!group) {
      group = {
        documentId: source.documentId,
        title: source.title || "Untitled Document",
        chunks: [],
        isDeleted: source.sourceStatus === "DELETED",
      };
      groupsMap.set(source.documentId, group);
    }

    if (source.sourceStatus === "DELETED") {
      group.isDeleted = true;
    }

    group.chunks.push(source);
  }

  const groups = Array.from(groupsMap.values());

  for (const group of groups) {
    group.chunks.sort((a, b) => {
      const scoreA = a.relevanceScore ?? 0;
      const scoreB = b.relevanceScore ?? 0;
      return scoreB - scoreA;
    });
  }

  return groups;
}

export function sourceLocator(source: ChatSource): string | undefined {
  if (!source) return undefined;

  const candidate =
    source.sectionTitle ||
    source.heading ||
    source.inferredSection ||
    source.section ||
    source.chapterOrdinal ||
    source.semanticSectionLabel ||
    source.outlinePath;

  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return undefined;
}
