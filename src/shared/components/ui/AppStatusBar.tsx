import React, { useCallback } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar as ExpoStatusBar, StatusBarStyle } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/core/theme';

export interface AppStatusBarProps {
  /**
   * Status bar style.
   * 'dark' = dark icons & text (for light/white backgrounds).
   * 'light' = light/white icons & text (for dark backgrounds).
   * If omitted, automatically resolves to: isDark ? 'light' : 'dark'
   */
  style?: StatusBarStyle;
  /**
   * Background color of the status bar on Android.
   * Defaults to 'transparent' for modern edge-to-edge look.
   */
  backgroundColor?: string;
  /**
   * Translucent flag on Android. Defaults to true.
   */
  translucent?: boolean;
}

/**
 * Universal, focus-aware status bar component.
 * Automatically synchronizes Android and iOS status bar styling whenever the hosting screen gains focus.
 * Solves the issue where status bar icons become invisible (white-on-white) across screen transitions and tab switches.
 */
export function AppStatusBar({
  style,
  backgroundColor = 'transparent',
  translucent = true,
}: AppStatusBarProps) {
  const { isDark } = useTheme();
  const effectiveStyle: StatusBarStyle = style || (isDark ? 'light' : 'dark');

  useFocusEffect(
    useCallback(() => {
      const barStyle = effectiveStyle === 'light' ? 'light-content' : 'dark-content';
      RNStatusBar.setBarStyle(barStyle, true);

      if (Platform.OS === 'android') {
        RNStatusBar.setTranslucent(translucent);
        RNStatusBar.setBackgroundColor(backgroundColor, true);
      }
    }, [effectiveStyle, backgroundColor, translucent])
  );

  return (
    <ExpoStatusBar
      style={effectiveStyle}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
}

export default AppStatusBar;

