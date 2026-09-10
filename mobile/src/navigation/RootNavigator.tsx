import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthNavigator } from '@/navigation/AuthNavigator';
import { MainNavigator } from '@/navigation/MainNavigator';
import { ProfileDetailScreen } from '@/screens/ProfileDetailScreen';
import { ChatThreadScreen } from '@/screens/ChatThreadScreen';
import { ProfileWizardScreen } from '@/screens/ProfileWizardScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { BrokerHubScreen } from '@/screens/BrokerHubScreen';
import { profileApi } from '@/api/profiles';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  useBootstrap();
  const status = useAppSelector((s) => s.auth.status);
  const { colors } = useTheme();

  // First-run gating: a signed-in user with no profiles must complete the
  // wizard before using the app. Query is enabled only when authenticated.
  const profiles = useQuery({
    queryKey: ['my-profiles'],
    queryFn: () => profileApi.mine(),
    enabled: status === 'authenticated',
  });

  if (status === 'idle') {
    return <SplashScreen />;
  }

  if (status === 'authenticated' && profiles.isLoading) {
    return <SplashScreen />;
  }

  const needsProfile =
    status === 'authenticated' && profiles.isSuccess && (profiles.data?.length ?? 0) === 0;
  const initialRoute: keyof RootStackParamList =
    status === 'authenticated' ? (needsProfile ? 'ProfileWizard' : 'Main') : 'Onboarding';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {status === 'authenticated' ? (
        <>
          <Stack.Screen
            name="ProfileWizard"
            component={ProfileWizardScreen}
            initialParams={{ mode: 'onboarding' }}
            options={{ headerShown: true, title: 'Complete Profile' }}
          />
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
            component={ProfileWizardScreen}
            options={{ headerShown: true, title: 'Create Profile' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Settings' }}
          />
          <Stack.Screen
            name="BrokerHub"
            component={BrokerHubScreen}
            options={{ headerShown: true, title: 'Broker Hub' }}
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
