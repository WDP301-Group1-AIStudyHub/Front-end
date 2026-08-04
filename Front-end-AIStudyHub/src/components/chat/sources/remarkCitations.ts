import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

interface UnistNode extends Node {
  value?: string;
  children?: UnistNode[];
}

export const remarkCitations: Plugin = () => {
  return (tree: Node) => {
    visit(
      tree,
      "text",
      (node: UnistNode, index: number | undefined, parent: UnistNode | undefined) => {
        if (!parent || index === undefined) return;
        if (parent.type === "code" || parent.type === "inlineCode" || parent.type === "link") {
          return;
        }

        const text = node.value || "";
        const citationRegex = /\[(\d+)\](?!\()/g;
        let match: RegExpExecArray | null;

        const newNodes: UnistNode[] = [];
        let lastIndex = 0;

        while ((match = citationRegex.exec(text)) !== null) {
          const matchIndex = match.index;
          const fullMatch = match[0];
          const citationId = parseInt(match[1], 10);

          if (matchIndex > lastIndex) {
            newNodes.push({
              type: "text",
              value: text.slice(lastIndex, matchIndex),
            });
          }

          newNodes.push({
            type: "citation",
            data: {
              hName: "citation",
              hProperties: {
                citationId,
              },
            },
            children: [
              {
                type: "text",
                value: fullMatch,
              },
            ],
          });

          lastIndex = citationRegex.lastIndex;
        }

        if (newNodes.length > 0) {
          if (lastIndex < text.length) {
            newNodes.push({
              type: "text",
              value: text.slice(lastIndex),
            });
          }
          if (parent.children) {
            parent.children.splice(index, 1, ...newNodes);
          }
          return index + newNodes.length;
        }
      },
    );
  };
};
