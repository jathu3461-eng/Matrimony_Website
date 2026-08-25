import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SocketProvider } from '@/context/SocketContext';
import { store } from '@/store';

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
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SocketProvider>
              <NavigationContainer>
                <ThemedApp />
              </NavigationContainer>
            </SocketProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
