import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Interests: undefined;
  Chat: undefined;
  Profile: undefined;
  Notifications: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProfileDetail: { profileId: number | string };
  ChatThread: { profileA: number | string; profileB: number | string; otherName: string };
  CreateProfile: undefined;
  Settings: undefined;
};
