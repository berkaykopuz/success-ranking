import { Router } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RankingItem } from '../types/ranking';
import { ListModal } from './ListModal';

interface Props {
    item: RankingItem;
    router: Router;
}

export const RankingCard = React.memo(({ item, router }: Props) => {
    const [isListModalVisible, setIsListModalVisible] = useState(false);

    const handleAddToList = () => {
        Haptics.selectionAsync();
        setIsListModalVisible(true);
    };

    // Format department name with language and quota type
    const formatDepartmentName = () => {
        let formatted = item.departmentName;
        
        // Add language in parentheses if available
        if (item.language) {
            formatted += ` (${item.language})`;
        }
        
        // Add quota type in parentheses if available
        if (item.quotaType) {
            formatted += ` (${item.quotaType})`;
        }
        
        return formatted;
    };

    // Get colors based on scoreType (matching YKS net hesaplama screen)
    const getScoreTypeColors = (scoreType: string) => {
        switch (scoreType) {
            case 'TYT':
                return { bg: 'bg-blue-50', text: 'text-blue-700' };
            case 'SAY':
                return { bg: 'bg-emerald-50', text: 'text-emerald-700' };
            case 'EA':
                return { bg: 'bg-purple-50', text: 'text-purple-700' };
            case 'SÖZ':
                return { bg: 'bg-orange-50', text: 'text-orange-700' };
            case 'DİL':
                return { bg: 'bg-rose-50', text: 'text-rose-700' };
            default:
                return { bg: 'bg-blue-50', text: 'text-blue-700' };
        }
    };

    const scoreTypeColors = getScoreTypeColors(item.scoreType);

    return (
        <>
            <TouchableOpacity
                onPress={() => router.push(`/ranking/${item.id}`)}
                className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4 active:scale-[0.98] active:bg-slate-50 transition-all"
            >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-4">
                    <View className="flex-row items-center mb-1.5">
                        <View className={`${scoreTypeColors.bg} px-2.5 py-1 rounded-md mr-2`}>
                            <Text className={`${scoreTypeColors.text} font-bold text-[10px] tracking-wider uppercase`}>{item.scoreType}</Text>
                        </View>
                        <Text className="text-slate-400 text-xs font-medium">{item.city}</Text>
                    </View>
                    <Text className="text-lg font-bold text-slate-800 leading-tight mb-1">{formatDepartmentName()}</Text>
                    <Text className="text-sm text-slate-500 font-medium">{item.universityName}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{item.faculty}</Text>
                </View>

                <View className="items-end">
                    <Text className="text-[10px] text-slate-400 font-bold mb-0.5">Başarı Sıralaması</Text>
                    <Text className="text-lg font-bold text-blue-600 tracking-tight text-right">
                        {item.rank !== null ? item.rank.toLocaleString('tr-TR') : 'N/A'}
                    </Text>
                </View>
            </View>

            <View className="absolute right-3 z-10">
                <TouchableOpacity
                    onPress={handleAddToList}
                    className="bg-white p-2.5 rounded-xl"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                    }}
                >
                    <Plus size={8} color="#475569" strokeWidth={2.5} />
                </TouchableOpacity>
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
                    <Text className="text-sm font-semibold text-slate-700">
                        {item.score != null ? item.score.toFixed(4) : 'N/A'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>

        <ListModal
            visible={isListModalVisible}
            onClose={() => setIsListModalVisible(false)}
            item={item}
        />
        </>
    );
});
