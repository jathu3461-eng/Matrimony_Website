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
  surfaceSoft: string;
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

// Mirrors the website's design tokens (matrimony-app/frontend/src/index.css).
const lightColors: ThemeColors = {
  primary: '#e0136a',
  primaryDark: '#c00f5c',
  primarySoft: '#ffe4ef',
  secondary: '#78350f',
  background: '#fff5f9',
  surface: '#ffffff',
  surfaceSoft: '#fff5f9',
  ink: '#2d1226',
  inkSoft: '#5c4353',
  inkFaint: '#8a7480',
  border: '#f3dbe7',
  borderStrong: '#e9c2d6',
  success: '#0f9d58',
  successSoft: '#e6f6ec',
  error: '#e63946',
  errorSoft: '#fdecee',
  warning: '#d97706',
  white: '#ffffff',
  black: '#000000',
};

const darkColors: ThemeColors = {
  primary: '#ff5f9e',
  primaryDark: '#ff7ab3',
  primarySoft: '#3a2231',
  secondary: '#fbbf24',
  background: '#241420',
  surface: '#1c0f18',
  surfaceSoft: '#241420',
  ink: '#ffe9f4',
  inkSoft: '#d9b9c9',
  inkFaint: '#a28395',
  border: '#3a2231',
  borderStrong: '#4a2c3f',
  success: '#34d399',
  successSoft: '#12352a',
  error: '#ff6b7a',
  errorSoft: '#3a1c22',
  warning: '#fbbf24',
  white: '#ffffff',
  black: '#000000',
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
