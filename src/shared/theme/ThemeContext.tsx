import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { royalPurple, navyBlue, indigoOrange, darkTheme, tealLogistics, AppColors } from './colors';

type ThemeType = 'royalPurple' | 'navyBlue' | 'indigoOrange' | 'darkTheme' | 'tealLogistics';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: AppColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'royalPurple',
  isDark: false,
  colors: royalPurple,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('royalPurple');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && ['royalPurple', 'navyBlue', 'indigoOrange', 'darkTheme', 'tealLogistics'].includes(storedTheme)) {
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

  const isDark = theme === 'darkTheme';
  const colors = 
    theme === 'navyBlue' ? navyBlue :
    theme === 'indigoOrange' ? indigoOrange :
    theme === 'darkTheme' ? darkTheme :
    theme === 'tealLogistics' ? tealLogistics :
    royalPurple;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
