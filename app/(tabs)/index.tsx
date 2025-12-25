import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchRankings } from '../../src/api/rankings';
import { FilterBar } from '../../src/components/FilterBar';
import { RankingCard } from '../../src/components/RankingCard';
import { useFilterStore } from '../../src/store/filterStore';
import { RankingItem } from '../../src/types/ranking';

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const filters = useFilterStore();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['rankings', filters],
    queryFn: ({ pageParam = 0 }) => fetchRankings(pageParam as number, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const flattenData = data?.pages.flatMap((page) => page.data) || [];

  const renderItem = useCallback(({ item }: { item: RankingItem }) => (
    <RankingCard item={item} />
  ), []);

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="py-4">
          <ActivityIndicator />
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return <ActivityIndicator className="mt-10" size="large" />;
    if (isError) return <Text className="text-center mt-10 text-red-500">Sıralamalar yüklenemedi</Text>
    return <Text className="text-center mt-10 text-gray-500">Sıralama bulunamadı</Text>
  }, [isLoading, isError]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <FilterBar />
      <View className="flex-1 bg-slate-50 pt-2">
        <FlashList
          data={flattenData}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      </View>
    </View>
  );
}
