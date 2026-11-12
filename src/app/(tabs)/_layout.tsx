import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/core/theme';
import { Platform, TouchableOpacity, Text, Image, View, StyleSheet } from 'react-native';
import { useLocationTracking } from '@/features/auth/hooks/useLocationTracking';

const TAB_ICONS = {
  workspace: require('../../../assets/tabs/tab_workspace.png'),
  tasks: require('../../../assets/tabs/tab_tasks.png'),
  map: require('../../../assets/tabs/tab_map.png'),
  profile: require('../../../assets/tabs/tab_profile.png'),
};

interface TabBarIconProps {
  source: any;
  focused: boolean;
  colors: any;
}

function TabBarIcon({ source, focused, colors }: TabBarIconProps) {
  return (
    <View style={[styles.iconWrapper, focused && { backgroundColor: colors.primary + '14' }]}>
      <Image
        source={source}
        style={[
          styles.tabIcon,
          {
            tintColor: focused ? colors.primary : colors.textSecondary,
            opacity: focused ? 1 : 0.65,
          },
        ]}
        resizeMode="contain"
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
          <Text
            style={{
              color,
              fontSize: 11,
              fontWeight: focused ? '700' : '500',
              marginTop: 1,
              marginBottom: Platform.OS === 'ios' ? 0 : 4,
              textAlign: 'center',
              letterSpacing: focused ? -0.1 : 0,
            }}
          >
            {children}
          </Text>
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
            <TabBarIcon source={TAB_ICONS.workspace} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon source={TAB_ICONS.tasks} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon source={TAB_ICONS.map} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon source={TAB_ICONS.profile} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
});
