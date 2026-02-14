import { create } from "zustand";

type View = "home" | "map" | "create" | "profile";

interface AppState {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "home",
  setActiveView: (view) => set({ activeView: view })
}));
