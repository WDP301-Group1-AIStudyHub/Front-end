import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStudyMaterialById } from "../services/studyMaterialApi";
import type { StudyMaterial } from "../services/studyMaterialApi";
import { LoadingState } from "../components/shared/CelestialLoading";
import FlashcardStudy from "../components/shared/FlashcardStudy";
import McqQuiz from "../components/shared/McqQuiz";
import { ArrowLeft, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudyMaterialsPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) {
      setError("No study material ID provided");
      setIsLoading(false);
      return;
    }

    let intervalId: any = null;
    let isCancelled = false;

    const fetchMaterial = async (isPoll = false) => {
      try {
        if (!isPoll) setIsLoading(true);
        const data = await getStudyMaterialById(materialId);

        if (isCancelled) return;

        setMaterial(data);
        setError(null);
        setIsLoading(false);

        // If still pending/generating, poll again
        if (data.status === "PENDING" || data.status === "GENERATING") {
          if (!intervalId) {
            intervalId = setInterval(() => fetchMaterial(true), 2500);
          }
        } else {
          // Finished (COMPLETED or FAILED) -> clear any polling intervals
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err: any) {
        if (isCancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load study material",
        );
        setIsLoading(false);
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    fetchMaterial();

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [materialId]);

  if (isLoading) {
    return (
      <div className="moonlit-page min-h-svh grid place-items-center p-6">
        <LoadingState
          className="w-full max-w-md"
          label="Loading study material..."
          tone="sapphire"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="moonlit-page min-h-svh flex items-center justify-center p-6 font-sans">
        <div className="botanical-bento tone-surface tone-coral max-w-md p-6 text-center space-y-4">
          <AlertCircle className="size-10 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Failed to Load</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button asChild className="w-full mt-4">
            <Link to="/study-materials">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="moonlit-page min-h-svh flex items-center justify-center p-6 font-sans">
        <div className="botanical-bento max-w-md p-6 text-center space-y-4">
          <h2 className="text-xl font-bold">Material Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested study material does not exist.
          </p>
          <Button asChild className="w-full">
            <Link to="/study-materials">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Handle generation states
  if (material.status === "PENDING" || material.status === "GENERATING") {
    return (
      <div className="moonlit-page min-h-svh flex items-center justify-center p-6 font-sans">
        <div className="botanical-bento max-w-md p-8 text-center space-y-6">
          <div className="relative flex items-center justify-center my-4">
            <RefreshCw className="size-12 text-primary animate-spin" />
            <BookOpen className="size-6 text-primary absolute" />
          </div>
          <h2 className="text-2xl font-black">AI is Creating Your Set</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We are analyzing your document text and generating customized
            questions. This page will update automatically when ready.
          </p>
          <div className="text-2xs text-muted-foreground italic">
            Status:{" "}
            {material.status === "PENDING" ? "Queued" : "Generating items..."}
          </div>
          <Button asChild variant="secondary" className="w-full mt-4">
            <Link to={`/study-materials`}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (material.status === "FAILED") {
    return (
      <div className="moonlit-page min-h-svh flex items-center justify-center p-6 font-sans">
        <div className="botanical-bento tone-surface tone-coral max-w-md p-6 text-center space-y-4">
          <AlertCircle className="size-10 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">Generation Failed</h2>
          <p className="text-sm text-muted-foreground">
            {material.error ||
              "The AI model was unable to generate study materials from this document."}
          </p>
          <Button asChild className="w-full mt-4">
            <Link to={`/study-materials`}>
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="botanical-page min-h-svh flex flex-col font-sans text-foreground">
      <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-4">
          <Button asChild variant="secondary" size="sm">
            <Link to={`/study-materials`}>
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </header>

        <div className="flex-1 flex items-center justify-center py-6">
          {material.type === "MCQ" ? (
            <McqQuiz items={material.items as any[]} title={material.title} />
          ) : (
            <FlashcardStudy material={material} title={material.title} />
          )}
        </div>
      </div>
    </main>
  );
}
