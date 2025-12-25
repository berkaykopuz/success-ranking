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
            <TouchableOpacity className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4 active:scale-[0.98] active:bg-slate-50 transition-all">
                <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-1.5">
                            <View className="bg-blue-50 px-2.5 py-1 rounded-md mr-2">
                                <Text className="text-blue-700 font-bold text-[10px] tracking-wider uppercase">{item.scoreType}</Text>
                            </View>
                            <Text className="text-slate-400 text-xs font-medium">{item.city}</Text>
                        </View>
                        <Text className="text-lg font-bold text-slate-800 leading-tight mb-1">{item.departmentName}</Text>
                        <Text className="text-sm text-slate-500 font-medium">{item.universityName}</Text>
                        <Text className="text-xs text-slate-400 mt-0.5">{item.faculty}</Text>
                    </View>

                    <View className="items-end">
                        <Text className="text-[10px] text-slate-400 font-bold mb-0.5">Başarı Sıralaması</Text>
                        <Text className="text-lg font-bold text-blue-600 tracking-tight">{item.rank.toLocaleString('tr-TR')}</Text>
                    </View>
                </View>

                <View className="mt-8 flex-row items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <View className="items-center flex-1 border-r border-slate-200">
                        <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Yıl</Text>
                        <Text className="text-sm font-semibold text-slate-700">{item.year}</Text>
                    </View>
                    <View className="items-center flex-1">
                        <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Kontenjan</Text>
                        <Text className="text-sm font-semibold text-slate-700">{item.quota}</Text>
                    </View>
                    <View className="items-center flex-1 border-l border-slate-200">
                        <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Puan</Text>
                        <Text className="text-sm font-semibold text-slate-700">{item.score.toFixed(4)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
});
