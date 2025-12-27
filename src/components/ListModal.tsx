import { Plus, X, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUserStore, PersonalList } from '../store/userStore';
import { RankingItem } from '../types/ranking';

interface ListModalProps {
    visible: boolean;
    onClose: () => void;
    item: RankingItem | null;
    onAddComplete?: () => void;
}

export const ListModal: React.FC<ListModalProps> = ({
    visible,
    onClose,
    item,
    onAddComplete,
}) => {
    const {
        lists,
        createList,
        addItemToList,
        removeItemFromList,
        isItemInList,
    } = useUserStore();

    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');

    // Filter out the default favorites list from user-created lists
    const userLists = lists.filter((list) => list.id !== 'favorites');

    const handleToggleList = (listId: string) => {
        if (!item) return;

        Haptics.selectionAsync();
        const isInList = isItemInList(listId, item.id);

        if (isInList) {
            removeItemFromList(listId, item.id);
        } else {
            addItemToList(listId, item);
        }
    };

    const handleCreateList = () => {
        if (!newListName.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newListId = createList(newListName);
        setNewListName('');
        setIsCreatingNew(false);

        // Automatically add the item to the newly created list
        if (item) {
            addItemToList(newListId, item);
        }

        if (onAddComplete) {
            onAddComplete();
        }
    };

    const handleClose = () => {
        setIsCreatingNew(false);
        setNewListName('');
        onClose();
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-end"
                onPress={handleClose}
            >
                <Pressable
                    className="bg-white rounded-t-3xl"
                    style={{ maxHeight: '80%' }}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View className="px-5 pt-4 pb-3 border-b border-slate-100">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-2xl font-bold text-slate-800">
                                Listeye Ekle
                            </Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                className="p-2 -mr-2"
                            >
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-slate-500 mt-1">
                            {item.departmentName}
                        </Text>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
                    >
                        {/* Create New List Button */}
                        {!isCreatingNew ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setIsCreatingNew(true);
                                    Haptics.selectionAsync();
                                }}
                                className="flex-row items-center justify-center bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl py-4 mb-4"
                            >
                                <Plus size={20} color="#3b82f6" />
                                <Text className="text-blue-600 font-semibold ml-2 text-base">
                                    Yeni Liste Oluştur
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                                <TextInput
                                    className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 mb-3"
                                    placeholder="Liste adı girin..."
                                    value={newListName}
                                    onChangeText={setNewListName}
                                    placeholderTextColor="#94a3b8"
                                    autoFocus
                                    onSubmitEditing={handleCreateList}
                                />
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsCreatingNew(false);
                                            setNewListName('');
                                        }}
                                        className="flex-1 bg-white border border-slate-300 rounded-xl py-3 items-center"
                                    >
                                        <Text className="text-slate-600 font-semibold">
                                            İptal
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleCreateList}
                                        disabled={!newListName.trim()}
                                        className={`flex-1 rounded-xl py-3 items-center ${
                                            newListName.trim()
                                                ? 'bg-blue-600'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <Text className="text-white font-semibold">
                                            Oluştur
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Existing Lists */}
                        {userLists.length > 0 && (
                            <>
                                <Text className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                                    Listelerim
                                </Text>
                                {userLists.map((list) => {
                                    const isInList = isItemInList(list.id, item.id);
                                    return (
                                        <TouchableOpacity
                                            key={list.id}
                                            onPress={() => handleToggleList(list.id)}
                                            className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl p-4 mb-2"
                                        >
                                            <View className="flex-1">
                                                <Text className="text-base font-semibold text-slate-800">
                                                    {list.name}
                                                </Text>
                                                <Text className="text-xs text-slate-500 mt-1">
                                                    {list.items.length} bölüm
                                                </Text>
                                            </View>
                                            {isInList && (
                                                <View className="bg-blue-600 rounded-full p-1.5">
                                                    <Check size={16} color="#ffffff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </>
                        )}

                        {/* Empty State - only show when not creating and no lists */}
                        {userLists.length === 0 && !isCreatingNew && (
                            <View className="py-8 items-center">
                                <Text className="text-slate-400 text-center">
                                    Henüz liste oluşturmadınız
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

