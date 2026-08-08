import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toDateKey } from "@/lib/calculations/date-utils";

interface UIState {
  selectedDate: string; // 'YYYY-MM-DD'
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  shiftSelectedDate: (deltaDays: number) => void;

  activeModalId: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      selectedDate: toDateKey(new Date()),
      setSelectedDate: (date) => set({ selectedDate: date }),
      goToToday: () => set({ selectedDate: toDateKey(new Date()) }),
      shiftSelectedDate: (deltaDays) => {
        const current = new Date(get().selectedDate);
        current.setDate(current.getDate() + deltaDays);
        set({ selectedDate: toDateKey(current) });
      },

      activeModalId: null,
      openModal: (id) => set({ activeModalId: id }),
      closeModal: () => set({ activeModalId: null }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "habit-tracker-ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
