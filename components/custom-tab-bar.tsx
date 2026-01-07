import React, { useEffect, useRef } from 'react';
import { View, Animated, useWindowDimensions, Text, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const tabWidth = width / state.routes.length;
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  const activeIndex = state.index;
  const activeTintColor = '#ffffff'; // match dark tab bar primary color

  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * tabWidth + tabWidth / 2 - 20, // Center the 40px wide underscore
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: 'transparent',
        height: 44 + insets.bottom,
        paddingBottom: insets.bottom,
        paddingTop: 2,
        position: 'relative',
      }}
    >
      {/* Animated underscore indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: insets.bottom + 2,
          left: 0,
          width: 40,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: activeTintColor,
          transform: [{ translateX: indicatorPosition }],
        }}
      />
      
      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const color = isFocused
          ? options.tabBarActiveTintColor || '#0a7ea4'
          : options.tabBarInactiveTintColor || '#687076';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: color,
                size: 18,
              })}
            {label && (
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: color,
                  marginTop: 0,
                }}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

