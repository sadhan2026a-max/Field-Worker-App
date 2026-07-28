import { logger } from '@/core/utils/logger';
import { initAuth, selectDriver, selectIsLoading } from '@/features/auth/redux/authSlice';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { NotificationService } from '@/core/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { fetchAssignments, fetchWorkspaceSummary } from '@/features/assignment/redux/assignmentSlice';
import { fetchNotifications } from '@/features/notification/redux/notificationSlice';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, Component } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SplashScreen from 'expo-splash-screen';
import { Text, View, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { useRef } from 'react';
import { colors, typography, FontSize } from '@/core/theme';
import { TabletWrapper } from '@/shared/components/ui/TabletWrapper';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
logger.info('layout', '📦 _layout.tsx module loaded');

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean; error: Error | null }

class RootErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    logger.error('ErrorBoundary', '💥 Uncaught render error', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary', 'componentDidCatch', { message: error.message, stack: error.stack, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.title}>🔴 Render Error</Text>
          <ScrollView style={errStyles.scroll}>
            <Text style={errStyles.message}>{this.state.error?.message}</Text>
            <Text style={errStyles.stack}>{this.state.error?.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0000', padding: 20, paddingTop: 60 },
  title: { color: '#ff4444', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  scroll: { flex: 1 },
  message: { color: '#ffaaaa', fontSize: 14, marginBottom: 12 },
  stack: { color: '#888', fontSize: 11, lineHeight: 18 },
});

// ─── Bootstrap component ──────────────────────────────────────────────────────

/** Dispatches initAuth once on mount to restore driver session from storage, and listens to session changes to route dynamically. */
function AppBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);
  const isLoading = useAppSelector(selectIsLoading);

  useEffect(() => {
    logger.info('bootstrap', '🚀 SidhaHisab Rider starting up — dispatching initAuth');
    dispatch(initAuth())
      .then((result) => {
        logger.info('bootstrap', '✅ initAuth completed', result);
      })
      .catch((err) => {
        logger.error('bootstrap', '❌ initAuth failed', err);
      });

    // Set up push notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener((notification) => {
      logger.info('notification', 'Foreground notification received', {
        title: notification.request.content.title,
        body: notification.request.content.body
      });

      // Auto-refresh data when push arrives
      dispatch(fetchAssignments());
      dispatch(fetchNotifications());

      const currentDriver = store.getState().auth.driver;
      if (currentDriver?.id) {
        dispatch(fetchWorkspaceSummary(currentDriver.id));
      }
    });

    const responseListener = NotificationService.addNotificationResponseReceivedListener((response) => {
      logger.info('notification', 'Notification clicked', {
        actionId: response.actionIdentifier
      });
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [dispatch]);

  // Global authentication state router hook
  useEffect(() => {
    if (isLoading) return;

    if (!driver) {
      logger.info('bootstrap', '🔄 No driver session — routing to login screen');
      router.replace('/auth/login');
    } else {
      logger.info('bootstrap', '🔄 Driver session active — routing to workspace');
      router.replace('/(tabs)');
    }
  }, [driver, isLoading]);

  return <>{children}</>;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

const toastConfig = {
  error: (props: any) => (
    <View style={{
      width: '100%',
      backgroundColor: '#DC2626', // Red color for error
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    }}>
      <MaterialIcons name="error" size={24} color="#FFFFFF" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>{props.text1}</Text>
        {props.text2 ? <Text style={{ color: '#FEE2E2', fontSize: 13, marginTop: 2 }}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  success: (props: any) => (
    <View style={{
      width: '100%',
      backgroundColor: '#16A34A', // Green color for success
      paddingHorizontal: 24,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    }}>
      <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>{props.text1}</Text>
        {props.text2 ? <Text style={{ color: '#DCFCE7', fontSize: 13, marginTop: 2 }}>{props.text2}</Text> : null}
      </View>
    </View>
  ),
  warning: (props: any) => (
    <View style={{
      width: '90%',
      alignSelf: 'center',
      backgroundColor: 'rgba(245, 158, 11, 0.5)', // Amber color with 50% opacity
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 16,
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#FDE68A',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      marginTop: 20,
      marginBottom: 30, // Float above bottom edge
    }}>
      <View style={{
        position: 'absolute',
        top: -20,
        backgroundColor: '#f26e35ff', // Keep icon background solid for contrast
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FEF3C7',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 6,
      }}>
        <MaterialIcons name="priority-high" size={24} color="#FFFFFF" />
      </View>
      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }}>
        {props.text1 || 'Warning'}
      </Text>
      {props.text2 ? (
        <Text style={{ color: '#FEF3C7', fontSize: 13, textAlign: 'center', marginTop: 2 }}>
          {props.text2}
        </Text>
      ) : null}
    </View>
  )
};

export default function RootLayout() {
  logger.debug('layout', '🔄 RootLayout render');

  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  const [appIsReady, setAppIsReady] = useState(false);

  // Log font load result whenever it changes
  useEffect(() => {
    if (fontError) {
      logger.warn('fonts', '⚠️  Font load error — falling back to system fonts', {
        message: fontError.message,
      });
      logger.warn('fonts', '⚠️  Fix: place Inter .ttf files in assets/fonts/ and use require()');
    } else if (fontsLoaded) {
      logger.info('fonts', '✅ All Inter fonts loaded successfully (Inter family active)');
    } else {
      logger.debug('fonts', '⏳ Fonts still loading...');
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Proceed even if fonts failed — fall back to system fonts
    if (fontsLoaded || fontError) {
      logger.info('layout', `🎯 App ready — fontsLoaded=${fontsLoaded} fontError=${!!fontError}`);
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (appIsReady) {
      logger.info('layout', '🌅 Hiding splash screen');
      SplashScreen.hideAsync().catch(err => {
        logger.warn('layout', '⚠️  Failed to hide splash screen', err);
      });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    logger.debug('layout', '⏸  appIsReady=false — returning null (splash visible)');
    return null;
  }

  logger.info('layout', '🖼  Rendering navigation tree');

  return (
    <RootErrorBoundary>
      <Provider store={store}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <AppBootstrap>
              <StatusBar style="dark" />
              <TabletWrapper>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: '#FFFFFF' },
                    headerStyle: {
                      backgroundColor: colors.background,
                    },
                    headerTitleStyle: {
                      ...typography.h3,
                      fontSize: FontSize.medium,
                    },
                    headerTintColor: colors.textPrimary,
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="assignment/[id]" options={{ headerShown: false }} />
                </Stack>
              </TabletWrapper>
              <Toast position="bottom" bottomOffset={0} config={toastConfig} />
            </AppBootstrap>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </RootErrorBoundary>
  );
}
