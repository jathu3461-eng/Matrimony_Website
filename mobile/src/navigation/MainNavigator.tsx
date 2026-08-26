import { View, Text, StyleSheet } from 'react-native';
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

function BadgeIcon({
  focused,
  icon,
  activeIcon,
  color,
  size,
  badge,
  badgeColor,
}: {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badge: number;
  badgeColor: string;
}) {
  return (
    <View style={iconStyles.container}>
      <Ionicons name={focused ? activeIcon : icon} size={size} color={color} />
      {badge > 0 && (
        <View style={[iconStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={iconStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});

export function MainNavigator() {
  const { chatCount, notifCount } = useUnreadBadge();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerStatusBarHeight: insets.top,
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
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Chat') {
            return (
              <BadgeIcon
                focused={focused}
                icon={ICONS.Chat}
                activeIcon={ICONS_ACTIVE.Chat}
                color={color}
                size={size}
                badge={chatCount}
                badgeColor="#25D366"
              />
            );
          }
          if (route.name === 'Notifications') {
            return (
              <BadgeIcon
                focused={focused}
                icon={ICONS.Notifications}
                activeIcon={ICONS_ACTIVE.Notifications}
                color={color}
                size={size}
                badge={notifCount}
                badgeColor="#dc2626"
              />
            );
          }
          return (
            <Ionicons
              name={focused ? ICONS_ACTIVE[route.name] : ICONS[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Mukurtham' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Interests" component={InterestsScreen} options={{ title: 'Interests' }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
