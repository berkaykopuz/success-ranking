import { Filter, X, Search } from 'lucide-react-native'; // Added Search icon
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics'; // Optional: Add for better UX
import { useFilterStore } from '../store/filterStore';
import { useUserStore } from '../store/userStore';
import { FilterModal } from './FilterModal';

const CATEGORIES = ['SAY', 'EA', 'SÖZ', 'DİL', 'TYT'];

const SUB_CATEGORIES: Record<string, string[]> = {
    'SAY': ['Mühendislik', 'Tıp', 'Mimarlık', 'Diş Hekimliği', 'Matematik'],
    'SÖZ': ['Tarih', 'Coğrafya', 'Edebiyat', 'Gazetecilik', 'İlahiyat'],
    'EA': ['Hukuk', 'İşletme', 'Psikoloji', 'PDR', 'Ekonomi'],
    'DİL': ['İngilizce Öğr.', 'Mütercim', 'Çeviribilim', 'Almanca', 'Fransızca'],
    'TYT': [],
};

export const FilterBar = () => {
    const { 
        searchQuery, 
        setSearchQuery, 
        year, 
        scoreType, 
        city, 
        department, 
        university,
        quotaType,
        language,
        minScore,
        maxScore,
        minRank,
        maxRank,
        sortBy,
        sortOrder,
        selectedYksCalculationId, 
        setFilter 
    } = useFilterStore();
    const { yksCalculations } = useUserStore();
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    
    const selectedYksCalculation = selectedYksCalculationId 
        ? yksCalculations.find(c => c.id === selectedYksCalculationId)
        : null;

    const handleCategoryPress = (category: string) => {
        // Haptic feedback for native feel
        Haptics.selectionAsync();
        
        if (scoreType === category) {
            setFilter('scoreType', null);
            setFilter('department', null);
        } else {
            setFilter('scoreType', category);
            setFilter('department', null);
        }
    };

    const handleSubCategoryPress = (sub: string) => {
        Haptics.selectionAsync();
        if (department === sub) {
            setFilter('department', null);
        } else {
            setFilter('department', sub);
        }
    };

    return (
        <View className="bg-slate-50 border-b border-slate-200 pb-4 pt-2">
            {/* Search Input */}
            <View className="px-4 py-2">
                <View className="flex-row items-center bg-white rounded-xl px-4 py-3.5 shadow-sm border border-slate-200">
                    <Search size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                    <TextInput
                        className="flex-1 text-base text-slate-700 font-medium" // Changed text color for better contrast
                        placeholder="Üniversite veya bölüm ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Main Categories Row */}
            <View className="flex-row items-center mt-3 px-4 gap-2.5 mb-1">
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => handleCategoryPress(cat)}
                        activeOpacity={0.7}
                        className={`flex-1 py-5 px-3 justify-center items-center rounded-2xl shadow-sm ${
                            scoreType === cat
                                ? 'bg-blue-600 shadow-blue-200'
                                : 'bg-white shadow-slate-100'
                        }`}
                        style={{
                            shadowColor: scoreType === cat ? '#3b82f6' : '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: scoreType === cat ? 0.2 : 0.05,
                            shadowRadius: 4,
                            elevation: scoreType === cat ? 4 : 2,
                        }}
                    >
                        <Text
                            className={`text-base font-bold tracking-wide ${
                                scoreType === cat ? 'text-white' : 'text-slate-700'
                            }`}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    className="flex-row items-center justify-center bg-white px-4 py-5 rounded-2xl border-2 border-slate-200"
                    onPress={() => {
                        Haptics.selectionAsync();
                        setFilterModalVisible(true);
                    }}
                    activeOpacity={0.7}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                    }}
                >
                    <Filter size={22} color="#475569" strokeWidth={2.5} />
                </TouchableOpacity>

                <FilterModal
                    visible={isFilterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                />
            </View>

            {/* Sub Categories */}
            {scoreType && SUB_CATEGORIES[scoreType] && (
                <View className="mt-3 px-4 mb-2">
                     <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {SUB_CATEGORIES[scoreType].map((sub) => {
                            const isSelected = department === sub;
                            return (
                                <TouchableOpacity
                                    key={sub}
                                    onPress={() => handleSubCategoryPress(sub)}
                                    className={`px-6 py-3.5 rounded-full ${
                                        isSelected
                                            ? 'bg-blue-600'
                                            : 'bg-white'
                                    }`}
                                    style={{
                                        shadowColor: isSelected ? '#3b82f6' : '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: isSelected ? 0.15 : 0.05,
                                        shadowRadius: 3,
                                        elevation: isSelected ? 3 : 1,
                                    }}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${
                                            isSelected ? 'text-white' : 'text-slate-700'
                                        }`}
                                    >
                                        {sub}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Active Filter Tags */}
            {(selectedYksCalculation || year || city || university || quotaType || 
              (language && language.length > 0) || minScore !== null || maxScore !== null || 
              minRank !== null || maxRank !== null || sortBy) && (
                <View className="mt-3 px-4 mb-2">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                    {selectedYksCalculation && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('selectedYksCalculationId', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {selectedYksCalculation.name}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {year && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('year', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {year}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {city && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('city', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {city}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {university && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('university', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {university}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {quotaType && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('quotaType', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {quotaType}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {language && language.length > 0 && language.map((lang) => (
                        <TouchableOpacity
                            key={lang}
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                const newLanguage = language.filter(l => l !== lang);
                                setFilter('language', newLanguage.length > 0 ? newLanguage : null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                {lang}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    ))}
                    {(minScore !== null || maxScore !== null) && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('minScore', null);
                                setFilter('maxScore', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                Puan: {minScore !== null ? minScore.toFixed(0) : '0'} - {maxScore !== null ? maxScore.toFixed(0) : '600'}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {(minRank !== null || maxRank !== null) && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('minRank', null);
                                setFilter('maxRank', null);
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                Sıralama: {minRank !== null ? minRank.toLocaleString() : '1'} - {maxRank !== null ? maxRank.toLocaleString() : '2.6M'}
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    {sortBy && (
                        <TouchableOpacity
                            className="bg-blue-100 px-4 py-2.5 rounded-full border-2 border-blue-200 flex-row items-center"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter('sortBy', null);
                                setFilter('sortOrder', 'desc');
                            }}
                            style={{
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-xs font-semibold text-blue-700 mr-2">
                                Sırala: {sortBy === 'score' ? 'Puan' : sortBy === 'rank' ? 'Sıralama' : sortBy === 'quota' ? 'Kontenjan' : 'Yıl'} ({sortOrder === 'asc' ? 'Artan' : 'Azalan'})
                            </Text>
                            <X size={14} color="#1e40af" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};