import { useCallback, useMemo } from "react";
import {
  unstable_useMentionAdapter,
  type Unstable_MentionCategory,
  type Unstable_MentionDirective,
} from "@assistant-ui/react";
import type { Unstable_DirectiveFormatter, Unstable_TriggerAdapter, Unstable_TriggerItem } from "@assistant-ui/core";
import type { DocumentItem } from "@/types/document";
import {
  getDocumentSubjectKey,
  getDocumentSubjectName,
  getDocumentSubjectId,
} from "@/lib/documentDisplay";
import { isDocumentReadyForChat } from "@/lib/chatScope";

export type UseDocumentMentionsProps = {
  documents: DocumentItem[];
  loading?: boolean;
  onSelectDocument: (id: string) => void;
  onSelectSubject: (subjectId: string) => void;
  /**
   * Called when the user picks a document that isn't indexed yet. The library
   * has no notion of a disabled item — keyboard `Enter` resolves straight to
   * `navigableList[highlightedIndex]` — so unavailable rows are rejected here
   * rather than by the row's `disabled` attribute, which only stops the mouse.
   */
  onUnavailable?: (label: string, ragStatus?: string) => void;
  selectedSubjectKey?: string | null;
};

export const mentionDirectiveFormatter: Unstable_DirectiveFormatter = {
  // Unavailable documents serialize to nothing, so picking one leaves no
  // orphaned `@Label` behind for a document that never entered the selection.
  serialize: (item: Unstable_TriggerItem) =>
    item.metadata?.disabled ? "" : `@${item.label} `,
  parse: (text: string) => [
    {
      kind: "text",
      text,
    },
  ],
};

export function useDocumentMentions({
  documents,
  loading = false,
  onSelectDocument,
  onSelectSubject,
  onUnavailable,
  selectedSubjectKey,
}: UseDocumentMentionsProps): {
  adapter: Unstable_TriggerAdapter;
  directive: Unstable_MentionDirective;
  isLoading: boolean;
} {
  const categories = useMemo<readonly Unstable_MentionCategory[]>(() => {
    if (!documents || documents.length === 0) return [];

    // Group documents by subject key
    const subjectMap = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        docs: DocumentItem[];
      }
    >();

    for (const doc of documents) {
      const sKey = getDocumentSubjectKey(doc);
      const sName = getDocumentSubjectName(doc) || "Unassigned Subject";
      const sId = getDocumentSubjectId(doc) || sKey;

      if (!subjectMap.has(sKey)) {
        subjectMap.set(sKey, {
          subjectId: sId,
          subjectName: sName,
          docs: [],
        });
      }
      subjectMap.get(sKey)!.docs.push(doc);
    }

    const subjectCategoryItems = Array.from(subjectMap.entries()).map(
      ([sKey, info]) => ({
        id: info.subjectId,
        type: "subject",
        label: info.subjectName,
        description: `${info.docs.length} ${info.docs.length === 1 ? "document" : "documents"}`,
        icon: "subject",
        metadata: {
          icon: "subject",
          subjectKey: sKey,
        },
      })
    );

    const documentCategoryItems = documents.map((doc) => {
      const sKey = getDocumentSubjectKey(doc);
      const sName = getDocumentSubjectName(doc) || "Unassigned";
      const isUnavailable = !isDocumentReadyForChat(doc);

      const switchesContext = Boolean(
        selectedSubjectKey && selectedSubjectKey !== sKey
      );

      return {
        id: doc.id,
        type: "document",
        label: doc.fileName,
        description: sName,
        icon: "document",
        metadata: {
          icon: "document",
          ragStatus: doc.ragStatus,
          subjectKey: sKey,
          disabled: isUnavailable,
          switchesContext,
        },
      };
    });

    return [
      {
        id: "subjects",
        label: "Subjects",
        items: subjectCategoryItems,
      },
      {
        id: "documents",
        label: "Documents",
        items: documentCategoryItems,
      },
    ];
  }, [documents, selectedSubjectKey]);

  // Must be stable: `unstable_useMentionAdapter` memoizes `directive` on
  // `[formatter, onInserted]`, and the returned directive is what the page keys
  // its trigger component on. An inline arrow here remounts the popover — and
  // resets its drill-down and highlight state — on every render of the page.
  const onInserted = useCallback(
    (item: Unstable_TriggerItem) => {
      if (item.metadata?.disabled) {
        onUnavailable?.(item.label, item.metadata.ragStatus as string | undefined);
        return;
      }
      if (item.type === "document") {
        onSelectDocument(item.id);
      } else if (item.type === "subject") {
        onSelectSubject(item.id);
      }
    },
    [onSelectDocument, onSelectSubject, onUnavailable],
  );

  const { adapter, directive } = unstable_useMentionAdapter({
    categories,
    includeModelContextTools: false,
    formatter: mentionDirectiveFormatter,
    onInserted,
  });

  return { adapter, directive, isLoading: loading };
}
