import { FlashList } from '@shopify/flash-list';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Folder, Plus, ChevronRight, Trash2, Edit2, History, List, ArrowLeft, GripVertical, BarChart3, Save, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    Alert,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RankingCard } from '../../src/components/RankingCard';
import { useUserStore, PersonalList, YKSCalculation } from '../../src/store/userStore';
import { RankingItem } from '../../src/types/ranking';
import { useRouter } from 'expo-router';
import { estimateRanking } from '../../src/api/rankings';

type ViewMode = 'main' | 'lists' | 'listDetail' | 'pastScores' | 'calculationDetail' | 'netFormStatus';

export default function KisiselScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        lists,
        createList,
        deleteList,
        updateListName,
        removeItemFromList,
        reorderListItems,
        getYKSCalculations,
        deleteYKSCalculation,
        updateYKSCalculation,
    } = useUserStore();

    const [viewMode, setViewMode] = useState<ViewMode>('main');
    const [selectedList, setSelectedList] = useState<PersonalList | null>(null);
    const [selectedCalculation, setSelectedCalculation] = useState<YKSCalculation | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editListName, setEditListName] = useState('');
    const [isEditingTYT, setIsEditingTYT] = useState(false);
    const [editedTYTValues, setEditedTYTValues] = useState<Record<string, { correct: string; wrong: string }>>({});
    const [isEditingSAY, setIsEditingSAY] = useState(false);
    const [editedSAYValues, setEditedSAYValues] = useState<Record<string, { correct: string; wrong: string }>>({});
    const [isEditingEA, setIsEditingEA] = useState(false);
    const [editedEAValues, setEditedEAValues] = useState<Record<string, { correct: string; wrong: string }>>({});
    const [isEditingSOZ, setIsEditingSOZ] = useState(false);
    const [editedSOZValues, setEditedSOZValues] = useState<Record<string, { correct: string; wrong: string }>>({});
    const [isEditingDIL, setIsEditingDIL] = useState(false);
    const [editedDILValues, setEditedDILValues] = useState<Record<string, { correct: string; wrong: string }>>({});
    const [isEditingOBP, setIsEditingOBP] = useState(false);
    const [editedDiplomaGrade, setEditedDiplomaGrade] = useState('');
    const [editedKirikOBP, setEditedKirikOBP] = useState(false);

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

    const handleOpenNetFormStatus = () => {
        Haptics.selectionAsync();
        setViewMode('netFormStatus');
    };

    const handleRemoveItem = (item: RankingItem) => {
        if (!selectedList) return;
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Bölümü Sil',
            `"${item.departmentName}" bölümünü listeden silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.selectionAsync();
                        removeItemFromList(selectedList.id, item.id);
                    },
                },
            ]
        );
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
        ({ item, drag, isActive }: RenderItemParams<RankingItem>) => (
            <ScaleDecorator>
                <View className="relative">
                    <TouchableOpacity
                        onLongPress={drag}
                        disabled={isActive}
                        activeOpacity={0.7}
                        className={isActive ? 'opacity-80' : ''}
                    >
                        <View className="flex-row items-center">
                            <View className="pl-2 pr-1 py-5">
                                <GripVertical size={20} color="#94a3b8" />
                            </View>
                            <View className="flex-1 relative">
                                <RankingCard item={item} router={router} />
                                <TouchableOpacity
                                    onPress={() => handleRemoveItem(item)}
                                    className="absolute top-0 left-4 bg-red-50 p-2 rounded-full border border-red-200 z-10"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Trash2 size={12} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScaleDecorator>
        ),
        [selectedList, lists, router]
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
                Listeye Henüz Bölüm Eklenmedi
            </Text>
            <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                Keşfet ekranındaki bölüm kartlarında yer alan "+" simgesine basarak listeye ekleyebilirsiniz.
            </Text>
        </View>
    );


    const yksCalculations = getYKSCalculations();

    const handleDeleteCalculation = (id: string, name: string, e?: any) => {
        e?.stopPropagation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Hesaplamayı Sil',
            `"${name}" hesaplamasını silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        deleteYKSCalculation(id);
                        if (selectedCalculation?.id === id) {
                            setViewMode('pastScores');
                            setSelectedCalculation(null);
                        }
                    },
                },
            ]
        );
    };

    const handleOpenCalculation = (calculation: YKSCalculation) => {
        Haptics.selectionAsync();
        setSelectedCalculation(calculation);
        setViewMode('calculationDetail');
        setIsEditingTYT(false);
        setEditedTYTValues({});
        setIsEditingSAY(false);
        setEditedSAYValues({});
        setIsEditingEA(false);
        setEditedEAValues({});
        setIsEditingSOZ(false);
        setEditedSOZValues({});
        setIsEditingDIL(false);
        setEditedDILValues({});
        setIsEditingOBP(false);
        setEditedDiplomaGrade('');
        setEditedKirikOBP(false);
    };

    const handleBackToPastScores = () => {
        Haptics.selectionAsync();
        setViewMode('pastScores');
        setSelectedCalculation(null);
        setIsEditingTYT(false);
        setEditedTYTValues({});
        setIsEditingSAY(false);
        setEditedSAYValues({});
        setIsEditingEA(false);
        setEditedEAValues({});
        setIsEditingSOZ(false);
        setEditedSOZValues({});
        setIsEditingDIL(false);
        setEditedDILValues({});
        setIsEditingOBP(false);
        setEditedDiplomaGrade('');
        setEditedKirikOBP(false);
    };

    const handleStartEditingTYT = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        setEditedTYTValues({ ...selectedCalculation.tytValues });
        setIsEditingTYT(true);
    };

    const handleCancelEditingTYT = () => {
        Haptics.selectionAsync();
        setIsEditingTYT(false);
        setEditedTYTValues({});
    };

    const handleSaveTYT = () => {
        if (!selectedCalculation) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Merge edited values with original to ensure all fields are present
        const finalTYTValues = {
            ...selectedCalculation.tytValues,
            ...editedTYTValues,
        };

        // Recalculate all scores
        const recalculated = recalculateAllScores(
            finalTYTValues,
            selectedCalculation.aytValues,
            selectedCalculation.diplomaGrade,
            selectedCalculation.kirikOBP
        );

        // Update calculation
        updateYKSCalculation(selectedCalculation.id, {
            tytValues: finalTYTValues,
            ...recalculated,
        });

        // Update selected calculation to reflect changes
        const updatedCalculation = {
            ...selectedCalculation,
            tytValues: finalTYTValues,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingTYT(false);
        setEditedTYTValues({});

        Alert.alert('Başarılı', 'TYT değerleri güncellendi!');
    };

    // SAY (Sayısal) handlers
    const handleStartEditingSAY = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        setEditedSAYValues({
            aytMatematik: selectedCalculation.aytValues.aytMatematik,
            aytFizik: selectedCalculation.aytValues.aytFizik,
            aytKimya: selectedCalculation.aytValues.aytKimya,
            aytBiyoloji: selectedCalculation.aytValues.aytBiyoloji,
        });
        setIsEditingSAY(true);
    };

    const handleCancelEditingSAY = () => {
        Haptics.selectionAsync();
        setIsEditingSAY(false);
        setEditedSAYValues({});
    };

    const handleSaveSAY = () => {
        if (!selectedCalculation) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const finalAYTValues = {
            ...selectedCalculation.aytValues,
            ...editedSAYValues,
        };

        const recalculated = recalculateAllScores(
            selectedCalculation.tytValues,
            finalAYTValues,
            selectedCalculation.diplomaGrade,
            selectedCalculation.kirikOBP
        );

        updateYKSCalculation(selectedCalculation.id, {
            aytValues: finalAYTValues,
            ...recalculated,
        });

        const updatedCalculation = {
            ...selectedCalculation,
            aytValues: finalAYTValues,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingSAY(false);
        setEditedSAYValues({});

        Alert.alert('Başarılı', 'SAY değerleri güncellendi!');
    };

    // EA (Eşit Ağırlık) handlers
    const handleStartEditingEA = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        setEditedEAValues({
            aytMatematik: selectedCalculation.aytValues.aytMatematik,
            aytEdebiyat: selectedCalculation.aytValues.aytEdebiyat,
            aytTarih1: selectedCalculation.aytValues.aytTarih1,
            aytCografya1: selectedCalculation.aytValues.aytCografya1,
        });
        setIsEditingEA(true);
    };

    const handleCancelEditingEA = () => {
        Haptics.selectionAsync();
        setIsEditingEA(false);
        setEditedEAValues({});
    };

    const handleSaveEA = () => {
        if (!selectedCalculation) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const finalAYTValues = {
            ...selectedCalculation.aytValues,
            ...editedEAValues,
        };

        const recalculated = recalculateAllScores(
            selectedCalculation.tytValues,
            finalAYTValues,
            selectedCalculation.diplomaGrade,
            selectedCalculation.kirikOBP
        );

        updateYKSCalculation(selectedCalculation.id, {
            aytValues: finalAYTValues,
            ...recalculated,
        });

        const updatedCalculation = {
            ...selectedCalculation,
            aytValues: finalAYTValues,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingEA(false);
        setEditedEAValues({});

        Alert.alert('Başarılı', 'EA değerleri güncellendi!');
    };

    // SÖZ (Sözel) handlers
    const handleStartEditingSOZ = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        setEditedSOZValues({
            aytEdebiyat: selectedCalculation.aytValues.aytEdebiyat,
            aytTarih1: selectedCalculation.aytValues.aytTarih1,
            aytCografya1: selectedCalculation.aytValues.aytCografya1,
            aytTarih2: selectedCalculation.aytValues.aytTarih2,
            aytCografya2: selectedCalculation.aytValues.aytCografya2,
            aytFelsefe: selectedCalculation.aytValues.aytFelsefe,
            aytDin: selectedCalculation.aytValues.aytDin,
        });
        setIsEditingSOZ(true);
    };

    const handleCancelEditingSOZ = () => {
        Haptics.selectionAsync();
        setIsEditingSOZ(false);
        setEditedSOZValues({});
    };

    const handleSaveSOZ = () => {
        if (!selectedCalculation) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const finalAYTValues = {
            ...selectedCalculation.aytValues,
            ...editedSOZValues,
        };

        const recalculated = recalculateAllScores(
            selectedCalculation.tytValues,
            finalAYTValues,
            selectedCalculation.diplomaGrade,
            selectedCalculation.kirikOBP
        );

        updateYKSCalculation(selectedCalculation.id, {
            aytValues: finalAYTValues,
            ...recalculated,
        });

        const updatedCalculation = {
            ...selectedCalculation,
            aytValues: finalAYTValues,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingSOZ(false);
        setEditedSOZValues({});

        Alert.alert('Başarılı', 'SÖZ değerleri güncellendi!');
    };

    // DİL (Yabancı Dil) handlers
    const handleStartEditingDIL = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        if (selectedCalculation.aytValues.aytYdt) {
            setEditedDILValues({
                aytYdt: selectedCalculation.aytValues.aytYdt,
            });
        }
        setIsEditingDIL(true);
    };

    const handleCancelEditingDIL = () => {
        Haptics.selectionAsync();
        setIsEditingDIL(false);
        setEditedDILValues({});
    };

    const handleSaveDIL = () => {
        if (!selectedCalculation) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const finalAYTValues = {
            ...selectedCalculation.aytValues,
            ...editedDILValues,
        };

        const recalculated = recalculateAllScores(
            selectedCalculation.tytValues,
            finalAYTValues,
            selectedCalculation.diplomaGrade,
            selectedCalculation.kirikOBP
        );

        updateYKSCalculation(selectedCalculation.id, {
            aytValues: finalAYTValues,
            ...recalculated,
        });

        const updatedCalculation = {
            ...selectedCalculation,
            aytValues: finalAYTValues,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingDIL(false);
        setEditedDILValues({});

        Alert.alert('Başarılı', 'DİL değerleri güncellendi!');
    };

    // OBP handlers
    const handleStartEditingOBP = () => {
        if (!selectedCalculation) return;
        Haptics.selectionAsync();
        setEditedDiplomaGrade(selectedCalculation.diplomaGrade || '');
        setEditedKirikOBP(selectedCalculation.kirikOBP || false);
        setIsEditingOBP(true);
    };

    const handleCancelEditingOBP = () => {
        Haptics.selectionAsync();
        setIsEditingOBP(false);
        setEditedDiplomaGrade('');
        setEditedKirikOBP(false);
    };

    const handleDiplomaGradeChange = (text: string) => {
        const cleaned = text.replace(/[^0-9,\.]/g, '');
        const num = parseFloat(cleaned.replace(',', '.')) || 0;
        if (num <= 100) {
            setEditedDiplomaGrade(cleaned);
        }
    };

    const handleSaveOBP = () => {
        if (!selectedCalculation) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const recalculated = recalculateAllScores(
            selectedCalculation.tytValues,
            selectedCalculation.aytValues,
            editedDiplomaGrade || selectedCalculation.diplomaGrade,
            editedKirikOBP
        );

        updateYKSCalculation(selectedCalculation.id, {
            diplomaGrade: editedDiplomaGrade || selectedCalculation.diplomaGrade,
            kirikOBP: editedKirikOBP,
            ...recalculated,
        });

        const updatedCalculation = {
            ...selectedCalculation,
            diplomaGrade: editedDiplomaGrade || selectedCalculation.diplomaGrade,
            kirikOBP: editedKirikOBP,
            ...recalculated,
        };
        setSelectedCalculation(updatedCalculation);
        setIsEditingOBP(false);
        setEditedDiplomaGrade('');
        setEditedKirikOBP(false);

        Alert.alert('Başarılı', 'OBP değerleri güncellendi!');
    };

    const renderYKSCalculation = useCallback(
        ({ item }: { item: YKSCalculation }) => {
            const date = new Date(item.createdAt);
            const formattedDate = date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            return (
                <TouchableOpacity
                    onPress={() => handleOpenCalculation(item)}
                    className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4 active:scale-[0.98]"
                >
                    <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-slate-800 mb-1">
                                {item.name}
                            </Text>
                            <Text className="text-xs text-slate-500">{formattedDate}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => handleDeleteCalculation(item.id, item.name, e)}
                            className="p-2"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mb-2">
                        <View className="items-center flex-1 border-r border-slate-200">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">TYT</Text>
                            <Text className="text-sm font-semibold text-slate-700">
                                {item.tytHamPuan.toFixed(3).replace('.', ',')}
                            </Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">SAY</Text>
                            <Text className="text-sm font-semibold text-slate-700">
                                {item.sayHamPuan > 0 ? item.sayHamPuan.toFixed(3).replace('.', ',') : '—'}
                            </Text>
                        </View>
                        <View className="items-center flex-1 border-l border-slate-200">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">SÖZ</Text>
                            <Text className="text-sm font-semibold text-slate-700">
                                {item.sozHamPuan > 0 ? item.sozHamPuan.toFixed(3).replace('.', ',') : '—'}
                            </Text>
                        </View>
                        <View className="items-center flex-1 border-l border-slate-200">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">EA</Text>
                            <Text className="text-sm font-semibold text-slate-700">
                                {item.eaHamPuan > 0 ? item.eaHamPuan.toFixed(3).replace('.', ',') : '—'}
                            </Text>
                        </View>
                        <View className="items-center flex-1 border-l border-slate-200">
                            <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">DİL</Text>
                            <Text className="text-sm font-semibold text-slate-700">
                                {item.dilHamPuan !== undefined && item.dilHamPuan > 0 ? item.dilHamPuan.toFixed(3).replace('.', ',') : '—'}
                            </Text>
                        </View>
                    </View>

                    {item.diplomaGrade && parseFloat(item.diplomaGrade) > 0 && (
                        <View className="mt-2 pt-2 border-t border-slate-200">
                            <Text className="text-xs text-slate-500">
                                Diploma Notu: {item.diplomaGrade} {item.kirikOBP && '(Kırık OBP)'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        []
    );

    const renderPastScores = () => {
        if (yksCalculations.length === 0) {
            return (
                <View className="flex-1 bg-slate-50 pt-3">
                    <View className="flex-1 justify-center items-center mt-20 px-10">
                        <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                            <History size={48} color="#94a3b8" />
                        </View>
                        <Text className="text-xl font-bold text-slate-800 mb-3">
                            Henüz Net Kaydedilmedi
                        </Text>
                        <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                            Geçmiş net skorlarınız burada görüntülenecek.
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View className="flex-1 bg-slate-50 pt-3">
                <FlashList
                    data={yksCalculations}
                    renderItem={renderYKSCalculation}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                />
            </View>
        );
    };

    const renderCalculationDetail = () => {
        if (!selectedCalculation) return null;

        const date = new Date(selectedCalculation.createdAt);
        const formattedDate = date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        // Calculate TYT total net
        const tytTotalNet = 
            getNetFromValue(selectedCalculation.tytValues.turkce) +
            getNetFromValue(selectedCalculation.tytValues.matematik) +
            getNetFromValue(selectedCalculation.tytValues.sosyal) +
            getNetFromValue(selectedCalculation.tytValues.fen);

        // Calculate AYT total nets
        const aytSayTotalNet = 
            getNetFromValue(selectedCalculation.aytValues.aytMatematik) +
            getNetFromValue(selectedCalculation.aytValues.aytFizik) +
            getNetFromValue(selectedCalculation.aytValues.aytKimya) +
            getNetFromValue(selectedCalculation.aytValues.aytBiyoloji);

        const aytEaTotalNet = 
            getNetFromValue(selectedCalculation.aytValues.aytMatematik) +
            getNetFromValue(selectedCalculation.aytValues.aytEdebiyat) +
            getNetFromValue(selectedCalculation.aytValues.aytTarih1) +
            getNetFromValue(selectedCalculation.aytValues.aytCografya1);

        const aytSozTotalNet = 
            getNetFromValue(selectedCalculation.aytValues.aytEdebiyat) +
            getNetFromValue(selectedCalculation.aytValues.aytTarih1) +
            getNetFromValue(selectedCalculation.aytValues.aytCografya1) +
            getNetFromValue(selectedCalculation.aytValues.aytTarih2) +
            getNetFromValue(selectedCalculation.aytValues.aytCografya2) +
            getNetFromValue(selectedCalculation.aytValues.aytFelsefe) +
            getNetFromValue(selectedCalculation.aytValues.aytDin);

        const aytYdtNet = selectedCalculation.aytValues.aytYdt 
            ? getNetFromValue(selectedCalculation.aytValues.aytYdt) 
            : 0;

        return (
            <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
                <View className="px-5 py-4 border-b border-slate-100 flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBackToPastScores}
                        className="mr-3 p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={24} color="#64748b" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-slate-800 tracking-tight">
                            {selectedCalculation.name}
                        </Text>
                        <Text className="text-sm text-slate-500 mt-1">{formattedDate}</Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1 bg-slate-50 pt-2"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* TYT Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className="bg-blue-50 px-2.5 py-1 rounded-md mr-2">
                                    <Text className="text-blue-700 font-bold text-[10px] tracking-wider uppercase">TYT</Text>
                                </View>
                                <Text className="text-lg font-bold text-slate-800">Temel Yeterlilik Testi</Text>
                            </View>
                            {!isEditingTYT ? (
                                <TouchableOpacity
                                    onPress={handleStartEditingTYT}
                                    className="p-2"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Edit2 size={20} color="#64748b" />
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handleCancelEditingTYT}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveTYT}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Save size={20} color="#10b981" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {isEditingTYT ? (
                            <>
                                <EditableSectionRow
                                    label="Türkçe"
                                    help=""
                                    value={editedTYTValues.turkce || selectedCalculation.tytValues.turkce}
                                    onChangeCorrect={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        turkce: { ...(prev.turkce || selectedCalculation.tytValues.turkce), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        turkce: { ...(prev.turkce || selectedCalculation.tytValues.turkce), wrong: text }
                                    }))}
                                    maxLimit={40}
                                />
                                <EditableSectionRow
                                    label="Sosyal Bilimler"
                                    help=""
                                    value={editedTYTValues.sosyal || selectedCalculation.tytValues.sosyal}
                                    onChangeCorrect={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        sosyal: { ...(prev.sosyal || selectedCalculation.tytValues.sosyal), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        sosyal: { ...(prev.sosyal || selectedCalculation.tytValues.sosyal), wrong: text }
                                    }))}
                                    maxLimit={20}
                                />
                                <EditableSectionRow
                                    label="Temel Matematik"
                                    help=""
                                    value={editedTYTValues.matematik || selectedCalculation.tytValues.matematik}
                                    onChangeCorrect={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        matematik: { ...(prev.matematik || selectedCalculation.tytValues.matematik), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        matematik: { ...(prev.matematik || selectedCalculation.tytValues.matematik), wrong: text }
                                    }))}
                                    maxLimit={40}
                                />
                                <EditableSectionRow
                                    label="Fen Bilimleri"
                                    help=""
                                    value={editedTYTValues.fen || selectedCalculation.tytValues.fen}
                                    onChangeCorrect={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        fen: { ...(prev.fen || selectedCalculation.tytValues.fen), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedTYTValues(prev => ({
                                        ...prev,
                                        fen: { ...(prev.fen || selectedCalculation.tytValues.fen), wrong: text }
                                    }))}
                                    maxLimit={20}
                                />
                            </>
                        ) : (
                            <>
                                <ReadOnlySectionRow
                                    label="Türkçe"
                                    help=""
                                    value={selectedCalculation.tytValues.turkce}
                                />
                                <ReadOnlySectionRow
                                    label="Sosyal Bilimler"
                                    help=""
                                    value={selectedCalculation.tytValues.sosyal}
                                />
                                <ReadOnlySectionRow
                                    label="Temel Matematik"
                                    help=""
                                    value={selectedCalculation.tytValues.matematik}
                                />
                                <ReadOnlySectionRow
                                    label="Fen Bilimleri"
                                    help=""
                                    value={selectedCalculation.tytValues.fen}
                                />
                            </>
                        )}

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam TYT Net</Text>
                                <Text className="text-lg font-bold text-blue-600 tracking-tight">
                                    {isEditingTYT 
                                        ? (
                                            getNetFromValue(editedTYTValues.turkce || selectedCalculation.tytValues.turkce) +
                                            getNetFromValue(editedTYTValues.matematik || selectedCalculation.tytValues.matematik) +
                                            getNetFromValue(editedTYTValues.sosyal || selectedCalculation.tytValues.sosyal) +
                                            getNetFromValue(editedTYTValues.fen || selectedCalculation.tytValues.fen)
                                        ).toFixed(2).replace('.', ',')
                                        : tytTotalNet.toFixed(2).replace('.', ',')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* AYT Sayısal Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className="bg-emerald-50 px-2.5 py-1 rounded-md mr-2">
                                    <Text className="text-emerald-700 font-bold text-[10px] tracking-wider uppercase">SAY</Text>
                                </View>
                                <Text className="text-lg font-bold text-slate-800">Sayısal Alan</Text>
                            </View>
                            {!isEditingSAY ? (
                                <TouchableOpacity
                                    onPress={handleStartEditingSAY}
                                    className="p-2"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Edit2 size={20} color="#64748b" />
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handleCancelEditingSAY}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveSAY}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Save size={20} color="#10b981" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {isEditingSAY ? (
                            <>
                                <EditableSectionRow
                                    label="AYT Matematik"
                                    help=""
                                    value={editedSAYValues.aytMatematik || selectedCalculation.aytValues.aytMatematik}
                                    onChangeCorrect={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytMatematik: { ...(prev.aytMatematik || selectedCalculation.aytValues.aytMatematik), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytMatematik: { ...(prev.aytMatematik || selectedCalculation.aytValues.aytMatematik), wrong: text }
                                    }))}
                                    maxLimit={40}
                                />
                                <EditableSectionRow
                                    label="Fizik"
                                    help=""
                                    value={editedSAYValues.aytFizik || selectedCalculation.aytValues.aytFizik}
                                    onChangeCorrect={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytFizik: { ...(prev.aytFizik || selectedCalculation.aytValues.aytFizik), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytFizik: { ...(prev.aytFizik || selectedCalculation.aytValues.aytFizik), wrong: text }
                                    }))}
                                    maxLimit={14}
                                />
                                <EditableSectionRow
                                    label="Kimya"
                                    help=""
                                    value={editedSAYValues.aytKimya || selectedCalculation.aytValues.aytKimya}
                                    onChangeCorrect={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytKimya: { ...(prev.aytKimya || selectedCalculation.aytValues.aytKimya), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytKimya: { ...(prev.aytKimya || selectedCalculation.aytValues.aytKimya), wrong: text }
                                    }))}
                                    maxLimit={13}
                                />
                                <EditableSectionRow
                                    label="Biyoloji"
                                    help=""
                                    value={editedSAYValues.aytBiyoloji || selectedCalculation.aytValues.aytBiyoloji}
                                    onChangeCorrect={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytBiyoloji: { ...(prev.aytBiyoloji || selectedCalculation.aytValues.aytBiyoloji), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSAYValues(prev => ({
                                        ...prev,
                                        aytBiyoloji: { ...(prev.aytBiyoloji || selectedCalculation.aytValues.aytBiyoloji), wrong: text }
                                    }))}
                                    maxLimit={13}
                                />
                            </>
                        ) : (
                            <>
                                <ReadOnlySectionRow
                                    label="AYT Matematik"
                                    help=""
                                    value={selectedCalculation.aytValues.aytMatematik}
                                />
                                <ReadOnlySectionRow
                                    label="Fizik"
                                    help=""
                                    value={selectedCalculation.aytValues.aytFizik}
                                />
                                <ReadOnlySectionRow
                                    label="Kimya"
                                    help=""
                                    value={selectedCalculation.aytValues.aytKimya}
                                />
                                <ReadOnlySectionRow
                                    label="Biyoloji"
                                    help=""
                                    value={selectedCalculation.aytValues.aytBiyoloji}
                                />
                            </>
                        )}

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-emerald-600 tracking-tight">
                                    {isEditingSAY
                                        ? (
                                            getNetFromValue(editedSAYValues.aytMatematik || selectedCalculation.aytValues.aytMatematik) +
                                            getNetFromValue(editedSAYValues.aytFizik || selectedCalculation.aytValues.aytFizik) +
                                            getNetFromValue(editedSAYValues.aytKimya || selectedCalculation.aytValues.aytKimya) +
                                            getNetFromValue(editedSAYValues.aytBiyoloji || selectedCalculation.aytValues.aytBiyoloji)
                                        ).toFixed(2).replace('.', ',')
                                        : aytSayTotalNet.toFixed(2).replace('.', ',')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* AYT Eşit Ağırlık Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className="bg-purple-50 px-2.5 py-1 rounded-md mr-2">
                                    <Text className="text-purple-700 font-bold text-[10px] tracking-wider uppercase">EA</Text>
                                </View>
                                <Text className="text-lg font-bold text-slate-800">Eşit Ağırlık Alan</Text>
                            </View>
                            {!isEditingEA ? (
                                <TouchableOpacity
                                    onPress={handleStartEditingEA}
                                    className="p-2"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Edit2 size={20} color="#64748b" />
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handleCancelEditingEA}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveEA}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Save size={20} color="#10b981" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {isEditingEA ? (
                            <>
                                <EditableSectionRow
                                    label="AYT Matematik"
                                    help=""
                                    value={editedEAValues.aytMatematik || selectedCalculation.aytValues.aytMatematik}
                                    onChangeCorrect={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytMatematik: { ...(prev.aytMatematik || selectedCalculation.aytValues.aytMatematik), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytMatematik: { ...(prev.aytMatematik || selectedCalculation.aytValues.aytMatematik), wrong: text }
                                    }))}
                                    maxLimit={40}
                                />
                                <EditableSectionRow
                                    label="Edebiyat"
                                    help=""
                                    value={editedEAValues.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat}
                                    onChangeCorrect={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytEdebiyat: { ...(prev.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytEdebiyat: { ...(prev.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat), wrong: text }
                                    }))}
                                    maxLimit={24}
                                />
                                <EditableSectionRow
                                    label="Tarih-1"
                                    help=""
                                    value={editedEAValues.aytTarih1 || selectedCalculation.aytValues.aytTarih1}
                                    onChangeCorrect={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytTarih1: { ...(prev.aytTarih1 || selectedCalculation.aytValues.aytTarih1), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytTarih1: { ...(prev.aytTarih1 || selectedCalculation.aytValues.aytTarih1), wrong: text }
                                    }))}
                                    maxLimit={10}
                                />
                                <EditableSectionRow
                                    label="Coğrafya-1"
                                    help=""
                                    value={editedEAValues.aytCografya1 || selectedCalculation.aytValues.aytCografya1}
                                    onChangeCorrect={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytCografya1: { ...(prev.aytCografya1 || selectedCalculation.aytValues.aytCografya1), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedEAValues(prev => ({
                                        ...prev,
                                        aytCografya1: { ...(prev.aytCografya1 || selectedCalculation.aytValues.aytCografya1), wrong: text }
                                    }))}
                                    maxLimit={6}
                                />
                            </>
                        ) : (
                            <>
                                <ReadOnlySectionRow
                                    label="AYT Matematik"
                                    help=""
                                    value={selectedCalculation.aytValues.aytMatematik}
                                />
                                <ReadOnlySectionRow
                                    label="Edebiyat"
                                    help=""
                                    value={selectedCalculation.aytValues.aytEdebiyat}
                                />
                                <ReadOnlySectionRow
                                    label="Tarih-1"
                                    help=""
                                    value={selectedCalculation.aytValues.aytTarih1}
                                />
                                <ReadOnlySectionRow
                                    label="Coğrafya-1"
                                    help=""
                                    value={selectedCalculation.aytValues.aytCografya1}
                                />
                            </>
                        )}

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-purple-600 tracking-tight">
                                    {isEditingEA
                                        ? (
                                            getNetFromValue(editedEAValues.aytMatematik || selectedCalculation.aytValues.aytMatematik) +
                                            getNetFromValue(editedEAValues.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat) +
                                            getNetFromValue(editedEAValues.aytTarih1 || selectedCalculation.aytValues.aytTarih1) +
                                            getNetFromValue(editedEAValues.aytCografya1 || selectedCalculation.aytValues.aytCografya1)
                                        ).toFixed(2).replace('.', ',')
                                        : aytEaTotalNet.toFixed(2).replace('.', ',')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* AYT Sözel Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className="bg-orange-50 px-2.5 py-1 rounded-md mr-2">
                                    <Text className="text-orange-700 font-bold text-[10px] tracking-wider uppercase">SÖZ</Text>
                                </View>
                                <Text className="text-lg font-bold text-slate-800">Sözel Alan</Text>
                            </View>
                            {!isEditingSOZ ? (
                                <TouchableOpacity
                                    onPress={handleStartEditingSOZ}
                                    className="p-2"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Edit2 size={20} color="#64748b" />
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handleCancelEditingSOZ}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveSOZ}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Save size={20} color="#10b981" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {isEditingSOZ ? (
                            <>
                                <EditableSectionRow
                                    label="Edebiyat"
                                    help=""
                                    value={editedSOZValues.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytEdebiyat: { ...(prev.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytEdebiyat: { ...(prev.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat), wrong: text }
                                    }))}
                                    maxLimit={24}
                                />
                                <EditableSectionRow
                                    label="Tarih-1"
                                    help=""
                                    value={editedSOZValues.aytTarih1 || selectedCalculation.aytValues.aytTarih1}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytTarih1: { ...(prev.aytTarih1 || selectedCalculation.aytValues.aytTarih1), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytTarih1: { ...(prev.aytTarih1 || selectedCalculation.aytValues.aytTarih1), wrong: text }
                                    }))}
                                    maxLimit={10}
                                />
                                <EditableSectionRow
                                    label="Coğrafya-1"
                                    help=""
                                    value={editedSOZValues.aytCografya1 || selectedCalculation.aytValues.aytCografya1}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytCografya1: { ...(prev.aytCografya1 || selectedCalculation.aytValues.aytCografya1), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytCografya1: { ...(prev.aytCografya1 || selectedCalculation.aytValues.aytCografya1), wrong: text }
                                    }))}
                                    maxLimit={6}
                                />
                                <EditableSectionRow
                                    label="Tarih-2"
                                    help=""
                                    value={editedSOZValues.aytTarih2 || selectedCalculation.aytValues.aytTarih2}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytTarih2: { ...(prev.aytTarih2 || selectedCalculation.aytValues.aytTarih2), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytTarih2: { ...(prev.aytTarih2 || selectedCalculation.aytValues.aytTarih2), wrong: text }
                                    }))}
                                    maxLimit={11}
                                />
                                <EditableSectionRow
                                    label="Coğrafya-2"
                                    help=""
                                    value={editedSOZValues.aytCografya2 || selectedCalculation.aytValues.aytCografya2}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytCografya2: { ...(prev.aytCografya2 || selectedCalculation.aytValues.aytCografya2), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytCografya2: { ...(prev.aytCografya2 || selectedCalculation.aytValues.aytCografya2), wrong: text }
                                    }))}
                                    maxLimit={11}
                                />
                                <EditableSectionRow
                                    label="Felsefe Grubu"
                                    help=""
                                    value={editedSOZValues.aytFelsefe || selectedCalculation.aytValues.aytFelsefe}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytFelsefe: { ...(prev.aytFelsefe || selectedCalculation.aytValues.aytFelsefe), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytFelsefe: { ...(prev.aytFelsefe || selectedCalculation.aytValues.aytFelsefe), wrong: text }
                                    }))}
                                    maxLimit={12}
                                />
                                <EditableSectionRow
                                    label="Din Kültürü"
                                    help=""
                                    value={editedSOZValues.aytDin || selectedCalculation.aytValues.aytDin}
                                    onChangeCorrect={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytDin: { ...(prev.aytDin || selectedCalculation.aytValues.aytDin), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedSOZValues(prev => ({
                                        ...prev,
                                        aytDin: { ...(prev.aytDin || selectedCalculation.aytValues.aytDin), wrong: text }
                                    }))}
                                    maxLimit={6}
                                />
                            </>
                        ) : (
                            <>
                                <ReadOnlySectionRow
                                    label="Edebiyat"
                                    help=""
                                    value={selectedCalculation.aytValues.aytEdebiyat}
                                />
                                <ReadOnlySectionRow
                                    label="Tarih-1"
                                    help=""
                                    value={selectedCalculation.aytValues.aytTarih1}
                                />
                                <ReadOnlySectionRow
                                    label="Coğrafya-1"
                                    help=""
                                    value={selectedCalculation.aytValues.aytCografya1}
                                />
                                <ReadOnlySectionRow
                                    label="Tarih-2"
                                    help=""
                                    value={selectedCalculation.aytValues.aytTarih2}
                                />
                                <ReadOnlySectionRow
                                    label="Coğrafya-2"
                                    help=""
                                    value={selectedCalculation.aytValues.aytCografya2}
                                />
                                <ReadOnlySectionRow
                                    label="Felsefe Grubu"
                                    help=""
                                    value={selectedCalculation.aytValues.aytFelsefe}
                                />
                                <ReadOnlySectionRow
                                    label="Din Kültürü"
                                    help=""
                                    value={selectedCalculation.aytValues.aytDin}
                                />
                            </>
                        )}

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-orange-600 tracking-tight">
                                    {isEditingSOZ
                                        ? (
                                            getNetFromValue(editedSOZValues.aytEdebiyat || selectedCalculation.aytValues.aytEdebiyat) +
                                            getNetFromValue(editedSOZValues.aytTarih1 || selectedCalculation.aytValues.aytTarih1) +
                                            getNetFromValue(editedSOZValues.aytCografya1 || selectedCalculation.aytValues.aytCografya1) +
                                            getNetFromValue(editedSOZValues.aytTarih2 || selectedCalculation.aytValues.aytTarih2) +
                                            getNetFromValue(editedSOZValues.aytCografya2 || selectedCalculation.aytValues.aytCografya2) +
                                            getNetFromValue(editedSOZValues.aytFelsefe || selectedCalculation.aytValues.aytFelsefe) +
                                            getNetFromValue(editedSOZValues.aytDin || selectedCalculation.aytValues.aytDin)
                                        ).toFixed(2).replace('.', ',')
                                        : aytSozTotalNet.toFixed(2).replace('.', ',')
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* AYT Dil Card */}
                    {selectedCalculation.aytValues.aytYdt && (
                        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-row items-center">
                                    <View className="bg-rose-50 px-2.5 py-1 rounded-md mr-2">
                                        <Text className="text-rose-700 font-bold text-[10px] tracking-wider uppercase">DİL</Text>
                                    </View>
                                    <Text className="text-lg font-bold text-slate-800">Yabancı Dil Alan</Text>
                                </View>
                                {!isEditingDIL ? (
                                    <TouchableOpacity
                                        onPress={handleStartEditingDIL}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Edit2 size={20} color="#64748b" />
                                    </TouchableOpacity>
                                ) : (
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={handleCancelEditingDIL}
                                            className="p-2"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <X size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleSaveDIL}
                                            className="p-2"
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Save size={20} color="#10b981" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {isEditingDIL ? (
                                <EditableSectionRow
                                    label="YDT (Yabancı Dil Testi)"
                                    help=""
                                    value={editedDILValues.aytYdt || selectedCalculation.aytValues.aytYdt}
                                    onChangeCorrect={(text) => setEditedDILValues(prev => ({
                                        ...prev,
                                        aytYdt: { ...(prev.aytYdt || selectedCalculation.aytValues.aytYdt), correct: text }
                                    }))}
                                    onChangeWrong={(text) => setEditedDILValues(prev => ({
                                        ...prev,
                                        aytYdt: { ...(prev.aytYdt || selectedCalculation.aytValues.aytYdt), wrong: text }
                                    }))}
                                    maxLimit={80}
                                />
                            ) : (
                                <ReadOnlySectionRow
                                    label="YDT (Yabancı Dil Testi)"
                                    help=""
                                    value={selectedCalculation.aytValues.aytYdt}
                                />
                            )}

                            <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">YDT Net</Text>
                                    <Text className="text-lg font-bold text-rose-600 tracking-tight">
                                        {isEditingDIL
                                            ? getNetFromValue(editedDILValues.aytYdt || selectedCalculation.aytValues.aytYdt).toFixed(2).replace('.', ',')
                                            : aytYdtNet.toFixed(2).replace('.', ',')
                                        }
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* OBP Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                                <View className="bg-indigo-50 px-2.5 py-1 rounded-md mr-2">
                                    <Text className="text-indigo-700 font-bold text-[10px] tracking-wider uppercase">OBP</Text>
                                </View>
                                <Text className="text-lg font-bold text-slate-800">Diploma Notu</Text>
                            </View>
                            {!isEditingOBP ? (
                                <TouchableOpacity
                                    onPress={handleStartEditingOBP}
                                    className="p-2"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Edit2 size={20} color="#64748b" />
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handleCancelEditingOBP}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSaveOBP}
                                        className="p-2"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Save size={20} color="#10b981" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {isEditingOBP ? (
                            <>
                                <View className="mb-3">
                                    <Text className="text-sm font-medium text-slate-800 mb-2">Diploma Notu (50-100)</Text>
                                    <TextInput
                                        keyboardType="numeric"
                                        value={editedDiplomaGrade}
                                        onChangeText={handleDiplomaGradeChange}
                                        placeholder="Örn: 85"
                                        placeholderTextColor="#94a3b8"
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 font-medium"
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => setEditedKirikOBP(!editedKirikOBP)}
                                    className="flex-row items-center mb-3"
                                    activeOpacity={0.7}
                                >
                                    <View
                                        className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                                            editedKirikOBP ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                        }`}
                                    >
                                        {editedKirikOBP && <Text className="text-white text-xs">✓</Text>}
                                    </View>
                                    <Text className="text-sm text-slate-700">Önceki Sene Yerleştim</Text>
                                </TouchableOpacity>

                                <View className="mb-3">
                                    <Text className="text-xs text-slate-500">
                                        Yerleştirme Puanı = Ham Puan + (Diploma Notu × {(editedKirikOBP ? 0.3 : 0.6).toFixed(1)})
                                    </Text>
                                </View>

                                {(() => {
                                    const diplomaNotu = parseFloat(editedDiplomaGrade.replace(',', '.')) || 0;
                                    const obpKatsayisi = editedKirikOBP ? 0.3 : 0.6;
                                    const obpEkPuan = diplomaNotu * obpKatsayisi;
                                    return obpEkPuan > 0 ? (
                                        <View className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">OBP Ek Puanı</Text>
                                                <Text className="text-lg font-bold text-indigo-600 tracking-tight">
                                                    {obpEkPuan.toFixed(3).replace('.', ',')}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : null;
                                })()}
                            </>
                        ) : (
                            <>
                                <View className="mb-3">
                                    <Text className="text-sm font-medium text-slate-800 mb-2">Diploma Notu</Text>
                                    <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                        <Text className="text-base text-slate-900 font-medium">
                                            {selectedCalculation.diplomaGrade || 'Belirtilmemiş'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center mb-3">
                                    <View
                                        className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                                            selectedCalculation.kirikOBP ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                        }`}
                                    >
                                        {selectedCalculation.kirikOBP && <Text className="text-white text-xs">✓</Text>}
                                    </View>
                                    <Text className="text-sm text-slate-700">Önceki Sene Yerleştim</Text>
                                </View>

                                {(() => {
                                    const diplomaNotu = parseFloat(selectedCalculation.diplomaGrade.replace(',', '.')) || 0;
                                    const obpKatsayisi = selectedCalculation.kirikOBP ? 0.3 : 0.6;
                                    const obpEkPuan = diplomaNotu * obpKatsayisi;
                                    return obpEkPuan > 0 ? (
                                        <View className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">OBP Ek Puanı</Text>
                                                <Text className="text-lg font-bold text-indigo-600 tracking-tight">
                                                    {obpEkPuan.toFixed(3).replace('.', ',')}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : null;
                                })()}
                            </>
                        )}
                    </View>

                    {/* Results Card */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-slate-900 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-white font-bold text-[10px] tracking-wider uppercase">Sonuçlar</Text>
                            </View>
                        </View>

                        {/* TYT Results */}
                        <View className="mb-4">
                            <Text className="text-sm font-bold text-slate-800 mb-2">TYT Puanı</Text>
                            <View className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-xs text-blue-600 font-medium">Ham Puan</Text>
                                    <Text className="text-base font-bold text-blue-700">
                                        {selectedCalculation.tytHamPuan.toFixed(3).replace('.', ',')}
                                    </Text>
                                </View>
                                {selectedCalculation.diplomaGrade && parseFloat(selectedCalculation.diplomaGrade) > 0 && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-blue-200">
                                        <Text className="text-xs text-blue-600 font-medium">Yerleştirme Puanı</Text>
                                        <Text className="text-base font-bold text-blue-700">
                                            {selectedCalculation.tytYerlesme.toFixed(3).replace('.', ',')}
                                        </Text>
                                    </View>
                                )}
                                {selectedCalculation.tytEstimatedRank !== null && selectedCalculation.tytEstimatedRank !== undefined && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-blue-200">
                                        <Text className="text-xs text-blue-600 font-medium">Puanınıza Karşılık Gelen Tahmini Sıralama</Text>
                                        <Text className="text-base font-bold text-blue-700">
                                            {selectedCalculation.tytEstimatedRank.toLocaleString('tr-TR')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* SAY Results */}
                        <View className="mb-4">
                            <Text className="text-sm font-bold text-slate-800 mb-2">SAY (Sayısal) Puanı</Text>
                            <View className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-xs text-emerald-600 font-medium">Ham Puan</Text>
                                    <Text className="text-base font-bold text-emerald-700">
                                        {selectedCalculation.sayHamPuan > 0 ? selectedCalculation.sayHamPuan.toFixed(3).replace('.', ',') : '—'}
                                    </Text>
                                </View>
                                {selectedCalculation.diplomaGrade && parseFloat(selectedCalculation.diplomaGrade) > 0 && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-emerald-200">
                                        <Text className="text-xs text-emerald-600 font-medium">Yerleştirme Puanı</Text>
                                        <Text className="text-base font-bold text-emerald-700">
                                            {selectedCalculation.sayYerlesme.toFixed(3).replace('.', ',')}
                                        </Text>
                                    </View>
                                )}
                                {selectedCalculation.sayEstimatedRank !== null && selectedCalculation.sayEstimatedRank !== undefined && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-emerald-200">
                                        <Text className="text-xs text-emerald-600 font-medium">Puanınıza Karşılık Gelen Tahmini Sıralama</Text>
                                        <Text className="text-base font-bold text-emerald-700">
                                            {selectedCalculation.sayEstimatedRank.toLocaleString('tr-TR')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* EA Results */}
                        <View className="mb-4">
                            <Text className="text-sm font-bold text-slate-800 mb-2">EA (Eşit Ağırlık) Puanı</Text>
                            <View className="bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-xs text-purple-600 font-medium">Ham Puan</Text>
                                    <Text className="text-base font-bold text-purple-700">
                                        {selectedCalculation.eaHamPuan > 0 ? selectedCalculation.eaHamPuan.toFixed(3).replace('.', ',') : '—'}
                                    </Text>
                                </View>
                                {selectedCalculation.diplomaGrade && parseFloat(selectedCalculation.diplomaGrade) > 0 && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-purple-200">
                                        <Text className="text-xs text-purple-600 font-medium">Yerleştirme Puanı</Text>
                                        <Text className="text-base font-bold text-purple-700">
                                            {selectedCalculation.eaYerlesme.toFixed(3).replace('.', ',')}
                                        </Text>
                                    </View>
                                )}
                                {selectedCalculation.eaEstimatedRank !== null && selectedCalculation.eaEstimatedRank !== undefined && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-purple-200">
                                        <Text className="text-xs text-purple-600 font-medium">Puanınıza Karşılık Gelen Tahmini Sıralama</Text>
                                        <Text className="text-base font-bold text-purple-700">
                                            {selectedCalculation.eaEstimatedRank.toLocaleString('tr-TR')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* SÖZ Results */}
                        <View className="mb-4">
                            <Text className="text-sm font-bold text-slate-800 mb-2">SÖZ (Sözel) Puanı</Text>
                            <View className="bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-xs text-orange-600 font-medium">Ham Puan</Text>
                                    <Text className="text-base font-bold text-orange-700">
                                        {selectedCalculation.sozHamPuan > 0 ? selectedCalculation.sozHamPuan.toFixed(3).replace('.', ',') : '—'}
                                    </Text>
                                </View>
                                {selectedCalculation.diplomaGrade && parseFloat(selectedCalculation.diplomaGrade) > 0 && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-orange-200">
                                        <Text className="text-xs text-orange-600 font-medium">Yerleştirme Puanı</Text>
                                        <Text className="text-base font-bold text-orange-700">
                                            {selectedCalculation.sozYerlesme.toFixed(3).replace('.', ',')}
                                        </Text>
                                    </View>
                                )}
                                {selectedCalculation.sozEstimatedRank !== null && selectedCalculation.sozEstimatedRank !== undefined && (
                                    <View className="flex-row items-center justify-between pt-1 border-t border-orange-200">
                                        <Text className="text-xs text-orange-600 font-medium">Puanınıza Karşılık Gelen Tahmini Sıralama</Text>
                                        <Text className="text-base font-bold text-orange-700">
                                            {selectedCalculation.sozEstimatedRank.toLocaleString('tr-TR')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* DİL Results */}
                        {selectedCalculation.dilHamPuan !== undefined && (
                            <View className="mb-2">
                                <Text className="text-sm font-bold text-slate-800 mb-2">DİL (Yabancı Dil) Puanı</Text>
                                <View className="bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text className="text-xs text-rose-600 font-medium">Ham Puan</Text>
                                        <Text className="text-base font-bold text-rose-700">
                                            {selectedCalculation.dilHamPuan > 0 ? selectedCalculation.dilHamPuan.toFixed(3).replace('.', ',') : '—'}
                                        </Text>
                                    </View>
                                    {selectedCalculation.diplomaGrade && parseFloat(selectedCalculation.diplomaGrade) > 0 && selectedCalculation.dilYerlesme !== undefined && (
                                        <View className="flex-row items-center justify-between pt-1 border-t border-rose-200">
                                            <Text className="text-xs text-rose-600 font-medium">Yerleştirme Puanı</Text>
                                            <Text className="text-base font-bold text-rose-700">
                                                {selectedCalculation.dilYerlesme.toFixed(3).replace('.', ',')}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedCalculation.dilEstimatedRank !== null && selectedCalculation.dilEstimatedRank !== undefined && (
                                        <View className="flex-row items-center justify-between pt-1 border-t border-rose-200">
                                            <Text className="text-xs text-rose-600 font-medium">Puanınıza Karşılık Gelen Tahmini Sıralama</Text>
                                            <Text className="text-base font-bold text-rose-700">
                                                {selectedCalculation.dilEstimatedRank.toLocaleString('tr-TR')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    };

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
                    <DraggableFlatList
                        data={currentList.items}
                        renderItem={renderRankingItem}
                        keyExtractor={(item) => item.id}
                        onDragEnd={({ from, to }) => {
                            if (from !== to && currentList) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                reorderListItems(currentList.id, from, to);
                            }
                        }}
                        ListEmptyComponent={renderEmptyListDetail}
                        contentContainerStyle={{
                            paddingBottom: insets.bottom + 20,
                        }}
                    />
                </View>
            </View>
        );
    }

    if (viewMode === 'calculationDetail' && selectedCalculation) {
        return renderCalculationDetail();
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

    if (viewMode === 'netFormStatus') {
        return <NetFormStatusScreen insets={insets} onBack={handleBackToMain} calculations={yksCalculations} />;
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
            <MainMenuScreen 
                onOpenPastScores={handleOpenPastScores}
                onOpenLists={handleOpenLists}
                onOpenNetFormStatus={handleOpenNetFormStatus}
            />
        </View>
    );
}

// NetFormStatusScreen Component
interface NetFormStatusScreenProps {
    insets: { top: number; bottom: number };
    onBack: () => void;
    calculations: YKSCalculation[];
}

function NetFormStatusScreen({ insets, onBack, calculations }: NetFormStatusScreenProps) {
    // Get last 5 calculations
    const last5Calculations = calculations ? calculations.slice(0, 5) : [];

    return (
        <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
            <View className="px-5 py-4 border-b border-slate-100 flex-row items-center bg-white">
                <TouchableOpacity
                    onPress={onBack}
                    className="mr-3 p-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={24} color="#64748b" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-3xl font-bold text-slate-800 tracking-tight">
                        Net Form Durumum
                    </Text>
                    <Text className="text-sm text-slate-500 mt-1">
                        {last5Calculations.length > 0 
                            ? `Son ${last5Calculations.length} sınav karşılaştırması`
                            : 'Net skorlarınızın grafik görünümü'}
                    </Text>
                </View>
            </View>

            {last5Calculations.length === 0 ? (
                <View className="flex-1 justify-center items-center mt-20 px-10">
                    <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                        <BarChart3 size={48} color="#94a3b8" />
                    </View>
                    <Text className="text-xl font-bold text-slate-800 mb-3">
                        Henüz Net Kaydedilmedi
                    </Text>
                    <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                        Net skorlarınızı görüntülemek için önce bir hesaplama kaydedin.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1 bg-slate-50 pt-2"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* TYT Chart */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-blue-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-blue-700 font-bold text-[10px] tracking-wider uppercase">TYT</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800">TYT Net Karşılaştırması</Text>
                        </View>
                        <ComparisonChart calculations={last5Calculations} type="tyt" />
                    </View>

                    {/* SAY Chart */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-emerald-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-emerald-700 font-bold text-[10px] tracking-wider uppercase">SAY</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800">SAY Net Karşılaştırması</Text>
                        </View>
                        <ComparisonChart calculations={last5Calculations} type="say" />
                    </View>

                    {/* EA Chart */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-purple-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-purple-700 font-bold text-[10px] tracking-wider uppercase">EA</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800">EA Net Karşılaştırması</Text>
                        </View>
                        <ComparisonChart calculations={last5Calculations} type="ea" />
                    </View>

                    {/* SÖZ Chart */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-orange-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-orange-700 font-bold text-[10px] tracking-wider uppercase">SÖZ</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800">SÖZ Net Karşılaştırması</Text>
                        </View>
                        <ComparisonChart calculations={last5Calculations} type="soz" />
                    </View>

                    {/* DİL Chart */}
                    <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
                        <View className="flex-row items-center mb-4">
                            <View className="bg-rose-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-rose-700 font-bold text-[10px] tracking-wider uppercase">DİL</Text>
                            </View>
                            <Text className="text-lg font-bold text-slate-800">DİL Net Karşılaştırması</Text>
                        </View>
                        <ComparisonChart calculations={last5Calculations} type="dil" />
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

// MainMenuScreen Component
interface MainMenuScreenProps {
    onOpenPastScores: () => void;
    onOpenLists: () => void;
    onOpenNetFormStatus: () => void;
}

function MainMenuScreen({ onOpenPastScores, onOpenLists, onOpenNetFormStatus }: MainMenuScreenProps) {
    return (
        <View className="flex-1 bg-slate-50 pt-6">
            <View className="px-4 gap-3">
                <TouchableOpacity
                    onPress={onOpenLists}
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

                <TouchableOpacity
                    onPress={onOpenPastScores}
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
                    onPress={onOpenNetFormStatus}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98]"
                >
                    <View className="flex-row items-center">
                        <View className="bg-green-50 p-3 rounded-xl mr-4">
                            <BarChart3 size={28} color="#22c55e" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-800 mb-1">
                                Net Form Durumum
                            </Text>
                            <Text className="text-sm text-slate-500">
                                Net skorlarınızın grafik görünümü
                            </Text>
                        </View>
                        <ChevronRight size={24} color="#94a3b8" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Comparison Chart component
interface ComparisonChartProps {
    calculations: YKSCalculation[];
    type: 'tyt' | 'say' | 'ea' | 'soz' | 'dil';
}

const EXAM_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
];

function ComparisonChart({ calculations, type }: ComparisonChartProps) {
    const [selectedDot, setSelectedDot] = useState<{ seriesIndex: number; pointIndex: number } | null>(null);

    // Handle empty calculations array
    if (!calculations || calculations.length === 0) {
        return (
            <View className="py-8 items-center">
                <View className="bg-slate-100 p-4 rounded-full mb-3">
                    <BarChart3 size={32} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-400">
                    Henüz Net Kaydı Bulunmuyor
                </Text>
            </View>
        );
    }

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80;
    const chartHeight = 280;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 60;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    // Define subjects and max values based on type
    let subjects: string[] = [];
    let maxNets: number[] = [];
    let maxDisplayValue = 40;

    if (type === 'tyt') {
        subjects = ['Türkçe', 'Matematik', 'Sosyal', 'Fen'];
        maxNets = [40, 40, 20, 20];
        maxDisplayValue = 40;
    } else if (type === 'say') {
        subjects = ['AYT Matematik', 'Fizik', 'Kimya', 'Biyoloji'];
        maxNets = [40, 14, 13, 13];
        maxDisplayValue = 40;
    } else if (type === 'ea') {
        subjects = ['AYT Matematik', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'];
        maxNets = [40, 24, 10, 6];
        maxDisplayValue = 40;
    } else if (type === 'soz') {
        subjects = ['Edebiyat', 'Tarih-1', 'Coğ-1', 'Tarih-2', 'Coğ-2', 'Felsefe', 'Din'];
        maxNets = [24, 10, 6, 11, 11, 12, 6];
        maxDisplayValue = 24;
    } else if (type === 'dil') {
        subjects = ['YDT'];
        maxNets = [80];
        maxDisplayValue = 80;
    }

    // Calculate Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels: number[] = [];
    for (let i = 0; i <= yAxisSteps; i++) {
        yAxisLabels.push((maxDisplayValue / yAxisSteps) * i);
    }

    // Prepare data for each calculation
    const seriesData = calculations.map((calc, calcIndex) => {
        let nets: number[] = [];

        if (type === 'tyt') {
            nets = [
                getNetFromValue(calc.tytValues.turkce),
                getNetFromValue(calc.tytValues.matematik),
                getNetFromValue(calc.tytValues.sosyal),
                getNetFromValue(calc.tytValues.fen),
            ];
        } else if (type === 'say') {
            nets = [
                getNetFromValue(calc.aytValues.aytMatematik),
                getNetFromValue(calc.aytValues.aytFizik),
                getNetFromValue(calc.aytValues.aytKimya),
                getNetFromValue(calc.aytValues.aytBiyoloji),
            ];
        } else if (type === 'ea') {
            nets = [
                getNetFromValue(calc.aytValues.aytMatematik),
                getNetFromValue(calc.aytValues.aytEdebiyat),
                getNetFromValue(calc.aytValues.aytTarih1),
                getNetFromValue(calc.aytValues.aytCografya1),
            ];
        } else if (type === 'soz') {
            nets = [
                getNetFromValue(calc.aytValues.aytEdebiyat),
                getNetFromValue(calc.aytValues.aytTarih1),
                getNetFromValue(calc.aytValues.aytCografya1),
                getNetFromValue(calc.aytValues.aytTarih2),
                getNetFromValue(calc.aytValues.aytCografya2),
                getNetFromValue(calc.aytValues.aytFelsefe),
                getNetFromValue(calc.aytValues.aytDin),
            ];
        } else if (type === 'dil') {
            const ydtNet = calc.aytValues.aytYdt ? getNetFromValue(calc.aytValues.aytYdt) : 0;
            nets = [ydtNet];
        }
        
        // Calculate point positions
        const points = nets.map((net, index) => {
            const x = paddingLeft + (graphWidth / (subjects.length - 1 || 1)) * index;
            const y = paddingTop + graphHeight - (net / maxDisplayValue) * graphHeight;
            return { x, y, net, subjectIndex: index };
        });

        return {
            name: calc.name,
            color: EXAM_COLORS[calcIndex % EXAM_COLORS.length],
            points,
            date: new Date(calc.createdAt),
            calculation: calc,
            subjects: subjects,
            nets: nets,
        };
    });

    // Filter out calculations with no data for this type
    // Only include series that have at least one point with net > 0
    const validSeriesData = seriesData.filter(series => {
        const hasData = series.points.some(p => p.net > 0);
        return hasData;
    });

    // Show empty state if no valid data exists for this chart type
    if (validSeriesData.length === 0) {
        return (
            <View className="py-8 items-center">
                <View className="bg-slate-100 p-4 rounded-full mb-3">
                    <BarChart3 size={32} color="#94a3b8" />
                </View>
                <Text className="text-sm text-slate-400">
                    Bu Alan İçin Henüz Net Kaydı Bulunmuyor
                </Text>
            </View>
        );
    }

    // Helper function to draw a line between two points
    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, key: string) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        
        return (
            <View
                key={key}
                className="absolute"
                style={{
                    left: centerX - length / 2,
                    top: centerY - 1,
                    width: length,
                    height: 2.5,
                    backgroundColor: color,
                    transform: [{ rotate: `${angle}deg` }],
                }}
            />
        );
    };

    return (
        <View>
            <Pressable 
                className="relative" 
                style={{ height: chartHeight }}
                onPress={() => setSelectedDot(null)}
            >
                {/* Y-Axis */}
                <View
                    className="absolute bg-slate-300"
                    style={{
                        left: paddingLeft,
                        top: paddingTop,
                        width: 1,
                        height: graphHeight,
                    }}
                />
                
                {/* Y-Axis Labels */}
                {yAxisLabels.map((value, index) => {
                    const y = paddingTop + graphHeight - (value / maxDisplayValue) * graphHeight;
                    return (
                        <View
                            key={`ylabel-${index}`}
                            className="absolute"
                            style={{
                                left: 0,
                                top: y - 8,
                                width: paddingLeft - 5,
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                            }}
                        >
                            <Text className="text-[10px] text-slate-500 font-medium">
                                {value.toFixed(0)}
                            </Text>
                        </View>
                    );
                })}

                {/* Grid Lines */}
                {yAxisLabels.map((value, index) => {
                    const y = paddingTop + graphHeight - (value / maxDisplayValue) * graphHeight;
                    return (
                        <View
                            key={`grid-${index}`}
                            className="absolute bg-slate-100"
                            style={{
                                left: paddingLeft,
                                top: y,
                                width: graphWidth,
                                height: 1,
                            }}
                        />
                    );
                })}

                {/* X-Axis */}
                <View
                    className="absolute bg-slate-300"
                    style={{
                        left: paddingLeft,
                        top: paddingTop + graphHeight,
                        width: graphWidth,
                        height: 1,
                    }}
                />

                {/* Lines for each calculation */}
                {validSeriesData.map((series, seriesIndex) => {
                    return series.points.map((point, pointIndex) => {
                        if (pointIndex === 0) return null;
                        const prevPoint = series.points[pointIndex - 1];
                        return drawLine(
                            prevPoint.x,
                            prevPoint.y,
                            point.x,
                            point.y,
                            series.color,
                            `line-${seriesIndex}-${pointIndex}`
                        );
                    });
                })}

                {/* Points for each calculation */}
                {validSeriesData.map((series, seriesIndex) => {
                    return series.points.map((point, pointIndex) => {
                        const isSelected = selectedDot?.seriesIndex === seriesIndex && selectedDot?.pointIndex === pointIndex;
                        return (
                            <TouchableOpacity
                                key={`point-${seriesIndex}-${pointIndex}`}
                                className="absolute"
                                style={{
                                    left: point.x - 8,
                                    top: point.y - 8,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: series.color,
                                    borderWidth: 2,
                                    borderColor: '#ffffff',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 2,
                                    elevation: 2,
                                    zIndex: 10,
                                }}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    Haptics.selectionAsync();
                                    if (isSelected) {
                                        setSelectedDot(null);
                                    } else {
                                        setSelectedDot({ seriesIndex, pointIndex });
                                    }
                                }}
                                activeOpacity={0.7}
                            />
                        );
                    });
                })}

                {/* Tooltip for selected dot */}
                {selectedDot && (() => {
                    const series = validSeriesData[selectedDot.seriesIndex];
                    const point = series.points[selectedDot.pointIndex];
                    const subjectIndex = selectedDot.pointIndex;
                    const subject = series.subjects[subjectIndex];
                    const net = series.nets[subjectIndex];
                    const tooltipWidth = 200;
                    const tooltipLeft = Math.max(10, Math.min(point.x - tooltipWidth / 2, chartWidth - tooltipWidth - 10));
                    // Position tooltip above the dot, or below if not enough space
                    const tooltipHeight = 80;
                    const tooltipTop = point.y - tooltipHeight - 10 < paddingTop 
                        ? point.y + 20 
                        : point.y - tooltipHeight - 10;
                    
                    return (
                        <Pressable
                            className="absolute bg-white rounded-xl shadow-lg border border-slate-200 p-3"
                            style={{
                                left: tooltipLeft,
                                top: tooltipTop,
                                width: tooltipWidth,
                                zIndex: 100,
                            }}
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedDot(null);
                            }}
                        >
                            <Text className="text-base font-bold text-slate-800 mb-2">
                                {series.name}
                            </Text>
                            <View className="border-t border-slate-100 pt-2">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-slate-600 flex-1">
                                        {subject}
                                    </Text>
                                    <Text className="text-sm font-semibold text-slate-800 ml-2">
                                        {net.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    );
                })()}

                {/* X-Axis Labels */}
                {subjects.map((subject, index) => {
                    const x = paddingLeft + (graphWidth / (subjects.length - 1 || 1)) * index;
                    return (
                        <View
                            key={`xlabel-${index}`}
                            className="absolute"
                            style={{
                                left: x - 35,
                                top: paddingTop + graphHeight + 10,
                                width: 70,
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                className="text-[9px] text-slate-600 font-medium text-center"
                                numberOfLines={1}
                            >
                                {subject}
                            </Text>
                        </View>
                    );
                })}
            </Pressable>

            {/* Legend */}
            <View className="mt-4 pt-4 border-t border-slate-200">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                        Sınavlar
                    </Text>
                    <Text className="text-xs text-slate-400 font-medium">
                        (Soldan Sağa En Yeniden En Eskiye)
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-3">
                    {validSeriesData.map((series, index) => {
                        const formattedDate = series.date.toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                        });
                        return (
                            <View
                                key={`legend-${index}`}
                                className="flex-row items-center"
                            >
                                <View
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: series.color }}
                                />
                                <Text
                                    className="text-[10px] text-slate-600 font-medium"
                                    numberOfLines={1}
                                    style={{ maxWidth: 100 }}
                                >
                                    {series.name} ({formattedDate})
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

// NetChart component interfaces
interface NetChartData {
    label: string;
    net: number;
    maxNet: number;
    color: string;
}

interface NetChartProps {
    data: NetChartData[];
}

function NetChart({ data }: NetChartProps) {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 80; // Account for padding
    const chartHeight = 220;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 50;
    const graphWidth = chartWidth - paddingLeft - paddingRight;
    const graphHeight = chartHeight - paddingTop - paddingBottom;

    // Find max net value for Y-axis scaling
    const maxNetValue = Math.max(...data.map(d => d.maxNet), 1);
    const maxDisplayValue = Math.ceil(maxNetValue / 10) * 10; // Round up to nearest 10

    // Calculate Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels: number[] = [];
    for (let i = 0; i <= yAxisSteps; i++) {
        yAxisLabels.push((maxDisplayValue / yAxisSteps) * i);
    }

    // Calculate point positions
    const points = data.map((item, index) => {
        const x = paddingLeft + (graphWidth / (data.length - 1 || 1)) * index;
        const y = paddingTop + graphHeight - (item.net / maxDisplayValue) * graphHeight;
        return { x, y, ...item };
    });

    // Helper function to draw a line between two points
    const drawLine = (x1: number, y1: number, x2: number, y2: number, key: string) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Adjust position to account for rotation around center
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        
        return (
            <View
                key={key}
                className="absolute"
                style={{
                    left: centerX - length / 2,
                    top: centerY - 1,
                    width: length,
                    height: 2,
                    backgroundColor: '#94a3b8',
                    transform: [{ rotate: `${angle}deg` }],
                }}
            />
        );
    };

    return (
        <View>
            <View className="relative" style={{ height: chartHeight }}>
                {/* Y-Axis */}
                <View
                    className="absolute bg-slate-300"
                    style={{
                        left: paddingLeft,
                        top: paddingTop,
                        width: 1,
                        height: graphHeight,
                    }}
                />
                
                {/* Y-Axis Labels */}
                {yAxisLabels.map((value, index) => {
                    const y = paddingTop + graphHeight - (value / maxDisplayValue) * graphHeight;
                    return (
                        <View
                            key={`ylabel-${index}`}
                            className="absolute"
                            style={{
                                left: 0,
                                top: y - 8,
                                width: paddingLeft - 5,
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                            }}
                        >
                            <Text className="text-[10px] text-slate-500 font-medium">
                                {value.toFixed(0)}
                            </Text>
                        </View>
                    );
                })}

                {/* Grid Lines */}
                {yAxisLabels.map((value, index) => {
                    const y = paddingTop + graphHeight - (value / maxDisplayValue) * graphHeight;
                    return (
                        <View
                            key={`grid-${index}`}
                            className="absolute bg-slate-100"
                            style={{
                                left: paddingLeft,
                                top: y,
                                width: graphWidth,
                                height: 1,
                            }}
                        />
                    );
                })}

                {/* X-Axis */}
                <View
                    className="absolute bg-slate-300"
                    style={{
                        left: paddingLeft,
                        top: paddingTop + graphHeight,
                        width: graphWidth,
                        height: 1,
                    }}
                />

                {/* Lines connecting points */}
                {points.map((point, index) => {
                    if (index === 0) return null;
                    const prevPoint = points[index - 1];
                    return drawLine(prevPoint.x, prevPoint.y, point.x, point.y, `line-${index}`);
                })}

                {/* Points */}
                {points.map((point, index) => (
                    <View
                        key={`point-${index}`}
                        className="absolute"
                        style={{
                            left: point.x - 7,
                            top: point.y - 7,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: point.color,
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 3,
                        }}
                    />
                ))}

                {/* X-Axis Labels */}
                {points.map((point, index) => (
                    <View
                        key={`xlabel-${index}`}
                        className="absolute"
                        style={{
                            left: point.x - 35,
                            top: paddingTop + graphHeight + 10,
                            width: 70,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            className="text-[9px] text-slate-600 font-medium text-center"
                            numberOfLines={1}
                        >
                            {point.label}
                        </Text>
                        <Text
                            className="text-[10px] font-semibold mt-1"
                            style={{ color: point.color }}
                        >
                            {point.net.toFixed(1)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

// Helper function to calculate net from saved values
const getNetFromValue = (value: { correct: string; wrong: string }) => {
    const d = parseFloat(value.correct.replace(',', '.')) || 0;
    const y = parseFloat(value.wrong.replace(',', '.')) || 0;
    const net = d - y / 4;
    return net < 0 ? 0 : net;
};

// Calculation functions (same as in yks.tsx)
const calculateTYTHamPuan = (
    turkceNet: number,
    matNet: number,
    sosyalNet: number,
    fenNet: number
) => {
    const base = 145.20;
    return base + 
        (turkceNet * 2.83) + 
        (sosyalNet * 2.99) + 
        (matNet * 3.28) + 
        (fenNet * 2.53);
};

const calculateSAYHamPuan = (
    turkceNet: number,
    matNet: number,
    sosyalNet: number,
    fenNet: number,
    aytMatNet: number,
    fizikNet: number,
    kimyaNet: number,
    biyolojiNet: number
) => {
    const base = 132.74;
    const tytKatkisi = 
        (turkceNet * 1.20) + 
        (sosyalNet * 1.27) + 
        (matNet * 1.39) + 
        (fenNet * 1.07);
    const aytKatkisi = 
        (aytMatNet * 2.89) + 
        (fizikNet * 2.46) + 
        (kimyaNet * 2.53) + 
        (biyolojiNet * 2.61);
    return base + tytKatkisi + aytKatkisi;
};

const calculateEAHamPuan = (
    turkceNet: number,
    matNet: number,
    sosyalNet: number,
    fenNet: number,
    aytMatNet: number,
    edebiyatNet: number,
    tarih1Net: number,
    cografya1Net: number
) => {
    const base = 129.34;
    const tytKatkisi = 
        (turkceNet * 1.19) + 
        (sosyalNet * 1.26) + 
        (matNet * 1.38) + 
        (fenNet * 1.07);
    const aytKatkisi = 
        (aytMatNet * 2.88) + 
        (edebiyatNet * 2.94) + 
        (tarih1Net * 2.53) + 
        (cografya1Net * 2.85);
    return base + tytKatkisi + aytKatkisi;
};

const calculateSOZHamPuan = (
    turkceNet: number,
    matNet: number,
    sosyalNet: number,
    fenNet: number,
    edebiyatNet: number,
    tarih1Net: number,
    cografya1Net: number,
    tarih2Net: number,
    cografya2Net: number,
    felsefeNet: number,
    dinNet: number
) => {
    const base = 129.61;
    const tytKatkisi = 
        (turkceNet * 1.13) + 
        (sosyalNet * 1.19) + 
        (matNet * 1.31) + 
        (fenNet * 1.01);
    const aytKatkisi = 
        (edebiyatNet * 2.79) + 
        (tarih1Net * 2.39) + 
        (cografya1Net * 2.70) + 
        (tarih2Net * 3.80) + 
        (cografya2Net * 2.47) + 
        (felsefeNet * 3.76) + 
        (dinNet * 2.36);
    return base + tytKatkisi + aytKatkisi;
};

const calculateDILHamPuan = (
    turkceNet: number,
    matNet: number,
    sosyalNet: number,
    fenNet: number,
    ydtNet: number
) => {
    const base = 105.92;
    return base + 
        (turkceNet * 1.53) + 
        (sosyalNet * 1.62) + 
        (matNet * 1.77) + 
        (fenNet * 1.37) + 
        (ydtNet * 2.60);
};

// Helper function to recalculate all scores, yerleştirme puanları, and estimated ranks
const recalculateAllScores = (
    tytValues: Record<string, { correct: string; wrong: string }>,
    aytValues: Record<string, { correct: string; wrong: string }>,
    diplomaGrade: string,
    kirikOBP: boolean
) => {
    // Calculate TYT nets
    const turkceNet = getNetFromValue(tytValues.turkce || { correct: '0', wrong: '0' });
    const matematikNet = getNetFromValue(tytValues.matematik || { correct: '0', wrong: '0' });
    const sosyalNet = getNetFromValue(tytValues.sosyal || { correct: '0', wrong: '0' });
    const fenNet = getNetFromValue(tytValues.fen || { correct: '0', wrong: '0' });

    // Check baraj
    const passesBaraj = turkceNet >= 0.5 || matematikNet >= 0.5;

    // Calculate AYT nets
    const aytMatNet = getNetFromValue(aytValues.aytMatematik || { correct: '0', wrong: '0' });
    const aytFizikNet = getNetFromValue(aytValues.aytFizik || { correct: '0', wrong: '0' });
    const aytKimyaNet = getNetFromValue(aytValues.aytKimya || { correct: '0', wrong: '0' });
    const aytBiyolojiNet = getNetFromValue(aytValues.aytBiyoloji || { correct: '0', wrong: '0' });
    const aytEdebiyatNet = getNetFromValue(aytValues.aytEdebiyat || { correct: '0', wrong: '0' });
    const aytTarih1Net = getNetFromValue(aytValues.aytTarih1 || { correct: '0', wrong: '0' });
    const aytCografya1Net = getNetFromValue(aytValues.aytCografya1 || { correct: '0', wrong: '0' });
    const aytTarih2Net = getNetFromValue(aytValues.aytTarih2 || { correct: '0', wrong: '0' });
    const aytCografya2Net = getNetFromValue(aytValues.aytCografya2 || { correct: '0', wrong: '0' });
    const aytFelsefeNet = getNetFromValue(aytValues.aytFelsefe || { correct: '0', wrong: '0' });
    const aytDinNet = getNetFromValue(aytValues.aytDin || { correct: '0', wrong: '0' });
    const aytYdtNet = aytValues.aytYdt ? getNetFromValue(aytValues.aytYdt) : 0;

    // Calculate ham puanları
    const tytHamPuan = passesBaraj ? calculateTYTHamPuan(turkceNet, matematikNet, sosyalNet, fenNet) : 0;
    const sayHamPuan = passesBaraj ? calculateSAYHamPuan(
        turkceNet, matematikNet, sosyalNet, fenNet,
        aytMatNet, aytFizikNet, aytKimyaNet, aytBiyolojiNet
    ) : 0;
    const eaHamPuan = passesBaraj ? calculateEAHamPuan(
        turkceNet, matematikNet, sosyalNet, fenNet,
        aytMatNet, aytEdebiyatNet, aytTarih1Net, aytCografya1Net
    ) : 0;
    const sozHamPuan = passesBaraj ? calculateSOZHamPuan(
        turkceNet, matematikNet, sosyalNet, fenNet,
        aytEdebiyatNet, aytTarih1Net, aytCografya1Net,
        aytTarih2Net, aytCografya2Net, aytFelsefeNet, aytDinNet
    ) : 0;
    const dilHamPuan = (passesBaraj && aytValues.aytYdt) 
        ? calculateDILHamPuan(turkceNet, matematikNet, sosyalNet, fenNet, aytYdtNet)
        : undefined;

    // Calculate OBP ek puanı
    const diplomaNotu = parseFloat(diplomaGrade.replace(',', '.')) || 80;
    const obpKatsayisi = kirikOBP ? 0.3 : 0.6;
    const obpEkPuan = diplomaNotu * obpKatsayisi;

    // Calculate yerleştirme puanları
    const tytYerlesme = tytHamPuan + obpEkPuan;
    const sayYerlesme = sayHamPuan + obpEkPuan;
    const eaYerlesme = eaHamPuan + obpEkPuan;
    const sozYerlesme = sozHamPuan + obpEkPuan;
    const dilYerlesme = dilHamPuan ? dilHamPuan + obpEkPuan : undefined;

    // Calculate estimated ranks
    const tytEstimatedRank = (passesBaraj && tytYerlesme > 0) 
        ? estimateRanking(tytYerlesme, 'TYT') 
        : null;
    const sayEstimatedRank = (passesBaraj && sayYerlesme > 0 && (aytMatNet > 0 || aytFizikNet > 0 || aytKimyaNet > 0 || aytBiyolojiNet > 0))
        ? estimateRanking(sayYerlesme, 'SAY')
        : null;
    const eaEstimatedRank = (passesBaraj && eaYerlesme > 0 && (aytMatNet > 0 || aytEdebiyatNet > 0 || aytTarih1Net > 0 || aytCografya1Net > 0))
        ? estimateRanking(eaYerlesme, 'EA')
        : null;
    const sozEstimatedRank = (passesBaraj && sozYerlesme > 0 && (aytEdebiyatNet > 0 || aytTarih1Net > 0 || aytCografya1Net > 0))
        ? estimateRanking(sozYerlesme, 'SÖZ')
        : null;
    const dilEstimatedRank = (passesBaraj && dilYerlesme && dilYerlesme > 0 && aytYdtNet > 0)
        ? estimateRanking(dilYerlesme, 'DİL')
        : null;

    return {
        tytHamPuan,
        sayHamPuan,
        eaHamPuan,
        sozHamPuan,
        dilHamPuan,
        tytYerlesme,
        sayYerlesme,
        eaYerlesme,
        sozYerlesme,
        dilYerlesme,
        tytEstimatedRank,
        sayEstimatedRank,
        eaEstimatedRank,
        sozEstimatedRank,
        dilEstimatedRank,
    };
};

// Read-only section row component for displaying saved calculation values
interface ReadOnlySectionRowProps {
    label: string;
    help?: string;
    value: { correct: string; wrong: string };
}

function ReadOnlySectionRow({ label, help, value }: ReadOnlySectionRowProps) {
    const net = getNetFromValue(value);

    return (
        <View className="mb-3 py-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-slate-800">{label}</Text>
                {help && (
                    <Text className="text-xs text-slate-400 font-medium text-right max-w-[140px]">{help}</Text>
                )}
            </View>
            <View className="flex-row gap-2">
                <View className="flex-1">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Doğru</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <Text className="text-sm text-slate-900 font-medium">{value.correct || '0'}</Text>
                    </View>
                </View>
                <View className="flex-1">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Yanlış</Text>
                    <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <Text className="text-sm text-slate-900 font-medium">{value.wrong || '0'}</Text>
                    </View>
                </View>
                <View className="w-20 items-center justify-center">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Net</Text>
                    <View className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 w-full items-center">
                        <Text className="text-sm font-semibold text-blue-700">{net.toFixed(2).replace('.', ',')}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// Editable section row component for editing calculation values
interface EditableSectionRowProps {
    label: string;
    help?: string;
    value: { correct: string; wrong: string };
    onChangeCorrect: (text: string) => void;
    onChangeWrong: (text: string) => void;
    maxLimit?: number;
}

function EditableSectionRow({ label, help, value, onChangeCorrect, onChangeWrong, maxLimit }: EditableSectionRowProps) {
    const net = getNetFromValue(value);

    const handleCorrectChange = (text: string) => {
        let cleanedText = text.replace(/[^0-9,\.]/g, '');
        if (maxLimit && cleanedText) {
            const numValue = parseFloat(cleanedText.replace(',', '.')) || 0;
            if (numValue > maxLimit) {
                cleanedText = maxLimit.toString();
            }
        }
        
        // Validate that correct + wrong doesn't exceed total question count
        if (maxLimit) {
            const correct = parseFloat(cleanedText.replace(',', '.')) || 0;
            const wrong = parseFloat(value.wrong.replace(',', '.')) || 0;
            const total = correct + wrong;
            
            if (total > maxLimit) {
                Alert.alert(
                    'Uyarı',
                    `${label} için toplam doğru ve yanlış sayısı (${total}) toplam soru sayısını (${maxLimit}) geçemez.`,
                    [{ text: 'Tamam' }]
                );
                return; // Don't update if validation fails
            }
        }
        
        onChangeCorrect(cleanedText);
    };

    const handleWrongChange = (text: string) => {
        let cleanedText = text.replace(/[^0-9,\.]/g, '');
        if (maxLimit && cleanedText) {
            const numValue = parseFloat(cleanedText.replace(',', '.')) || 0;
            if (numValue > maxLimit) {
                cleanedText = maxLimit.toString();
            }
        }
        
        // Validate that correct + wrong doesn't exceed total question count
        if (maxLimit) {
            const correct = parseFloat(value.correct.replace(',', '.')) || 0;
            const wrong = parseFloat(cleanedText.replace(',', '.')) || 0;
            const total = correct + wrong;
            
            if (total > maxLimit) {
                Alert.alert(
                    'Uyarı',
                    `${label} için toplam doğru ve yanlış sayısı (${total}) toplam soru sayısını (${maxLimit}) geçemez.`,
                    [{ text: 'Tamam' }]
                );
                return; // Don't update if validation fails
            }
        }
        
        onChangeWrong(cleanedText);
    };

    return (
        <View className="mb-3 py-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-slate-800">{label}</Text>
                {help && (
                    <Text className="text-xs text-slate-400 font-medium text-right max-w-[140px]">{help}</Text>
                )}
            </View>
            <View className="flex-row gap-2">
                <View className="flex-1">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Doğru</Text>
                    <TextInput
                        keyboardType="numeric"
                        value={value.correct}
                        onChangeText={handleCorrectChange}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Yanlış</Text>
                    <TextInput
                        keyboardType="numeric"
                        value={value.wrong}
                        onChangeText={handleWrongChange}
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium"
                    />
                </View>
                <View className="w-20 items-center justify-center">
                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Net</Text>
                    <View className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 w-full items-center">
                        <Text className="text-sm font-semibold text-blue-700">{net.toFixed(2).replace('.', ',')}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
