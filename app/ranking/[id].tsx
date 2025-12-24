import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Globe, Heart, Mail } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchRankingDetails } from '../../src/api/rankings';
import { useUserStore } from '../../src/store/userStore';

export default function RankingDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { toggleFavorite, isFavorite } = useUserStore();
    const isFav = id ? isFavorite(id as string) : false;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['ranking', id],
        queryFn: () => fetchRankingDetails(id as string),
        enabled: !!id,
    });

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
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={{ paddingTop: insets.top }} className="bg-blue-600 px-4 pb-4">
                <View className="flex-row justify-between items-center mb-4 mt-2">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-blue-500">
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => toggleFavorite(data)}
                        className="w-10 h-10 items-center justify-center rounded-full bg-blue-500"
                    >
                        <Heart
                            color="white"
                            size={24}
                            fill={isFav ? "white" : "transparent"}
                        />
                    </TouchableOpacity>
                </View>
                <Text className="text-white text-2xl font-bold leading-tight">{data.universityName}</Text>
                <Text className="text-blue-100 text-lg font-medium mt-1">{data.departmentName}</Text>
                <View className="flex-row items-center mt-2">
                    <View className="bg-blue-500 px-3 py-1 rounded-full mr-2">
                        <Text className="text-white text-xs font-bold">{data.scoreType}</Text>
                    </View>
                    <Text className="text-blue-200 text-sm">{data.faculty}</Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Info Cards */}
                <View className="flex-row flex-wrap p-4 gap-3">
                    <View className="w-[48%] bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Sıralama</Text>
                        <Text className="text-2xl font-bold text-gray-900">#{data.rank}</Text>
                    </View>
                    <View className="w-[48%] bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Puan</Text>
                        <Text className="text-2xl font-bold text-gray-900">{data.score.toFixed(2)}</Text>
                    </View>
                    <View className="w-[48%] bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Kontenjan</Text>
                        <Text className="text-2xl font-bold text-gray-900">{data.quota}</Text>
                    </View>
                    <View className="w-[48%] bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Yıl</Text>
                        <Text className="text-2xl font-bold text-gray-900">{data.year}</Text>
                    </View>
                </View>

                {/* History Section */}
                <View className="px-4 mt-2">
                    <Text className="text-lg font-bold text-gray-900 mb-3">Sıralama Geçmişi</Text>
                    <View className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <View className="flex-row bg-gray-50 border-b border-gray-200 p-3">
                            <Text className="flex-1 font-semibold text-gray-600 text-sm">Yıl</Text>
                            <Text className="flex-1 font-semibold text-gray-600 text-sm text-center">Sıralama</Text>
                            <Text className="flex-1 font-semibold text-gray-600 text-sm text-right">Puan</Text>
                        </View>
                        {data.history.map((h, i) => (
                            <View key={h.year} className={`flex-row p-3 ${i !== data.history.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <Text className="flex-1 text-gray-900 text-sm">{h.year}</Text>
                                <Text className="flex-1 text-gray-900 text-sm text-center">#{h.rank}</Text>
                                <Text className="flex-1 text-gray-900 text-sm text-right">{h.score.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Contact/About */}
                <View className="px-4 mt-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">Hakkında</Text>
                    {data.description && <Text className="text-gray-600 leading-6 mb-4">{data.description}</Text>}

                    {data.website && (
                        <View className="flex-row items-center mb-3">
                            <Globe size={18} color="#4B5563" className="mr-3" />
                            <Text className="text-blue-600 underline">{data.website}</Text>
                        </View>
                    )}
                    {data.contactEmail && (
                        <View className="flex-row items-center">
                            <Mail size={18} color="#4B5563" className="mr-3" />
                            <Text className="text-gray-700">{data.contactEmail}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
