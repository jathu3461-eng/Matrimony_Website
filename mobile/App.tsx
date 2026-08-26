import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/theme';
import { RootNavigator } from '@/navigation/RootNavigator';
import { SocketProvider } from '@/context/SocketContext';
import { ToastProvider } from '@/components/MessageToast';
import { setupNotificationListeners } from '@/services/pushNotifications';
import { store } from '@/store';
import { StyleSheet, Text, View } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.title}>Something went wrong</Text>
          <Text style={ebStyles.msg}>{this.state.error.message}</Text>
          <Text style={ebStyles.stack}>{this.state.error.stack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#dc2626' },
  msg: { fontSize: 14, marginBottom: 12, color: '#1c1917' },
  stack: { fontSize: 10, color: '#57534e', lineHeight: 16 },
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

function NotificationHandler() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      undefined,
      (response) => {
        const data = response.notification.request.content.data;
        if (!data?.type || !navigationRef.current) return;

        if (data.type === 'interest_received' || data.type === 'interest_accepted') {
          navigationRef.current.navigate('Main', { screen: 'Interests' } as any);
        } else if (data.type === 'message') {
          navigationRef.current.navigate('Main', { screen: 'Chat' } as any);
        }
      },
    );
    return cleanup;
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SocketProvider>
                <ToastProvider>
                  <NavigationContainer>
                    <NotificationHandler />
                    <ThemedApp />
                  </NavigationContainer>
                </ToastProvider>
              </SocketProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
