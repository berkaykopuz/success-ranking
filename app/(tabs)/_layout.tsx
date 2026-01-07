import { Tabs } from 'expo-router';
import React from 'react';
import { Compass, User, Calculator } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { CustomTabBar } from '@/components/custom-tab-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => (
        <View
          style={{
            // Always use the dark theme tab bar background for a consistent, premium look
            backgroundColor: '#151718',
            borderTopWidth: 1,
            borderTopColor: '#2a2d2e',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <CustomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        // Use white as the primary icon/label color to match the dark tab bar
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#cbd5e1',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <Compass 
              size={18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Kişisel',
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="yks"
        options={{
          title: 'Net Hesap',
          tabBarIcon: ({ color, focused }) => (
            <Calculator 
              size={18} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
