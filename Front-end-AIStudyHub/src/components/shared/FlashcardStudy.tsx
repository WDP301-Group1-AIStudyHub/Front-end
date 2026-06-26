import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  type IFlashcardItem,
  type StudyMaterial,
  explainCardConcept,
} from "../../services/studyMaterialApi";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Sparkles,
  MoreVertical,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardStudyProps {
  material: StudyMaterial;
  title: string;
}

export default function FlashcardStudy({ material, title }: FlashcardStudyProps) {
  const navigate = useNavigate();

  // Active recall deck state (supports filtering by missed)
  const [activeItems, setActiveItems] = useState<IFlashcardItem[]>(
    (material.items || []) as IFlashcardItem[]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Ratings: Record<itemIndex, "GOT_IT" | "MISSED_IT" | "SKIPPED">
  const [ratings, setRatings] = useState<Record<number, "GOT_IT" | "MISSED_IT" | "SKIPPED">>({});

  // Elapsed Timer state
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Explanation Concept state
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Selected follow-up topic state
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);

  // Timer Effect
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, isFinished]);

  // Keyboard Navigation listener
  useEffect(() => {
    if (isFinished || isExplainModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFinished, isExplainModalOpen, activeItems]);

  if (activeItems.length === 0) {
    return (
      <div className="moonlit-card p-8 text-center text-muted-foreground font-sans">
        No flashcards found.
      </div>
    );
  }

  const currentCard = activeItems[currentIndex];

  const handleNext = () => {
    if (currentIndex < activeItems.length - 1) {
      setIsFlipped(false);
      setShowMenu(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    } else {
      // End of deck reached
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setShowMenu(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
      }, 150);
    }
  };

  const handleRate = (e: React.MouseEvent, rating: "GOT_IT" | "MISSED_IT") => {
    e.stopPropagation();
    setRatings((prev) => ({
      ...prev,
      [currentIndex]: rating,
    }));
    handleNext();
  };

  const handleExplain = async () => {
    try {
      setIsExplainModalOpen(true);
      setExplanationLoading(true);
      setExplanationText(null);
      const explanation = await explainCardConcept(material._id || material.id, currentIndex);
      setExplanationText(explanation);
    } catch (err: any) {
      setExplanationText(err.message || "Failed to fetch grounded explanation from document.");
    } finally {
      setExplanationLoading(false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs} secs`;
  };

  // Stats
  const gotItCount = Object.values(ratings).filter((r) => r === "GOT_IT").length;
  const missedItCount = Object.values(ratings).filter((r) => r === "MISSED_IT").length;
  const skippedCount = activeItems.length - gotItCount - missedItCount;
  const accuracyPercent = Math.round((gotItCount / activeItems.length) * 100) || 0;

  // Re-practice modes
  const restartAll = () => {
    setActiveItems((material.items || []) as IFlashcardItem[]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsFinished(false);
    setShowReport(false);
  };

  const restartShuffled = () => {
    const shuffled = [...(material.items || [])].sort(() => Math.random() - 0.5) as IFlashcardItem[];
    setActiveItems(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsFinished(false);
    setShowReport(false);
  };

  const restartMissed = () => {
    const missed = activeItems.filter((_, idx) => ratings[idx] === "MISSED_IT");
    if (missed.length === 0) {
      alert("No missed cards to practice!");
      return;
    }
    setActiveItems(missed);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRatings({});
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsFinished(false);
    setShowReport(false);
  };

  const handleGenerateFollowUp = () => {
    if (!selectedFollowUp) return;
    // Redirect user to study materials lists page and prefill follow-up topic
    navigate("/study-materials", {
      state: {
        prefillDocId: material.documentId,
        prefillType: "FLASHCARD",
        prefillTopicFocus: `Focus specifically on: ${selectedFollowUp}`,
      },
    });
  };

  // 1. Session Ended Summary overlay (Image 2)
  if (isFinished && !showReport) {
    const radius = 55;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (accuracyPercent / 100) * circumference;

    return (
      <div className="w-[min(100%,480px)] font-sans mx-auto botanical-bento p-8 text-center space-y-6 shadow-2xl relative overflow-hidden bg-card/95 border border-border">
        {/* Soft glowing effect */}
        <div className="absolute -top-24 -left-24 size-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <h2 className="text-2xl font-black text-foreground tracking-tight">
          {accuracyPercent >= 70 ? "Fantastic Effort!" : "You'll get it next time"}
        </h2>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center py-4">
          <svg className="size-36 -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-muted/20"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-primary transition-all duration-500 ease-in-out"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-foreground">{gotItCount}/{activeItems.length}</span>
            <span className="text-xs font-bold text-primary">{accuracyPercent}% accuracy</span>
            <span className="text-3xs text-muted-foreground flex items-center gap-1 mt-0.5 uppercase tracking-wide">
              <Clock className="size-3" />
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-muted/20 border border-border/80 rounded-xl p-4 text-sm font-semibold">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Got it</div>
            <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">{gotItCount}</div>
          </div>
          <div className="text-center border-x border-border/50">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Missed it</div>
            <div className="mt-1 text-lg font-black text-red-500 dark:text-red-400">{missedItCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Skipped</div>
            <div className="mt-1 text-lg font-black text-muted-foreground">{skippedCount}</div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button onClick={() => setShowReport(true)} className="w-full font-bold">
            See full report
          </Button>
          <Button variant="secondary" onClick={restartAll} className="w-full">
            <RotateCcw className="size-4 mr-2" />
            Practise again
          </Button>
        </div>
      </div>
    );
  }

  // 2. Full Report Panel (Image 1)
  if (isFinished && showReport) {
    const radius = 45;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (accuracyPercent / 100) * circumference;

    const topicsList = material.topicsCovered && material.topicsCovered.length > 0
      ? material.topicsCovered
      : ["General facts and concepts"];
    const followUps = material.followUpTopics && material.followUpTopics.length > 0
      ? material.followUpTopics
      : ["Advanced applications", "Key vocabulary terms", "Formulas and practices"];

    return (
      <div className="w-full max-w-2xl font-sans mx-auto botanical-bento p-6 space-y-6 shadow-2xl bg-card border border-border">
        {/* Top Mini-Stats Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/15 border border-border/80 rounded-2xl p-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <svg className="size-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-muted/20"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-primary"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-foreground">{accuracyPercent}%</span>
                <span className="text-4xs text-muted-foreground uppercase">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Practice Session Finished</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed {activeItems.length} cards based on your library document.
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-center font-semibold text-xs border-t sm:border-t-0 sm:border-l border-border/60 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-around">
            <div>
              <span className="text-muted-foreground">Got it:</span>
              <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-black">{gotItCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Missed:</span>
              <span className="ml-1.5 text-red-500 dark:text-red-400 font-black">{missedItCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Skipped:</span>
              <span className="ml-1.5 text-muted-foreground font-black">{skippedCount}</span>
            </div>
          </div>
        </div>

        {/* Two Column Coverages & Keep Learning layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Topics Covered */}
          <div className="space-y-3 bg-muted/10 p-5 rounded-2xl border border-border/65">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Topics covered
            </h4>
            <ul className="space-y-2 text-sm leading-relaxed text-foreground">
              {topicsList.map((topic, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1 font-bold">•</span>
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 text-xs text-muted-foreground leading-normal">
              Need more topics? You can always generate a new flashcard set focusing on customized contexts.
            </div>
          </div>

          {/* Keep Learning / Follow-up */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Keep learning
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                Select a follow-up topic below and generate a new set of flashcards to deepen your study.
              </p>
              <div className="space-y-2">
                {followUps.map((topic, i) => {
                  const isSelected = selectedFollowUp === topic;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedFollowUp(topic)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleGenerateFollowUp}
              disabled={!selectedFollowUp}
              className="w-full text-xs font-bold"
            >
              Generate flashcards
              <ChevronRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Practice Modes footer */}
        <div className="space-y-3 pt-4 border-t border-border/80">
          <h4 className="text-2xs font-black uppercase tracking-wider text-muted-foreground text-center">
            Practise again
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={restartAll} className="text-2xs font-bold py-2">
              All Cards
            </Button>
            <Button variant="outline" size="sm" onClick={restartShuffled} className="text-2xs font-bold py-2">
              Shuffle Cards
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={restartMissed}
              disabled={missedItCount === 0}
              className="text-2xs font-bold py-2"
            >
              Missed Only ({missedItCount})
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Interactive recall screen (Image 3)
  const progressPercent = Math.round(((currentIndex + 1) / activeItems.length) * 100);

  return (
    <div className="mx-auto max-w-xl w-full space-y-5 font-sans relative">
      <style>{`
        .flashcard-perspective {
          perspective: 1000px;
        }
        .flashcard-preserve {
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .flashcard-preserve.is-flipped {
          transform: rotateY(180deg);
        }
        .flashcard-face {
          backface-visibility: hidden;
          position: absolute;
          inset: 0;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Header and Keyboard shortcuts */}
      <div className="flex flex-col items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/60 select-none pb-1">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <span>Press 'Space' to flip, '←' / '→' to navigate</span>
      </div>

      {/* Interactive 3D Card (Image 3 Style) */}
      <div
        className="flashcard-perspective w-full h-[320px] cursor-pointer relative"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Soft glowing background behind card */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-sky-500/5 to-purple-500/15 blur-lg pointer-events-none opacity-80" />

        <div
          className={`flashcard-preserve w-full h-full relative rounded-2xl border border-border/80 bg-card shadow-lg ${
            isFlipped ? "is-flipped" : ""
          }`}
        >
          {/* Card Front */}
          <div className="flashcard-face absolute inset-0 p-8 flex flex-col justify-between items-center text-center">
            <div className="w-full flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-black">
                {currentIndex + 1} / {activeItems.length}
              </span>
              
              {/* Three dot action menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <MoreVertical className="size-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-7 z-10 w-36 bg-card border border-border rounded-xl shadow-lg p-1 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        handleExplain();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-lg flex items-center gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      Explain Concept
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 flex items-center justify-center py-4">
              <h3 className="text-lg md:text-xl font-bold leading-snug text-foreground max-w-sm">
                {currentCard.front}
              </h3>
            </div>

            <span className="text-2xs text-muted-foreground/60 select-none">
              See answer
            </span>
          </div>

          {/* Card Back */}
          <div className="flashcard-face flashcard-back absolute inset-0 p-8 flex flex-col justify-between items-center text-center bg-accent/10">
            <div className="w-full flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-black">
                {currentIndex + 1} / {activeItems.length}
              </span>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/85"
                >
                  <MoreVertical className="size-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-7 z-10 w-36 bg-card border border-border rounded-xl shadow-lg p-1 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        handleExplain();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-foreground hover:bg-muted rounded-lg flex items-center gap-1.5"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      Explain Concept
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Answer Text */}
            <div className="flex-1 flex items-center justify-center overflow-y-auto px-2 my-2 py-2">
              <p className="text-sm md:text-base leading-relaxed text-foreground max-w-sm">
                {currentCard.back}
              </p>
            </div>

            <span className="text-2xs text-muted-foreground/60 select-none">
              See question
            </span>
          </div>
        </div>
      </div>

      {/* Recall Action controls (Image 3 Style) */}
      <div className="flex justify-between items-center gap-3 pt-3">
        {/* Prev Arrow */}
        <Button
          size="icon"
          variant="secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="size-11 rounded-full border border-border shadow-sm"
        >
          <ArrowLeft className="size-4" />
        </Button>

        {/* Missed it X button */}
        <button
          onClick={(e) => handleRate(e, "MISSED_IT")}
          className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-650 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-bold text-xs"
        >
          <X className="size-4" />
          <span>Missed it</span>
          <span className="bg-red-500/15 text-red-650 px-2 py-0.5 rounded-full text-2xs">
            {missedItCount}
          </span>
        </button>

        {/* Got it V button */}
        <button
          onClick={(e) => handleRate(e, "GOT_IT")}
          className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all font-bold text-xs"
        >
          <Check className="size-4" />
          <span>Got it</span>
          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-2xs">
            {gotItCount}
          </span>
        </button>

        {/* Next Arrow */}
        <Button
          size="icon"
          variant="secondary"
          onClick={handleNext}
          className="size-11 rounded-full border border-border shadow-sm"
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Progress Bar (bottom) */}
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mt-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* AI Explanation Popover Dialog */}
      {isExplainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" />
                <h3 className="text-sm font-black text-foreground">AI Concept Explanation</h3>
              </div>
              <button
                onClick={() => setIsExplainModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[360px] overflow-y-auto text-sm leading-relaxed text-foreground space-y-4">
              {explanationLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="size-8 rounded-full border-4 border-muted border-t-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-semibold">Consulting source documents...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line text-foreground/90 font-medium">
                  {explanationText}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-border/80 px-6 py-4 bg-muted/5">
              <Button size="sm" onClick={() => setIsExplainModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
