import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainNavigator } from '@/navigation/MainNavigator';
import { ProfileDetailScreen } from '@/screens/ProfileDetailScreen';
import { ChatThreadScreen } from '@/screens/ChatThreadScreen';
import { CreateProfileScreen } from '@/screens/CreateProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  useBootstrap();
  const status = useAppSelector((s) => s.auth.status);
  const { colors } = useTheme();

  if (status === 'idle') {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {status === 'authenticated' ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{ headerShown: true, title: 'Profile' }}
          />
          <Stack.Screen
            name="ChatThread"
            component={ChatThreadScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateProfile"
            component={CreateProfileScreen}
            options={{ headerShown: true, title: 'Create Profile' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Settings' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}
