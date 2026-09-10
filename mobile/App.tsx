import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme';
import { I18nProvider } from '@/i18n';
import { ProfileProvider } from '@/context/ProfileContext';
import { ChatProvider } from '@/context/ChatContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { store } from '@/store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansTamil: require('./assets/fonts/NotoSansTamil-Regular.ttf'),
    'NotoSansTamil-Bold': require('./assets/fonts/NotoSansTamil-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ProfileProvider>
              <ChatProvider>
                <ThemeProvider>
                  <NavigationContainer>
                    <ThemedApp />
                  </NavigationContainer>
                </ThemeProvider>
              </ChatProvider>
            </ProfileProvider>
          </I18nProvider>
        </QueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
