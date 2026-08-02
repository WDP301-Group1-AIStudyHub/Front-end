import { create } from "zustand";
import {
  deleteChatThread,
  listChatThreads,
  updateChatThread,
} from "@/services/chatApi";
import type { ChatThreadNavItem } from "@/components/nav-chats";

function toNavItem(thread: {
  id: string;
  title: string;
  lastMessageAt: string;
}): ChatThreadNavItem {
  return {
    id: thread.id,
    title: thread.title,
    url: `/ask?threadId=${thread.id}`,
    lastMessageAt: thread.lastMessageAt,
  };
}

interface ChatThreadState {
  active: ChatThreadNavItem[];
  archived: ChatThreadNavItem[];
  archivedLoaded: boolean;

  refresh: () => Promise<void>;
  loadArchived: () => Promise<void>;
  resync: () => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  unarchive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useChatThreadStore = create<ChatThreadState>((set, get) => ({
  active: [],
  archived: [],
  archivedLoaded: false,

  refresh: async () => {
    try {
      const threads = await listChatThreads();
      set({ active: threads.map(toNavItem) });
    } catch {
      set({ active: [] });
    }
  },

  loadArchived: async () => {
    try {
      const threads = await listChatThreads("ARCHIVED");
      set({ archived: threads.map(toNavItem), archivedLoaded: true });
    } catch {
      set({ archived: [], archivedLoaded: true });
    }
  },

  // Re-pulls whichever lists are in play, for mutations applied to a thread the
  // store had no local copy of and therefore could not move optimistically.
  resync: async () => {
    await get().refresh();
    if (get().archivedLoaded) await get().loadArchived();
  },

  rename: async (id: string, title: string) => {
    const previousActive = get().active;
    const previousArchived = get().archived;

    set((state) => ({
      active: state.active.map((s) => (s.id === id ? { ...s, title } : s)),
      archived: state.archived.map((s) => (s.id === id ? { ...s, title } : s)),
    }));

    try {
      await updateChatThread(id, { title });
    } catch (err) {
      set({ active: previousActive, archived: previousArchived });
      throw err;
    }
  },

  // `session` is only ever the optimistic-move payload — a thread missing from
  // the local lists (archived loads lazily; the runtime can act on a thread the
  // sidebar never listed) must still reach the backend, or the caller's own
  // optimistic update sticks against a server that never changed.
  archive: async (id: string) => {
    const { active, archived, archivedLoaded } = get();
    const session = active.find((s) => s.id === id);

    set((state) => ({
      active: state.active.filter((s) => s.id !== id),
      archived:
        session && archivedLoaded
          ? [session, ...state.archived]
          : state.archived,
    }));

    try {
      await updateChatThread(id, { status: "ARCHIVED" });
    } catch (err) {
      set({ active, archived });
      throw err;
    }

    if (!session) await get().resync();
  },

  unarchive: async (id: string) => {
    const { active, archived } = get();
    const session = archived.find((s) => s.id === id);

    set((state) => ({
      archived: state.archived.filter((s) => s.id !== id),
      active: session
        ? [session, ...state.active].sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime(),
          )
        : state.active,
    }));

    try {
      await updateChatThread(id, { status: "ACTIVE" });
    } catch (err) {
      set({ active, archived });
      throw err;
    }

    if (!session) await get().resync();
  },

  remove: async (id: string) => {
    const { active, archived } = get();

    set((state) => ({
      active: state.active.filter((s) => s.id !== id),
      archived: state.archived.filter((s) => s.id !== id),
    }));

    try {
      await deleteChatThread(id);
    } catch (err) {
      set({ active, archived });
      throw err;
    }
  },
}));
