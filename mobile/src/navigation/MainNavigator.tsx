import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { SearchScreen } from '@/screens/main/SearchScreen';
import { InterestsScreen } from '@/screens/main/InterestsScreen';
import { ChatListScreen } from '@/screens/main/ChatListScreen';
import { ProfileScreen } from '@/screens/main/ProfileScreen';
import { useUnreadBadge } from '@/hooks/useUnreadBadge';
import { NotificationsScreen } from '@/screens/main/NotificationsScreen';
import type { MainTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Search: 'search-outline',
  Interests: 'heart-outline',
  Chat: 'chatbubble-ellipses-outline',
  Profile: 'person-outline',
  Notifications: 'notifications-outline',
};

const ICONS_ACTIVE: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Search: 'search',
  Interests: 'heart',
  Chat: 'chatbubble-ellipses',
  Profile: 'person',
  Notifications: 'notifications',
};

export function MainNavigator() {
  const unread = useUnreadBadge();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? ICONS_ACTIVE[route.name] : ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('appName') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('navSearch') }} />
      <Tab.Screen name="Interests" component={InterestsScreen} options={{ title: t('navInterests') }} />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          title: t('navChat'),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('navNotifications') }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('navProfile') }} />
    </Tab.Navigator>
  );
}
