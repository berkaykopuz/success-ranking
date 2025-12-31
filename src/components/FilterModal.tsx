import { ArrowDown, ArrowUp, X } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useFilterStore } from '../store/filterStore';
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
        setFilter, resetFilters
    } = useFilterStore();

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
        sortOrder
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
                sortOrder
            });
        }
    }, [visible, minScore, maxScore, minRank, maxRank, sortBy, sortOrder, city, university, department, quotaType, language]);

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
            sortOrder: 'desc'
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
                        >
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
                                                className={`flex-1 py-4 px-2 rounded-xl border items-center justify-center ${index > 0 ? 'ml-1.5' : ''} ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                                                style={{ flex: 1 }}
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
                                                    className={`flex-1 py-4 px-2 rounded-xl border items-center justify-center ${index > 0 ? 'ml-1.5' : ''} ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                                                    style={{ flex: 1 }}
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
                                    <View className="flex-row flex-wrap gap-2.5">
                                        {LANGUAGES.map((lang) => {
                                            const isSelected = localFilters.language.includes(lang);
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
                                                    className={`px-5 py-3 rounded-xl border items-center justify-center ${
                                                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                                                    }`}
                                                >
                                                    <View className="flex-row items-center">
                                                        {isSelected ? (
                                                            <Text className="text-white text-base font-bold mr-2">✓</Text>
                                                        ) : (
                                                            <View
                                                                className="w-4 h-4 rounded border-2 mr-2 items-center justify-center border-slate-300"
                                                            />
                                                        )}
                                                        <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
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
                                        onPress={() => setRangeType('puan')}
                                        className={`flex-1 py-4 px-2 rounded-xl border items-center justify-center ${rangeType === 'puan' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                                        style={{ flex: 1 }}
                                    >
                                        <Text className={`text-sm font-semibold ${rangeType === 'puan' ? 'text-white' : 'text-slate-600'}`}>
                                            Puan Aralığı
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setRangeType('siralama')}
                                        className={`flex-1 py-4 px-2 rounded-xl border items-center justify-center ml-1.5 ${rangeType === 'siralama' ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                                        style={{ flex: 1 }}
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
                                    className="flex-1 py-3 rounded-full border border-slate-200 items-center justify-center bg-white"
                                >
                                    <Text className="font-bold text-slate-600 text-sm">Temizle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleApply}
                                    className="flex-1 py-3 rounded-full bg-blue-600 items-center justify-center shadow-lg shadow-blue-200"
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