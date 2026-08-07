import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { VerifyOTPScreen } from '@/screens/auth/VerifyOTPScreen';
import { useTheme } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} options={{ title: 'Verify Email' }} />
    </Stack.Navigator>
  );
}
