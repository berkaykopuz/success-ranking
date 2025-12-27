import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Globe, Plus, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { fetchRankingDetails } from '../../src/api/rankings';
import { ListModal } from '../../src/components/ListModal';

export default function RankingDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isListModalVisible, setIsListModalVisible] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['ranking', id],
        queryFn: () => fetchRankingDetails(id as string),
        enabled: !!id,
    });

    const handleAddToList = () => {
        Haptics.selectionAsync();
        setIsListModalVisible(true);
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500">Detaylar yüklenemedi</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={{ paddingTop: insets.top }} className="bg-slate-900 px-4 pb-6 shadow-md z-10">
                <View className="flex-row justify-between items-center mb-6 mt-2">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleAddToList}
                        className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
                    >
                        <Plus
                            color="white"
                            size={24}
                        />
                    </TouchableOpacity>
                </View>
                <Text className="text-white text-3xl font-bold leading-tight tracking-tight mb-2">{data.universityName}</Text>
                <Text className="text-blue-100 text-lg font-medium">{data.departmentName}</Text>
                <View className="flex-row items-center mt-3">
                    <View className="bg-blue-600 px-3 py-1.5 rounded-lg mr-2 shadow-sm">
                        <Text className="text-white text-xs font-bold uppercase tracking-wider">{data.scoreType}</Text>
                    </View>
                    <Text className="text-slate-300 text-sm font-medium">{data.faculty}</Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Info Cards */}
                <View className="flex-row flex-wrap p-4 gap-3 -mt-4">
                    <View className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Sıralama</Text>
                        <Text className="text-2xl font-bold text-slate-800">#{data.rank}</Text>
                    </View>
                    <View className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Puan</Text>
                        <Text className="text-2xl font-bold text-slate-800">{data.score.toFixed(2)}</Text>
                    </View>
                    <View className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Kontenjan</Text>
                        <Text className="text-2xl font-bold text-slate-800">{data.quota}</Text>
                    </View>
                    <View className="w-[48%] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Yıl</Text>
                        <Text className="text-2xl font-bold text-slate-800">{data.year}</Text>
                    </View>
                </View>

                {/* History Section */}
                <View className="px-4 mt-2">
                    <Text className="text-lg font-bold text-slate-800 mb-3 px-1">Sıralama Geçmişi</Text>
                    <View className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <View className="flex-row bg-slate-50 border-b border-slate-100 p-3.5">
                            <Text className="flex-1 font-semibold text-slate-500 text-xs uppercase tracking-wide">Yıl</Text>
                            <Text className="flex-1 font-semibold text-slate-500 text-xs uppercase tracking-wide text-center">Sıralama</Text>
                            <Text className="flex-1 font-semibold text-slate-500 text-xs uppercase tracking-wide text-right">Puan</Text>
                        </View>
                        {data.history.map((h, i) => (
                            <View key={h.year} className={`flex-row p-3.5 ${i !== data.history.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <Text className="flex-1 text-slate-700 text-sm font-medium">{h.year}</Text>
                                <Text className="flex-1 text-slate-700 text-sm font-medium text-center">#{h.rank}</Text>
                                <Text className="flex-1 text-slate-700 text-sm font-medium text-right">{h.score.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Contact/About */}
                <View className="px-4 mt-8">
                    <Text className="text-lg font-bold text-slate-800 mb-3 px-1">Hakkında</Text>
                    <View className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        {data.description && <Text className="text-slate-600 leading-relaxed mb-5">{data.description}</Text>}

                        {data.website && (
                            <View className="flex-row items-center mb-3">
                                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
                                    <Globe size={16} color="#2563EB" />
                                </View>
                                <Text className="text-blue-600 font-medium">{data.website}</Text>
                            </View>
                        )}
                        {data.contactEmail && (
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-3">
                                    <Mail size={16} color="#64748B" />
                                </View>
                                <Text className="text-slate-700 font-medium">{data.contactEmail}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <ListModal
                visible={isListModalVisible}
                onClose={() => setIsListModalVisible(false)}
                item={data || null}
            />
        </View>
    );
}
