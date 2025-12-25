import { FlashList } from '@shopify/flash-list';
import { Heart } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RankingCard } from '../../src/components/RankingCard';
import { useUserStore } from '../../src/store/userStore';
import { RankingItem } from '../../src/types/ranking';

import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const insets = useSafeAreaInsets();
    const favorites = useUserStore((state) => state.favorites);
    const router = useRouter();

    const renderItem = useCallback(({ item }: { item: RankingItem }) => (
        <RankingCard item={item} router={router} />
    ), [router]);

    const renderEmpty = () => (
        <View className="flex-1 justify-center items-center mt-20 px-10">
            <View className="bg-slate-100 p-6 rounded-full mb-6 shadow-sm">
                <Heart size={48} color="#94a3b8" />
            </View>
            <Text className="text-xl font-bold text-slate-800 mb-3">Henüz favori yok</Text>
            <Text className="text-slate-500 text-center text-base leading-relaxed max-w-[280px]">
                Favori olarak işaretlediğiniz sıralamalar hızlı erişim için burada görünecektir.
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <View className="px-5 py-4 border-b border-slate-100">
                <Text className="text-3xl font-bold text-slate-800 tracking-tight">Favoriler</Text>
            </View>
            <View className="flex-1 bg-slate-50 pt-3">
                <FlashList
                    data={favorites}
                    renderItem={renderItem}
                    estimatedItemSize={120}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                />
            </View>
        </View>
    );
}
