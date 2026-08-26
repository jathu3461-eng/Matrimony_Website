import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ProfileCard } from '@/components/ProfileCard';
import { Spinner } from '@/components/Spinner';
import { profileApi } from '@/api/profiles';
import { interestApi } from '@/api/interests';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import type { Profile } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TABS = [
  { id: 'profiles', icon: 'people' as const, label: 'My Profiles' },
  { id: 'interests', icon: 'heart' as const, label: 'Interests' },
  { id: 'shortlists', icon: 'star' as const, label: 'Shortlist' },
  { id: 'messages', icon: 'chatbubbles' as const, label: 'Messages' },
  { id: 'brokers', icon: 'business' as const, label: 'Brokers' },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('profiles');
  const [refreshing, setRefreshing] = useState(false);

  const profiles = useQuery({
    queryKey: ['profiles', 'mine'],
    queryFn: () => profileApi.mine(),
  });

  const interactions = useQuery({
    queryKey: ['interactions'],
    queryFn: () => interestApi.myInteractions(),
  });

  const pendingCount =
    interactions.data?.received.filter((i) => i.status === 'pending').length ?? 0;

  const acceptMutation = useMutation({
    mutationFn: (interestId: number) => interestApi.respond(interestId, 'accepted'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interactions'] }),
  });
  const declineMutation = useMutation({
    mutationFn: (interestId: number) => interestApi.respond(interestId, 'rejected'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interactions'] }),
  });
  const removeShortlistMutation = useMutation({
    mutationFn: (profileId: number) => interestApi.toggleShortlist(profileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interactions'] }),
  });

  useFocusEffect(
    useCallback(() => {
      profiles.refetch();
      interactions.refetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([profiles.refetch(), interactions.refetch()]);
    setRefreshing(false);
  };

  const deleteProfile = (id: number) => {
    Alert.alert('Delete Profile', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await profileApi.remove(id);
          profiles.refetch();
        },
      },
    ]);
  };

  const threadsQuery = useQuery({
    queryKey: ['chat', 'threads'],
    queryFn: () => import('@/api/chat').then((m) => m.chatApi.threads()),
  });

  const statCards = [
    { key: 'profiles', icon: 'people' as const, label: 'Profiles', value: profiles.data?.length ?? 0, tab: 'profiles' },
    { key: 'interests', icon: 'heart' as const, label: 'Interests', value: interactions.data?.received.length ?? 0, tab: 'interests', badge: pendingCount > 0 ? `${pendingCount} pending` : undefined },
    { key: 'shortlists', icon: 'star' as const, label: 'Shortlisted', value: interactions.data?.shortlists.length ?? 0, tab: 'shortlists' },
    { key: 'messages', icon: 'chatbubbles' as const, label: 'Messages', value: 0, tab: 'messages' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profiles': return renderProfilesTab();
      case 'interests': return renderInterestsTab();
      case 'shortlists': return renderShortlistsTab();
      case 'messages': return renderMessagesTab();
      case 'brokers': return renderBrokersTab();
      default: return null;
    }
  };

  const renderProfilesTab = () => {
    if (profiles.isLoading) return <Spinner />;
    if (!profiles.data || profiles.data.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>💑</Text>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No profiles yet</Text>
          <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Create your first profile to start finding matches</Text>
          <Button title="Create Profile" size="sm" onPress={() => navigation.navigate('CreateProfile')} />
        </View>
      );
    }
    return (
      <View style={styles.profileGrid}>
        {profiles.data.map((p) => (
          <View key={`profile-${p.id}`} style={styles.profileItem}>
            <ProfileCard profile={p} onPress={() => navigation.navigate('ProfileDetail', { profileId: p.id })} />
            <View style={styles.profileActions}>
              <Button title="Edit" variant="outline" size="sm" leftIcon="pencil" onPress={() => navigation.navigate('CreateProfile')} />
              <Button title="Delete" variant="ghost" size="sm" leftIcon="trash" onPress={() => deleteProfile(p.id)} titleStyle={{ color: colors.error }} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderInterestsTab = () => {
    const received = interactions.data?.received ?? [];
    const sent = interactions.data?.sent ?? [];
    return (
      <View style={styles.interestsContainer}>
        <View style={styles.interestSection}>
          <View style={styles.sectionRow}>
            <Ionicons name="heart" size={18} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.ink }]}>Interests Received</Text>
            {received.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{received.length}</Text>
              </View>
            )}
          </View>
          {received.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>No interests yet</Text>
              <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Interest requests will appear here</Text>
            </View>
          ) : (
            received.map((i) => (
              <View key={`received-${i.id}`} style={[styles.interestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.interestHeader}>
                  <View style={[styles.avatarSm, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{i.sender_name?.[0] ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interestName, { color: colors.ink }]}>{i.sender_name}</Text>
                    <Text style={[styles.interestMeta, { color: colors.inkFaint }]}>For: {i.receiver_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: i.status === 'accepted' ? colors.successSoft : i.status === 'pending' ? '#fef3c7' : colors.errorSoft }]}>
                    <Text style={[styles.statusText, { color: i.status === 'accepted' ? colors.success : i.status === 'pending' ? '#d97706' : colors.error }]}>
                      {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                    </Text>
                  </View>
                </View>
                {i.message && (
                  <View style={[styles.messageBox, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.messageText, { color: colors.inkSoft }]}>"{i.message}"</Text>
                  </View>
                )}
                {i.status === 'pending' && (
                  <View style={styles.interestActions}>
                    <Button title="Accept" variant="primary" size="sm" leftIcon="checkmark" onPress={() => acceptMutation.mutate(i.id)} loading={acceptMutation.isPending} />
                    <Button title="Decline" variant="secondary" size="sm" leftIcon="close" onPress={() => declineMutation.mutate(i.id)} loading={declineMutation.isPending} />
                  </View>
                )}
                {i.status === 'accepted' && (
                  <Button title="Send Message" variant="outline" size="sm" leftIcon="chatbubbles" onPress={() => {}} />
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.interestSection}>
          <View style={styles.sectionRow}>
            <Ionicons name="paper-plane" size={18} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.ink }]}>Interests Sent</Text>
            {sent.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{sent.length}</Text>
              </View>
            )}
          </View>
          {sent.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>📫</Text>
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>No interests sent yet</Text>
            </View>
          ) : (
            sent.map((i) => (
              <View key={`sent-${i.id}`} style={[styles.sentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sentTo, { color: colors.ink }]}>To: {i.receiver_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: i.status === 'accepted' ? colors.successSoft : i.status === 'pending' ? '#fef3c7' : colors.errorSoft }]}>
                  <Text style={[styles.statusText, { color: i.status === 'accepted' ? colors.success : i.status === 'pending' ? '#d97706' : colors.error }]}>
                    {i.status === 'accepted' ? 'Accepted' : i.status === 'pending' ? 'Pending' : 'Declined'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderShortlistsTab = () => {
    const shortlists = interactions.data?.shortlists ?? [];
    if (shortlists.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>No shortlists yet</Text>
          <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Browse matches and star the ones you like</Text>
          <Button title="Browse Matches" size="sm" onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })} />
        </View>
      );
    }
    return (
      <View style={styles.profileGrid}>
        {shortlists.map((s) => (
          <View key={`shortlist-${s.profile_id}`} style={styles.profileItem}>
            <ProfileCard profile={{ id: s.profile_id, name: s.profile_name, main_profile_picture: s.profile_pic, age: s.age, occupation: s.occupation, city_or_state: s.city_or_state, height_feet: s.height_feet, height_inches: s.height_inches } as Profile} onPress={() => navigation.navigate('ProfileDetail', { profileId: s.profile_id })} />
            <Button title="Remove" variant="secondary" size="sm" leftIcon="close" onPress={() => removeShortlistMutation.mutate(s.profile_id)} />
          </View>
        ))}
      </View>
    );
  };

  const renderMessagesTab = () => {
    const threadData = threadsQuery.data ?? [];
    if (threadData.length === 0) {
      return (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={[styles.emptyTitle, { color: colors.ink }]}>Your Messages</Text>
          <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Chat with profiles that have accepted your interest</Text>
        </View>
      );
    }
    return (
      <View style={styles.profileGrid}>
        {threadData.slice(0, 5).map((t) => {
          const otherName = t.sender_name;
          return (
            <Pressable
              key={t.thread_id}
              style={[styles.threadRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => (navigation as any).navigate('ChatThread', { profileA: t.sender_profile_id, profileB: t.receiver_profile_id, otherName: t.receiver_name })}
            >
              <View style={[styles.threadAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.threadAvatarText, { color: colors.white }]}>{otherName?.[0] ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.threadName, { color: colors.ink }]} numberOfLines={1}>{otherName}</Text>
                <Text style={[styles.threadMsg, { color: colors.inkFaint }]} numberOfLines={1}>{t.last_message || 'Start chatting'}</Text>
              </View>
              {t.unread_count > 0 && (
                <View style={[styles.threadBadge, { backgroundColor: '#25D366' }]}>
                  <Text style={styles.threadBadgeText}>{t.unread_count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderBrokersTab = () => (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.emptyEmoji}>💼</Text>
      <Text style={[styles.emptyTitle, { color: colors.ink }]}>No brokers yet</Text>
      <Text style={[styles.emptyHint, { color: colors.inkFaint }]}>Connect with professional brokers for personalized matchmaking</Text>
      <Button title="Browse Matches" size="sm" onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })} />
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>My Dashboard</Text>
            </View>
            <Text style={styles.heroGreeting}>Welcome back, {user?.username ?? 'friend'}!</Text>
            <Text style={styles.heroSub}>Continue your journey to find your perfect life partner</Text>
            <View style={styles.heroButtons}>
              <Pressable style={styles.heroBtn} onPress={() => navigation.navigate('CreateProfile')}>
                <Ionicons name={profiles.data && profiles.data.length > 0 ? 'pencil' : 'add'} size={16} color={colors.primary} />
                <Text style={[styles.heroBtnText, { color: colors.primary }]}>{profiles.data && profiles.data.length > 0 ? 'Edit Profile' : 'Create Profile'}</Text>
              </Pressable>
              <Pressable style={styles.heroBtn} onPress={() => (navigation as any).navigate('Main', { screen: 'Search' })}>
                <Ionicons name="search" size={16} color={colors.primary} />
                <Text style={[styles.heroBtnText, { color: colors.primary }]}>Browse Matches</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <Pressable key={s.key} onPress={() => setActiveTab(s.tab)} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.primary }]}>
                <Ionicons name={s.icon} size={18} color={colors.white} />
              </View>
              <Text style={[styles.statValue, { color: colors.ink }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.inkFaint }]}>{s.label}</Text>
              {s.badge && (
                <View style={[styles.statBadge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.statBadgeText, { color: '#d97706' }]}>{s.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tab, { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border }]}>
                <Ionicons name={t.icon} size={14} color={isActive ? colors.white : colors.inkFaint} />
                <Text style={[styles.tabLabel, { color: isActive ? colors.white : colors.inkFaint }]}>{t.label}</Text>
                {t.id === 'interests' && pendingCount > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.tabContent}>{renderTabContent()}</View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  hero: { marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 20, overflow: 'hidden', padding: spacing.lg },
  heroDecor1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroDecor2: { position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroContent: { zIndex: 1 },
  heroPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm },
  heroPillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroGreeting: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  heroButtons: { flexDirection: 'row', gap: spacing.sm },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  heroBtnText: { fontSize: 13, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.md },
  statCard: { width: '47%', flexGrow: 1, borderRadius: 14, padding: spacing.md, alignItems: 'center', borderWidth: 1, gap: spacing.xs },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { ...typography.label },
  statBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statBadgeText: { fontSize: 10, fontWeight: '700' },
  tabBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  tabLabel: { ...typography.label, fontWeight: '700' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabContent: { paddingHorizontal: spacing.md },
  profileGrid: { gap: spacing.md },
  profileItem: { gap: spacing.sm },
  profileActions: { flexDirection: 'row', gap: spacing.sm },
  interestsContainer: { gap: spacing.lg },
  interestSection: { gap: spacing.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  sectionLabel: { ...typography.body, fontWeight: '700', flex: 1 },
  countBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, fontWeight: '700' },
  interestCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  interestHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarSm: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  interestName: { ...typography.body, fontWeight: '700' },
  interestMeta: { ...typography.caption },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  messageBox: { borderRadius: radius.sm, padding: spacing.sm },
  messageText: { ...typography.caption, fontStyle: 'italic' },
  interestActions: { flexDirection: 'row', gap: spacing.sm },
  sentCard: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sentTo: { ...typography.body, fontWeight: '600', flex: 1 },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.title, fontSize: 16 },
  emptyHint: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
  threadRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  threadAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  threadAvatarText: { fontSize: 18, fontWeight: '700' },
  threadName: { ...typography.body, fontWeight: '700' },
  threadMsg: { ...typography.caption, marginTop: 2 },
  threadBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  threadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
