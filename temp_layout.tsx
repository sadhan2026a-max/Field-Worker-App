import { logger } from '@/core/utils/logger';
import { initAuth, selectDriver, selectIsLoading } from '@/features/auth/redux/authSlice';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { NotificationService } from '@/core/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { fetchAssignments, fetchWorkspaceSummary, fetchOrderCompletionRequirements, restoreAssignments, restoreWorkspaceSummary, setHydrated, fetchAssignmentById, showCancelledAlert, addAssignment } from '@/features/assignment/redux/assignmentSlice';
import { fetchNotifications } from '@/features/notification/redux/notificationSlice';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, Component } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as SplashScreen from 'expo-splash-screen';
import { Text, View, ScrollView, StyleSheet, Animated, Easing, AppState, AppStateStatus } from 'react-native';
import { useRef } from 'react';
import { colors, typography, FontSize, ThemeProvider, useTheme } from '@/core/theme';
import { TabletWrapper } from '@/shared/components/ui/TabletWrapper';
import { CancellationModal } from '@/shared/components/ui/CancellationModal';

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
    logger.info('bootstrap', '👋 SidhaHisab Rider starting up — dispatching initAuth');
    dispatch(initAuth())
      .then((result) => {
        logger.info('bootstrap', '✅ initAuth completed', result);
      })
      .catch((err) => {
        logger.error('bootstrap', '❌ initAuth failed', err);
      });

    // 1. HYDRATE ASSIGNMENTS FROM STORAGE BEFORE DISPATCHING ANY ASSIGNMENT ACTIONS
    // This prevents persistenceMiddleware from overwriting saved state with initial empty state
    Promise.all([
      AsyncStorage.getItem('persisted_assignments'),
      AsyncStorage.getItem('persisted_workspace_summary')
    ])
      .then(([assignmentsData, summaryData]) => {
        if (assignmentsData) {
          const parsed = JSON.parse(assignmentsData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch(restoreAssignments(parsed));
          }
        }
        if (summaryData) {
          const parsed = JSON.parse(summaryData);
          if (parsed) {
            dispatch(restoreWorkspaceSummary(parsed));
          }
        }
      })
      .catch((e) => logger.error('bootstrap', 'Failed to restore assignments', e))
      .finally(() => {
        // Mark as hydrated so persistence middleware can start saving
        dispatch(setHydrated());
      });

    // Set up push notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener(async (notification) => {
      logger.info('notification', 'Foreground notification received', {
        title: notification.request.content.title,
        body: notification.request.content.body
      });

      const currentDriver = store.getState().auth.driver;
      if (!currentDriver?.id) return;

      const data = notification.request.content.data;
      const notifType = String(data?.type || '').toLowerCase();
      const titleStr = String(notification.request.content.title || '');
      const bodyStr = String(notification.request.content.body || '');
      const orderId = data?.relatedOrderId || data?.orderId || data?.assignmentId || data?.id;

      const isCancellation = notifType.includes('cancel') ||
        titleStr.toLowerCase().includes('cancel') ||
        bodyStr.toLowerCase().includes('cancel');

      dispatch(fetchNotifications());

      if (isCancellation) {
        // ── CANCEL: show popup immediately from notification text ──────────
        const orderCodeMatch = bodyStr.match(/ORD-[\w-]+/i);
        const orderCode = orderCodeMatch ? orderCodeMatch[0] : (orderId ? String(orderId) : '');
        dispatch(showCancelledAlert(orderCode));

        // Refresh order state in background
        if (orderId) dispatch(fetchAssignmentById(String(orderId)));
        // Delay fetchAssignments so it doesn't race with fetchAssignmentById
        setTimeout(() => {
          dispatch(fetchAssignments());
          dispatch(fetchWorkspaceSummary(currentDriver.id));
        }, 3000);

      } else if (orderId) {
        // ── NEW ORDER: show card on home screen INSTANTLY ────────────────────
        // 1. Extract order code & type from notification text
        const orderCodeMatch = bodyStr.match(/ORD-[\w-]+/i);
        const extractedCode = orderCodeMatch ? orderCodeMatch[0] : String(orderId);

        // Detect order type from notification title/body text
        const bodyLower = bodyStr.toLowerCase();
        const titleLower = titleStr.toLowerCase();
        const detectedType = (
          bodyLower.includes('pickup') || titleLower.includes('pickup') ? 'pickup' :
            bodyLower.includes('return') || titleLower.includes('return') ? 'return' :
              bodyLower.includes('installation') || titleLower.includes('installation') ? 'installation' :
                bodyLower.includes('inspection') || titleLower.includes('inspection') ? 'inspection' :
                  bodyLower.includes('service') || titleLower.includes('service') ? 'service_visit' :
                    'delivery'
        );

        // 2. Dispatch a placeholder assignment IMMEDIATELY so the card
        //    appears on the home screen without waiting for the API.
        //    The NextDeliveryCard already handles placeholder values:
        //    name='Customer', address='order details available after acceptance'
        dispatch(addAssignment({
          id: String(orderId),
          offerId: String(orderId),
          code: extractedCode,
          type: detectedType as any,
          status: 'pending',
          customer: {
            name: 'Customer',
            phone: 'N/A',
            address: 'order details available after acceptance',
            location: { latitude: 0, longitude: 0 },
          },
          distanceKm: 0,
          etaMinutes: 0,
          itemCount: 0,
          totalAmount: 0,
          codAmount: 0,
          createdAt: new Date().toISOString(),
          items: [],
        }));

        // 3. Fetch real details in background — upsertAssignment will update
        //    the placeholder with actual customer name, address, offerId etc.
        await dispatch(fetchAssignmentById(String(orderId)));

        // 4. Refresh summary
        dispatch(fetchWorkspaceSummary(currentDriver.id));
      } else {
        // Other notifications: just refresh everything
        dispatch(fetchAssignments());
        dispatch(fetchWorkspaceSummary(currentDriver.id));
      }
    });

    const responseListener = NotificationService.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      logger.info('notification', 'Notification clicked', {
        actionId: response.actionIdentifier,
        data: data
      });

      const orderId = data?.relatedOrderId || data?.orderId || data?.assignmentId || data?.id;
      if (orderId) {
        // Navigate to the assignment details screen. Small delay to ensure router is ready.
        setTimeout(() => {
          router.push({ pathname: '/assignment/[id]', params: { id: String(orderId) } });
        }, 300);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [dispatch]);

  // ── AppState: refresh when app comes back to foreground ──────────────────────
  // When the app is in the background, the foreground notification listener
  // does NOT fire. So if a new order / cancellation arrives while minimised,
  // the user sees stale data until they pull-to-refresh.
  // Listening to AppState fixes this: the moment they open the app we
  // re-fetch everything — same as a manual pull-to-refresh but automatic.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const currentDriver = store.getState().auth.driver;
        if (!currentDriver?.id) return;

        logger.info('appstate', 'App came to foreground — refreshing assignments');
        dispatch(fetchAssignments());
        dispatch(fetchWorkspaceSummary(currentDriver.id));
        dispatch(fetchNotifications());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [dispatch]);

  // Fetch dynamic completion requirements only when the user is fully logged in
  useEffect(() => {
    if (driver?.id) {
      dispatch(fetchOrderCompletionRequirements());
    }
  }, [driver?.id, dispatch]);

  const segments = useSegments();

  // Global authentication state router hook
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isRoot = !segments.length || !segments[0];

    if (!driver && !inAuthGroup) {
      logger.info('bootstrap', '🔄 No driver session — routing to login screen');
      router.replace('/auth/login');
    } else if (driver && (inAuthGroup || isRoot)) {
      logger.info('bootstrap', '🔄 Driver session active — routing to workspace');
      if (!driver.hasPin) {
        router.replace('/pin-setup');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [driver, isLoading, segments]);

  return (
    <>
      {children}
      <CancellationModal />
    </>
  );
}

const toastConfig = {
  error: (props: any) => {
    const { isDark } = useTheme();
    const bg = isDark ? '#7f1d1d' : '#DC2626';
    const text1 = '#FFFFFF';
    const text2 = 'rgba(255, 255, 255, 0.9)';

    return (
      <View style={{
        alignSelf: 'center',
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        maxWidth: '90%',
      }}>
        <MaterialIcons name="error" size={20} color="#FFFFFF" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: text1, fontWeight: 'bold', fontSize: 13 }}>{props.text1 || 'Error'}</Text>
          {props.text2 ? <Text style={{ color: text2, fontSize: 12, marginTop: 1 }}>{props.text2}</Text> : null}
        </View>
      </View>
    );
  },
  success: (props: any) => {
    const { isDark, colors } = useTheme();
    const bg = colors.primary;
    const text1 = '#FFFFFF';
    const text2 = 'rgba(255, 255, 255, 0.9)';

    return (
      <View style={{
        alignSelf: 'center',
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        maxWidth: '90%',
      }}>
        <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: text1, fontWeight: 'bold', fontSize: 13 }}>{props.text1}</Text>
          {props.text2 ? <Text style={{ color: text2, fontSize: 12, marginTop: 1 }}>{props.text2}</Text> : null}
        </View>
      </View>
    );
  },
  warning: (props: any) => {
    const { isDark, colors } = useTheme();
    const bg = colors.warning;
    const text1 = '#FFFFFF';
    const text2 = 'rgba(255, 255, 255, 0.9)';

    return (
      <View style={{
        alignSelf: 'center',
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        maxWidth: '90%',
      }}>
        <MaterialIcons name="warning" size={20} color="#FFFFFF" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: text1, fontWeight: 'bold', fontSize: 13 }}>{props.text1 || 'Warning'}</Text>
          {props.text2 ? <Text style={{ color: text2, fontSize: 12, marginTop: 1 }}>{props.text2}</Text> : null}
        </View>
      </View>
    );
  }
};

function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <TabletWrapper>
        <Stack
          screenOptions={{
            headerShown: false,
            headerShadowVisible: false,
            animation: 'none',
            contentStyle: { backgroundColor: colors.background },
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTitleStyle: {
              ...typography.h3,
              fontSize: FontSize.medium,
              color: colors.textPrimary,
            },
            headerTitleAlign: 'left',
            headerTintColor: colors.textPrimary,
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="auth" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="assignment/[id]" options={{ headerShown: false, animation: 'default' }} />
        </Stack>
      </TabletWrapper>
      <Toast position="bottom" bottomOffset={100} config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  logger.debug('layout', '🔄 RootLayout render');

  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
    ...FontAwesome.font,
    ...Ionicons.font,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const [appIsReady, setAppIsReady] = useState(false);

  // Log font load result whenever it changes
  useEffect(() => {
    if (fontError) {
      logger.warn('fonts', '⚠️  Font load error — falling back to system fonts', {
        message: fontError.message,
      });
      logger.warn('fonts', '⚠️  Fix: check font imports');
    } else if (fontsLoaded) {
      logger.info('fonts', '✅ All Roboto fonts loaded successfully (Roboto family active)');
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
    logger.debug('layout', '⏸️  appIsReady=false — returning null (splash visible)');
    return null;
  }

  logger.info('layout', '🪄  Rendering navigation tree');

  return (
    <RootErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <AppBootstrap>
                <RootNavigator />
              </AppBootstrap>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </Provider>
    </RootErrorBoundary>
  );
}
