import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          paddingTop: insets.top,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.ink,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? ICONS_ACTIVE[route.name] : ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Mukurtham' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Interests" component={InterestsScreen} options={{ title: 'Interests' }} />
      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{
          title: 'Chat',
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
