import { ArrowDown, ArrowUp, X, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useFilterStore } from '../store/filterStore';
import { useUserStore } from '../store/userStore';
import { RangeSlider } from './RangeSlider';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
}

const LANGUAGES = [
    'Türkçe',
    'Almanca',
    'Arapça',
    'Bulgarca',
    'Çince',
    'Ermenice',
    'Fransızca',
    'İngilizce',
    'İspanyolca',
    'İtalyanca',
    'Korece',
    'Lehçe',
    'Rusça'
];

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
    const {
        minScore, maxScore, minRank, maxRank, sortBy, sortOrder, city, university, department, quotaType, language,
        selectedYksCalculationId, setFilter, resetFilters
    } = useFilterStore();
    const { getYKSCalculations } = useUserStore();
    const yksCalculations = getYKSCalculations();
    const [isYksDropdownOpen, setIsYksDropdownOpen] = useState(false);
    const [isSliderDragging, setIsSliderDragging] = useState(false);
    const { width } = useWindowDimensions();

    // Default ranges for sliders
    const SCORE_MIN = 0;
    const SCORE_MAX = 600;
    const RANK_MIN = 1;
    const RANK_MAX = 2600000;

    // Persist slider positions across modal opens using ref
    const lastSliderPositions = useRef({
        minScore: minScore ?? SCORE_MIN,
        maxScore: maxScore ?? SCORE_MAX,
        minRank: minRank ?? RANK_MIN,
        maxRank: maxRank ?? RANK_MAX,
    });

    const [rangeType, setRangeType] = useState<'puan' | 'siralama'>('puan');
    const [localFilters, setLocalFilters] = useState({
        minScore: lastSliderPositions.current.minScore,
        maxScore: lastSliderPositions.current.maxScore,
        minRank: lastSliderPositions.current.minRank,
        maxRank: lastSliderPositions.current.maxRank,
        city: city || '',
        university: university || '',
        department: department || '',
        quotaType: quotaType || null,
        language: language || [],
        sortBy,
        sortOrder,
        selectedYksCalculationId: selectedYksCalculationId || null
    });

    useEffect(() => {
        if (visible) {
            // Update slider positions from store only if store has actual filter values
            // Otherwise, use the last slider positions we had
            const newMinScore = minScore !== null ? minScore : lastSliderPositions.current.minScore;
            const newMaxScore = maxScore !== null ? maxScore : lastSliderPositions.current.maxScore;
            const newMinRank = minRank !== null ? minRank : lastSliderPositions.current.minRank;
            const newMaxRank = maxRank !== null ? maxRank : lastSliderPositions.current.maxRank;

            // Update the ref with current positions
            lastSliderPositions.current = {
                minScore: newMinScore,
                maxScore: newMaxScore,
                minRank: newMinRank,
                maxRank: newMaxRank,
            };

            setLocalFilters({
                minScore: newMinScore,
                maxScore: newMaxScore,
                minRank: newMinRank,
                maxRank: newMaxRank,
                city: city || '',
                university: university || '',
                department: department || '',
                quotaType: quotaType || null,
                language: language || [],
                sortBy,
                sortOrder,
                selectedYksCalculationId: selectedYksCalculationId || null
            });
        }
    }, [visible, minScore, maxScore, minRank, maxRank, sortBy, sortOrder, city, university, department, quotaType, language, selectedYksCalculationId]);

    const handleApply = () => {
        // Only set to null if the full range is selected (no filter applied)
        const isScoreFullRange = localFilters.minScore === SCORE_MIN && localFilters.maxScore === SCORE_MAX;
        const isRankFullRange = localFilters.minRank === RANK_MIN && localFilters.maxRank === RANK_MAX;
        
        setFilter('minScore', isScoreFullRange ? null : localFilters.minScore);
        setFilter('maxScore', isScoreFullRange ? null : localFilters.maxScore);
        setFilter('minRank', isRankFullRange ? null : localFilters.minRank);
        setFilter('maxRank', isRankFullRange ? null : localFilters.maxRank);
        setFilter('city', localFilters.city || null);
        setFilter('university', localFilters.university || null);
        setFilter('department', localFilters.department || null);
        setFilter('quotaType', localFilters.quotaType);
        setFilter('language', localFilters.language.length > 0 ? localFilters.language : null);
        setFilter('sortBy', localFilters.sortBy);
        setFilter('sortOrder', localFilters.sortOrder);
        setFilter('selectedYksCalculationId', localFilters.selectedYksCalculationId);
        onClose();
    };

    const handleClear = () => {
        // Reset slider positions ref
        lastSliderPositions.current = {
            minScore: SCORE_MIN,
            maxScore: SCORE_MAX,
            minRank: RANK_MIN,
            maxRank: RANK_MAX,
        };

        // Reset local state
        setLocalFilters({
            minScore: SCORE_MIN,
            maxScore: SCORE_MAX,
            minRank: RANK_MIN,
            maxRank: RANK_MAX,
            city: '',
            university: '',
            department: '',
            quotaType: null,
            language: [],
            sortBy: null,
            sortOrder: 'desc',
            selectedYksCalculationId: null
        });

        // Reset store
        setFilter('minScore', null);
        setFilter('maxScore', null);
        setFilter('minRank', null);
        setFilter('maxRank', null);
        setFilter('city', null);
        setFilter('university', null);
        setFilter('department', null);
        setFilter('quotaType', null);
        setFilter('language', null);
        setFilter('sortBy', null);
        setFilter('sortOrder', 'desc');
        setFilter('selectedYksCalculationId', null);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <BlurView
                intensity={60}
                tint="dark"
                className="flex-1 justify-center items-center"
            >
                <View className="absolute inset-0 bg-black/30" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full items-center justify-center flex-1 px-4"
                >
                    <View
                        className="bg-white flex-1 flex-col shadow-2xl overflow-hidden w-full"
                        style={{ maxHeight: '80%', borderRadius: 20 }}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <Text className="text-xl font-bold text-slate-800">Filtrele</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            className="flex-1 px-5" 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            onScrollBeginDrag={() => setIsYksDropdownOpen(false)}
                            scrollEnabled={!isSliderDragging}
                        >
                            {/* YKS Calculation Section */}
                            <View className="pt-6 pb-6 border-b border-slate-100">
                                <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">NET GEÇMİŞİ</Text>
                                <View className="relative z-10">
                                    <TouchableOpacity
                                        onPress={() => setIsYksDropdownOpen(!isYksDropdownOpen)}
                                        className={`bg-slate-50 border border-slate-200 px-5 py-4 flex-row items-center justify-between ${
                                            isYksDropdownOpen ? 'rounded-t-xl' : 'rounded-xl'
                                        }`}
                                        style={isYksDropdownOpen ? {
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#cbd5e1',
                                        } : {}}
                                    >
                                        <Text className={`text-sm font-medium ${localFilters.selectedYksCalculationId ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {localFilters.selectedYksCalculationId
                                                ? yksCalculations.find(c => c.id === localFilters.selectedYksCalculationId)?.name || 'Seçili hesaplama'
                                                : 'Net geçmişi seçin...'}
                                        </Text>
                                        <ChevronDown 
                                            size={20} 
                                            color="#64748b" 
                                            style={{ transform: [{ rotate: isYksDropdownOpen ? '180deg' : '0deg' }] }}
                                        />
                                    </TouchableOpacity>
                                    
                                    {isYksDropdownOpen && (
                                        <View 
                                            className="absolute top-full left-0 right-0 bg-white border-2 border-slate-300 rounded-b-2xl shadow-xl z-50 overflow-hidden"
                                            style={{
                                                borderTopWidth: 1,
                                                borderTopColor: '#cbd5e1',
                                                borderTopLeftRadius: 0,
                                                borderTopRightRadius: 0,
                                                borderBottomLeftRadius: 16,
                                                borderBottomRightRadius: 16,
                                                borderLeftWidth: 2,
                                                borderRightWidth: 2,
                                                borderBottomWidth: 2,
                                                borderColor: '#cbd5e1',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.15,
                                                shadowRadius: 12,
                                                elevation: 8,
                                            }}
                                        >
                                            <ScrollView 
                                                className="max-h-60" 
                                                nestedScrollEnabled
                                                showsVerticalScrollIndicator={true}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setLocalFilters(prev => ({ ...prev, selectedYksCalculationId: null }));
                                                        setIsYksDropdownOpen(false);
                                                    }}
                                                    className={`px-5 py-3 border-b border-slate-200 ${!localFilters.selectedYksCalculationId ? 'bg-blue-50' : 'bg-white'}`}
                                                >
                                                    <Text className={`text-sm font-medium ${!localFilters.selectedYksCalculationId ? 'text-blue-600' : 'text-slate-600'}`}>
                                                        Seçimi kaldır
                                                    </Text>
                                                </TouchableOpacity>
                                                {yksCalculations.length === 0 ? (
                                                    <View className="px-5 py-4">
                                                        <Text className="text-sm text-slate-400 text-center">
                                                            Henüz net geçmişi yok
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    yksCalculations.map((calc, index) => {
                                                        const isSelected = localFilters.selectedYksCalculationId === calc.id;
                                                        const isLast = index === yksCalculations.length - 1;
                                                        // Get the best score for display
                                                        const scores = [
                                                            { type: 'TYT', score: calc.tytYerlesme },
                                                            { type: 'SAY', score: calc.sayYerlesme },
                                                            { type: 'EA', score: calc.eaYerlesme },
                                                            { type: 'SÖZ', score: calc.sozYerlesme },
                                                            ...(calc.dilYerlesme !== undefined ? [{ type: 'DİL', score: calc.dilYerlesme }] : []),
                                                        ].filter(s => s.score > 0).sort((a, b) => b.score - a.score);
                                                        const bestScore = scores[0];
                                                        
                                                        return (
                                                            <TouchableOpacity
                                                                key={calc.id}
                                                                onPress={() => {
                                                                    setLocalFilters(prev => ({ ...prev, selectedYksCalculationId: calc.id }));
                                                                    setIsYksDropdownOpen(false);
                                                                }}
                                                                className={`px-5 py-3 ${!isLast ? 'border-b border-slate-200' : ''} ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                                                            >
                                                                <Text className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-700'}`}>
                                                                    {calc.name}
                                                                </Text>
                                                                {bestScore && (
                                                                    <Text className={`text-xs mt-1 ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                                                                        En iyi: {bestScore.type} - {bestScore.score != null ? bestScore.score.toFixed(3) : 'N/A'}
                                                                    </Text>
                                                                )}
                                                            </TouchableOpacity>
                                                        );
                                                    })
                                                )}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                                {localFilters.selectedYksCalculationId && (
                                    <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <Text className="text-xs text-blue-700 font-medium mb-1">
                                            Seçili hesaplama ile puanının yettiği üniversiteler gösterilecek
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Sort Section */}
                            <View className="pt-6 pb-6 border-b border-slate-100">
                                <Text className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Sıralama</Text>
                                <View className="flex-row w-full">
                                    {['score', 'rank', 'quota', 'year'].map((item, index) => {
                                        const labels: Record<string, string> = { score: 'Puan', rank: 'Sıralama', quota: 'Kontenjan', year: 'Yıl' };
                                        const isSelected = localFilters.sortBy === item;
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: item as any }))}
                                                className={`flex-1 py-4 px-2 rounded-xl items-center justify-center ${index > 0 ? 'ml-1.5' : ''} ${isSelected ? 'bg-blue-600' : 'bg-slate-50'}`}
                                                style={{
                                                    flex: 1,
                                                    shadowColor: isSelected ? '#3b82f6' : '#000',
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowOpacity: isSelected ? 0.2 : 0.05,
                                                    shadowRadius: 4,
                                                    elevation: isSelected ? 4 : 2,
                                                }}
                                            >
                                                <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                                    {labels[item]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Order Toggle */}
                                <View className="flex-row mt-3 bg-slate-100 p-1 rounded-xl self-start">
                                    <TouchableOpacity
                                        onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                                        className={`flex-row items-center px-3 py-1.5 rounded-lg ${localFilters.sortOrder === 'asc' ? 'bg-white ' : ''}`}
                                    >
                                        <Text className={`mr-1.5 text-xs font-bold ${localFilters.sortOrder === 'asc' ? 'text-blue-600' : 'text-slate-500'}`}>Artan</Text>
                                        <ArrowUp size={14} color={localFilters.sortOrder === 'asc' ? '#2563eb' : '#94a3b8'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                                        className={`flex-row items-center px-3 py-1.5 rounded-lg ${localFilters.sortOrder === 'desc' ? 'bg-white ' : ''}`}
                                    >
                                        <Text className={`mr-1.5 text-xs font-bold ${localFilters.sortOrder === 'desc' ? 'text-blue-600' : 'text-slate-500'}`}>Azalan</Text>
                                        <ArrowDown size={14} color={localFilters.sortOrder === 'desc' ? '#2563eb' : '#94a3b8'} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Text Inputs Section */}
                            <View className="pt-6 pb-6 border-b border-slate-100">
                                <View className="mb-6">
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">ŞEHİR</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-700 font-medium text-sm"
                                        style={{ color: 'black' }}
                                        placeholder="Örn: Ankara, İstanbul..."
                                        placeholderTextColor="#64748b"
                                        value={localFilters.city}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, city: text }))}
                                    />
                                </View>
                                <View className="mb-6">
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">ÜNİVERSİTE</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-700 font-medium text-sm"
                                        style={{ color: 'black' }}
                                        placeholder="Örn: ODTÜ, Boğaziçi..."
                                        placeholderTextColor="#64748b"
                                        value={localFilters.university}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, university: text }))}
                                    />
                                </View>
                                <View className="mb-6">
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">BÖLÜM</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-700 font-medium text-sm"
                                        style={{ color: 'black' }}
                                        placeholder="Örn: Bilgisayar Mühendisliği..."
                                        placeholderTextColor="#64748b"
                                        value={localFilters.department}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, department: text }))}
                                    />
                                </View>
                                <View className="mb-6">
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">OKUL TÜRÜ</Text>
                                    <View className="flex-row w-full">
                                        {['Devlet', 'Vakıf'].map((item, index) => {
                                            const isSelected = localFilters.quotaType === item;
                                            return (
                                                <TouchableOpacity
                                                    key={item}
                                                    onPress={() => setLocalFilters(prev => ({ ...prev, quotaType: isSelected ? null : item }))}
                                                    className={`flex-1 py-4 px-2 rounded-xl items-center justify-center ${index > 0 ? 'ml-1.5' : ''} ${isSelected ? 'bg-blue-600' : 'bg-slate-50'}`}
                                                    style={{
                                                        flex: 1,
                                                        shadowColor: isSelected ? '#3b82f6' : '#000',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: isSelected ? 0.2 : 0.05,
                                                        shadowRadius: 4,
                                                        elevation: isSelected ? 4 : 2,
                                                    }}
                                                >
                                                    <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">DİL</Text>
                                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                                        {LANGUAGES.map((lang) => {
                                            const isSelected = localFilters.language.includes(lang);
                                            // Calculate button width: (container width - scroll padding - gaps) / columns
                                            // Using 3 columns for consistent rows and better text display
                                            // ScrollView has px-5 (20px each side = 40px total)
                                            const scrollPadding = 40; // px-5 on ScrollView = 20*2
                                            const gapSize = 8;
                                            const columns = 3;
                                            const availableWidth = width - scrollPadding;
                                            const buttonWidth = (availableWidth - (gapSize * (columns - 1))) / columns;
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={lang}
                                                    onPress={() => {
                                                        setLocalFilters(prev => ({
                                                            ...prev,
                                                            language: isSelected
                                                                ? prev.language.filter(l => l !== lang)
                                                                : [...prev.language, lang]
                                                        }));
                                                    }}
                                                    className={`px-3 py-2.5 rounded-xl items-center justify-center ${
                                                        isSelected ? 'bg-blue-600' : 'bg-slate-50'
                                                    }`}
                                                    style={{
                                                        width: buttonWidth,
                                                        minHeight: 40,
                                                        shadowColor: isSelected ? '#3b82f6' : '#000',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: isSelected ? 0.2 : 0.05,
                                                        shadowRadius: 4,
                                                        elevation: 2,
                                                    }}
                                                >
                                                    <View className="flex-row items-center">
                                                        <View className="w-4 h-4 mr-2 items-center justify-center" style={{ minWidth: 16, minHeight: 16 }}>
                                                            {isSelected ? (
                                                                <Text className="text-white text-base font-bold" style={{ lineHeight: 16, fontSize: 16, width: 16, height: 16, textAlign: 'center' }}>✓</Text>
                                                            ) : (
                                                                <View
                                                                    className="w-4 h-4 rounded border-2 items-center justify-center border-slate-300"
                                                                    style={{ width: 16, height: 16 }}
                                                                />
                                                            )}
                                                        </View>
                                                        <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`} numberOfLines={2} style={{ textAlign: 'center' }}>
                                                            {lang}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            {/* Ranges Section */}
                            <View className="pt-6 pb-5">
                                <Text className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">ARALIK FİLTRESİ</Text>
                                
                                {/* Range Type Selector */}
                                <View className="flex-row w-full mb-5">
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (rangeType !== 'puan') {
                                                // Reset both filters when switching
                                                lastSliderPositions.current.minScore = SCORE_MIN;
                                                lastSliderPositions.current.maxScore = SCORE_MAX;
                                                lastSliderPositions.current.minRank = RANK_MIN;
                                                lastSliderPositions.current.maxRank = RANK_MAX;
                                                setLocalFilters(prev => ({
                                                    ...prev,
                                                    minScore: SCORE_MIN,
                                                    maxScore: SCORE_MAX,
                                                    minRank: RANK_MIN,
                                                    maxRank: RANK_MAX,
                                                }));
                                                setFilter('minScore', null);
                                                setFilter('maxScore', null);
                                                setFilter('minRank', null);
                                                setFilter('maxRank', null);
                                            }
                                            setRangeType('puan');
                                        }}
                                        className={`flex-1 py-4 px-2 rounded-xl items-center justify-center ${rangeType === 'puan' ? 'bg-blue-600' : 'bg-slate-50'}`}
                                        style={{
                                            flex: 1,
                                            shadowColor: rangeType === 'puan' ? '#3b82f6' : '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: rangeType === 'puan' ? 0.2 : 0.05,
                                            shadowRadius: 4,
                                            elevation: rangeType === 'puan' ? 4 : 2,
                                        }}
                                    >
                                        <Text className={`text-sm font-semibold ${rangeType === 'puan' ? 'text-white' : 'text-slate-600'}`}>
                                            Puan Aralığı
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (rangeType !== 'siralama') {
                                                // Reset both filters when switching
                                                lastSliderPositions.current.minScore = SCORE_MIN;
                                                lastSliderPositions.current.maxScore = SCORE_MAX;
                                                lastSliderPositions.current.minRank = RANK_MIN;
                                                lastSliderPositions.current.maxRank = RANK_MAX;
                                                setLocalFilters(prev => ({
                                                    ...prev,
                                                    minScore: SCORE_MIN,
                                                    maxScore: SCORE_MAX,
                                                    minRank: RANK_MIN,
                                                    maxRank: RANK_MAX,
                                                }));
                                                setFilter('minScore', null);
                                                setFilter('maxScore', null);
                                                setFilter('minRank', null);
                                                setFilter('maxRank', null);
                                            }
                                            setRangeType('siralama');
                                        }}
                                        className={`flex-1 py-4 px-2 rounded-xl items-center justify-center ml-1.5 ${rangeType === 'siralama' ? 'bg-blue-600' : 'bg-slate-50'}`}
                                        style={{
                                            flex: 1,
                                            shadowColor: rangeType === 'siralama' ? '#3b82f6' : '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: rangeType === 'siralama' ? 0.2 : 0.05,
                                            shadowRadius: 4,
                                            elevation: rangeType === 'siralama' ? 4 : 2,
                                        }}
                                    >
                                        <Text className={`text-sm font-semibold ${rangeType === 'siralama' ? 'text-white' : 'text-slate-600'}`}>
                                            Sıralama Aralığı
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Conditional Range Slider */}
                                {rangeType === 'puan' ? (
                                    <RangeSlider
                                        key="score-range"
                                        label=""
                                        min={SCORE_MIN}
                                        max={SCORE_MAX}
                                        minValue={localFilters.minScore}
                                        maxValue={localFilters.maxScore}
                                        onValueChange={(min, max) => {
                                            lastSliderPositions.current.minScore = min;
                                            lastSliderPositions.current.maxScore = max;
                                            setLocalFilters(prev => ({ ...prev, minScore: min, maxScore: max }));
                                        }}
                                        onDragStateChange={setIsSliderDragging}
                                        step={1}
                                        formatValue={(val) => Math.round(val).toString()}
                                    />
                                ) : (
                                    <RangeSlider
                                        key="rank-range"
                                        label=""
                                        min={RANK_MIN}
                                        max={RANK_MAX}
                                        minValue={localFilters.minRank}
                                        maxValue={localFilters.maxRank}
                                        onValueChange={(min, max) => {
                                            lastSliderPositions.current.minRank = min;
                                            lastSliderPositions.current.maxRank = max;
                                            setLocalFilters(prev => ({ ...prev, minRank: min, maxRank: max }));
                                        }}
                                        onDragStateChange={setIsSliderDragging}
                                        step={1}
                                        formatValue={(val) => Math.round(val).toLocaleString('tr-TR')}
                                    />
                                )}
                            </View>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View className="px-5 pt-4 pb-4 border-t border-slate-100 bg-slate-50">
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleClear}
                                    className="flex-1 py-3 rounded-full items-center justify-center bg-white"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 4,
                                        elevation: 2,
                                    }}
                                >
                                    <Text className="font-bold text-slate-600 text-sm">Temizle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleApply}
                                    className="flex-1 py-3 rounded-full bg-blue-600 items-center justify-center"
                                    style={{
                                        shadowColor: '#3b82f6',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 4,
                                        elevation: 4,
                                    }}
                                >
                                    <Text className="font-bold text-white text-sm">Uygula</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
};