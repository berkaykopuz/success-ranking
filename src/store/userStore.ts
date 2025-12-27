import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { RankingItem } from '../types/ranking';

export interface PersonalList {
    id: string;
    name: string;
    items: RankingItem[];
    createdAt: number;
    updatedAt: number;
}

interface UserState {
    lists: PersonalList[];
    recentSearches: string[];
    createList: (name: string) => string;
    deleteList: (listId: string) => void;
    addItemToList: (listId: string, item: RankingItem) => void;
    removeItemFromList: (listId: string, itemId: string) => void;
    updateListName: (listId: string, newName: string) => void;
    isItemInList: (listId: string, itemId: string) => boolean;
    getListsContainingItem: (itemId: string) => PersonalList[];
    addRecentSearch: (query: string) => void;
    clearHistory: () => void;
    // Legacy support - keep favorites as a default list
    toggleFavorite: (item: RankingItem) => void;
    isFavorite: (id: string) => boolean;
    getFavorites: () => RankingItem[];
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            lists: [],
            recentSearches: [],

            createList: (name) => {
                const newList: PersonalList = {
                    id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: name.trim() || 'Yeni Liste',
                    items: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                set((state) => ({ lists: [...state.lists, newList] }));
                return newList.id;
            },

            deleteList: (listId) => {
                set((state) => ({
                    lists: state.lists.filter((list) => list.id !== listId),
                }));
            },

            addItemToList: (listId, item) => {
                set((state) => ({
                    lists: state.lists.map((list) => {
                        if (list.id === listId) {
                            // Check if item already exists
                            const exists = list.items.find((i) => i.id === item.id);
                            if (exists) return list;
                            return {
                                ...list,
                                items: [...list.items, item],
                                updatedAt: Date.now(),
                            };
                        }
                        return list;
                    }),
                }));
            },

            removeItemFromList: (listId, itemId) => {
                set((state) => ({
                    lists: state.lists.map((list) => {
                        if (list.id === listId) {
                            return {
                                ...list,
                                items: list.items.filter((item) => item.id !== itemId),
                                updatedAt: Date.now(),
                            };
                        }
                        return list;
                    }),
                }));
            },

            updateListName: (listId, newName) => {
                set((state) => ({
                    lists: state.lists.map((list) => {
                        if (list.id === listId) {
                            return {
                                ...list,
                                name: newName.trim() || list.name,
                                updatedAt: Date.now(),
                            };
                        }
                        return list;
                    }),
                }));
            },

            isItemInList: (listId, itemId) => {
                const list = get().lists.find((l) => l.id === listId);
                return !!list?.items.find((item) => item.id === itemId);
            },

            getListsContainingItem: (itemId) => {
                return get().lists.filter((list) =>
                    list.items.some((item) => item.id === itemId)
                );
            },

            addRecentSearch: (query) => {
                if (!query.trim()) return;
                const { recentSearches } = get();
                // Remove duplicates and keep top 10
                const newHistory = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10);
                set({ recentSearches: newHistory });
            },

            clearHistory: () => set({ recentSearches: [] }),

            // Legacy support - favorites as a computed property from a default list
            getFavorites: () => {
                const defaultList = get().lists.find((l) => l.id === 'favorites');
                return defaultList?.items || [];
            },

            toggleFavorite: (item) => {
                const state = get();
                let favoritesList = state.lists.find((l) => l.id === 'favorites');
                
                if (!favoritesList) {
                    // Create default favorites list
                    favoritesList = {
                        id: 'favorites',
                        name: 'Favoriler',
                        items: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };
                    set((s) => ({ lists: [...s.lists, favoritesList!] }));
                }

                const exists = favoritesList.items.find((f) => f.id === item.id);
                if (exists) {
                    get().removeItemFromList('favorites', item.id);
                } else {
                    get().addItemToList('favorites', item);
                }
            },

            isFavorite: (id) => {
                return get().isItemInList('favorites', id);
            },
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
