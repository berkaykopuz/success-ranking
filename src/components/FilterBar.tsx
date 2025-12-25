import { Filter, X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFilterStore } from '../store/filterStore';

const CATEGORIES = ['SAY', 'SÖZ', 'EA', 'DİL'];

const SUB_CATEGORIES: Record<string, string[]> = {
    'SAY': ['Mühendislik', 'Tıp', 'Mimarlık', 'Diş Hekimliği', 'Matematik'],
    'SÖZ': ['Tarih', 'Coğrafya', 'Edebiyat', 'Gazetecilik', 'İlahiyat'],
    'EA': ['Hukuk', 'İşletme', 'Psikoloji', 'PDR', 'Ekonomi'],
    'DİL': ['İngilizce Öğr.', 'Mütercim', 'Çeviribilim', 'Almanca', 'Fransızca'],
};

export const FilterBar = () => {
    const { searchQuery, setSearchQuery, year, scoreType, city, department, setFilter } = useFilterStore();

    const handleCategoryPress = (category: string) => {
        if (scoreType === category) {
            setFilter('scoreType', null);
            setFilter('department', null);
        } else {
            setFilter('scoreType', category);
            setFilter('department', null);
        }
    };

    const handleSubCategoryPress = (sub: string) => {
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
                    <TextInput
                        className="flex-1 text-base text-slate-400 font-medium"
                        placeholder="Üniversite veya bölüm ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            {/* Main Categories Row */}
            <View className="flex-row items-center mt-3 px-4">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingRight: 8 }}
                    className="flex-1 mr-2"
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            className={`px-5 py-2 justify-center items-center rounded-2xl shadow-sm border ${scoreType === cat
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-slate-200'
                                }`}
                            onPress={() => handleCategoryPress(cat)}
                        >
                            <Text
                                className={`text-lg font-bold tracking-wide ${scoreType === cat ? 'text-white' : 'text-slate-600'
                                    }`}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity className="flex-row items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm ml-2">
                    <Filter size={20} color="#475569" />
                </TouchableOpacity>
            </View>

            {/* Sub Categories (Visible only if scoreType is selected) */}
            {scoreType && SUB_CATEGORIES[scoreType] && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
                    className="mt-6"
                >
                    {SUB_CATEGORIES[scoreType].map((sub) => {
                        const isSelected = department === sub;
                        return (
                            <TouchableOpacity
                                key={sub}
                                onPress={() => handleSubCategoryPress(sub)}
                                className={`px-7 py-3 rounded-full border ${isSelected
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600'
                                        }`}
                                >
                                    {sub}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Active Filters Display */}
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
                                Yıl: {year}
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
                                Şehir: {city}
                            </Text>
                            <X size={12} color="#4338ca" />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </View>
    );
};