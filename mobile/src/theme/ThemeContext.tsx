import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  background: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  border: string;
  borderStrong: string;
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  warning: string;
  white: string;
  black: string;
}

const lightColors: ThemeColors = {
  primary: '#e0136a',
  primaryDark: '#c00f5c',
  primarySoft: '#ffe4ee',
  secondary: '#78350f',
  background: '#fafaf9',
  surface: '#ffffff',
  ink: '#1c1917',
  inkSoft: '#57534e',
  inkFaint: '#a8a29e',
  border: '#e7e5e4',
  borderStrong: '#d6d3d1',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  error: '#dc2626',
  errorSoft: '#fef2f2',
  warning: '#d97706',
  white: '#ffffff',
  black: '#000000',
};

const darkColors: ThemeColors = {
  primary: '#f472b6',
  primaryDark: '#ec4899',
  primarySoft: '#4a1942',
  secondary: '#d97706',
  background: '#0f0f0f',
  surface: '#1c1c1e',
  ink: '#f5f5f4',
  inkSoft: '#a8a29e',
  inkFaint: '#57534e',
  border: '#2c2c2e',
  borderStrong: '#3a3a3c',
  success: '#22c55e',
  successSoft: '#052e16',
  error: '#ef4444',
  errorSoft: '#450a0a',
  warning: '#f59e0b',
  white: '#f5f5f4',
  black: '#1c1c1e',
};

const STORAGE_KEY = 'theme_mode';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: false,
  colors: lightColors,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v);
      setLoaded(true);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m);
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
