import { useState, useEffect, useCallback } from 'react';
import type { MaterialType } from '../services/studyMaterialApi';

export interface BaseProgressData {
  type: MaterialType;
  currentIndex: number;
  totalItems: number;
  isFinished: boolean;
  lastUpdated: string;
  orderMap?: number[];
}

export interface McqProgressData extends BaseProgressData {
  type: 'MCQ';
  score: number;
  answersLog: { questionIndex: number; selectedIndex: number }[];
  isSubmitted: boolean;
  selectedOption: number | null;
}

export interface FlashcardProgressData extends BaseProgressData {
  type: 'FLASHCARD';
  ratings: Record<number, "GOT_IT" | "MISSED_IT" | "SKIPPED">;
  elapsedTime: number;
}

export type StudyProgressData = McqProgressData | FlashcardProgressData;

const PROGRESS_STORAGE_KEY = 'aistudyhub_progress_data';

export const getAllProgress = (): Record<string, StudyProgressData> => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to parse progress data:', err);
    return {};
  }
};

export const getProgress = (materialId: string): StudyProgressData | null => {
  const all = getAllProgress();
  return all[materialId] || null;
};

export const clearProgress = (materialId: string) => {
  const all = getAllProgress();
  if (all[materialId]) {
    delete all[materialId];
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  }
};

export function useStudyProgress<T extends StudyProgressData>(materialId: string, initialType: MaterialType) {
  const [savedProgress, setSavedProgress] = useState<T | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    const progress = getProgress(materialId) as T | null;
    if (progress && progress.type === initialType) {
      // If there is progress, and it's not at the very beginning (currentIndex > 0 or has answers)
      // Or if it's finished, we might want to prompt them or just let them see the results
      const hasMeaningfulProgress =
        progress.currentIndex > 0 ||
        progress.isFinished ||
        (progress.type === 'MCQ' && (progress as McqProgressData).answersLog.length > 0) ||
        (progress.type === 'FLASHCARD' && Object.keys((progress as FlashcardProgressData).ratings).length > 0);
      
      if (hasMeaningfulProgress) {
        setSavedProgress(progress);
        setShowResumePrompt(true);
      }
    }
  }, [materialId, initialType]);

  const saveProgress = useCallback((data: Partial<T>) => {
    if (!materialId) return;
    const all = getAllProgress();
    const current = all[materialId] || {};
    
    all[materialId] = {
      ...current,
      ...data,
      type: initialType,
      lastUpdated: new Date().toISOString(),
    } as unknown as StudyProgressData;
    
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(all));
  }, [materialId, initialType]);

  const resume = useCallback(() => {
    setIsResumed(true);
    setShowResumePrompt(false);
  }, []);

  const restart = useCallback(() => {
    clearProgress(materialId);
    setSavedProgress(null);
    setIsResumed(false);
    setShowResumePrompt(false);
  }, [materialId]);

  return {
    savedProgress,
    isResumed,
    showResumePrompt,
    resume,
    restart,
    saveProgress,
  };
}
