import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, blueColors, forestColors, oceanColors, AppColors } from './colors';

type ThemeType = 'light' | 'dark' | 'system' | 'blue' | 'forest' | 'ocean';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: AppColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system' || storedTheme === 'blue' || storedTheme === 'forest' || storedTheme === 'ocean') {
          setThemeState(storedTheme as ThemeType);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : (theme === 'dark' || theme === 'blue' || theme === 'forest' || theme === 'ocean');
  const colors = theme === 'ocean' ? oceanColors : (theme === 'forest' ? forestColors : (theme === 'blue' ? blueColors : (isDark ? darkColors : lightColors)));

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
