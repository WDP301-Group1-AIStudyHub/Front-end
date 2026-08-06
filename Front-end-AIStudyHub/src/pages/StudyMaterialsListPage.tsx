import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
 getAllStudyMaterials,
 deleteStudyMaterial,
 generateStudyMaterial,
 type StudyMaterial,
 type MaterialType,
} from "@/services/studyMaterialApi";
import { listDocuments } from "@/services/documentApi";
import { listSubjects, type SubjectItem } from "@/services/subjectApi";
import { useStudyMaterialStore } from "@/store/useStudyMaterialStore";
import {
 Search,
 Play,
 Trash2,
 AlertCircle,
 Clock3,
 Brain,
 HelpCircle,
 X,
 Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAllProgress, type StudyProgressData } from "@/hooks/useStudyProgress";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";

export default function StudyMaterialsListPage() {
 const location = useLocation();
 const navigate = useNavigate();

 const [materials, setMaterials] = useState<StudyMaterial[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 
 const [progressData, setProgressData] = useState<Record<string, StudyProgressData>>({});

 
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
 
 // Refresh progress data on focus or mount
 const handleFocus = () => setProgressData(getAllProgress());
 window.addEventListener("focus", handleFocus);
 setProgressData(getAllProgress());

 return () => {
 isCancelled = true;
 window.removeEventListener("focus", handleFocus);
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
 documentId: result.documentId || selectedDocId,
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

 const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

 const handleDelete = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 e.preventDefault();
 setDeleteTargetId(id);
 };

 const confirmDelete = async () => {
 if (!deleteTargetId) return;
 try {
 await deleteStudyMaterial(deleteTargetId);
 setMaterials((prev) => prev.filter((m) => m._id !== deleteTargetId && m.id !== deleteTargetId));
 } catch (err: any) {
 toast.error(err.message || "Failed to delete study material");
 } finally {
 setDeleteTargetId(null);
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
    <PageShell>
      <PageHeader
        title="Study Materials"
        description="Generate and practice multiple choice quizzes and flip flashcard decks based on your library documents."
      />

 <section className="flex flex-col gap-2 border-y border-border py-4 sm:flex-row">
 {/* MCQ Button */}
 <button
 onClick={() => handleOpenCustomise("MCQ")}
 className="group flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
 >
 <div className="rounded-md bg-blue-500/10 p-2 text-blue-700 transition-colors">
 <HelpCircle className="size-5" />
 </div>
 <div className="space-y-1">
 <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Create MCQ Quiz</h3>
 <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
 Generate practice quizzes with multiple-choice questions, detailed explanations, and score tracking.
 </p>
 </div>
 </button>

 {/* Flashcard Button */}
 <button
 onClick={() => handleOpenCustomise("FLASHCARD")}
 className="group flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
 >
 <div className="rounded-md bg-purple-500/10 p-2 text-purple-700 transition-colors">
 <Brain className="size-5" />
 </div>
 <div className="space-y-1">
 <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Create Flashcard Deck</h3>
 <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
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
 <Button key={filter} onClick={() => setTypeFilter(filter)} aria-pressed={isActive} className="px-4 text-xs" size="sm" type="button" variant={isActive ? "default" : "outline"}>
 {label}
 </Button>
 );
 })}
 </div>
 </section>

 {/* List Content */}
 {error && (
 <Alert variant="destructive" className="mb-4">
 <AlertCircle className="size-4" />
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 {isLoading ? (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
 {Array.from({ length: 6 }).map((_, idx) => (
 <div key={idx} className="p-5 space-y-4">
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
 className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-5 shadow-sm transition-shadow relative overflow-hidden"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between gap-2">
 <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
 mat.type === "MCQ"
 ? "bg-blue-500/10 text-blue-700 "
 : "bg-purple-500/10 text-purple-700 "
 }`}>
 {mat.type === "MCQ" ? "Quiz" : "Flashcards"}
 </span>

 {isGenerating && (
 <Button size="sm" variant="outline" disabled className="flex-1 text-xs">
 <Clock3 className="size-3.5 mr-1.5 animate-spin" />
 {isGenerating ? "Generating..." : "Generate"}
 </Button>
 )}

 {isGenerating && (
 <span className="flex items-center gap-1 text-2xs text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
 <Clock3 className="size-3" />
 Generating
 </span>
 )}

 {isFailed && (
 <span className="flex items-center gap-1 text-2xs text-red-700 bg-red-500/10 px-2 py-0.5 rounded-full">
 <AlertCircle className="size-3" />
 Failed
 </span>
 )}

 {mat.sourceStatus === "DELETED" && (
 <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
 <AlertCircle className="size-3" />
 Source deleted
 </span>
 )}
 </div>

 <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">
 {mat.title}
 </h3>

 {isSuccess && progressData[mat._id || mat.id] && (
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-1.5 rounded-lg border border-border/50">
 <Target className="size-3.5 text-primary" />
 {progressData[mat._id || mat.id].isFinished ? (
 <span className="font-bold text-emerald-600 ">Completed</span>
 ) : (
 <span className="font-medium text-foreground">
 In Progress: <span className="font-bold">{progressData[mat._id || mat.id].currentIndex}</span> / {progressData[mat._id || mat.id].totalItems}
 </span>
 )}
 </div>
 )}

 <p className="text-2xs text-muted-foreground mt-1">
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

 {/* Customize Dialog (Image-1 Style Popover Modal) */}
 {isCustomiseOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
 <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200">
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
 <Button onClick={handleCloseCustomise} aria-label="Actions" className="text-muted-foreground" size="icon-sm" variant="ghost">
 <X className="size-5" />
 </Button>
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
 <Select
 value={selectedSubjectId || "none"}
 onValueChange={(val) => {
 setSelectedSubjectId(val === "none" ? "" : val);
 setSelectedDocId(""); // Reset document when subject changes
 }}
 >
 <SelectTrigger className="w-full h-10">
 <SelectValue placeholder="-- Choose a subject --" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">-- Choose a subject --</SelectItem>
 {subjects.map((sub) => (
 <SelectItem key={sub._id} value={sub._id}>
 {sub.name} {sub.code ? `(${sub.code})` : ""}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
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
 <Select
 value={selectedDocId || "none"}
 onValueChange={(val) => setSelectedDocId(val === "none" ? "" : val)}
 disabled={!selectedSubjectId}
 >
 <SelectTrigger className="w-full h-10">
 <SelectValue placeholder={!selectedSubjectId ? "-- Choose a subject first --" : "-- Select a document --"} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="none">
 {!selectedSubjectId ? "-- Choose a subject first --" : "-- Select a document --"}
 </SelectItem>
 {availableDocs
 .filter((doc) => {
 const docSubId = doc.subjectId || (doc.subject && typeof doc.subject === "object" ? doc.subject._id : doc.subject);
 return docSubId === selectedSubjectId;
 })
 .map((doc) => {
 const isExtracted = doc.extractionStatus === "COMPLETED";
 return (
 <SelectItem key={doc._id || doc.id} value={doc._id || doc.id} disabled={!isExtracted}>
 {doc.title} {!isExtracted ? " (Processing/Not extracted)" : ""}
 </SelectItem>
 );
 })}
 </SelectContent>
 </Select>
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
 <Button key={opt.value} type="button" onClick={() => setQuestionCount(opt.value)} aria-pressed={questionCount === opt.value} className="px-3 text-xs" size="sm" variant={questionCount === opt.value ? "default" : "outline"}>
 {opt.label} ({opt.value})
 </Button>
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
 <Button key={opt.value} type="button" onClick={() => setDifficulty(opt.value)} aria-pressed={difficulty === opt.value} className="px-3 text-xs" size="sm" variant={difficulty === opt.value ? "default" : "outline"}>
 {opt.label}
 </Button>
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
 <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete study set?</AlertDialogTitle>
 <AlertDialogDescription>
 Are you sure you want to delete this study set? This action cannot be undone.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </PageShell>
 );
}
