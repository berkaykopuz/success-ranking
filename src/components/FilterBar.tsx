import { Filter, X, Search } from 'lucide-react-native'; // Added Search icon
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics'; // Optional: Add for better UX
import { useFilterStore } from '../store/filterStore';
import { FilterModal } from './FilterModal';

const CATEGORIES = ['SAY', 'SÖZ', 'EA', 'DİL'];

const SUB_CATEGORIES: Record<string, string[]> = {
    'SAY': ['Mühendislik', 'Tıp', 'Mimarlık', 'Diş Hekimliği', 'Matematik'],
    'SÖZ': ['Tarih', 'Coğrafya', 'Edebiyat', 'Gazetecilik', 'İlahiyat'],
    'EA': ['Hukuk', 'İşletme', 'Psikoloji', 'PDR', 'Ekonomi'],
    'DİL': ['İngilizce Öğr.', 'Mütercim', 'Çeviribilim', 'Almanca', 'Fransızca'],
};

export const FilterBar = () => {
    const { searchQuery, setSearchQuery, year, scoreType, city, department, setFilter } = useFilterStore();
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);

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
            <View className="flex-row items-center mt-3 px-4">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingRight: 8 }} // Adjusted gap
                    className="flex-1 mr-2"
                >
                    {CATEGORIES.map((cat) => (
                        <Pressable
                            key={cat}
                            onPress={() => handleCategoryPress(cat)}
                            className={`px-5 py-2.5 justify-center items-center rounded-2xl border ${
                                scoreType === cat
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-slate-200'
                            }`}
                        >
                            <Text
                                className={`text-sm font-bold tracking-wide ${
                                    scoreType === cat ? 'text-white' : 'text-slate-600'
                                }`}
                            >
                                {cat}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    className="flex-row items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ml-2"
                    onPress={() => setFilterModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Filter size={20} color="#475569" />
                </TouchableOpacity>

                <FilterModal
                    visible={isFilterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                />
            </View>

            {/* Sub Categories */}
            {scoreType && SUB_CATEGORIES[scoreType] && (
                <View className="mt-4">
                     <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        {SUB_CATEGORIES[scoreType].map((sub) => {
                            const isSelected = department === sub;
                            return (
                                <TouchableOpacity
                                    key={sub}
                                    onPress={() => handleSubCategoryPress(sub)}
                                    className={`px-4 py-2 rounded-full border ${
                                        isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-slate-200'
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${
                                            isSelected ? 'text-white' : 'text-slate-600'
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

            {/* Active Chips (Year/City) */}
            {(year || city) && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    className="mt-4"
                >
                    {year && (
                        <TouchableOpacity
                            className="bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 flex-row items-center"
                            onPress={() => setFilter('year', null)}
                        >
                            <Text className="text-xs font-medium text-indigo-700 mr-1">
                                {year}
                            </Text>
                            <X size={12} color="#4338ca" />
                        </TouchableOpacity>
                    )}
                    {city && (
                        <TouchableOpacity
                            className="bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 flex-row items-center"
                            onPress={() => setFilter('city', null)}
                        >
                            <Text className="text-xs font-medium text-indigo-700 mr-1">
                                {city}
                            </Text>
                            <X size={12} color="#4338ca" />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </View>
    );
};