import { create } from 'zustand';
import { FilterState } from '../types/ranking';

interface FilterStore extends FilterState {
    setSearchQuery: (query: string) => void;
    setFilter: (key: keyof FilterState, value: any) => void;
    resetFilters: () => void;
}

const initialState: FilterState = {
    searchQuery: '',
    year: null,
    scoreType: null,
    city: null,
    university: null,
    department: null,
};

export const useFilterStore = create<FilterStore>((set) => ({
    ...initialState,
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
    resetFilters: () => set(initialState),
}));
