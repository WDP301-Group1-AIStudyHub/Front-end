import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateStudyMaterial } from "../../services/studyMaterialApi";
import type { MaterialType } from "../../services/studyMaterialApi";
import { useStudyMaterialStore } from "../../store/useStudyMaterialStore";
import { BookOpen, Sparkles, AlertCircle, Check } from "lucide-react";

interface StudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  onGenerationStarted?: () => void;
}

export default function StudyMaterialModal({
  isOpen,
  onClose,
  documentId,
  onGenerationStarted,
}: StudyMaterialModalProps) {
  const [type, setType] = useState<MaterialType>("MCQ");
  const [count, setCount] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const addTask = useStudyMaterialStore((state) => state.addTask);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const material = await generateStudyMaterial(documentId, type, count);
      
      addTask({
        id: material._id || material.id,
        documentId,
        title: material.title,
        type: material.type,
        status: material.status,
      });

      setFeedback({
        tone: "success",
        message: "AI Study generation started in the background. You can close this window now.",
      });

      if (onGenerationStarted) {
        onGenerationStarted();
      }

      // Close modal automatically after 2.5 seconds
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 2500);
    } catch (err: any) {
      setFeedback({
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to start generation",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="botanical-bento max-w-md p-6 font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-500" />
            AI Study Generator
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Generate customized practice items based on this document context. This runs in the background.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleGenerate} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Material Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("MCQ")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  type === "MCQ"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <BookOpen className="size-5 mb-2" />
                <span className="text-sm font-bold">Multiple Choice Quiz</span>
                <span className="text-2xs text-muted-foreground mt-1">Practice options & feedback</span>
              </button>
              <button
                type="button"
                onClick={() => setType("FLASHCARD")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  type === "FLASHCARD"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Sparkles className="size-5 mb-2" />
                <span className="text-sm font-bold">Interactive Flashcards</span>
                <span className="text-2xs text-muted-foreground mt-1">3D Flip definition card decks</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="item-count" className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Number of Items
            </label>
            <select
              id="item-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full min-h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={5}>5 Questions / Cards</option>
              <option value={10}>10 Questions / Cards</option>
              <option value={15}>15 Questions / Cards</option>
              <option value={20}>20 Questions / Cards</option>
            </select>
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-3 rounded-xl px-4 py-3 text-xs leading-normal border ${
                feedback.tone === "success"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-400"
              }`}
            >
              {feedback.tone === "success" ? (
                <Check className="size-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (feedback?.tone === "success")}>
              {isSubmitting ? "Initiating..." : "Generate Set"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
