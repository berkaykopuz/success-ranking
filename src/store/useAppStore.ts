import { create } from 'zustand';

interface AppState {
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    hasHydrated: false,
    setHasHydrated: (state) => set({ hasHydrated: state }),
}));
