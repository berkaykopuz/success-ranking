import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { fetchRankings } from '../../src/api/rankings';
import { FilterBar } from '../../src/components/FilterBar';
import { RankingCard } from '../../src/components/RankingCard';
import { useFilterStore } from '../../src/store/filterStore';
import { useUserStore } from '../../src/store/userStore';
import { RankingItem } from '../../src/types/ranking';

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: 'ca-app-pub-7326975715449797/5884759096', // Replace with your iOS banner ad unit ID
      android: 'ca-app-pub-7326975715449797/6012293782',
    }) || 'ca-app-pub-7326975715449797/6012293782';

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const filters = useFilterStore();
  const router = useRouter();
  const { yksCalculations } = useUserStore();

  // Get the selected YKS calculation
  const selectedYksCalculation = useMemo(() => {
    if (!filters.selectedYksCalculationId) return null;
    return yksCalculations.find(calc => calc.id === filters.selectedYksCalculationId) || null;
  }, [filters.selectedYksCalculationId, yksCalculations]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['rankings', filters, selectedYksCalculation?.id],
    queryFn: ({ pageParam = 0 }) => fetchRankings(pageParam as number, filters, selectedYksCalculation),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const flattenData = data?.pages.flatMap((page) => page.data) || [];

  const renderItem = useCallback(({ item }: { item: RankingItem }) => (
    <RankingCard item={item} router={router} />
  ), [router]);

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
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
      </View>
      <View className="bg-white border-t border-slate-200 items-center">
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
  );
}
