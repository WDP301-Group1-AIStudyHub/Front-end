import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import { useEffect, useRef } from "react";

import type { MindmapNode } from "@/services/artifactApi";

const transformer = new Transformer();

// markmap consumes markdown; serialize the tree as a nested bullet list.
function treeToMarkdown(node: MindmapNode, depth = 0): string {
  const lines = [`${"  ".repeat(depth)}- ${node.label}`];
  for (const child of node.children ?? []) {
    lines.push(treeToMarkdown(child, depth + 1));
  }
  return lines.join("\n");
}

export function MindmapView({ root }: { root: MindmapNode }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const { root: markmapRoot } = transformer.transform(treeToMarkdown(root));
    if (!markmapRef.current) {
      markmapRef.current = Markmap.create(
        svgRef.current,
        { autoFit: true },
        markmapRoot,
      );
    } else {
      markmapRef.current.setData(markmapRoot);
      markmapRef.current.fit();
    }
    return () => {
      markmapRef.current?.destroy();
      markmapRef.current = null;
    };
  }, [root]);

  return (
    <div className="h-[55vh] w-full overflow-hidden rounded-lg border border-border bg-background">
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  );
}
