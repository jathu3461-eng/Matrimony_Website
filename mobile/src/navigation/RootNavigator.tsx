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
import { tokenStorage } from '@/services/tokenStorage';
import { useAppSelector } from '@/store/hooks';
import { colors } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { loading } = useBootstrap();
  const status = useAppSelector((s) => s.auth.status);
  const [onboarded, setOnboarded] = useState(false);
  const [checkingOnboard, setCheckingOnboard] = useState(true);

  useEffect(() => {
    tokenStorage.isOnboardingDone().then((done) => {
      setOnboarded(done);
      setCheckingOnboard(false);
    });
  }, []);

  if (loading || checkingOnboard || status === 'idle') {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
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
            options={({ route }) => ({ headerShown: true, title: route.params.otherName })}
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
          {!onboarded && (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'fade' }}
            />
          )}
          <Stack.Screen name="Auth" component={AuthNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}
