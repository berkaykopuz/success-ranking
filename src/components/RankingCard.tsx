import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RankingItem } from '../types/ranking';

interface Props {
    item: RankingItem;
}

export const RankingCard = React.memo(({ item }: Props) => {
    return (
        <Link href={`/ranking/${item.id}`} asChild>
            <TouchableOpacity className="bg-white p-4 mb-2 rounded-lg border border-gray-100 shadow-sm mx-4 active:bg-gray-50">
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <Text className="text-xs text-blue-600 font-bold mb-1 uppercase">{item.universityName}</Text>
                        <Text className="text-base font-semibold text-gray-900 mb-1">{item.departmentName}</Text>
                        <Text className="text-xs text-gray-500">{item.faculty} • {item.city}</Text>
                    </View>
                    <View className="items-end">
                        <View className="bg-blue-50 px-2 py-1 rounded mb-1">
                            <Text className="text-blue-700 font-bold text-xs">#{item.rank}</Text>
                        </View>
                        <Text className="text-sm font-medium text-gray-900">{item.score.toFixed(2)}</Text>
                    </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-gray-50 pt-3">
                    <Text className="text-xs text-gray-400">Puan Türü: <Text className="text-gray-600 font-medium">{item.scoreType}</Text></Text>
                    <Text className="text-xs text-gray-400">Yıl: <Text className="text-gray-600 font-medium">{item.year}</Text></Text>
                    <Text className="text-xs text-gray-400">Kontenjan: <Text className="text-gray-600 font-medium">{item.quota}</Text></Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
});
