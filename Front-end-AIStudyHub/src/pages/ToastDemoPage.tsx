import { useState } from "react";
import { toast } from "sonner";
import { useToast } from "@/hooks/useToast";
import { useUploadStore } from "@/store/useUploadStore";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateArtifactDialog } from "@/components/chat/artifacts/CreateArtifactDialog";
import SummaryShareDialog from "@/components/artifacts/SummaryShareDialog";
import { TYPE_META } from "@/components/chat/artifacts/artifactTypes";
import type {
  ArtifactType,
  ArtifactRecord,
  ArtifactContent,
} from "@/services/artifactApi";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Loader2,
  Sparkles,
  Bell,
  UploadCloud,
  FilePlus,
  Share2,
  AlertOctagon,
  BrainCircuit,
  RotateCw,
  Trash2,
} from "lucide-react";

export default function ToastDemoPage() {
  const { showToast } = useToast();
  const [loadingToastId, setLoadingToastId] = useState<string | number | null>(
    null,
  );

  // Artifact creation dialog state
  const [activeArtifactType, setActiveArtifactType] =
    useState<ArtifactType | null>(null);

  // Summary share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Interactive mock state for Artifact Tool Cards
  const [cardStatus, setCardStatus] = useState<
    "GENERATING" | "COMPLETED" | "FAILED"
  >("COMPLETED");

  // ----------------------------------------------------
  // Toast Trigger Handlers
  // ----------------------------------------------------
  const triggerCustomToast = (
    tone: "success" | "error" | "warning" | "info",
  ) => {
    const messages = {
      success: "Operation completed successfully!",
      error: "Failed to process request.",
      warning: "Your storage quota is almost full (85%).",
      info: "System maintenance scheduled tonight at 12:00 AM.",
    };
    showToast({ tone, message: messages[tone] });
  };

  const triggerSonnerSuccess = () => {
    toast.success("Profile updated!", {
      description: "Your changes have been saved to the server.",
    });
  };

  const triggerSonnerError = () => {
    toast.error("Authentication error", {
      description: "Your session token expired. Please re-login.",
    });
  };

  const triggerSonnerWarning = () => {
    toast.warning("Unsaved changes", {
      description: "You have unsaved changes in your document editor.",
    });
  };

  const triggerSonnerInfo = () => {
    toast.info("New Feature Available", {
      description:
        "Check out the new AI Study Assistant tools in your dashboard.",
    });
  };

  const triggerSonnerAction = () => {
    toast("Item moved to Trash", {
      description: "File 'lecture_notes_ch3.pdf' was deleted.",
      action: {
        label: "Undo",
        onClick: () => toast.success("Action undone successfully!"),
      },
    });
  };

  const triggerSonnerLoading = () => {
    const id = toast.loading("Generating AI Summary...", {
      description: "Please wait while we process your request.",
    });
    setLoadingToastId(id);

    setTimeout(() => {
      toast.success("AI Summary Ready!", {
        id,
        description: "Summary generated in 2.1 seconds.",
      });
      setLoadingToastId(null);
    }, 2500);
  };

  const triggerSonnerPromise = () => {
    const mockPromise = new Promise<{ name: string }>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          resolve({ name: "Physics_101_Lecture.pdf" });
        } else {
          reject(new Error("Network connection dropped"));
        }
      }, 2000);
    });

    toast.promise(mockPromise, {
      loading: "Synchronizing files with cloud...",
      success: (data) => `File '${data.name}' uploaded successfully!`,
      error: "Upload failed. Please check network connection.",
    });
  };

  // ----------------------------------------------------
  // Upload Widget Handlers (useUploadStore)
  // ----------------------------------------------------
  const triggerMockUpload = () => {
    const mockFiles = [
      {
        name: "Organic_Chemistry_Chapter_4.pdf",
        progress: 45,
        status: "uploading" as const,
        message: "Uploading binary bytes...",
      },
      {
        name: "Machine_Learning_Notes_Final.pdf",
        progress: 65,
        status: "processing" as const,
        message: "Generating AI embeddings for 18 chunks...",
      },
      {
        name: "Algorithms_Lab_2_Solution.pdf",
        progress: 100,
        status: "success" as const,
        message: "Upload completed successfully",
      },
      {
        name: "Corrupted_File_Scan.pdf",
        progress: 20,
        status: "failed" as const,
        error: "Unreadable text layer",
      },
    ];
    const item = mockFiles[Math.floor(Math.random() * mockFiles.length)];

    useUploadStore.setState((state) => ({
      uploads: [
        ...state.uploads,
        {
          id: crypto.randomUUID(),
          fileName: item.name,
          progress: item.progress,
          status: item.status,
          message: item.message,
          error: item.error,
        },
      ],
    }));

    toast.info("Upload simulation started", {
      description: `Added '${item.name}' to background upload manager.`,
    });
  };

  const triggerMockSocketStream = () => {
    const id = crypto.randomUUID();
    const fileName = "Realtime_Socket_Indexed_Doc.pdf";

    // Initialize store item at 10%
    useUploadStore.setState((state) => ({
      uploads: [
        {
          id,
          fileName,
          progress: 10,
          status: "processing",
          step: "UPLOADING_FILE",
          message: "Validating storage quota and format...",
        },
        ...state.uploads,
      ],
    }));

    toast.info("Socket.IO Stream Simulation Started", {
      description: `Watch background widget cycle through 5 RAG indexing stages for '${fileName}'.`,
    });

    const stages = [
      {
        step: "EXTRACTING_TEXT",
        progress: 25,
        message: "Extracting text and outline...",
      },
      {
        step: "CHUNKING_TEXT",
        progress: 50,
        message: "Generating text chunks...",
      },
      {
        step: "GENERATING_EMBEDDINGS",
        progress: 65,
        message: "Generating embeddings for 34 chunks...",
      },
      {
        step: "UPSERTING_VECTORS",
        progress: 85,
        message: "Upserting vectors (batch 1/2)",
      },
      {
        step: "UPSERTING_VECTORS",
        progress: 95,
        message: "Upserting vectors (batch 2/2)",
      },
      {
        step: "COMPLETED",
        progress: 100,
        message: "Upload completed successfully",
        status: "success",
      },
    ];

    stages.forEach((stage, index) => {
      setTimeout(
        () => {
          useUploadStore.setState((state) => ({
            uploads: state.uploads.map((item) =>
              item.id === id
                ? {
                    ...item,
                    progress: stage.progress,
                    status: (stage.status as any) || "processing",
                    step: stage.step,
                    message: stage.message,
                  }
                : item,
            ),
          }));
        },
        (index + 1) * 7500,
      );
    });
  };

  const triggerMockBatchUpload = () => {
    const newItems = [
      {
        id: crypto.randomUUID(),
        fileName: "Linear_Algebra_Notes.pdf",
        progress: 65,
        status: "processing" as const,
        message: "Generating AI embeddings...",
      },
      {
        id: crypto.randomUUID(),
        fileName: "Microeconomics_Quiz_1.pdf",
        progress: 100,
        status: "success" as const,
        message: "Upload completed successfully",
      },
      {
        id: crypto.randomUUID(),
        fileName: "Scanned_Book_Pages.pdf",
        progress: 30,
        status: "failed" as const,
        error: "OCR extraction failed",
      },
    ];

    useUploadStore.setState((state) => ({
      uploads: [...state.uploads, ...newItems],
    }));

    toast.success("Batch Upload Triggered", {
      description: "Added 3 files to the background upload drawer.",
    });
  };

  const triggerMockConflict = () => {
    const conflictId = crypto.randomUUID();
    const mockFileName = "Database_Systems_Notes.pdf";

    useUploadStore.setState((state) => ({
      stagedConflicts: {
        ...state.stagedConflicts,
        [conflictId]: {
          id: conflictId,
          payload: {
            file: new File(["mock binary content"], mockFileName, {
              type: "application/pdf",
            }),
            title: "Database Systems Notes",
          },
          existingDocumentMeta: {
            id: "doc-999",
            fileName: mockFileName,
            title: "Database Systems Notes",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fileSize: 1048576,
            mimeType: "application/pdf",
          } as any,
        },
      },
    }));

    toast.warning("Duplicate File Conflict Simulated", {
      description: `Conflict modal for '${mockFileName}' is now active.`,
    });
  };

  const clearAllUploads = () => {
    useUploadStore.setState({ uploads: [], stagedConflicts: {} });
    toast.info("Upload Manager Reset", {
      description: "Cleared all background upload items and conflict modals.",
    });
  };

  // ----------------------------------------------------
  // Mock Artifact Record for Tool Card
  // ----------------------------------------------------
  const mockArtifactContent: ArtifactContent = {
    root: {
      label: "Data Structures & Trees",
      children: [
        {
          label: "Binary Trees",
          children: [
            { label: "Traversal Algorithms" },
            { label: "Balanced Trees" },
          ],
        },
        {
          label: "Graphs",
          children: [
            { label: "DFS & BFS" },
            { label: "Shortest Path Algorithms" },
          ],
        },
      ],
    },
  };

  const mockArtifactRecord: ArtifactRecord = {
    _id: "art-demo-001",
    userId: "user-demo-123",
    sourceDocumentIds: ["doc-1", "doc-2"],
    type: "MINDMAP",
    title: "Data Structures & Trees Mindmap",
    content: mockArtifactContent,
    status:
      cardStatus === "COMPLETED"
        ? "COMPLETED"
        : cardStatus === "GENERATING"
          ? "GENERATING"
          : "FAILED",
    error:
      cardStatus === "FAILED"
        ? "Generation timed out after 30 seconds."
        : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 space-y-10 max-w-6xl mx-auto pb-24">
      <PageHeader
        title="Toast Playground"
        description="Interactive sandbox demonstrating notifications, background document upload widgets, conflict resolution, and artifact creation dialogs."
      />

      {/* SECTION 1: TOAST NOTIFICATION SYSTEM */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            1. Toast Notifications (Sonner + richColors)
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sonner Standard Tones */}
          <Card className="border-border shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Standard Toast Tones</CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  richColors: true
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Triggers styled alert toasts powered by Sonner with full color
                palette themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  className="justify-start gap-2 border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={triggerSonnerSuccess}
                >
                  <CheckCircle2 className="size-4" />
                  Success
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-destructive/40 hover:bg-destructive/10 text-destructive"
                  onClick={triggerSonnerError}
                >
                  <XCircle className="size-4" />
                  Error
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  onClick={triggerSonnerWarning}
                >
                  <AlertTriangle className="size-4" />
                  Warning
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 border-sky-500/40 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  onClick={triggerSonnerInfo}
                >
                  <Info className="size-4" />
                  Info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Toast Features */}
          <Card className="border-border shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Advanced Toast Actions
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  Async & Actions
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Supports interactive undo buttons, loading state updates, and
                promise resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs justify-center"
                  onClick={triggerSonnerAction}
                >
                  With Action (Undo)
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs justify-center gap-1.5"
                  onClick={triggerSonnerLoading}
                  disabled={loadingToastId !== null}
                >
                  {loadingToastId !== null ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : null}
                  Loading State
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs justify-center"
                  onClick={triggerSonnerPromise}
                >
                  Promise Toast
                </Button>
              </div>

              <div className="pt-3 border-t">
                <Button
                  className="w-full gap-2"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    triggerCustomToast("info");
                    setTimeout(() => triggerCustomToast("warning"), 120);
                    setTimeout(() => triggerCustomToast("error"), 240);
                    setTimeout(() => triggerCustomToast("success"), 360);
                  }}
                >
                  <Sparkles className="size-4 text-primary" />
                  Fire Cascade of Toasts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 2: DOCUMENT UPLOAD WIDGETS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UploadCloud className="size-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            2. Document Upload Widgets
          </h2>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Background Upload Manager & Conflict Modal</span>
              <Badge variant="outline" className="font-mono text-xs">
                BackgroundUploadWidget + ConflictModal
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Clicking these buttons pushes items to{" "}
              <code className="bg-muted px-1 rounded">useUploadStore</code>,
              bringing up the bottom-right upload manager widget or filename
              conflict modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="gap-2 justify-start border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-medium"
                onClick={triggerMockSocketStream}
              >
                <Sparkles className="size-4 text-primary animate-pulse" />
                Simulate Real-Time Socket Stream
              </Button>

              <Button
                variant="outline"
                className="gap-2 justify-start"
                onClick={triggerMockUpload}
              >
                <FilePlus className="size-4 text-primary" />
                Simulate Single Upload
              </Button>

              <Button
                variant="outline"
                className="gap-2 justify-start"
                onClick={triggerMockBatchUpload}
              >
                <UploadCloud className="size-4 text-sky-600" />
                Simulate Batch Upload (3 Files)
              </Button>

              <Button
                variant="outline"
                className="gap-2 justify-start border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={triggerMockConflict}
              >
                <AlertOctagon className="size-4 text-amber-500" />
                Trigger Duplicate Conflict Modal
              </Button>

              <Button
                variant="ghost"
                className="gap-2 justify-start text-destructive hover:bg-destructive/10 sm:col-span-2 lg:col-span-4"
                onClick={clearAllUploads}
              >
                <Trash2 className="size-4" />
                Clear Upload Manager
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3: ARTIFACT CREATION & TOOL WIDGETS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            3. AI Artifact Creation & Tool Cards
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Artifact Dialog Trigger */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Create Artifact Dialog</CardTitle>
              <CardDescription className="text-xs">
                Opens the creation dialog where users provide optional focus
                instructions before generating study materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Select artifact type to test dialog:
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_META) as ArtifactType[]).map((type) => {
                  const meta = TYPE_META[type];
                  const Icon = meta.icon;
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setActiveArtifactType(type)}
                    >
                      <Icon className="size-3.5 text-primary" />
                      {meta.label}
                    </Button>
                  );
                })}
              </div>

              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full justify-center"
                  onClick={() => setShareDialogOpen(true)}
                >
                  <Share2 className="size-4 text-primary" />
                  Test Artifact Share Dialog
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Artifact Tool Card Widget Preview */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Artifact Tool Card States
                </CardTitle>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    size="xs"
                    variant={cardStatus === "GENERATING" ? "default" : "ghost"}
                    onClick={() => setCardStatus("GENERATING")}
                  >
                    Generating
                  </Button>
                  <Button
                    size="xs"
                    variant={cardStatus === "COMPLETED" ? "default" : "ghost"}
                    onClick={() => setCardStatus("COMPLETED")}
                  >
                    Completed
                  </Button>
                  <Button
                    size="xs"
                    variant={cardStatus === "FAILED" ? "default" : "ghost"}
                    onClick={() => setCardStatus("FAILED")}
                  >
                    Failed
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Inline widget rendered inside AI chat threads to indicate
                artifact generation status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mock Render of Artifact Card */}
              {cardStatus === "GENERATING" && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Loader2 className="size-4.5 animate-spin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {mockArtifactRecord.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Generating mindmap in background...
                    </div>
                  </div>
                </div>
              )}

              {cardStatus === "COMPLETED" && (
                <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-xs transition-colors hover:bg-muted/50 cursor-pointer">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <BrainCircuit className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {mockArtifactRecord.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Click to view mindmap
                    </div>
                  </div>
                </div>
              )}

              {cardStatus === "FAILED" && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive shadow-xs">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/15">
                    <AlertTriangle className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {mockArtifactRecord.title}
                    </div>
                    <div className="text-xs opacity-90">
                      {mockArtifactRecord.error}
                    </div>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/20"
                    onClick={() => setCardStatus("GENERATING")}
                  >
                    <RotateCw className="size-3.5" />
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RENDER MODAL DIALOGS WHEN ACTIVE */}
      <CreateArtifactDialog
        type={activeArtifactType}
        onClose={() => setActiveArtifactType(null)}
        sources={[
          { id: "src-1", title: "mln chuong 2", subtitle: "MLN122 · CHƯƠNG 2" },
          {
            id: "src-2",
            title: "Data_Structures_Lecture_4.pdf",
            subtitle: "CS201 · TREES & GRAPHS",
          },
          {
            id: "src-3",
            title: "Linear_Algebra_Review.pdf",
            subtitle: "MATH102 · VECTORS & MATRICES",
          },
        ]}
        onCreate={async (type, instructions, scopeOptions) => {
          const docCount = scopeOptions?.documentIds?.length ?? 0;
          const scopeLabel =
            docCount > 0 ? `${docCount} document(s)` : "Conversation history";
          toast.success(`Started generating ${TYPE_META[type].label}!`, {
            description: `Source scope: ${scopeLabel}${instructions ? ` | Focus: "${instructions}"` : ""}`,
          });
        }}
      />

      <SummaryShareDialog
        artifactId={shareDialogOpen ? "mock-artifact-123" : null}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="Sample AI Summary Artifact"
      />
    </div>
  );
}
