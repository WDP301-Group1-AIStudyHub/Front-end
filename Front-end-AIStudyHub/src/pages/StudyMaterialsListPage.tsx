import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getAllStudyMaterials,
  deleteStudyMaterial,
  generateStudyMaterial,
  type StudyMaterial,
  type MaterialType,
} from "../services/studyMaterialApi";
import { listDocuments } from "../services/documentApi";
import { listSubjects, type SubjectItem } from "../services/subjectApi";
import { useStudyMaterialStore } from "../store/useStudyMaterialStore";
import {
  Search,
  Play,
  Trash2,
  AlertCircle,
  Clock3,
  Brain,
  HelpCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudyMaterialsListPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MCQ" | "FLASHCARD">("ALL");

  // Customise modal state
  const [isCustomiseOpen, setIsCustomiseOpen] = useState(false);
  const [customiseType, setCustomiseType] = useState<MaterialType | null>(null);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");
  const [topicFocus, setTopicFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addTask = useStudyMaterialStore((state) => state.addTask);

  // Check for prefilled creation state from Router state
  useEffect(() => {
    const state = location.state as {
      prefillDocId?: string;
      prefillTopicFocus?: string;
      prefillType?: MaterialType;
    } | null;

    if (state && state.prefillDocId && state.prefillType) {
      handleOpenCustomise(state.prefillType, state.prefillDocId, state.prefillTopicFocus);
      // Clear out state so it doesn't pop up again on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const data = await getAllStudyMaterials();
        if (!isCancelled) {
          setMaterials(data);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load study materials");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchMaterials();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Polling for generating items in the list to update progress in real-time
  useEffect(() => {
    const hasGenerating = materials.some(
      (m) => m.status === "PENDING" || m.status === "GENERATING"
    );
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await getAllStudyMaterials();
        setMaterials(fresh);
      } catch (err) {
        console.error("Failed to poll study materials list:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [materials]);

  const handleOpenCustomise = async (type: MaterialType, prefillDocId?: string, prefillTopicFocus?: string) => {
    setCustomiseType(type);
    setIsCustomiseOpen(true);
    setSelectedDocId(prefillDocId || "");
    setSelectedSubjectId("");
    setQuestionCount(10);
    setDifficulty("Medium");
    setTopicFocus(prefillTopicFocus || "");
    
    try {
      setDocumentsLoading(true);
      setSubjectsLoading(true);
      const [docs, subjs] = await Promise.all([listDocuments(), listSubjects()]);
      setAvailableDocs(docs || []);
      setSubjects(subjs || []);

      if (prefillDocId && docs) {
        const foundDoc = docs.find((d: any) => d._id === prefillDocId || d.id === prefillDocId);
        if (foundDoc) {
          const subId = foundDoc.subjectId || (foundDoc.subject && typeof foundDoc.subject === "object" ? foundDoc.subject._id : "");
          setSelectedSubjectId(subId);
        }
      }
    } catch (err) {
      console.error("Failed to load documents or subjects for creation:", err);
    } finally {
      setDocumentsLoading(false);
      setSubjectsLoading(false);
    }
  };

  const handleCloseCustomise = () => {
    setIsCustomiseOpen(false);
    setCustomiseType(null);
    setSelectedSubjectId("");
  };

  const handleGenerate = async () => {
    if (!selectedDocId || !customiseType) return;
    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await generateStudyMaterial(
        selectedDocId,
        customiseType,
        questionCount,
        difficulty,
        topicFocus.trim() || undefined
      );

      // Register task with the global Zustand polling manager
      addTask({
        id: result._id || result.id,
        documentId: result.documentId,
        title: result.title,
        type: result.type,
        status: result.status,
      });

      // Reload the local lists
      const nextMaterials = await getAllStudyMaterials();
      setMaterials(nextMaterials);
      
      handleCloseCustomise();
    } catch (err: any) {
      setError(err.message || "Failed to generate study material");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this study set?")) {
      try {
        await deleteStudyMaterial(id);
        setMaterials((prev) => prev.filter((m) => m._id !== id && m.id !== id));
      } catch (err: any) {
        alert(err.message || "Failed to delete study material");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <main className="botanical-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground font-sans">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        
        {/* Header */}
        <header className="flex flex-col gap-2">
          <span className="botanical-kicker flex items-center gap-1.5 justify-start">
            <Brain className="size-4 text-primary" />
            AI Practice Hub
          </span>
          <h1 className="moonlit-title break-words text-3xl font-black tracking-tight md:text-5xl">
            Study Materials
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Generate and practice multiple choice quizzes and flip flashcard decks based on your library documents.
          </p>
        </header>

        {/* Action Buttons Cards (Image-2 Style) */}
        <section className="grid gap-4 sm:grid-cols-2 mt-2">
          {/* MCQ Button */}
          <button
            onClick={() => handleOpenCustomise("MCQ")}
            className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card text-left hover:border-primary/60 hover:shadow-md hover:bg-muted/10 transition-all group focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <HelpCircle className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Create MCQ Quiz</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate practice quizzes with multiple-choice questions, detailed explanations, and score tracking.
              </p>
            </div>
          </button>

          {/* Flashcard Button */}
          <button
            onClick={() => handleOpenCustomise("FLASHCARD")}
            className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card text-left hover:border-primary/60 hover:shadow-md hover:bg-muted/10 transition-all group focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <Brain className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Create Flashcard Deck</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate flip flashcards for active recall and studying vocabulary or key concepts.
              </p>
            </div>
          </button>
        </section>

        {/* Filter Toolbar */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card border border-border p-4 rounded-2xl mt-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search study sets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-2">
            {(["ALL", "MCQ", "FLASHCARD"] as const).map((filter) => {
              const label = filter === "ALL" ? "All" : filter === "MCQ" ? "Quizzes" : "Flashcards";
              const isActive = typeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* List Content */}
        {error && (
          <div className="moonlit-card tone-surface tone-coral px-4 py-3 text-sm flex items-center gap-2" role="alert">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="botanical-card p-5 space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl my-4 space-y-4">
                <HelpCircle className="size-12 text-muted-foreground/60" />
                <h3 className="text-lg font-bold">No study sets found</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-normal">
                  {materials.length === 0
                    ? "You haven't generated any practice materials yet. Click one of the buttons above to generate a new quiz or flashcard deck."
                    : "No study materials match your current search queries or filters."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                {filteredMaterials.map((mat) => {
                  const isSuccess = mat.status === "COMPLETED";
                  const isGenerating = mat.status === "PENDING" || mat.status === "GENERATING";
                  const isFailed = mat.status === "FAILED";

                  return (
                    <div
                      key={mat._id || mat.id}
                      className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            mat.type === "MCQ"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              : "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                          }`}>
                            {mat.type === "MCQ" ? "Quiz" : "Flashcards"}
                          </span>

                          {isGenerating && (
                            <span className="flex items-center gap-1 text-2xs text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                              <Clock3 className="size-3" />
                              Generating
                            </span>
                          )}

                          {isFailed && (
                            <span className="flex items-center gap-1 text-2xs text-red-700 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                              <AlertCircle className="size-3" />
                              Failed
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">
                          {mat.title}
                        </h3>

                        <p className="text-2xs text-muted-foreground">
                          Generated on {formatDate(mat.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/60">
                        {isSuccess ? (
                          <Button size="sm" asChild className="flex-1 font-bold text-xs">
                            <Link to={`/library/study/${mat._id || mat.id}`}>
                              <Play className="size-3.5 mr-1.5" />
                              Practice
                            </Link>
                          </Button>
                        ) : isGenerating ? (
                          <Button size="sm" variant="outline" disabled className="flex-1 text-xs">
                            <Clock3 className="size-3.5 mr-1.5 animate-spin" />
                            Processing
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled className="flex-1 text-xs">
                            Failed set
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleDelete(mat._id || mat.id, e)}
                          className="size-8 hover:text-red-650 hover:bg-red-500/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Customize Dialog (Image-1 Style Popover Modal) */}
      {isCustomiseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Dialog Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
              <div className="flex items-center gap-2">
                {customiseType === "MCQ" ? (
                  <HelpCircle className="size-5 text-blue-500" />
                ) : (
                  <Brain className="size-5 text-purple-500" />
                )}
                <h2 className="text-lg font-black text-foreground">
                  Customise {customiseType === "MCQ" ? "quiz" : "flashcards"}
                </h2>
              </div>
              <button
                onClick={handleCloseCustomise}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-5">
              {/* Subject Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Select Subject
                </label>
                {subjectsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedDocId(""); // Reset document when subject changes
                    }}
                    className="w-full min-h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose a subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name} {sub.code ? `(${sub.code})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Document Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Select Source Document
                </label>
                {documentsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={!selectedSubjectId}
                    className="w-full min-h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!selectedSubjectId ? (
                      <option value="">-- Choose a subject first --</option>
                    ) : (
                      <>
                        <option value="">-- Choose a document --</option>
                        {availableDocs
                          .filter((doc) => {
                            const docSubId = doc.subjectId || (doc.subject && typeof doc.subject === "object" ? doc.subject._id : doc.subject);
                            return docSubId === selectedSubjectId;
                          })
                          .map((doc) => {
                            const isExtracted = doc.extractionStatus === "COMPLETED";
                            return (
                              <option key={doc._id || doc.id} value={doc._id || doc.id} disabled={!isExtracted}>
                                {doc.title} {!isExtracted ? " (Processing/Not extracted)" : ""}
                              </option>
                            );
                          })}
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Number of questions */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Number of {customiseType === "MCQ" ? "questions" : "cards"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Fewer", value: 5 },
                    { label: "Standard", value: 10 },
                    { label: "More", value: 15 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuestionCount(opt.value)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        questionCount === opt.value
                          ? "bg-primary border-primary text-primary-foreground font-black"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label} ({opt.value})
                    </button>
                  ))}
                </div>
              </div>

              {/* Level of difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Level of difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Easy", value: "Easy" },
                    { label: "Medium", value: "Medium" },
                    { label: "Hard", value: "Hard" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDifficulty(opt.value)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        difficulty === opt.value
                          ? "bg-primary border-primary text-primary-foreground font-black"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic focus */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  What should the topic be?
                </label>
                <textarea
                  value={topicFocus}
                  onChange={(e) => setTopicFocus(e.target.value)}
                  placeholder="Things to try:
• Create a quiz to help me prepare for my history exam on Ancient Egypt
• Focus solely on key concepts of physics
• Restrict questions to specific sections"
                  className="w-full min-h-24 p-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border/80 px-6 py-4 bg-muted/20">
              <Button variant="secondary" onClick={handleCloseCustomise}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedDocId || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

