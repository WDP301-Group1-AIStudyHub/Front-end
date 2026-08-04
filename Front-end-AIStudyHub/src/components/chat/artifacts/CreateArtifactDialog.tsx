import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import type { ArtifactType } from "@/services/artifactApi";
import { TYPE_META } from "./artifactTypes";

export function CreateArtifactDialog({
  type,
  onClose,
  onCreate,
  scopeHint = "Generated from the documents attached to this conversation.",
}: {
  type: ArtifactType | null;
  onClose: () => void;
  onCreate: (type: ArtifactType, instructions: string) => Promise<void>;
  scopeHint?: string;
}) {
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInstructions("");
    setSubmitting(false);
    setError(null);
  }, [type]);

  const submit = async () => {
    if (!type || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(type, instructions.trim());
      onClose();
    } catch (err) {
      // Commonly a 409 while a selected document is still being processed.
      // Without this the dialog stays open with no explanation and the
      // rejection surfaces only in the console.
      setError(
        err instanceof Error
          ? err.message
          : "Could not start generation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={type !== null}>
      <DialogContent className="sm:max-w-md">
        {type && (
          <>
            <DialogHeader>
              <DialogTitle>
                Create {TYPE_META[type].label.toLowerCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="artifact-topic"
              >
                Topic or focus (optional)
              </label>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                id="artifact-topic"
                onChange={(event) => setInstructions(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder="e.g. Chapter 3: normalization and functional dependencies"
                value={instructions}
              />
              <p className="text-xs text-muted-foreground">{scopeHint}</p>
              <FieldError className="text-xs">{error}</FieldError>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={onClose} size="sm" variant="ghost">
                Cancel
              </Button>
              <Button
                disabled={submitting}
                onClick={() => void submit()}
                size="sm"
              >
                {submitting ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus className="size-3.5" aria-hidden="true" />
                )}
                Create
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
