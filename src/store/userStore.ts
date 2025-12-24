import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RankingItem } from '../types/ranking';

interface UserState {
    favorites: RankingItem[];
    recentSearches: string[];
    toggleFavorite: (item: RankingItem) => void;
    addRecentSearch: (query: string) => void;
    clearHistory: () => void;
    isFavorite: (id: string) => boolean;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            favorites: [],
            recentSearches: [],

            toggleFavorite: (item) => {
                const { favorites } = get();
                const exists = favorites.find((f) => f.id === item.id);

                if (exists) {
                    set({ favorites: favorites.filter((f) => f.id !== item.id) });
                } else {
                    set({ favorites: [...favorites, item] });
                }
            },

            addRecentSearch: (query) => {
                if (!query.trim()) return;
                const { recentSearches } = get();
                // Remove duplicates and keep top 10
                const newHistory = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10);
                set({ recentSearches: newHistory });
            },

            clearHistory: () => set({ recentSearches: [] }),

            isFavorite: (id) => {
                return !!get().favorites.find((f) => f.id === id);
            },
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
