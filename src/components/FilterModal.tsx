import { ArrowDown, ArrowUp, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFilterStore } from '../store/filterStore';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
    const {
        minScore, maxScore, minRank, maxRank, sortBy, sortOrder, city, university, department,
        setFilter, resetFilters
    } = useFilterStore();

    const [localFilters, setLocalFilters] = useState({
        minScore: minScore?.toString() || '',
        maxScore: maxScore?.toString() || '',
        minRank: minRank?.toString() || '',
        maxRank: maxRank?.toString() || '',
        city: city || '',
        university: university || '',
        department: department || '',
        sortBy,
        sortOrder
    });

    useEffect(() => {
        if (visible) {
            setLocalFilters({
                minScore: minScore?.toString() || '',
                maxScore: maxScore?.toString() || '',
                minRank: minRank?.toString() || '',
                maxRank: maxRank?.toString() || '',
                city: city || '',
                university: university || '',
                department: department || '',
                sortBy,
                sortOrder
            });
        }
    }, [visible, minScore, maxScore, minRank, maxRank, sortBy, sortOrder, city, university, department]);

    const handleApply = () => {
        setFilter('minScore', localFilters.minScore ? Number(localFilters.minScore) : null);
        setFilter('maxScore', localFilters.maxScore ? Number(localFilters.maxScore) : null);
        setFilter('minRank', localFilters.minRank ? Number(localFilters.minRank) : null);
        setFilter('maxRank', localFilters.maxRank ? Number(localFilters.maxRank) : null);
        setFilter('city', localFilters.city || null);
        setFilter('university', localFilters.university || null);
        setFilter('department', localFilters.department || null);
        setFilter('sortBy', localFilters.sortBy);
        setFilter('sortOrder', localFilters.sortOrder);
        onClose();
    };

    const handleClear = () => {
        // Reset local state
        setLocalFilters({
            minScore: '',
            maxScore: '',
            minRank: '',
            maxRank: '',
            city: '',
            university: '',
            department: '',
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
            <View className="flex-1 bg-black/60 justify-center items-center px-4">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full"
                >
                    <View
                        className="bg-white rounded-3xl w-full flex-col shadow-2xl overflow-hidden"
                        style={{ maxHeight: '88%' }}
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                            <Text className="text-xl font-bold text-slate-800">Filtrele</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                            {/* Sort Section */}
                            <View className="py-5 border-b border-slate-100">
                                <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Sıralama</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {['score', 'rank', 'quota', 'year'].map((item) => {
                                        const labels: Record<string, string> = { score: 'Puan', rank: 'Sıralama', quota: 'Kontenjan', year: 'Yıl' };
                                        const isSelected = localFilters.sortBy === item;
                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: item as any }))}
                                                className={`px-4 py-3 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                                            >
                                                <Text className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
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
                            <View className="py-5 border-b border-slate-100 gap-4">
                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Şehir</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm"
                                        placeholder="Örn: Ankara, İstanbul..."
                                        value={localFilters.city}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, city: text }))}
                                    />
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Üniversite</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm"
                                        placeholder="Örn: ODTÜ, Boğaziçi..."
                                        value={localFilters.university}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, university: text }))}
                                    />
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Bölüm</Text>
                                    <TextInput
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm"
                                        placeholder="Örn: Bilgisayar Mühendisliği..."
                                        value={localFilters.department}
                                        onChangeText={(text) => setLocalFilters(prev => ({ ...prev, department: text }))}
                                    />
                                </View>
                            </View>

                            {/* Ranges Section */}
                            <View className="py-5 gap-5 mb-5">
                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Puan Aralığı</Text>
                                    <View className="flex-row gap-3">
                                        <TextInput
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm text-center"
                                            placeholder="Min"
                                            keyboardType="numeric"
                                            value={localFilters.minScore}
                                            onChangeText={(text) => setLocalFilters(prev => ({ ...prev, minScore: text }))}
                                        />
                                        <View className="justify-center"><Text className="text-slate-300 font-bold">-</Text></View>
                                        <TextInput
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm text-center"
                                            placeholder="Max"
                                            keyboardType="numeric"
                                            value={localFilters.maxScore}
                                            onChangeText={(text) => setLocalFilters(prev => ({ ...prev, maxScore: text }))}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Sıralama Aralığı</Text>
                                    <View className="flex-row gap-3">
                                        <TextInput
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm text-center"
                                            placeholder="Min"
                                            keyboardType="numeric"
                                            value={localFilters.minRank}
                                            onChangeText={(text) => setLocalFilters(prev => ({ ...prev, minRank: text }))}
                                        />
                                        <View className="justify-center"><Text className="text-slate-300 font-bold">-</Text></View>
                                        <TextInput
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium text-sm text-center"
                                            placeholder="Max"
                                            keyboardType="numeric"
                                            value={localFilters.maxRank}
                                            onChangeText={(text) => setLocalFilters(prev => ({ ...prev, maxRank: text }))}
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View className="p-5 border-t border-slate-100 bg-slate-50">
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleClear}
                                    className="flex-1 py-3.5 rounded-xl border border-slate-200 items-center justify-center bg-white"
                                >
                                    <Text className="font-bold text-slate-600">Temizle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleApply}
                                    className="flex-[2] py-3.5 rounded-xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-200"
                                >
                                    <Text className="font-bold text-white">Uygula</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
