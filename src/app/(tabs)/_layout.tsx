import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme, colors } from '@/core/theme';
import { Platform, TouchableOpacity, Text } from 'react-native';
import { useLocationTracking } from '@/features/auth/hooks/useLocationTracking';

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
          <Text style={{ 
            color, 
            fontSize: 11, 
            fontWeight: focused ? 'bold' : '500', 
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
            textAlign: 'center'
          }}>
            {children}
          </Text>
        ),
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, 
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 16,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}
