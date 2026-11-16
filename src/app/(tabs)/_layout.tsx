import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/core/theme';
import { Platform, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useLocationTracking } from '@/features/auth/hooks/useLocationTracking';

const TAB_ART = {
  workspace: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="3.5" y="5" width="25" height="22" rx="7" fill="#EEF5FF"/><rect x="7.5" y="9" width="7.5" height="6.5" rx="2" fill="#20A85A"/><rect x="17" y="9" width="7.5" height="6.5" rx="2" fill="#70B7F2"/><rect x="7.5" y="17" width="7.5" height="6.5" rx="2" fill="#FFC45C"/><rect x="17" y="17" width="7.5" height="6.5" rx="2" fill="#B8E3C7"/><path d="m18.5 21 1.7-1.8 1.5 1.2 2.5-2.5" stroke="#168A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tasks: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="7" y="6.5" width="18" height="22" rx="4" fill="#FFF7E8" stroke="#E8A83B" stroke-width="1.4"/><rect x="11" y="4" width="10" height="5.5" rx="2.5" fill="#F4A227"/><rect x="10" y="13" width="5" height="5" rx="1.5" fill="#DDF3E5"/><path d="m11.2 15.4 1.1 1.1 2-2.2" stroke="#168A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 15.5h3.5" stroke="#488FC9" stroke-width="1.7" stroke-linecap="round"/><rect x="10" y="21" width="5" height="4" rx="1.3" fill="#DCEEFF"/><path d="M18 23h3.5" stroke="#488FC9" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  map: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="3.5" y="4" width="25" height="24" rx="8" fill="#F0F6FF"/><path d="M7 8h6v5H7zm11 0h7v4h-7zM7 19h5v5H7zm13 3h5v2h-5z" fill="#C8E7D0"/><path d="M4 16h24M15.5 5v22" stroke="white" stroke-width="3.2"/><path d="M5 18.5c3.4-1.8 5.7-1.7 8.1.3 2.8 2.3 4.6 1.2 6.5-2.6 1.5-3 3.2-3.7 7.4-3.3" stroke="#3B82C4" stroke-width="2.1" stroke-linecap="round" stroke-dasharray="2.1 2.1"/><path d="M22.5 6.5c-2.8 0-4.8 2.1-4.8 4.7 0 3.4 4.8 7.8 4.8 7.8s4.8-4.4 4.8-7.8c0-2.6-2-4.7-4.8-4.7Z" fill="#F4A227"/><circle cx="22.5" cy="11.1" r="1.8" fill="white"/><circle cx="22.5" cy="11.1" r=".8" fill="#E18B16"/></svg>`,
  profile: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12.5" fill="#EEF3FF"/><path d="M7.5 24.7c1-4.2 4.1-6.4 8.5-6.4s7.5 2.2 8.5 6.4a12.4 12.4 0 0 1-17 0Z" fill="#5E9FE0"/><path d="M11.2 12.3c0-3 1.9-5 4.8-5s4.8 2 4.8 5v1.2c0 3-2.1 5.3-4.8 5.3s-4.8-2.3-4.8-5.3v-1.2Z" fill="#F2BE92"/><path d="M11.4 12c.2-3.1 2-4.9 4.8-4.9 2.5 0 4.1 1.4 4.7 3.8-1.1.2-2-.1-2.8-.9-1.4 1.2-3.6 1.8-6.7 2Z" fill="#344767"/><circle cx="24.7" cy="8" r="2.3" fill="#F4A227"/></svg>`,
};

interface TabBarIconProps {
  art: keyof typeof TAB_ART;
  focused: boolean;
}

function TabBarIcon({ art, focused }: TabBarIconProps) {
  return (
    <View style={styles.iconWrapper}>
      <SvgXml
        xml={TAB_ART[art]}
        width={focused ? 34 : 29}
        height={focused ? 34 : 29}
        opacity={focused ? 1 : 0.94}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  useLocationTracking();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabel: ({ focused, color, children }) => (
          <View style={styles.labelContainer}>
            <Text
              style={{
                color,
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                marginTop: 1,
                textAlign: 'center',
                letterSpacing: focused ? -0.1 : 0,
              }}
            >
              {children}
            </Text>
            {focused && (
              <View style={[styles.activeLabelDot, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
            )}
          </View>
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarButton: (props: any) => (
          <TouchableOpacity
            {...props}
            delayLongPress={props.delayLongPress ?? undefined}
            activeOpacity={0.7}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workspace',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon art="workspace" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon art="tasks" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon art="map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon art="profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 18,
    transform: [{ translateY: -6 }],
  },
  activeLabelDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
    opacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 7,
    elevation: 5,
  },
  iconWrapper: {
    width: 52,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    transform: [{ translateY: -6 }],
  },
});
