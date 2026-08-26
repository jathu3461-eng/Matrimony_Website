import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { useTheme } from '@/theme';
import type { AuthStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StackNavigationOptions } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthHeader({
  title,
  canGoBack,
  onBack,
  colors,
}: {
  title: string;
  canGoBack: boolean;
  onBack?: () => void;
  colors: any;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.container, { paddingTop: insets.top + 8 }]}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={headerStyles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
      ) : (
        <View style={headerStyles.backBtn} />
      )}
      <Text style={[headerStyles.title, { color: colors.ink }]}>{title}</Text>
      <View style={headerStyles.backBtn} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export function AuthNavigator() {
  const { colors } = useTheme();

  const makeHeader = (title: string): StackNavigationOptions => ({
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
  });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ navigation }) => ({
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        })}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}
