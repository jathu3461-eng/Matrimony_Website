import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { brokerApi, type BrokerRequest } from '@/api/brokers';
import { extractError } from '@/api/client';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import { radius, spacing, typography } from '@/theme';
import { useI18n } from '@/i18n';

type Segment = string;

function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(iso).toLocaleDateString();
}

export function BrokerHubScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role ?? 'regular';
  const { colors } = useTheme();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const brokerSegments = [t('brokerRequests'), t('brokerClients')];
  const memberSegments = [t('brokerBrowse'), t('brokerMyRequests')];
  const segments = role === 'broker' ? brokerSegments : memberSegments;
  const [segment, setSegment] = useState<Segment>(segments[0]);
  const [refreshing, setRefreshing] = useState(false);

  const brokers = useQuery({
    queryKey: ['brokers'],
    queryFn: brokerApi.list,
  });

  const myRequests = useQuery({
    queryKey: ['broker', 'my-requests'],
    queryFn: brokerApi.myRequests,
  });

  const received = useQuery({
    queryKey: ['broker', 'requests'],
    queryFn: brokerApi.receivedRequests,
  });

  const clients = useQuery({
    queryKey: ['broker', 'clients'],
    queryFn: brokerApi.myClients,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      brokers.refetch(),
      myRequests.refetch(),
      received.refetch(),
      clients.refetch(),
    ]);
    setRefreshing(false);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['brokers'] });
    queryClient.invalidateQueries({ queryKey: ['broker'] });
  };

  const onRespond = async (id: number, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') await brokerApi.accept(id);
      else await brokerApi.reject(id);
      invalidateAll();
    } catch (err) {
      Alert.alert(t('error'), extractError(err, 'Could not update request.'));
    }
  };

  const renderRow = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View
      key={index}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.rowHeader}>
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.rowDetails}>
          <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={1}>
            {item.business_name || item.broker_business_name || item.user_username || item.broker_username || item.username}
          </Text>
          <Text style={[styles.rowSub, { color: colors.inkSoft }]} numberOfLines={1}>
            {item.user_email || item.broker_username || item.username}
          </Text>
        </View>
      </View>

      {item.status && (
        <StatusPill status={item.status} />
      )}

      {item.message ? (
        <Text style={[styles.rowDesc, { color: colors.inkSoft }]} numberOfLines={2}>
          {item.message}
        </Text>
      ) : null}

      {item.created_at && (
        <Text style={[styles.rowMeta, { color: colors.inkFaint }]}>{timeAgo(item.created_at)}</Text>
      )}

      {item.client_count !== undefined && role !== 'broker' && (
        <Text style={[styles.rowMeta, { color: colors.inkFaint }]}>
          {item.client_count > 0 ? `${item.client_count} ${t('brokerClients')}` : ''}
        </Text>
      )}

      {item.status === 'pending' && role === 'broker' && (
        <View style={styles.rowActions}>
          <Button
            title={t('brokerAccept')}
            variant="primary"
            size="sm"
            onPress={() => onRespond(item.id, 'accept')}
          />
          <Button
            title={t('brokerReject')}
            variant="danger"
            size="sm"
            onPress={() => onRespond(item.id, 'reject')}
          />
        </View>
      )}

      {item.client_count !== undefined && role !== 'broker' && !item.my_request_status && (
        <RequestAction
          brokerId={item.id}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ['brokers'] });
            queryClient.invalidateQueries({ queryKey: ['broker', 'my-requests'] });
          }}
        />
      )}
    </View>
  );

  let data: any[] = [];
  let emptyLabel = '';
  if (role === 'broker') {
    data = segment === segments[0] ? (received.data ?? []) : (clients.data ?? []);
    emptyLabel = segment === segments[0] ? t('brokerRequestsEmpty') : t('brokerClientsEmpty');
  } else {
    data = segment === segments[0] ? (brokers.data ?? []) : (myRequests.data ?? []);
    emptyLabel = segment === segments[0] ? t('brokerNoBrokers') : t('brokerRequestsEmpty');
  }
  const loading =
    role === 'broker'
      ? segment === segments[0]
        ? received.isLoading
        : clients.isLoading
      : segment === segments[0]
        ? brokers.isLoading
        : myRequests.isLoading;

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item, i) => `${item.id ?? item.user_id ?? i}`}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.segmented}>
              {segments.map((seg) => (
                <Pressable
                  key={seg}
                  onPress={() => setSegment(seg)}
                  style={[
                    styles.segBtn,
                    { backgroundColor: segment === seg ? colors.primary : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.segText,
                      { color: segment === seg ? colors.white : colors.inkSoft },
                    ]}
                  >
                    {seg}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={[styles.empty, { color: colors.inkFaint }]}>{t('loading')}</Text>
          ) : (
            <Text style={[styles.empty, { color: colors.inkFaint }]}>{emptyLabel}</Text>
          )
        }
      />
    </Screen>
  );
}

function RequestAction({ brokerId, onDone }: { brokerId: number; onDone: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await brokerApi.sendRequest(brokerId, message.trim() || undefined);
      setMessage('');
      setOpen(false);
      onDone();
    } catch (err) {
      Alert.alert(t('error'), extractError(err, 'Could not send request.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.requestBox}>
      {open && (
        <TextInput
          style={[
            styles.requestInput,
            { borderColor: colors.border, color: colors.ink, backgroundColor: colors.surface },
          ]}
          placeholder={t('brokerMessagePlaceholder')}
          placeholderTextColor={colors.inkFaint}
          value={message}
          onChangeText={setMessage}
          maxLength={500}
          multiline
        />
      )}
      <Button
        title={open ? t('brokerSendRequest') : t('brokerConnectRequest')}
        variant={open ? 'primary' : 'outline'}
        size="sm"
        leftIcon="link-outline"
        loading={sending}
        onPress={open ? send : () => setOpen(true)}
        style={styles.requestBtn}
      />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const active =
    status === 'pending'
      ? colors.warning
      : status === 'accepted'
        ? colors.success
        : colors.error;
  const label =
    status === 'pending'
      ? t('brokerRequestPending')
      : status === 'accepted'
        ? t('brokerRequestAccepted')
        : t('brokerRequestRejected');
  return (
    <View style={[styles.pill, { backgroundColor: active }]}>
      <Text style={[styles.pillText, { color: colors.white }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  segText: {
    ...typography.label,
    fontWeight: '700',
  },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDetails: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body,
    fontWeight: '700',
  },
  rowSub: {
    ...typography.caption,
    marginTop: 2,
  },
  rowDesc: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  rowMeta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  requestBox: {
    marginTop: spacing.md,
  },
  requestInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.body.fontSize,
    minHeight: 40,
    marginBottom: spacing.sm,
  },
  requestBtn: {
    alignSelf: 'flex-start',
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});