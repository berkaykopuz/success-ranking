import { FlashList } from '@shopify/flash-list';
import { Heart } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RankingCard } from '../../src/components/RankingCard';
import { useUserStore } from '../../src/store/userStore';
import { RankingItem } from '../../src/types/ranking';

export default function FavoritesScreen() {
    const insets = useSafeAreaInsets();
    const favorites = useUserStore((state) => state.favorites);

    const renderItem = useCallback(({ item }: { item: RankingItem }) => (
        <RankingCard item={item} />
    ), []);

    const renderEmpty = () => (
        <View className="flex-1 justify-center items-center mt-20 px-10">
            <View className="bg-blue-50 p-6 rounded-full mb-4">
                <Heart size={40} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Henüz favori yok</Text>
            <Text className="text-gray-500 text-center text-base">
                Favori olarak işaretlediğiniz sıralamalar hızlı erişim için burada görünecektir.
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            <View className="px-4 py-4 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">Favoriler</Text>
            </View>
            <View className="flex-1 bg-gray-50 pt-2">
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
