import { FlashList } from '@shopify/flash-list';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Folder, Plus, ChevronRight, Trash2, Edit2, History, List, ArrowLeft, GripVertical, BarChart3 } from 'lucide-react-native';
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
    } = useUserStore();

    const [viewMode, setViewMode] = useState<ViewMode>('main');
    const [selectedList, setSelectedList] = useState<PersonalList | null>(null);
    const [selectedCalculation, setSelectedCalculation] = useState<YKSCalculation | null>(null);
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
                Liste boş
            </Text>
            <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                Bu listeye henüz bölüm eklenmedi.
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
    };

    const handleBackToPastScores = () => {
        Haptics.selectionAsync();
        setViewMode('pastScores');
        setSelectedCalculation(null);
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
                            Henüz net kaydedilmedi
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
                    estimatedItemSize={150}
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
                        </View>
                        <Text className="text-xs text-slate-500 mb-4 ml-0">
                            Başlangıç: 145.47
                        </Text>

                        <ReadOnlySectionRow
                            label="Türkçe"
                            help="40 soru"
                            value={selectedCalculation.tytValues.turkce}
                        />
                        <ReadOnlySectionRow
                            label="Sosyal Bilimler"
                            help="20 soru"
                            value={selectedCalculation.tytValues.sosyal}
                        />
                        <ReadOnlySectionRow
                            label="Temel Matematik"
                            help="40 soru"
                            value={selectedCalculation.tytValues.matematik}
                        />
                        <ReadOnlySectionRow
                            label="Fen Bilimleri"
                            help="20 soru"
                            value={selectedCalculation.tytValues.fen}
                        />

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam TYT Net</Text>
                                <Text className="text-lg font-bold text-blue-600 tracking-tight">
                                    {tytTotalNet.toFixed(2).replace('.', ',')}
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
                        </View>
                        <Text className="text-xs text-slate-500 mb-4 ml-0">
                            Başlangıç: 132.87
                        </Text>

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

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-emerald-600 tracking-tight">
                                    {aytSayTotalNet.toFixed(2).replace('.', ',')}
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
                        </View>
                        <Text className="text-xs text-slate-500 mb-4 ml-0">
                            Başlangıç: 129.34
                        </Text>

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

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-purple-600 tracking-tight">
                                    {aytEaTotalNet.toFixed(2).replace('.', ',')}
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
                        </View>
                        <Text className="text-xs text-slate-500 mb-4 ml-0">
                            Başlangıç: 129.61
                        </Text>

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

                        <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
                                <Text className="text-lg font-bold text-orange-600 tracking-tight">
                                    {aytSozTotalNet.toFixed(2).replace('.', ',')}
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
                            </View>
                            <Text className="text-xs text-slate-500 mb-4 ml-0">
                                Başlangıç: 105.92
                            </Text>

                            <ReadOnlySectionRow
                                label="YDT (Yabancı Dil Testi)"
                                help="80 soru"
                                value={selectedCalculation.aytValues.aytYdt}
                            />

                            <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">YDT Net</Text>
                                    <Text className="text-lg font-bold text-rose-600 tracking-tight">
                                        {aytYdtNet.toFixed(2).replace('.', ',')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

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
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <View className="px-5 py-4 border-b border-slate-100 flex-row items-center">
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
                        Henüz net kaydedilmedi
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
                    Henüz net kaydı bulunmuyor
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
        subjects = ['AYT Mat', 'Fizik', 'Kimya', 'Biyoloji'];
        maxNets = [40, 14, 13, 13];
        maxDisplayValue = 40;
    } else if (type === 'ea') {
        subjects = ['AYT Mat', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'];
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
                    Bu alan için henüz net kaydı bulunmuyor
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

// Read-only section row component for displaying saved calculation values
interface ReadOnlySectionRowProps {
    label: string;
    help?: string;
    value: { correct: string; wrong: string };
}

function ReadOnlySectionRow({ label, help, value }: ReadOnlySectionRowProps) {
    const net = getNetFromValue(value);

    return (
        <View className="mb-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
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
