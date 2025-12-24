import { Filter } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFilterStore } from '../store/filterStore';

export const FilterBar = () => {
    const { searchQuery, setSearchQuery, year, scoreType, city } = useFilterStore();

    return (
        <View className="bg-white border-b border-gray-200 pb-4">
            <View className="px-4 py-2">
                <TextInput
                    className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-900"
                    placeholder="Üniversite veya bölüm ara..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                className="mt-2"
            >
                <TouchableOpacity className="flex-row items-center bg-gray-100 px-5 py-2.5 rounded-full border border-gray-200">
                    <Filter size={20} color="#374151" className="mr-2" />
                    <Text className="text-sm font-medium text-gray-700">Filtreler</Text>
                </TouchableOpacity>

                {/* Mock Active Filters chips for visual feedback */}
                {year && (
                    <TouchableOpacity className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <Text className="text-xs font-medium text-blue-700">Yıl: {year}</Text>
                    </TouchableOpacity>
                )}
                {scoreType && (
                    <TouchableOpacity className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <Text className="text-xs font-medium text-blue-700">Puan Türü: {scoreType}</Text>
                    </TouchableOpacity>
                )}
                {city && (
                    <TouchableOpacity className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                        <Text className="text-xs font-medium text-blue-700">Şehir: {city}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};
