import { FlashList } from '@shopify/flash-list';
import { Folder, Plus, ChevronRight, Trash2, Edit2, History, List, ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RankingCard } from '../../src/components/RankingCard';
import { useUserStore, PersonalList } from '../../src/store/userStore';
import { RankingItem } from '../../src/types/ranking';
import { useRouter } from 'expo-router';

type ViewMode = 'main' | 'lists' | 'listDetail' | 'pastScores';

export default function KisiselScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        lists,
        createList,
        deleteList,
        updateListName,
        removeItemFromList,
    } = useUserStore();

    const [viewMode, setViewMode] = useState<ViewMode>('main');
    const [selectedList, setSelectedList] = useState<PersonalList | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editListName, setEditListName] = useState('');

    // Filter out the default favorites list from user-created lists
    const userLists = lists.filter((list) => list.id !== 'favorites');

    const handleCreateList = () => {
        if (!newListName.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        createList(newListName);
        setNewListName('');
        setIsCreateModalVisible(false);
    };

    const handleEditList = () => {
        if (!selectedList || !editListName.trim()) return;

        Haptics.selectionAsync();
        updateListName(selectedList.id, editListName);
        setEditListName('');
        setIsEditModalVisible(false);
        // Update selected list
        const updatedList = lists.find((l) => l.id === selectedList.id);
        if (updatedList) setSelectedList(updatedList);
    };

    const handleDeleteList = (list: PersonalList) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Listeyi Sil',
            `"${list.name}" listesini silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        deleteList(list.id);
                        if (selectedList?.id === list.id) {
                            setViewMode('lists');
                            setSelectedList(null);
                        }
                    },
                },
            ]
        );
    };

    const handleOpenList = (list: PersonalList) => {
        Haptics.selectionAsync();
        setSelectedList(list);
        setViewMode('listDetail');
    };

    const handleBackToLists = () => {
        Haptics.selectionAsync();
        setViewMode('lists');
        setSelectedList(null);
    };

    const handleBackToMain = () => {
        Haptics.selectionAsync();
        setViewMode('main');
        setSelectedList(null);
    };

    const handleOpenPastScores = () => {
        Haptics.selectionAsync();
        setViewMode('pastScores');
    };

    const handleOpenLists = () => {
        Haptics.selectionAsync();
        setViewMode('lists');
    };

    const handleRemoveItem = (itemId: string) => {
        if (!selectedList) return;
        Haptics.selectionAsync();
        removeItemFromList(selectedList.id, itemId);
    };

    const renderListItem = useCallback(
        ({ item }: { item: PersonalList }) => (
            <TouchableOpacity
                onPress={() => handleOpenList(item)}
                className="bg-white p-4 mb-2 rounded-2xl border border-slate-100 shadow-sm mx-4 active:scale-[0.98]"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="bg-blue-50 p-3 rounded-xl mr-3">
                            <Folder size={24} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-800 mb-1">
                                {item.name}
                            </Text>
                            <Text className="text-sm text-slate-500">
                                {item.items.length} bölüm
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                            onPress={() => {
                                setEditListName(item.name);
                                setSelectedList(item);
                                setIsEditModalVisible(true);
                            }}
                            className="p-2"
                        >
                            <Edit2 size={18} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                handleDeleteList(item);
                            }}
                            className="p-2"
                        >
                            <Trash2 size={14} color="#ef4444" />
                        </TouchableOpacity>
                        <ChevronRight size={20} color="#94a3b8" />
                    </View>
                </View>
            </TouchableOpacity>
        ),
        [lists]
    );

    const renderRankingItem = useCallback(
        ({ item }: { item: RankingItem }) => (
            <View className="relative">
                <RankingCard item={item} router={router} />
                <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    className="absolute top-0 left-4 bg-red-50 p-2 rounded-full border border-red-200 z-10"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Trash2 size={12} color="#ef4444" />
                </TouchableOpacity>
            </View>
        ),
        [selectedList, lists]
    );

    const renderEmptyLists = () => (
        <View className="flex-1 justify-center items-center mt-20 px-10">
            <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                <Folder size={48} color="#94a3b8" />
            </View>
            <Text className="text-xl font-bold text-slate-800 mb-3">
                Henüz liste yok
            </Text>
            <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                Bölümleri organize etmek için yeni bir liste oluşturun.
            </Text>
        </View>
    );

    const renderEmptyListDetail = () => (
        <View className="flex-1 justify-center items-center mt-20 px-10">
            <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                <Folder size={48} color="#94a3b8" />
            </View>
            <Text className="text-xl font-bold text-slate-800 mb-3">
                Liste boş
            </Text>
            <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                Bu listeye henüz bölüm eklenmedi.
            </Text>
        </View>
    );

    const renderMainMenu = () => (
        <View className="flex-1 bg-slate-50 pt-6">
            <View className="px-4 gap-3">
                <TouchableOpacity
                    onPress={handleOpenPastScores}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98]"
                >
                    <View className="flex-row items-center">
                        <View className="bg-purple-50 p-3 rounded-xl mr-4">
                            <History size={28} color="#9333ea" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-800 mb-1">
                                Geçmiş Netlerim
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Kaydettiğiniz net skorlarınızı görüntüleyin
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#94a3b8" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleOpenLists}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98]"
                >
                    <View className="flex-row items-center">
                        <View className="bg-blue-50 p-3 rounded-xl mr-4">
                            <List size={28} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-800 mb-1">
                                Listelerim
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Bölümleri organize ettiğiniz listeler
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#94a3b8" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPastScores = () => (
        <View className="flex-1 bg-slate-50 pt-3">
            <View className="flex-1 justify-center items-center mt-20 px-10">
                <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                    <History size={48} color="#94a3b8" />
                </View>
                <Text className="text-xl font-bold text-slate-800 mb-3">
                    Henüz net kaydedilmedi
                </Text>
                <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                    Geçmiş net skorlarınız burada görüntülenecek.
                </Text>
            </View>
        </View>
    );

    if (viewMode === 'listDetail' && selectedList) {
        // Get the current list from store to ensure we have the latest data
        const currentList = lists.find((l) => l.id === selectedList.id);
        if (!currentList) {
            // List was deleted, go back to lists view
            setViewMode('lists');
            setSelectedList(null);
            return null;
        }

        return (
            <View
                className="flex-1 bg-white"
                style={{ paddingTop: insets.top }}
            >
                <View className="px-5 py-4 border-b border-slate-100 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBackToLists}
                        className="mr-3 p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft
                            size={24}
                            color="#64748b"
                        />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-slate-800 tracking-tight">
                            {currentList.name}
                        </Text>
                        <Text className="text-sm text-slate-500 mt-1">
                            {currentList.items.length} bölüm
                        </Text>
                    </View>
                </View>
                <View className="flex-1 bg-slate-50 pt-3">
                    <FlashList
                        data={currentList.items}
                        renderItem={renderRankingItem}
                        estimatedItemSize={120}
                        ListEmptyComponent={renderEmptyListDetail}
                        contentContainerStyle={{
                            paddingBottom: insets.bottom + 20,
                        }}
                    />
                </View>
            </View>
        );
    }

    if (viewMode === 'pastScores') {
        return (
            <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
                <View className="px-5 py-4 border-b border-slate-100 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBackToMain}
                        className="mr-3 p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft
                            size={24}
                            color="#64748b"
                        />
                    </TouchableOpacity>
                    <Text className="text-3xl font-bold text-slate-800 tracking-tight">
                        Geçmiş Netlerim
                    </Text>
                </View>
                {renderPastScores()}
            </View>
        );
    }

    if (viewMode === 'lists') {
        return (
            <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
                <View className="px-5 py-4 border-b border-slate-100 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={handleBackToMain}
                            className="mr-3 p-2"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft
                                size={24}
                                color="#64748b"
                            />
                        </TouchableOpacity>
                        <Text className="text-3xl font-bold text-slate-800 tracking-tight">
                            Listelerim
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            setIsCreateModalVisible(true);
                        }}
                        className="bg-blue-600 p-2.5 rounded-xl"
                    >
                        <Plus size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
                <View className="flex-1 bg-slate-50 pt-3">
                    <FlashList
                        data={userLists}
                        renderItem={renderListItem}
                        estimatedItemSize={80}
                        ListEmptyComponent={renderEmptyLists}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    />
                </View>

                {/* Create List Modal */}
                <Modal
                    visible={isCreateModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsCreateModalVisible(false)}
                >
                    <Pressable
                        className="flex-1 bg-black/50 justify-center items-center px-5"
                        onPress={() => setIsCreateModalVisible(false)}
                    >
                        <Pressable
                            className="bg-white rounded-2xl p-6 w-full max-w-sm"
                        >
                            <Text className="text-2xl font-bold text-slate-800 mb-4">
                                Yeni Liste Oluştur
                            </Text>
                            <TextInput
                                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 mb-4"
                                placeholder="Liste adı girin..."
                                value={newListName}
                                onChangeText={setNewListName}
                                placeholderTextColor="#94a3b8"
                                autoFocus
                                onSubmitEditing={handleCreateList}
                            />
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsCreateModalVisible(false);
                                        setNewListName('');
                                    }}
                                    className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
                                >
                                    <Text className="text-slate-700 font-semibold">
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
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Edit List Modal */}
                <Modal
                    visible={isEditModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsEditModalVisible(false)}
                >
                    <Pressable
                        className="flex-1 bg-black/50 justify-center items-center px-5"
                        onPress={() => setIsEditModalVisible(false)}
                    >
                        <Pressable
                            className="bg-white rounded-2xl p-6 w-full max-w-sm"
                        >
                            <Text className="text-2xl font-bold text-slate-800 mb-4">
                                Liste Adını Düzenle
                            </Text>
                            <TextInput
                                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 mb-4"
                                placeholder="Liste adı girin..."
                                value={editListName}
                                onChangeText={setEditListName}
                                placeholderTextColor="#94a3b8"
                                autoFocus
                                onSubmitEditing={handleEditList}
                            />
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsEditModalVisible(false);
                                        setEditListName('');
                                    }}
                                    className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
                                >
                                    <Text className="text-slate-700 font-semibold">
                                        İptal
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleEditList}
                                    disabled={!editListName.trim()}
                                    className={`flex-1 rounded-xl py-3 items-center ${
                                        editListName.trim()
                                            ? 'bg-blue-600'
                                            : 'bg-slate-300'
                                    }`}
                                >
                                    <Text className="text-white font-semibold">
                                        Kaydet
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        );
    }

    // Main menu view (default)
    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <View className="px-5 py-4 border-b border-slate-100">
                <Text className="text-3xl font-bold text-slate-800 tracking-tight">
                    Kişisel
                </Text>
            </View>
            {renderMainMenu()}
        </View>
    );
}
