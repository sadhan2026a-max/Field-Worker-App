import { logger } from '@/core/utils/logger';
import { initAuth, selectDriver, selectIsLoading } from '@/features/auth/redux/authSlice';
import { store } from '@/store';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { NotificationService } from '@/core/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { fetchAssignments, fetchWorkspaceSummary, fetchOrderCompletionRequirements, restoreAssignments, restoreWorkspaceSummary, setHydrated, fetchAssignmentById } from '@/features/assignment/redux/assignmentSlice';
import { fetchNotifications } from '@/features/notification/redux/notificationSlice';
import { Stack, router } from 'expo-router';
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
import { Text, View, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { useRef } from 'react';
import { colors, typography, FontSize, ThemeProvider, useTheme } from '@/core/theme';
import { TabletWrapper } from '@/shared/components/ui/TabletWrapper';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
logger.info('layout', '≡ƒôª _layout.tsx module loaded');

// ΓöÇΓöÇΓöÇ Error Boundary ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface ErrorBoundaryState { hasError: boolean; error: Error | null }

class RootErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    logger.error('ErrorBoundary', '≡ƒÆÑ Uncaught render error', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary', 'componentDidCatch', { message: error.message, stack: error.stack, componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.title}>≡ƒö┤ Render Error</Text>
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

// ΓöÇΓöÇΓöÇ Bootstrap component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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
        // 2. NOW fetch dynamic completion requirements (safe to do now)
        dispatch(fetchOrderCompletionRequirements());
      });

    // Set up push notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener((notification) => {
      logger.info('notification', 'Foreground notification received', {
        title: notification.request.content.title,
        body: notification.request.content.body
      });

      // Auto-refresh data immediately when push arrives
      dispatch(fetchAssignments());
      dispatch(fetchNotifications());

      const currentDriver = store.getState().auth.driver;
      if (currentDriver?.id) {
        dispatch(fetchWorkspaceSummary(currentDriver.id));
      }

      const data = notification.request.content.data;
      const orderId = data?.relatedOrderId || data?.orderId || data?.assignmentId || data?.id;
      if (orderId) {
        dispatch(fetchAssignmentById(String(orderId)));
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

  // Global authentication state router hook
  useEffect(() => {
    if (isLoading) return;

    if (!driver) {
      logger.info('bootstrap', '≡ƒöä No driver session ΓÇö routing to login screen');
      router.replace('/auth/login');
    } else {
      logger.info('bootstrap', '≡ƒöä Driver session active ΓÇö routing to workspace');
      router.replace('/(tabs)');
    }
  }, [driver, isLoading]);

  return <>{children}</>;
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
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="assignment/[id]" options={{ headerShown: false }} />
        </Stack>
      </TabletWrapper>
      <Toast position="bottom" bottomOffset={100} config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  logger.debug('layout', '≡ƒöä RootLayout render');

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
      logger.warn('fonts', 'ΓÜá∩╕Å  Font load error ΓÇö falling back to system fonts', {
        message: fontError.message,
      });
      logger.warn('fonts', 'ΓÜá∩╕Å  Fix: check font imports');
    } else if (fontsLoaded) {
      logger.info('fonts', 'Γ£à All Roboto fonts loaded successfully (Roboto family active)');
    } else {
      logger.debug('fonts', 'ΓÅ│ Fonts still loading...');
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Proceed even if fonts failed ΓÇö fall back to system fonts
    if (fontsLoaded || fontError) {
      logger.info('layout', `≡ƒÄ» App ready ΓÇö fontsLoaded=${fontsLoaded} fontError=${!!fontError}`);
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (appIsReady) {
      logger.info('layout', '≡ƒîà Hiding splash screen');
      SplashScreen.hideAsync().catch(err => {
        logger.warn('layout', 'ΓÜá∩╕Å  Failed to hide splash screen', err);
      });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    logger.debug('layout', 'ΓÅ╕  appIsReady=false ΓÇö returning null (splash visible)');
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
