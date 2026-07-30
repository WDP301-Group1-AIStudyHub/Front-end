import { useState, useEffect } from "react";
import type { IMcqItem } from "../../services/studyMaterialApi";
import { ArrowRight, RotateCcw, Check, X, AlertCircle, Award, Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStudyProgress, type McqProgressData } from "../../hooks/useStudyProgress";

interface McqQuizProps {
 materialId: string;
 items: IMcqItem[];
 title: string;
}

export default function McqQuiz({ materialId, items, title }: McqQuizProps) {
 const [orderMap, setOrderMap] = useState<number[]>(() => {
 return items.map((_, i) => i).sort(() => Math.random() - 0.5);
 });
 const activeItems = orderMap.map(i => items[i]);

 const [currentIndex, setCurrentIndex] = useState(0);
 const [selectedOption, setSelectedOption] = useState<number | null>(null);
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [score, setScore] = useState(0);
 const [quizFinished, setQuizFinished] = useState(false);
 const [answersLog, setAnswersLog] = useState<{ questionIndex: number; selectedIndex: number }[]>([]);

 const {
 savedProgress,
 isResumed,
 showResumePrompt,
 resume,
 restart,
 saveProgress,
 } = useStudyProgress<McqProgressData>(materialId, "MCQ");

 // Load progress if resumed
 useEffect(() => {
 if (isResumed && savedProgress) {
 if (savedProgress.orderMap && savedProgress.orderMap.length === items.length) {
 setOrderMap(savedProgress.orderMap);
 }
 setCurrentIndex(savedProgress.currentIndex || 0);
 setSelectedOption(savedProgress.selectedOption ?? null);
 setIsSubmitted(savedProgress.isSubmitted || false);
 setScore(savedProgress.score || 0);
 setQuizFinished(savedProgress.isFinished || false);
 setAnswersLog(savedProgress.answersLog || []);
 }
 }, [isResumed, savedProgress]);

 // Sync state to local storage when state changes (if not in resume prompt)
 useEffect(() => {
 if (showResumePrompt) return; 

 saveProgress({
 currentIndex,
 selectedOption,
 isSubmitted,
 score,
 isFinished: quizFinished,
 answersLog,
 totalItems: activeItems.length,
 orderMap,
 });
 }, [
 currentIndex,
 selectedOption,
 isSubmitted,
 score,
 quizFinished,
 answersLog,
 activeItems.length,
 showResumePrompt,
 saveProgress,
 orderMap,
 ]);

 if (activeItems.length === 0) {
 return (
 <Card className="p-8 text-center text-muted-foreground font-sans">
 No questions found.
 </Card>
 );
 }

 // Resume Prompt UI
 if (showResumePrompt && savedProgress) {
 const pPercent = Math.round((savedProgress.currentIndex / activeItems.length) * 100);
 return (
 <div className="mx-auto max-w-lg bg-card border border-border rounded-2xl p-8 font-sans space-y-6 text-center shadow-soft">
 <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full text-primary mb-2">
 <Play className="size-8" />
 </div>
 <h2 className="text-2xl font-black text-foreground">Resume Quiz?</h2>
 <p className="text-muted-foreground text-sm max-w-md mx-auto">
 You have an unfinished session for this quiz. Would you like to pick up where you left off?
 </p>
 
 <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-left space-y-3">
 <div className="flex justify-between text-xs font-bold">
 <span>Progress: {pPercent}%</span>
 <span className="text-primary">{savedProgress.currentIndex} / {activeItems.length} questions</span>
 </div>
 <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
 <div className="h-full bg-primary rounded-full" style={{ width: `${pPercent}%` }} />
 </div>
 </div>

 <div className="flex gap-3 pt-4">
 <Button onClick={restart} variant="outline" className="flex-1">
 <RotateCcw className="size-4 mr-2" />
 Start Over
 </Button>
 <Button onClick={resume} className="flex-1">
 <Play className="size-4 mr-2" />
 Resume
 </Button>
 </div>
 </div>
 );
 }

 const currentItem = activeItems[currentIndex];
 const progressPercent = Math.round(((currentIndex) / activeItems.length) * 100);

 const handleSubmit = () => {
 if (selectedOption === null || isSubmitted) return;

 setIsSubmitted(true);
 const isCorrect = selectedOption === currentItem.correctIndex;
 if (isCorrect) {
 setScore((prev) => prev + 1);
 }

 setAnswersLog((prev) => [
 ...prev,
 { questionIndex: currentIndex, selectedIndex: selectedOption },
 ]);
 };

 const handleNext = () => {
 if (currentIndex < activeItems.length - 1) {
 setCurrentIndex((prev) => prev + 1);
 setSelectedOption(null);
 setIsSubmitted(false);
 } else {
 setQuizFinished(true);
 }
 };

 const resetQuiz = () => {
 setOrderMap(items.map((_, i) => i).sort(() => Math.random() - 0.5));
 setCurrentIndex(0);
 setSelectedOption(null);
 setIsSubmitted(false);
 setScore(0);
 setQuizFinished(false);
 setAnswersLog([]);
 restart();
 };

 if (quizFinished) {
 const successRatio = score / items.length;
 let feedbackMsg = "Good effort! Keep studying to improve your score.";
 if (successRatio === 1) {
 feedbackMsg = "Perfect score! You've mastered this document.";
 } else if (successRatio >= 0.7) {
 feedbackMsg = "Great job! You have a solid grasp of this material.";
 }

 return (
 <div className="mx-auto max-w-xl bg-card border border-border rounded-2xl p-8 font-sans space-y-6 text-center shadow-soft">
 <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full text-primary mb-2">
 <Award className="size-12" />
 </div>
 <h2 className="text-2xl font-black text-foreground">Quiz Completed!</h2>
 <p className="text-muted-foreground text-sm max-w-md mx-auto">{feedbackMsg}</p>
 
 {/* Score Circle */}
 <div className="flex flex-col items-center justify-center my-6">
 <div className="text-5xl font-black text-primary">{score}</div>
 <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">
 Out of {items.length} correct
 </div>
 </div>

 {/* Results Details Log */}
 <div className="text-left border-t border-border pt-6 space-y-4 max-h-80 overflow-y-auto px-2">
 <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">
 Review Questions
 </h3>
 {items.map((item, idx) => {
 const log = answersLog.find((l) => l.questionIndex === idx);
 const userPick = log?.selectedIndex ?? -1;
 const isCorrect = userPick === item.correctIndex;

 return (
 <div key={idx} className="bg-muted/40 rounded-xl p-4 border border-border/60 text-sm space-y-2">
 <div className="flex items-start gap-2">
 <span className="font-bold shrink-0">{idx + 1}.</span>
 <p className="font-semibold">{item.question}</p>
 </div>
 <div className="pl-4 space-y-1 text-xs text-muted-foreground">
 <div className={`flex items-center gap-1.5 ${isCorrect ? "text-emerald-700 " : "text-red-700 "}`}>
 <span>Your answer:</span>
 <span className="font-bold">{item.options[userPick] || "Unanswered"}</span>
 {isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
 </div>
 {!isCorrect && (
 <div className="text-emerald-700 flex items-center gap-1.5">
 <span>Correct answer:</span>
 <span className="font-bold">{item.options[item.correctIndex]}</span>
 </div>
 )}
 <p className="mt-2 text-2xs italic leading-normal border-l-2 border-border/80 pl-2">
 {item.explanation}
 </p>
 </div>
 </div>
 );
 })}
 </div>

 <Button onClick={resetQuiz} size="lg" className="w-full mt-4">
 <RotateCcw className="size-4 mr-2" />
 Retake Quiz
 </Button>
 </div>
 );
 }

 return (
 <div className="mx-auto max-w-xl space-y-6 font-sans w-full">
 {/* Header and Progress */}
 <div className="flex flex-col gap-2">
 <div className="flex justify-between items-center text-sm">
 <span className="font-bold text-muted-foreground">{title}</span>
 <div className="flex items-center gap-3">
 <span className="font-black text-primary">
 Question {currentIndex + 1} of {activeItems.length}
 </span>
 <Button
 variant="outline"
 size="icon"
 className="size-7 rounded-full"
 onClick={resetQuiz}
 title="Shuffle & Restart Quiz"
 >
 <Shuffle className="size-3.5" />
 </Button>
 </div>
 </div>
 
 {/* Progress Bar */}
 <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
 <div
 className="h-full bg-primary rounded-full transition-all duration-300"
 style={{ width: `${progressPercent}%` }}
 />
 </div>
 </div>

 {/* Question Card */}
 <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
 <h3 className="text-lg font-bold leading-snug text-foreground">
 {currentItem.question}
 </h3>

 {/* Options List */}
 <div className="space-y-3">
 {currentItem.options.map((option, idx) => {
 let btnClass = "border-border bg-card text-foreground hover:bg-muted";
 let iconElement = null;

 if (isSubmitted) {
 if (idx === currentItem.correctIndex) {
 // Correct answer is highlighted green
 btnClass = "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 font-bold";
 iconElement = <Check className="size-4 text-emerald-600 " />;
 } else if (idx === selectedOption) {
 // User picked wrong answer is highlighted red
 btnClass = "border-red-500/35 bg-red-500/10 text-red-800 ";
 iconElement = <X className="size-4 text-red-600 " />;
 } else {
 btnClass = "border-border bg-card text-muted-foreground opacity-60";
 }
 } else if (idx === selectedOption) {
 // Option selected before submit
 btnClass = "border-primary bg-primary/5 text-primary font-bold";
 }

 return (
 <button
 key={idx}
 type="button"
 disabled={isSubmitted}
 onClick={() => setSelectedOption(idx)}
 className={`w-full min-h-12 px-4 py-3 rounded-xl border text-left text-sm flex items-center justify-between gap-3 transition-all ${btnClass}`}
 >
 <span>{option}</span>
 {iconElement}
 </button>
 );
 })}
 </div>

 {/* Explanation Alert */}
 {isSubmitted && (
 <div className="flex items-start gap-3 rounded-xl bg-accent/20 border border-border p-4 text-xs leading-normal">
 <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
 <div className="space-y-1">
 <span className="font-bold text-foreground">Explanation</span>
 <p className="text-muted-foreground">{currentItem.explanation}</p>
 </div>
 </div>
 )}
 </div>

 {/* Navigation Buttons */}
 <div className="flex justify-end gap-3 mt-6">
 {!isSubmitted ? (
 <Button
 size="lg"
 className="w-full sm:w-auto"
 onClick={handleSubmit}
 disabled={selectedOption === null}
 >
 Submit Answer
 </Button>
 ) : (
 <Button size="lg" className="w-full sm:w-auto" onClick={handleNext}>
 {currentIndex === items.length - 1 ? "Finish Quiz" : "Next Question"}
 <ArrowRight className="size-4 ml-2" />
 </Button>
 )}
 </div>
 </div>
 );
}
