import { create } from "zustand";
import { getStudyMaterialById } from "../services/studyMaterialApi";

export interface MaterialTask {
  id: string;
  documentId: string;
  title: string;
  type: "MCQ" | "FLASHCARD";
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  error?: string;
}

interface StudyMaterialState {
  pendingTasks: MaterialTask[];
  notifications: MaterialTask[];
  addTask: (task: MaterialTask) => void;
  dismissNotification: (id: string) => void;
  pollTasks: () => Promise<void>;
}

export const useStudyMaterialStore = create<StudyMaterialState>((set, get) => {
  let pollIntervalId: any = null;

  const startPolling = () => {
    if (pollIntervalId) return;
    
    pollIntervalId = setInterval(async () => {
      const { pendingTasks, pollTasks } = get();
      if (pendingTasks.length === 0) {
        if (pollIntervalId) {
          clearInterval(pollIntervalId);
          pollIntervalId = null;
        }
        return;
      }
      await pollTasks();
    }, 4000);
  };

  return {
    pendingTasks: [],
    notifications: [],

    addTask: (task) => {
      set((state) => ({
        pendingTasks: [...state.pendingTasks, task],
      }));
      startPolling();
    },

    dismissNotification: (id) => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    },

    pollTasks: async () => {
      const { pendingTasks } = get();
      if (pendingTasks.length === 0) return;

      const updatedTasks: MaterialTask[] = [];
      const finishedTasks: MaterialTask[] = [];

      for (const task of pendingTasks) {
        try {
          const freshData = await getStudyMaterialById(task.id);
          
          if (freshData.status === "COMPLETED" || freshData.status === "FAILED") {
            const finished = {
              ...task,
              status: freshData.status,
              title: freshData.title,
              error: freshData.error,
            };
            finishedTasks.push(finished);
          } else {
            updatedTasks.push({
              ...task,
              status: freshData.status,
            });
          }
        } catch (err) {
          // If we fail to fetch (e.g. server error), keep trying next time
          updatedTasks.push(task);
        }
      }

      set((state) => ({
        pendingTasks: updatedTasks,
        notifications: [...state.notifications, ...finishedTasks],
      }));
    },
  };
});
