
import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Keşfet
        </ThemedText>
      </ThemedView>
      <ThemedText>Bu uygulama başlamanıza yardımcı olacak örnek kodlar içerir.</ThemedText>
      <Collapsible title="Dosya tabanlı yönlendirme">
        <ThemedText>
          Bu uygulamanın iki ekranı vardır:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> ve{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          dosyasındaki düzen, sekme gezginini ayarlar.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS ve web desteği">
        <ThemedText>
          Bu projeyi Android, iOS ve web üzerinde açabilirsiniz. Web sürümünü açmak için,{' '}
          bu projeyi çalıştıran terminalde <ThemedText type="defaultSemiBold">w</ThemedText> tuşuna basın.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Görseller">
        <ThemedText>
          Statik görseller için, farklı ekran yoğunluklarına dosya sağlamak amacıyla{' '}
          <ThemedText type="defaultSemiBold">@2x</ThemedText> ve <ThemedText type="defaultSemiBold">@3x</ThemedText>{' '}
          son eklerini kullanabilirsiniz.
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Açık ve koyu mod bileşenleri">
        <ThemedText>
          Bu şablon açık ve koyu mod desteğine sahiptir. <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> kancası,
          kullanıcının mevcut renk şemasını incelemenizi sağlar, böylece UI renklerini buna göre ayarlayabilirsiniz.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Daha fazla bilgi</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animasyonlar">
        <ThemedText>
          Bu şablon animasyonlu bir bileşen örneği içerir. <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> bileşeni,
          el sallama animasyonu oluşturmak için güçlü <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText> kütüphanesini kullanır.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              bileşeni, başlık görseli için paralaks efekti sağlar.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
